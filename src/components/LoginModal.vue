<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black bg-opacity-70" @click="closeModal"></div>
    
    <!-- 登录表单 -->
    <div class="relative bg-[#111030] w-full max-w-md rounded-xl shadow-2xl p-8 transform transition-all">
      <div class="absolute top-4 right-4">
        <button @click="closeModal" class="text-gray-400 hover:text-white">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <h2 class="text-2xl font-bold text-white mb-6 text-center">登录天枢 AI</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="mb-5">
          <label for="email" class="block text-sm font-medium text-gray-300 mb-2">邮箱</label>
          <input 
            type="email" 
            id="email" 
            v-model="email"
            class="w-full px-4 py-3 bg-[#1A1938] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="请输入邮箱地址"
            required
          >
        </div>
        
        <div class="mb-6">
          <label for="password" class="block text-sm font-medium text-gray-300 mb-2">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="password"
            class="w-full px-4 py-3 bg-[#1A1938] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="请输入密码"
            required
          >
          <div class="flex justify-end mt-2">
            <a href="#" class="text-sm text-primary hover:text-blue-400">忘记密码？</a>
          </div>
        </div>
        
        <button 
          type="submit"
          class="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-lg hover:brightness-110 transition-all duration-300"
        >
          登录
        </button>
        
        <div class="mt-6 text-center">
          <p class="text-gray-400">还没有账号？ <a href="#" class="text-primary hover:text-blue-400">立即注册</a></p>
        </div>
        
        <div class="mt-8">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-700"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="px-3 bg-[#111030] text-gray-400 text-sm">或通过以下方式登录</span>
            </div>
          </div>
          
          <div class="mt-4 flex justify-center space-x-4">
            <button class="p-3 bg-[#1A1938] rounded-full hover:bg-opacity-80">
              <i class="fab fa-weixin text-green-500"></i>
            </button>
            <button class="p-3 bg-[#1A1938] rounded-full hover:bg-opacity-80">
              <i class="fab fa-qq text-blue-500"></i>
            </button>
            <button class="p-3 bg-[#1A1938] rounded-full hover:bg-opacity-80">
              <i class="fab fa-github text-white"></i>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 属性和事件
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'login'])

// 表单数据
const email = ref('')
const password = ref('')

// 关闭模态框
const closeModal = () => {
  emit('close')
}

// 提交表单
const handleSubmit = () => {
  // 这里将来会连接到实际的后端登录API
  emit('login', {
    email: email.value,
    password: password.value
  })
  
  // 清空表单
  email.value = ''
  password.value = ''
  
  // 关闭模态框
  closeModal()
}
</script> 