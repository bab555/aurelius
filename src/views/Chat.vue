<template>
  <!-- 将所有内容放在一个非全屏的div中，依赖App.vue的布局 -->
  <div class="flex-1 flex flex-col relative overflow-x-visible">
    <!-- 主要内容区 - 使用相对定位，不使用全屏布局 -->
    <main class="flex-1 overflow-hidden pt-4 px-6 pb-6 flex flex-col">
      <!-- 聊天消息区域 -->
      <div class="flex-1 bg-[#0e0b36] rounded-xl p-4 md:p-6 mb-4 overflow-hidden flex flex-col">
        <div class="flex-1 overflow-y-auto" id="chat-messages">
          <div class="space-y-6 pr-4"> 
            <!-- 加载状态 -->
            <div v-if="chatStore.isLoading && chatStore.messages.length === 0" class="flex justify-center py-10">
              <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
            
            <!-- 错误提示 -->
            <div v-if="chatStore.error" class="flex justify-center py-4">
              <div class="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg">
                {{ chatStore.error }}
              </div>
            </div>
            
            <!-- 消息列表 -->
            <template v-else>
              <!-- 欢迎消息 -->
              <div v-if="chatStore.messages.length === 0" class="flex items-start">
                <div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-robot text-primary"></i>
                </div>
                <div class="ml-4 bg-white/5 rounded-lg p-4 max-w-[80%]">
                  <p class="text-gray-200">欢迎使用天枢 AI 助手！我可以帮助您：</p>
                  <ul class="text-gray-300 mt-2 space-y-2">
                    <li>• 生成和编辑图片</li>
                    <li>• 制作和编辑视频</li>
                    <li>• 创建专业 PPT</li>
                    <li>• 回答各类问题</li>
                  </ul>
                </div>
              </div>
              
              <!-- 实际消息 -->
              <div v-for="msg in chatStore.sortedMessages" :key="msg.id" class="flex items-start" :class="{'justify-end': msg.role === 'user'}">
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
                    
                    <!-- 消息附件 -->
                    <div v-if="msg.files && msg.files.length > 0" class="mt-4 grid grid-cols-2 gap-2">
                      <div v-for="file in msg.files" :key="file.id" class="relative">
                        <img v-if="file.type === 'image'" :src="file.url" alt="图片" class="rounded-lg w-full h-auto" />
                        <div v-else class="bg-white/10 p-3 rounded-lg flex items-center text-gray-300">
                          <i class="fas fa-file mr-2"></i>
                          <span class="truncate">{{ file.name || 'File' }}</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- 引用资源展示 -->
                    <div v-if="msg.retriever_resources && msg.retriever_resources.length > 0" class="mt-4 border-t border-gray-700 pt-3">
                      <div class="text-xs text-gray-400 mb-2">参考资料：</div>
                      <div v-for="(resource, idx) in msg.retriever_resources" :key="idx" 
                           class="text-xs text-gray-400 bg-white/5 p-2 rounded mb-2">
                        <div class="font-semibold">{{ resource.document_name || '文档' }}</div>
                        <div class="truncate">{{ resource.content || '' }}</div>
                      </div>
                    </div>
                    
                    <!-- 消息控制按钮 -->
                    <div v-if="!msg.isError" class="mt-3 flex justify-end space-x-2 text-xs">
                      <button v-if="msg.isStreaming" @click="chatStore.stopGenerating()" 
                              class="text-gray-400 hover:text-gray-200">
                        <i class="fas fa-stop mr-1"></i>停止生成
                      </button>
                      <button v-else @click="handleFeedback(msg.id, 'like')" 
                              :class="{'text-green-500': msg.feedback?.rating === 'like'}"
                              class="text-gray-400 hover:text-gray-200">
                        <i class="fas fa-thumbs-up mr-1"></i>
                      </button>
                      <button v-if="!msg.isStreaming" @click="handleFeedback(msg.id, 'dislike')" 
                              :class="{'text-red-500': msg.feedback?.rating === 'dislike'}"
                              class="text-gray-400 hover:text-gray-200">
                        <i class="fas fa-thumbs-down mr-1"></i>
                      </button>
                    </div>
                    
                    <!-- 错误消息时的重试按钮 -->
                    <div v-if="msg.isError" class="mt-3 flex justify-end">
                      <button @click="retry()" class="text-xs bg-primary/30 hover:bg-primary/50 text-white px-3 py-1 rounded">
                        <i class="fas fa-redo mr-1"></i>重新发送
                      </button>
                    </div>
                  </div>
                </template>
                
                <!-- 用户消息 -->
                <template v-else>
                  <div class="mr-4 bg-white/5 rounded-lg p-4 max-w-[80%]">
                    <p class="text-gray-200">{{ msg.content }}</p>
                    
                    <!-- 用户附件 -->
                    <div v-if="msg.files && msg.files.length > 0" class="mt-4 grid grid-cols-2 gap-2">
                      <div v-for="file in msg.files" :key="file.id" class="relative">
                        <img v-if="file.type.startsWith('image/')" :src="file.url" alt="用户图片" class="rounded-lg w-full h-auto" />
                        <div v-else class="bg-white/10 p-3 rounded-lg flex items-center text-gray-300">
                          <i class="fas fa-file mr-2"></i>
                          <span class="truncate">{{ file.name || 'File' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-user text-gray-400"></i>
                  </div>
                </template>
              </div>
            </template>
          </div>
        </div>
      </div>
        
      <!-- 底部输入框 -->
      <div class="bg-[#0e0b36] rounded-xl p-4 shadow-lg">
        <div class="flex flex-col">
          <textarea 
            v-model="message"
            class="flex-1 bg-transparent border-none outline-none text-gray-200 placeholder-gray-500 resize-none px-2 py-1 h-24 focus:bg-white/8"
            placeholder="输入您的问题..."
            @keydown.enter.ctrl="sendMessage"
          ></textarea>
          <div class="flex items-center justify-between mt-4">
            <div class="flex items-center space-x-2">
              <input
                type="file"
                ref="fileInput"
                @change="handleFileUpload"
                class="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <button @click="$refs.fileInput.click()" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-200" title="上传文件">
                <i class="far fa-image fa-lg"></i>
              </button>
              <button class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-200">
                <i class="far fa-file-text fa-lg"></i>
              </button>
              
              <!-- 上传中标示 -->
              <div v-if="uploading" class="text-xs text-gray-400 flex items-center">
                <div class="animate-spin h-4 w-4 border-b-2 border-primary mr-2"></div>
                上传中...
              </div>
              
              <!-- 已上传文件预览 -->
              <div v-if="attachments.length > 0" class="flex items-center space-x-2">
                <div v-for="(file, idx) in attachments" :key="idx" 
                     class="relative bg-white/10 rounded-md p-1 flex items-center text-xs text-gray-300">
                  <img v-if="file.type.startsWith('image/')" :src="file.url" alt="预览图" class="h-8 w-8 object-cover rounded mr-1" />
                  <i v-else class="fas fa-file mr-1"></i>
                  <span class="truncate max-w-[60px]">{{ file.name }}</span>
                  <button @click="removeAttachment(idx)" class="ml-1 text-gray-400 hover:text-red-400">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
            <button 
              @click="sendMessage"
              :disabled="isMessageEmpty || chatStore.isLoading"
              :class="{'opacity-50 cursor-not-allowed': isMessageEmpty || chatStore.isLoading}"
              class="bg-primary text-white w-12 h-12 flex items-center justify-center rounded-full hover:bg-primary/90"
            >
              <i v-if="chatStore.isLoading" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-arrow-up text-lg"></i>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- 调试面板 -->
    <DebugPanel v-if="showDebugPanel" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import DebugPanel from '../components/DebugPanel.vue'
import CodeBlock from '../components/CodeBlock.vue'
import HtmlViewer from '../components/HtmlViewer.vue'
import { useChatStore } from '../stores/chat'
import * as chatAPI from '../services/chatAPI'
import MessageFormatter from '../components/MessageFormatter.vue'

// 使用聊天状态存储
const chatStore = useChatStore()

// 本地状态
const message = ref('')
const attachments = ref([])
const uploading = ref(false)
const fileInput = ref(null)
const showDebugPanel = ref(true)  // 控制是否显示调试面板
const pauseAutoScroll = ref(false) // 是否暂停自动滚动

// 计算属性
const isMessageEmpty = computed(() => !message.value.trim() && attachments.value.length === 0)

// 页面加载时初始化
onMounted(async () => {
  // 初始化聊天状态
  await chatStore.initialize()
  
  // 检查API连接状态
  await chatStore.checkConnection()
  
  // 不再使用自动滚动，改用手动滚动按钮
  // nextTick(() => {
  //   scrollToBottom()
  // })
  
  // 移除自动滚动的MutationObserver
  // const chatMessagesEl = document.getElementById('chat-messages')
  // if (chatMessagesEl) {
  //   const observer = new MutationObserver(() => {
  //     scrollToBottom()
  //   })
  //   
  //   observer.observe(chatMessagesEl, {
  //     childList: true,
  //     subtree: true,
  //     characterData: true,
  //     attributes: true
  //   })
  // }
})

// 监听消息变化，自动滚动到底部 - 禁用以防止干扰导航
// watch(() => chatStore.messages.length, async () => {
//   await nextTick()
//   scrollToBottom()
// })

// 监听消息内容更新 - 禁用自动滚动
// let lastContentLength = 0;
// let scrollDebounceTimer = null;
// 
// watch(() => [...chatStore.messages].map(m => m.content).join(''), async (newContent) => {
//   await nextTick();
//   
//   // 如果滚动被暂停，则不执行自动滚动
//   if (pauseAutoScroll.value) {
//     return;
//   }
//   
//   // 智能判断是否需要滚动
//   // 只有内容长度增加超过一定阈值，或者包含换行符时才滚动
//   const contentLengthDiff = newContent.length - lastContentLength;
//   const hasScrollTriggeringChange = contentLengthDiff > 50 || 
//                                   (contentLengthDiff > 0 && newContent.slice(-contentLengthDiff).includes('\n'));
//   
//   if (hasScrollTriggeringChange) {
//     // 使用防抖处理滚动，避免过于频繁
//     if (scrollDebounceTimer) {
//       clearTimeout(scrollDebounceTimer);
//     }
//     
//     scrollDebounceTimer = setTimeout(() => {
//       scrollToBottom();
//     }, 100);
//   }
//   
//   lastContentLength = newContent.length;
// });

// 暂停滚动 - 在思考框内容处理时调用
const pauseScrolling = () => {
  pauseAutoScroll.value = true;
};

// 恢复滚动 - 简化，不再使用复杂的多次尝试逻辑
const resumeScrolling = () => {
  console.log('[滚动控制] 恢复滚动标志位');
  pauseAutoScroll.value = false;
  // 不再尝试自动滚动，由用户控制
}

// 滚动到底部（使用更平滑的方式）
const scrollToBottom = (force = false) => {
  // 如果滚动被暂停且不是强制滚动，则不执行
  if (pauseAutoScroll.value && !force) {
    return;
  }
  
  const chatMessages = document.getElementById('chat-messages');
  if (chatMessages) {
    // 使用平滑滚动代替直接设置scrollTop
    requestAnimationFrame(() => {
      try {
        chatMessages.scrollTo({
          top: chatMessages.scrollHeight,
          behavior: 'smooth'
        });
      } catch (e) {
        // 回退到传统方式
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    });
  }
};

// 重试上一条消息
const retry = () => {
  // 查找用户最后一条消息
  const lastUserMsg = [...chatStore.messages]
    .filter(m => m.role === 'user')
    .pop();
    
  if (lastUserMsg) {
    // 移除错误消息
    const errorMsgIndex = chatStore.messages.findIndex(m => m.isError);
    if (errorMsgIndex !== -1) {
      chatStore.messages.splice(errorMsgIndex, 1);
    }
    
    // 重新发送
    chatStore.sendMessage(lastUserMsg.content);
  }
}

// 发送消息
const sendMessage = async () => {
  if (isMessageEmpty.value || chatStore.isLoading) return
  
  const messageText = message.value.trim()
  const files = [...attachments.value]
  
  // 清空输入框和附件
  message.value = ''
  attachments.value = []
  
  // 发送消息
  await chatStore.sendMessage(messageText, files)
}

// 处理文件上传
const handleFileUpload = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return
  
  uploading.value = true
  
  try {
    // 上传文件
    for (const file of files) {
      const uploadedFile = await chatStore.uploadFileForChat(file)
      attachments.value.push({
        ...uploadedFile,
        name: file.name,
        type: file.type
      })
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    alert(`文件上传失败: ${error.message || '未知错误'}`)
  } finally {
    uploading.value = false
    // 重置文件输入框
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

// 移除附件
const removeAttachment = (index) => {
  attachments.value.splice(index, 1)
}

// 处理消息反馈
const handleFeedback = async (messageId, rating) => {
  try {
    // 查找消息
    const message = chatStore.messages.find(m => m.id === messageId)
    if (!message) return
    
    // 如果已经点击了同样的反馈，则取消
    const newRating = message.feedback?.rating === rating ? null : rating
    
    // 调用API
    await chatAPI.feedbackMessage(messageId, newRating, chatStore.userId)
    
    // 更新本地状态
    message.feedback = { rating: newRating }
  } catch (error) {
    console.error('提交反馈失败:', error)
  }
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
    return ''
  }
}

// 组件卸载时清理
onBeforeUnmount(() => {
  // 不再需要清理滚动防抖计时器和观察器
  console.log("[Chat] 组件卸载，清理资源");
  
  // 确保pauseAutoScroll复位，避免影响其他页面
  pauseAutoScroll.value = false;
});
</script>

<style scoped>
/* 聊天相关样式 */
.message-container:last-child {
  margin-bottom: 10px;
}

/* WebKit浏览器滚动条样式 */
#chat-messages::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

#chat-messages::-webkit-scrollbar-track {
  background: #222130;
  border-radius: 10px;
}

#chat-messages::-webkit-scrollbar-thumb {
  background: #484850;
  border-radius: 10px;
}

#chat-messages::-webkit-scrollbar-thumb:hover {
  background: #5d5d67;
}

/* Firefox浏览器滚动条样式 */
#chat-messages html {
  scrollbar-width: thin;
  scrollbar-color: #484850 #222130;
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

/* 工具卡样式 */
.tool-card {
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.tool-card:hover {
  margin-top: -6px;
  background: rgba(255,255,255,0.12);
}
</style> 