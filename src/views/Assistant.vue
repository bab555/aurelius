<template>
  <div class="flex-1 flex flex-col relative h-screen">
    <div class="p-4 md:p-8 flex flex-col h-full">
      <!-- 页面标题 -->
      <div class="mb-6 flex-shrink-0">
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">天枢助手</h1>
        <p class="text-gray-400 text-sm">智能AI助手，为您解答问题、提供创意灵感</p>
        
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
              <i class="fas fa-robot text-primary text-2xl"></i>
            </div>
            <h3 class="text-lg font-medium mb-2">欢迎使用天枢助手</h3>
            <p class="text-gray-400 text-sm max-w-md mb-8">
              我是一个基于人工智能的助手，可以回答问题、提供创意建议、协助你完成各种任务。
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
        <div class="relative">
          <textarea 
            v-model="userInput" 
            @keydown.enter.prevent="sendMessage"
            placeholder="输入您的问题..." 
            class="bg-gray-900 border border-gray-700 rounded-xl text-white p-4 pr-12 w-full focus:outline-none focus:border-primary"
            rows="1"
            ref="textareaRef"
          ></textarea>
          <button 
            @click="sendMessage" 
            class="absolute right-3 bottom-3 w-8 h-8 bg-primary rounded-lg flex items-center justify-center"
            :disabled="isLoading || !userInput.trim()"
            :class="{'opacity-50 cursor-not-allowed': isLoading || !userInput.trim()}"
          >
            <i class="fas fa-paper-plane text-white text-sm"></i>
          </button>
        </div>
        <div class="text-xs text-gray-500 mt-2 text-center">天枢科技AI助手，为您提供智能解答</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useChatStore } from '../stores/chat'
import MessageFormatter from '../components/MessageFormatter.vue'

// 使用聊天状态存储
const chatStore = useChatStore()

// DOM引用
const chatContainer = ref(null)
const textareaRef = ref(null)

// 用户输入
const userInput = ref('')

// 对话建议
const suggestions = [
  "你好，我想了解一下天枢AI能做什么?",
  "请帮我写一份周报",
  "帮我分析一下当前人工智能的发展趋势",
  "介绍一下如何使用AI提高工作效率"
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
const isLoading = computed(() => chatStore.isLoading)
const messages = computed(() => chatStore.sortedMessages)

// 简化滚动逻辑，专注于用户体验
const autoScrollEnabled = ref(true); // 默认启用自动滚动
const scrollDebounceTimer = ref(null);
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
  const observer = new MutationObserver(() => {
    // 防抖处理
    clearTimeout(scrollDebounceTimer.value);
    scrollDebounceTimer.value = setTimeout(() => {
      checkContentAndScroll();
    }, 100);
  });
  
  // 开始观察变化
  observer.observe(chatContainer.value, {
    childList: true,
    subtree: true,
    characterData: true
  });
  
  // 组件卸载时清理
  onBeforeUnmount(() => {
    observer.disconnect();
    clearTimeout(scrollDebounceTimer.value);
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
  const content = userInput.value.trim();
  if (!content || isLoading.value) return;
  
  // 清空输入框
  userInput.value = '';
  adjustTextareaHeight();
  
  try {
    // 重新启用自动滚动
    autoScrollEnabled.value = true;
    
    // 先滚动到底部确保用户可以看到自己的消息
    scrollToBottom(true);
    
    // 发送消息到API
    await chatStore.sendMessage(content);
    
    // 消息发送后再次滚动
    setTimeout(() => {
      scrollToBottom(true);
    }, 100);
  } catch (e) {
    console.error('发送消息失败:', e);
  }
};

// 开始以建议开始对话
const startConversation = (suggestion) => {
  userInput.value = suggestion
  sendMessage()
}

// 格式化消息内容（处理换行、链接等）
const formatMessage = (content) => {
  if (!content) return ''
  
  try {
    // 替换换行符为<br>
    let formatted = content.replace(/\n/g, '<br>')
    
    // 将URL转换为可点击的链接
    formatted = formatted.replace(
      /(https?:\/\/[^\s]+)/g, 
      '<a href="$1" target="_blank" class="text-primary hover:underline">$1</a>'
    )
    
    // 先处理完整的details标签
    if (formatted.includes('<details>') && formatted.includes('</details>')) {
      try {
        const detailsPattern = /<details>([\s\S]*?)<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g;
        formatted = formatted.replace(detailsPattern, 
          '<details class="my-3 bg-[#070620] rounded-lg overflow-hidden border border-primary/10"><summary class="p-3 cursor-pointer text-gray-300 font-medium hover:bg-[#0a0830] transition-colors">$2</summary><div class="p-3 border-t border-primary/10 bg-[#080722] text-gray-300">$3</div></details>');
      } catch (e) {
        console.error('重新处理details标签失败', e);
      }
    }
    
    // 处理不完整的details和summary标签
    if (formatted.includes('<details>') && !formatted.includes('</details>')) {
      formatted = formatted.replace(/<details>([\s\S]*)$/, 
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
    formatted = formatted.replace(/\n/g, '<br>')
    
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

// 页面加载时初始化
onMounted(async () => {
  try {
    // 初始化聊天状态
    await chatStore.initialize()
    
    // 检查API连接状态
    await chatStore.checkConnection()
    
    // 创建新会话
    chatStore.createNewConversation()
    
    // 设置滚动系统
    nextTick(() => {
      setupScrollSystem();
      
      // 初始滚动到底部
      scrollToBottom(true);
    });
  } catch (e) {
    console.error('Assistant初始化失败:', e);
  }
})

// 组件卸载时清理资源
onBeforeUnmount(() => {
  clearTimeout(scrollDebounceTimer.value);
});
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