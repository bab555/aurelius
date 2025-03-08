import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 等待路由就绪后再挂载应用，防止导航闪现
router.isReady().then(() => {
  app.mount('#app')
}) 