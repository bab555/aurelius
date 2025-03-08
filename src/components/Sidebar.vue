<template>
  <div class="sidebar-component h-full">
    <!-- 移动端菜单按钮 -->
    <button 
      @click="isMenuOpen = !isMenuOpen" 
      class="md:hidden fixed top-6 left-6 z-[1000] w-10 h-10 bg-primary/20 text-white rounded-lg flex items-center justify-center"
    >
      <i :class="isMenuOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
    </button>
    
    <!-- 移动端菜单遮罩 -->
    <div 
      v-if="isMenuOpen" 
      class="fixed inset-0 bg-black/70 z-[900] md:hidden"
      @click="isMenuOpen = false"
    ></div>
    
    <!-- 侧边导航 -->
    <nav 
      class="w-72 md:w-60 bg-[#04031e] h-full flex flex-col z-[9999] transition-all duration-300 shadow-xl"
      :class="{'translate-x-0': isMenuOpen, '-translate-x-full': !isMenuOpen, 'md:translate-x-0': true}"
    >
      <!-- Logo -->
      <div class="p-6 flex-shrink-0">
        <h1 class="text-white ml-1">
          <a href="/" class="block pointer-events-auto" @click.prevent="handleNavClick('/')">
            <img src="/ui/img/logo.png" alt="天枢AI">
          </a>
        </h1>
      </div>
      
      <!-- 导航菜单 - 使用独立滚动区域 -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll pointer-events-auto min-h-0">
        <div class="px-4 space-y-2 pb-6">
          <a 
            href="/home" 
            class="nav-item flex items-center text-gray-300 px-4 py-3 rounded-lg hover:text-white" 
            :class="{'nav-item-on': currentPath === '/home'}"
            @click.prevent="handleNavClick('/home', $event)"
          >
            <i class="fas fa-home w-6 h-6 flex items-center justify-center"></i>
            <span class="ml-3">首页</span>
          </a>
          
          <!-- 天枢助手选项 -->
          <a 
            href="/assistant" 
            class="nav-item flex items-center text-gray-300 px-4 py-3 rounded-lg hover:text-white" 
            :class="{'nav-item-on': currentPath === '/assistant'}"
            @click.prevent="handleNavClick('/assistant', $event)"
          >
            <i class="fas fa-robot w-6 h-6 flex items-center justify-center"></i>
            <span class="ml-3">天枢助手</span>
          </a>
          
          <!-- 添加更多导航项以确保滚动条显示 -->
          <div class="space-y-2">
            <div class="nav-item text-gray-300 px-4 py-3 rounded-lg hover:text-white cursor-pointer flex items-center">
              <i class="fas fa-wand-magic-sparkles w-6 h-6 flex items-center justify-center"></i>
              <span class="ml-3">AI 工具</span>
            </div>
            
            <div class="ml-8 space-y-2">
              <a 
                href="/chat" 
                class="text-gray-400 hover:text-white block py-2 flex items-center pointer-events-auto" 
                :class="{'text-primary': currentPath === '/chat'}"
                @click.prevent="handleNavClick('/chat', $event)"
              >
                <i class="far fa-edit w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>AI 方案助手</span>
              </a>
              <a href="#" class="text-gray-400 hover:text-white block py-2 flex items-center">
                <i class="far fa-commenting w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>AI 文生图</span>
              </a>
              <a href="#" class="text-gray-400 hover:text-white block py-2 flex items-center">
                <i class="far fa-image w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>AI 修图</span>
              </a>
              <a href="#" class="text-gray-400 hover:text-white block py-2 flex items-center">
                <i class="fas fa-film w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>AI 视频</span>
              </a>
              <a href="#" class="text-gray-400 hover:text-white block py-2 flex items-center">
                <i class="far fa-file-powerpoint w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>AI PPT 助手</span>
              </a>
              <a href="#" class="text-gray-400 hover:text-white block py-2 flex items-center">
                <i class="far fa-hdd w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>AI 文字游戏</span>
              </a>
            </div>
          </div>
          
          <div class="space-y-2">
            <div class="nav-item text-gray-300 px-4 py-3 rounded-lg hover:text-white cursor-pointer flex items-center">
              <i class="fas fa-info-circle w-6 h-6 flex items-center justify-center"></i>
              <span class="ml-3">了解我们</span>
            </div>
            
            <div class="ml-8 space-y-2">
              <a 
                href="/about" 
                class="text-gray-400 hover:text-white block py-2 flex items-center pointer-events-auto" 
                :class="{'text-primary': currentPath === '/about'}"
                @click.prevent="handleNavClick('/about', $event)"
              >
                <i class="fas fa-question-circle w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>关于天枢</span>
              </a>
              <a href="#" class="text-gray-400 hover:text-white block py-2 flex items-center">
                <i class="fas fa-users w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>团队成员</span>
              </a>
              <a href="#" class="text-gray-400 hover:text-white block py-2 flex items-center">
                <i class="fas fa-hands-helping w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>联系我们</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 底部功能区 - 固定在底部 -->
      <div class="p-6 border-t border-white/5 flex-shrink-0">
        <div class="flex items-center text-gray-400 text-sm">
          <i class="fas fa-user-circle text-lg mr-2"></i>
          <span>未登录</span>
          <span class="ml-auto">
            <button class="bg-primary/20 hover:bg-primary/30 text-white px-3 py-1 rounded-md text-xs">
              登录
            </button>
          </span>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const isMenuOpen = ref(false)

// 当前路由路径
const currentPath = computed(() => route.path)

// 移动端点击导航链接后关闭菜单
const closeMenuOnMobile = () => {
  // 只在移动端关闭菜单
  if (window.innerWidth < 768) {
    isMenuOpen.value = false
  }
}

// 处理导航点击，使用编程方式导航
const handleNavClick = (route, event) => {
  // 阻止默认行为，防止与路由跳转冲突
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  console.log('导航点击:', route);
  
  // 在移动端关闭菜单
  closeMenuOnMobile();
  
  // 清除可能的滚动定时器
  if (window._scrollTimers) {
    window._scrollTimers.forEach(timer => clearTimeout(timer));
    window._scrollTimers = [];
  }
  
  // 使用延迟的编程式导航
  setTimeout(() => {
    try {
      router.push(route).catch(err => {
        console.error('导航失败:', err);
      });
    } catch (e) {
      console.error('路由跳转错误:', e);
    }
  }, 10);
}

// 添加全局点击事件来处理任何导航问题
onMounted(() => {
  // 防止全局变量污染
  if (!window._scrollTimers) {
    window._scrollTimers = [];
  }
  
  // 确保导航链接可点击
  const makeLinksClickable = () => {
    const links = document.querySelectorAll('.sidebar-component a');
    links.forEach(link => {
      // 设置样式
      link.style.pointerEvents = 'auto';
      link.style.cursor = 'pointer';
      link.style.zIndex = '10000';
      link.setAttribute('tabindex', '0');
      
      // 移除旧事件监听器
      const oldClone = link.cloneNode(true);
      link.parentNode.replaceChild(oldClone, link);
    });
  }
  
  // 立即执行一次
  makeLinksClickable();
  
  // 页面加载后再次执行
  window._scrollTimers.push(setTimeout(makeLinksClickable, 500));
  
  // 在窗口大小变化时重新执行
  window.addEventListener('resize', makeLinksClickable);
})
</script>

<style scoped>
.nav-item-on {
  background: rgba(255,255,255,0.08);
}

.nav-item-on i, .nav-item-on span {
  color: #829fff !important;
}

/* 增强导航元素的可点击性 */
.sidebar-component a, 
.sidebar-component button {
  cursor: pointer !important;
  pointer-events: auto !important;
  position: relative;
  z-index: 11000 !important; /* 使用更高的z-index确保优先级 */
  backface-visibility: hidden; /* 减少渲染问题 */
  will-change: transform; /* 优化动画性能 */
}

.sidebar-component {
  position: relative;
  z-index: 10000;
  transform: translateZ(0); /* 启用GPU加速 */
  will-change: transform; /* 优化动画性能 */
  isolation: isolate; /* 创建新的堆叠上下文 */
  display: flex;
  flex-direction: column;
}

/* 确保弹出菜单正常工作 */
.nav-item {
  isolation: isolate; /* 创建新的堆叠上下文 */
  position: relative;
}

/* 侧边栏滚动区域样式 */
.sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.sidebar-scroll::-webkit-scrollbar {
  width: 4px;
}

.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.3);
}
</style> 