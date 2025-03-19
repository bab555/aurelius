// 命理助手Service Worker中间层
// 版本号，用于更新SW
const VERSION = '1.0.1';

// 缓存当前会话状态
const activeSessionsMap = new Map();

// 记录客户端流式输出状态
self.clientStreaming = false;

// 安装事件
self.addEventListener('install', event => {
  console.log('[Service Worker] 安装成功 v' + VERSION);
  
  // 如果检测到客户端正在流式输出，推迟激活
  if (self.clientStreaming) {
    console.log('[Service Worker] 检测到客户端正在流式输出，推迟激活');
    // 不调用skipWaiting()，让更新等待
  } else {
    // 立即激活，不等待
    self.skipWaiting();
  }
});

// 激活事件
self.addEventListener('activate', event => {
  console.log('[Service Worker] 已激活');
  
  // 如果检测到客户端正在流式输出，推迟接管
  if (self.clientStreaming) {
    console.log('[Service Worker] 检测到客户端正在流式输出，推迟接管');
    // 不立即接管客户端
  } else {
    // 立即接管所有客户端
    event.waitUntil(clients.claim());
  }
});

// 处理客户端消息
self.addEventListener('message', function(event) {
  const message = event.data;
  
  if (!message || !message.type) {
    return;
  }
  
  console.log('[Service Worker] 收到消息:', message.type);
  
  // 处理流式输出状态消息
  if (message.type === 'STREAMING_STATE') {
    self.clientStreaming = message.streaming;
    console.log(`[Service Worker] 客户端流式输出状态: ${self.clientStreaming ? '进行中' : '已结束'}`);
    
    // 如果流式输出结束，且处于等待接管状态，则立即接管
    if (!self.clientStreaming && self.registration.waiting) {
      console.log('[Service Worker] 流式输出已结束，执行推迟的更新');
      self.skipWaiting();
    }
    return;
  }
  
  try {
    switch (message.type) {
      case 'REGISTER_SESSION':
        registerSession(message.sessionId, message.data);
        break;
      case 'UPDATE_SESSION':
        updateSession(message.sessionId, message.data);
        break;
      case 'GET_SESSION':
        getSession(message.sessionId, event);
        break;
      case 'COMPLETE_SESSION':
        completeSession(message.sessionId);
        break;
      case 'CLEAR_SESSION':
        clearSession(message.sessionId);
        break;
      case 'SESSION_REPLACED':
        // 广播给所有客户端，某个会话被替换
        broadcastToClients({
          type: 'SESSION_REPLACED',
          oldSessionId: message.oldSessionId,
          newSessionId: message.newSessionId
        });
        break;
      // 处理beacon报告请求
      case 'beacon-report-mes':
        handleBeaconReport(message, event);
        break;
      default:
        console.warn('[Service Worker] 未知消息类型:', message.type);
    }
  } catch (error) {
    console.error('[Service Worker] 处理消息时出错:', error, message);
    
    // 如果有消息端口，尝试回复错误
    if (event.ports && event.ports[0]) {
      try {
        event.ports[0].postMessage({
          error: true,
          message: '处理消息时出错: ' + error.message
        });
      } catch (portError) {
        console.error('[Service Worker] 无法通过消息端口发送错误:', portError);
      }
    }
  }
});

// 处理beacon报告请求 - 这是一种不需要响应的单向通信
function handleBeaconReport(message, event) {
  console.log('[Service Worker] 处理beacon报告');
  
  // 如果有消息端口，发送确认
  if (event.ports && event.ports[0]) {
    try {
      event.ports[0].postMessage({ received: true });
    } catch (error) {
      console.warn('[Service Worker] 发送beacon确认失败，这可能是正常的', error);
    }
  }
}

// 注册会话
function registerSession(sessionId, sessionData) {
  if (!sessionId) return;
  
  activeSessionsMap.set(sessionId, {
    ...sessionData,
    lastUpdated: Date.now(),
    isActive: true,
    messages: sessionData.messages || []
  });
  
  console.log(`[Service Worker] 会话 ${sessionId} 已注册`);
  broadcastSessionUpdate(sessionId, 'registered');
}

// 更新会话
function updateSession(sessionId, updateData) {
  if (!sessionId || !activeSessionsMap.has(sessionId)) return;
  
  const session = activeSessionsMap.get(sessionId);
  
  // 更新会话数据
  activeSessionsMap.set(sessionId, {
    ...session,
    ...updateData,
    lastUpdated: Date.now()
  });
  
  console.log(`[Service Worker] 会话 ${sessionId} 已更新`);
  broadcastSessionUpdate(sessionId, 'updated');
}

// 获取会话
function getSession(sessionId, event) {
  const session = activeSessionsMap.get(sessionId);
  
  // 使用MessageChannel回复请求
  if (event.ports && event.ports[0]) {
    try {
      event.ports[0].postMessage({
        sessionId,
        exists: !!session,
        session: session || null
      });
    } catch (error) {
      console.error('[Service Worker] 回复getSession请求失败:', error);
      
      try {
        // 尝试发送错误信息
        event.ports[0].postMessage({
          error: true,
          message: '获取会话失败: ' + error.message
        });
      } catch (portError) {
        console.error('[Service Worker] 无法通过消息端口发送错误:', portError);
      }
    }
  } else {
    console.warn('[Service Worker] getSession请求没有提供消息端口');
  }
}

// 标记会话完成
function completeSession(sessionId) {
  if (!sessionId || !activeSessionsMap.has(sessionId)) return;
  
  const session = activeSessionsMap.get(sessionId);
  
  // 不移除会话，只标记为已完成
  activeSessionsMap.set(sessionId, {
    ...session,
    isComplete: true,
    completedAt: Date.now(),
    // 保留所有其他数据和消息
    lastUpdated: Date.now()
  });
  
  console.log(`[Service Worker] 会话 ${sessionId} 已标记为完成但保留状态`);
  broadcastSessionUpdate(sessionId, 'completed');
}

// 清理会话
function clearSession(sessionId) {
  if (!sessionId) return;
  
  if (activeSessionsMap.has(sessionId)) {
    activeSessionsMap.delete(sessionId);
    console.log(`[Service Worker] 会话 ${sessionId} 已清理`);
    broadcastSessionUpdate(sessionId, 'cleared');
  }
}

// 广播会话更新
function broadcastSessionUpdate(sessionId, action) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      try {
        client.postMessage({
          type: 'SESSION_UPDATE',
          sessionId,
          action
        });
      } catch (error) {
        console.warn(`[Service Worker] 向客户端广播会话更新失败:`, error);
      }
    });
  }).catch(error => {
    console.error('[Service Worker] 获取客户端列表失败:', error);
  });
}

// 广播消息给除了发送者以外的所有客户端
function broadcastToClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      try {
        client.postMessage(message);
      } catch (error) {
        console.warn(`[Service Worker] 向客户端广播消息失败:`, error);
      }
    });
  }).catch(error => {
    console.error('[Service Worker] 获取客户端列表失败:', error);
  });
}

// 每小时执行一次清理任务，移除长时间不活跃的会话
setInterval(() => {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  
  activeSessionsMap.forEach((session, sessionId) => {
    if (now - session.lastUpdated > ONE_HOUR) {
      activeSessionsMap.delete(sessionId);
      console.log(`[Service Worker] 会话 ${sessionId} 因不活跃被自动清理`);
    }
  });
}, 60 * 60 * 1000); // 每小时执行一次

// 拦截特定API请求(可选功能)
// self.addEventListener('fetch', event => {
//   // 根据需求可以在这里拦截和处理特定的API请求
// }); 