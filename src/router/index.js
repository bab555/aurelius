import { createRouter, createWebHistory } from 'vue-router'
import adminRoutes, { setupAdminGuard } from './admin'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: () => import('../views/Welcome.vue'),
      meta: { fullPage: true }
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('../views/Home.vue')
    },
    {
      path: '/assistant',
      name: 'assistant',
      component: () => import('../views/Assistant.vue')
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('../views/Chat.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/About.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { fullPage: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue'),
      meta: { fullPage: true }
    },
    {
      path: '/forbidden',
      name: 'forbidden',
      component: () => import('../views/Forbidden.vue')
    },
    // 添加中台路由
    ...adminRoutes
  ]
})

// 设置中台权限守卫
setupAdminGuard(router)

// 动态设置页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 天枢 AI` : '天枢 AI - 智能未来'
  next()
})

export default router 