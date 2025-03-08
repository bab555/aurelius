import { useUserStore } from '../stores/user'

const adminRoutes = [
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAdmin: true, title: '管理中台' },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('../views/admin/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('../views/admin/UserManagement.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'tasks',
        name: 'admin-tasks',
        component: () => import('../views/admin/TaskQueue.vue'),
        meta: { title: '任务队列' }
      },
      {
        path: 'system',
        name: 'admin-system',
        component: () => import('../views/admin/SystemConfig.vue'),
        meta: { title: '系统配置' }
      },
      {
        path: 'load-balancer',
        name: 'admin-load-balancer',
        component: () => import('../views/admin/LoadBalancer.vue'),
        meta: { title: '负载均衡' }
      }
    ]
  }
]

// 导航守卫中间件
export function setupAdminGuard(router) {
  router.beforeEach((to, from, next) => {
    const userStore = useUserStore()
    
    if (to.matched.some(record => record.meta.requiresAdmin)) {
      if (!userStore.isLoggedIn) {
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
      } else if (!userStore.isAdmin) {
        next({ path: '/forbidden' })
      } else {
        next()
      }
    } else {
      next()
    }
  })
}

export default adminRoutes 