<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-gray-800">任务队列管理</h2>
      <p class="text-gray-600">监控和管理系统任务执行状态</p>
    </div>
    
    <!-- 概览卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <!-- 等待中任务 -->
      <div class="bg-white rounded-lg shadow p-5">
        <div class="flex justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">等待中任务</p>
            <p class="text-xl font-semibold text-gray-800 mt-1">{{ taskStore.pendingTasks.length }}</p>
          </div>
          <div class="p-3 rounded-full bg-blue-50">
            <i class="fas fa-clock text-blue-500 text-xl"></i>
          </div>
        </div>
      </div>
      
      <!-- 处理中任务 -->
      <div class="bg-white rounded-lg shadow p-5">
        <div class="flex justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">处理中任务</p>
            <p class="text-xl font-semibold text-gray-800 mt-1">{{ taskStore.processingTasks.length }}</p>
          </div>
          <div class="p-3 rounded-full bg-yellow-50">
            <i class="fas fa-spinner text-yellow-500 text-xl"></i>
          </div>
        </div>
      </div>
      
      <!-- 完成任务 -->
      <div class="bg-white rounded-lg shadow p-5">
        <div class="flex justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">已完成任务</p>
            <p class="text-xl font-semibold text-gray-800 mt-1">{{ taskStore.completedTasks.length }}</p>
          </div>
          <div class="p-3 rounded-full bg-green-50">
            <i class="fas fa-check text-green-500 text-xl"></i>
          </div>
        </div>
      </div>
      
      <!-- 失败任务 -->
      <div class="bg-white rounded-lg shadow p-5">
        <div class="flex justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">失败任务</p>
            <p class="text-xl font-semibold text-gray-800 mt-1">{{ taskStore.failedTasks.length }}</p>
          </div>
          <div class="p-3 rounded-full bg-red-50">
            <i class="fas fa-exclamation-triangle text-red-500 text-xl"></i>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 任务列表 -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 class="text-lg font-medium text-gray-800">任务列表</h3>
        
        <div class="flex space-x-2">
          <!-- 过滤器 -->
          <div class="flex items-center">
            <select 
              v-model="statusFilter" 
              class="block w-36 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            >
              <option value="all">所有状态</option>
              <option value="pending">等待中</option>
              <option value="processing">处理中</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
            </select>
          </div>
          
          <!-- 刷新按钮 -->
          <button 
            @click="refreshTasks" 
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            :disabled="isRefreshing"
          >
            <i class="fas fa-sync-alt mr-2" :class="{'animate-spin': isRefreshing}"></i>
            刷新
          </button>
          
          <!-- 清空完成按钮 -->
          <button 
            @click="clearCompletedTasks" 
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <i class="fas fa-broom mr-2"></i>
            清除已完成
          </button>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">优先级</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="task in filteredTasks" :key="task.id" :class="{'bg-yellow-50': task.status === 'processing'}">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ task.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatTaskType(task.task_type) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="{
                  'px-2 py-1 text-xs rounded-full': true,
                  'bg-blue-100 text-blue-800': task.status === 'pending',
                  'bg-yellow-100 text-yellow-800': task.status === 'processing',
                  'bg-green-100 text-green-800': task.status === 'completed',
                  'bg-red-100 text-red-800': task.status === 'failed'
                }">
                  {{ formatStatus(task.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ task.priority }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(task.created_at) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">用户{{ task.user_id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button @click="showTaskDetails(task)" class="text-indigo-600 hover:text-indigo-900 mr-3">
                  <i class="fas fa-eye"></i>
                </button>
                
                <button 
                  v-if="task.status === 'pending' || task.status === 'processing'"
                  @click="cancelTask(task.id)" 
                  class="text-red-600 hover:text-red-900"
                >
                  <i class="fas fa-times"></i>
                </button>
                
                <button 
                  v-if="task.status === 'completed'"
                  @click="openResult(task.result_url)" 
                  class="text-green-600 hover:text-green-900 mr-3"
                >
                  <i class="fas fa-external-link-alt"></i>
                </button>
              </td>
            </tr>
            
            <!-- 无数据显示 -->
            <tr v-if="filteredTasks.length === 0">
              <td colspan="7" class="px-6 py-10 text-center text-gray-500">
                暂无任务数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 分页 -->
      <div class="px-6 py-3 flex items-center justify-between border-t border-gray-200">
        <div class="flex-1 flex justify-between items-center">
          <p class="text-sm text-gray-700">
            显示 <span class="font-medium">{{ filteredTasks.length }}</span> 个任务，共 <span class="font-medium">{{ taskStore.queue.length }}</span> 个
          </p>
          
          <div class="flex space-x-2">
            <button
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              上一页
            </button>
            <button
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 任务详情模态框 -->
    <div v-if="selectedTask" class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen p-4 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="selectedTask = null"></div>
        
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">任务详情</h3>
                
                <div class="mt-2 grid grid-cols-2 gap-4">
                  <div class="col-span-2">
                    <span class="text-sm font-medium text-gray-500">ID:</span>
                    <span class="ml-2 text-sm text-gray-900">{{ selectedTask.id }}</span>
                  </div>
                  
                  <div>
                    <span class="text-sm font-medium text-gray-500">类型:</span>
                    <span class="ml-2 text-sm text-gray-900">{{ formatTaskType(selectedTask.task_type) }}</span>
                  </div>
                  
                  <div>
                    <span class="text-sm font-medium text-gray-500">状态:</span>
                    <span class="ml-2 text-sm" :class="{
                      'text-blue-600': selectedTask.status === 'pending',
                      'text-yellow-600': selectedTask.status === 'processing',
                      'text-green-600': selectedTask.status === 'completed',
                      'text-red-600': selectedTask.status === 'failed'
                    }">{{ formatStatus(selectedTask.status) }}</span>
                  </div>
                  
                  <div>
                    <span class="text-sm font-medium text-gray-500">创建时间:</span>
                    <span class="ml-2 text-sm text-gray-900">{{ formatDate(selectedTask.created_at) }}</span>
                  </div>
                  
                  <div>
                    <span class="text-sm font-medium text-gray-500">用户:</span>
                    <span class="ml-2 text-sm text-gray-900">用户{{ selectedTask.user_id }}</span>
                  </div>
                  
                  <div v-if="selectedTask.started_at" class="col-span-2">
                    <span class="text-sm font-medium text-gray-500">开始时间:</span>
                    <span class="ml-2 text-sm text-gray-900">{{ formatDate(selectedTask.started_at) }}</span>
                  </div>
                  
                  <div v-if="selectedTask.completed_at" class="col-span-2">
                    <span class="text-sm font-medium text-gray-500">完成时间:</span>
                    <span class="ml-2 text-sm text-gray-900">{{ formatDate(selectedTask.completed_at) }}</span>
                  </div>
                  
                  <div class="col-span-2">
                    <span class="text-sm font-medium text-gray-500">任务参数:</span>
                    <pre class="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">{{ JSON.stringify(selectedTask.task_params, null, 2) }}</pre>
                  </div>
                  
                  <div v-if="selectedTask.result_url" class="col-span-2">
                    <span class="text-sm font-medium text-gray-500">结果URL:</span>
                    <a :href="selectedTask.result_url" target="_blank" class="ml-2 text-sm text-indigo-600 hover:text-indigo-900">{{ selectedTask.result_url }}</a>
                  </div>
                  
                  <div v-if="selectedTask.error_message" class="col-span-2">
                    <span class="text-sm font-medium text-gray-500">错误信息:</span>
                    <div class="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded">{{ selectedTask.error_message }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              type="button" 
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              @click="selectedTask = null"
            >
              关闭
            </button>
            
            <button 
              v-if="selectedTask.status === 'pending' || selectedTask.status === 'processing'"
              type="button" 
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              @click="cancelTask(selectedTask.id)"
            >
              取消任务
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTaskStore } from '../../stores/task'

const taskStore = useTaskStore()
const isRefreshing = ref(false)
const statusFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = 10
const selectedTask = ref(null)

// 根据过滤器和分页获取任务列表
const filteredTasks = computed(() => {
  let tasks = taskStore.queue
  
  // 应用状态过滤
  if (statusFilter.value !== 'all') {
    tasks = tasks.filter(task => task.status === statusFilter.value)
  }
  
  // 计算分页
  const startIndex = (currentPage.value - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  
  return tasks.slice(startIndex, endIndex)
})

// 总页数
const totalPages = computed(() => {
  let count = taskStore.queue.length
  if (statusFilter.value !== 'all') {
    count = taskStore.queue.filter(task => task.status === statusFilter.value).length
  }
  return Math.ceil(count / itemsPerPage) || 1
})

// 刷新任务列表
const refreshTasks = async () => {
  isRefreshing.value = true
  
  try {
    await taskStore.loadAllTasks()
  } catch (error) {
    console.error('刷新任务失败:', error)
  } finally {
    isRefreshing.value = false
  }
}

// 取消任务
const cancelTask = async (taskId) => {
  if (confirm('确定要取消此任务吗？')) {
    try {
      await taskStore.cancelTask(taskId)
      
      // 如果当前有选中的任务，更新它的状态
      if (selectedTask.value && selectedTask.value.id === taskId) {
        const task = taskStore.queue.find(t => t.id === taskId)
        if (task) {
          selectedTask.value = { ...task }
        }
      }
    } catch (error) {
      console.error('取消任务失败:', error)
      alert('取消任务失败: ' + error.message)
    }
  }
}

// 清除已完成任务
const clearCompletedTasks = () => {
  taskStore.clearCompletedTasks()
}

// 显示任务详情
const showTaskDetails = (task) => {
  selectedTask.value = { ...task }
}

// 打开结果URL
const openResult = (url) => {
  if (url) {
    window.open(url, '_blank')
  }
}

// 格式化任务类型
const formatTaskType = (type) => {
  switch (type) {
    case 'image_generation': return '图像生成'
    case 'text_generation': return '文本生成'
    case 'video_generation': return '视频生成'
    default: return type
  }
}

// 格式化状态
const formatStatus = (status) => {
  switch (status) {
    case 'pending': return '等待中'
    case 'processing': return '处理中'
    case 'completed': return '已完成'
    case 'failed': return '失败'
    default: return status
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 监听过滤器变化，重置页码
watch(statusFilter, () => {
  currentPage.value = 1
})

// 初始化
onMounted(() => {
  taskStore.initialize()
})
</script> 