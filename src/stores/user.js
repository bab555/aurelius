import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, logout, getCurrentUser } from '../services/auth'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)
  const error = ref(null)
  
  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'superadmin')
  const apiUsage = computed(() => user.value?.api_usage || 0)
  const apiQuota = computed(() => user.value?.api_quota || 100)
  
  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    if (!token.value) return null
    
    loading.value = true
    
    try {
      const userData = await getCurrentUser()
      user.value = userData
      return userData
    } catch (err) {
      error.value = err.message || '获取用户信息失败'
      clearUserInfo()
      return null
    } finally {
      loading.value = false
    }
  }
  
  // 用户登录
  const loginUser = async (credentials) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await login(credentials)
      token.value = response.token
      localStorage.setItem('token', response.token)
      await fetchCurrentUser()
      return true
    } catch (err) {
      error.value = err.message || '登录失败'
      return false
    } finally {
      loading.value = false
    }
  }
  
  // 用户注册
  const registerUser = async (userData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await register(userData)
      token.value = response.token
      localStorage.setItem('token', response.token)
      await fetchCurrentUser()
      return true
    } catch (err) {
      error.value = err.message || '注册失败'
      return false
    } finally {
      loading.value = false
    }
  }
  
  // 用户登出
  const logoutUser = async () => {
    try {
      if (token.value) {
        await logout()
      }
    } catch (err) {
      console.error('注销失败', err)
    } finally {
      clearUserInfo()
    }
  }
  
  function clearUserInfo() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }
  
  // 模拟用户数据（实际项目应通过API获取）
  function initMockUser() {
    // 仅在开发环境下使用
    if (import.meta.env.DEV && !user.value) {
      user.value = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        avatar_url: 'https://i.pravatar.cc/150?img=68',
        api_quota: 1000,
        api_usage: 120
      }
    }
  }
  
  // 初始化
  if (token.value) {
    fetchCurrentUser()
  } else {
    // 开发环境下模拟用户数据
    if (import.meta.env.DEV) {
      initMockUser()
    }
  }
  
  return {
    user,
    token,
    loading,
    error,
    isLoggedIn,
    isAdmin,
    apiUsage,
    apiQuota,
    loginUser,
    registerUser,
    logoutUser,
    fetchCurrentUser,
    clearUserInfo,
    initMockUser
  }
}) 