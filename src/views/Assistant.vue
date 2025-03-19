<template>
  <div class="flex-1 flex flex-col relative h-screen">
    <!-- 组件加载指示器 -->
    <div v-if="!isComponentReady" class="absolute inset-0 flex items-center justify-center bg-[#0e0b36]/80 z-10">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    
    <div class="p-4 md:p-8 flex flex-col h-full">
      <!-- 页面标题 -->
      <div class="mb-6 flex-shrink-0">
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">文旅助手</h1>
        <p class="text-gray-400 text-sm">专为浙江省丽水市云和县定制的智能AI导游，提供景点推荐、行程规划和文化探索</p>
        
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
      
      <!-- 聊天区域 - 使用flex-1确保填充可用空间 -->
      <div class="flex-1 bg-[#0e0b36] p-4 md:p-6 mb-4 rounded-lg flex flex-col min-h-0">
        <!-- 聊天记录 - 确保有明确的高度和滚动设置 -->
        <div class="flex-1 overflow-y-auto custom-scrollbar min-h-0" ref="chatContainer">
          <!-- 加载状态 -->
          <div v-if="isLoading && messages.length === 0" class="flex justify-center py-10">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>

          <!-- 错误提示 -->
          <div v-if="chatStore.error" class="flex justify-center py-4">
            <div class="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg">
              {{ chatStore.error }}
            </div>
          </div>
          
          <div v-if="messages.length === 0 && !isLoading" class="h-full flex flex-col items-center justify-center text-center px-4">
            <div class="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <i class="fas fa-globe text-primary text-2xl"></i>
            </div>
            <h3 class="text-lg font-medium mb-2">欢迎使用文旅助手</h3>
            <p class="text-gray-400 text-sm max-w-md mb-8">
              我是您的智能旅游与文化顾问，可以推荐景点、规划行程、讲解历史文化，让您的旅行更加丰富多彩。
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-xl">
              <button 
                v-for="(suggestion, index) in suggestions" 
                :key="index"
                class="bg-primary/10 border border-primary/30 hover:bg-primary/20 rounded-lg p-3 text-left transition-colors"
                @click="startConversation(suggestion)"
              >
                <p class="text-white text-sm">{{ suggestion }}</p>
              </button>
            </div>
          </div>
          
          <div v-else class="space-y-6 pb-4">
            <!-- 实际消息 -->
            <div v-for="msg in messages" :key="msg.id" class="flex items-start" :class="{'justify-end': msg.role === 'user'}">
              <!-- AI消息 -->
              <template v-if="msg.role === 'assistant'">
                <div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-robot text-primary" :class="{'text-red-500': msg.isError}"></i>
                </div>
                <div class="ml-4 bg-white/5 rounded-lg p-4 max-w-[80%]" :class="{'bg-red-900/10 border border-red-500/20': msg.isError}">
                  <div v-if="msg.isStreaming" class="flex items-center">
                    <div class="text-gray-200">
                      <message-formatter 
                        :content="msg.content || ''" 
                        @thinking-processing="pauseScrolling"
                        @thinking-processed="resumeScrolling"
                      ></message-formatter>
                    </div>
                    <div class="typing-indicator ml-2">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                  <div v-else class="text-gray-200">
                    <message-formatter 
                      :content="msg.content || ''"
                      @thinking-processing="pauseScrolling"
                      @thinking-processed="resumeScrolling"
                    ></message-formatter>
                  </div>
                  
                  <!-- 消息控制按钮 -->
                  <div v-if="!msg.isError" class="mt-3 flex justify-end space-x-2 text-xs">
                    <button v-if="msg.isStreaming" @click="chatStore.stopGenerating()" 
                            class="text-gray-400 hover:text-gray-200">
                      <i class="fas fa-stop mr-1"></i>停止生成
                    </button>
                  </div>
                </div>
              </template>
              
              <!-- 用户消息 -->
              <template v-else>
                <div class="mr-4 bg-white/5 rounded-lg p-4 max-w-[80%]">
                  <p class="text-gray-200">{{ msg.content }}</p>
                </div>
                <div class="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-user text-gray-400"></i>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部输入区域 -->
      <div class="mt-4 flex-shrink-0">
        <div class="flex items-center space-x-2">
          <!-- 输入框 -->
          <div class="relative flex-1">
            <textarea
              v-model="userInput"
              @keydown.enter.prevent="sendMessage"
              placeholder="输入您的问题..." 
              class="bg-gray-900 border border-gray-700 rounded-lg text-white p-3 w-full focus:outline-none focus:border-primary resize-none"
              rows="1"
              ref="textareaRef"
              :disabled="isLoading || isInputDisabled"
            ></textarea>
          </div>
          
          <!-- 发送按钮 -->
          <button 
            @click="sendMessage" 
            class="h-[42px] w-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0"
            :disabled="isLoading || !userInput.trim()"
            :class="{'opacity-50 cursor-not-allowed': isLoading || !userInput.trim()}"
          >
            <i class="fas fa-paper-plane text-white text-sm"></i>
          </button>
        </div>
        <div class="text-xs text-gray-500 mt-2 text-center">文旅助手，让您的旅行更加精彩</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useChatStore } from '../stores/chat'
import MessageFormatter from '../components/MessageFormatter.vue'
import * as swManager from '../services/swManager'
import * as chatAPI from '../services/chatAPI'
import { useRouter } from 'vue-router'

// 使用聊天状态存储
const chatStore = useChatStore()
const router = useRouter()

// 中间层同步状态
const syncedWithMiddleLayer = ref(false)

// 组件就绪状态
const isComponentReady = ref(false)

// DOM引用
const chatContainer = ref(null)
const textareaRef = ref(null)
const messagesContainer = ref(null)
const scrollContainer = ref(null)
const observer = ref(null)
const scrollDebounceTimer = ref(null)

// 用户输入
const userInput = ref('')
const isLoading = ref(false)
const isInputDisabled = ref(false) // 控制输入框是否禁用

// 对话建议
const suggestions = [
  "云和县有哪些必去的旅游景点和打卡地？",
  "请帮我规划一份云和梯田+云和湖二日游行程",
  "云和县的特色美食和伴手礼有哪些推荐？",
  "云和木玩小镇有什么特色体验项目和活动？"
]

// 自动调整文本框高度
const adjustTextareaHeight = () => {
  if (!textareaRef.value) return
  try {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 150)}px`
  } catch (e) {
    console.error('调整文本框高度失败:', e);
  }
}

watch(userInput, adjustTextareaHeight)

// 计算属性
const messages = computed(() => chatStore.sortedMessages)

// 简化滚动逻辑，专注于用户体验
const autoScrollEnabled = ref(true); // 默认启用自动滚动
const isUserScrolling = ref(false);
const lastScrollTime = ref(0);

// 简化的滚动到底部函数，使用直接方法
const scrollToBottom = (force = false) => {
  // 如果用户已禁用自动滚动且不是强制滚动，则不执行
  if (!autoScrollEnabled.value && !force) {
    return;
  }
  
  // 如果没有聊天容器则退出
  if (!chatContainer.value) return;
  
  // 记录上次滚动时间
  lastScrollTime.value = Date.now();
  
  // 直接执行滚动
  console.log('[滚动控制] 执行滚动到底部');
  try {
    // 使用原生方法保证可靠性
    if (force) {
      // 立即滚动（无动画）
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    } else {
      // 平滑滚动
      chatContainer.value.scrollTo({
        top: chatContainer.value.scrollHeight,
        behavior: 'smooth'
      });
    }
  } catch (e) {
    console.error('滚动失败:', e);
    // 回退方法
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

// 设置基本滚动监听
const setupScrollSystem = () => {
  if (!chatContainer.value) return;
  
  // 监听滚动事件
  chatContainer.value.addEventListener('scroll', () => {
    if (!chatContainer.value) return;
    
    // 计算是否用户正在向上滚动查看历史消息
    const currentPos = chatContainer.value.scrollTop;
    const maxScroll = chatContainer.value.scrollHeight - chatContainer.value.clientHeight;
    const distanceFromBottom = maxScroll - currentPos;
    
    // 如果距离底部超过200px，认为用户在查看历史
    if (distanceFromBottom > 200) {
      // 用户明显向上滚动，临时禁用自动滚动
      autoScrollEnabled.value = false;
      isUserScrolling.value = true;
      console.log('[滚动控制] 用户正在查看历史消息，自动滚动已禁用');
    } else {
      // 用户滚回底部，重新启用自动滚动
      autoScrollEnabled.value = true;
      isUserScrolling.value = false;
      console.log('[滚动控制] 用户已接近底部，自动滚动已启用');
    }
  });
  
  // 定期检查内容变化并滚动
  const checkContentAndScroll = () => {
    // 聊天内容变化时自动滚动
    if (autoScrollEnabled.value && chatContainer.value) {
      // 检查是否有新消息
      const lastMessage = messages.value[messages.value.length - 1];
      const isNewUserMessage = lastMessage && lastMessage.role === 'user';
      const isStreaming = lastMessage && lastMessage.isStreaming;
      
      // 如果是用户新消息或正在流式显示，滚动到底部
      if (isNewUserMessage || isStreaming) {
        scrollToBottom();
      }
    }
  };
  
  // 创建MutationObserver监听消息区域DOM变化
  observer.value = new MutationObserver(() => {
    // 防抖处理
    clearTimeout(scrollDebounceTimer.value);
    scrollDebounceTimer.value = setTimeout(() => {
      checkContentAndScroll();
    }, 100);
  });
  
  // 开始观察变化
  observer.value.observe(chatContainer.value, {
    childList: true,
    subtree: true,
    characterData: true
  });
};

// 在思考框处理时暂停滚动
const pauseScrolling = () => {
  console.log('[滚动控制] 暂停滚动');
  autoScrollEnabled.value = false;
};

// 思考框处理完成后恢复滚动
const resumeScrolling = () => {
  console.log('[滚动控制] 恢复滚动');
  autoScrollEnabled.value = true;
  
  // 在恢复滚动时执行一次滚动
  setTimeout(() => {
    scrollToBottom();
  }, 50);
};

// 监听消息数量变化，处理新消息
watch(() => messages.value.length, (newCount, oldCount) => {
  if (newCount > oldCount) {
    // 新消息出现，强制滚动到底部
    console.log('[滚动控制] 检测到新消息，滚动到底部');
    setTimeout(() => {
      scrollToBottom(true);
    }, 50);
  }
});

// 发送消息
const sendMessage = async () => {
  // 获取输入框内容并清空
  const content = userInput.value.trim()
  if (!content || isLoading.value) return
  
  // 清空输入框
  userInput.value = ''
  adjustTextareaHeight()
  
  try {
    // 检查并修复可能错误的状态
    if (chatStore.isLoading || chatStore.isStreaming || chatStore.isGenerating) {
      console.warn('检测到不一致的状态，尝试自动修复');
      
      // 修正所有流式消息的状态
      chatStore.messages.forEach(msg => {
        if (msg.isStreaming) {
          msg.isStreaming = false;
          msg.content += '\n\n[系统自动修复：此消息在开始新对话前已标记为已完成]';
        }
      });
      
      // 强制重置所有状态变量
      chatStore.isLoading = false;
      chatStore.isStreaming = false;
      chatStore.isGenerating = false;
      chatStore.currentTask = null;
    }
    
    // 重新启用自动滚动
    autoScrollEnabled.value = true
    
    // 先滚动到底部
    scrollToBottom(true)
    
    // 如果使用中间层且当前会话已存在，需要确保同步状态
    if (chatStore.isUsingMiddleLayer && chatStore.currentConversationId) {
      // 首次发送消息时与中间层同步
      if (!syncedWithMiddleLayer.value) {
        try {
          console.log('首次同步会话到中间层:', chatStore.currentConversationId)
          await syncWithMiddleLayer()
        } catch (e) {
          console.warn('同步到中间层失败:', e)
          // 继续发送消息，即使同步失败
        }
      } else if (syncedWithMiddleLayer.value) {
        // 如果会话已标记为完成，尝试继续会话
        console.log('检查是否需要继续已完成的会话')
        try {
          await swManager.continueSession(chatStore.currentConversationId)
        } catch (e) {
          console.warn('继续会话失败，将尝试发送消息:', e)
          // 继续执行，即使继续会话失败
        }
      }
    }
    
    // 发送消息到API
    await chatStore.sendMessage(content)
    
    // 消息发送成功，保存会话ID并同步
    if (chatStore.currentConversationId) {
      sessionStorage.setItem('travel_conversation_id', chatStore.currentConversationId)
      
      // 如果是使用中间层且首次同步
      if (chatStore.isUsingMiddleLayer && !syncedWithMiddleLayer.value) {
        console.log('消息发送成功，首次同步会话到中间层', chatStore.currentConversationId)
        await syncWithMiddleLayer()
      }
    }
    
    // 消息发送后再次滚动到底部
    setTimeout(() => {
      scrollToBottom(true)
    }, 100)
  } catch (e) {
    console.error('发送消息失败:', e)
    
    // 如果是会话不存在错误，则清理会话ID
    if (e.message && e.message.includes('Conversation Not Exists')) {
      console.warn('会话不存在，清理会话ID')
      await cleanupSession()
    }
    
    // 显示错误消息给用户
    messages.value.push({
      id: crypto.randomUUID(),
      conversation_id: chatStore.currentConversationId || '',
      role: 'assistant',
      content: `⚠️ 消息发送失败：${e.message || '网络连接错误'}`,
      created_at: Date.now() / 1000,
      isError: true
    });
    
    // 尝试自动恢复输入内容
    if (content && !userInput.value) {
      userInput.value = content;
      adjustTextareaHeight();
    }
  }
}

// 开始以建议开始对话
const startConversation = (suggestion) => {
  userInput.value = suggestion
  sendMessage()
}

// 格式化消息内容（处理换行、链接等）
const formatMessage = (content) => {
  if (!content) return ''
  
  try {
    // 保留原始换行符，不做替换
    // let formatted = content.replace(/\n/g, '<br>')
    let formatted = content
    
    // 将URL转换为可点击的链接
    formatted = formatted.replace(
      /(https?:\/\/[^\s]+)/g, 
      '<a href="$1" target="_blank" class="text-primary hover:underline">$1</a>'
    )
    
    // 先处理完整的details标签，但跳过已处理的思考框
    if (formatted.includes('<details>') && formatted.includes('</details>') && !formatted.includes('class="thinking-box"')) {
      try {
        // 跳过思考框内容，仅处理其他details
        const detailsPattern = /<details>([\s\S]*?)<summary>(?!Thinking)([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g;
        formatted = formatted.replace(detailsPattern, 
          '<details class="my-3 bg-[#070620] rounded-lg overflow-hidden border border-primary/10"><summary class="p-3 cursor-pointer text-gray-300 font-medium hover:bg-[#0a0830] transition-colors">$2</summary><div class="p-3 border-t border-primary/10 bg-[#080722] text-gray-300">$3</div></details>');
      } catch (e) {
        console.error('重新处理details标签失败', e);
      }
    }
    
    // 处理不完整的details和summary标签
    if (formatted.includes('<details>') && !formatted.includes('</details>') && !formatted.includes('class="thinking-box"')) {
      formatted = formatted.replace(/<details>(?![\s\S]*?Thinking)([\s\S]*)$/, 
        '<div class="bg-[#070620] rounded-lg p-3 border border-primary/10 text-gray-300">$1</div>');
    }
    
    if (formatted.includes('<summary>') && !formatted.includes('</summary>')) {
      formatted = formatted.replace(/<summary>([\s\S]*)$/, 
        '<div class="font-medium">$1</div>');
    }
    
    // 处理代码块
    formatted = formatted.replace(
      /```([a-z]*)\n([\s\S]+?)\n```/g,
      '<pre class="bg-[#111030] border border-primary/20 p-4 rounded-lg my-3 overflow-x-auto"><code class="text-gray-300 font-mono text-sm">$2</code></pre>'
    )
    
    // 处理行内代码
    formatted = formatted.replace(
      /`([^`]+)`/g,
      '<code class="bg-[#111030] border border-primary/10 px-1.5 py-0.5 rounded text-gray-300 font-mono text-sm">$1</code>'
    )
    
    // 最后将换行符替换为<br>
    // formatted = formatted.replace(/\n/g, '<br>')
    
    // 将URL转换为可点击的链接
    formatted = formatted.replace(
      /(https?:\/\/[^\s]+)/g, 
      '<a href="$1" target="_blank" class="text-primary hover:underline">$1</a>'
    )
    
    return formatted
  } catch (error) {
    console.error('格式化消息失败:', error)
    return content || ''
  }
}

// 测试API连接
const testConnection = async () => {
  await chatStore.checkConnection()
}

// 生命周期钩子注册
onBeforeUnmount(() => {
  try {
    // 如果有活跃会话且使用中间层，标记会话完成
    if (chatStore.isUsingMiddleLayer && chatStore.currentConversationId && syncedWithMiddleLayer.value) {
      try {
        console.log('文旅助手页面卸载，标记会话完成', chatStore.currentConversationId);
        swManager.completeSession(chatStore.currentConversationId);
      } catch (error) {
        console.error('标记会话完成失败:', error);
      }
    }
    
    // 移除事件监听器
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    
    // 保存会话ID到sessionStorage
    if (chatStore.currentConversationId) {
      sessionStorage.setItem('travel_conversation_id', chatStore.currentConversationId);
    }
  } catch (error) {
    console.error('组件卸载清理失败:', error);
  }
});

// 页面加载时初始化
onMounted(async () => {
  try {
    // 初始化聊天状态
    await chatStore.initialize(chatAPI.APP_TYPES.TRAVEL);
    
    // 检查API连接状态
    await chatStore.checkConnection();
    
    // 恢复会话流程
    let sessionLoaded = false;
    
    // 尝试从sessionStorage中恢复会话ID
    const sessionId = sessionStorage.getItem('travel_conversation_id');
    
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
          
          // 直接从后端获取历史消息，确保消息始终能显示
          console.log('直接从后端获取历史消息');
          await chatStore.fetchMessages(sessionId);
          console.log('获取消息完成，消息数量:', chatStore.messages.length);
          
          // 记录所有消息的基本信息，帮助调试
          console.log('[详细日志] 消息内容概览:', chatStore.messages.map(msg => ({
            id: msg.id.substring(0, 8), // 只显示ID前8位
            role: msg.role,
            length: msg.content?.length || 0,
            preview: msg.content?.substring(0, 30).replace(/\n/g, '\\n') || '',
            isStreaming: msg.isStreaming
          })));
          
          // 添加详细的消息格式检查
          if (chatStore.messages.length > 0) {
            console.log('[详细检查] 第一条消息完整信息:', {
              id: chatStore.messages[0].id,
              role: chatStore.messages[0].role,
              content: chatStore.messages[0].content?.substring(0, 50),
              isUser: chatStore.messages[0].role === 'user',
              isAssistant: chatStore.messages[0].role === 'assistant'
            });
            
            // 检查是否有assistant角色的消息
            const hasAssistantMsg = chatStore.messages.some(msg => msg.role === 'assistant');
            console.log('[详细检查] 是否包含AI消息:', hasAssistantMsg);
            
            // 检查渲染条件
            const msgElement = document.querySelector('.flex.items-start');
            if (msgElement) {
              console.log('[详细检查] 第一条消息DOM:', msgElement.innerHTML.substring(0, 200));
            }
          }
          
          // 输出计算属性messages的当前状态
          console.log('[详细日志] 计算属性messages当前长度:', messages.value.length);
          
          // 输出DOM状态
          setTimeout(() => {
            const messageElements = document.querySelectorAll('.flex.items-start');
            console.log('[详细日志] 实际渲染的消息元素数量:', messageElements.length);
            
            // 检查消息容器是否存在
            const container = document.querySelector('.space-y-6.pb-4');
            console.log('[详细日志] 消息容器存在:', !!container, container);
            
            // 检查消息格式化组件
            const formatters = document.querySelectorAll('message-formatter');
            console.log('[详细日志] 消息格式化组件数量(message-formatter):', formatters.length);
          }, 500);
          
          // 确保视图更新
          if (chatStore.messages.length === 0) {
            console.log('未检测到历史消息，添加临时测试消息');
            // 如果没有消息，添加一条测试消息以便调试
            chatStore.messages.push({
              id: crypto.randomUUID(),
              conversation_id: sessionId,
              role: 'assistant',
              content: '⚠️ 系统提示：检测到会话恢复异常，这是一条测试消息。请忽略此消息并尝试继续对话或刷新页面。',
              created_at: Date.now() / 1000
            });
          } else {
            console.log('检测到历史消息，强制刷新视图');
            // 使用临时变量克隆消息数组，确保引用变化触发视图更新
            const tempMessages = [...chatStore.messages];
            chatStore.messages = [];
            setTimeout(() => {
              chatStore.messages = tempMessages;
            }, 10);
          }
          
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
          
          // 强制重置所有状态变量，确保不会处于"对话中"状态
          chatStore.isLoading = false;
          chatStore.isStreaming = false;
          chatStore.isGenerating = false;
          chatStore.currentTask = null;
          
          console.log('会话恢复完成，状态已重置');
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
        sessionStorage.removeItem('travel_conversation_id');
      }
    }
    
    // 如果没有恢复到有效会话，则准备新会话环境
    if (!sessionLoaded) {
      console.log('准备新对话环境');
      
      // 设置应用类型
      chatStore.setAppType(chatAPI.APP_TYPES.TRAVEL);
      
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
    
    // 设置滚动系统
    nextTick(() => {
      setupScrollSystem();
      
      // 初始滚动到底部
      if (chatStore.messages.length > 0) {
        scrollToBottom(true);
      }
    });
    
    // 标记组件为已就绪
    isComponentReady.value = true;
  } catch (error) {
    console.error('初始化组件失败:', error);
    isComponentReady.value = true; // 即使失败也设置为就绪，允许用户操作
  }
});

// 处理会话被其他标签页替换的情况
const handleSessionReplaced = (event) => {
  const { oldSessionId, newSessionId } = event.detail;
  
  // 检查是否是当前会话被替换
  if (chatStore.currentConversationId === oldSessionId) {
    console.warn('检测到当前会话已在其他标签页中打开，本页面将不再响应');
    
    // 显示提示给用户
    messages.value.push({
      id: crypto.randomUUID(),
      conversation_id: chatStore.currentConversationId,
      role: 'assistant',
      content: '⚠️ 检测到您已在其他标签页中打开了文旅助手。为避免冲突，本页面将不再响应。',
      created_at: Date.now() / 1000,
      isError: true
    });
    
    // 禁用输入
    isInputDisabled.value = true;
  }
};

// 同步到中间层的辅助函数
const syncWithMiddleLayer = async () => {
  try {
    if (!chatStore.isUsingMiddleLayer || !chatStore.currentConversationId) {
      return;
    }
    
    // 注册会话到中间层
    await swManager.registerSession(chatStore.currentConversationId, {
      type: 'travel-assistant',
      name: '文旅助手',
      description: '丽水云和县智能AI导游',
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
    sessionStorage.removeItem('travel_conversation_id');
    
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
    console.log('文旅助手页面恢复可见');
    
    // 如果有当前会话ID，检查会话是否仍然有效
    if (chatStore.currentConversationId) {
      try {
        // 检查会话是否存在于sessionStorage中
        const storedId = sessionStorage.getItem('travel_conversation_id');
        
        if (storedId !== chatStore.currentConversationId) {
          console.log('会话ID不匹配，更新到sessionStorage', {
            stored: storedId,
            current: chatStore.currentConversationId
          });
          sessionStorage.setItem('travel_conversation_id', chatStore.currentConversationId);
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
      console.log('文旅助手页面隐藏，保存会话状态');
      sessionStorage.setItem('travel_conversation_id', chatStore.currentConversationId);
      
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
</script>

<style scoped>
/* 聊天相关样式 */
.message-container:last-child {
  margin-bottom: 10px;
}

/* 确保文本正确换行的关键样式 */
.text-gray-200 {
  white-space: pre-wrap !important;
}

/* 自定义滚动条样式 */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) rgba(0, 0, 0, 0.1);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 打字指示器动画 */
.typing-indicator {
  display: flex;
  align-items: center;
}

.typing-indicator span {
  height: 6px;
  width: 6px;
  background: #6366f1;
  border-radius: 50%;
  display: inline-block;
  margin-right: 3px;
  animation: typingBounce 1.5s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
  margin-right: 0;
}

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}
</style> 