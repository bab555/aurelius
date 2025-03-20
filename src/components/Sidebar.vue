<template>
  <div class="sidebar-component h-full">
    <!-- 移动端菜单按钮 -->
    <button 
      @click="isMenuOpen = !isMenuOpen" 
      class="md:hidden fixed top-4 left-4 z-[1001] w-10 h-10 bg-primary/20 text-white rounded-lg flex items-center justify-center"
    >
      <i :class="isMenuOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
    </button>
    
    <!-- 移动端菜单遮罩 -->
    <div 
      v-if="isMenuOpen" 
      class="fixed inset-0 bg-black/80 z-[1000] md:hidden"
      @click="isMenuOpen = false"
    ></div>
    
    <!-- 侧边导航 -->
    <nav 
      class="w-72 md:w-60 bg-[#04031e] h-full flex flex-col z-[1000] transition-all duration-300 shadow-xl fixed md:relative left-0 top-0 transform"
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
          
          <!-- 天枢助手大类 -->
          <div class="space-y-2">
            <div 
              class="nav-item text-gray-300 px-4 py-3 rounded-lg hover:text-white cursor-pointer flex items-center justify-between"
              @click="toggleCategory('assistant')"
              :class="{'nav-item-on bg-primary/5': expandedCategories.assistant}"
            >
              <div class="flex items-center">
                <i class="fas fa-robot w-6 h-6 flex items-center justify-center"></i>
                <span class="ml-3">天枢助手</span>
              </div>
              <i :class="expandedCategories.assistant ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="text-xs"></i>
            </div>
            
            <div class="ml-8 space-y-2" v-show="expandedCategories.assistant">
              <a 
                href="/assistant/intelligent" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/assistant/intelligent'}"
                @click.prevent="handleNavClick('/assistant/intelligent', $event)"
              >
                <i class="fas fa-brain w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>智能助手</span>
              </a>
              <a 
                href="/assistant/solution" 
                class="text-gray-400 hover:text-white block py-2 flex items-center pointer-events-auto" 
                :class="{'text-primary': currentPath === '/assistant/solution'}"
                @click.prevent="handleNavClick('/assistant/solution', $event)"
              >
                <i class="far fa-edit w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>写作助手</span>
              </a>
              <a 
                href="/assistant/image" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/assistant/image'}"
                @click.prevent="handleNavClick('/assistant/image', $event)"
              >
                <i class="far fa-image w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>生图助手</span>
              </a>
              <a 
                href="/assistant/image-text" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/assistant/image-text'}"
                @click.prevent="handleNavClick('/assistant/image-text', $event)"
              >
                <i class="fas fa-file-image w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>图文助手</span>
              </a>
              <a 
                href="/assistant" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/assistant'}"
                @click.prevent="handleNavClick('/assistant', $event)"
              >
                <i class="fas fa-globe w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>文旅助手</span>
              </a>
              <a 
                href="/assistant/search" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/assistant/search'}"
                @click.prevent="handleNavClick('/assistant/search', $event)"
              >
                <i class="fas fa-search w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>搜索助手</span>
              </a>
              <a 
                href="/assistant/enterprise" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/assistant/enterprise'}"
                @click.prevent="handleNavClick('/assistant/enterprise', $event)"
              >
                <i class="fas fa-building w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>企业助手</span>
              </a>
              <a 
                href="/assistant/virtual" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/assistant/virtual'}"
                @click.prevent="handleNavClick('/assistant/virtual', $event)"
              >
                <i class="fas fa-headset w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>虚拟客服</span>
              </a>
            </div>
          </div>
          
          <!-- 智能工具集大类 -->
          <div class="space-y-2">
            <div 
              class="nav-item text-gray-300 px-4 py-3 rounded-lg hover:text-white cursor-pointer flex items-center justify-between"
              @click="toggleCategory('tools')"
              :class="{'nav-item-on bg-primary/5': expandedCategories.tools}"
            >
              <div class="flex items-center">
                <i class="fas fa-wand-magic-sparkles w-6 h-6 flex items-center justify-center"></i>
                <span class="ml-3">智能工具集</span>
              </div>
              <i :class="expandedCategories.tools ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="text-xs"></i>
            </div>
            
            <div class="ml-8 space-y-2" v-show="expandedCategories.tools">
              <a 
                href="/tools/photo-restoration" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/tools/photo-restoration'}"
                @click.prevent="handleNavClick('/tools/photo-restoration', $event)"
              >
                <i class="fas fa-camera-retro w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>图像处理</span>
              </a>
              <a 
                href="/tools/voice-synthesis" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/tools/voice-synthesis'}"
                @click.prevent="handleNavClick('/tools/voice-synthesis', $event)"
              >
                <i class="fas fa-microphone-alt w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>语音合成</span>
              </a>
              <a 
                href="/tools/text-to-video" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/tools/text-to-video'}"
                @click.prevent="handleNavClick('/tools/text-to-video', $event)"
              >
                <i class="fas fa-film w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>文生视频</span>
              </a>
              <a 
                href="/tools/translation" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/tools/translation'}"
                @click.prevent="handleNavClick('/tools/translation', $event)"
              >
                <i class="fas fa-language w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>翻译工具</span>
              </a>
              <a 
                href="/tools/image-recognition" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/tools/image-recognition'}"
                @click.prevent="handleNavClick('/tools/image-recognition', $event)"
              >
                <i class="fas fa-eye w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>图片识别</span>
              </a>
              <a 
                href="/tools/digital-human" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/tools/digital-human'}"
                @click.prevent="handleNavClick('/tools/digital-human', $event)"
              >
                <i class="fas fa-user-circle w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>图片数字人</span>
              </a>
              <a 
                href="/tools/virtual-try-on" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/tools/virtual-try-on'}"
                @click.prevent="handleNavClick('/tools/virtual-try-on', $event)"
              >
                <i class="fas fa-tshirt w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>虚拟试穿</span>
              </a>
              <a 
                href="/tools/nail-try-on" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/tools/nail-try-on'}"
                @click.prevent="handleNavClick('/tools/nail-try-on', $event)"
              >
                <i class="fas fa-hand-sparkles w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>美甲试穿</span>
              </a>
            </div>
          </div>
          
          <!-- 观星阁选项 -->
          <div class="space-y-2">
            <div 
              class="nav-item text-gray-300 px-4 py-3 rounded-lg hover:text-white cursor-pointer flex items-center justify-between"
              @click="toggleCategory('astrology')"
              :class="{'nav-item-on bg-primary/5': expandedCategories.astrology}"
            >
              <div class="flex items-center">
                <i class="fas fa-star w-6 h-6 flex items-center justify-center"></i>
                <span class="ml-3">观星阁</span>
              </div>
              <i :class="expandedCategories.astrology ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="text-xs"></i>
            </div>
            
            <div class="ml-8 space-y-2" v-show="expandedCategories.astrology">
              <a 
                href="/astrology/destiny" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/astrology/destiny'}"
                @click.prevent="handleNavClick('/astrology/destiny', $event)"
              >
                <i class="fas fa-moon w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>命理</span>
              </a>
              <a 
                href="/astrology/feng-shui" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/astrology/feng-shui'}"
                @click.prevent="handleNavClick('/astrology/feng-shui', $event)"
              >
                <i class="fas fa-compass w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>风水</span>
              </a>
              <a 
                href="/astrology/divination" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/astrology/divination'}"
                @click.prevent="handleNavClick('/astrology/divination', $event)"
              >
                <i class="fas fa-book w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>卦师</span>
              </a>
              <a 
                href="/astrology/ziwei-doushu" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/astrology/ziwei-doushu'}"
                @click.prevent="handleNavClick('/astrology/ziwei-doushu', $event)"
              >
                <i class="fas fa-dice w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>斗数</span>
              </a>
              <a 
                href="/astrology/tianji" 
                class="text-gray-400 hover:text-white block py-2 flex items-center"
                :class="{'text-primary': currentPath === '/astrology/tianji'}"
                @click.prevent="handleNavClick('/astrology/tianji', $event)"
              >
                <i class="fas fa-cloud w-5 h-5 flex items-center justify-center mr-2"></i>
                <span>天机</span>
              </a>
            </div>
          </div>
          
          <div class="space-y-2">
            <div 
              class="nav-item text-gray-300 px-4 py-3 rounded-lg hover:text-white cursor-pointer flex items-center justify-between"
              @click="toggleCategory('about')"
              :class="{'nav-item-on bg-primary/5': expandedCategories.about}"
            >
              <div class="flex items-center">
                <i class="fas fa-info-circle w-6 h-6 flex items-center justify-center"></i>
                <span class="ml-3">了解我们</span>
              </div>
              <i :class="expandedCategories.about ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="text-xs"></i>
            </div>
            
            <div class="ml-8 space-y-2" v-show="expandedCategories.about">
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
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const isMenuOpen = ref(false)

// 当前路由路径
const currentPath = computed(() => route.path)

// 各大类展开状态
const expandedCategories = reactive({
  assistant: true, // 默认展开第一个分类
  tools: false,
  astrology: false,
  about: false
})

// 切换分类展开状态
const toggleCategory = (category) => {
  expandedCategories[category] = !expandedCategories[category]
}

// 根据当前路径自动展开分类
const autoExpandCategory = () => {
  const path = currentPath.value
  
  if (path.startsWith('/assistant')) {
    expandedCategories.assistant = true
  } else if (path.startsWith('/tools')) {
    expandedCategories.tools = true
  } else if (path.startsWith('/astrology')) {
    expandedCategories.astrology = true
  } else if (path === '/about') {
    expandedCategories.about = true
  }
}

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
  
  // 根据当前路径自动展开分类
  autoExpandCategory();
  
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
  z-index: 1 !important; /* 降低z-index避免层级过高 */
  backface-visibility: hidden; /* 减少渲染问题 */
  will-change: transform; /* 优化动画性能 */
  -webkit-tap-highlight-color: transparent; /* 移除移动端点击高亮 */
  touch-action: manipulation; /* 改善触摸体验 */
}

.sidebar-component {
  position: relative;
  z-index: 1000;
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
  transition: all 0.2s ease;
}

/* 侧边栏滚动区域样式 */
.sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  -webkit-overflow-scrolling: touch; /* 改善iOS滚动体验 */
}

.sidebar-scroll::-webkit-scrollbar {
  width: 4px;
}

/* 移动端优化样式 */
@media (max-width: 767px) {
  .sidebar-component nav {
    box-shadow: 0 0 20px rgba(0,0,0,0.5);
  }
}
</style> 