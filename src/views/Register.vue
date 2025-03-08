<template>
  <div class="min-h-screen flex flex-col bg-[#04031e]">
    <div class="flex-1 flex items-center justify-center">
      <div class="bg-white/10 p-8 rounded-lg shadow-lg w-full max-w-md backdrop-blur-md">
        <div class="text-center mb-8">
          <img src="/ui/img/logo.png" alt="天枢AI" class="h-16 mx-auto mb-4">
          <h1 class="text-2xl font-bold text-white">创建您的账户</h1>
          <p class="text-gray-400 mt-2">加入天枢AI，开启智能之旅</p>
        </div>
        
        <form @submit.prevent="handleRegister">
          <div class="mb-5">
            <label for="username" class="block text-sm font-medium text-gray-300 mb-1">用户名</label>
            <input 
              type="text" 
              id="username" 
              v-model="username"
              class="w-full px-4 py-2 rounded bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="请设置用户名"
              required
            >
          </div>
          
          <div class="mb-5">
            <label for="email" class="block text-sm font-medium text-gray-300 mb-1">电子邮箱</label>
            <input 
              type="email" 
              id="email" 
              v-model="email"
              class="w-full px-4 py-2 rounded bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="请输入您的邮箱"
              required
            >
          </div>
          
          <div class="mb-5">
            <label for="password" class="block text-sm font-medium text-gray-300 mb-1">密码</label>
            <input 
              type="password" 
              id="password" 
              v-model="password"
              class="w-full px-4 py-2 rounded bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="请设置密码"
              required
            >
          </div>
          
          <div class="mb-6">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-1">确认密码</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="confirmPassword"
              class="w-full px-4 py-2 rounded bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="请再次输入密码"
              required
            >
          </div>
          
          <div class="flex items-center mb-6">
            <input type="checkbox" id="agree" v-model="agreeTerms" class="h-4 w-4 rounded bg-white/5 border-white/10 focus:ring-primary">
            <label for="agree" class="ml-2 text-sm text-gray-400">
              我已阅读并同意 <a href="#" class="text-primary hover:underline">服务条款</a> 和 <a href="#" class="text-primary hover:underline">隐私政策</a>
            </label>
          </div>
          
          <button 
            type="submit" 
            class="w-full bg-primary text-white py-2 px-4 rounded focus:outline-none hover:bg-primary/90 transition-colors"
            :disabled="isLoading || !agreeTerms"
            :class="{'opacity-50 cursor-not-allowed': !agreeTerms}"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <i class="fas fa-spinner fa-spin mr-2"></i> 注册中...
            </span>
            <span v-else>注册账户</span>
          </button>
          
          <div v-if="error" class="mt-4 p-3 bg-red-500/20 text-red-200 rounded text-sm">{{ error }}</div>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-gray-400 text-sm">
            已有账户？ 
            <router-link to="/login" class="text-primary hover:underline">立即登录</router-link>
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
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import Footer from '../components/Footer.vue'

const router = useRouter()
const userStore = useUserStore()

// 状态
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreeTerms = ref(false)
const isLoading = ref(false)
const error = ref('')

// 处理注册
const handleRegister = async () => {
  // 表单验证
  if (!username.value || !email.value || !password.value) {
    error.value = '请填写所有必填字段'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  
  if (!agreeTerms.value) {
    error.value = '请同意服务条款和隐私政策'
    return
  }
  
  isLoading.value = true
  error.value = ''
  
  try {
    await userStore.registerUser({
      username: username.value,
      email: email.value,
      password: password.value
    })
    
    // 注册成功后跳转到登录页
    router.push('/login?registered=true')
  } catch (err) {
    error.value = err.message || '注册失败，请稍后再试'
  } finally {
    isLoading.value = false
  }
}
</script> 