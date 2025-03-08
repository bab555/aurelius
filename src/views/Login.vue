<template>
  <div class="min-h-screen flex flex-col bg-[#04031e]">
    <div class="flex-1 flex items-center justify-center">
      <div class="bg-white/10 p-8 rounded-lg shadow-lg w-full max-w-md backdrop-blur-md">
        <div class="text-center mb-8">
          <img src="/ui/img/logo.png" alt="天枢AI" class="h-16 mx-auto mb-4">
          <h1 class="text-2xl font-bold text-white">登录您的账户</h1>
          <p class="text-gray-400 mt-2">欢迎回来，请登录您的账户</p>
        </div>
        
        <form @submit.prevent="handleLogin">
          <div class="mb-5">
            <label for="username" class="block text-sm font-medium text-gray-300 mb-1">用户名</label>
            <input 
              type="text" 
              id="username" 
              v-model="username"
              class="w-full px-4 py-2 rounded bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="输入用户名"
              required
            >
          </div>
          
          <div class="mb-6">
            <label for="password" class="block text-sm font-medium text-gray-300 mb-1">密码</label>
            <input 
              type="password" 
              id="password" 
              v-model="password"
              class="w-full px-4 py-2 rounded bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="输入密码"
              required
            >
          </div>
          
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center">
              <input type="checkbox" id="remember" class="h-4 w-4 rounded bg-white/5 border-white/10 focus:ring-primary">
              <label for="remember" class="ml-2 text-sm text-gray-400">记住我</label>
            </div>
            <a href="#" class="text-sm text-primary hover:underline">忘记密码？</a>
          </div>
          
          <button 
            type="submit" 
            class="w-full bg-primary text-white py-2 px-4 rounded focus:outline-none hover:bg-primary/90 transition-colors"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <i class="fas fa-spinner fa-spin mr-2"></i> 登录中...
            </span>
            <span v-else>登录</span>
          </button>
          
          <div v-if="error" class="mt-4 p-3 bg-red-500/20 text-red-200 rounded text-sm">{{ error }}</div>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-gray-400 text-sm">
            还没有账户？ 
            <router-link to="/register" class="text-primary hover:underline">立即注册</router-link>
          </p>
        </div>
      </div>
    </div>
    
    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import Footer from '../components/Footer.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 状态
const username = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')

// 处理登录
const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  
  isLoading.value = true
  error.value = ''
  
  try {
    await userStore.loginUser({
      username: username.value,
      password: password.value
    })
    
    const redirectPath = route.query.redirect || '/home'
    router.push(redirectPath)
  } catch (err) {
    error.value = err.message || '登录失败，请检查您的用户名和密码'
  } finally {
    isLoading.value = false
  }
}
</script> 