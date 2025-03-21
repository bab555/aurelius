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
              @change="onSubtypeChange"
            >
              <option value="" disabled>请选择细分类型</option>
              <option v-for="(subtype, index) in subtypeOptions" :key="index" :value="subtype.value">
                {{ subtype.name }}
              </option>
            </select>
          </div>
          
          <!-- 创意写作的二级细分选择区域 -->
          <div v-if="selectedType === 'creative' && selectedSubtype" class="mb-6">
            <label class="block text-white text-sm font-medium mb-2">选择二级细分类型</label>
            <select 
              v-model="copywritingnextType" 
              class="w-full bg-[#191637] text-white border border-gray-700 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="" disabled>请选择二级细分类型</option>
              <option v-for="(subtype, index) in secondarySubtypeOptions" :key="index" :value="subtype.value">
                {{ subtype.name }}
              </option>
            </select>
          </div>
          
          <!-- 预期字数输入区域 -->
          <div class="mb-6">
            <label class="block text-white text-sm font-medium mb-2">预期字数 <span class="text-xs text-gray-400">({{ getMaxWordCountText }}，可选)</span></label>
            <input 
              v-model.number="textnumber" 
              type="number"
              min="1"
              :max="maxWordCount" 
              @input="enforceWordCountLimit"
              class="w-full bg-[#191637] text-white border border-gray-700 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="请输入预期字数（可选）"
            />
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
          <div class="flex items-center mb-3">
            <div class="mr-3 writing-animation">
              <div class="pencil">
                <div class="pencil-body"></div>
                <div class="pencil-point"></div>
                <div class="pencil-eraser"></div>
                <div class="pencil-lines"></div>
              </div>
              <div class="paper">
                <div class="paper-content"></div>
              </div>
            </div>
            <div>
              <div class="mb-1">正在处理您的写作请求，请耐心等待</div>
              <div class="text-sm text-gray-400">已用时 {{ waitingTimeDisplay }}</div>
            </div>
          </div>
          <p class="mt-2 text-sm text-gray-400">
            <span class="text-red-400 font-medium">请勿关闭、刷新页面或切换到其他页面</span>，这可能导致生成过程中断。写作生成是阻塞式处理，需要后端完成全部内容后才会返回结果，超长文本可能需要较长时间，请耐心等待。
          </p>
          <div class="mt-2 text-xs text-gray-400 flex items-center">
            <span class="inline-block w-2 h-2 rounded-full mr-1" 
                :class="{'bg-green-500': chatStore.connectionStatus === 'connected', 'bg-red-500': chatStore.connectionStatus !== 'connected'}"></span>
            <span>连接状态: {{ chatStore.connectionStatus === 'connected' ? '正常' : '异常，请刷新页面' }}</span>
          </div>
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
            <button @click="refreshResult"
                    class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm">
              刷新结果
            </button>
            <button @click="resetForm" 
                    class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm">
              修改需求
            </button>
          </div>
        </div>

        <!-- 生成的写作结果 -->
        <div v-else class="flex-1 overflow-y-auto custom-scrollbar min-h-0 prose prose-invert max-w-none">
          <!-- 移除流式状态指示器 -->
          
          <div v-if="generatedContent" v-html="formattedContent" class="p-2"></div>
          <div v-else class="text-center text-gray-400 my-10">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p>正在加载内容，请稍候...</p>
          </div>
          
          <!-- 成功状态提示 -->
          <div v-if="taskStatus === TASK_STATUS.COMPLETED && generatedContent" 
               class="bg-green-900/20 rounded-lg p-3 mb-4 mt-4 text-white border border-green-500/30">
            <div class="flex items-center">
              <i class="fas fa-check-circle mr-2 text-green-500"></i>
              <span>内容生成成功</span>
            </div>
            <p class="mt-2 text-sm text-gray-400">
              内容已成功生成。您可以复制全文，或返回编辑重新生成。如果内容不完整，请点击"刷新结果"按钮。
            </p>
          </div>
          
          <!-- 操作按钮区域 -->
          <div class="flex justify-center mt-8 mb-4">
            <button 
              @click="refreshResult"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors mr-4"
            >
              刷新结果
            </button>
            <button
              @click="resetForm" 
              class="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors mr-4"
            >
              返回编辑
            </button>
            <button 
              @click="copyToClipboard"
              class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              :disabled="!generatedContent"
            >
              复制全文
            </button>
          </div>
          
          <!-- 调试信息区域 -->
          <div class="mt-4 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400 border border-gray-700">
            <details>
              <summary class="cursor-pointer hover:text-gray-300">调试信息</summary>
              <div class="mt-2 space-y-1">
                <div>生成状态: {{ isGenerating ? '生成中' : '空闲' }}</div>
                <div>连接状态: {{ chatStore.connectionStatus }}</div>
                <div>消息数量: {{ chatStore.messages.length }}</div>
                <div>任务状态: {{ taskStatus }}</div>
                <div><button @click="refreshResult" class="text-blue-400 hover:underline">刷新结果</button></div>
              </div>
            </details>
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
const copywritingnextType = ref('')
const copywritingRequirements = ref('')
const textnumber = ref(0)

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
const heartbeatInterval = ref(null) // 心跳间隔标识符

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
         (selectedType.value !== 'creative' || copywritingnextType.value) && // 创意写作需要二级分类
         copywritingRequirements.value.trim().length > 0 &&
         (textnumber.value === 0 || (textnumber.value > 0 && textnumber.value <= maxWordCount.value)) // 字数为非必填项
})

// 字数限制逻辑
const maxWordCount = computed(() => {
  if (selectedType.value === 'technical' || selectedType.value === 'business') {
    return 15000;
  } else if (selectedType.value === 'media' || selectedType.value === 'official') {
    return 8000;
  } else if (selectedType.value === 'creative') {
    return 23000;
  }
  return 10000; // 默认值
})

// 字数限制提示文本
const getMaxWordCountText = computed(() => {
  return `最大限制${maxWordCount.value}字`;
})

// 创意写作二级细分类型选项
const secondarySubtypeOptions = computed(() => {
  if (!selectedType.value || selectedType.value !== 'creative' || !selectedSubtype.value) {
    return [];
  }
  
  // 根据一级细分类型返回对应的二级细分选项
  switch (selectedSubtype.value) {
    case 'short_story':
      return [
        { name: '科幻小说', value: 'scifi_story' },
        { name: '悬疑小说', value: 'mystery_story' },
        { name: '言情小说', value: 'romance_story' },
        { name: '奇幻小说', value: 'fantasy_story' }
      ];
    case 'poetry':
      return [
        { name: '现代诗', value: 'modern_poetry' },
        { name: '古体诗', value: 'classical_poetry' },
        { name: '格律诗', value: 'metric_poetry' },
        { name: '自由诗', value: 'free_poetry' }
      ];
    case 'script':
      return [
        { name: '影视剧本', value: 'film_script' },
        { name: '舞台剧本', value: 'stage_script' },
        { name: '广告脚本', value: 'ad_script' },
        { name: '短视频脚本', value: 'short_video_script' }
      ];
    case 'narrative':
      return [
        { name: '游记散文', value: 'travel_narrative' },
        { name: '回忆录', value: 'memoir_narrative' },
        { name: '人物传记', value: 'biography_narrative' },
        { name: '抒情散文', value: 'lyrical_narrative' }
      ];
    default:
      return [];
  }
})

// 格式化后的内容
const formattedContent = computed(() => {
  if (!generatedContent.value) return ''
  
  // 检查内容是否为空或只包含空白字符
  const trimmedContent = generatedContent.value.trim()
  if (!trimmedContent) return '<p class="text-gray-400">生成的内容为空，请点击"刷新结果"按钮重试</p>'
  
  // 检查内容是否为错误信息
  if (trimmedContent.toLowerCase().includes('error') || 
      trimmedContent.toLowerCase().includes('错误') ||
      trimmedContent.includes('请稍后再试')) {
    console.warn('检测到可能的错误内容:', trimmedContent)
    // 如果是错误信息，将任务状态设置为错误
    if (taskStatus.value !== TASK_STATUS.ERROR) {
      taskStatus.value = TASK_STATUS.ERROR
      saveTaskState()
    }
    return `<p class="text-red-400">${trimmedContent}</p>`
  }
  
  // 简单处理纯文本，保留换行，类似Word显示
  const textWithBreaks = trimmedContent
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

const onSubtypeChange = () => {
  // 重置二级子类型选择
  copywritingnextType.value = ''
}

// 限制字数输入不超过最大值
const enforceWordCountLimit = () => {
  if (textnumber.value > maxWordCount.value) {
    textnumber.value = maxWordCount.value;
  }
}

// 生成写作内容
const generateCopywriting = async () => {
  if (!isFormValid.value) {
    return
  }
  
  // 检查健康状态
  if (chatStore.connectionStatus !== 'connected') {
    // 如果连接状态不是已连接，则尝试重新连接
    try {
      await chatStore.checkConnection()
      // 如果在检查后仍未连接，提示用户
      if (chatStore.connectionStatus !== 'connected') {
        alert('系统连接状态异常，请稍后再试或刷新页面。')
        return
      }
    } catch (error) {
      console.error('连接检查失败:', error)
      alert('系统连接状态异常，请稍后再试或刷新页面。')
      return
    }
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
  
  // 启动心跳机制
  startHeartbeat()
  
  try {
    // 构建提示词
    const selectedTypeText = copywritingTypes.value.find(t => t.value === selectedType.value)?.name || ''
    const selectedSubtypeText = subtypeOptions.value.find(st => st.value === selectedSubtype.value)?.name || ''
    
    // 获取二级细分类型文本
    let secondarySubtypeText = ''
    if (selectedType.value === 'creative' && copywritingnextType.value) {
      const options = secondarySubtypeOptions.value
      secondarySubtypeText = options.find(st => st.value === copywritingnextType.value)?.name || ''
    }
    
    let promptText = `我需要一篇${selectedTypeText}中的${selectedSubtypeText}`
    
    // 如果有二级细分类型，添加到提示词中
    if (secondarySubtypeText) {
      promptText += `（${secondarySubtypeText}）`
    }
    
    // 只有在字数大于等于100时才添加预期字数到提示词
    if (textnumber.value >= 100) {
      promptText += `，预期字数${textnumber.value}字。`
    } else {
      promptText += `。`
    }
    
    // 添加用户需求
    promptText += `\n\n以下是具体要求：\n\n${copywritingRequirements.value}`
    
    // 准备API请求的参数
    const { apiKey } = chatAPI.getCredentials(chatAPI.APP_TYPES.SOLUTION)
    const userId = sessionStorage.getItem('chat_user_id') || 'anonymous_user'
    
    // 构建完整的请求体
    const requestBody = {
      query: promptText,
      user: userId,
      response_mode: 'blocking', // 关键：使用阻塞模式
      inputs: {
        copywritingType: selectedTypeText,
        copywritingSubtype: selectedSubtypeText
      }
    }
    
    // 只有在已有对话ID时才添加到请求中
    if (chatStore.currentConversationId) {
      requestBody.conversation_id = chatStore.currentConversationId
    }
    
    // 只有创意写作且选择了二级分类才添加copywritingnextType
    if (selectedType.value === 'creative' && copywritingnextType.value && secondarySubtypeText) {
      requestBody.inputs.copywritingnextType = secondarySubtypeText
    }
    
    // 只有在字数大于等于100时才添加字数字段
    if (textnumber.value >= 100) {
      requestBody.inputs.textnumber = textnumber.value
    }
    
    // 清除之前的内容和状态
    generatedContent.value = ''
    
    // 发送消息并切换到结果查看模式
    showCopywritingResults.value = true
    isGenerating.value = true
    
    // 设置处理中状态
    taskStatus.value = TASK_STATUS.PROCESSING
    saveTaskState()
    
    console.log('准备发送写作请求, 参数:', JSON.stringify(requestBody, null, 2))
    
    // 直接使用fetch API发送请求，绕过chatStore
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    console.log('写作请求已完成，状态码:', response.status)
    
    // 处理非200状态码
    if (!response.ok) {
      const errorText = await response.text().catch(() => '无法获取错误详情')
      console.error('API请求错误:', response.status, errorText)
      throw new Error(`请求失败: ${response.status} ${response.statusText}\n${errorText}`)
    }
    
    // 解析阻塞式响应的JSON结果
    const result = await response.json()
    console.log('获取到完整结果:', result)
    
    // 关键步骤：保存后端返回的会话ID
    if (result.conversation_id) {
      console.log('保存后端返回的会话ID:', result.conversation_id)
      chatStore.currentConversationId = result.conversation_id
      sessionStorage.setItem('solution_conversation_id', result.conversation_id)
      
      // 同步当前会话ID到消息对象
      if (result.message_id) {
        const userMessageId = result.message_id + '-user'
        
        // 添加用户消息到消息列表
        chatStore.messages.push({
          id: userMessageId,
          role: 'user',
          content: promptText,
          conversation_id: result.conversation_id,
          created_at: Date.now() / 1000 - 1
        })
        
        // 添加AI回复消息
        const botMessage = {
          id: result.message_id,
          role: 'assistant', // 使用assistant角色，与chatAPI.js保持一致
          content: result.answer || '',
          conversation_id: result.conversation_id,
          created_at: Date.now() / 1000,
          isComplete: true
        }
        
        chatStore.messages.push(botMessage)
        console.log('已添加消息到chatStore，消息数:', chatStore.messages.length)
      }
    } else {
      console.warn('后端未返回conversation_id，这可能导致后续无法查询历史消息')
    }
    
    // 提取生成的内容
    if (result.answer) {
      console.log('提取生成的内容，长度:', result.answer.length)
      generatedContent.value = result.answer
      
      // 更新任务状态为已完成
      taskStatus.value = TASK_STATUS.COMPLETED
      saveTaskState()
      stopWaitingTimer()
      stopHeartbeat()
      
      // 延迟清理任务状态
      setTimeout(() => {
        clearTaskState()
      }, 10000)
    } else {
      console.warn('API响应成功但未找到answer字段')
      throw new Error('API响应格式异常，未找到生成的内容')
    }
  } catch (error) {
    console.error('生成写作内容失败:', error)
    taskStatus.value = TASK_STATUS.ERROR
    saveTaskState()
    stopHeartbeat()
    stopWaitingTimer()
    
    // 显示错误信息
    if (error && error.message) {
      generatedContent.value = `生成内容时发生错误: ${error.message}`
    } else {
      generatedContent.value = '生成内容时发生未知错误，请稍后重试。'
    }
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
      copywritingnextType: copywritingnextType.value,
      requirements: copywritingRequirements.value,
      timestamp: Date.now()
    }
    
    // 只有在字数大于等于100时才将字数添加到状态中
    if (textnumber.value >= 100) {
      state.textnumber = textnumber.value
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
    copywritingnextType.value = state.copywritingnextType || ''
    copywritingRequirements.value = state.requirements
    
    // 处理没有textnumber字段的情况
    textnumber.value = state.textnumber !== undefined ? state.textnumber : 0
    
    // 根据任务状态执行不同操作
    if (taskStatus.value === TASK_STATUS.WAITING || taskStatus.value === TASK_STATUS.PROCESSING) {
      // 如果任务在等待或处理中，显示结果视图并开始轮询
      showCopywritingResults.value = true
      isGenerating.value = true
      
      // 启动轮询、计时器和心跳
      startPolling()
      startWaitingTimer()
      startHeartbeat()
      
      return true
    } else if (taskStatus.value === TASK_STATUS.COMPLETED) {
      // 如果任务已完成，显示结果视图
      showCopywritingResults.value = true
      return true
    } else if (taskStatus.value === TASK_STATUS.ERROR) {
      // 如果任务出错，显示结果视图
      showCopywritingResults.value = true
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
      // 检查健康状态
      if (chatStore.connectionStatus !== 'connected') {
        try {
          await chatStore.checkConnection()
        } catch (e) {
          console.warn('轮询时检查连接状态失败:', e)
        }
      }
      
      console.log('轮询检查结果...')
      
      // 检查是否有结果
      let hasResult = false
      
      // 1. 先从聊天存储中检查是否有新消息
      const hasMessages = chatStore.messages.length > 0
      const lastMessageIsFromBot = hasMessages && chatStore.messages[chatStore.messages.length - 1].role === 'bot'
      
      if (hasMessages && lastMessageIsFromBot) {
        console.log('检测到AI回复，任务已完成')
        hasResult = true
        
        // 保存生成的内容
        const lastBotMessage = chatStore.messages[chatStore.messages.length - 1]
        generatedContent.value = lastBotMessage.content
      }
      
      // 2. 如果没有检测到消息，但任务ID存在，尝试从API获取消息
      if (!hasResult && taskId.value && chatStore.currentConversationId) {
        try {
          // 尝试刷新消息
          console.log('从API获取最新消息...')
          await chatStore.fetchMessages(chatStore.currentConversationId)
          
          // 再次检查是否有机器人消息
          if (chatStore.messages.length > 0) {
            const lastBotMessage = [...chatStore.messages].reverse().find(msg => msg.role === 'bot')
            if (lastBotMessage) {
              console.log('通过API刷新获取到消息')
              hasResult = true
              generatedContent.value = lastBotMessage.content
            }
          }
        } catch (error) {
          console.warn('轮询时获取消息失败:', error)
        }
      }
      
      // 如果找到了结果，更新状态并停止轮询
      if (hasResult) {
        showCopywritingResults.value = true
        taskStatus.value = TASK_STATUS.COMPLETED
        saveTaskState()
        stopPolling()
        stopWaitingTimer()
        stopHeartbeat()
        
        // 延迟清理任务状态，让用户有时间看到结果
        setTimeout(() => {
          clearTaskState()
        }, 10000) // 10秒后清理任务状态
        
        return
      }
      
      // 增加轮询间隔时间，最大不超过maxPollInterval
      pollInterval.value = Math.min(pollInterval.value * 1.5, maxPollInterval)
      
      // 如果仍未完成，继续轮询
      if (taskStatus.value !== TASK_STATUS.COMPLETED && taskStatus.value !== TASK_STATUS.ERROR) {
        console.log(`继续轮询，下次间隔 ${pollInterval.value}ms`)
        pollTimeoutId.value = setTimeout(poll, pollInterval.value)
      }
    } catch (error) {
      console.error('轮询过程出错:', error)
      // 轮询错误不要立即设置错误状态，继续尝试
      if (pollTimeoutId.value) {
        clearTimeout(pollTimeoutId.value)
      }
      pollTimeoutId.value = setTimeout(poll, pollInterval.value)
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
const retryTask = async () => {
  if (taskStatus.value === TASK_STATUS.ERROR) {
    // 检查连接状态
    if (chatStore.connectionStatus !== 'connected') {
      try {
        await chatStore.checkConnection()
        if (chatStore.connectionStatus !== 'connected') {
          alert('系统连接状态异常，请稍后再试或刷新页面。')
          return
        }
      } catch (error) {
        console.error('连接检查失败:', error)
        alert('系统连接状态异常，请稍后再试或刷新页面。')
        return
      }
    }
    
    // 重置任务状态为空闲
    taskStatus.value = TASK_STATUS.IDLE
    saveTaskState()
    
    // 重新开始生成流程
    await generateCopywriting()
  }
}

// 重置表单，返回到编辑模式
const resetForm = () => {
  // 清除任务状态
  clearTaskState()
  
  // 切换回编辑模式
  showCopywritingResults.value = false
  generatedContent.value = ''
}

// 页面加载完成后，检查是否有等待显示的结果
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
          
          // 如果有本地保存的任务
          const hasRestoredTask = loadTaskState();
          
          if (hasRestoredTask) {
            console.log('已恢复未完成的写作任务');
            
            // 检查消息是否已经有内容
            if (chatStore.messages.length > 0) {
              const lastBotMessage = [...chatStore.messages].reverse().find(msg => msg.role === 'bot');
              if (lastBotMessage) {
                generatedContent.value = lastBotMessage.content;
                console.log('已从消息中恢复内容');
                
                // 如果状态是等待或处理中，但已有结果，则更新为已完成
                if (taskStatus.value === TASK_STATUS.WAITING || taskStatus.value === TASK_STATUS.PROCESSING) {
                  taskStatus.value = TASK_STATUS.COMPLETED;
                  saveTaskState();
                  stopWaitingTimer();
                  stopHeartbeat();
                }
              }
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
    
    // 如果没有恢复到会话，但有任务状态
    if (!sessionLoaded) {
      const hasRestoredTask = loadTaskState();
      
      if (hasRestoredTask) {
        console.log('已恢复写作任务，但没有会话ID');
        // 这种情况下可能需要重新发起请求
        if (taskStatus.value === TASK_STATUS.WAITING || taskStatus.value === TASK_STATUS.PROCESSING) {
          // 显示错误状态，提示用户刷新重试
          taskStatus.value = TASK_STATUS.ERROR;
          saveTaskState();
        }
      } else {
        // 全新状态
        console.log('准备新对话环境');
        
        // 设置应用类型为方案助手
        chatStore.setAppType(chatAPI.APP_TYPES.SOLUTION);
        
        // 清除当前会话ID
        chatStore.currentConversationId = '';
      }
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

// 测试API连接
const testConnection = async () => {
  await chatStore.checkConnection()
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
        
        // 如果有未完成任务，检查是否有新消息
        if (taskStatus.value === TASK_STATUS.WAITING || taskStatus.value === TASK_STATUS.PROCESSING) {
          console.log('页面重新可见，检查任务状态');
          
          // 检查是否有消息
          if (chatStore.messages.length > 0) {
            const lastBotMessage = [...chatStore.messages].reverse().find(msg => msg.role === 'bot');
            if (lastBotMessage) {
              console.log('检测到已有回复，更新任务状态');
              generatedContent.value = lastBotMessage.content;
              taskStatus.value = TASK_STATUS.COMPLETED;
              saveTaskState();
              stopWaitingTimer();
              stopHeartbeat();
              stopPolling();
            }
          } else {
            // 可能需要刷新消息
            try {
              await chatStore.fetchMessages(chatStore.currentConversationId);
              // 再次检查
              if (chatStore.messages.length > 0) {
                const lastBotMessage = [...chatStore.messages].reverse().find(msg => msg.role === 'bot');
                if (lastBotMessage) {
                  console.log('刷新后检测到回复，更新任务状态');
                  generatedContent.value = lastBotMessage.content;
                  taskStatus.value = TASK_STATUS.COMPLETED;
                  saveTaskState();
                  stopWaitingTimer();
                  stopHeartbeat();
                  stopPolling();
                }
              }
            } catch (e) {
              console.warn('页面可见后刷新消息失败:', e);
            }
          }
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

// 开始心跳机制，定期发送请求保持连接活跃
const startHeartbeat = () => {
  if (heartbeatInterval.value) {
    clearInterval(heartbeatInterval.value)
  }
  
  // 每30秒发送一次心跳请求
  heartbeatInterval.value = setInterval(async () => {
    try {
      if (chatStore.connectionStatus !== 'connected') {
        await chatStore.checkConnection()
      }
      
      // 如果有会话ID，尝试获取一次消息状态
      if (chatStore.currentConversationId) {
        console.log('发送心跳，保持连接活跃...')
        try {
          // 直接使用现有API保持连接活跃
          await chatStore.fetchMessages(chatStore.currentConversationId, 1)
          
          // 检查是否有新消息
          if (chatStore.messages.length > 0) {
            const lastBotMessage = [...chatStore.messages].reverse().find(msg => msg.role === 'bot')
            if (lastBotMessage && !generatedContent.value) {
              console.log('在心跳检查中发现新消息')
              generatedContent.value = lastBotMessage.content
              
              // 设置为完成状态
              taskStatus.value = TASK_STATUS.COMPLETED
              saveTaskState()
              
              // 停止轮询和计时器
              stopPolling()
              stopWaitingTimer()
              stopHeartbeat()
            }
          }
        } catch (error) {
          console.warn('心跳消息获取失败:', error)
        }
      }
    } catch (error) {
      console.warn('心跳请求失败:', error)
    }
  }, 30000) // 30秒间隔
}

// 停止心跳机制
const stopHeartbeat = () => {
  if (heartbeatInterval.value) {
    clearInterval(heartbeatInterval.value)
    heartbeatInterval.value = null
  }
}

// 添加刷新结果的方法
const refreshResult = async () => {
  if (!chatStore.currentConversationId) return false
  
  try {
    // 显示加载状态
    const originalContent = generatedContent.value
    generatedContent.value = "正在刷新结果..."
    
    // 获取最新消息
    const response = await chatStore.fetchMessages(chatStore.currentConversationId)
    
    // 检查是否有机器人消息
    if (chatStore.messages.length > 0) {
      // 查找最后一条bot消息
      const lastBotMessage = [...chatStore.messages].reverse().find(msg => msg.role === 'bot' || msg.role === 'assistant')
      
      if (lastBotMessage) {
        console.log('刷新找到消息，长度:', lastBotMessage.content.length)
        generatedContent.value = lastBotMessage.content
        
        // 设置为完成状态
        if (taskStatus.value !== TASK_STATUS.COMPLETED) {
          taskStatus.value = TASK_STATUS.COMPLETED
          saveTaskState()
          stopWaitingTimer()
          stopHeartbeat()
        }
        
        return true
      } else {
        console.warn('未找到机器人消息')
        generatedContent.value = originalContent || "未找到生成的内容，可能正在处理中..."
      }
    } else {
      console.warn('消息列表为空')
      generatedContent.value = originalContent || "未找到生成的内容，请稍后再试..."
    }
    
    return false
  } catch (error) {
    console.error('刷新结果失败:', error)
    generatedContent.value = originalContent || "刷新失败，请稍后再试..."
    return false
  }
}

// 添加一个函数确保在切换到结果视图时能正确处理结果的显示
const ensureResultsDisplayed = async () => {
  // 如果已经有内容，直接返回
  if (generatedContent.value) return;
  
  // 如果任务状态为已完成，但没有内容，尝试获取
  if (taskStatus.value === TASK_STATUS.COMPLETED && chatStore.currentConversationId) {
    try {
      console.log('尝试获取结果内容');
      await chatStore.fetchMessages(chatStore.currentConversationId);
      
      // 检查是否有机器人消息
      if (chatStore.messages.length > 0) {
        const lastBotMessage = [...chatStore.messages].reverse().find(msg => msg.role === 'bot');
        if (lastBotMessage) {
          console.log('找到结果内容');
          generatedContent.value = lastBotMessage.content;
        } else {
          console.log('未找到机器人消息');
        }
      } else {
        console.log('未找到任何消息');
      }
    } catch (error) {
      console.error('获取结果内容失败:', error);
    }
  }
}

// 修改显示结果视图的逻辑
watch(showCopywritingResults, async (newValue) => {
  if (newValue) {
    // 当切换到结果视图时，确保能显示内容
    await ensureResultsDisplayed();
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

/* 写作动画样式 */
.writing-animation {
  position: relative;
  width: 40px;
  height: 40px;
}

.pencil {
  position: absolute;
  top: 0;
  left: 0;
  width: 10px;
  height: 30px;
  transform-origin: 50% 100%;
  animation: pencil-writing 2s infinite;
}

.pencil-body {
  position: absolute;
  top: 0;
  left: 4px;
  width: 6px;
  height: 20px;
  background: linear-gradient(to bottom, #ffca28, #ffa000);
  border-radius: 1px 1px 0 0;
}

.pencil-point {
  position: absolute;
  bottom: 10px;
  left: 4px;
  width: 6px;
  height: 6px;
  background: #424242;
  clip-path: polygon(50% 100%, 0 0, 100% 0);
}

.pencil-eraser {
  position: absolute;
  top: -4px;
  left: 4px;
  width: 6px;
  height: 4px;
  background: #e57373;
  border-radius: 3px 3px 0 0;
}

.pencil-lines {
  position: absolute;
  top: 5px;
  left: 4px;
  width: 6px;
  height: 10px;
  background: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 2px,
    #ffecb3 2px,
    #ffecb3 4px
  );
}

.paper {
  position: absolute;
  bottom: 0;
  left: 15px;
  width: 25px;
  height: 20px;
  background: #f5f5f5;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.paper-content {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 19px;
  height: 14px;
  overflow: hidden;
}

.paper-content:before {
  content: "";
  position: absolute;
  top: 0;
  left: -20px;
  width: 100%;
  height: 14px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    transparent 50%, 
    #8a6df1 50%, 
    #8a6df1 55%, 
    transparent 55%, 
    transparent 100%
  );
  background-size: 200% 100%;
  animation: writing-line 3s infinite ease-in-out;
}

@keyframes pencil-writing {
  0%, 10% {
    transform: translate(0, 0) rotate(-2deg);
  }
  20% {
    transform: translate(5px, 0) rotate(2deg);
  }
  30% {
    transform: translate(10px, 0) rotate(-2deg);
  }
  40% {
    transform: translate(15px, 0) rotate(2deg);
  }
  50% {
    transform: translate(20px, 0) rotate(-2deg);
  }
  60% {
    transform: translate(15px, 0) rotate(2deg);
  }
  70% {
    transform: translate(10px, 0) rotate(-2deg);
  }
  80% {
    transform: translate(5px, 0) rotate(2deg);
  }
  90%, 100% {
    transform: translate(0, 0) rotate(-2deg);
  }
}

@keyframes writing-line {
  0% {
    left: -20px;
  }
  100% {
    left: 20px;
  }
}
</style> 