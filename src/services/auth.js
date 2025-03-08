/**
 * 认证相关API服务
 */
import { get, post } from './api'

/**
 * 用户登录
 * @param {Object} credentials - 登录凭证
 * @param {string} credentials.email - 用户邮箱
 * @param {string} credentials.password - 用户密码
 * @returns {Promise<Object>} - 登录结果
 */
export const login = async (credentials) => {
  // 在实际项目中，应该调用后端API
  // return await post('/auth/login', credentials)
  
  // 模拟API请求
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟用户验证
      if (credentials.email === 'admin@example.com' && credentials.password === 'admin123') {
        resolve({
          token: 'mock_admin_token_12345',
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin',
            avatar_url: 'https://i.pravatar.cc/150?img=68',
            api_quota: 1000,
            api_usage: 120
          }
        })
      } else if (credentials.email === 'user@example.com' && credentials.password === 'user123') {
        resolve({
          token: 'mock_user_token_67890',
          user: {
            id: 2,
            username: 'user',
            email: 'user@example.com',
            role: 'user',
            avatar_url: 'https://i.pravatar.cc/150?img=33',
            api_quota: 100,
            api_usage: 15
          }
        })
      } else {
        reject({ message: '邮箱或密码错误' })
      }
    }, 800)
  })
}

/**
 * 用户注册
 * @param {Object} userData - 用户数据
 * @param {string} userData.username - 用户名
 * @param {string} userData.email - 用户邮箱
 * @param {string} userData.password - 用户密码
 * @returns {Promise<Object>} - 注册结果
 */
export const register = async (userData) => {
  // 在实际项目中，应该调用后端API
  // return await post('/auth/register', userData)
  
  // 模拟API请求
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟邮箱已存在检查
      if (userData.email === 'admin@example.com' || userData.email === 'user@example.com') {
        reject({ message: '该邮箱已被注册' })
      } else {
        resolve({
          token: 'mock_new_user_token_13579',
          user: {
            id: 3,
            username: userData.username || userData.email.split('@')[0],
            email: userData.email,
            role: 'user',
            avatar_url: 'https://i.pravatar.cc/150?img=46',
            api_quota: 100,
            api_usage: 0
          }
        })
      }
    }, 800)
  })
}

/**
 * 获取当前用户信息
 * @returns {Promise<Object>} - 用户信息
 */
export const getCurrentUser = async () => {
  // 在实际项目中，应该调用后端API
  // return await get('/user/profile')
  
  // 模拟API请求
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        reject({ message: '未授权' })
        return
      }
      
      // 根据token模拟不同用户
      if (token === 'mock_admin_token_12345') {
        resolve({
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          avatar_url: 'https://i.pravatar.cc/150?img=68',
          api_quota: 1000,
          api_usage: 120
        })
      } else if (token === 'mock_user_token_67890') {
        resolve({
          id: 2,
          username: 'user',
          email: 'user@example.com',
          role: 'user',
          avatar_url: 'https://i.pravatar.cc/150?img=33',
          api_quota: 100,
          api_usage: 15
        })
      } else if (token === 'mock_new_user_token_13579') {
        resolve({
          id: 3,
          username: 'newuser',
          email: 'newuser@example.com',
          role: 'user',
          avatar_url: 'https://i.pravatar.cc/150?img=46',
          api_quota: 100,
          api_usage: 0
        })
      } else {
        reject({ message: '无效的令牌' })
      }
    }, 500)
  })
}

/**
 * 用户注销
 * @returns {Promise<void>}
 */
export const logout = async () => {
  // 在实际项目中，应该调用后端API
  // return await post('/auth/logout')
  
  // 模拟API请求
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, 300)
  })
}

/**
 * 请求密码重置
 * @param {string} email - 用户邮箱
 * @returns {Promise<Object>} - 重置结果
 */
export const requestPasswordReset = async (email) => {
  // 在实际项目中，应该调用后端API
  // return await post('/auth/password-reset/request', { email })
  
  // 模拟API请求
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 检查邮箱是否存在
      if (email === 'admin@example.com' || email === 'user@example.com') {
        resolve({ message: '密码重置链接已发送到您的邮箱' })
      } else {
        reject({ message: '该邮箱不存在' })
      }
    }, 800)
  })
} 