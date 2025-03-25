<template>
  <Teleport to="body">
    <!-- 通知提示框，仅在防刷新保护状态变更时短暂显示 -->
    <div 
      v-if="showNotification"
      class="fixed bottom-8 right-8 z-50 bg-black/80 text-white px-4 py-3 rounded-lg shadow-lg transition-opacity duration-300"
      :class="{'opacity-100': showNotification, 'opacity-0': !showNotification}"
    >
      <div class="flex items-center">
        <span 
          class="w-3 h-3 rounded-full mr-2"
          :class="preventAutoRefresh ? 'bg-green-500' : 'bg-yellow-500'"
        ></span>
        <div class="text-sm">
          <strong>{{ preventAutoRefresh ? '已启用' : '已禁用' }}自动刷新保护</strong>
          <p class="text-xs text-gray-300 mt-1">
            {{ preventAutoRefresh 
              ? '页面将不会自动刷新，所有内容安全可靠' 
              : '页面可能会自动刷新，可能导致内容丢失' }}
          </p>
        </div>
        <button 
          @click="hideNotification" 
          class="ml-3 text-gray-400 hover:text-white"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 在页面刷新被阻止时显示的吐司提示 -->
    <div 
      v-if="showBlockedToast"
      class="fixed top-20 right-8 z-50 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg transition-opacity duration-300 max-w-xs"
      :class="{'opacity-100': showBlockedToast, 'opacity-0': !showBlockedToast}"
    >
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <div>
          <strong class="font-medium">自动刷新已阻止</strong>
          <p class="text-xs mt-1">检测到页面自动刷新尝试，已被系统阻止</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { getAutoRefreshProtectionStatus } from '../services/refreshProtection'

// 状态管理
const preventAutoRefresh = ref(true)
const showNotification = ref(false)
const showBlockedToast = ref(false)
let notificationTimer = null
let blockToastTimer = null

// 组件挂载时获取当前防刷新状态
onMounted(() => {
  preventAutoRefresh.value = getAutoRefreshProtectionStatus()
  
  // 监听防刷新状态变化事件
  window.addEventListener('refreshProtectionChanged', handleRefreshProtectionChange)
  
  // 监听刷新被阻止事件
  window.addEventListener('refreshBlocked', handleRefreshBlocked)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('refreshProtectionChanged', handleRefreshProtectionChange)
  window.removeEventListener('refreshBlocked', handleRefreshBlocked)
  
  // 清除所有计时器
  if (notificationTimer) clearTimeout(notificationTimer)
  if (blockToastTimer) clearTimeout(blockToastTimer)
})

// 处理防刷新状态变化
const handleRefreshProtectionChange = (event) => {
  preventAutoRefresh.value = event.detail.enabled
  showChangeNotification()
}

// 处理刷新被阻止事件
const handleRefreshBlocked = () => {
  showRefreshBlockedToast()
}

// 显示状态变更通知
const showChangeNotification = () => {
  // 清除之前的计时器
  if (notificationTimer) clearTimeout(notificationTimer)
  
  // 显示通知
  showNotification.value = true
  
  // 3秒后自动隐藏
  notificationTimer = setTimeout(() => {
    hideNotification()
  }, 3000)
}

// 隐藏状态变更通知
const hideNotification = () => {
  showNotification.value = false
}

// 显示刷新被阻止的吐司提示
const showRefreshBlockedToast = () => {
  // 清除之前的计时器
  if (blockToastTimer) clearTimeout(blockToastTimer)
  
  // 显示提示
  showBlockedToast.value = true
  
  // 2秒后自动隐藏
  blockToastTimer = setTimeout(() => {
    showBlockedToast.value = false
  }, 2000)
}
</script> 