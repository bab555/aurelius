/**
 * Service Worker 管理器
 * 用于与SW中间层通信，维护会话连续性
 */

// 检查浏览器是否支持Service Worker
const isSWSupported = 'serviceWorker' in navigator;

// 注册状态
let isRegistered = false;
let registration = null;

// 会话监听器集合
const sessionListeners = new Map();

// 用户会话管理 - 用来检测多开
const userSessions = new Map();

/**
 * 初始化Service Worker
 * @returns {Promise<boolean>} 是否注册成功
 */
export const initServiceWorker = async () => {
  if (!isSWSupported) {
    console.warn('当前浏览器不支持Service Worker, 无法启用中间层');
    return false;
  }
  
  try {
    // 注册Service Worker
    registration = await navigator.serviceWorker.register('/sw.js');
    
    console.log('Service Worker注册成功:', registration.scope);
    
    // 等待Service Worker激活
    if (registration.installing || registration.waiting) {
      console.log('Service Worker正在安装或等待激活，等待激活完成...');
      
      // 等待激活完成
      await new Promise(resolve => {
        const worker = registration.installing || registration.waiting;
        
        if (worker) {
          worker.addEventListener('statechange', event => {
            if (event.target.state === 'activated') {
              console.log('Service Worker已激活');
              resolve();
            }
          });
        } else {
          // 如果没有installing或waiting状态，说明已经激活
          resolve();
        }
      });
    }
    
    // 验证Service Worker是否已控制当前页面
    if (!navigator.serviceWorker.controller) {
      console.log('等待Service Worker控制页面...');
      
      await new Promise(resolve => {
        // 如果已经有了controller，直接解决
        if (navigator.serviceWorker.controller) {
          resolve();
          return;
        }
        
        // 否则等待控制权变更
        const controllerChangeHandler = () => {
          console.log('Service Worker已获得页面控制权');
          resolve();
        };
        
        navigator.serviceWorker.addEventListener('controllerchange', controllerChangeHandler, { once: true });
        
        // 设置超时以防止无限等待
        setTimeout(() => {
          navigator.serviceWorker.removeEventListener('controllerchange', controllerChangeHandler);
          console.warn('等待Service Worker控制页面超时，继续执行');
          resolve();
        }, 3000);
      });
    }
    
    isRegistered = true;
    
    // 设置消息监听
    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    
    console.log('Service Worker初始化完成，中间层已启用');
    return true;
  } catch (error) {
    console.error('Service Worker注册失败:', error);
    return false;
  }
};

/**
 * 注册会话到中间层
 * @param {string} sessionId - 会话ID
 * @param {object} sessionData - 会话数据
 */
export const registerSession = (sessionId, sessionData) => {
  if (!isRegistered || !sessionId) return false;
  
  // 检查Service Worker是否已经激活
  if (!navigator.serviceWorker.controller) {
    console.warn('[SW Manager] Service Worker不可用，无法注册会话');
    return false;
  }
  
  // 获取用户ID，用于多开检测
  const userId = sessionData?.userId || 'anonymous';

  // 检查是否已存在该用户的会话
  if (userSessions.has(userId)) {
    const existingSessionId = userSessions.get(userId);
    if (existingSessionId !== sessionId) {
      console.warn(`[SW Manager] 用户${userId}已有活跃会话 ${existingSessionId}，关闭旧会话并使用新会话 ${sessionId}`);
      // 清理旧会话
      clearSession(existingSessionId);
      // 广播会话被替换的通知
      setTimeout(() => {
        try {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SESSION_REPLACED',
              oldSessionId: existingSessionId,
              newSessionId: sessionId
            });
          }
        } catch (error) {
          console.error('[SW Manager] 发送会话替换通知失败:', error);
        }
      }, 100);
    }
  }
  
  // 记录用户会话
  userSessions.set(userId, sessionId);
  
  try {
    // 安全地克隆数据，过滤掉无法克隆的属性
    const safeData = safeCloneForPostMessage(sessionData);
    
    // 确保Service Worker已激活
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'REGISTER_SESSION',
        sessionId,
        data: safeData
      });
      
      return true;
    } else {
      console.warn('[SW Manager] Service Worker未激活，无法注册会话');
      return false;
    }
  } catch (error) {
    console.error('[SW Manager] 注册会话失败，可能包含无法克隆的数据:', error);
    return false;
  }
};

// 安全地深度克隆对象，过滤掉无法克隆的内容
const safeCloneForPostMessage = (obj) => {
  if (!obj) return obj;
  
  // 简单类型直接返回
  if (typeof obj !== 'object' || obj === null) return obj;
  
  try {
    // 尝试JSON转换测试是否可克隆
    const jsonStr = JSON.stringify(obj);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn('[SW Manager] 对象无法通过JSON克隆，尝试手动克隆');
    
    // 如果失败，进行手动安全克隆
    if (Array.isArray(obj)) {
      const safeArray = [];
      for (let i = 0; i < obj.length; i++) {
        try {
          safeArray.push(safeCloneForPostMessage(obj[i]));
        } catch (error) {
          console.warn(`[SW Manager] 数组项 [${i}] 无法克隆，已跳过`, error);
        }
      }
      return safeArray;
    } else {
      const safeObj = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          try {
            const value = obj[key];
            // 跳过函数、DOM节点、Symbol等不可克隆类型
            if (
              typeof value === 'function' || 
              (value && typeof value === 'object' && value.nodeType) ||
              typeof value === 'symbol' ||
              value instanceof Error ||
              value instanceof Promise ||
              value instanceof WeakMap ||
              value instanceof WeakSet ||
              value instanceof Map ||
              value instanceof Set
            ) {
              console.warn(`[SW Manager] 属性 ${key} 是不可克隆类型，已跳过`);
              continue;
            }
            safeObj[key] = safeCloneForPostMessage(value);
          } catch (error) {
            console.warn(`[SW Manager] 属性 ${key} 无法克隆，已跳过`, error);
          }
        }
      }
      return safeObj;
    }
  }
};

/**
 * 更新会话状态
 * @param {string} sessionId - 会话ID
 * @param {object} updateData - 更新数据
 */
export const updateSession = (sessionId, updateData) => {
  if (!isRegistered || !sessionId) return false;
  
  // 检查Service Worker是否已经激活
  if (!navigator.serviceWorker.controller) {
    console.warn('[SW Manager] Service Worker不可用，无法更新会话');
    return false;
  }
  
  try {
    // 安全地克隆数据，过滤掉无法克隆的属性
    const safeData = safeCloneForPostMessage(updateData);
    
    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_SESSION',
      sessionId,
      data: safeData
    });
    
    return true;
  } catch (error) {
    console.error('[SW Manager] 更新会话失败:', error);
    return false;
  }
};

/**
 * 获取会话信息
 * @param {string} sessionId - 会话ID
 * @returns {Promise<object>} 会话信息
 */
export const getSession = async (sessionId) => {
  if (!isRegistered || !sessionId) return null;
  
  // 检查Service Worker是否已经激活
  if (!navigator.serviceWorker.controller) {
    console.warn('[SW Manager] Service Worker不可用，无法获取会话');
    return null;
  }
  
  try {
    // 创建一个MessageChannel用于接收响应
    const { port1, port2 } = new MessageChannel();
    
    // 添加超时处理
    const timeout = 3000; // 3秒超时
    
    const responsePromise = new Promise((resolve, reject) => {
      // 设置超时
      const timeoutId = setTimeout(() => {
        port1.onmessage = null;
        reject(new Error('获取会话响应超时'));
      }, timeout);
      
      // 设置消息处理
      port1.onmessage = event => {
        clearTimeout(timeoutId);
        resolve(event.data);
      };
      
      // 监听错误
      port1.onmessageerror = error => {
        clearTimeout(timeoutId);
        reject(new Error('消息端口错误: ' + error));
      };
    });
    
    // 发送请求
    navigator.serviceWorker.controller.postMessage({
      type: 'GET_SESSION',
      sessionId
    }, [port2]);
    
    // 等待并返回响应，处理可能的错误
    try {
      const response = await responsePromise;
      return response.session;
    } catch (error) {
      console.warn('[SW Manager] 获取会话失败:', error.message);
      return null;
    }
  } catch (error) {
    console.error('[SW Manager] 获取会话时发生错误:', error);
    return null;
  }
};

/**
 * 标记会话已完成
 * @param {string} sessionId - 会话ID
 */
export const completeSession = (sessionId) => {
  if (!isRegistered || !sessionId) return false;
  
  // 检查Service Worker是否已经激活
  if (!navigator.serviceWorker.controller) {
    console.warn('[SW Manager] Service Worker不可用，无法标记会话完成');
    return false;
  }
  
  try {
    console.log('标记会话已完成但保留状态:', sessionId);
    
    navigator.serviceWorker.controller.postMessage({
      type: 'COMPLETE_SESSION',
      sessionId
    });
    
    return true;
  } catch (error) {
    console.error('[SW Manager] 标记会话完成失败:', error);
    return false;
  }
};

/**
 * 向已完成的会话发送新消息
 * @param {string} sessionId - 会话ID
 * @returns {Promise<boolean>} 是否成功
 */
export const continueSession = async (sessionId) => {
  if (!isRegistered || !sessionId) return false;
  
  // 检查Service Worker是否已经激活
  if (!navigator.serviceWorker.controller) {
    console.warn('[SW Manager] Service Worker不可用，无法继续会话');
    return false;
  }
  
  try {
    // 检查会话是否存在
    const session = await getSession(sessionId);
    if (!session) return false;
    
    console.log('继续已完成的会话:', sessionId);
    
    // 更新会话状态为活跃
    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_SESSION',
      sessionId,
      data: {
        isComplete: false,
        lastResumed: Date.now()
      }
    });
    
    return true;
  } catch (error) {
    console.error('继续会话失败:', error);
    return false;
  }
};

/**
 * 清理会话
 * @param {string} sessionId - 会话ID
 */
export const clearSession = (sessionId) => {
  if (!isRegistered || !sessionId) return false;
  
  // 检查Service Worker是否已经激活
  if (!navigator.serviceWorker.controller) {
    console.warn('[SW Manager] Service Worker不可用，无法清理会话');
    return false;
  }
  
  try {
    // 查找并删除用户会话映射
    for (const [userId, sid] of userSessions.entries()) {
      if (sid === sessionId) {
        userSessions.delete(userId);
        console.log(`[SW Manager] 已移除用户${userId}的会话记录`);
        break;
      }
    }
    
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_SESSION',
      sessionId
    });
    
    return true;
  } catch (error) {
    console.error('[SW Manager] 清理会话失败:', error);
    return false;
  }
};

/**
 * 添加会话状态变更监听器
 * @param {string} sessionId - 会话ID
 * @param {Function} listener - 监听函数
 */
export const addSessionListener = (sessionId, listener) => {
  if (!sessionId || typeof listener !== 'function') return;
  
  if (!sessionListeners.has(sessionId)) {
    sessionListeners.set(sessionId, new Set());
  }
  
  sessionListeners.get(sessionId).add(listener);
};

/**
 * 移除会话状态变更监听器
 * @param {string} sessionId - 会话ID
 * @param {Function} listener - 监听函数
 */
export const removeSessionListener = (sessionId, listener) => {
  if (!sessionId || !sessionListeners.has(sessionId)) return;
  
  const listeners = sessionListeners.get(sessionId);
  if (listener) {
    listeners.delete(listener);
  } else {
    listeners.clear();
  }
};

/**
 * 处理从Service Worker接收的消息
 * @param {MessageEvent} event - 消息事件
 */
function handleSWMessage(event) {
  const message = event.data;
  
  if (message && message.type) {
    // 处理会话更新通知
    if (message.type === 'SESSION_UPDATE') {
      const { sessionId, action } = message;
      
      const listeners = sessionListeners.get(sessionId) || [];
      listeners.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          console.error(`[SW Manager] 处理会话监听器错误:`, error);
        }
      });
    }
    // 处理会话被其他标签页替换的情况
    else if (message.type === 'SESSION_REPLACED') {
      console.warn(`[SW Manager] 当前会话已被其他标签页替换`);
      // 触发会话替换事件
      window.dispatchEvent(new CustomEvent('session-replaced', {
        detail: {
          oldSessionId: message.oldSessionId,
          newSessionId: message.newSessionId
        }
      }));
    }
  }
} 