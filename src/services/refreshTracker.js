/**
 * 页面刷新跟踪服务
 * 用于跟踪页面刷新的时间和可能的原因
 */

// 跟踪信息存储键
const REFRESH_HISTORY_KEY = 'refresh_tracker_history';
const LAST_SESSION_KEY = 'refresh_tracker_last_session';
const MAX_HISTORY_ITEMS = 20;

/**
 * 初始化页面刷新跟踪服务
 */
export function initRefreshTracker() {
  console.log('[刷新跟踪] 初始化跟踪服务，当前时间:', new Date().toISOString());
  
  // 记录页面加载事件
  recordPageLoad();
  
  // 跟踪页面卸载
  trackPageUnload();
  
  // 跟踪Service Worker状态
  trackServiceWorker();
  
  // 监测内存使用情况
  trackMemoryUsage();
  
  // 分析上次会话
  analyzeLastSession();
}

/**
 * 记录页面加载信息
 */
function recordPageLoad() {
  try {
    // 获取导航类型
    let navigationType = 'unknown';
    if (performance && performance.navigation) {
      const navTypes = ['navigate', 'reload', 'back_forward', 'other'];
      navigationType = navTypes[performance.navigation.type] || 'unknown';
    } else if (performance && performance.getEntriesByType) {
      // 使用新的Navigation API
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length) {
        navigationType = navEntries[0].type || 'unknown';
      }
    }
    
    // 获取页面加载性能数据
    let loadTime = 0;
    if (window.performance && window.performance.timing) {
      loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
    }
    
    // 记录当前会话信息
    const sessionInfo = {
      startTime: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      navigationType: navigationType,
      loadTime: loadTime,
      referrer: document.referrer,
      swActive: navigator.serviceWorker && navigator.serviceWorker.controller ? true : false
    };
    
    // 保存当前会话信息
    localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(sessionInfo));
    
    console.log('[刷新跟踪] 页面加载信息:', {
      navigationType,
      url: window.location.href,
      time: new Date().toISOString(),
      swActive: sessionInfo.swActive
    });
  } catch (error) {
    console.error('[刷新跟踪] 记录页面加载信息失败:', error);
  }
}

/**
 * 跟踪页面卸载
 */
function trackPageUnload() {
  try {
    window.addEventListener('beforeunload', (event) => {
      // 获取当前会话信息
      let sessionInfo = {};
      try {
        const savedSession = localStorage.getItem(LAST_SESSION_KEY);
        if (savedSession) {
          sessionInfo = JSON.parse(savedSession);
        }
      } catch (e) {
        console.error('[刷新跟踪] 读取会话信息失败:', e);
      }
      
      // 记录会话结束信息
      sessionInfo.endTime = Date.now();
      sessionInfo.duration = sessionInfo.endTime - (sessionInfo.startTime || 0);
      sessionInfo.endUrl = window.location.href;
      
      // 存储完整的会话信息到历史记录
      storeInHistory(sessionInfo);
      
      console.log('[刷新跟踪] 页面即将卸载', {
        time: new Date().toISOString(),
        duration: sessionInfo.duration + 'ms',
        url: sessionInfo.endUrl
      });
    });
    
    // 同时监听 visibilitychange 事件
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        console.log('[刷新跟踪] 页面切换到后台', new Date().toISOString());
      } else if (document.visibilityState === 'visible') {
        console.log('[刷新跟踪] 页面切换到前台', new Date().toISOString());
      }
    });
  } catch (error) {
    console.error('[刷新跟踪] 设置页面卸载跟踪失败:', error);
  }
}

/**
 * 跟踪 Service Worker 状态
 */
function trackServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[刷新跟踪] 浏览器不支持 Service Worker');
    return;
  }
  
  try {
    // 记录当前 Service Worker 状态
    if (navigator.serviceWorker.controller) {
      console.log('[刷新跟踪] 页面由 Service Worker 控制中', navigator.serviceWorker.controller.scriptURL);
    } else {
      console.log('[刷新跟踪] 页面未被 Service Worker 控制');
    }
    
    // 监听 controllerchange 事件
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[刷新跟踪] Service Worker 控制权变更', new Date().toISOString());
      
      // 记录控制权变更信息
      const changeInfo = {
        type: 'sw_controller_change',
        time: Date.now(),
        url: window.location.href,
        hasController: navigator.serviceWorker.controller ? true : false,
        controllerUrl: navigator.serviceWorker.controller ? navigator.serviceWorker.controller.scriptURL : null
      };
      
      storeInHistory(changeInfo);
    });
    
    // 监听 Service Worker 消息
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type) {
        console.log('[刷新跟踪] 收到 Service Worker 消息:', event.data.type);
      }
    });
  } catch (error) {
    console.error('[刷新跟踪] 跟踪 Service Worker 状态失败:', error);
  }
}

/**
 * 跟踪内存使用情况
 */
function trackMemoryUsage() {
  if (!performance || !performance.memory) {
    console.log('[刷新跟踪] 浏览器不支持内存使用监控');
    return;
  }
  
  try {
    // 创建内存使用抽样定时器
    const memoryCheckInterval = setInterval(() => {
      const memoryInfo = performance.memory;
      const memoryUsage = {
        usedJSHeapSize: Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024)) + 'MB',
        totalJSHeapSize: Math.round(memoryInfo.totalJSHeapSize / (1024 * 1024)) + 'MB',
        jsHeapSizeLimit: Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024)) + 'MB',
        percentage: Math.round((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100) + '%'
      };
      
      console.log('[刷新跟踪] 内存使用情况:', memoryUsage);
      
      // 如果内存使用超过80%，记录警告
      if (memoryInfo.usedJSHeapSize > memoryInfo.jsHeapSizeLimit * 0.8) {
        console.warn('[刷新跟踪] 检测到高内存使用率:', memoryUsage.percentage);
        
        // 记录高内存使用
        const memoryAlert = {
          type: 'high_memory_usage',
          time: Date.now(),
          url: window.location.href,
          memoryUsage
        };
        
        storeInHistory(memoryAlert);
      }
    }, 30000); // 每30秒检查一次
    
    // 确保页面卸载时清理
    window.addEventListener('beforeunload', () => {
      clearInterval(memoryCheckInterval);
    });
  } catch (error) {
    console.error('[刷新跟踪] 跟踪内存使用情况失败:', error);
  }
}

/**
 * 存储信息到历史记录
 */
function storeInHistory(info) {
  try {
    // 读取现有历史记录
    let history = [];
    const savedHistory = localStorage.getItem(REFRESH_HISTORY_KEY);
    if (savedHistory) {
      history = JSON.parse(savedHistory);
    }
    
    // 添加新记录
    history.push(info);
    
    // 限制历史记录大小
    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(-MAX_HISTORY_ITEMS);
    }
    
    // 保存更新后的历史记录
    localStorage.setItem(REFRESH_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('[刷新跟踪] 存储历史记录失败:', error);
  }
}

/**
 * 分析上次会话
 */
function analyzeLastSession() {
  try {
    // 获取历史记录
    const savedHistory = localStorage.getItem(REFRESH_HISTORY_KEY);
    if (!savedHistory) {
      console.log('[刷新跟踪] 没有找到历史记录');
      return;
    }
    
    const history = JSON.parse(savedHistory);
    if (history.length < 2) {
      console.log('[刷新跟踪] 历史记录不足，无法分析');
      return;
    }
    
    // 获取最近两条会话记录
    const recentSessions = history.filter(item => 
      item.startTime && item.endTime
    ).slice(-2);
    
    if (recentSessions.length < 2) {
      console.log('[刷新跟踪] 完整会话记录不足，无法分析');
      return;
    }
    
    // 分析上次会话结束和本次会话开始的时间差
    const lastSession = recentSessions[0];
    const currentSession = recentSessions[1];
    
    const timeDiff = currentSession.startTime - lastSession.endTime;
    
    console.log('[刷新跟踪] 会话分析:', {
      lastSessionEnd: new Date(lastSession.endTime).toISOString(),
      currentSessionStart: new Date(currentSession.startTime).toISOString(),
      timeDifference: timeDiff + 'ms'
    });
    
    // 如果时间差很短，可能是自动刷新
    if (timeDiff < 1000) {
      console.warn('[刷新跟踪] 检测到可能的自动刷新，距上次会话结束仅', timeDiff, 'ms');
      
      // 记录可能的自动刷新
      const refreshAlert = {
        type: 'potential_auto_refresh',
        time: Date.now(),
        timeDiff,
        lastUrl: lastSession.endUrl,
        currentUrl: currentSession.url,
        navigationType: currentSession.navigationType
      };
      
      storeInHistory(refreshAlert);
    }
  } catch (error) {
    console.error('[刷新跟踪] 分析上次会话失败:', error);
  }
}

/**
 * 获取刷新跟踪历史
 */
export function getRefreshHistory() {
  try {
    const savedHistory = localStorage.getItem(REFRESH_HISTORY_KEY);
    return savedHistory ? JSON.parse(savedHistory) : [];
  } catch (error) {
    console.error('[刷新跟踪] 获取历史记录失败:', error);
    return [];
  }
}

/**
 * 清除刷新跟踪历史
 */
export function clearRefreshHistory() {
  try {
    localStorage.removeItem(REFRESH_HISTORY_KEY);
    localStorage.removeItem(LAST_SESSION_KEY);
    console.log('[刷新跟踪] 历史记录已清除');
    return true;
  } catch (error) {
    console.error('[刷新跟踪] 清除历史记录失败:', error);
    return false;
  }
} 