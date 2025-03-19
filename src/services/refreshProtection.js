/**
 * 流式输出防刷新保护服务
 * 防止在AI流式回复过程中页面被自动或手动刷新
 */

// 全局流式状态管理
window.streamingState = {
  isStreaming: false,
  modalShowing: false,
  
  setStreaming(state) {
    this.isStreaming = state;
    console.log(`流式输出状态: ${state ? '进行中' : '已结束'}`);
    
    // 通知Service Worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'STREAMING_STATE',
        streaming: state
      });
    }
  },
  
  setModalShowing(state) {
    this.modalShowing = state;
    console.log(`重要弹窗状态: ${state ? '显示中' : '已关闭'}`);
    
    // 通知Service Worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'MODAL_STATE',
        modalShowing: state
      });
    }
  },
  
  shouldPreventRefresh() {
    return this.isStreaming || this.modalShowing;
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
    if (window.streamingState && window.streamingState.shouldPreventRefresh()) {
      console.warn('检测到Service Worker控制权变更，但当前正在流式输出或重要弹窗显示中，阻止自动刷新');
      
      // 阻止后续可能导致刷新的事件处理器
      event.stopImmediatePropagation();
      
      // 通知开发者（可选）
      console.debug('Service Worker控制权变更被拦截，防止打断流式输出或关闭重要弹窗');
    }
  }, { capture: true });
  
  console.log('已启用流式输出及重要弹窗期间防自动刷新机制');
}

/**
 * 防止用户在流式输出时刷新页面
 * 显示确认对话框
 */
export function setupUserRefreshProtection() {
  // 防止用户在流式输出或弹窗显示时刷新页面
  window.addEventListener('beforeunload', (event) => {
    if (window.streamingState && window.streamingState.shouldPreventRefresh()) {
      // 显示标准确认对话框
      const message = window.streamingState.isStreaming 
        ? '正在接收AI回复，刷新页面将会中断消息并导致内容丢失。确定要继续吗？'
        : '重要结果正在显示中，刷新页面将丢失当前结果。确定要继续吗？';
      event.preventDefault();
      event.returnValue = message;
      return message;
    }
  });
  
  console.log('已启用用户刷新保护机制（支持流式输出和重要弹窗）');
}

/**
 * 初始化所有刷新保护机制
 */
export function initRefreshProtection() {
  preventAutoRefreshDuringStreaming();
  setupUserRefreshProtection();
  console.log('刷新保护机制初始化完成');
} 