<template>
  <div class="flex-1 flex flex-col relative h-screen">
    <!-- 组件加载指示器 -->
    <div v-if="!isComponentReady" class="absolute inset-0 flex items-center justify-center bg-[#0e0b36]/80 z-10">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    
    <div class="p-4 md:p-8 flex flex-col h-full">
      <!-- 页面标题 -->
      <div class="mb-6 flex-shrink-0">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">命理算师</h1>
            <p class="text-gray-400 text-sm">基于八字五行分析命理，揭示性格、事业、感情和财运走势</p>
          </div>
          <button 
            @click="showBirthForm" 
            class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <i class="fas fa-sync-alt mr-1"></i> 再算一次
          </button>
        </div>
        
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
            算命状态: {{ chatStore.connectionStatus === 'connected' ? '已连接' : 
                        chatStore.connectionStatus === 'disconnected' ? '未连接' : '未知' }}
          </span>
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
              <i class="fas fa-moon text-primary text-2xl"></i>
            </div>
            <h3 class="text-lg font-medium mb-2">欢迎使用命理算师</h3>
            <p class="text-gray-400 text-sm max-w-md mb-6">
              我是专业的八字命理大师，可以根据您的出生年月日时辰，分析命理八字、五行属性、事业财运和姻缘走势。
            </p>
            <button 
              @click="showBirthForm" 
              class="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              立即测算命理
            </button>
          </div>
          
          <div v-else class="space-y-6 pb-4">
            <!-- 实际消息 -->
            <div v-for="msg in messages" :key="msg.id" class="flex items-start" :class="{'justify-end': msg.role === 'user'}">
              <!-- AI消息 -->
              <template v-if="msg.role === 'assistant'">
                <div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-moon text-primary" :class="{'text-red-500': msg.isError}"></i>
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
            :disabled="isLoading || !inputEnabled"
            :class="{'opacity-70': !inputEnabled}"
          ></textarea>
          <button 
            @click="sendMessage" 
            class="absolute right-3 bottom-3 w-8 h-8 bg-primary rounded-lg flex items-center justify-center"
            :disabled="isLoading || !userInput.trim() || !inputEnabled"
            :class="{'opacity-50 cursor-not-allowed': isLoading || !userInput.trim() || !inputEnabled}"
          >
            <i class="fas fa-paper-plane text-white text-sm"></i>
          </button>
        </div>
        <div class="text-xs text-gray-500 mt-2 text-center" v-if="!inputEnabled">
          请先提供出生信息进行八字测算，才能与命理大师对话
        </div>
        <div class="text-xs text-gray-500 mt-2 text-center" v-else>
          命理算师，揭示命运走向，指引人生方向
        </div>
      </div>
    </div>
  </div>
  
  <!-- 出生信息表单弹窗 -->
  <Teleport to="body">
    <div v-if="showBirthModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div class="bg-[#111030] rounded-xl p-6 max-w-md w-full">
        <h2 class="text-xl font-bold text-white mb-4">请输入出生信息</h2>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">姓名（选填）</label>
          <input v-model="personInfo.name" class="w-full p-2 bg-gray-900 text-white rounded border border-gray-700" placeholder="请输入姓名" />
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">性别</label>
          <div class="flex gap-4">
            <label class="flex items-center">
              <input type="radio" v-model="personInfo.gender" value="男" class="mr-2" />
              <span class="text-gray-300">男</span>
            </label>
            <label class="flex items-center">
              <input type="radio" v-model="personInfo.gender" value="女" class="mr-2" />
              <span class="text-gray-300">女</span>
            </label>
          </div>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">出生日期（公历）</label>
          <div class="grid grid-cols-4 gap-2">
            <select v-model="personInfo.year" class="p-2 bg-gray-900 text-white rounded border border-gray-700">
              <option v-for="year in years" :key="year" :value="year">{{ year }}年</option>
            </select>
            
            <select v-model="personInfo.month" class="p-2 bg-gray-900 text-white rounded border border-gray-700">
              <option v-for="month in 12" :key="month" :value="month">{{ month }}月</option>
            </select>
            
            <select v-model="personInfo.day" class="p-2 bg-gray-900 text-white rounded border border-gray-700">
              <option v-for="day in days" :key="day" :value="day">{{ day }}日</option>
            </select>
            
            <select v-model="personInfo.hour" class="p-2 bg-gray-900 text-white rounded border border-gray-700">
              <option v-for="hour in 24" :key="hour-1" :value="hour-1">{{ hour-1 }}时</option>
            </select>
          </div>
          <p class="text-xs text-gray-500 mt-1">请输入公历生日</p>
        </div>
        
        <div class="flex justify-center mt-6">
          <button @click="startDivination" class="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors">
            开始算命
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 算命结果弹窗 -->
  <Teleport to="body">
    <div v-if="showResultModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div class="bg-[#111030] rounded-xl p-6 max-w-xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-white">八字分析结果</h2>
          <button 
            @click="copyResultToClipboard" 
            class="text-xs bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1 rounded-full flex items-center transition-colors"
          >
            <i class="fas fa-copy mr-1"></i> 复制结果
          </button>
        </div>
        
        <div class="bg-gray-800/50 rounded-lg p-4 mb-6 flex-1 overflow-y-auto custom-scrollbar">
          <div id="result-content" class="text-white whitespace-pre-wrap break-words select-text text-sm leading-relaxed" v-html="formatResultContent(latestResult)"></div>
        </div>
        
        <p class="text-center text-gray-300 mb-4">是否与大师继续交谈，获取更详细结果？</p>
        
        <div class="flex justify-center space-x-4">
          <button @click="continueDivination" class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            是
          </button>
          <button @click="endDivination" class="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
            否
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'vue-router'
import { useChatStore } from '../../stores/chat'
import MessageFormatter from '../../components/MessageFormatter.vue'
import { APP_TYPES } from '../../services/chatAPI'
import DOMPurify from 'dompurify'
import * as swManager from '../../services/swManager'

// 使用路由
const router = useRouter();

// 使用聊天状态存储
const chatStore = useChatStore();

// DOM引用
const chatContainer = ref(null);
const textareaRef = ref(null);

// 用户输入
const userInput = ref('');

// 算命相关状态
const showBirthModal = ref(false);
const showResultModal = ref(false);
const latestResult = ref('');
const inputEnabled = ref(false);
const personInfo = ref({
  name: '',
  gender: '男',
  year: 1990,
  month: 1,
  day: 1,
  hour: 12
});

// 年份范围（从1949年开始到当前年份）
const currentYear = new Date().getFullYear();
const years = computed(() => {
  const result = [];
  for (let year = 1949; year <= currentYear; year++) {
    result.push(year);
  }
  return result;
});

// 根据年月计算天数
const days = computed(() => {
  return getDaysInMonth(personInfo.value.year, personInfo.value.month);
});

function getDaysInMonth(year, month) {
  // 获取指定年月的天数
  const daysInMonth = new Date(year, month, 0).getDate();
  const result = [];
  for (let day = 1; day <= daysInMonth; day++) {
    result.push(day);
  }
  return result;
}

// 自动调整文本框高度
const adjustTextareaHeight = () => {
  if (!textareaRef.value) return;
  try {
    textareaRef.value.style.height = 'auto';
    textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 150)}px`;
  } catch (e) {
    console.error('调整文本框高度失败:', e);
  }
}

watch(userInput, adjustTextareaHeight);

// 计算属性
const isLoading = computed(() => chatStore.isLoading);
const messages = computed(() => chatStore.sortedMessages);

// 滚动相关逻辑
const autoScrollEnabled = ref(true);
const scrollDebounceTimer = ref(null);
const isUserScrolling = ref(false);
const lastScrollTime = ref(0);

// 滚动到底部函数
const scrollToBottom = (force = false) => {
  if (!autoScrollEnabled.value && !force) {
    return;
  }
  
  if (!chatContainer.value) return;
  
  lastScrollTime.value = Date.now();
  
  try {
    if (force) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    } else {
      chatContainer.value.scrollTo({
        top: chatContainer.value.scrollHeight,
        behavior: 'smooth'
      });
    }
  } catch (e) {
    console.error('滚动失败:', e);
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

// 定义observer和清理函数作为组件级别变量
const contentObserver = ref(null);

// 处理滚动变化和自动滚动逻辑
const checkContentAndScroll = () => {
  if (autoScrollEnabled.value && chatContainer.value) {
    const lastMessage = messages.value[messages.value.length - 1];
    const isNewUserMessage = lastMessage && lastMessage.role === 'user';
    const isStreaming = lastMessage && lastMessage.isStreaming;
    
    if (isNewUserMessage || isStreaming) {
      scrollToBottom();
    }
  }
};

// 提前注册生命周期钩子
onBeforeUnmount(() => {
  try {
    // 如果使用中间层且有会话ID，清理会话
    if (chatStore.isUsingMiddleLayer && chatStore.currentConversationId) {
      try {
        console.log('命理算师页面卸载，标记会话完成并清理资源', chatStore.currentConversationId);
        swManager.completeSession(chatStore.currentConversationId);
        swManager.clearSession(chatStore.currentConversationId);
      } catch (error) {
        console.error('标记会话完成失败:', error);
      }
    }
    
    // 移除事件监听器
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('session-replaced', handleSessionReplaced);
    
    // 保存会话ID到sessionStorage
    if (chatStore.currentConversationId) {
      sessionStorage.setItem('destiny_conversation_id', chatStore.currentConversationId);
      // 保存个人信息
      sessionStorage.setItem('destiny_person_info', JSON.stringify(personInfo.value));
    }
    
    // 清理观察器
    if (contentObserver.value) {
      contentObserver.value.disconnect();
    }
    
    // 清理滚动系统
    if (scrollDebounceTimer.value) {
      clearTimeout(scrollDebounceTimer.value);
    }
    
    // 确保pauseAutoScroll复位，避免影响其他页面
    autoScrollEnabled.value = false;
    console.log("[Destiny] 组件卸载，清理资源");
  } catch (error) {
    console.error('命理页面卸载清理失败:', error);
  }
});

// 设置滚动系统
const setupScrollSystem = () => {
  if (!chatContainer.value) {
    console.warn('聊天容器未找到，无法设置滚动系统');
    return;
  }
  
  // 如果已存在之前的observer，先断开连接
  if (contentObserver.value) {
    contentObserver.value.disconnect();
  }
  
  // 设置滚动监听
  chatContainer.value.addEventListener('scroll', () => {
    if (!chatContainer.value) return;
    
    const currentPos = chatContainer.value.scrollTop;
    const maxScroll = chatContainer.value.scrollHeight - chatContainer.value.clientHeight;
    const distanceFromBottom = maxScroll - currentPos;
    
    if (distanceFromBottom > 200) {
      autoScrollEnabled.value = false;
      isUserScrolling.value = true;
    } else {
      autoScrollEnabled.value = true;
      isUserScrolling.value = false;
    }
  });
  
  // 创建新的MutationObserver
  contentObserver.value = new MutationObserver(() => {
    // 设置防抖定时器
    if (scrollDebounceTimer.value) {
      clearTimeout(scrollDebounceTimer.value);
    }
    
    scrollDebounceTimer.value = setTimeout(() => {
      checkContentAndScroll();
    }, 100);
  });
  
  contentObserver.value.observe(chatContainer.value, {
    childList: true,
    subtree: true,
    characterData: true
  });
};

// 暂停和恢复滚动
const pauseScrolling = () => {
  autoScrollEnabled.value = false;
};

const resumeScrolling = () => {
  autoScrollEnabled.value = true;
  
  setTimeout(() => {
    scrollToBottom();
  }, 50);
};

// 监听消息数量变化
watch(() => messages.value.length, (newCount, oldCount) => {
  if (newCount > oldCount) {
    setTimeout(() => {
      scrollToBottom(true);
    }, 50);
  }
});

// 打开出生信息表单
const showBirthForm = async () => {
  // 清空当前会话ID，确保开始新的算命
  if (chatStore.currentConversationId) {
    console.log('再算一次：清空现有会话ID', chatStore.currentConversationId);
    
    // 如果使用中间层，清理会话资源
    if (chatStore.isUsingMiddleLayer && chatStore.currentConversationId) {
      try {
        // 标记会话完成
        await swManager.completeSession(chatStore.currentConversationId);
        // 清理会话
        await swManager.clearSession(chatStore.currentConversationId);
        console.log('已清理中间层会话资源');
        
        // 重置同步状态
        syncedWithMiddleLayer.value = false;
      } catch (error) {
        console.warn('清理中间层会话失败:', error);
      }
    }
    
    // 清空会话ID
    chatStore.currentConversationId = '';
    
    // 从sessionStorage中删除
    sessionStorage.removeItem('destiny_conversation_id');
    sessionStorage.removeItem('destiny_person_info');
    
    // 清空消息列表
    chatStore.messages = [];
    
    // 重置所有状态
    chatStore.isLoading = false;
    chatStore.isStreaming = false;
    chatStore.isGenerating = false;
    chatStore.currentTask = null;
    
    // 确保输入框被禁用，直到完成算命
    inputEnabled.value = false;
  }
  
  // 显示表单
  showBirthModal.value = true;
};

// 开始算命
const startDivination = async () => {
  // 基本验证
  if (!personInfo.value.gender || !personInfo.value.year || !personInfo.value.month || !personInfo.value.day) {
    // 提示用户
    alert('请完整填写出生信息');
    return;
  }
  
  // 关闭表单
  showBirthModal.value = false;
  
  try {
    // 确保当前无会话ID，这样会由后端创建新会话
    if (chatStore.currentConversationId) {
      console.log('开始新算命前清空会话ID');
      chatStore.currentConversationId = '';
    }
    
    // 设置当前应用类型
    chatStore.setAppType(APP_TYPES.DESTINY);
    
    // 构建年月日时字符串
    const { year, month, day, hour } = personInfo.value;
    const yearStr = year.toString();
    const monthStr = month < 10 ? `0${month}` : month.toString();
    const dayStr = day < 10 ? `0${day}` : day.toString();
    const hourStr = hour < 10 ? `0${hour}` : hour.toString();
    
    // 构建推送内容
    let content = '请根据我的出生信息进行八字分析和命理测算';
    
    // 添加姓名（如果有）
    if (personInfo.value.name) {
      content += `，我的姓名是：${personInfo.value.name}`;
    }
    
    // 添加性别
    content += `，性别：${personInfo.value.gender}`;
    
    // 添加出生年月日时
    content += `，出生时间：${yearStr}年${monthStr}月${dayStr}日${hourStr}时`;
    
    // 重新启用自动滚动
    autoScrollEnabled.value = true;
    
    // 先滚动到底部确保用户可以看到消息
    scrollToBottom(true);
    
    // 发送消息 - 传空会话ID，让后端创建新会话
    await chatStore.sendMessage(content, [], {
      // 传递输入参数给API
      year: yearStr,
      month: monthStr,
      day: dayStr,
      hour: hourStr,
      time: hourStr,
      gender: personInfo.value.gender,
      name: personInfo.value.name || ''
    });
    
    // 如果消息发送成功并获得会话ID，保存会话状态
    if (chatStore.currentConversationId) {
      // 保存个人信息以备后用
      sessionStorage.setItem('destiny_person_info', JSON.stringify(personInfo.value));
      
      // 保存会话ID以便稍后恢复
      sessionStorage.setItem('destiny_conversation_id', chatStore.currentConversationId);
      
      // 如果使用中间层，同步会话状态
      if (chatStore.isUsingMiddleLayer) {
        await syncWithMiddleLayer();
      }
    }
    
    // 消息发送后再次滚动
    setTimeout(() => {
      scrollToBottom(true);
    }, 100);
    
    // 如果消息发送成功，获取最新结果以备显示在结果弹窗中
    if (messages.value.length > 0) {
      const lastMessage = messages.value[messages.value.length - 1];
      if (lastMessage.role === 'assistant') {
        // 保存原始内容，后续会在formatResultContent中处理
        latestResult.value = lastMessage.content;
        console.log('获取到的结果内容长度:', latestResult.value.length);
        console.log('结果内容前100字符:', latestResult.value.substring(0, 100));
        
        // 当消息完全生成后显示结果弹窗
        const checkMessageCompletion = () => {
          if (!lastMessage.isStreaming) {
            // 到此时，消息已完全生成完毕
            console.log('消息生成完毕，准备显示弹窗');
            
            // 准备显示弹窗
            nextTick(() => {
              // 确保内容不为空才显示弹窗
              if (lastMessage.content && lastMessage.content.trim()) {
                showResultModal.value = true;
                
                // 弹窗显示后，检查内容是否正确显示
                setTimeout(() => {
                  const resultElement = document.getElementById('result-content');
                  if (resultElement) {
                    console.log('结果弹窗内容长度:', resultElement.innerText.length);
                  }
                }, 100);
              } else {
                console.error('消息内容为空，不显示弹窗');
              }
            });
            return;
          }
          
          // 如果消息仍在流式传输，继续检查
          setTimeout(checkMessageCompletion, 500);
        };
        
        // 开始检查
        setTimeout(checkMessageCompletion, 1000);
      }
    }
    
    // 滚动到底部
    scrollToBottom(true);
  } catch (e) {
    console.error('算命请求失败:', e);
    
    // 如果是会话不存在错误，则清理会话ID
    if (e.message && e.message.includes('Conversation Not Exists')) {
      console.warn('会话不存在，清理会话ID');
      await cleanupSession();
    }
    
    // 恢复输入状态
    isLoading.value = false;
    
    // 显示错误消息
    messages.value.push({
      id: uuidv4(),
      conversation_id: chatStore.currentConversationId || '',
      role: 'assistant',
      content: `⚠️ 系统错误：${e.message || '请求失败'}`,
      created_at: Date.now() / 1000,
      isError: true
    });
  }
};

// 继续与大师对话
const continueDivination = () => {
  showResultModal.value = false;
  // 启用输入框，允许用户继续对话
  inputEnabled.value = true;
  
  // 添加明确的标记，表示用户已选择继续对话
  const hasCompletedFirstRound = true;
  
  // 如果有中间层，更新状态
  if (chatStore.isUsingMiddleLayer && chatStore.currentConversationId) {
    swManager.updateSession(chatStore.currentConversationId, {
      hasCompletedFirstRound: true,
      inputEnabled: true,
      last_updated: Date.now()
    });
  }
  
  // 同步到sessionStorage
  try {
    // 保存标记到sessionStorage
    sessionStorage.setItem('destiny_has_completed', 'true');
  } catch (e) {
    console.warn('保存会话完成状态到sessionStorage失败:', e);
  }
  
  // 滚动到底部，准备继续对话
  scrollToBottom(true);
};

// 结束对话并返回主页
const endDivination = () => {
  showResultModal.value = false;
  // 禁用输入框
  inputEnabled.value = false;
  
  // 清除会话存储
  sessionStorage.removeItem('destiny_conversation_id');
  sessionStorage.removeItem('destiny_person_info');
  
  // 返回主页
  router.push('/home');
};

// 发送消息
const sendMessage = async () => {
  // 如果正在加载或输入被禁用，不处理
  if (!inputEnabled.value || chatStore.isLoading) return;
  
  // 获取输入内容
  const content = userInput.value.trim();
  if (!content) return;
  
  // 清空输入框
  userInput.value = '';
  
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
    autoScrollEnabled.value = true;
    
    // 滚动到底部确保用户可以看到新消息
    scrollToBottom(true);
    
    // 如果使用中间层，确保同步
    if (chatStore.isUsingMiddleLayer && chatStore.currentConversationId) {
      if (!syncedWithMiddleLayer.value) {
        try {
          await syncWithMiddleLayer();
        } catch (error) {
          console.warn('同步到中间层失败，但将继续发送消息:', error);
        }
      }
    }
    
    // 发送消息
    await chatStore.sendMessage(content);
    
    // 消息发送成功后，保存会话ID和个人信息
    if (chatStore.currentConversationId) {
      sessionStorage.setItem('destiny_conversation_id', chatStore.currentConversationId);
      sessionStorage.setItem('destiny_person_info', JSON.stringify(personInfo.value));
      
      // 如果使用中间层且尚未同步，执行同步
      if (chatStore.isUsingMiddleLayer && !syncedWithMiddleLayer.value) {
        await syncWithMiddleLayer();
      }
    }
    
    // 发送后再次滚动到底部
    setTimeout(() => {
      scrollToBottom(true);
    }, 100);
  } catch (error) {
    console.error('发送消息失败:', error);
    
    // 如果是会话不存在错误，则清理会话ID
    if (error.message && error.message.includes('Conversation Not Exists')) {
      console.warn('会话不存在，清理会话ID');
      await cleanupSession();
    }
    
    // 显示错误消息给用户
    if (messages.value && Array.isArray(messages.value)) {
      messages.value.push({
        id: crypto.randomUUID(),
        conversation_id: chatStore.currentConversationId || '',
        role: 'assistant',
        content: `⚠️ 消息发送失败：${error.message || '网络连接错误'}`,
        created_at: Date.now() / 1000,
        isError: true
      });
    }
    
    // 尝试恢复用户输入内容
    if (content && !userInput.value) {
      userInput.value = content;
    }
  }
};

// 页面加载时初始化
onMounted(async () => {
  try {
    // 初始化聊天状态
    await chatStore.initialize(APP_TYPES.DESTINY);
    
    // 检查API连接状态
    await chatStore.checkConnection();
    
    // 恢复会话流程
    let sessionLoaded = false;
    
    // 尝试从sessionStorage中恢复会话ID
    const sessionId = sessionStorage.getItem('destiny_conversation_id');
    const savedPersonInfo = sessionStorage.getItem('destiny_person_info');
    // 检查是否已完成第一轮对话
    const hasCompletedFirstRound = sessionStorage.getItem('destiny_has_completed') === 'true';

    if (sessionId) {
      // 验证会话ID格式
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(sessionId)) {
        console.log('从sessionStorage恢复命理会话:', sessionId);
        
        try {
          // 尝试切换到该会话，这会重置所有状态变量
          await chatStore.switchConversation(sessionId);
          
          // 标记会话已加载
          sessionLoaded = true;
          
          // 恢复个人信息
          if (savedPersonInfo) {
            try {
              personInfo.value = JSON.parse(savedPersonInfo);
            } catch (e) {
              console.error('恢复个人信息失败:', e);
            }
          }
          
          // 使用明确的完成状态标记来决定输入框状态
          if (hasCompletedFirstRound) {
            inputEnabled.value = true;
            console.log('会话恢复：检测到用户已完成第一轮对话并选择继续，启用输入框');
          } else if (messages.value.length >= 2 && !messages.value.some(msg => msg.isStreaming)) {
            // 兼容旧逻辑：根据消息数量判断
            inputEnabled.value = true;
            console.log('会话恢复：根据消息数量判断已完成第一轮对话，启用输入框');
          } else {
            inputEnabled.value = false;
            console.log('会话恢复：对话尚未完成第一轮，禁用输入框');
          }
          
          // 尝试从中间层恢复会话中的消息
          if (chatStore.isUsingMiddleLayer) {
            try {
              const restored = await chatStore.tryRestoreSessionFromMiddleLayer();
              if (restored) {
                console.log('成功从中间层恢复命理会话消息');
                syncedWithMiddleLayer.value = true;
                
                // 尝试获取中间层保存的个人信息和输入框状态
                const sessionData = await swManager.getSession(chatStore.currentConversationId);
                if (sessionData) {
                  if (sessionData.personInfo) {
                    personInfo.value = sessionData.personInfo;
                    console.log('已从中间层恢复个人信息');
                  }
                  
                  // 检查中间层是否有明确的完成状态标记
                  if (sessionData.hasCompletedFirstRound === true) {
                    inputEnabled.value = true;
                    // 同步到sessionStorage
                    sessionStorage.setItem('destiny_has_completed', 'true');
                    console.log('已从中间层恢复完成状态：用户已完成第一轮对话');
                  }
                  // 如果中间层有保存输入框状态，且没有检测到完成标记，以中间层为准
                  else if (typeof sessionData.inputEnabled === 'boolean') {
                    inputEnabled.value = sessionData.inputEnabled;
                    console.log('已从中间层恢复输入框状态:', inputEnabled.value);
                  }
                }
                
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
              console.warn('从中间层恢复命理会话失败:', e);
            }
          }
          
          // 强制重置所有状态变量，确保不会处于"对话中"状态
          chatStore.isLoading = false;
          chatStore.isStreaming = false;
          chatStore.isGenerating = false;
          chatStore.currentTask = null;
          
          console.log('命理会话恢复完成，状态已重置，输入框状态:', inputEnabled.value);
        } catch (error) {
          console.warn('恢复命理会话失败:', error);
          
          // 如果是会话不存在错误，则清理会话ID
          if (error.message && error.message.includes('Conversation Not Exists')) {
            await cleanupSession();
            sessionLoaded = false;
          }
        }
      } else {
        console.warn('命理会话ID格式不正确:', sessionId);
        sessionStorage.removeItem('destiny_conversation_id');
        sessionStorage.removeItem('destiny_person_info');
      }
    }
    
    // 如果没有恢复到有效会话，则准备新会话环境
    if (!sessionLoaded) {
      console.log('准备新命理会话环境');
      
      // 设置应用类型
      chatStore.setAppType(APP_TYPES.DESTINY);
      
      // 清除当前会话ID
      chatStore.currentConversationId = '';
      
      // 清空消息
      messages.value = [];
      
      // 重置输入状态
      inputEnabled.value = false;
      
      // 确保所有状态变量重置
      chatStore.isLoading = false;
      chatStore.isStreaming = false;
      chatStore.isGenerating = false;
      chatStore.currentTask = null;
      
      // 显示出生信息表单
      setTimeout(() => {
        if (messages.value.length === 0) {
          showBirthForm();
        }
      }, 1000);
    }
    
    // 设置滚动系统
    nextTick(() => {
      setupScrollSystem();
      
      // 初始滚动到底部
      if (chatStore.messages.length > 0) {
        scrollToBottom(true);
      }
    });
    
    // 添加页面可见性变更监听
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 监听会话替换事件
    window.addEventListener('session-replaced', handleSessionReplaced);
    
    // 标记组件为已就绪
    isComponentReady.value = true;
  } catch (error) {
    console.error('命理页面初始化失败:', error);
    inputEnabled.value = false; // 出错时禁用输入框
    
    // 错误恢复措施，清理所有会话状态
    await cleanupSession();
    
    isComponentReady.value = true; // 即使失败也设置为就绪，允许用户操作
  }
});

// 格式化结果内容
const formatResultContent = (content) => {
  if (!content) return '';
  
  console.log('原始内容长度:', content.length);
  
  let result = content;
  
  try {
    // 添加关键调试信息
    console.log('格式化结果内容 - 原始内容:', content.substring(0, 100) + '...');
    
    // 处理代码块
    result = result.replace(/```([a-z]*)\n([\s\S]+?)\n```/g, '<pre class="code-block"><code>$2</code></pre>');
    
    // 处理思考框内容 - 保留结构但美化样式
    if (!result.includes('class="thinking-box"')) {
      result = result.replace(/<details[^>]*>[\s\S]*?<summary[^>]*>Thinking[\s\S]*?<\/summary>([\s\S]*?)<\/details>/gi, 
        '<div class="thinking-box"><div class="thinking-header">AI思考过程</div><div class="thinking-content">$1</div></div>');
    }
    
    // 删除其他可能存在的details标签
    result = result.replace(/<details[^>]*>/gi, '<div class="section">');
    result = result.replace(/<\/details>/gi, '</div>');
    result = result.replace(/<summary[^>]*>([\s\S]*?)<\/summary>/gi, '<div class="section-title">$1</div>');
    
    // 处理Markdown风格的标记，但保留为HTML
    // 处理标题
    result = result.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    result = result.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    result = result.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    
    // 处理无序列表
    result = result.replace(/^- (.*?)$/gm, '<li>$1</li>');
    result = result.replace(/^\* (.*?)$/gm, '<li>$1</li>');
    result = result.replace(/(<li>.*?<\/li>\n)+/gs, '<ul>$&</ul>');
    
    // 处理有序列表
    result = result.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>');
    result = result.replace(/(<li>.*?<\/li>\n)+/gs, '<ul>$&</ul>');
    
    // 处理粗体和斜体
    result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 处理强调八字相关内容
    result = result.replace(/【([^】]+)】/g, '<strong class="highlight-title">【$1】</strong>');
    
    // 处理五行元素
    const wuxingElements = ['金', '木', '水', '火', '土'];
    wuxingElements.forEach(element => {
      result = result.replace(new RegExp(`${element}命`, 'g'), `<span class="wuxing wuxing-${element}">${element}命</span>`);
      result = result.replace(new RegExp(`${element}相`, 'g'), `<span class="wuxing wuxing-${element}">${element}相</span>`);
    });
    
    // 处理换行符，确保段落正确
    result = result.replace(/\n\n+/g, '</p><p>');  // 多个换行符变成段落
    result = result.replace(/\n/g, '<br>');        // 单个换行符变成<br>
    
    // 包裹在段落标签中
    if (!result.startsWith('<')) {
      result = '<p>' + result;
    }
    if (!result.endsWith('>')) {
      result += '</p>';
    }
    
    console.log('格式化后内容长度:', result.length);
    console.log('格式化后内容预览:', result.substring(0, 100) + '...');
    
    return result;
  } catch (error) {
    console.error('格式化结果内容出错:', error);
    // 如果格式化出错，返回原始内容，确保至少显示一些内容
    return `<p>${content}</p>`;
  }
};

// 复制结果到剪贴板
const copyResultToClipboard = async () => {
  try {
    const resultContent = document.getElementById('result-content');
    if (!resultContent) return;
    
    // 获取纯文本内容（去除HTML标签）
    let textContent = resultContent.innerText || resultContent.textContent || '';
    
    // 清理内容，替换多余空行等
    textContent = textContent.replace(/\n{3,}/g, '\n\n'); // 最多保留两个连续换行
    textContent = textContent.trim();
    
    console.log('准备复制的内容长度:', textContent.length);
    
    // 使用Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(textContent);
      console.log('使用现代Clipboard API复制成功');
      alert('命理结果已复制到剪贴板');
    } else {
      // 回退到传统方法
      const textArea = document.createElement('textarea');
      textArea.value = textContent;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('使用传统方法复制成功');
        alert('命理结果已复制到剪贴板');
      } else {
        throw new Error('复制命令执行失败');
      }
    }
  } catch (err) {
    console.error('复制失败:', err);
    alert('复制失败，请手动选择文本并复制');
  }
};

// 在showResultModal变化时标记会话完成
watch(showResultModal, (newValue) => {
  if (newValue === true && chatStore.currentConversationId) {
    // 当结果弹窗显示时，标记会话为完成状态
    console.log('命理结果弹窗显示，标记会话完成');
    swManager.completeSession(chatStore.currentConversationId);
  }
});

// 处理会话被其他标签页替换的情况
const handleSessionReplaced = (event) => {
  const { oldSessionId, newSessionId } = event.detail;
  
  // 检查是否是当前会话被替换
  if (chatStore.currentConversationId === oldSessionId) {
    console.warn('检测到当前会话已在其他标签页中打开，本页面将不再响应');
    
    // 显示提示给用户
    if (messages.value && Array.isArray(messages.value)) {
      messages.value.push({
        id: crypto.randomUUID(),
        conversation_id: chatStore.currentConversationId,
        role: 'assistant',
        content: '⚠️ 检测到您已在其他标签页中打开了命理算师。为避免冲突，本页面将不再响应。',
        created_at: Date.now() / 1000,
        isError: true
      });
    }
    
    // 禁用输入
    inputEnabled.value = false;
    
    // 隐藏表单
    showBirthModal.value = false;
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
      type: 'destiny-assistant',
      name: '命理算师',
      description: '八字命理分析',
      created_at: Date.now(),
      personInfo: personInfo.value // 保存个人信息
    });
    
    // 更新会话数据
    await swManager.updateSession(chatStore.currentConversationId, {
      messages: chatStore.sortedMessages,
      last_updated: Date.now()
    });
    
    // 添加会话监听器
    swManager.addSessionListener(chatStore.currentConversationId, handleSessionUpdate);
    
    console.log('命理分析会话已同步到中间层:', chatStore.currentConversationId);
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
        // 先标记会话完成
        await swManager.completeSession(oldId);
        // 然后清理资源
        await swManager.clearSession(oldId);
        console.log('已清理中间层会话:', oldId);
        
        // 重置中间层同步状态
        syncedWithMiddleLayer.value = false;
      } catch (e) {
        console.warn('清理中间层会话失败:', e);
      }
    }
    
    // 清除当前会话ID
    chatStore.currentConversationId = '';
    
    // 从会话存储中移除所有相关数据
    sessionStorage.removeItem('destiny_conversation_id');
    sessionStorage.removeItem('destiny_person_info');
    sessionStorage.removeItem('destiny_has_completed'); // 清理完成状态标记
    
    // 清空消息列表
    chatStore.messages = [];
    
    // 重置状态变量
    chatStore.isLoading = false;
    chatStore.isStreaming = false;
    chatStore.isGenerating = false;
    chatStore.currentTask = null;
    
    // 重置输入框状态
    inputEnabled.value = false;
    
    console.log('命理会话已完全清理，准备重新开始对话');
    return true;
  } catch (error) {
    console.error('清理会话失败:', error);
    return false;
  }
};

// 处理会话更新的辅助函数
const handleSessionUpdate = (event) => {
  console.log('接收到中间层会话更新:', event);
  // 可以在这里添加处理会话更新的逻辑
};

// 中间层同步状态
const syncedWithMiddleLayer = ref(false)

// 组件就绪状态
const isComponentReady = ref(false)

// 处理页面可见性变更
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    // 页面变为可见时
    console.log('命理算师页面恢复可见');
    
    // 如果有当前会话ID，检查会话是否仍然有效
    if (chatStore.currentConversationId) {
      try {
        // 检查会话是否存在于sessionStorage中
        const storedId = sessionStorage.getItem('destiny_conversation_id');
        // 检查是否已完成第一轮对话
        const hasCompletedFirstRound = sessionStorage.getItem('destiny_has_completed') === 'true';
        
        if (storedId !== chatStore.currentConversationId) {
          console.log('会话ID不匹配，更新到sessionStorage', {
            stored: storedId,
            current: chatStore.currentConversationId
          });
          sessionStorage.setItem('destiny_conversation_id', chatStore.currentConversationId);
          
          // 同时确保个人信息也被更新
          sessionStorage.setItem('destiny_person_info', JSON.stringify(personInfo.value));
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
        
        // 检查会话状态，决定是否启用输入框
        if (hasCompletedFirstRound) {
          // 明确标记已完成第一轮对话
          inputEnabled.value = true;
          console.log('页面恢复可见，检测到用户已完成第一轮对话，启用输入框');
        } else if (messages.value.length >= 2) {
          // 兼容旧逻辑：已经完成了第一轮算命且有多条消息，说明用户已经选择了继续对话
          inputEnabled.value = true;
          console.log('页面恢复可见，检测到多条消息，启用输入框');
        } else if (showResultModal.value) {
          // 正在显示结果弹窗，输入框应该保持禁用
          inputEnabled.value = false;
          console.log('页面恢复可见，正在显示结果弹窗，保持输入框禁用');
        }
        
        // 如果使用中间层，检查会话是否同步
        if (chatStore.isUsingMiddleLayer && !syncedWithMiddleLayer.value) {
          await syncWithMiddleLayer();
        }
      } catch (error) {
        console.warn('页面恢复可见时同步会话状态失败:', error);
      }
    } else {
      // 没有会话ID，应该禁用输入框
      inputEnabled.value = false;
      console.log('页面恢复可见，没有有效会话，禁用输入框');
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
      console.log('命理算师页面隐藏，保存会话状态');
      sessionStorage.setItem('destiny_conversation_id', chatStore.currentConversationId);
      
      // 同时保存个人信息
      sessionStorage.setItem('destiny_person_info', JSON.stringify(personInfo.value));
      
      // 保存完成状态标记
      if (inputEnabled.value) {
        sessionStorage.setItem('destiny_has_completed', 'true');
      }
      
      // 如果使用中间层，确保最新状态已同步
      if (chatStore.isUsingMiddleLayer && syncedWithMiddleLayer.value) {
        try {
          await swManager.updateSession(chatStore.currentConversationId, {
            messages: chatStore.sortedMessages,
            personInfo: personInfo.value,
            inputEnabled: inputEnabled.value,
            hasCompletedFirstRound: inputEnabled.value, // 如果输入框已启用，表示已完成第一轮
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

/* 结果弹窗内容样式 */
:deep(.result-markdown) {
  margin: 12px 0;
  padding: 8px;
  background-color: rgba(99, 102, 241, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.1);
}

:deep(.code-block) {
  margin: 10px 0;
  padding: 10px;
  background: #0a0a10;
  border-radius: 6px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  font-family: monospace;
  white-space: pre-wrap;
  font-size: 0.9em;
}

:deep(.highlight-title) {
  color: #6366f1;
  margin: 12px 0 6px;
  display: block;
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
  padding-bottom: 4px;
}

:deep(.wuxing) {
  font-weight: 500;
  padding: 2px 5px;
  border-radius: 3px;
  margin: 0 2px;
  display: inline-block;
}

:deep(.wuxing-金) {
  background: rgba(255, 215, 0, 0.2);
  color: #ffb700;
}

:deep(.wuxing-木) {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

:deep(.wuxing-水) {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

:deep(.wuxing-火) {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

:deep(.wuxing-土) {
  background: rgba(161, 98, 7, 0.2);
  color: #b45309;
}

/* 弹窗内容的格式化样式 */
:deep(p) {
  margin-bottom: 1em;
  line-height: 1.6;
}

:deep(h1), :deep(h2), :deep(h3) {
  margin-top: 1.5em;
  margin-bottom: 0.75em;
  color: #a5b4fc;
  font-weight: 600;
}

:deep(h1) {
  font-size: 1.5em;
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
  padding-bottom: 0.25em;
}

:deep(h2) {
  font-size: 1.25em;
}

:deep(h3) {
  font-size: 1.1em;
}

:deep(ul), :deep(ol) {
  margin: 1em 0;
  padding-left: 2em;
}

:deep(li) {
  margin-bottom: 0.5em;
}

:deep(strong) {
  color: #c7d2fe;
  font-weight: 600;
}

:deep(em) {
  font-style: italic;
  color: #d8b4fe;
}

:deep(.section) {
  margin: 1.5em 0;
  padding: 0.5em 0;
  border-top: 1px dashed rgba(99, 102, 241, 0.2);
}

:deep(.section-title) {
  font-weight: 600;
  color: #a5b4fc;
  margin-bottom: 0.5em;
  font-size: 1.1em;
}

:deep(.error-box) {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  padding: 0.75em;
  border-radius: 6px;
  margin-bottom: 1em;
}
</style>