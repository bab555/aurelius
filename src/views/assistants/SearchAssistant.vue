<template>
  <div class="flex-1 flex flex-col relative h-screen">
    <!-- 组件加载指示器 -->
    <div v-if="!isComponentReady" class="absolute inset-0 flex items-center justify-center bg-[#0e0b36]/80 z-10">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    
    <div class="p-4 md:p-8 flex flex-col h-full">
      <!-- 页面标题 -->
      <div class="mb-6 flex-shrink-0">
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">搜索助手</h1>
        <p class="text-gray-400 text-sm">集成google搜索引擎以及大量专业类搜索引擎，智能分析总结，给出最优搜索结果</p>
        
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
        <div 
          ref="chatContainer"
          class="flex-1 overflow-y-auto custom-scrollbar px-2 py-4"
          :class="{'pb-32': chatStore.messages.length > 0}"
        >
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
              <i class="fas fa-search text-primary text-2xl"></i>
            </div>
            <h3 class="text-lg font-medium mb-2">欢迎使用搜索助手</h3>
            <p class="text-gray-400 text-sm max-w-md mb-8">
              我集成了Google和多款专业搜索引擎，能为您搜索并智能分析各类信息，包括新闻、视频、图片、学术论文等，提供最精准的搜索结果。
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
          <!-- 文件上传按钮 -->
          <button 
            @click="triggerFileUpload" 
            class="h-[42px] w-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors flex-shrink-0"
            :disabled="isLoading || isInputDisabled"
            :class="{'opacity-50 cursor-not-allowed': isLoading || isInputDisabled}"
            title="上传文件"
          >
            <i class="fas fa-paperclip text-white text-sm"></i>
          </button>
          
          <!-- 隐藏文件输入框 -->
          <input 
            type="file" 
            ref="fileInput" 
            class="hidden" 
            @change="handleFileSelected"
          />
          
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
            :disabled="isLoading || (!userInput.trim() && !selectedFile)"
            :class="{'opacity-50 cursor-not-allowed': isLoading || (!userInput.trim() && !selectedFile)}"
          >
            <i class="fas fa-paper-plane text-white text-sm"></i>
          </button>
        </div>
        
        <!-- 显示已选文件 -->
        <div v-if="selectedFile" class="mt-2 px-4 py-2 bg-gray-800 rounded-lg flex items-center justify-between">
          <div class="flex items-center">
            <i class="fas fa-file mr-2 text-primary"></i>
            <span class="text-sm text-white truncate max-w-xs">{{ selectedFile.name }}</span>
            <span class="text-xs text-gray-400 ml-2">({{ formatFileSize(selectedFile.size) }})</span>
          </div>
          <button 
            @click="removeSelectedFile" 
            class="text-gray-400 hover:text-white ml-2"
            title="移除文件"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="text-xs text-gray-500 mt-2 text-center">多款顶尖搜索引擎联合协作，为您找到最优质的搜索结果</div>
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

// 使用聊天状态存储
const chatStore = useChatStore()
const router = useRouter()

// 中间层同步状态
const syncedWithMiddleLayer = ref(false)

// 组件就绪状态
const isComponentReady = ref(false)

// 文件上传相关
const fileInput = ref(null)
const selectedFile = ref(null)
const uploadedFileId = ref(null)

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
  "搜索关于'区块链技术最新应用'的相关资讯",
  "找到'气候变化对农业影响'的最新研究论文",
  "查询'深度学习在医疗诊断中的应用'相关视频",
  "搜索'北京最受欢迎的旅游景点'的图片"
]

// 添加防抖变量
let isSendingMessage = false;

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

// 滚动控制 - 从命理页面复制
let autoScrollPaused = false;
let hasScrolled = false;

// 用户手动滚动时暂停自动滚动
const handleScroll = () => {
  if (!chatContainer.value) return;
  
  const container = chatContainer.value;
  const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 30;
  
  if (!atBottom) {
    autoScrollPaused = true;
    hasScrolled = true;
  } else {
    autoScrollPaused = false;
  }
};

// 滚动到底部
const scrollToBottom = (force = false) => {
  nextTick(() => {
    if (!chatContainer.value) return;
    
    if (force || !autoScrollPaused) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

// 设置滚动系统 - 从Assistant.vue复制
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
      autoScrollPaused = true;
      hasScrolled = true;
      console.log('[滚动控制] 用户正在查看历史消息，自动滚动已禁用');
    } else {
      // 用户滚回底部，重新启用自动滚动
      autoScrollPaused = false;
      console.log('[滚动控制] 用户已接近底部，自动滚动已启用');
    }
  });
  
  // 创建MutationObserver监听消息区域DOM变化
  observer.value = new MutationObserver(() => {
    // 防抖处理
    clearTimeout(scrollDebounceTimer.value);
    scrollDebounceTimer.value = setTimeout(() => {
      // 聊天内容变化时自动滚动
      if (!autoScrollPaused && chatContainer.value) {
        // 检查是否有新消息
        const lastMessage = messages.value[messages.value.length - 1];
        const isNewUserMessage = lastMessage && lastMessage.role === 'user';
        const isStreaming = lastMessage && lastMessage.isStreaming;
        
        // 如果是用户新消息或正在流式显示，滚动到底部
        if (isNewUserMessage || isStreaming) {
          scrollToBottom();
        }
      }
    }, 100);
  });
  
  // 开始观察变化
  if (chatContainer.value) {
    observer.value.observe(chatContainer.value, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
};

// 处理思考框暂停滚动
const pauseScrolling = () => {
  autoScrollPaused = true;
  console.log('暂停自动滚动 - 思考框处理中');
};

// 恢复自动滚动
const resumeScrolling = () => {
  autoScrollPaused = false;
  scrollToBottom(true);
  console.log('恢复自动滚动 - 思考框处理完成');
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

// 发送消息 - 改进版本，结合命理页面和文旅助手页面的优点
const sendMessage = async () => {
  // 获取输入框内容并清空
  const content = userInput.value.trim();
  if ((!content && !selectedFile.value) || isLoading.value || isSendingMessage) return;
  
  // 设置防抖状态
  isSendingMessage = true;
  
  // 清空输入框
  userInput.value = '';
  adjustTextareaHeight();
  
  try {
    // 彻底重置状态 - 来自命理页面的更严格状态管理
    chatStore.isLoading = false;
    chatStore.isStreaming = false;
    chatStore.isGenerating = false;
    chatStore.currentTask = null;
    
    // 重新启用自动滚动
    autoScrollPaused = false;
    
    // 先滚动到底部确保用户可以看到消息
    scrollToBottom(true);
    
    // 如果使用中间层且当前会话已存在，需要确保同步状态
    if (chatStore.isUsingMiddleLayer && chatStore.currentConversationId) {
      // 首次发送消息时与中间层同步
      if (!syncedWithMiddleLayer.value) {
        try {
          console.log('首次同步会话到中间层:', chatStore.currentConversationId);
          await syncWithMiddleLayer();
        } catch (e) {
          console.warn('同步到中间层失败:', e);
          // 继续发送消息，即使同步失败
        }
      } else {
        // 如果会话已存在，简单更新而不是尝试继续
        try {
          await swManager.updateSession(chatStore.currentConversationId, {
            lastUpdated: Date.now()
          });
        } catch (e) {
          console.warn('更新会话状态失败:', e);
          // 继续执行，即使更新失败
        }
      }
    }
    
    // 保留文件上传逻辑
    if (selectedFile.value) {
      try {
        console.log('准备上传文件:', selectedFile.value.name);
        const fileData = await chatStore.uploadFileForChat(selectedFile.value);
        console.log('文件上传成功:', fileData);
        
        // 添加文件信息到消息内容
        const fileMessage = content ? 
          `${content}\n\n[文件: ${selectedFile.value.name}]` : 
          `[文件: ${selectedFile.value.name}]`;
          
        // 存储文件ID供后续使用
        uploadedFileId.value = fileData.id;
        
        // 发送带有文件信息的消息
        await chatStore.sendMessage(fileMessage, {
          fileId: fileData.id,
          fileName: fileData.name
        });
      } catch (error) {
        console.error('文件上传失败:', error);
        if (content) {
          await chatStore.sendMessage(content);
        } else {
          // 显示错误消息给用户
          messages.value.push({
            id: crypto.randomUUID(),
            conversation_id: chatStore.currentConversationId || '',
            role: 'assistant',
            content: `⚠️ 文件上传失败: ${error.message || '未知错误'}`,
            created_at: Date.now() / 1000,
            isError: true
          });
          return;
        }
      }
    } else {
      // 正常发送纯文本消息
      await chatStore.sendMessage(content);
    }
    
    // 消息发送成功，保存会话ID并同步
    if (chatStore.currentConversationId) {
      sessionStorage.setItem('search_conversation_id', chatStore.currentConversationId);
      
      // 如果是使用中间层且首次同步
      if (chatStore.isUsingMiddleLayer && !syncedWithMiddleLayer.value) {
        console.log('消息发送成功，首次同步会话到中间层', chatStore.currentConversationId);
        await syncWithMiddleLayer();
      }
    }
    
    // 消息发送后再次滚动到底部
    setTimeout(() => {
      scrollToBottom(true);
    }, 100);
  } catch (e) {
    console.error('发送消息失败:', e);
    
    // 如果是会话不存在错误，则清理会话ID
    if (e.message && e.message.includes('Conversation Not Exists')) {
      console.warn('会话不存在，清理会话ID');
      await cleanupSession();
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
  } finally {
    // 延迟重置发送状态，防止快速重复点击
    setTimeout(() => {
      isSendingMessage = false;
    }, 3000);
  }
};

// 开始以建议开始对话
const startConversation = (suggestion) => {
  userInput.value = suggestion
  sendMessage()
}

// 测试API连接
const testConnection = async () => {
  await chatStore.checkConnection()
}

// 生命周期钩子注册 - 提前注册所有钩子
onBeforeUnmount(() => {
  try {
    // 移除滚动监听器
    if (chatContainer.value) {
      chatContainer.value.removeEventListener('scroll', handleScroll);
    }
    
    // 清理MutationObserver
    if (observer.value) {
      observer.value.disconnect();
    }
    
    // 清理定时器
    if (scrollDebounceTimer.value) {
      clearTimeout(scrollDebounceTimer.value);
    }
    
    // 移除页面可见性事件监听器
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    
    // 如果有活跃会话且使用中间层，标记会话完成
    if (chatStore.isUsingMiddleLayer && chatStore.currentConversationId && syncedWithMiddleLayer.value) {
      try {
        console.log('搜索助手页面卸载，标记会话完成并清理资源', chatStore.currentConversationId);
        swManager.completeSession(chatStore.currentConversationId);
      } catch (error) {
        console.error('标记会话完成失败:', error);
      }
    }
    
    // 安全地移除Service Worker会话监听器
    if (chatStore.currentConversationId && chatStore.isUsingMiddleLayer) {
      try {
        swManager.removeSessionListener(chatStore.currentConversationId, handleSessionUpdate);
      } catch (error) {
        console.warn('移除会话监听器失败:', error);
      }
    }
    
    // 保存会话ID到sessionStorage
    if (chatStore.currentConversationId) {
      sessionStorage.setItem('search_conversation_id', chatStore.currentConversationId);
    }
  } catch (error) {
    console.error('组件卸载清理失败:', error);
  }
});

// 页面加载时初始化
onMounted(async () => {
  try {
    // 设置滚动监听
    if (chatContainer.value) {
      chatContainer.value.addEventListener('scroll', handleScroll);
    }
    
    // 确保chat store初始化
    if (!chatStore.isInitialized) {
      await chatStore.initialize('search');
    }
    
    // 检查API连接状态
    await chatStore.checkConnection();
    
    // 恢复会话流程
    let sessionLoaded = false;
    
    // 尝试从sessionStorage中恢复会话ID
    const sessionId = sessionStorage.getItem('search_conversation_id');
    
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
        sessionStorage.removeItem('search_conversation_id');
      }
    }
    
    // 如果没有恢复到有效会话，则准备新会话环境
    if (!sessionLoaded) {
      console.log('准备新对话环境');
      
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
    
    // 设置滚动系统 - 确保在DOM准备好后调用
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
      content: '⚠️ 检测到您已在其他标签页中打开了搜索助手。为避免冲突，本页面将不再响应。',
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
      type: 'search-assistant',
      name: '搜索助手',
      description: '集成多搜索引擎的智能搜索工具',
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
    // 增强Service Worker错误处理
    console.error('同步到中间层失败:', error);
    
    if (error.toString().includes('Could not establish connection') || 
        error.toString().includes('Receiving end does not exist')) {
      console.warn('检测到Service Worker连接错误，尝试自动修复状态');
      
      // 修正所有流式消息的状态，确保UI正常呈现
      chatStore.messages.forEach(msg => {
        if (msg.isStreaming) {
          console.log('检测到异常流式消息状态，自动修复');
          msg.isStreaming = false;
          msg.content += '\n\n[系统自动修复：此消息因Service Worker连接错误而被标记为已完成]';
        }
      });
      
      // 重置所有状态
      chatStore.isLoading = false;
      chatStore.isStreaming = false;
      chatStore.isGenerating = false;
      chatStore.currentTask = null;
      
      // 由于Service Worker连接错误，禁用中间层功能
      chatStore.isUsingMiddleLayer = false;
    }
    
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
        
        // 检查Service Worker连接错误
        if (e.toString().includes('Could not establish connection') || 
            e.toString().includes('Receiving end does not exist')) {
          console.warn('检测到Service Worker连接错误，禁用中间层功能');
          chatStore.isUsingMiddleLayer = false;
        }
      }
    }
    
    // 清除当前会话ID
    chatStore.currentConversationId = '';
    sessionStorage.removeItem('search_conversation_id');
    
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
    console.log('搜索助手页面恢复可见');
    
    try {
      // 如果有当前会话ID，检查会话是否仍然有效
      if (chatStore.currentConversationId) {
        try {
          // 检查会话是否存在于sessionStorage中
          const storedId = sessionStorage.getItem('search_conversation_id');
          
          if (storedId !== chatStore.currentConversationId) {
            console.log('会话ID不匹配，更新到sessionStorage', {
              stored: storedId,
              current: chatStore.currentConversationId
            });
            sessionStorage.setItem('search_conversation_id', chatStore.currentConversationId);
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
          
          // 检查是否是Service Worker错误
          if (error.toString().includes('Could not establish connection') || 
              error.toString().includes('Receiving end does not exist')) {
            console.warn('检测到Service Worker连接错误，禁用中间层功能');
            
            // 确保流式消息状态正确
            chatStore.messages.forEach(msg => {
              if (msg.isStreaming) {
                msg.isStreaming = false;
                msg.content += '\n\n[系统自动修复：此消息因Service Worker连接错误而被标记为已完成]';
              }
            });
            
            // 禁用中间层功能
            chatStore.isUsingMiddleLayer = false;
          }
        }
      }
      
      // 重新检查API连接状态
      await chatStore.checkConnection();
    } catch (e) {
      console.warn('页面可见性事件处理失败:', e);
      
      // 确保流式消息状态正确
      chatStore.messages.forEach(msg => {
        if (msg.isStreaming) {
          msg.isStreaming = false;
        }
      });
      
      // 重置所有状态变量
      chatStore.isLoading = false;
      chatStore.isStreaming = false;
      chatStore.isGenerating = false;
      chatStore.currentTask = null;
    }
  } else if (document.visibilityState === 'hidden') {
    // 页面隐藏时，确保会话ID被保存
    if (chatStore.currentConversationId) {
      console.log('搜索助手页面隐藏，保存会话状态');
      sessionStorage.setItem('search_conversation_id', chatStore.currentConversationId);
      
      // 如果使用中间层，确保最新状态已同步
      if (chatStore.isUsingMiddleLayer && syncedWithMiddleLayer.value) {
        try {
          await swManager.updateSession(chatStore.currentConversationId, {
            messages: chatStore.sortedMessages,
            last_updated: Date.now()
          });
        } catch (error) {
          console.warn('页面隐藏时同步到中间层失败:', error);
          
          // 检查是否是Service Worker错误
          if (error.toString().includes('Could not establish connection') || 
              error.toString().includes('Receiving end does not exist')) {
            console.warn('检测到Service Worker连接错误，禁用中间层功能');
            chatStore.isUsingMiddleLayer = false;
          }
        }
      }
    }
  }
};

// 触发文件上传
const triggerFileUpload = () => {
  if (isLoading.value || isInputDisabled.value) return;
  fileInput.value.click();
};

// 处理文件选择
const handleFileSelected = (event) => {
  const files = event.target.files;
  if (files && files.length > 0) {
    selectedFile.value = files[0];
    console.log('已选择文件:', selectedFile.value.name, selectedFile.value.size);
  }
};

// 移除已选文件
const removeSelectedFile = () => {
  selectedFile.value = null;
  uploadedFileId.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

</script> 

<style scoped>
/* 聊天相关样式 */
.message-container:last-child {
  margin-bottom: 10px;
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

