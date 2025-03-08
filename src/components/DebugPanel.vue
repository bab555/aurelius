<template>
  <div v-if="isVisible" class="fixed bottom-4 right-4 bg-gray-900 text-white rounded-lg shadow-lg z-50 max-w-lg w-full max-h-[60vh] flex flex-col overflow-hidden">
    <!-- 标题栏 -->
    <div class="bg-gray-800 px-4 py-2 flex justify-between items-center">
      <div class="flex items-center">
        <i class="fas fa-bug mr-2"></i>
        <h3 class="font-medium">API调试面板</h3>
        <div class="ml-3 inline-flex items-center">
          <span class="inline-block w-3 h-3 rounded-full mr-1" 
                :class="{
                  'bg-green-500': connectionStatus === 'connected',
                  'bg-red-500': connectionStatus === 'disconnected',
                  'bg-yellow-500': connectionStatus === 'unknown'
                }"></span>
          <span class="text-xs">{{ connectionStatusText }}</span>
        </div>
      </div>
      <div class="flex">
        <button @click="checkConnection" class="text-sm text-gray-300 hover:text-white mr-3 px-2 py-1 rounded hover:bg-gray-700">
          <i class="fas fa-sync-alt mr-1"></i>测试连接
        </button>
        <button @click="toggleVisibility" class="text-gray-300 hover:text-white">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
    
    <!-- 内容区 -->
    <div class="flex-1 overflow-auto p-4 text-sm">
      <!-- 连接信息 -->
      <div class="mb-4">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-semibold">连接信息</h4>
        </div>
        <div class="bg-gray-800 p-3 rounded">
          <div class="grid grid-cols-2 gap-2">
            <div class="text-gray-400">API基础地址:</div>
            <div class="text-right">{{ apiBaseUrl }}</div>
            <div class="text-gray-400">应用ID:</div>
            <div class="text-right">{{ appId }}</div>
            <div class="text-gray-400">用户ID:</div>
            <div class="text-right">{{ userId }}</div>
          </div>
        </div>
      </div>
      
      <!-- 调试日志 -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-semibold">调试日志</h4>
          <div>
            <button @click="clearLogs" class="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700">
              <i class="fas fa-trash-alt mr-1"></i>清除日志
            </button>
            <button @click="toggleDebugMode" class="text-xs px-2 py-1 rounded ml-2"
                   :class="debugEnabled ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'">
              {{ debugEnabled ? '关闭调试' : '开启调试' }}
            </button>
          </div>
        </div>
        
        <div class="bg-gray-800 p-3 rounded h-40 overflow-y-auto font-mono text-xs">
          <template v-if="debugLogs.length > 0">
            <div v-for="(log, index) in debugLogs" :key="index" class="mb-2">
              <div class="text-gray-500">[{{ new Date(log.timestamp).toLocaleTimeString() }}]</div>
              <div class="ml-2 text-gray-200">{{ log.message }}</div>
              <div v-if="log.data" class="ml-2 text-gray-400 bg-gray-900 p-1 rounded mt-1 overflow-x-auto">
                {{ log.data }}
              </div>
            </div>
          </template>
          <div v-else class="text-gray-500 flex items-center justify-center h-full italic">
            无调试日志...{{ debugEnabled ? '' : '(调试模式已关闭)' }}
          </div>
        </div>
      </div>
      
      <!-- 原始响应内容 (新增) -->
      <div v-if="lastRawResponse" class="mt-4">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-semibold">最近API响应内容</h4>
          <div>
            <button @click="copyRawResponse" class="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700">
              <i class="fas fa-copy mr-1"></i>复制
            </button>
          </div>
        </div>
        
        <div class="bg-gray-800 p-3 rounded h-40 overflow-y-auto font-mono text-xs">
          <div class="text-gray-300 whitespace-pre-wrap">{{ lastRawResponse }}</div>
        </div>
      </div>
    </div>
    
    <!-- 底部工具栏 -->
    <div class="bg-gray-800 px-4 py-2 flex justify-between items-center">
      <span class="text-xs text-gray-400">
        {{ new Date().toLocaleString() }}
      </span>
      <button @click="executeApiTest" class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">
        <i class="fas fa-vial mr-1"></i>发送测试请求
      </button>
    </div>
  </div>
  
  <!-- 悬浮小按钮 -->
  <button 
    v-if="!isVisible" 
    @click="toggleVisibility"
    class="fixed bottom-4 right-4 bg-gray-800 hover:bg-gray-900 text-white p-2 rounded-full shadow-lg z-50"
    title="显示调试面板"
  >
    <i class="fas fa-bug"></i>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useChatStore } from '../stores/chat'
import * as chatAPI from '../services/chatAPI'

const isVisible = ref(false)
const chatStore = useChatStore()

// 计算属性
const connectionStatus = computed(() => chatStore.connectionStatus)
const connectionStatusText = computed(() => {
  switch (chatStore.connectionStatus) {
    case 'connected': return '已连接'
    case 'disconnected': return '未连接'
    default: return '未知状态'
  }
})
const debugLogs = computed(() => chatStore.debugLogs)
const debugEnabled = computed(() => chatStore.enableDebugMode)
const userId = computed(() => chatStore.userId)
const apiBaseUrl = computed(() => import.meta.env.VITE_API_BASE_URL)
const appId = computed(() => import.meta.env.VITE_APP_ID)
const lastRawResponse = computed(() => chatStore.lastRawResponse)

// 方法
const toggleVisibility = () => {
  isVisible.value = !isVisible.value
}

const toggleDebugMode = () => {
  chatStore.toggleDebugMode()
}

const clearLogs = () => {
  chatStore.clearDebugLogs()
}

const checkConnection = async () => {
  await chatStore.checkConnection()
}

// 发送测试请求
const executeApiTest = async () => {
  if (!debugEnabled.value) {
    chatStore.toggleDebugMode()
  }
  
  try {
    // 创建一个简单的测试请求
    const testMsg = `测试消息 ${new Date().toLocaleTimeString()}`
    await chatStore.sendMessage(testMsg)
  } catch (error) {
    console.error('测试请求失败:', error)
  }
}

const copyRawResponse = () => {
  if (lastRawResponse.value) {
    navigator.clipboard.writeText(lastRawResponse.value)
      .then(() => {
        alert('响应内容已复制到剪贴板！');
      })
      .catch(err => {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
      });
  }
}
</script>

<style scoped>
/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #1f2937;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}
</style> 