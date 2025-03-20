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
      component: () => import('../views/assistants/yunheAssistant.vue')
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
    // 天枢助手子页面
    {
      path: '/assistant/intelligent',
      name: 'intelligent-assistant',
      component: () => import('../views/assistants/IntelligentAssistant.vue')
    },
    {
      path: '/assistant/solution',
      name: 'writing-assistant',
      component: () => import('../views/assistants/SolutionAssistant.vue')
    },
    {
      path: '/assistant/image',
      name: 'image-assistant',
      component: () => import('../views/assistants/ImageAssistant.vue')
    },
    {
      path: '/assistant/image-text',
      name: 'image-text-assistant',
      component: () => import('../views/assistants/ImageTextAssistant.vue')
    },
    {
      path: '/assistant/travel',
      name: 'travel-assistant',
      redirect: '/assistant'
    },
    {
      path: '/assistant/search',
      name: 'search-assistant',
      component: () => import('../views/assistants/SearchAssistant.vue')
    },
    {
      path: '/assistant/enterprise',
      name: 'enterprise-assistant',
      component: () => import('../views/assistants/EnterpriseAssistant.vue')
    },
    {
      path: '/assistant/virtual',
      name: 'virtual-assistant',
      component: () => import('../views/assistants/VirtualAssistant.vue')
    },
    {
      path: '/assistant/translation',
      name: 'translation-assistant',
      component: () => import('../views/assistants/TranslationTool.vue')
    },
    // 智能工具集子页面
    {
      path: '/tools/photo-restoration',
      name: 'image-processing',
      component: () => import('../views/tools/PhotoRestoration.vue')
    },
    {
      path: '/tools/voice-synthesis',
      name: 'voice-synthesis',
      component: () => import('../views/tools/VoiceSynthesis.vue')
    },
    {
      path: '/tools/text-to-video',
      name: 'smart-video',
      component: () => import('../views/tools/TextToVideo.vue')
    },
    {
      path: '/tools/translation',
      name: 'translation-tool',
      redirect: '/assistant/translation'
    },
    {
      path: '/tools/image-recognition',
      name: 'image-recognition',
      component: () => import('../views/tools/ImageRecognition.vue')
    },
    {
      path: '/tools/digital-human',
      name: 'text-to-image',
      component: () => import('../views/tools/TextToImage.vue')
    },
    {
      path: '/tools/virtual-try-on',
      name: 'virtual-try-on',
      component: () => import('../views/tools/VirtualTryOn.vue')
    },
    {
      path: '/tools/nail-try-on',
      name: 'nail-try-on',
      component: () => import('../views/tools/NailTryOn.vue')
    },
    // 观星阁子页面
    {
      path: '/astrology/destiny',
      name: 'destiny',
      component: () => import('../views/astrology/Destiny.vue')
    },
    {
      path: '/astrology/feng-shui',
      name: 'feng-shui',
      component: () => import('../views/astrology/FengShui.vue')
    },
    {
      path: '/astrology/divination',
      name: 'divination',
      component: () => import('../views/astrology/Divination.vue')
    },
    {
      path: '/astrology/ziwei-doushu',
      name: 'ziwei-doushu',
      component: () => import('../views/astrology/ZiweiDoushu.vue')
    },
    {
      path: '/astrology/tianji',
      name: 'tianji',
      component: () => import('../views/astrology/Tianji.vue')
    },
    // 添加中台路由
    ...adminRoutes
  ]
})

// 设置中台权限守卫
setupAdminGuard(router)

// 添加导航守卫，防止在流式输出时跳转页面
router.beforeEach((to, from, next) => {
  if (window.streamingState && window.streamingState.shouldPreventRefresh()) {
    // 页面内部导航不拦截，仅拦截跳转到其他页面的行为
    if (to.path !== from.path) {
      const message = window.streamingState.isStreaming 
        ? '正在接收AI回复，离开页面将会中断消息并导致内容丢失。确定要继续吗？'
        : '重要结果正在显示中，离开页面将丢失当前结果。确定要继续吗？';
      const confirmed = window.confirm(message);
      if (confirmed) {
        // 用户确认要离开
        next();
      } else {
        // 用户取消离开
        next(false);
      }
    } else {
      next();
    }
  } else {
    next();
  }
});

// 动态设置页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 天枢 AI` : '天枢 AI - 智能未来'
  next()
})

export default router 