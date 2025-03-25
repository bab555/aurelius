/**
 * 流式输出防刷新保护服务
 * 防止在AI流式回复过程中页面被自动或手动刷新
 * 支持全站级别防止自动刷新功能
 */

// 统计数据 - 全局可访问
window._refreshStats = {
  blockedAutoRefreshes: 0,   // 被阻止的自动刷新次数
  userConfirmations: 0,      // 用户确认提示次数
  allowedRefreshes: 0,       // 允许通过的刷新次数
  lastBlockTime: 0           // 最后一次阻止时间
};

// 页面加载状态标记 - 在全局范围立即设置，确保早期检查能够识别
window._pageLoadState = {
  isInitialLoad: true,   // 标记页面是否在初始加载阶段
  loadTimestamp: Date.now()  // 记录加载时间戳
};

// 页面加载完成后8秒将初始加载状态重置
setTimeout(() => {
  if (window._pageLoadState) {
    window._pageLoadState.isInitialLoad = false;
    console.log('📋 页面初始加载状态已重置');
  }
}, 8000);

// 全局流式状态管理
window.streamingState = {
  isStreaming: false,
  modalShowing: false,
  preventAutoRefresh: true, // 新增：默认禁止自动刷新
  
  setStreaming(state) {
    const oldState = this.isStreaming;
    this.isStreaming = state;
    console.log(`流式输出状态: ${state ? '进行中' : '已结束'}`);
    
    // 通知Service Worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'STREAMING_STATE',
        streaming: state
      });
    }
    
    // 触发事件以便其他组件可以响应
    if (oldState !== state) {
      const event = new CustomEvent('streamingStateChanged', {
        detail: { streaming: state }
      });
      window.dispatchEvent(event);
    }
  },
  
  setModalShowing(state) {
    const oldState = this.modalShowing;
    this.modalShowing = state;
    console.log(`重要弹窗状态: ${state ? '显示中' : '已关闭'}`);
    
    // 通知Service Worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'MODAL_STATE',
        modalShowing: state
      });
    }
    
    // 触发事件以便其他组件可以响应
    if (oldState !== state) {
      const event = new CustomEvent('modalStateChanged', {
        detail: { showing: state }
      });
      window.dispatchEvent(event);
    }
  },
  
  // 设置全局自动刷新禁止状态
  setPreventAutoRefresh(state) {
    const oldState = this.preventAutoRefresh;
    this.preventAutoRefresh = state;
    console.log(`全局自动刷新保护状态: ${state ? '已启用' : '已禁用'}`);
    
    // 通知Service Worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'AUTO_REFRESH_PROTECTION',
        preventAutoRefresh: state
      });
    }
    
    // 保存到本地存储，确保页面加载时保持状态
    try {
      localStorage.setItem('preventAutoRefresh', state ? 'true' : 'false');
    } catch (err) {
      console.warn('无法保存自动刷新设置到本地存储:', err);
    }
    
    // 如果状态发生变化，触发自定义事件通知UI更新
    if (oldState !== state) {
      // 触发自定义事件
      const event = new CustomEvent('refreshProtectionChanged', {
        detail: { enabled: state }
      });
      window.dispatchEvent(event);
    }
  },
  
  // 兼容性方法 - 被其他模块使用，不能移除
  // 注意：在导航过程中此方法会特殊处理
  shouldPreventRefresh() {
    // 页面加载状态检查 - 最高优先级
    if (window._pageLoadState && window._pageLoadState.isInitialLoad) {
      console.log('页面处于初始加载阶段，不阻止刷新操作');
      return false;
    }
    
    // 如果最近8秒内页面刚加载，不阻止刷新
    if (window._pageLoadState && (Date.now() - window._pageLoadState.loadTimestamp < 8000)) {
      console.log('页面加载后8秒内，不阻止刷新操作');
      return false;
    }
    
    // 如果正在导航中或页面初始化中，不应该阻止
    if (window._navigationState && 
       (window._navigationState.isNavigating || window._navigationState.isInitializingPage)) {
      return false;
    }
    
    // 如果是聊天相关操作，不应该阻止
    if (window._chatState && (
      window._chatState.isLoadingMessages || 
      window._chatState.isChangingConversation ||
      window._chatState.isReadingCachedConversation
    )) {
      return false;
    }
    
    // 继续使用原来的判断逻辑，但考虑了导航状态
    return this.isStreaming || this.modalShowing || this.preventAutoRefresh;
  },
  
  // 检查是否应该阻止自动刷新（忽略用户交互）
  // 仅用于自动刷新判断！
  shouldPreventAutoRefresh() {
    return this.preventAutoRefresh;
  },
  
  // 检查是否应该在流式输出或显示重要弹窗时提示用户
  // 仅用于用户交互刷新的确认判断！
  shouldPromptUserOnRefresh() {
    return this.isStreaming || this.modalShowing;
  },
  
  // 获取当前所有状态 - 用于调试
  getStatus() {
    return {
      isStreaming: this.isStreaming,
      modalShowing: this.modalShowing,
      preventAutoRefresh: this.preventAutoRefresh
    };
  },
  
  // 重置所有状态 - 用于异常情况
  resetAllStates() {
    this.isStreaming = false;
    this.modalShowing = false;
    console.warn('已重置所有流式状态');
  }
};

// 添加聊天相关状态标记
window._chatState = {
  isLoadingMessages: false,       // 是否正在加载消息
  isChangingConversation: false,  // 是否正在切换对话
  isReadingCachedConversation: false, // 是否正在读取缓存对话
  lastActivityTimestamp: 0,       // 上次活动时间戳
  
  // 获取当前所有状态 - 用于调试
  getStatus() {
    return {
      isLoadingMessages: this.isLoadingMessages,
      isChangingConversation: this.isChangingConversation,
      isReadingCachedConversation: this.isReadingCachedConversation,
      lastActivityTimestamp: this.lastActivityTimestamp,
      timeSinceLastActivity: Date.now() - this.lastActivityTimestamp
    };
  }
};

// 导航相关状态
window._navigationState = {
  isNavigating: false,           // 是否正在进行页面导航
  isInitializingPage: false,      // 是否正在初始化页面
  
  setNavigating(state) {
    this.isNavigating = state;
    if (state) {
      console.log('导航状态已设置为：进行中');
    } else {
      console.log('导航状态已设置为：已完成');
    }
  },
  
  setInitializingPage(state) {
    this.isInitializingPage = state;
    if (state) {
      console.log('页面初始化状态已设置为：进行中');
    } else {
      console.log('页面初始化状态已设置为：已完成');
    }
  }
};

/**
 * 防止流式输出期间自动刷新
 * 拦截Service Worker控制权变更导致的刷新
 */
export function preventAutoRefreshDuringStreaming() {
  // 仅在支持Service Worker的环境中启用
  if (!navigator.serviceWorker) return;
  
  // 拦截Service Worker控制权变更导致的刷新
  navigator.serviceWorker.addEventListener('controllerchange', (event) => {
    if (window.streamingState && window.streamingState.shouldPreventAutoRefresh()) {
      console.warn('检测到Service Worker控制权变更，但当前防刷新机制已启用，阻止自动刷新');
      
      // 阻止后续可能导致刷新的事件处理器
      event.stopImmediatePropagation();
      
      // 通知开发者（可选）
      console.debug('Service Worker控制权变更被拦截，防止自动刷新');
    }
  }, { capture: true });
  
  console.log('已启用流式输出及重要弹窗期间防自动刷新机制');
}

/**
 * 防止自动刷新
 * 拦截各种可能导致自动刷新的机制，但允许用户主动刷新和导航切换
 */
export function setupGlobalAutoRefreshProtection() {
  // 拦截自动刷新机制
  
  // 1. 监听页面可见性变化，可能导致某些页面自动刷新
  document.addEventListener('visibilitychange', (event) => {
    if (document.visibilityState === 'visible' && window.streamingState.shouldPreventAutoRefresh()) {
      console.log('⚠️ 页面变为可见，监测自动刷新行为');
    }
  }, { capture: true });
  
  // 2. 改用事件监听方式拦截自动刷新，不干扰用户手动刷新和导航切换
  let refreshAttemptCount = 0;
  let lastRefreshTime = 0;
  
  // 拦截beforeunload事件
  window.addEventListener('beforeunload', (event) => {
    // 打印关键状态 - 用于调试导航问题
    console.log('🔄 beforeunload事件被触发 - 导航状态:', window._navigationState.isNavigating);
    console.log('🔄 beforeunload事件被触发 - 页面初始化状态:', window._navigationState.isInitializingPage);
    console.log('🔄 beforeunload事件被触发 - 聊天状态:', window._chatState.getStatus());
    
    // 增强的导航检测 - 通过URL和路由信息进行额外确认
    const isNavigationRelated = isNavigationEvent();
    
    // 如果是导航操作、页面初始化中，或导航状态标记为true，直接放行
    if (window._navigationState.isNavigating || 
        window._navigationState.isInitializingPage || 
        isNavigationRelated) {
      console.log('✅ 检测到导航操作或页面初始化，允许页面状态变化，不做干预');
      window._refreshStats.allowedRefreshes++;
      return;
    }
    
    // 如果是聊天相关操作，直接放行
    if (
      window._chatState.isLoadingMessages || 
      window._chatState.isChangingConversation ||
      window._chatState.isReadingCachedConversation
    ) {
      console.log('✅ 检测到聊天相关操作，允许页面状态变化，不做干预');
      window._refreshStats.allowedRefreshes++;
      return;
    }
    
    // 如果是API请求过程中，直接放行
    if (isInApiRequest()) {
      console.log('✅ 检测到API请求过程中，允许页面状态变化，不做干预');
      window._refreshStats.allowedRefreshes++;
      return;
    }
    
    // 判断是否是用户主动刷新
    const isUserInitiated = isCalledFromUserAction();
    console.log('🔍 判断是否用户操作:', isUserInitiated);
    
    // 情况1：无用户操作时，直接阻止刷新且不提示
    if (window.streamingState.shouldPreventAutoRefresh() && !isUserInitiated) {
      // 记录刷新尝试
      refreshAttemptCount++;
      window._refreshStats.blockedAutoRefreshes++;
      window._refreshStats.lastBlockTime = Date.now();
      
      // 避免过于频繁地发送通知，设置一个间隔
      if (Date.now() - lastRefreshTime > 1000) { // 至少间隔1秒
        console.warn('🚫 检测到自动刷新尝试，已被无提示阻止', refreshAttemptCount);
        // 触发刷新被阻止事件
        notifyRefreshBlocked();
        lastRefreshTime = Date.now();
      }
      
      // 阻止刷新，不显示任何提示
      event.preventDefault();
      event.returnValue = '';
      
      // 添加明显的日志标记
      console.log('%c🛑 已成功阻止自动刷新操作! 总计已阻止: ' + window._refreshStats.blockedAutoRefreshes, 
                 'background: #f44336; color: white; padding: 4px; border-radius: 4px; font-weight: bold;');
      
      return event.returnValue;
    }
    
    // 情况2：流式输出或重要弹窗时用户操作刷新，显示提示
    // 增加额外检查，导航相关操作不显示提示
    if (window.streamingState.shouldPromptUserOnRefresh() && isUserInitiated && !isNavigationRelated) {
      window._refreshStats.userConfirmations++;
      const message = '正在接收AI回复或显示重要内容，刷新页面可能导致数据丢失。确定要继续吗？';
      console.log('⚠️ 已显示用户确认弹窗，等待用户操作...');
      event.preventDefault();
      event.returnValue = message;
      return message;
    }
    
    // 情况3：其他时间用户操作刷新，不阻止不提示
    console.log('✅ 用户主动刷新，允许正常进行');
    window._refreshStats.allowedRefreshes++;
  }, { capture: true });
  
  // 强化防刷新机制 - 添加unload事件监听
  window.addEventListener('unload', (event) => {
    // 如果已经决定阻止刷新但仍然触发了unload，记录日志
    if (window._refreshStats.lastBlockTime && (Date.now() - window._refreshStats.lastBlockTime < 100)) {
      console.warn('⚠️⚠️⚠️ 尽管尝试阻止刷新，但unload事件仍被触发!');
    }
  });
  
  // 强化防刷新机制 - 监听页面可见性变化
  document.addEventListener('visibilitychange', (event) => {
    if (document.visibilityState === 'hidden' && 
        window.streamingState.shouldPreventAutoRefresh() && 
        !isCalledFromUserAction()) {
      console.warn('🚫 检测到页面被隐藏，可能是刷新前兆，正在采取预防措施');
      // 在这里可以添加额外的预防措施
    }
  });
  
  // 3. 为F5和Ctrl+R刷新添加特殊处理
  window.addEventListener('keydown', (event) => {
    // 仅在流式输出或重要弹窗过程中才提示确认
    if ((event.key === 'F5' || (event.ctrlKey && event.key === 'r')) && window.streamingState.shouldPromptUserOnRefresh()) {
      console.log('⚠️ 用户按下F5或Ctrl+R，显示确认对话框');
      const confirmed = confirm('正在接收AI回复或显示重要内容，刷新页面可能导致数据丢失。确定要继续吗？');
      if (!confirmed) {
        console.log('✅ 用户取消了刷新操作');
        event.preventDefault();
        event.stopPropagation();
      } else {
        console.log('⚠️ 用户确认继续刷新');
      }
    }
  }, { capture: true });
  
  // 4. 监听页面导航事件，用于标记导航状态
  window.addEventListener('popstate', (event) => {
    window._navigationState.setNavigating(true);
    // 导航完成后重置状态
    setTimeout(() => {
      window._navigationState.setNavigating(false);
    }, 1500);
    console.log('检测到历史导航，已标记为导航状态');
  });
  
  // 监控hash变化，用于标记导航状态
  window.addEventListener('hashchange', (event) => {
    window._navigationState.setNavigating(true);
    // 导航完成后重置状态
    setTimeout(() => {
      window._navigationState.setNavigating(false);
    }, 1500);
    console.log('检测到hash变化，已标记为导航状态');
  });
  
  // 自动监控网络请求
  setupApiRequestMonitoring();
  
  console.log('✅ 已启用全局自动刷新保护机制（根据不同场景应用不同策略）');
  console.log('📊 防刷新统计功能已启用，可通过window._refreshStats查看拦截数据');
}

// 检测是否正在进行API请求
function isInApiRequest() {
  // 检查是否有活跃的网络请求
  if (window._activeApiRequests && window._activeApiRequests > 0) {
    return true;
  }
  
  // 检查最近是否有完成的API请求
  const lastApiActivity = window._lastApiActivity || 0;
  const timeSinceLastApi = Date.now() - lastApiActivity;
  
  // 如果最近2秒内有API活动，认为仍在API操作中
  return timeSinceLastApi < 2000;
}

// 设置API请求监控
function setupApiRequestMonitoring() {
  // 初始化计数器
  window._activeApiRequests = 0;
  window._lastApiActivity = 0;
  
  // 拦截XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function() {
    this._isApiRequest = true; // 标记为API请求
    return originalXHROpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function() {
    if (this._isApiRequest) {
      window._activeApiRequests++;
      console.log('API请求开始，当前活跃请求数:', window._activeApiRequests);
      
      // 监听请求完成
      this.addEventListener('loadend', function() {
        window._activeApiRequests--;
        window._lastApiActivity = Date.now();
        console.log('API请求结束，当前活跃请求数:', window._activeApiRequests);
      });
    }
    return originalXHRSend.apply(this, arguments);
  };
  
  // 拦截Fetch API
  const originalFetch = window.fetch;
  
  window.fetch = function() {
    window._activeApiRequests++;
    console.log('Fetch请求开始，当前活跃请求数:', window._activeApiRequests);
    
    // 创建一个Promise来处理请求完成
    const promise = originalFetch.apply(this, arguments);
    
    promise.then(function() {
      window._activeApiRequests--;
      window._lastApiActivity = Date.now();
      console.log('Fetch请求结束，当前活跃请求数:', window._activeApiRequests);
    }).catch(function() {
      window._activeApiRequests--;
      window._lastApiActivity = Date.now();
      console.log('Fetch请求失败，当前活跃请求数:', window._activeApiRequests);
    });
    
    return promise;
  };
}

// 辅助函数：判断是否由用户交互触发的操作
function isCalledFromUserAction() {
  // 0.1 检查导航状态
  if (window._navigationState.isNavigating) {
    return true;
  }
  
  // 0.2 检查聊天相关操作
  if (isChatRelatedActivity()) {
    return true;
  }
  
  // 1. 检查最近的用户交互时间
  const lastInteractionTime = window._lastUserInteraction || 0;
  const timeSinceLastInteraction = Date.now() - lastInteractionTime;
  
  // 如果最近1秒内有用户交互，则认为是用户触发的
  // 适当增加阈值
  if (timeSinceLastInteraction < 1000) {
    return true;
  }
  
  // 2. 检查调用堆栈（作为后备方案）
  try {
    throw new Error('Stack trace');
  } catch (e) {
    const stack = e.stack || '';
    // 检查堆栈中是否包含事件处理程序或导航相关的函数名
    return stack.includes('click') || 
           stack.includes('touch') || 
           stack.includes('mouse') || 
           stack.includes('key') || 
           stack.includes('input') || 
           stack.includes('change') ||
           stack.includes('router') || // 检测路由相关操作
           stack.includes('navigation') ||
           stack.includes('history') ||
           stack.includes('pushState') ||
           stack.includes('replaceState') ||
           stack.includes('getMessages') || // 检测获取消息
           stack.includes('loadConversation'); // 检测加载对话
  }
}

// 检查是否是聊天相关活动
function isChatRelatedActivity() {
  // 检查是否正在加载消息或切换对话
  if (
    window._chatState.isLoadingMessages || 
    window._chatState.isChangingConversation ||
    window._chatState.isReadingCachedConversation
  ) {
    return true;
  }
  
  // 检查最近的聊天活动
  const lastActivity = window._chatState.lastActivityTimestamp;
  const timeSinceLastActivity = Date.now() - lastActivity;
  
  // 如果最近3秒内有聊天相关活动，视为聊天操作
  return timeSinceLastActivity < 3000;
}

// 添加用户交互时间记录
function setupUserInteractionTracking() {
  // 初始化最后交互时间
  window._lastUserInteraction = 0;
  
  // 监听各种用户交互事件
  const interactionEvents = [
    'mousedown', 'mouseup', 'click', 'touchstart', 
    'touchend', 'keydown', 'keyup', 'input', 'change'
  ];
  
  interactionEvents.forEach(eventType => {
    document.addEventListener(eventType, () => {
      window._lastUserInteraction = Date.now();
    }, { passive: true, capture: true });
  });
}

/**
 * 防止用户在流式输出时刷新页面
 * 显示确认对话框
 */
export function setupUserRefreshProtection() {
  // 已整合到setupGlobalAutoRefreshProtection中，这里保留该函数以兼容现有代码
  console.log('用户刷新保护已整合到全局刷新保护中');
}

/**
 * 初始化所有刷新保护机制
 */
export function initRefreshProtection() {
  // 从本地存储恢复自动刷新保护状态
  try {
    const savedState = localStorage.getItem('preventAutoRefresh');
    if (savedState !== null) {
      window.streamingState.preventAutoRefresh = savedState === 'true';
      console.log(`从本地存储恢复自动刷新保护状态: ${window.streamingState.preventAutoRefresh ? '已启用' : '已禁用'}`);
    }
  } catch (err) {
    console.warn('无法从本地存储读取自动刷新保护状态:', err);
  }
  
  // 设置用户交互跟踪
  setupUserInteractionTracking();
  
  // 初始化保护机制
  preventAutoRefreshDuringStreaming();
  setupGlobalAutoRefreshProtection();
  
  // 为Vue Router添加特殊处理
  setupVueRouterIntegration();
  
  // 设置全局事件监听，用于自动检测聊天相关活动
  setupChatActivityMonitoring();
  
  // 设置页面加载状态处理
  setupPageLoadStateHandling();
  
  // 新增：设置网络状态监控
  setupNetworkMonitoring();
  
  // 添加全局调试接口
  window.debugRefreshProtection = {
    getStatus: function() {
      return {
        streamingState: window.streamingState.getStatus(),
        chatState: window._chatState.getStatus(),
        navigationState: { 
          isNavigating: window._navigationState.isNavigating,
          isInitializingPage: window._navigationState.isInitializingPage
        },
        pageLoadState: {
          isInitialLoad: window._pageLoadState.isInitialLoad,
          loadTimestamp: window._pageLoadState.loadTimestamp,
          timeSinceLoad: Date.now() - window._pageLoadState.loadTimestamp
        },
        refreshStats: window._refreshStats,
        apiState: { 
          activeRequests: window._activeApiRequests || 0,
          lastActivity: window._lastApiActivity || 0,
          timeSinceLastActivity: Date.now() - (window._lastApiActivity || 0)
        },
        userInteraction: {
          lastInteraction: window._lastUserInteraction || 0,
          timeSinceLastInteraction: Date.now() - (window._lastUserInteraction || 0)
        },
        networkState: {
          isOnline: window._networkState ? window._networkState.isOnline : navigator.onLine,
          lastOfflineTime: window._networkState ? window._networkState.lastOfflineTime : 0,
          lastOnlineTime: window._networkState ? window._networkState.lastOnlineTime : 0,
          reconnectionAttempts: window._networkState ? window._networkState.reconnectionAttempts : 0,
          recentEvents: window._networkState ? window._networkState.networkEvents : [],
          errors: window._networkState && window._networkState.errors ? window._networkState.errors : [],
          timeSinceLastOnline: window._networkState ? Date.now() - window._networkState.lastOnlineTime : 0
        }
      };
    },
    reset: function() {
      window.streamingState.resetAllStates();
      window._chatState.isLoadingMessages = false;
      window._chatState.isChangingConversation = false;
      window._chatState.isReadingCachedConversation = false;
      window._navigationState.isNavigating = false;
      window._refreshStats = {
        blockedAutoRefreshes: 0,
        userConfirmations: 0,
        allowedRefreshes: 0,
        lastBlockTime: 0
      };
      console.warn('已重置所有防刷新相关状态');
      return '状态已重置';
    },
    forceBlockNextRefresh: function() {
      // 临时强制阻止下一次刷新，无论什么情况
      const originalShouldPreventRefresh = window.streamingState.shouldPreventRefresh;
      window.streamingState.shouldPreventRefresh = function() { 
        // 使用一次后恢复原始实现
        window.streamingState.shouldPreventRefresh = originalShouldPreventRefresh;
        console.log('🔒 强制拦截下一次刷新，无论来源');
        return true; 
      };
      return '已设置强制拦截下一次刷新';
    },
    triggerTestBlock: function() {
      // 模拟阻止刷新并生成日志
      window._refreshStats.blockedAutoRefreshes++;
      window._refreshStats.lastBlockTime = Date.now();
      console.warn('🚫 [测试] 模拟自动刷新已被阻止');
      console.log('%c🛑 [测试] 已成功阻止自动刷新操作! 总计已阻止: ' + window._refreshStats.blockedAutoRefreshes, 
                 'background: #f44336; color: white; padding: 4px; border-radius: 4px; font-weight: bold;');
      notifyRefreshBlocked();
      return '测试阻止事件已触发';
    }
  };
  
  console.log('刷新保护机制初始化完成，全局自动刷新保护状态:', window.streamingState.preventAutoRefresh ? '已启用' : '已禁用');
  console.log('提示: 可以通过 window.debugRefreshProtection.getStatus() 查看当前所有状态');
  console.log('📈 防刷新统计: 可以通过 window._refreshStats 访问');
}

// 设置页面加载状态处理
function setupPageLoadStateHandling() {
  // 在DOM内容加载后，初始化页面状态
  document.addEventListener('DOMContentLoaded', () => {
    // 更新加载时间戳
    if (window._pageLoadState) {
      window._pageLoadState.loadTimestamp = Date.now();
      window._pageLoadState.isInitialLoad = true;
      console.log('DOM内容已加载，更新页面加载状态');
    }
    
    // 设置页面为初始化状态
    if (window._navigationState) {
      window._navigationState.setInitializingPage(true);
    }
  });
  
  // 在页面完全加载后，更新状态但保持初始加载标记
  window.addEventListener('load', () => {
    // 更新加载时间戳
    if (window._pageLoadState) {
      window._pageLoadState.loadTimestamp = Date.now();
      console.log('页面已完全加载，更新页面加载时间戳');
    }
  });
  
  // 为单页应用的路由变化添加特殊处理
  window.addEventListener('popstate', () => {
    if (window._pageLoadState) {
      // 路由变化时更新加载时间戳并设置为初始加载状态
      window._pageLoadState.loadTimestamp = Date.now();
      window._pageLoadState.isInitialLoad = true;
      
      // 8秒后重置状态
      setTimeout(() => {
        window._pageLoadState.isInitialLoad = false;
      }, 8000);
      
      console.log('检测到路由变化，更新页面加载状态');
    }
  });
}

// 设置聊天活动监控
function setupChatActivityMonitoring() {
  // 监听控制台日志，自动检测聊天相关操作
  const originalConsoleLog = console.log;
  console.log = function() {
    const args = Array.from(arguments);
    const logMessage = args.join(' ');
    
    // 检测导航切换关键词
    if (
      logMessage.includes('导航到:') || 
      logMessage.includes('页面卸载') || 
      logMessage.includes('正在初始化聊天状态')
    ) {
      // 标记为导航状态
      window._navigationState.setNavigating(true);
      // 在导航完成后重置标记
      setTimeout(() => {
        window._navigationState.setNavigating(false);
      }, 2000); // 增加导航状态持续时间
    }
    
    // 检测聊天相关活动的关键词
    if (
      logMessage.includes('获取消息') || 
      logMessage.includes('切换对话') || 
      logMessage.includes('从sessionStorage恢复会话') ||
      logMessage.includes('加载中') ||
      logMessage.includes('isLoading状态变更为')
    ) {
      // 标记为聊天活动
      const isLoading = 
        logMessage.includes('开始获取消息') || 
        logMessage.includes('isLoading状态变更为: true') ||
        logMessage.includes('加载中');
        
      const isComplete = 
        logMessage.includes('获取消息成功') ||
        logMessage.includes('isLoading状态变更为: false') ||
        logMessage.includes('加载完成');
        
      const isChangingConversation = logMessage.includes('切换对话');
      const isRestoringFromSession = logMessage.includes('从sessionStorage恢复会话');
      
      // 更新状态
      if (isLoading) {
        window._chatState.isLoadingMessages = true;
        console.warn('已自动检测到消息加载开始，标记为加载状态');
      }
      
      if (isComplete) {
        window._chatState.isLoadingMessages = false;
        console.warn('已自动检测到消息加载完成，取消加载状态');
      }
      
      if (isChangingConversation) {
        window._chatState.isChangingConversation = true;
        setTimeout(() => {
          window._chatState.isChangingConversation = false;
        }, 2000); // 切换对话状态持续2秒
        console.warn('已自动检测到对话切换，标记为切换状态');
      }
      
      if (isRestoringFromSession) {
        window._chatState.isReadingCachedConversation = true;
        setTimeout(() => {
          window._chatState.isReadingCachedConversation = false;
        }, 2000); // 恢复会话状态持续2秒
        console.warn('已自动检测到会话恢复，标记为缓存读取状态');
      }
      
      // 更新最后活动时间
      window._chatState.lastActivityTimestamp = Date.now();
    }
    
    // 调用原始的console.log
    return originalConsoleLog.apply(console, arguments);
  };
}

// 处理路由变化时的页面状态
function handleRouteChange() {
  // 更新页面加载状态
  if (window._pageLoadState) {
    window._pageLoadState.loadTimestamp = Date.now();
    window._pageLoadState.isInitialLoad = true;
    
    // 8秒后重置状态
    setTimeout(() => {
      window._pageLoadState.isInitialLoad = false;
    }, 8000);
    
    console.log('检测到路由变化，重置页面加载状态');
  }
}

// 为Vue Router添加特殊处理
function setupVueRouterIntegration() {
  // 在window加载完成后执行，确保Vue实例已初始化
  window.addEventListener('load', () => {
    // 延迟执行以确保Vue Router已初始化
    setTimeout(() => {
      // 尝试获取Vue Router实例
      if (window.router || (window.app && window.app.$router)) {
        const router = window.router || window.app.$router;
        
        // 添加全局前置守卫
        router.beforeEach((to, from, next) => {
          // 标记为导航状态
          window._navigationState.setNavigating(true);
          
          // 设置导航标记（可被其他检测机制使用）
          window._pendingNavigation = true;
          
          // 更新页面加载状态
          handleRouteChange();
          
          console.log('Vue Router导航开始:', from.path, '->', to.path);
          
          next();
        });
        
        // 添加全局后置钩子
        router.afterEach((to, from) => {
          // 导航完成后延迟重置状态
          setTimeout(() => {
            window._navigationState.setNavigating(false);
          }, 2000);
          
          console.log('Vue Router导航完成:', from.path, '->', to.path);
        });
        
        console.log('已为Vue Router添加防刷新集成支持');
      }
    }, 500);
  });
  
  // 拦截历史API，标记为导航状态
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    window._navigationState.setNavigating(true);
    
    // 更新页面加载状态
    handleRouteChange();
    
    const result = originalPushState.apply(this, arguments);
    
    // 在导航后延迟重置状态
    setTimeout(() => {
      window._navigationState.setNavigating(false);
    }, 2000);
    
    return result;
  };
  
  history.replaceState = function() {
    window._navigationState.setNavigating(true);
    
    // 更新页面加载状态
    handleRouteChange();
    
    const result = originalReplaceState.apply(this, arguments);
    
    // 在导航后延迟重置状态
    setTimeout(() => {
      window._navigationState.setNavigating(false);
    }, 2000);
    
    return result;
  };
  
  console.log('已为History API添加防刷新集成支持');
}

/**
 * 暴露API，允许其他模块获取和设置自动刷新保护状态
 */
export function getAutoRefreshProtectionStatus() {
  return window.streamingState ? window.streamingState.preventAutoRefresh : false;
}

export function setAutoRefreshProtectionStatus(enabled) {
  if (window.streamingState) {
    window.streamingState.setPreventAutoRefresh(enabled);
    return true;
  }
  return false;
}

// 标记状态的API方法
export function setStreamingState(isStreaming) {
  if (window.streamingState) {
    window.streamingState.setStreaming(isStreaming);
    return true;
  }
  return false;
}

export function setModalState(isShowing) {
  if (window.streamingState) {
    window.streamingState.setModalShowing(isShowing);
    return true;
  }
  return false;
}

export function setChatStateLoading(isLoading) {
  if (window._chatState) {
    window._chatState.isLoadingMessages = isLoading;
    window._chatState.lastActivityTimestamp = Date.now();
    console.log(`手动设置消息加载状态: ${isLoading ? '正在加载' : '加载完成'}`);
    return true;
  }
  return false;
}

export function setChatStateChangingConversation(isChanging) {
  if (window._chatState) {
    window._chatState.isChangingConversation = isChanging;
    window._chatState.lastActivityTimestamp = Date.now();
    console.log(`手动设置对话切换状态: ${isChanging ? '正在切换' : '切换完成'}`);
    return true;
  }
  return false;
}

export function setChatStateReadingCache(isReading) {
  if (window._chatState) {
    window._chatState.isReadingCachedConversation = isReading;
    window._chatState.lastActivityTimestamp = Date.now();
    console.log(`手动设置缓存读取状态: ${isReading ? '正在读取' : '读取完成'}`);
    return true;
  }
  return false;
}

export function setNavigationState(isNavigating) {
  if (window._navigationState) {
    window._navigationState.setNavigating(isNavigating);
    return true;
  }
  return false;
}

// 通知刷新被阻止
function notifyRefreshBlocked() {
  // 触发自定义事件
  const event = new CustomEvent('refreshBlocked', {
    detail: {
      blockedCount: window._refreshStats.blockedAutoRefreshes,
      timestamp: Date.now()
    }
  });
  window.dispatchEvent(event);
  
  // 添加更明显的控制台提示
  console.log('%c自动刷新已被阻止', 'color: white; background: red; font-size: 16px; padding: 2px 5px; border-radius: 3px');
}

// 新增：增强型导航检测函数
function isNavigationEvent() {
  // 检查页面加载状态
  if (window._pageLoadState && window._pageLoadState.isInitialLoad) {
    console.log('检测到页面处于初始加载状态，判定为导航相关事件');
    return true;
  }
  
  // 检查页面初始化状态
  if (window._navigationState && window._navigationState.isInitializingPage) {
    console.log('检测到页面处于初始化状态，判定为导航相关事件');
    return true;
  }
  
  // 新增：如果正在进行API操作或网络恢复，不应该视为导航
  if (window._blockNextRefresh || isNetworkRecoveryRefresh()) {
    return false;
  }
  
  // ... existing code ...
}

// 新增：网络状态监控
function setupNetworkMonitoring() {
  // 初始化网络状态对象
  window._networkState = {
    isOnline: navigator.onLine,
    lastOfflineTime: 0,
    lastOnlineTime: navigator.onLine ? Date.now() : 0,
    reconnectionAttempts: 0,
    networkEvents: []
  };
  
  // 监听网络离线事件
  window.addEventListener('offline', () => {
    window._networkState.isOnline = false;
    window._networkState.lastOfflineTime = Date.now();
    window._networkState.networkEvents.push({
      type: 'offline',
      timestamp: Date.now()
    });
    
    // 离线事件记录到最多保留10条
    if (window._networkState.networkEvents.length > 10) {
      window._networkState.networkEvents.shift();
    }
    
    console.warn('🔴 网络连接已断开，已启用网络波动防刷新保护');
    
    // 强化防刷新保护 - 离线状态下特别容易出现自动刷新
    window.streamingState.preventAutoRefresh = true;
  });
  
  // 监听网络恢复事件
  window.addEventListener('online', () => {
    window._networkState.isOnline = true;
    window._networkState.lastOnlineTime = Date.now();
    window._networkState.reconnectionAttempts++;
    window._networkState.networkEvents.push({
      type: 'online',
      timestamp: Date.now()
    });
    
    // 网络恢复事件记录到最多保留10条
    if (window._networkState.networkEvents.length > 10) {
      window._networkState.networkEvents.shift();
    }
    
    console.warn('🟢 网络连接已恢复，已阻止自动刷新机制');
    
    // 网络恢复时，页面可能尝试自动刷新，提前拦截
    blockPossibleReconnectionRefresh();
  });
  
  // 监控XMLHttpRequest错误
  const originalXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function() {
    this.addEventListener('error', (e) => {
      recordNetworkError('XHR', e);
    });
    
    this.addEventListener('timeout', (e) => {
      recordNetworkError('XHR_Timeout', e);
    });
    
    this.addEventListener('abort', (e) => {
      recordNetworkError('XHR_Abort', e);
    });
    
    return originalXHRSend.apply(this, arguments);
  };
  
  // 监控Fetch错误
  const originalFetch = window.fetch;
  window.fetch = function() {
    return originalFetch.apply(this, arguments)
      .catch(error => {
        recordNetworkError('Fetch', error);
        throw error;
      });
  };
  
  // 监控网页可见性变化
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const lastNetworkEvent = window._networkState.networkEvents[window._networkState.networkEvents.length - 1];
      const timeSinceLastEvent = lastNetworkEvent ? Date.now() - lastNetworkEvent.timestamp : Infinity;
      
      // 如果页面刚变为可见，且最近5秒内有网络事件，可能是网络恢复导致的刷新尝试
      if (timeSinceLastEvent < 5000) {
        console.warn('⚠️ 检测到页面可见性变化与最近网络事件接近，可能尝试刷新');
        blockPossibleReconnectionRefresh();
      }
    }
  });
  
  console.log('✅ 网络状态监控已启用，将防止网络波动导致的自动刷新');
}

// 记录网络错误
function recordNetworkError(type, error) {
  if (!window._networkState.errors) {
    window._networkState.errors = [];
  }
  
  window._networkState.errors.push({
    type,
    time: Date.now(),
    error: error.toString()
  });
  
  // 最多保留10条错误记录
  if (window._networkState.errors.length > 10) {
    window._networkState.errors.shift();
  }
  
  console.warn(`🔶 检测到网络请求错误 [${type}]，启用防刷新保护`);
  
  // 网络错误后，页面可能尝试自动刷新，提前拦截
  blockPossibleReconnectionRefresh();
}

// 阻止可能的重连刷新
function blockPossibleReconnectionRefresh() {
  // 标记为即将阻止下一次刷新
  window._blockNextRefresh = true;
  
  // 5秒内阻止任何刷新尝试
  setTimeout(() => {
    window._blockNextRefresh = false;
    console.log('网络恢复保护已解除');
  }, 5000);
  
  // 强化beforeunload处理器
  const originalShouldPreventAutoRefresh = window.streamingState.shouldPreventAutoRefresh;
  window.streamingState.shouldPreventAutoRefresh = function() {
    // 如果是网络恢复后的刷新尝试，强制阻止
    if (window._blockNextRefresh) {
      console.warn('🛑 检测到网络恢复后的刷新尝试，已强制阻止');
      return true;
    }
    
    // 否则使用原有逻辑
    return originalShouldPreventAutoRefresh.apply(this, arguments);
  };
  
  console.log('🔒 已临时启用强化防刷新保护（5秒），阻止网络恢复后的自动刷新');
}

// 检查是否是网络恢复导致的刷新
function isNetworkRecoveryRefresh() {
  if (!window._networkState) return false;
  
  // 如果最近5秒内网络从离线恢复为在线，很可能是网络恢复刷新
  const timeSinceOnline = Date.now() - window._networkState.lastOnlineTime;
  const wasRecentlyOffline = Date.now() - window._networkState.lastOfflineTime < 10000;
  
  return window._networkState.isOnline && timeSinceOnline < 5000 && wasRecentlyOffline;
}