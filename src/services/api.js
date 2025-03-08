/**
 * API服务基础配置
 */

import axios from 'axios'
import { useUserStore } from '../stores/user'

// 创建axios实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证令牌
apiClient.interceptors.request.use(
  config => {
    // 尝试从pinia获取token (在setup外无法直接使用useUserStore)
    const token = localStorage.getItem('token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理常见错误
apiClient.interceptors.response.use(
  response => {
    // 如果响应包含data，直接返回data
    return response.data
  },
  error => {
    // 处理常见错误
    if (error.response) {
      // 服务器返回错误状态码
      switch (error.response.status) {
        case 401: // 未授权
          // 如果在组件中，可以使用useUserStore，这里暂时不处理
          localStorage.removeItem('token')
          break
        case 403: // 禁止访问
          console.error('您没有权限访问此资源')
          break
        case 404: // 资源不存在
          console.error('请求的资源不存在')
          break
        case 500: // 服务器错误
          console.error('服务器错误，请稍后再试')
          break
        default:
          console.error(`未知错误: ${error.response.status}`)
      }
      
      return Promise.reject(error.response.data)
    } else if (error.request) {
      // 请求已发送但未收到响应
      console.error('网络连接失败，请检查您的网络连接')
      return Promise.reject({ message: '网络连接失败，请检查您的网络连接' })
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message)
      return Promise.reject({ message: error.message })
    }
  }
)

// 封装GET请求
export const get = async (url, params = {}, config = {}) => {
  try {
    return await apiClient.get(url, { params, ...config })
  } catch (error) {
    throw error
  }
}

// 封装POST请求
export const post = async (url, data = {}, config = {}) => {
  try {
    return await apiClient.post(url, data, config)
  } catch (error) {
    throw error
  }
}

// 封装PUT请求
export const put = async (url, data = {}, config = {}) => {
  try {
    return await apiClient.put(url, data, config)
  } catch (error) {
    throw error
  }
}

// 封装DELETE请求
export const del = async (url, config = {}) => {
  try {
    return await apiClient.delete(url, config)
  } catch (error) {
    throw error
  }
}

export default {
  get,
  post,
  put,
  delete: del
} 