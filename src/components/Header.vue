<template>
  <header class="h-[88px] bg-[#04031e] fixed right-0 left-64 z-10 flex items-center justify-between px-7">
    <!-- 添加防刷新控制开关 -->
    <div class="flex items-center">
      <div class="flex items-center space-x-4">
        <div class="relative inline-block w-10 h-5 mr-2">
          <input 
            type="checkbox" 
            :checked="preventAutoRefresh" 
            @change="toggleAutoRefreshProtection"
            id="auto-refresh-toggle" 
            class="opacity-0 w-0 h-0"
          />
          <label 
            for="auto-refresh-toggle" 
            class="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-600 rounded-full transition-all duration-300"
            :class="{'bg-primary': preventAutoRefresh}"
          >
            <span 
              class="absolute left-0.5 bottom-0.5 bg-white w-4 h-4 rounded-full transition-all duration-300"
              :class="{'translate-x-5': preventAutoRefresh}"
            ></span>
          </label>
        </div>
        <span class="text-sm text-gray-300">{{ preventAutoRefresh ? '已禁止自动刷新' : '允许自动刷新' }}</span>
      </div>
    </div>
    
    <template v-if="userStore.isLoggedIn">
      <div class="flex items-center">
        <div class="mr-4 text-white">
          <span>欢迎，{{ userStore.user.name }}</span>
        </div>
        <div class="relative group">
          <button class="w-10 h-10 rounded-full overflow-hidden focus:outline-none">
            <img :src="userStore.user.avatar" alt="用户头像" class="w-full h-full object-cover">
          </button>
          
          <!-- 下拉菜单 -->
          <div class="absolute right-0 top-full mt-2 w-48 bg-[#111030] rounded-lg shadow-lg overflow-hidden z-20 invisible group-hover:visible transition-all opacity-0 group-hover:opacity-100">
            <div class="py-2">
              <a href="#" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10">个人中心</a>
              <a href="#" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10">我的作品</a>
              <a href="#" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10">设置</a>
              <div class="border-t border-gray-700 my-1"></div>
              <button 
                @click="handleLogout" 
                class="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <button 
      v-else
      @click="openLoginModal"
      class="rounded-[6px] px-8 h-[40px] bg-gradient-to-r from-primary to-secondary text-white font-medium hover:brightness-110 transition-all duration-300 whitespace-nowrap"
    >
      登录
    </button>
    
    <!-- 登录模态框 -->
    <LoginModal 
      :is-open="isLoginModalOpen" 
      @close="closeLoginModal"
      @login="handleLogin"
    />
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import LoginModal from './LoginModal.vue'
import { getAutoRefreshProtectionStatus, setAutoRefreshProtectionStatus } from '../services/refreshProtection'

// 使用用户状态存储
const userStore = useUserStore()

// 登录模态框状态
const isLoginModalOpen = ref(false)

// 防刷新状态
const preventAutoRefresh = ref(true)

// 组件挂载时获取当前防刷新状态
onMounted(() => {
  preventAutoRefresh.value = getAutoRefreshProtectionStatus()
})

// 切换防刷新保护状态
const toggleAutoRefreshProtection = () => {
  preventAutoRefresh.value = !preventAutoRefresh.value
  setAutoRefreshProtectionStatus(preventAutoRefresh.value)
}

// 打开登录模态框
const openLoginModal = () => {
  isLoginModalOpen.value = true
}

// 关闭登录模态框
const closeLoginModal = () => {
  isLoginModalOpen.value = false
}

// 处理登录事件
const handleLogin = async (credentials) => {
  const success = await userStore.loginUser(credentials)
  if (success) {
    closeLoginModal()
  }
}

// 处理登出事件
const handleLogout = async () => {
  await userStore.logoutUser()
}
</script> 