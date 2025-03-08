import { get, post, put, del } from './api'

/**
 * 提交新任务
 * @param {Object} taskData - 任务数据
 * @param {string} taskData.task_type - 任务类型
 * @param {Object} taskData.task_params - 任务参数
 * @param {number} taskData.priority - 任务优先级 (越高越优先)
 * @returns {Promise<Object>} - 创建的任务对象
 */
export const submitTask = async (taskData) => {
  // 实际项目应该调用真实API
  // return await post('/tasks', taskData)
  
  // 模拟API请求
  return new Promise(resolve => {
    setTimeout(() => {
      const taskId = Math.floor(Math.random() * 10000)
      
      resolve({
        id: taskId,
        user_id: 1,
        task_type: taskData.task_type,
        task_params: taskData.task_params,
        priority: taskData.priority || 0,
        status: 'pending',
        created_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        result_url: null,
        error_message: null
      })
    }, 300)
  })
}

/**
 * 获取所有任务
 * @param {Object} params - 查询参数
 * @returns {Promise<Array>} - 任务列表
 */
export const getAllTasks = async (params = {}) => {
  // 实际项目应该调用真实API
  // return await get('/tasks', params)
  
  // 模拟API请求
  return new Promise(resolve => {
    setTimeout(() => {
      // 生成随机任务列表
      const tasks = []
      const statuses = ['pending', 'processing', 'completed', 'failed']
      const types = ['image_generation', 'text_generation', 'video_generation']
      
      // 生成10个随机任务
      for (let i = 0; i < 10; i++) {
        const id = Math.floor(Math.random() * 10000)
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const type = types[Math.floor(Math.random() * types.length)]
        const createdAt = new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
        
        let startedAt = null
        let completedAt = null
        let resultUrl = null
        let errorMessage = null
        
        if (status === 'processing' || status === 'completed' || status === 'failed') {
          startedAt = new Date(new Date(createdAt).getTime() + Math.random() * 3600000).toISOString()
        }
        
        if (status === 'completed') {
          completedAt = new Date(new Date(startedAt).getTime() + Math.random() * 3600000).toISOString()
          resultUrl = `https://example.com/results/${id}`
        }
        
        if (status === 'failed') {
          completedAt = new Date(new Date(startedAt).getTime() + Math.random() * 3600000).toISOString()
          errorMessage = '处理失败：服务器错误'
        }
        
        tasks.push({
          id,
          user_id: 1,
          task_type: type,
          task_params: { prompt: `示例提示 ${i + 1}` },
          priority: Math.floor(Math.random() * 10),
          status,
          created_at: createdAt,
          started_at: startedAt,
          completed_at: completedAt,
          result_url: resultUrl,
          error_message: errorMessage
        })
      }
      
      resolve(tasks)
    }, 500)
  })
}

/**
 * 获取任务详情
 * @param {number} taskId - 任务ID
 * @returns {Promise<Object>} - 任务详情
 */
export const getTaskDetails = async (taskId) => {
  // 实际项目应该调用真实API
  // return await get(`/tasks/${taskId}`)
  
  // 模拟API请求
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 随机决定任务是否存在
      if (Math.random() > 0.1) {
        const statuses = ['pending', 'processing', 'completed', 'failed']
        const types = ['image_generation', 'text_generation', 'video_generation']
        
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const type = types[Math.floor(Math.random() * types.length)]
        const createdAt = new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
        
        let startedAt = null
        let completedAt = null
        let resultUrl = null
        let errorMessage = null
        
        if (status === 'processing' || status === 'completed' || status === 'failed') {
          startedAt = new Date(new Date(createdAt).getTime() + Math.random() * 3600000).toISOString()
        }
        
        if (status === 'completed') {
          completedAt = new Date(new Date(startedAt).getTime() + Math.random() * 3600000).toISOString()
          resultUrl = `https://example.com/results/${taskId}`
        }
        
        if (status === 'failed') {
          completedAt = new Date(new Date(startedAt).getTime() + Math.random() * 3600000).toISOString()
          errorMessage = '处理失败：服务器错误'
        }
        
        resolve({
          id: taskId,
          user_id: 1,
          task_type: type,
          task_params: { prompt: '示例提示' },
          priority: Math.floor(Math.random() * 10),
          status,
          created_at: createdAt,
          started_at: startedAt,
          completed_at: completedAt,
          result_url: resultUrl,
          error_message: errorMessage
        })
      } else {
        reject({ message: '任务不存在' })
      }
    }, 300)
  })
}

/**
 * 启动任务处理
 * @param {number} taskId - 任务ID
 * @returns {Promise<Object>} - 更新后的任务状态
 */
export const startTask = async (taskId) => {
  // 实际项目应该调用真实API
  // return await post(`/tasks/${taskId}/start`)
  
  // 模拟API请求
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 随机决定是否成功启动
      if (Math.random() > 0.1) {
        resolve({
          id: taskId,
          status: 'processing',
          started_at: new Date().toISOString()
        })
      } else {
        reject({ message: '启动任务失败：服务不可用' })
      }
    }, 300)
  })
}

/**
 * 取消任务
 * @param {number} taskId - 任务ID
 * @returns {Promise<Object>} - 取消结果
 */
export const cancelTaskRequest = async (taskId) => {
  // 实际项目应该调用真实API
  // return await post(`/tasks/${taskId}/cancel`)
  
  // 模拟API请求
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 随机决定是否成功取消
      if (Math.random() > 0.1) {
        resolve({
          id: taskId,
          status: 'failed',
          error_message: '用户取消'
        })
      } else {
        reject({ message: '取消任务失败' })
      }
    }, 300)
  })
}

/**
 * 检查多个任务的状态
 * @param {Array<number>} taskIds - 任务ID列表
 * @returns {Promise<Array<Object>>} - 多个任务的状态
 */
export const checkTaskStatus = async (taskIds) => {
  // 实际项目应该调用真实API
  // return await post('/tasks/status', { taskIds })
  
  // 模拟API请求
  return new Promise(resolve => {
    setTimeout(() => {
      const statuses = []
      
      taskIds.forEach(id => {
        // 随机更新任务状态
        const r = Math.random()
        let status = 'processing'
        let completedAt = null
        let resultUrl = null
        let errorMessage = null
        
        // 20%概率完成
        if (r < 0.2) {
          status = 'completed'
          completedAt = new Date().toISOString()
          resultUrl = `https://example.com/results/${id}`
        }
        // 10%概率失败
        else if (r < 0.3) {
          status = 'failed'
          completedAt = new Date().toISOString()
          errorMessage = '处理失败：内部错误'
        }
        
        statuses.push({
          id,
          status,
          completed_at: completedAt,
          result_url: resultUrl,
          error_message: errorMessage
        })
      })
      
      resolve(statuses)
    }, 500)
  })
} 