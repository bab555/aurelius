<template>
  <div class="min-h-screen bg-gray-100">
    <!-- 侧边导航 -->
    <aside class="fixed inset-y-0 left-0 z-50 w-64 bg-[#111827] overflow-y-auto transform md:translate-x-0 transition-transform duration-300 ease-in-out"
           :class="{'translate-x-0': isSidebarOpen, '-translate-x-full': !isSidebarOpen}">
      <div class="flex items-center justify-between h-16 px-4 border-b border-gray-700">
        <div class="flex items-center">
          <img src="/ui/img/logo.png" alt="天枢AI" class="h-8 w-auto mr-2">
          <span class="text-white font-semibold text-lg">天枢中台管理</span>
        </div>
        <button class="md:hidden p-2 text-gray-400 rounded-md hover:bg-gray-700" @click="toggleSidebar">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- 导航菜单 -->
      <nav class="mt-5 px-2">
        <router-link to="/admin" class="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white mb-1" exact>
          <i class="fas fa-tachometer-alt mr-3 text-gray-400 group-hover:text-gray-300"></i>
          仪表盘
        </router-link>
        
        <router-link to="/admin/users" class="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white mb-1">
          <i class="fas fa-users mr-3 text-gray-400 group-hover:text-gray-300"></i>
          用户管理
        </router-link>
        
        <router-link to="/admin/tasks" class="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white mb-1">
          <i class="fas fa-tasks mr-3 text-gray-400 group-hover:text-gray-300"></i>
          任务队列
        </router-link>
        
        <router-link to="/admin/load-balancer" class="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white mb-1">
          <i class="fas fa-balance-scale mr-3 text-gray-400 group-hover:text-gray-300"></i>
          负载均衡
        </router-link>
        
        <router-link to="/admin/system" class="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white mb-1">
          <i class="fas fa-cogs mr-3 text-gray-400 group-hover:text-gray-300"></i>
          系统配置
        </router-link>
        
        <div class="border-t border-gray-700 my-3"></div>
        
        <router-link to="/" class="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white mb-1">
          <i class="fas fa-arrow-left mr-3 text-gray-400 group-hover:text-gray-300"></i>
          返回前台
        </router-link>
      </nav>
    </aside>
    
    <!-- 主内容区 -->
    <div class="md:pl-64">
      <!-- 顶部导航 -->
      <header class="bg-white shadow">
        <div class="flex items-center justify-between h-16 px-4 md:px-8">
          <div class="flex items-center">
            <button class="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100" @click="toggleSidebar">
              <i class="fas fa-bars"></i>
            </button>
            <h1 class="ml-2 md:ml-0 text-lg font-semibold text-gray-900">{{ currentPageTitle }}</h1>
          </div>
          
          <div class="flex items-center">
            <div class="relative">
              <button class="flex items-center text-gray-500 hover:text-gray-700 focus:outline-none" @click="toggleUserMenu">
                <img class="h-8 w-8 rounded-full object-cover" :src="userStore.user?.avatar_url || 'https://i.pravatar.cc/150?img=68'" alt="用户头像">
                <span class="ml-2 hidden md:block">{{ userStore.user?.username || 'Admin' }}</span>
                <i class="fas fa-chevron-down ml-1 text-xs"></i>
              </button>
              
              <!-- 用户菜单 -->
              <div v-if="isUserMenuOpen" class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1">
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">个人资料</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">设置</a>
                <div class="border-t border-gray-100"></div>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" @click.prevent="logout">退出登录</a>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <!-- 主要内容 -->
      <main class="flex-1">
        <div class="py-6 px-4 sm:px-6 lg:px-8">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 侧边栏状态
const isSidebarOpen = ref(false)
const isUserMenuOpen = ref(false)

// 计算当前页面标题
const currentPageTitle = computed(() => {
  return route.meta.title || '管理中台'
})

// 切换侧边栏
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

// 切换用户菜单
const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

// 退出登录
const logout = async () => {
  await userStore.logoutUser()
  router.push('/')
}

// 点击外部关闭下拉菜单
const closeMenuOnClickOutside = (event) => {
  if (isUserMenuOpen.value && !event.target.closest('.relative')) {
    isUserMenuOpen.value = false
  }
}

// 监听点击事件
onMounted(() => {
  document.addEventListener('click', closeMenuOnClickOutside)
  
  // 在小屏幕上默认关闭侧边栏
  const handleResize = () => {
    if (window.innerWidth < 768) {
      isSidebarOpen.value = false
    } else {
      isSidebarOpen.value = true
    }
  }
  
  window.addEventListener('resize', handleResize)
  handleResize() // 初始化
  
  // 如果用户不是管理员，重定向到首页
  if (!userStore.isAdmin) {
    router.push('/')
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenuOnClickOutside)
  window.removeEventListener('resize', handleResize)
})
</script> 