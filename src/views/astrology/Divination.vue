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
            <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">卦师</h1>
            <p class="text-gray-400 text-sm">独家完美实现古籍与程序结合六爻排盘算法，基于《火珠林》《增删卜易》等古籍的严谨测算，精确分析六爻卦象，预测吉凶祸福，洞察命运走向</p>
          </div>
          <button 
            @click="showBirthForm" 
            class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <i class="fas fa-sync-alt mr-1"></i> 再算一卦
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
              <i class="fas fa-book text-primary text-2xl"></i>
            </div>
            <h3 class="text-lg font-medium mb-2">欢迎使用卦师</h3>
            <p class="text-gray-400 text-sm max-w-md mb-6">
              我是专业的六爻卦师，可以根据您的出生信息和具体问题，分析卦象吉凶，预测未来走势。
            </p>
            <button 
              @click="showBirthForm" 
              class="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              立即起卦
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

      <!-- 用户输入表单 -->
      <div class="fixed bottom-0 w-full left-0 right-0 p-4 z-10 bg-gray-950 bg-opacity-80 backdrop-blur-sm">
        <div class="flex items-center bg-gray-900 rounded-lg shadow-lg border border-gray-800 w-full max-w-full mx-auto md:ml-[60px] md:w-[calc(100%-92px)]">
          <textarea 
            ref="textareaRef"
            v-model="userInput" 
            :disabled="!inputEnabled || chatStore.isLoading"
            @keydown.enter.exact.prevent="doSendMessage"
            placeholder="在此输入您的问题..."
            class="flex-1 bg-transparent border-none text-white placeholder-gray-500 p-3 py-4 resize-none max-h-32 min-h-[56px]"
            rows="1"
          ></textarea>
          
          <button 
            id="sendButton"
            @click="doSendMessage"
            :disabled="!inputEnabled || !userInput.trim() || chatStore.isLoading"
            :class="{'opacity-50 cursor-not-allowed': !inputEnabled || !userInput.trim() || chatStore.isLoading, 
                    'hover:bg-indigo-700': inputEnabled && userInput.trim() && !chatStore.isLoading}"
            class="p-3 m-1 rounded-md bg-indigo-600 text-white focus:outline-none"
          >
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
        
        <!-- 输入状态提示 -->
        <div v-if="!inputEnabled" class="text-gray-500 text-xs text-center mt-2">
          <span v-if="!personInfo.name">请先填写您的个人信息</span>
          <span v-else>正在分析您的卦象，请稍候...</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 出生信息表单弹窗 -->
  <Teleport to="body">
    <div v-if="showBirthModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1001] px-4">
      <div class="bg-[#111030] rounded-xl p-4 md:p-6 w-full max-w-md overflow-y-auto max-h-[90vh]">
        <h2 class="text-xl font-bold text-white mb-4">起卦信息</h2>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">姓名（选填）</label>
          <input v-model="personInfo.name" class="w-full p-2 bg-gray-900 text-white rounded border border-gray-700 appearance-none" placeholder="请输入姓名" />
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">性别</label>
          <div class="flex gap-4">
            <label class="flex items-center">
              <input type="radio" v-model="personInfo.gender" value="男" class="mr-2 w-4 h-4" />
              <span class="text-gray-300">男</span>
            </label>
            <label class="flex items-center">
              <input type="radio" v-model="personInfo.gender" value="女" class="mr-2 w-4 h-4" />
              <span class="text-gray-300">女</span>
            </label>
          </div>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">问题类型 <span class="text-red-400">*</span></label>
          <select v-model="questionType" class="w-full p-2 bg-gray-900 text-white rounded border border-gray-700 appearance-none">
            <option value="">请选择</option>
            <option value="婚姻">婚姻</option>
            <option value="事业">事业</option>
            <option value="财运">财运</option>
            <option value="健康">健康</option>
            <option value="学业">学业</option>
            <option value="出行">出行</option>
            <option value="人际">人际</option>
            <option value="其他">其他</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">求卦问题 <span class="text-red-400">*</span></label>
          <input 
            v-model="questionText" 
            class="w-full p-2 bg-gray-900 text-white rounded border border-gray-700 appearance-none" 
            placeholder="请用一个词语或简短的一句话描述您的问题"
          />
          <p class="text-xs text-gray-500 mt-1">问题越具体，卦象解读越准确</p>
        </div>
        
        <div class="flex justify-center mt-6">
          <button @click="startDivination" class="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors">
            起卦
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 算命结果弹窗 -->
  <Teleport to="body">
    <div v-if="showResultModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1001] px-4">
      <div class="bg-[#111030] rounded-xl p-4 md:p-6 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-white">六爻分析结果</h2>
          <button 
            @click="copyResultToClipboard" 
            class="text-xs bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1 rounded-full flex items-center transition-colors"
          >
            <i class="fas fa-copy mr-1"></i> 复制结果
          </button>
        </div>
        
        <div class="bg-gray-800/50 rounded-lg p-3 md:p-4 mb-4 md:mb-6 flex-1 overflow-y-auto custom-scrollbar">
          <div id="result-content" class="text-white whitespace-pre-wrap break-words select-text text-sm leading-relaxed" v-html="formatResultContent(latestResult)"></div>
        </div>
        
        <p class="text-center text-gray-300 mb-4">是否与大师继续交谈，获取更详细结果？</p>
        
        <div class="flex justify-center space-x-4">
          <button @click="continueDivination" class="px-4 md:px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            是
          </button>
          <button @click="endDivination" class="px-4 md:px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
            否
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 新增铜钱摇卦弹窗 -->
  <Teleport to="body">
    <div v-if="showCoinModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1001] px-4">
      <div class="bg-[#111030] rounded-xl p-4 md:p-6 w-full max-w-md overflow-y-auto max-h-[90vh]">
        <h2 class="text-xl font-bold text-white mb-4">摇卦</h2>
        
        <!-- 用户信息显示 -->
        <div class="mb-6 bg-gray-800/30 p-3 rounded-lg">
          <p class="text-sm text-gray-300">{{ personInfo.name ? personInfo.name + '，' : '' }}{{ personInfo.gender }}，{{ questionType.value }}：{{ questionText.value }}</p>
        </div>
        
        <!-- 铜钱区域 -->
        <div class="flex justify-center mb-6">
          <div class="flex space-x-6">
            <div 
              v-for="(coin, index) in coins" 
              :key="index" 
              class="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              :class="[
                coin.isAnimating ? 'animate-flip' : '',
                coin.value ? 'bg-yellow-600' : 'bg-yellow-400'
              ]"
            >
              <div class="text-center">
                <!-- 正面显示一个圆形中心点，反面显示方形图案 -->
                <div v-if="coin.value" class="w-4 h-4 rounded-full bg-yellow-300"></div>
                <div v-else class="w-4 h-4 bg-yellow-700"></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 摇卦结果显示 -->
        <div class="mb-6">
          <div class="flex justify-center items-center space-x-2">
            <span class="text-gray-400 text-sm">已摇卦次数：{{ currentYaoCount }}/6</span>
            <span v-if="currentYaoResult" class="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
              当前结果：{{ currentYaoResult }}
            </span>
          </div>
          
          <!-- 已摇卦结果列表 -->
          <div class="mt-4 grid grid-cols-6 gap-2">
            <div 
              v-for="(yao, index) in yaoResults" 
              :key="index" 
              class="aspect-square p-2 rounded-lg bg-gray-800/30 flex items-center justify-center relative"
            >
              <span class="text-xs text-gray-500 absolute top-1 left-1">{{index + 1}}</span>
              <span 
                v-if="yao" 
                class="text-white text-xs font-medium"
                :class="{
                  'text-red-400': yao === 'old_yang',
                  'text-blue-400': yao === 'old_yin',
                  'text-red-300': yao === 'young_yang',
                  'text-blue-300': yao === 'young_yin'
                }"
              >
                {{ yaoDisplayText[yao] }}
              </span>
              <span v-else class="text-gray-600 text-xs">-</span>
            </div>
          </div>
        </div>
        
        <div class="flex justify-center">
          <button 
            v-if="currentYaoCount < 6"
            @click="shakeCoin" 
            :disabled="isShaking"
            :class="{'opacity-50': isShaking}"
            class="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            摇卦
          </button>
          <button 
            v-else
            @click="startDivinationWithYao" 
            class="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            开始断卦
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
// 引入农历转换库
import { Lunar, Solar } from 'lunar-javascript'

// 使用路由
const router = useRouter();

// 使用聊天状态存储
const chatStore = useChatStore();

// 添加一个常量来表示卦师应用类型
const DIVINATION_APP_TYPE = 'divination';

// DOM引用
const chatContainer = ref(null);
const textareaRef = ref(null);

// 用户输入
const userInput = ref('');
const questionText = ref(''); // 求卦问题字段
const questionType = ref(''); // 问题类型字段

// 算命相关状态
const showBirthModal = ref(false);
const showResultModal = ref(false);
const latestResult = ref('');
const inputEnabled = ref(false);
const isLunarDate = ref(false); // 添加回isLunarDate变量以解决引用错误
const lastMessageTime = ref(Date.now()); // 上次消息发送时间
const statusCheckInterval = ref(null); // 状态检查定时器
const personInfo = ref({
  name: '',
  gender: '男'
});

// 农历日期
const lunarDate = ref({
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

// 根据年月计算公历天数
const days = computed(() => {
  return getDaysInMonth(personInfo.value.year, personInfo.value.month);
});

// 根据年月计算农历天数
const lunarDays = computed(() => {
  // 农历月份的天数
  const year = lunarDate.value.year;
  const month = lunarDate.value.month;
  let dayCount = 30; // 默认大月
  
  try {
    // 获取当前农历月的天数
    const lunar = Lunar.fromYmd(year, month, 1);
    dayCount = lunar.getDaysInMonth();
  } catch (e) {
    console.error('计算农历天数出错:', e);
  }
  
  const result = [];
  for (let i = 1; i <= dayCount; i++) {
    result.push(i);
  }
  return result;
});

// 切换日期类型（公历/农历）
const toggleDateType = () => {
  isLunarDate.value = !isLunarDate.value;
  personInfo.value.isLunar = isLunarDate.value;
  
  if (isLunarDate.value) {
    // 公历转农历
    try {
      const solar = Solar.fromYmd(personInfo.value.year, personInfo.value.month, personInfo.value.day);
      const lunar = solar.getLunar();
      
      // 更新农历日期
      lunarDate.value = {
        year: lunar.getYear(),
        month: lunar.getMonth(),
        day: lunar.getDay(),
        hour: personInfo.value.hour
      };
    } catch (e) {
      console.error('公历转农历失败:', e);
    }
  } else {
    // 农历转公历
    try {
      const lunar = Lunar.fromYmd(lunarDate.value.year, lunarDate.value.month, lunarDate.value.day);
      const solar = lunar.getSolar();
      
      // 更新公历日期
      personInfo.value.year = solar.getYear();
      personInfo.value.month = solar.getMonth();
      personInfo.value.day = solar.getDay();
    } catch (e) {
      console.error('农历转公历失败:', e);
    }
  }
};

function getDaysInMonth(year, month) {
  // 获取指定年月的天数
  const daysInMonth = new Date(year, month, 0).getDate();
  const result = [];
  for (let i = 1; i <= daysInMonth; i++) {
    result.push(i);
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
      sessionStorage.setItem('divination_conversation_id', chatStore.currentConversationId);
      // 保存个人信息
      sessionStorage.setItem('divination_person_info', JSON.stringify(personInfo.value));
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
    sessionStorage.removeItem('divination_conversation_id');
    sessionStorage.removeItem('divination_person_info');
    
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
  
  // 根据当前选择的日期类型设置状态
  isLunarDate.value = personInfo.value.isLunar;
  
  // 如果是农历模式，确保农历日期已正确设置
  if (isLunarDate.value && !lunarDate.value.year) {
    try {
      const solar = Solar.fromYmd(personInfo.value.year, personInfo.value.month, personInfo.value.day);
      const lunar = solar.getLunar();
      
      lunarDate.value = {
        year: lunar.getYear(),
        month: lunar.getMonth(),
        day: lunar.getDay(),
        hour: personInfo.value.hour
      };
    } catch (e) {
      console.error('公历转农历失败:', e);
      // 出错时重置为公历模式
      isLunarDate.value = false;
      personInfo.value.isLunar = false;
    }
  }
  
  // 显示表单
  showBirthModal.value = true;
};

// 开始算命
const startDivination = async () => {
  // 基本验证
  if (!personInfo.value.gender) {
    alert('请选择性别');
    return;
  }

  // 验证问题类型
  if (!questionType.value) {
    alert('请选择问题类型');
    return;
  }

  // 验证问题输入
  if (!questionText.value.trim()) {
    alert('请输入您想预测的问题');
    return;
  }
  
  // 关闭填写表单，打开摇卦弹窗
  showBirthModal.value = false;
  
  // 重置摇卦状态
  currentYaoCount.value = 0;
  currentYaoResult.value = '';
  yaoResults.value = [null, null, null, null, null, null];
  
  // 显示摇卦弹窗
  showCoinModal.value = true;
};

// 摇卦算法
const shakeCoin = () => {
  if (isShaking.value) return;
  
  isShaking.value = true;
  currentYaoResult.value = '';
  
  // 开始铜钱动画
  coins.value.forEach(coin => {
    coin.isAnimating = true;
  });
  
  // 1秒后停止动画，生成随机结果
  setTimeout(() => {
    // 随机生成铜钱正反面
    coins.value.forEach(coin => {
      coin.value = Math.random() > 0.5;
      coin.isAnimating = false;
    });
    
    // 计算结果
    const count = coins.value.filter(coin => coin.value).length;
    
    // 根据正面数量判断爻的类型
    // 0个正面(全是反面)：老阴（6）
    // 1个正面，2个反面：少阳（9）
    // 2个正面，1个反面：少阴（7）
    // 3个正面，0个反面：老阳（8）
    let result = '';
    switch(count) {
      case 0:
        result = 'old_yin'; // 老阴
        currentYaoResult.value = '老阴';
        break;
      case 1:
        result = 'young_yang'; // 少阳
        currentYaoResult.value = '少阳';
        break;
      case 2:
        result = 'young_yin'; // 少阴
        currentYaoResult.value = '少阴';
        break;
      case 3:
        result = 'old_yang'; // 老阳
        currentYaoResult.value = '老阳';
        break;
    }
    
    // 保存结果到对应位置
    yaoResults.value[currentYaoCount.value] = result;
    
    // 增加爻的计数
    currentYaoCount.value++;
    
    isShaking.value = false;
  }, 1000);
};

// 摇卦完成后，发送卦象到后端
const startDivinationWithYao = async () => {
  try {
    // 关闭摇卦弹窗
    showCoinModal.value = false;
    
    // 确保当前无会话ID，创建新会话
    if (chatStore.currentConversationId) {
      console.log('开始新算命前清空会话ID');
      chatStore.currentConversationId = '';
    }
    
    // 设置当前应用类型
    chatStore.setAppType(DIVINATION_APP_TYPE);
    
    // 构建六爻数据 - 合并问题类型和内容，添加摇卦结果
    lunarBirthData.value = {
      question_type: `${questionType.value}：${questionText.value}`,
      sex: personInfo.value.gender,
      yao1: yaoResults.value[0],
      yao2: yaoResults.value[1],
      yao3: yaoResults.value[2],
      yao4: yaoResults.value[3],
      yao5: yaoResults.value[4],
      yao6: yaoResults.value[5]
    };
    
    // 构建推送内容
    let content = `请根据我的六爻卦象为我进行预测。我的问题类型是：${questionType.value}，具体问题是：${questionText.value}`;
    
    // 添加姓名（如果有）
    if (personInfo.value.name) {
      content += `，我的姓名是：${personInfo.value.name}`;
    }
    
    // 添加性别
    content += `，性别：${personInfo.value.gender}`;
    
    // 添加摇卦结果
    content += `。我摇出的卦象是：第一爻${yaoDisplayText[yaoResults.value[0]]}，第二爻${yaoDisplayText[yaoResults.value[1]]}，第三爻${yaoDisplayText[yaoResults.value[2]]}，第四爻${yaoDisplayText[yaoResults.value[3]]}，第五爻${yaoDisplayText[yaoResults.value[4]]}，第六爻${yaoDisplayText[yaoResults.value[5]]}`;
    
    // 重新启用自动滚动
    autoScrollEnabled.value = true;
    
    // 先滚动到底部确保用户可以看到消息
    scrollToBottom(true);
    
    // 发送消息 - 传空会话ID，让后端创建新会话
    await chatStore.sendMessage(content, [], lunarBirthData.value);
    
    // 消息发送成功后，保存会话ID和个人信息
    if (chatStore.currentConversationId) {
      sessionStorage.setItem('divination_conversation_id', chatStore.currentConversationId);
      
      // 保存个人信息
      sessionStorage.setItem('divination_person_info', JSON.stringify({
        ...personInfo.value
      }));
      
      // 单独存储问题数据，避免受到其他状态的影响
      sessionStorage.setItem('divination_question_data', JSON.stringify({
        question_type: `${questionType.value}：${questionText.value}`,
        yao1: yaoResults.value[0],
        yao2: yaoResults.value[1],
        yao3: yaoResults.value[2],
        yao4: yaoResults.value[3],
        yao5: yaoResults.value[4],
        yao6: yaoResults.value[5]
      }));
      
      // 如果使用中间层，同步会话状态
      if (chatStore.isUsingMiddleLayer) {
        await syncWithMiddleLayer();
      }
    }
    
    // 发送后再次滚动到底部
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
  // 更新全局弹窗状态
  if (window.streamingState && typeof window.streamingState.setModalShowing === 'function') {
    window.streamingState.setModalShowing(false);
  }
  // 启用输入框，允许用户继续对话
  inputEnabled.value = true;
  
  // 添加明确的标记，表示用户已选择继续对话
  const hasCompletedFirstRound = true;
  
  // 确保保存农历出生数据
  if (lunarBirthData.value.year && lunarBirthData.value.month && lunarBirthData.value.day) {
    sessionStorage.setItem('divination_lunar_birth_data', JSON.stringify(lunarBirthData.value));
  }
  
  // 如果有中间层，更新状态
  if (chatStore.isUsingMiddleLayer && chatStore.currentConversationId) {
    swManager.updateSession(chatStore.currentConversationId, {
      hasCompletedFirstRound: true,
      inputEnabled: true,
      lunarBirthData: lunarBirthData.value, // 更新农历数据
      last_updated: Date.now()
    });
  }
  
  // 同步到sessionStorage
  try {
    // 保存标记到sessionStorage
    sessionStorage.setItem('divination_has_completed', 'true');
  } catch (e) {
    console.warn('保存会话完成状态到sessionStorage失败:', e);
  }
  
  // 滚动到底部，准备继续对话
  scrollToBottom(true);
};

// 结束对话并返回主页
const endDivination = () => {
  showResultModal.value = false;
  // 更新全局弹窗状态
  if (window.streamingState && typeof window.streamingState.setModalShowing === 'function') {
    window.streamingState.setModalShowing(false);
  }
  // 禁用输入框
  inputEnabled.value = false;
  
  // 清除会话存储
  sessionStorage.removeItem('divination_conversation_id');
  sessionStorage.removeItem('divination_person_info');
  
  // 返回主页
  router.push('/home');
};

// 发送消息
const sendMessage = () => {
  console.log('sendMessage被调用，当前输入内容:', userInput.value);
  if (userInput.value && userInput.value.trim()) {
    console.log('输入内容有效，调用sendUserMessage');
    sendUserMessage(userInput.value);
  } else {
    console.log('输入内容为空，不发送消息');
  }
};

// 页面加载时初始化
onMounted(async () => {
  try {
    // 初始化聊天状态，使用卦师应用类型
    await chatStore.initialize(DIVINATION_APP_TYPE);
    
    // 移除自定义凭证设置代码，应该在.env中配置
    // if (typeof chatStore.setCustomCredentials === 'function') {
    //   chatStore.setCustomCredentials(DIVINATION_APP_ID, DIVINATION_API_KEY);
    // }
    
    // 检查API连接状态
    await chatStore.checkConnection();
    
    // 恢复会话流程
    let sessionLoaded = false;
    
    // 尝试从sessionStorage中恢复会话ID
    const sessionId = sessionStorage.getItem('divination_conversation_id');
    const savedPersonInfo = sessionStorage.getItem('divination_person_info');
    const savedLunarBirthData = sessionStorage.getItem('divination_lunar_birth_data');
    // 检查是否已完成第一轮对话
    const hasCompletedFirstRound = sessionStorage.getItem('divination_has_completed') === 'true';

    // 先恢复农历出生数据，这与会话状态无关
    if (savedLunarBirthData) {
      try {
        lunarBirthData.value = JSON.parse(savedLunarBirthData);
        console.log('已从sessionStorage直接恢复农历出生数据:', lunarBirthData.value);
      } catch (e) {
        console.error('恢复农历出生数据失败:', e);
      }
    }

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
          
          // 直接从后端获取历史消息，确保消息始终能显示
          console.log('直接从后端获取命理会话历史消息');
          await chatStore.fetchMessages(sessionId);
          console.log('获取命理消息完成，消息数量:', chatStore.messages.length);
          
          // 恢复个人信息
          if (savedPersonInfo) {
            try {
              const parsedInfo = JSON.parse(savedPersonInfo);
              
              // 恢复基本信息
              personInfo.value = {
                name: parsedInfo.name || '',
                gender: parsedInfo.gender || '男'
              };
              
              // 恢复日期类型选择
              isLunarDate.value = parsedInfo.isLunar || false;
              
              // 恢复农历日期
              if (parsedInfo.lunarDate) {
                lunarDate.value = {
                  year: parsedInfo.lunarDate.year || 1990,
                  month: parsedInfo.lunarDate.month || 1,
                  day: parsedInfo.lunarDate.day || 1,
                  hour: parsedInfo.lunarDate.hour || personInfo.value.hour
                };
              } else if (isLunarDate.value) {
                // 如果没有保存农历日期但选择了农历模式，则进行转换
                try {
                  const solar = Solar.fromYmd(personInfo.value.year, personInfo.value.month, personInfo.value.day);
                  const lunar = solar.getLunar();
                  
                  lunarDate.value = {
                    year: lunar.getYear(),
                    month: lunar.getMonth(),
                    day: lunar.getDay(),
                    hour: personInfo.value.hour
                  };
                } catch (e) {
                  console.error('恢复会话时公历转农历失败:', e);
                }
              }
              
              // 如果没有单独恢复的农历数据，但personInfo中有，作为备用方案
              if (!savedLunarBirthData && parsedInfo.lunarBirthData) {
                lunarBirthData.value = parsedInfo.lunarBirthData;
                console.log('从personInfo恢复农历出生数据:', lunarBirthData.value);
                
                // 同时保存到单独的存储中，以便下次直接使用
                sessionStorage.setItem('divination_lunar_birth_data', JSON.stringify(lunarBirthData.value));
              }
              
              // 如果仍然没有农历数据，重新计算
              if (!lunarBirthData.value.year || !lunarBirthData.value.month || !lunarBirthData.value.day) {
                console.log('未找到保存的农历数据，重新计算...');
                if (isLunarDate.value) {
                  // 如果是农历模式，直接使用农历日期
                  lunarBirthData.value = {
                    year: lunarDate.value.year.toString(),
                    month: lunarDate.value.month < 10 ? `0${lunarDate.value.month}` : lunarDate.value.month.toString(),
                    day: lunarDate.value.day < 10 ? `0${lunarDate.value.day}` : lunarDate.value.day.toString(),
                    time: personInfo.value.hour < 10 ? `0${personInfo.value.hour}` : personInfo.value.hour.toString(),
                    sex: personInfo.value.gender
                  };
                } else {
                  // 如果是公历模式，尝试转换为农历
                  try {
                    const solar = Solar.fromYmd(personInfo.value.year, personInfo.value.month, personInfo.value.day);
                    const lunar = solar.getLunar();
                    
                    lunarBirthData.value = {
                      year: lunar.getYear().toString(),
                      month: lunar.getMonth() < 10 ? `0${lunar.getMonth()}` : lunar.getMonth().toString(),
                      day: lunar.getDay() < 10 ? `0${lunar.getDay()}` : lunar.getDay().toString(),
                      time: personInfo.value.hour < 10 ? `0${personInfo.value.hour}` : personInfo.value.hour.toString(),
                      sex: personInfo.value.gender
                    };
                  } catch (e) {
                    console.error('恢复时公历转农历失败:', e);
                    // 如果转换失败，使用公历日期
                    lunarBirthData.value = {
                      year: personInfo.value.year.toString(),
                      month: personInfo.value.month < 10 ? `0${personInfo.value.month}` : personInfo.value.month.toString(),
                      day: personInfo.value.day < 10 ? `0${personInfo.value.day}` : personInfo.value.day.toString(),
                      time: personInfo.value.hour < 10 ? `0${personInfo.value.hour}` : personInfo.value.hour.toString(),
                      sex: personInfo.value.gender
                    };
                  }
                }
                console.log('重新计算的农历数据:', lunarBirthData.value);
                
                // 保存重新计算的农历数据
                sessionStorage.setItem('divination_lunar_birth_data', JSON.stringify(lunarBirthData.value));
              }
              
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
                  
                  // 恢复农历数据
                  if (sessionData.lunarBirthData) {
                    lunarBirthData.value = sessionData.lunarBirthData;
                    console.log('已从中间层恢复农历出生数据:', lunarBirthData.value);
                    
                    // 同时保存到sessionStorage，确保数据同步
                    sessionStorage.setItem('divination_lunar_birth_data', JSON.stringify(lunarBirthData.value));
                  }
                  
                  // 检查中间层是否有明确的完成状态标记
                  if (sessionData.hasCompletedFirstRound === true) {
              inputEnabled.value = true;
                    // 同步到sessionStorage
                    sessionStorage.setItem('divination_has_completed', 'true');
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
        sessionStorage.removeItem('divination_conversation_id');
        sessionStorage.removeItem('divination_person_info');
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
    
    // 在会话恢复完成后，添加额外的状态检查
    setTimeout(() => {
      console.log('命理会话恢复完成后状态检查：', {
        inputEnabled: inputEnabled.value,
        isGenerating: chatStore.isGenerating,
        isStreaming: chatStore.isStreaming,
        isLoading: chatStore.isLoading,
        messageCount: messages.value.length
      });
      
      // 确保状态一致性
      chatStore.isLoading = false;
      chatStore.isStreaming = false;
      chatStore.isGenerating = false;
      chatStore.currentTask = null;
      
      // 再次确认输入框是否启用
      if (sessionStorage.getItem('divination_has_completed') === 'true') {
        console.log('检测到用户已完成第一轮对话，再次确认输入框已启用');
        inputEnabled.value = true;
      }
    }, 1000);
    
    // 添加定期检查状态的定时器，确保状态不会卡住
    const statusCheckInterval = setInterval(() => {
      // 检查是否有流式消息但已经超过15秒
      const streamingMessages = messages.value.filter(msg => msg.isStreaming);
      if (streamingMessages.length > 0) {
        // 如果有流式消息但isStreaming状态为false，修复不一致性
        if (!chatStore.isStreaming) {
          console.warn('检测到状态不一致：有流式消息但isStreaming为false，修复状态');
          chatStore.isStreaming = true;
        }
        
        // 检查最老的流式消息的时间
        const oldestStreamingMsg = streamingMessages.reduce((oldest, current) => {
          return (!oldest.created_at || current.created_at < oldest.created_at) ? current : oldest;
        }, {});
        
        // 如果最老的流式消息已超过15秒，认为是卡住了
        const now = Date.now() / 1000;
        if (oldestStreamingMsg.created_at && (now - oldestStreamingMsg.created_at > 15)) {
          console.warn('检测到流式消息卡住超过15秒，自动标记为完成');
          
          // 修复所有流式消息
          messages.value.forEach(msg => {
            if (msg.isStreaming) {
              msg.isStreaming = false;
              msg.content += '\n\n[系统自动修复：此消息已标记为完成]';
            }
          });
          
          // 重置所有状态
          chatStore.isLoading = false;
          chatStore.isStreaming = false;
          chatStore.isGenerating = false;
          chatStore.currentTask = null;
        }
      } else if (chatStore.isStreaming || chatStore.isGenerating) {
        // 如果没有流式消息但状态还在，认为是状态卡住了
        console.warn('检测到状态卡住：没有流式消息但状态为streaming/generating，重置状态');
        chatStore.isLoading = false;
        chatStore.isStreaming = false;
        chatStore.isGenerating = false;
        chatStore.currentTask = null;
      }
    }, 5000); // 每5秒检查一次
    
    // 在组件卸载时清理
    onBeforeUnmount(() => {
      clearInterval(statusCheckInterval);
    });
    
    // 添加全局错误处理
    window.addEventListener('error', (event) => {
      console.error('捕获到全局错误:', event.error);
      
      // 确保状态重置
      if (chatStore.isStreaming || chatStore.isGenerating || chatStore.isLoading) {
        console.warn('错误发生时重置所有状态');
        chatStore.isLoading = false;
        chatStore.isStreaming = false;
        chatStore.isGenerating = false;
        chatStore.currentTask = null;
      }
    });
    
    // 添加诊断功能 - 点击三次Logo触发
    let logoClickCount = 0;
    let logoClickTimer = null;
    
    const handleLogoClick = () => {
      logoClickCount++;
      
      clearTimeout(logoClickTimer);
      logoClickTimer = setTimeout(() => {
        logoClickCount = 0;
      }, 2000);
      
      if (logoClickCount >= 3) {
        logoClickCount = 0;
        
        // 显示诊断信息
        const diagInfo = {
          currentConversationId: chatStore.currentConversationId,
          inputEnabled: inputEnabled.value,
          isStreaming: chatStore.isStreaming,
          isGenerating: chatStore.isGenerating,
          isLoading: chatStore.isLoading,
          messagesCount: chatStore.messages.length,
          lunarDataValid: !!(lunarBirthData.value && lunarBirthData.value.year),
          hostname: window.location.hostname,
          sessionStorageKeys: Object.keys(sessionStorage),
          browserInfo: navigator.userAgent
        };
        
        console.log('=== 诊断信息 ===', diagInfo);
        alert('诊断信息已打印到控制台');
        
        // 提供重置功能
        if (confirm('是否重置当前会话状态？（这将清除当前对话）')) {
          cleanupSession();
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      }
    };
    
    // 为页面Logo添加点击事件
    const logoElement = document.querySelector('.logo') || document.querySelector('h1');
    if (logoElement) {
      logoElement.style.cursor = 'pointer';
      logoElement.addEventListener('click', handleLogoClick);
    }
    
    // 测试按钮点击监听
    const sendButton = document.querySelector('button i.fa-paper-plane');
    if (sendButton && sendButton.parentNode) {
      console.log('为发送按钮添加直接点击监听');
      sendButton.parentNode.addEventListener('click', () => {
        console.log('发送按钮被直接点击 (事件监听)');
        if (userInput.value.trim() && inputEnabled.value && !chatStore.isStreaming) {
          console.log('条件满足，手动调用sendUserMessage');
          sendUserMessage(userInput.value);
        } else {
          console.log('点击条件不满足:', {
            hasInput: !!userInput.value.trim(),
            inputEnabled: inputEnabled.value, 
            notStreaming: !chatStore.isStreaming
          });
        }
      });
    }
    
    // 使用timeout确保页面已渲染
    setTimeout(() => {
      const sendButton = document.getElementById('destinyMessageSendButton');
      if (sendButton) {
        sendButton.onclick = () => {
          console.log('通过直接onclick处理发送按钮点击');
          if (userInput.value.trim() && inputEnabled.value) {
            sendUserMessage(userInput.value);
          }
        };
      }
    }, 1000);
    
    // 设置日期选择器默认日期
    initDefaultDate();
    
    // 设置应用类型
    await chatStore.setAppType(chatAPI.APP_TYPES.DESTINY);
    
    // 获取本地或永久存储中的阳历出生数据
    getStoredBirthInfo();
    
    // 确保Service Worker就绪
    swManager.initServiceWorker().then(() => {
      isServiceWorkerReady.value = true;
      console.log('Service Worker准备就绪');
    });
    
    // 恢复上次会话
    if (shouldRestoreSession.value) {
      setTimeout(async () => {
        await tryRestoreLastSession();
      }, 500);
    }
    
    // 组件准备就绪
    isComponentReady.value = true;
    
    // 添加页面可见性监听
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 安全起见，定期检查输入状态和发送按钮状态
    statusCheckInterval.value = setInterval(() => {
      if (chatStore.isLoading && Date.now() - lastMessageTime.value > 15000) {
        console.log('检测到可能的加载状态卡住，重置状态');
        chatStore.isLoading = false;
        chatStore.isStreaming = false;
        chatStore.isGenerating = false;
      }
    }, 5000);
    
    // 添加直接的DOM事件监听，确保按钮点击事件能被捕获
    setTimeout(() => {
      const sendButton = document.getElementById('sendButton');
      if (sendButton) {
        console.log('为发送按钮添加直接DOM监听');
        sendButton.addEventListener('click', (event) => {
          console.log('按钮DOM事件被触发');
          // 防止事件冒泡和默认行为
          event.stopPropagation();
          event.preventDefault();
          
          // 检查按钮是否应该被禁用
          if (!sendButton.disabled && userInput.value.trim()) {
            console.log('按钮有效，直接调用发送函数');
            doSendMessage();
          } else {
            console.log('按钮无效或输入为空，不发送消息');
          }
        });
        console.log('发送按钮DOM监听已添加');
      } else {
        console.warn('无法找到发送按钮元素');
      }
    }, 1000); // 给DOM一些时间来渲染
    
    // 添加简单的状态检测机制，每10秒检查一次界面状态
    statusCheckInterval.value = setInterval(() => {
      // 检测是否可能存在卡住的状态
      const now = Date.now();
      const timeSinceLastMessage = now - lastMessageTime.value;
      
      // 如果加载状态持续超过20秒而没有更新，强制重置
      if (chatStore.isLoading && timeSinceLastMessage > 20000) {
        console.log('检测到可能的状态卡住，自动重置:', {
          timeSinceLastMessage: Math.floor(timeSinceLastMessage / 1000) + '秒',
          isLoading: chatStore.isLoading,
          isStreaming: chatStore.isStreaming
        });
        
        // 重置状态
        chatStore.isLoading = false;
        chatStore.isStreaming = false;
        chatStore.isGenerating = false;
        
        // 重置发送状态
        isSendingMessage = false;
      }
    }, 10000);
    
    // 组件准备就绪标记
    isComponentReady.value = true;
  } catch (error) {
    console.error('命理页面初始化失败:', error);
    inputEnabled.value = false; // 出错时禁用输入框
    
    // 错误恢复措施，清理所有会话状态
    await cleanupSession();
    
    isComponentReady.value = true; // 即使失败也设置为就绪，允许用户操作
  }
});

// 在onBeforeUnmount钩子中清理事件监听
onBeforeUnmount(() => {
  // 现有代码...
  
  // 清理页面可见性监听
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  
  // 清理状态检查定时器
  if (statusCheckInterval.value) {
    clearInterval(statusCheckInterval.value);
  }
  
  // 重置全局弹窗状态
  if (window.streamingState && typeof window.streamingState.setModalShowing === 'function' && showResultModal.value) {
    window.streamingState.setModalShowing(false);
  }
  
  // 如果用户离开命理页面，标记完成会话
  if (chatStore.currentConversationId) {
    swManager.completeSession(chatStore.currentConversationId).then(() => {
      console.log('命理会话已标记为完成');
    });
  }
  
  console.log('命理组件已卸载，资源已清理');
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
  // 当结果弹窗显示或隐藏时，更新全局状态
  if (window.streamingState && typeof window.streamingState.setModalShowing === 'function') {
    window.streamingState.setModalShowing(newValue);
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
    
    // 确保有有效的农历数据
    if (!lunarBirthData.value.year || !lunarBirthData.value.month || !lunarBirthData.value.day) {
      console.warn('同步中间层前发现农历数据不完整，尝试重新计算');
      
      // 根据当前模式重新计算
      if (isLunarDate.value) {
        // 使用农历日期
        lunarBirthData.value = {
          year: lunarDate.value.year.toString(),
          month: lunarDate.value.month < 10 ? `0${lunarDate.value.month}` : lunarDate.value.month.toString(),
          day: lunarDate.value.day < 10 ? `0${lunarDate.value.day}` : lunarDate.value.day.toString(),
          time: personInfo.value.hour < 10 ? `0${personInfo.value.hour}` : personInfo.value.hour.toString(),
          sex: personInfo.value.gender
        };
      } else {
        try {
          // 尝试公历转农历
          const solar = Solar.fromYmd(personInfo.value.year, personInfo.value.month, personInfo.value.day);
          const lunar = solar.getLunar();
          
          lunarBirthData.value = {
            year: lunar.getYear().toString(),
            month: lunar.getMonth() < 10 ? `0${lunar.getMonth()}` : lunar.getMonth().toString(),
            day: lunar.getDay() < 10 ? `0${lunar.getDay()}` : lunar.getDay().toString(),
            time: personInfo.value.hour < 10 ? `0${personInfo.value.hour}` : personInfo.value.hour.toString(),
            sex: personInfo.value.gender
          };
        } catch (e) {
          console.error('同步中间层时计算农历数据失败:', e);
          
          // 使用公历数据
          lunarBirthData.value = {
            year: personInfo.value.year.toString(),
            month: personInfo.value.month < 10 ? `0${personInfo.value.month}` : personInfo.value.month.toString(),
            day: personInfo.value.day < 10 ? `0${personInfo.value.day}` : personInfo.value.day.toString(),
            time: personInfo.value.hour < 10 ? `0${personInfo.value.hour}` : personInfo.value.hour.toString(),
            sex: personInfo.value.gender
          };
        }
      }
      
      // 保存重新计算的农历数据
      sessionStorage.setItem('divination_lunar_birth_data', JSON.stringify(lunarBirthData.value));
    }
    
    // 注册会话
    await swManager.registerSession(chatStore.currentConversationId, {
      type: 'destiny-assistant',
      userId: chatStore.userId,
      messages: chatStore.sortedMessages,
      personInfo: {
        ...personInfo.value,
        lunarDate: lunarDate.value,
        isLunar: isLunarDate.value
      },
      lunarBirthData: lunarBirthData.value, // 单独保存农历数据
      inputEnabled: inputEnabled.value,
      hasCompletedFirstRound: inputEnabled.value,
      created_at: Date.now()
    });
    
    // 设置监听器
    await swManager.addSessionListener(chatStore.currentConversationId, handleSessionUpdate);
    
    // 标记为已同步
    syncedWithMiddleLayer.value = true;
    console.log('命理会话已同步到中间层:', chatStore.currentConversationId);
    
    return true;
  } catch (error) {
    console.error('同步到中间层失败:', error);
    return false;
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
    sessionStorage.removeItem('divination_conversation_id');
    sessionStorage.removeItem('divination_person_info');
    sessionStorage.removeItem('divination_has_completed'); // 清理完成状态标记
    
    // 清空消息列表
    chatStore.messages = [];
    
    // 重置状态变量
    chatStore.isLoading = false;
    chatStore.isStreaming = false;
    chatStore.isGenerating = false;
    chatStore.currentTask = null;
    
    // 重置输入框状态
    inputEnabled.value = false;
    
    // 清理农历出生数据
    sessionStorage.removeItem('divination_lunar_birth_data');
    
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
        const storedId = sessionStorage.getItem('divination_conversation_id');
        
        if (storedId !== chatStore.currentConversationId) {
          sessionStorage.setItem('divination_conversation_id', chatStore.currentConversationId);
        }
        
        // 检查是否有处于流式状态的消息
        const hasStreamingMessage = chatStore.messages.some(msg => msg.isStreaming);
        
        if (hasStreamingMessage) {
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
      sessionStorage.setItem('divination_conversation_id', chatStore.currentConversationId);
      
      // 同时保存个人信息
      sessionStorage.setItem('divination_person_info', JSON.stringify(personInfo.value));
    }
  }
};

// 添加一个存储转换后的农历日期数据的变量
const lunarBirthData = ref({
  year: '',
  month: '',
  day: '',
  time: '',
  sex: ''
});

// 覆盖默认的发消息方法，确保每次都发送出生信息
const sendUserMessage = async (message) => {
  console.log('发送按钮被点击，内容:', message);
  
  // 先保存消息内容，防止后续变量丢失
  const messageContent = message && message.trim ? message.trim() : '';
  
  if (!messageContent) {
    console.log('消息内容为空，不发送');
    return;
  }
  
  if (!chatStore.currentConversationId) {
    console.warn('没有有效的命理会话ID，无法发送消息');
    alert('会话已失效，请刷新页面重试');
    return;
  }
  
  // 备份消息内容，确保后续处理中不会丢失
  const secureMessageContent = messageContent;  
  console.log('准备发送消息，内容:', secureMessageContent.substring(0, 30) + (secureMessageContent.length > 30 ? '...' : ''));
  
  try {
    // 后续对话不再检查和使用问题数据
    // 只需正常发送用户消息即可
    
    // 重置任何可能的卡住状态
    chatStore.isGenerating = false;
    chatStore.isStreaming = false;
    chatStore.isLoading = false;
    
    // 记录调试信息
    console.log('发送命理消息, 附带数据:', {
      conversation_id: chatStore.currentConversationId,
      content: secureMessageContent.substring(0, 30) + '...'
    });
    
    // 清空输入框提前完成，提供即时反馈
    userInput.value = '';
    
    // 更新最后消息时间
    lastMessageTime.value = Date.now();
    
    // 记录当前消息数量，用于后续检查
    const initialMessageCount = chatStore.messages.length;
    
    // 使用chatStore发送消息 - 这里不再附带lunarBirthData
    console.log('调用chatStore.sendMessage发送消息，消息长度:', secureMessageContent.length);
    await chatStore.sendMessage(secureMessageContent);
    
    const finalMessageCount = chatStore.messages.length;
    console.log('命理消息发送处理完成，消息数量变化:', {
      before: initialMessageCount,
      after: finalMessageCount,
      diff: finalMessageCount - initialMessageCount
    });
    
    // 检查是否有新消息添加
    if (finalMessageCount <= initialMessageCount) {
      console.warn('消息可能未正确处理，未检测到新助手消息');
    }
    
    // 检查最后一条消息是否为助手消息
    const lastMessage = chatStore.messages[chatStore.messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      console.log('收到助手回复，内容长度:', lastMessage.content.length);
    }
    
    // 滚动到底部
    setTimeout(() => {
      scrollToBottom(true);
    }, 100);
  } catch (error) {
    console.error('发送命理消息失败:', error);
    alert('发送消息失败，请稍后再试');
    
    // 确保状态重置
    chatStore.isLoading = false;
    chatStore.isStreaming = false;
    chatStore.isGenerating = false;
  }
};

// 添加简单的防抖动变量
let isSendingMessage = false;

// 添加一个简单明了的发送函数
const doSendMessage = () => {
  console.log('doSendMessage被调用，准备发送消息');
  
  // 防止重复点击或在加载状态下点击
  if (isSendingMessage || chatStore.isLoading || chatStore.isStreaming || chatStore.isGenerating) {
    console.log('消息正在发送中，忽略重复点击', {
      isSending: isSendingMessage,
      isLoading: chatStore.isLoading
    });
    return;
  }
  
  // 检查输入是否有效
  const trimmedInput = userInput.value.trim();
  if (trimmedInput) {
    // 设置发送状态
    isSendingMessage = true;
    
    // 使用当前输入内容调用发送函数
    sendUserMessage(trimmedInput)
      .finally(() => {
        // 3秒后重置状态，防止连续快速点击
        setTimeout(() => {
          isSendingMessage = false;
        }, 3000);
      });
  } else {
    console.log('输入内容为空，不执行发送');
  }
};

// 设置默认日期的函数
const initDefaultDate = () => {
  // 由于我们已经简化了界面，这个函数可以保留为空
  console.log('日期初始化 (已简化)');
};

// 获取存储的信息
const getStoredBirthInfo = () => {
  // 由于我们已经简化了界面，这个函数可以保留为空
  console.log('获取存储信息 (已简化)');
};

// 添加缺失的变量
const isServiceWorkerReady = ref(false);
const shouldRestoreSession = ref(false);

// 添加缺失的函数
const tryRestoreLastSession = async () => {
  console.log('尝试恢复上次会话 (已简化)');
};

// 铜钱摇卦相关状态
const showCoinModal = ref(false);
const isShaking = ref(false);
const currentYaoCount = ref(0);
const currentYaoResult = ref('');
const coins = ref([
  { value: false, isAnimating: false }, // false代表反面，true代表正面
  { value: false, isAnimating: false },
  { value: false, isAnimating: false }
]);
const yaoResults = ref([null, null, null, null, null, null]); // 六个爻的结果
const yaoDisplayText = {
  'old_yang': '老阳',
  'old_yin': '老阴',
  'young_yang': '少阳',
  'young_yin': '少阴'
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

/* 修复移动端弹窗样式 */
@media (max-width: 767px) {
  /* 提高弹窗和输入框的可点击区域和可见性 */
  input, select, button {
    font-size: 16px !important; /* 避免iOS缩放 */
    -webkit-appearance: none;
    appearance: none;
    border-radius: 4px;
  }
  
  select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='6' viewBox='0 0 8 6'%3E%3Cpath fill='%23FFF' d='M0 0h8L4 6z'/%3E%3C/svg%3E");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    padding-right: 1.5rem;
  }
  
  /* 增大点击区域 */
  button {
    min-height: 44px;
  }
  
  /* 确保内容在视口内可滚动 */
  .custom-scrollbar {
    -webkit-overflow-scrolling: touch;
  }
}

/* 铜钱动画 */
@keyframes flip {
  0% {
    transform: rotateY(0) rotateX(0);
  }
  100% {
    transform: rotateY(1080deg) rotateX(1080deg);
  }
}

.animate-flip {
  animation: flip 1s ease-in-out;
}
</style>