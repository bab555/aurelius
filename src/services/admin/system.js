import { get, post, put } from '../api'

/**
 * 获取负载均衡器状态
 * @returns {Promise<Object>} 负载均衡状态数据
 */
export const getLoadBalancerStatus = async () => {
  // 实际项目应该调用真实API
  // return await get('/admin/load-balancer/status')
  
  // 模拟API请求
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        maxConcurrent: 5,
        strategy: 'weighted',
        nodes: [
          { id: 1, url: 'http://localhost:3000', status: 'online', connections: 3, processed: 1250, cpu: 34, memory: 45 },
          { id: 2, url: 'http://localhost:3001', status: 'online', connections: 1, processed: 866, cpu: 28, memory: 37 },
          { id: 3, url: 'http://localhost:3002', status: 'degraded', connections: 6, processed: 422, cpu: 88, memory: 76 },
          { id: 4, url: 'http://localhost:3003', status: 'offline', connections: 0, processed: 155, cpu: 0, memory: 12 }
        ]
      })
    }, 500)
  })
}

/**
 * 保存负载均衡器配置
 * @param {Object} config - 负载均衡配置
 * @returns {Promise<Object>} 保存结果
 */
export const saveLoadBalancerConfig = async (config) => {
  // 实际项目应该调用真实API
  // return await post('/admin/load-balancer/config', config)
  
  // 模拟API请求
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('保存负载均衡配置:', config)
      resolve({ success: true, message: '配置已保存' })
    }, 500)
  })
}

/**
 * 切换节点状态
 * @param {number} nodeId - 节点ID
 * @param {string} status - 新状态 ('online', 'offline')
 * @returns {Promise<Object>} 操作结果
 */
export const changeNodeStatus = async (nodeId, status) => {
  // 实际项目应该调用真实API
  // return await post(`/admin/nodes/${nodeId}/status`, { status })
  
  // 模拟API请求
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`节点 ${nodeId} 状态已改变为 ${status}`)
      resolve({ success: true, message: '节点状态已更新' })
    }, 300)
  })
}

/**
 * 获取系统配置
 * @returns {Promise<Object>} 系统配置
 */
export const getSystemConfig = async () => {
  // 实际项目应该调用真实API
  // return await get('/admin/system/config')
  
  // 模拟API请求
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        taskRetryAttempts: 3,
        taskTimeout: 600, // 秒
        userRegisterEnabled: true,
        maintenanceMode: false,
        storageLimit: 1024, // MB
        allowedFileTypes: ['jpg', 'png', 'gif', 'mp4', 'pdf'],
        logLevel: 'info'
      })
    }, 500)
  })
}

/**
 * 保存系统配置
 * @param {Object} config - 系统配置
 * @returns {Promise<Object>} 保存结果
 */
export const saveSystemConfig = async (config) => {
  // 实际项目应该调用真实API
  // return await put('/admin/system/config', config)
  
  // 模拟API请求
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('保存系统配置:', config)
      resolve({ success: true, message: '系统配置已更新' })
    }, 500)
  })
}

/**
 * 获取系统状态
 * @returns {Promise<Object>} 系统状态
 */
export const getSystemStatus = async () => {
  // 实际项目应该调用真实API
  // return await get('/admin/system/status')
  
  // 模拟API请求
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        uptime: 1209600, // 秒，约14天
        version: '1.0.0',
        cpu: 45, // 百分比
        memory: {
          total: 16384, // MB
          used: 8192, // MB
          free: 8192 // MB
        },
        disk: {
          total: 500, // GB
          used: 125, // GB
          free: 375 // GB
        },
        activeSessions: 12,
        queuedTasks: 8,
        processingTasks: 3,
        lastRestart: '2023-03-01T10:00:00Z'
      })
    }, 500)
  })
} 