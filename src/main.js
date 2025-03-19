import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { initServiceWorker } from './services/swManager'
import { initRefreshProtection } from './services/refreshProtection'
import { initRefreshTracker, getRefreshHistory, clearRefreshHistory } from './services/refreshTracker'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 初始化页面刷新跟踪服务
initRefreshTracker();

// 将刷新跟踪器功能暴露在全局变量中，方便在控制台查看历史记录
window.refreshTracker = {
  getHistory: getRefreshHistory,
  clearHistory: clearRefreshHistory
};

// 初始化Service Worker中间层
initServiceWorker().then(success => {
  if (success) {
    console.log('Service Worker中间层已启用');
  } else {
    console.log('Service Worker中间层未能启用，将使用常规模式');
  }
});

// 初始化刷新保护机制
initRefreshProtection()

// 等待路由就绪后再挂载应用，防止导航闪现
router.isReady().then(() => {
  app.mount('#app')
}) 