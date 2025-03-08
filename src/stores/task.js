import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { submitTask, checkTaskStatus, getAllTasks, startTask } from '../services/task'

export const useTaskStore = defineStore('task', () => {
  // 任务队列
  const queue = ref([])
  // 正在处理的任务数量
  const processingCount = ref(0)
  // 最大并发数（可通过系统配置动态调整）
  const maxConcurrent = ref(3)
  // 轮询间隔(ms)
  const pollInterval = ref(2000)
  // 是否正在轮询
  const isPolling = ref(false)
  
  // 计算属性
  const pendingTasks = computed(() => queue.value.filter(t => t.status === 'pending'))
  const processingTasks = computed(() => queue.value.filter(t => t.status === 'processing'))
  const completedTasks = computed(() => queue.value.filter(t => t.status === 'completed'))
  const failedTasks = computed(() => queue.value.filter(t => t.status === 'failed'))
  
  // 添加任务到队列
  async function addTask(taskType, params, priority = 0) {
    try {
      const task = await submitTask({
        task_type: taskType,
        task_params: params,
        priority
      })
      
      queue.value.push(task)
      startProcessing()
      return task.id
    } catch (error) {
      console.error('添加任务失败', error)
      throw error
    }
  }
  
  // 开始处理队列
  function startProcessing() {
    if (isPolling.value) return
    
    isPolling.value = true
    processQueue()
    startPolling()
  }
  
  // 处理队列中的任务
  async function processQueue() {
    // 排序队列（按优先级和创建时间）
    const sorted = [...pendingTasks.value].sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority
      return new Date(a.created_at) - new Date(b.created_at)
    })
    
    // 计算可以启动的任务数
    const availableSlots = maxConcurrent.value - processingCount.value
    
    if (availableSlots <= 0) return
    
    // 启动新任务
    for (let i = 0; i < Math.min(availableSlots, sorted.length); i++) {
      const task = sorted[i]
      // 发送请求开始处理任务
      try {
        await startTask(task.id)
        
        // 更新本地任务状态
        const index = queue.value.findIndex(t => t.id === task.id)
        if (index !== -1) {
          queue.value[index].status = 'processing'
          queue.value[index].started_at = new Date().toISOString()
        }
        
        processingCount.value++
      } catch (error) {
        console.error(`启动任务 ${task.id} 失败`, error)
        
        // 更新失败状态
        const index = queue.value.findIndex(t => t.id === task.id)
        if (index !== -1) {
          queue.value[index].status = 'failed'
          queue.value[index].error_message = error.message || '启动失败'
        }
      }
    }
  }
  
  // 开始轮询任务状态
  function startPolling() {
    const poll = async () => {
      if (processingCount.value === 0 && pendingTasks.value.length === 0) {
        isPolling.value = false
        return
      }
      
      try {
        // 更新所有进行中任务的状态
        await updateTasksStatus()
        
        // 重新处理队列
        processQueue()
      } catch (error) {
        console.error('更新任务状态失败', error)
      }
      
      // 继续轮询
      setTimeout(poll, pollInterval.value)
    }
    
    poll()
  }
  
  // 更新任务状态
  async function updateTasksStatus() {
    const taskIds = processingTasks.value.map(t => t.id)
    
    if (taskIds.length === 0) return
    
    const statuses = await checkTaskStatus(taskIds)
    
    // 更新本地任务状态
    statuses.forEach(status => {
      const index = queue.value.findIndex(t => t.id === status.id)
      if (index !== -1) {
        queue.value[index] = { ...queue.value[index], ...status }
        
        // 如果任务已完成或失败，减少处理中的任务计数
        if (status.status === 'completed' || status.status === 'failed') {
          processingCount.value = Math.max(0, processingCount.value - 1)
        }
      }
    })
  }
  
  // 加载所有任务（用于初始化）
  async function loadAllTasks() {
    try {
      const tasks = await getAllTasks()
      queue.value = tasks
      
      // 计算当前处理中的任务数
      processingCount.value = processingTasks.value.length
      
      // 如果有任务在处理，启动轮询
      if (processingCount.value > 0 || pendingTasks.value.length > 0) {
        startProcessing()
      }
    } catch (error) {
      console.error('加载任务失败', error)
    }
  }
  
  // 设置最大并发数
  function setMaxConcurrent(value) {
    maxConcurrent.value = Math.max(1, value)
    processQueue() // 调整后立即尝试处理队列
  }
  
  // 取消任务
  async function cancelTask(taskId) {
    try {
      await cancelTaskRequest(taskId)
      
      // 更新本地状态
      const index = queue.value.findIndex(t => t.id === taskId)
      if (index !== -1) {
        // 如果任务正在处理，减少计数
        if (queue.value[index].status === 'processing') {
          processingCount.value = Math.max(0, processingCount.value - 1)
        }
        
        // 更新状态
        queue.value[index].status = 'failed'
        queue.value[index].error_message = '用户取消'
      }
      
      return true
    } catch (error) {
      console.error(`取消任务 ${taskId} 失败`, error)
      return false
    }
  }
  
  // 移除任务（仅从队列中移除，不会取消处理中的任务）
  function removeTask(taskId) {
    const index = queue.value.findIndex(t => t.id === taskId)
    if (index !== -1) {
      // 如果任务正在处理，减少计数
      if (queue.value[index].status === 'processing') {
        processingCount.value = Math.max(0, processingCount.value - 1)
      }
      
      // 从队列中移除
      queue.value.splice(index, 1)
    }
  }
  
  // 清空已完成的任务
  function clearCompletedTasks() {
    queue.value = queue.value.filter(task => 
      task.status !== 'completed' && task.status !== 'failed'
    )
  }
  
  // 初始化
  function initialize() {
    loadAllTasks()
  }
  
  return {
    queue,
    processingCount,
    maxConcurrent,
    pendingTasks,
    processingTasks,
    completedTasks,
    failedTasks,
    addTask,
    loadAllTasks,
    setMaxConcurrent,
    cancelTask,
    removeTask,
    clearCompletedTasks,
    initialize
  }
}) 