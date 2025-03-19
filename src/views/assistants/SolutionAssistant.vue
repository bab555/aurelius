<template>
  <div class="flex-1 flex flex-col relative h-screen">
    <!-- 组件加载指示器 -->
    <div v-if="!isComponentReady" class="absolute inset-0 flex items-center justify-center bg-[#0e0b36]/80 z-10">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    
    <div class="p-4 md:p-8 flex flex-col h-full">
      <!-- 页面标题 -->
      <div class="mb-6 flex-shrink-0">
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">写作助手</h1>
        <p class="text-gray-400 text-sm">智能写作大师，模板化输出，一键到位。独家设计支持超长文本创作，解决上下文记忆衰退，最长可处理超20万字的作品</p>
        
        <!-- API连接状态提示 -->
        <div class="mt-2 flex items-center">
          <span class="inline-block w-3 h-3 rounded-full mr-1" 
              :class="{
                'bg-green-500': chatStore.connectionStatus === 'connected',
                'bg-red-500': chatStore.connectionStatus === 'disconnected',
                'bg-yellow-500': chatStore.connectionStatus === 'unknown'
              }"></span>
          <span class="text-xs" :class="{
            'text-green-500': chatStore.connectionStatus === 'connected',
            'text-red-500': chatStore.connectionStatus === 'disconnected',
            'text-yellow-500': chatStore.connectionStatus === 'unknown'
          }">
            助手状态: {{ chatStore.connectionStatus === 'connected' ? '已连接' : 
                        chatStore.connectionStatus === 'disconnected' ? '未连接' : '未知' }}
          </span>
          <button @click="testConnection" class="ml-2 text-xs text-gray-400 hover:text-white">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
      
      <!-- 写作编辑模式 -->
      <div v-if="!showCopywritingResults" class="flex-1 flex flex-col bg-[#0e0b36] rounded-lg p-6 min-h-0">
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <!-- 写作类型选择区域 -->
          <div class="mb-6">
            <label class="block text-white text-sm font-medium mb-2">选择写作类型</label>
            <select 
              v-model="selectedType" 
              class="w-full bg-[#191637] text-white border border-gray-700 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              @change="onTypeChange"
            >
              <option value="" disabled>请选择写作类型</option>
              <option v-for="(type, index) in copywritingTypes" :key="index" :value="type.value">
                {{ type.name }}
              </option>
            </select>
          </div>

          <!-- 细分类型选择区域 -->
          <div class="mb-6">
            <label class="block text-white text-sm font-medium mb-2">选择细分类型</label>
            <select 
              v-model="selectedSubtype" 
              class="w-full bg-[#191637] text-white border border-gray-700 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              :disabled="!selectedType || subtypeOptions.length === 0"
            >
              <option value="" disabled>请选择细分类型</option>
              <option v-for="(subtype, index) in subtypeOptions" :key="index" :value="subtype.value">
                {{ subtype.name }}
              </option>
            </select>
          </div>
          
          <!-- 写作要求输入区域 -->
          <div class="mb-6 flex-1">
            <label class="block text-white text-sm font-medium mb-2">请输入写作要求和内容大纲</label>
            <textarea 
              v-model="copywritingRequirements" 
              class="w-full h-64 bg-[#191637] text-white border border-gray-700 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="请输入您的写作需求、目标读者、作品风格、内容大纲等具体要求..."
            ></textarea>
            </div>
          
          <!-- 生成按钮 -->
          <div class="flex justify-center mt-4">
              <button 
              @click="generateCopywriting" 
              :disabled="!isFormValid || taskStatus === TASK_STATUS.WAITING || taskStatus === TASK_STATUS.PROCESSING"
              class="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg mt-4 w-full md:w-auto transition-colors"
            >
              <span v-if="taskStatus === TASK_STATUS.IDLE">生成内容</span>
              <span v-else-if="taskStatus === TASK_STATUS.WAITING || taskStatus === TASK_STATUS.PROCESSING">
                <i class="fas fa-spinner fa-spin mr-2"></i>处理中...
              </span>
              <span v-else-if="taskStatus === TASK_STATUS.ERROR">
                <i class="fas fa-exclamation-triangle mr-2"></i>重试
              </span>
              </button>
            </div>
          </div>
                  </div>
                  
      <!-- 写作结果展示区域 -->
      <div v-else class="flex-1 bg-[#0e0b36] p-4 md:p-6 mb-4 rounded-lg flex flex-col min-h-0">
        <!-- 处理状态指示器 -->
        <div v-if="taskStatus === TASK_STATUS.WAITING || taskStatus === TASK_STATUS.PROCESSING" 
             class="bg-primary/10 rounded-lg p-4 mb-4 text-white border border-primary/20">
          <div class="flex items-center">
            <i class="fas fa-spinner fa-spin mr-2 text-primary"></i>
            <span>正在处理您的写作请求，已用时 {{ waitingTimeDisplay }}</span>
                  </div>
          <p class="mt-2 text-sm text-gray-400">
            超长文本生成可能需要较长时间，请耐心等待。您可以刷新页面或稍后返回，系统会自动继续处理您的请求。
          </p>
                </div>
        
        <!-- 错误状态指示器 -->
        <div v-if="taskStatus === TASK_STATUS.ERROR" 
             class="bg-red-900/20 rounded-lg p-4 mb-4 text-white border border-red-500/30">
          <div class="flex items-center">
            <i class="fas fa-exclamation-triangle mr-2 text-red-500"></i>
            <span>处理您的请求时遇到问题</span>
                </div>
          <p class="mt-2 text-sm text-gray-400">
            生成内容过程中出现错误，请点击下方按钮重试，或返回修改您的需求。
          </p>
          <div class="mt-3 flex gap-3">
            <button @click="retryTask" 
                    class="bg-primary hover:bg-primary/80 text-white px-3 py-1 rounded text-sm">
              重新生成
            </button>
            <button @click="isRequirementsView = true; isResultView = false" 
                    class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm">
              修改需求
            </button>
        </div>
      </div>

        <!-- 生成的写作结果 -->
        <div v-else class="flex-1 overflow-y-auto custom-scrollbar min-h-0 prose prose-invert max-w-none">
          <div v-if="generatedContent" v-html="formattedContent"></div>
          <div v-else class="text-center text-gray-400 my-10">暂无生成的内容</div>
          
          <!-- 重新生成按钮 -->
          <div class="flex justify-center mt-8 mb-4">
          <button 
              @click="resetForm" 
              class="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors mr-4"
            >
              返回编辑
            </button>
            <button 
              @click="copyToClipboard" 
              class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              复制全文
          </button>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useChatStore } from '../../stores/chat'
import MessageFormatter from '../../components/MessageFormatter.vue'
import * as swManager from '../../services/swManager'
import * as chatAPI from '../../services/chatAPI'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { getCredentials } from '@/services/chatAPI'

// 使用聊天状态存储
const chatStore = useChatStore()
const router = useRouter()

// 中间层同步状态
const syncedWithMiddleLayer = ref(false)

// 组件就绪状态
const isComponentReady = ref(false)

// 写作模式相关状态
const showCopywritingResults = ref(false)
const isGenerating = ref(false)
const generatedContent = ref('')
const selectedType = ref('')
const selectedSubtype = ref('')
const copywritingRequirements = ref('')

// 任务状态管理
const TASK_STATUS = {
  IDLE: 'idle',
  WAITING: 'waiting',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error'
}

// 任务持久化相关状态
const taskStatus = ref(TASK_STATUS.IDLE)
const taskId = ref('')
const taskStartTime = ref(0)
const pollInterval = ref(5000) // 初始轮询间隔5秒
const maxPollInterval = 30000 // 最大轮询间隔30秒
const pollTimeoutId = ref(null)
const waitingTimeDisplay = ref('00:00')
const isPollingActive = ref(false)

// 写作类型数据
const copywritingTypes = ref([
  {
    name: '技术文档',
    value: 'technical',
    subtypes: [
      { name: '开发文档', value: 'dev_docs' },
      { name: '用户手册', value: 'user_manual' },
      { name: '技术规格说明', value: 'specs' },
      { name: '教程指南', value: 'tutorial' }
    ]
  },
  {
    name: '商业文书',
    value: 'business',
    subtypes: [
      { name: '商业计划书', value: 'business_plan' },
      { name: '项目提案', value: 'proposal' },
      { name: '分析报告', value: 'analysis_report' },
      { name: '执行摘要', value: 'executive_summary' }
    ]
  },
  {
    name: '创意写作',
    value: 'creative',
    subtypes: [
      { name: '短篇小说', value: 'short_story' },
      { name: '诗歌', value: 'poetry' },
      { name: '剧本台词', value: 'script' },
      { name: '叙事散文', value: 'narrative' }
    ]
  },
  {
    name: '新媒体内容',
    value: 'media',
    subtypes: [
      { name: '平台文案', value: 'article' },
      { name: '营销文案', value: 'social_media' },
      { name: '视频脚本', value: 'video_script' },
      { name: '内容规划', value: 'content_plan' }
    ]
  },
  {
    name: '来往公文',
    value: 'official',
    subtypes: [
      { name: '公函', value: 'official_letter' },
      { name: '通知公告', value: 'announcement' },
      { name: '备忘录', value: 'memo' },
      { name: '回复函', value: 'reply_letter' }
    ]
  }
])

// 联动下拉列表的选项
const subtypeOptions = computed(() => {
  if (!selectedType.value) return []
  const selectedTypeObj = copywritingTypes.value.find(type => type.value === selectedType.value)
  return selectedTypeObj ? selectedTypeObj.subtypes : []
})

// 表单验证
const isFormValid = computed(() => {
  return selectedType.value && 
         selectedSubtype.value && 
         copywritingRequirements.value.trim().length > 0
})

// 格式化后的内容
const formattedContent = computed(() => {
  if (!generatedContent.value) return ''
  
  // 简单处理纯文本，保留换行，类似Word显示
  const textWithBreaks = generatedContent.value
    // 将换行符转换为HTML换行标签
    .replace(/\n/g, '<br>')
    // 确保空格被正确显示
    .replace(/ {2}/g, '&nbsp;&nbsp;')
    // 处理制表符
    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
  
  // 使用DOMPurify清理内容，只保留基本格式
  return DOMPurify.sanitize(textWithBreaks, {
    ALLOWED_TAGS: ['br'], 
    ALLOWED_ATTR: []
  });
})

// 计算属性
const messages = computed(() => chatStore.sortedMessages)

// 写作相关方法
const onTypeChange = () => {
  // 重置子类型选择
  selectedSubtype.value = ''
}

// 生成写作内容
const generateCopywriting = async () => {
  if (!selectedType.value || !selectedSubtype.value || !copywritingRequirements.value.trim()) {
    return
  }
  
  // 设置状态为等待
  taskStatus.value = TASK_STATUS.WAITING
  
  // 生成唯一任务ID
  taskId.value = `writing_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
  taskStartTime.value = Date.now()
  
  // 持久化任务状态到localStorage
  saveTaskState()
  
  // 开始计时显示
  startWaitingTimer()
  
  try {
    // 构建提示词
    const selectedTypeText = copywritingTypes.value.find(t => t.value === selectedType.value)?.name || ''
    const selectedSubtypeText = subtypeOptions.value.find(st => st.value === selectedSubtype.value)?.name || ''
    
    const prompt = `我需要一篇${selectedTypeText}中的${selectedSubtypeText}。以下是具体要求：\n\n${copywritingRequirements.value}`
    
    // 清除聊天历史
    chatStore.clearMessages()
    
    // 发送消息并切换到结果查看
    showCopywritingResults.value = false
    isGenerating.value = true
    
    // 设置处理中状态
    taskStatus.value = TASK_STATUS.PROCESSING
    saveTaskState()
    
    // 发送实际消息
    await chatStore.sendMessage(prompt)
    
    // 设置为完成状态
    taskStatus.value = TASK_STATUS.COMPLETED
    saveTaskState()
    
    // 停止轮询和计时器
    stopPolling()
    
    // 清除任务状态
    clearTaskState()
  } catch (error) {
    console.error('生成写作内容失败:', error)
    taskStatus.value = TASK_STATUS.ERROR
    saveTaskState()
  }
}

// 开始等待计时器
const startWaitingTimer = () => {
  // 初始化显示
  updateWaitingTimeDisplay()
  
  // 每秒更新一次显示
  const timerId = setInterval(() => {
    updateWaitingTimeDisplay()
  }, 1000)
  
  // 保存计时器ID以便清除
  window._waitingTimerId = timerId
}

// 更新等待时间显示
const updateWaitingTimeDisplay = () => {
  const elapsedSeconds = Math.floor((Date.now() - taskStartTime.value) / 1000)
  const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')
  const seconds = (elapsedSeconds % 60).toString().padStart(2, '0')
  waitingTimeDisplay.value = `${minutes}:${seconds}`
}

// 停止等待计时器
const stopWaitingTimer = () => {
  if (window._waitingTimerId) {
    clearInterval(window._waitingTimerId)
    window._waitingTimerId = null
  }
}

// 保存任务状态到localStorage
const saveTaskState = () => {
  try {
    const state = {
      taskId: taskId.value,
      status: taskStatus.value,
      startTime: taskStartTime.value,
      selectedType: selectedType.value,
      selectedSubtype: selectedSubtype.value,
      requirements: copywritingRequirements.value,
      timestamp: Date.now()
    }
    localStorage.setItem('writing_assistant_task', JSON.stringify(state))
  } catch (error) {
    console.error('保存任务状态失败:', error)
  }
}

// 从localStorage加载任务状态
const loadTaskState = () => {
  try {
    const stateJson = localStorage.getItem('writing_assistant_task')
    if (!stateJson) return false
    
    const state = JSON.parse(stateJson)
    
    // 检查任务是否已经过期(3小时过期限制)
    const MAX_TASK_AGE = 3 * 60 * 60 * 1000 // 3小时
    if (Date.now() - state.timestamp > MAX_TASK_AGE) {
      clearTaskState()
      return false
    }
    
    // 恢复任务状态
    taskId.value = state.taskId
    taskStatus.value = state.status
    taskStartTime.value = state.startTime
    selectedType.value = state.selectedType
    selectedSubtype.value = state.selectedSubtype
    copywritingRequirements.value = state.requirements
    
    // 如果任务未完成，则开始轮询
    if (taskStatus.value === TASK_STATUS.WAITING || taskStatus.value === TASK_STATUS.PROCESSING) {
      showCopywritingResults.value = false
      isGenerating.value = true
      startPolling()
      startWaitingTimer()
      return true
    }
    
    return false
      } catch (error) {
    console.error('加载任务状态失败:', error)
    return false
  }
}

// 清除任务状态
const clearTaskState = () => {
  localStorage.removeItem('writing_assistant_task')
  taskId.value = ''
  taskStatus.value = TASK_STATUS.IDLE
  stopWaitingTimer()
  stopPolling()
}

// 开始轮询检查任务状态
const startPolling = () => {
  if (isPollingActive.value) return
  
  isPollingActive.value = true
  pollInterval.value = 5000 // 重置为初始间隔
  
  const poll = async () => {
    try {
      // 从聊天存储中检查是否有新消息
      const hasMessages = chatStore.messages.length > 0
      const lastMessageIsFromBot = hasMessages && chatStore.messages[chatStore.messages.length - 1].role === 'bot'
      
      if (hasMessages) {
        // 如果检测到消息，则更新状态
        if (lastMessageIsFromBot) {
          console.log('检测到AI回复，任务已完成')
          taskStatus.value = TASK_STATUS.COMPLETED
          saveTaskState()
          stopPolling()
          stopWaitingTimer()
          clearTaskState()
          return
        }
      }
      
      // 增加轮询间隔时间，最大不超过maxPollInterval
      pollInterval.value = Math.min(pollInterval.value * 1.5, maxPollInterval)
      
      // 如果仍未完成，继续轮询
      if (taskStatus.value !== TASK_STATUS.COMPLETED && taskStatus.value !== TASK_STATUS.ERROR) {
        pollTimeoutId.value = setTimeout(poll, pollInterval.value)
      }
    } catch (error) {
      console.error('轮询过程出错:', error)
      taskStatus.value = TASK_STATUS.ERROR
      saveTaskState()
    }
  }
  
  // 开始第一次轮询
  pollTimeoutId.value = setTimeout(poll, pollInterval.value)
}

// 停止轮询
const stopPolling = () => {
  if (pollTimeoutId.value) {
    clearTimeout(pollTimeoutId.value)
    pollTimeoutId.value = null
  }
  isPollingActive.value = false
}

// 任务出错时的重试操作
const retryTask = () => {
  if (taskStatus.value === TASK_STATUS.ERROR) {
    taskStatus.value = TASK_STATUS.IDLE
    saveTaskState()
    generateCopywriting()
  }
}

// 页面挂载时检查是否有未完成的任务
onMounted(() => {
  const hasRestoredTask = loadTaskState()
  
  // 如果恢复了任务状态，则开始相关处理
  if (hasRestoredTask) {
    console.log('已恢复未完成的写作任务，继续处理中...')
  }
})

// 页面卸载前确保轮询和计时器被清理
onBeforeUnmount(() => {
  stopPolling()
  stopWaitingTimer()
})

// 测试API连接
const testConnection = async () => {
  await chatStore.checkConnection()
}

const resetForm = () => {
  showCopywritingResults.value = false
  generatedContent.value = ''
}

const copyToClipboard = () => {
  // 移除HTML标签后复制
  const tempElement = document.createElement('div')
  tempElement.innerHTML = formattedContent.value
  const textContent = tempElement.textContent || tempElement.innerText || ''
  
  navigator.clipboard.writeText(textContent)
    .then(() => {
      alert('内容已复制到剪贴板')
    })
    .catch(err => {
      console.error('复制失败:', err)
      alert('复制失败，请手动选择并复制')
    })
}

// 同步到中间层的辅助函数
const syncWithMiddleLayer = async () => {
  try {
    if (!chatStore.isUsingMiddleLayer || !chatStore.currentConversationId) {
      return;
    }
    
    // 注册会话到中间层
    await swManager.registerSession(chatStore.currentConversationId, {
      type: 'solution-assistant',
      name: '写作助手',
      description: '智能写作系统',
      created_at: Date.now()
    });
    
    // 更新会话数据
    await swManager.updateSession(chatStore.currentConversationId, {
      messages: chatStore.sortedMessages,
      last_updated: Date.now()
    });
    
    // 添加会话监听器
    swManager.addSessionListener(chatStore.currentConversationId, handleSessionUpdate);
    
    // 标记为已同步
    syncedWithMiddleLayer.value = true;
    console.log('会话已成功同步到中间层:', chatStore.currentConversationId);
  } catch (error) {
    console.error('同步到中间层失败:', error);
    // 继续操作，即使同步失败
  }
};

// 清理会话的辅助函数
const cleanupSession = async () => {
  try {
    const oldId = chatStore.currentConversationId;
    
    // 如果使用中间层且有会话ID，清理中间层
    if (chatStore.isUsingMiddleLayer && oldId) {
      try {
        await swManager.clearSession(oldId);
        console.log('已清理中间层会话:', oldId);
      } catch (e) {
        console.warn('清理中间层会话失败:', e);
      }
    }
    
    // 清除当前会话ID
    chatStore.currentConversationId = '';
    sessionStorage.removeItem('solution_conversation_id');
    
    // 重置同步状态
    syncedWithMiddleLayer.value = false;
    
    console.log('会话已清理，准备重新开始对话');
  } catch (error) {
    console.error('清理会话失败:', error);
  }
};

// 处理会话更新的辅助函数
const handleSessionUpdate = (event) => {
  console.log('接收到中间层会话更新:', event);
  // 可以在这里添加处理会话更新的逻辑
};

// 处理页面可见性变更
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    // 页面变为可见时
    console.log('写作助手页面恢复可见');
    
    // 如果有当前会话ID，检查会话是否仍然有效
    if (chatStore.currentConversationId) {
      try {
        // 检查会话是否存在于sessionStorage中
        const storedId = sessionStorage.getItem('solution_conversation_id');
        
        if (storedId !== chatStore.currentConversationId) {
          console.log('会话ID不匹配，更新到sessionStorage', {
            stored: storedId,
            current: chatStore.currentConversationId
          });
          sessionStorage.setItem('solution_conversation_id', chatStore.currentConversationId);
        }
        
        // 检查是否有处于流式状态的消息
        const hasStreamingMessage = chatStore.messages.some(msg => msg.isStreaming);
        
        if (hasStreamingMessage) {
          console.log('检测到有流式消息，页面切换回来时自动标记为完成');
          
          // 修正所有流式消息的状态
          chatStore.messages.forEach(msg => {
            if (msg.isStreaming) {
              msg.isStreaming = false;
              msg.content += '\n\n[此消息在页面切换回时已自动标记为已完成]';
            }
          });
          
          // 强制重置所有状态变量
          chatStore.isLoading = false;
          chatStore.isStreaming = false;
          chatStore.isGenerating = false;
          chatStore.currentTask = null;
        }
        
        // 如果使用中间层，检查会话是否同步
        if (chatStore.isUsingMiddleLayer && !syncedWithMiddleLayer.value) {
          await syncWithMiddleLayer();
        }
      } catch (error) {
        console.warn('页面恢复可见时同步会话状态失败:', error);
      }
    }
    
    // 重新检查API连接状态
    try {
      await chatStore.checkConnection();
    } catch (e) {
      console.warn('检查API连接状态失败:', e);
    }
  } else if (document.visibilityState === 'hidden') {
    // 页面隐藏时，确保会话ID被保存
    if (chatStore.currentConversationId) {
      console.log('写作助手页面隐藏，保存会话状态');
      sessionStorage.setItem('solution_conversation_id', chatStore.currentConversationId);
      
      // 如果使用中间层，确保最新状态已同步
      if (chatStore.isUsingMiddleLayer && syncedWithMiddleLayer.value) {
        try {
          await swManager.updateSession(chatStore.currentConversationId, {
            messages: chatStore.sortedMessages,
            last_updated: Date.now()
          });
        } catch (error) {
          console.warn('页面隐藏时同步到中间层失败:', error);
        }
      }
    }
  }
};

// 生命周期钩子注册
onBeforeUnmount(() => {
  try {
    // 如果有活跃会话且使用中间层，标记会话完成
    if (chatStore.isUsingMiddleLayer && chatStore.currentConversationId && syncedWithMiddleLayer.value) {
      try {
        console.log('写作助手页面卸载，标记会话完成', chatStore.currentConversationId);
        swManager.completeSession(chatStore.currentConversationId);
      } catch (error) {
        console.error('标记会话完成失败:', error);
      }
    }
    
    // 移除事件监听器
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    
    // 保存会话ID到sessionStorage
    if (chatStore.currentConversationId) {
      sessionStorage.setItem('solution_conversation_id', chatStore.currentConversationId);
    }
  } catch (error) {
    console.error('组件卸载清理失败:', error);
  }
});

// 页面加载时初始化
onMounted(async () => {
  try {
    // 初始化聊天状态，使用方案助手APP_TYPE
    await chatStore.initialize(chatAPI.APP_TYPES.SOLUTION);
    
    // 检查API连接状态
    await chatStore.checkConnection();
    
    // 恢复会话流程
    let sessionLoaded = false;
    
    // 尝试从sessionStorage中恢复会话ID
    const sessionId = sessionStorage.getItem('solution_conversation_id');
    
    if (sessionId) {
      // 验证会话ID格式
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(sessionId)) {
        console.log('从sessionStorage恢复会话:', sessionId);
        
        try {
          // 尝试切换到该会话，这会重置所有状态变量
          await chatStore.switchConversation(sessionId);
          
          // 标记会话已加载
          sessionLoaded = true;
          
          // 直接从后端获取历史消息
          console.log('直接从后端获取历史消息');
          await chatStore.fetchMessages(sessionId);
          console.log('获取消息完成，消息数量:', chatStore.messages.length);
          
          // 确保所有状态变量重置
          chatStore.isLoading = false;
          chatStore.isStreaming = false;
          chatStore.isGenerating = false;
          chatStore.currentTask = null;
          
          // 尝试从中间层恢复会话中的消息
          if (chatStore.isUsingMiddleLayer) {
            try {
              const restored = await chatStore.tryRestoreSessionFromMiddleLayer();
              if (restored) {
                console.log('成功从中间层恢复会话消息');
                syncedWithMiddleLayer.value = true;
                
                // 检查所有消息，确保没有处于流式状态的
                chatStore.messages.forEach(msg => {
                  if (msg.isStreaming) {
                    msg.isStreaming = false;
                    msg.content += '\n\n[此消息在页面加载时已自动标记为已完成]';
                    console.log('检测到流式消息，已标记为完成');
                  }
                });
              } else {
                // 同步到中间层
                await syncWithMiddleLayer();
              }
            } catch (e) {
              console.warn('从中间层恢复会话失败:', e);
            }
          }
        } catch (error) {
          console.warn('恢复会话失败:', error);
          
          // 如果是会话不存在错误，则清理会话ID
          if (error.message && error.message.includes('Conversation Not Exists')) {
            await cleanupSession();
            sessionLoaded = false;
          }
        }
      } else {
        console.warn('会话ID格式不正确:', sessionId);
        sessionStorage.removeItem('solution_conversation_id');
      }
    }
    
    // 如果没有恢复到有效会话，则准备新会话环境
    if (!sessionLoaded) {
      console.log('准备新对话环境');
      
      // 设置应用类型为方案助手
      chatStore.setAppType(chatAPI.APP_TYPES.SOLUTION);
      
      // 清除当前会话ID
      chatStore.currentConversationId = '';
      
      // 重置同步状态
      syncedWithMiddleLayer.value = false;
      
      // 确保所有状态变量重置
      chatStore.isLoading = false;
      chatStore.isStreaming = false;
      chatStore.isGenerating = false;
      chatStore.currentTask = null;
    }
    
    // 添加页面可见性变更监听
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 标记组件为已就绪
    isComponentReady.value = true;
  } catch (error) {
    console.error('初始化组件失败:', error);
    isComponentReady.value = true; // 即使失败也设置为就绪，允许用户操作
  }
});
</script>

<style scoped>
/* 输入框自适应高度 */
textarea {
  max-height: 200px;
  min-height: 42px;
}

/* 用于思考框的样式 */
:deep(.thinking-box) {
  background-color: rgba(25, 22, 55, 0.6);
  border: 1px solid rgba(138, 109, 241, 0.3);
  border-radius: 0.5rem;
  margin: 0.75rem 0;
  padding: 0.75rem;
  position: relative;
  overflow: hidden;
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(138, 109, 241, 0.5);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(138, 109, 241, 0.8);
}

/* 消息输入状态动画 */
.typing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  margin: 0 4px;
  background-color: #8a6df1;
  border-radius: 50%;
  display: inline-block;
  animation: dot-pulse 1.5s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot-pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
}

/* Markdown内容样式 - 写作模式 */
:deep(.prose) {
  color: #e2e8f0;
}

:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4) {
  color: white;
  margin-top: 1.5em;
  margin-bottom: 0.75em;
}

:deep(.prose p) {
  margin-top: 1em;
  margin-bottom: 1em;
}

:deep(.prose ul),
:deep(.prose ol) {
  margin-top: 1em;
  margin-bottom: 1em;
  padding-left: 1.5em;
}

:deep(.prose li) {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

:deep(.prose a) {
  color: #8a6df1;
  text-decoration: underline;
}

:deep(.prose blockquote) {
  border-left: 4px solid #8a6df1;
  padding-left: 1em;
  font-style: italic;
  color: #a0aec0;
}

:deep(.prose code) {
  color: #f7fafc;
  background: rgba(45, 45, 80, 0.5);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
}

:deep(.prose pre) {
  background: #191637;
  border-radius: 8px;
  padding: 1em;
  overflow-x: auto;
}

:deep(.prose pre code) {
  background: transparent;
  padding: 0;
  color: #f7fafc;
}

:deep(.prose table) {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1em;
  margin-bottom: 1em;
}

:deep(.prose th),
:deep(.prose td) {
  padding: 0.5em;
  border: 1px solid #4a5568;
}

:deep(.prose th) {
  background: rgba(45, 45, 80, 0.5);
}
</style> 