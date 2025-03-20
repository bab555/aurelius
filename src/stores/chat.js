// src/stores/chat.js
import { defineStore } from 'pinia';
import { ref, computed, watch, onUnmounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import * as chatAPI from '../services/chatAPI';
import * as swManager from '../services/swManager';

// 检查是否支持Service Worker
const isSWSupported = 'serviceWorker' in navigator;

export const useChatStore = defineStore('chat', () => {
  // 添加当前应用类型，默认为文旅助手
  const currentAppType = ref(chatAPI.APP_TYPES.TRAVEL);
  
  // 状态
  const messages = ref([]);
  const isLoading = ref(false);
  const isGenerating = ref(false);
  const isStreaming = ref(false);
  const currentConversationId = ref('');
  const conversations = ref([]);
  const error = ref(null);
  const currentTask = ref(null);
  
  // 调试用 - 存储最近一次API的原始响应
  const lastRawResponse = ref('');
  const rawResponse = ref('');
  
  // 用户ID (在实际应用中应该从用户会话中获取)
  const userId = ref(sessionStorage.getItem('chat_user_id') || uuidv4());
  
  // 中间层同步状态
  const isUsingMiddleLayer = ref(false);
  const sessionSynced = ref(false);
  
  // 保存用户ID到会话存储
  if (!sessionStorage.getItem('chat_user_id')) {
    sessionStorage.setItem('chat_user_id', userId.value);
  }
  
  // 计算属性
  const sortedMessages = computed(() => {
    console.log('[详细日志] sortedMessages计算属性执行，原始消息数量:', messages.value.length, '主机名:', window.location.hostname);
    const sorted = [...messages.value].sort((a, b) => a.created_at - b.created_at);
    console.log('[详细日志] sortedMessages计算完成，排序后消息数量:', sorted.length);
    return sorted;
  });
  
  // 添加调试日志功能
  const enableDebugMode = ref(true);
  const debugLogs = ref([]);
  
  // 记录调试日志
  const logDebug = (message, data = null) => {
    if (enableDebugMode.value) {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        message,
        data: data ? JSON.stringify(data) : null
      };
      
      console.log(`[${timestamp}] ${message}`, data);
      debugLogs.value.push(logEntry);
      
      // 保持日志不超过100条
      if (debugLogs.value.length > 100) {
        debugLogs.value.shift();
      }
    }
  };
  
  // 清除日志
  const clearDebugLogs = () => {
    debugLogs.value = [];
  };
  
  // 切换调试模式
  const toggleDebugMode = () => {
    enableDebugMode.value = !enableDebugMode.value;
    logDebug(`调试模式${enableDebugMode.value ? '开启' : '关闭'}`);
  };
  
  // 设置应用类型，切换不同API应用
  const setAppType = (appType) => {
    if (Object.values(chatAPI.APP_TYPES).includes(appType)) {
      currentAppType.value = appType;
      logDebug(`应用类型已切换为: ${appType}`);
    } else {
      console.error(`无效的应用类型: ${appType}`);
    }
  };
  
  // API连接状态监控
  const connectionStatus = ref('unknown'); // unknown, connected, disconnected
  
  // 检查API连接状态
  const checkConnection = async () => {
    try {
      const infoUrl = `${import.meta.env.VITE_API_BASE_URL}/info`;
      logDebug('正在检查API连接状态...', { url: infoUrl });
      
      // 使用URL构造器检查API地址是否有效
      new URL(import.meta.env.VITE_API_BASE_URL);
      
      // 测试连接 - 使用当前应用类型的凭据
      const { apiKey } = chatAPI.getCredentials(currentAppType.value);
      
      const testResponse = await fetch(infoUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (testResponse.ok) {
        connectionStatus.value = 'connected';
        logDebug('API连接成功', await testResponse.json());
      } else {
        connectionStatus.value = 'disconnected';
        logDebug('API连接失败', {
          status: testResponse.status,
          statusText: testResponse.statusText
        });
      }
    } catch (error) {
      connectionStatus.value = 'disconnected';
      logDebug('API连接错误', { error: error.message });
    }
    
    return connectionStatus.value === 'connected';
  };
  
  // 监控isLoading状态变更（调试用）
  watch(isLoading, (newValue) => {
    console.log(`[DEBUG] isLoading状态变更为: ${newValue ? 'true' : 'false'}`);
    logDebug(`isLoading状态变更为: ${newValue ? '加载中' : '加载完成'}`);
  });
  
  // 流处理相关
  // 从时间戳创建一个简单的防超时机制，确保按钮不会无限期禁用
  let lastMessageUpdateTime = ref(0);
  
  // 每5秒检查一次是否需要强制重置按钮状态
  const setupButtonResetSafeguard = () => {
    setInterval(() => {
      const now = Date.now();
      
      // 根据应用类型设置不同的超时时间
      let timeoutLimit = 10000; // 默认10秒
      
      // 为搜索助手设置更长的超时时间，因为可能需要调用外部工具
      if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
        timeoutLimit = 30000; // 搜索助手使用30秒超时
        logDebug('搜索助手使用更长的超时限制:', { timeout: timeoutLimit });
      }
      
      // 只有当超过设定时间没有收到更新且没有正在流式处理的消息时才重置
      if (isLoading.value && lastMessageUpdateTime.value > 0 && (now - lastMessageUpdateTime.value > timeoutLimit)) {
        // 查找是否有正在流式处理的消息
        const streamingMsg = messages.value.find(m => m.isStreaming);
        
        // 只有当没有正在流式处理的消息时，才重置状态
        if (!streamingMsg) {
          logDebug('检测到长时间无更新且无流式消息，重置按钮状态', { 
            lastUpdate: new Date(lastMessageUpdateTime.value),
            timeout: timeoutLimit,
            appType: currentAppType.value
          });
          isLoading.value = false;
          lastMessageUpdateTime.value = 0;
        } else {
          // 如果有流式消息，更新时间戳以避免重复检查
          lastMessageUpdateTime.value = now;
        }
      }
    }, 5000);
  };
  
  // 方法
  // 发送消息
  const sendMessage = async (content, fileInfo = null, inputs = {}) => {
    if (isLoading.value) return;
    
    // 处理文件信息
    let files = [];
    if (fileInfo) {
      logDebug('准备发送带文件的消息', { 
        content, 
        fileId: fileInfo.fileId,
        fileName: fileInfo.fileName 
      });
      
      // 构建文件对象
      files.push({
        id: fileInfo.fileId,
        name: fileInfo.fileName,
        isUrl: false
      });
    } else {
      logDebug('准备发送消息', { content, hasFiles: false });
    }
    
    const userMessage = {
      id: uuidv4(),
      conversation_id: currentConversationId.value,
      role: 'user',
      content,
      created_at: Date.now() / 1000,
      files: files || []
    };
    
    // 添加用户消息到列表
    messages.value.push(userMessage);
    
    // 如果使用中间层，同步消息状态
    if (isUsingMiddleLayer.value && currentConversationId.value) {
      try {
        swManager.updateSession(currentConversationId.value, {
          messages: sortedMessages.value,
          last_updated: Date.now()
        });
      } catch (error) {
        logDebug('同步用户消息到中间层失败', { error: error.message });
      }
    }
    
    // 创建一个临时AI消息占位
    const tempId = 'temp-' + uuidv4();
    
    const assistantMessage = {
      id: tempId,
      conversation_id: currentConversationId.value,
      role: 'assistant',
      content: '',
      created_at: Date.now() / 1000,
      isStreaming: true
    };
    
    messages.value.push(assistantMessage);
    
    // 设置加载状态
    isLoading.value = true;
    error.value = null;
    
    try {
      // 准备文件格式
      const apiFiles = files.map(file => ({
        type: 'document', // 默认为文档类型
        transfer_method: file.isUrl ? 'remote_url' : 'local_file',
        ...(file.isUrl ? { url: file.url } : { upload_file_id: file.id })
      }));
      
      // 发送消息到API - 使用当前应用类型
      let response;
      try {
        response = await chatAPI.sendChatMessage(
          content,
          userId.value,
          currentConversationId.value,
          apiFiles.length > 0 ? apiFiles : [],
          inputs,
          currentAppType.value
        );
      } catch (error) {
        // 检查是否是会话不存在的错误
        if (error.message && error.message.includes('Conversation Not Exists')) {
          logDebug('会话不存在，使用空会话ID重试', { oldId: currentConversationId.value });
          
          // 清除当前会话ID
          if (currentAppType.value === chatAPI.APP_TYPES.TRAVEL) {
            sessionStorage.removeItem('travel_conversation_id');
          } else if (currentAppType.value === chatAPI.APP_TYPES.DESTINY) {
            sessionStorage.removeItem('destiny_conversation_id');
          } else if (currentAppType.value === chatAPI.APP_TYPES.INTELLIGENT) {
            sessionStorage.removeItem('intelligent_conversation_id');
          } else if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
            sessionStorage.removeItem('search_conversation_id');
          }
          
          // 设置为空会话ID
          currentConversationId.value = '';
          messages.value = []; // 清除消息列表
          
          logDebug('已清除会话ID，下次请求将创建新会话');
          
          // 更新消息中的会话ID
          userMessage.conversation_id = '';
          assistantMessage.conversation_id = '';
          
          // 使用空会话ID重试发送消息，让服务器创建新会话
          logDebug('使用空会话ID重试发送消息');
          response = await chatAPI.sendChatMessage(
            content,
            userId.value,
            '', // 空会话ID
            apiFiles.length > 0 ? apiFiles : [],
            inputs,
            currentAppType.value
          );
        } else {
          // 其他错误，抛出
          throw error;
        }
      }
      
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status} ${response.statusText}`);
      }
      
      // 处理流式响应
      await handleMessageStream(response);
      
      // 确保中间层更新最新状态
      if (isUsingMiddleLayer.value && currentConversationId.value) {
        try {
          swManager.updateSession(currentConversationId.value, {
            messages: sortedMessages.value,
            last_updated: Date.now()
          });
        } catch (error) {
          logDebug('同步完成的消息到中间层失败', { error: error.message });
        }
      }
      
      return true;
    } catch (error) {
      // 检查是否是网络错误类型
      const isNetworkError = error instanceof TypeError && 
        (error.message.includes('network') || 
         error.message.includes('chunked encoding') || 
         error.message.includes('aborted'));
      
      // 仅在非网络错误的情况下，或者没有助手消息时移除临时消息
      if (!isNetworkError) {
        const msgIndex = messages.value.findIndex(m => m.id === tempId);
        if (msgIndex !== -1) {
          messages.value.splice(msgIndex, 1);
        }
        
        // 处理错误
        logDebug('发送消息失败', { error: error.message });
        
        // 添加错误消息
        messages.value.push({
          id: uuidv4(),
          conversation_id: currentConversationId.value,
          role: 'system',
          content: `发送消息失败: ${error.message}`,
          created_at: Date.now() / 1000,
          isError: true
        });
      } else {
        // 对于网络错误，检查是否有助手消息，并确保其不处于流状态
        const lastMessage = messages.value[messages.value.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
          lastMessage.isStreaming = false;
          logDebug('网络错误，结束消息流状态', { error: error.message });
        }
      }
      
      isLoading.value = false;
      
      return false;
    }
  };
  
  // 处理流式错误
  const handleStreamError = (errorData, tempId) => {
    error.value = errorData.message || '处理响应时出错';
    
    // 移除正在加载的消息
    const msgIndex = messages.value.findIndex(m => m.id === tempId);
    if (msgIndex !== -1) {
      messages.value.splice(msgIndex, 1);
    }
    
    // 结束加载状态
    isLoading.value = false;
    currentTask.value = null;
    
    // 添加一条系统消息显示错误
    messages.value.push({
      id: uuidv4(),
      conversation_id: currentConversationId.value,
      role: 'assistant',
      content: `⚠️ 系统错误：${error.value}`,
      created_at: Date.now() / 1000,
      isError: true
    });
  }
  
  // 处理API错误
  const handleApiError = (error, tempId = null) => {
    console.error('API调用失败:', error);
    
    // 设置错误信息
    error.value = error.message || '请求失败，请稍后再试';
    
    // 只有当提供了tempId时才尝试移除消息
    if (tempId) {
      // 移除正在加载的消息
      const msgIndex = messages.value.findIndex(m => m.id === tempId);
      if (msgIndex !== -1) {
        messages.value.splice(msgIndex, 1);
      }
    }
    
    isLoading.value = false;
    
    // 添加一条系统消息显示错误
    messages.value.push({
      id: uuidv4(),
      conversation_id: currentConversationId.value,
      role: 'assistant',
      content: `⚠️ 系统错误：${error.value}`,
      created_at: Date.now() / 1000,
      isError: true
    });
  };
  
  // 获取会话消息
  const fetchMessages = async (conversationId = null) => {
    // 增加ID有效性检查
    const targetId = conversationId || currentConversationId.value;
    if (!targetId) {
      console.warn('[Chat] 无法获取消息：未指定有效的会话ID');
      return false;
    }
    
    try {
      console.log('[详细日志] 开始获取消息，会话ID:', targetId, '应用类型:', currentAppType.value, '主机名:', window.location.hostname);
      isLoading.value = true;
      
      // 获取会话消息 - 使用当前应用类型
      const response = await chatAPI.getConversationMessages(
        userId.value,
        targetId,
        null,
        100,
        currentAppType.value
      );
      
      // 处理响应
      if (response && response.data) {
        console.log('[详细日志] 获取消息成功，消息数量:', response.data.length, '首条消息结构:', 
          JSON.stringify(response.data[0] ? {
            id: response.data[0].id,
            query: response.data[0].query?.substring(0, 30),
            answer: response.data[0].answer?.substring(0, 30),
            role: response.data[0].role,
            content: response.data[0].content?.substring(0, 30)
          } : 'no messages'));
        
        // 如果获取的是当前会话的消息，则更新消息列表
        if (targetId === currentConversationId.value) {
          // 转换消息格式并更新本地消息列表
          const formattedMessages = [];
          
          response.data.forEach(msg => {
            // 检查是否新格式（包含query和answer字段）或旧格式（包含role和content字段）
            const isNewFormat = msg.query !== undefined || msg.answer !== undefined;
            
            console.log('[详细日志] 消息格式类型:', isNewFormat ? '新格式(query/answer)' : '旧格式(role/content)');
            
            if (isNewFormat) {
              // 处理新格式 - 每个消息对象拆分为用户和AI两条消息
              if (msg.query) {
                formattedMessages.push({
                  id: msg.id + '-user',
                  conversation_id: msg.conversation_id,
                  role: 'user',
                  content: msg.query || '',
                  created_at: msg.created_at ? new Date(msg.created_at).getTime() / 1000 - 1 : Date.now() / 1000 - 1, // 用户消息稍早
                  isComplete: true,
                  isStreaming: false
                });
              }
              
              if (msg.answer) {
                formattedMessages.push({
                  id: msg.id + '-assistant',
                  conversation_id: msg.conversation_id,
                  role: 'assistant',
                  content: msg.answer || '',
                  created_at: msg.created_at ? new Date(msg.created_at).getTime() / 1000 : Date.now() / 1000,
                  isComplete: true,
                  isStreaming: false
                });
              }
            } else {
              // 处理旧格式 - 直接映射字段
              formattedMessages.push({
                id: msg.id,
                conversation_id: msg.conversation_id,
                role: msg.role,
                content: msg.content || '',
                created_at: msg.created_at ? new Date(msg.created_at).getTime() / 1000 : Date.now() / 1000,
                isComplete: true,
                isStreaming: false
              });
            }
          });
          
          console.log('[详细日志] 格式化后消息数量:', formattedMessages.length, '更新前本地消息数量:', messages.value.length);
          console.log('[详细日志] 格式化后消息角色列表:', formattedMessages.map(m => m.role));
          
          // 更新消息列表
          messages.value = formattedMessages;
          
          // 记录更新后的状态
          console.log('[详细日志] 更新后本地消息数量:', messages.value.length, '第一条消息ID:', messages.value[0]?.id);
          
          // 重置所有状态变量，确保不会处于"对话中"状态
          isLoading.value = false;
          isStreaming.value = false;
          isGenerating.value = false;
          currentTask.value = null;
        } else {
          console.log('[详细日志] 获取的不是当前会话的消息，目标会话:', targetId, '当前会话:', currentConversationId.value);
        }
        
        return response;
      } else {
        console.warn('[详细日志] 获取消息响应异常:', response);
      }
    } catch (error) {
      console.error('[详细日志] 获取消息失败:', error, '会话ID:', targetId, '应用类型:', currentAppType.value);
      
      // 特殊处理会话不存在的错误
      if (error.message && error.message.includes('Conversation Not Exists')) {
        logDebug('服务器上不存在此会话，清除当前会话ID', { conversationId: targetId });
        
        // 清除当前会话ID
        if (targetId === currentConversationId.value) {
          // 清除存储中的无效ID
          if (currentAppType.value === chatAPI.APP_TYPES.TRAVEL) {
            sessionStorage.removeItem('travel_conversation_id');
          } else if (currentAppType.value === chatAPI.APP_TYPES.DESTINY) {
            sessionStorage.removeItem('destiny_conversation_id');
          } else if (currentAppType.value === chatAPI.APP_TYPES.INTELLIGENT) {
            sessionStorage.removeItem('intelligent_conversation_id');
          } else if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
            sessionStorage.removeItem('search_conversation_id');
          }
          
          // 设置为空会话ID
          currentConversationId.value = '';
          messages.value = []; // 清除消息列表
          
          logDebug('已清除会话ID，下次请求将创建新会话');
        }
      } else {
        logDebug('获取会话消息失败', { error: error.message });
      }
      throw error;
    } finally {
      isLoading.value = false;
    }
  };
  
  // 获取会话列表
  const fetchConversations = async () => {
    try {
      logDebug('正在获取会话列表...');
      
      // 使用当前应用类型
      const response = await chatAPI.getConversations(userId.value, null, 100, currentAppType.value);
      
      conversations.value = response.data || [];
      logDebug('获取会话列表成功', { count: conversations.value.length });
      
      return response;
    } catch (error) {
      logDebug('获取会话列表失败', { error: error.message });
      return { data: [] };
    }
  };
  
  // 创建新会话
  const createNewConversation = async () => {
    try {
      // 重置会话ID，将由后端创建
      currentConversationId.value = '';
      
      // 清空消息列表
      messages.value = [];
      
      // 重置已发送状态
      isStreaming.value = false;
      isGenerating.value = false;
      error.value = null;
      rawResponse.value = '';
      
      logDebug('准备新会话，等待后端创建会话ID');
      
      // 注册到中间层管理器(如果启用)
      if (isUsingMiddleLayer.value) {
        sessionSynced.value = false;
        setupSessionListener();
      }
      
      return true;
    } catch (error) {
      console.error('[Chat] 创建新会话失败:', error);
      return false;
    }
  };
  
  // 切换会话
  const switchConversation = async (conversationId) => {
    // 添加会话ID有效性检查
    if (!conversationId) {
      console.error('[Chat] 无法切换到无效会话ID:', conversationId);
      return;
    }
    
    if (conversationId === currentConversationId.value) return;
    
    logDebug('切换对话', { from: currentConversationId.value, to: conversationId });
    
    // 如果当前有会话，先尝试同步到中间层
    if (isUsingMiddleLayer.value && currentConversationId.value) {
      // 将当前会话标记为已完成
      swManager.completeSession(currentConversationId.value);
    }
    
    // 设置新的会话ID
    currentConversationId.value = conversationId;
    
    // 清除现有消息
    messages.value = [];
    
    // 重置所有状态变量
    isLoading.value = false;
    isStreaming.value = false;
    isGenerating.value = false;
    currentTask.value = null;
    lastMessageUpdateTime.value = 0;
    error.value = null;
    
    // 获取会话消息
    try {
      const messagesResponse = await fetchMessages(conversationId);
      
      // 检查消息是否有标记为正在流式输出的，如果有，则修正状态
      const hasStreamingMessage = messages.value.some(msg => msg.isStreaming);
      if (hasStreamingMessage) {
        logDebug('检测到会话中有未完成的流式消息，修正状态');
        
        // 将所有流式消息标记为已完成
        messages.value.forEach(msg => {
          if (msg.isStreaming) {
            msg.isStreaming = false;
            msg.content += '\n\n[此消息在会话恢复时已自动标记为已完成]';
          }
        });
      }
      
      return messagesResponse;
    } catch (error) {
      logDebug('切换会话失败', { error: error.message });
      throw error;
    }
  };
  
  // 同步消息状态到中间层
  const syncMessagesToMiddleLayer = () => {
    if (!isUsingMiddleLayer.value || !currentConversationId.value) return;
    
    try {
      // 深复制消息，避免非可克隆对象
      const safeMessages = messages.value.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
        isError: msg.isError || false,
        isComplete: msg.isComplete || true,
        // 仅包含关键属性，避免潜在的不可克隆对象
      }));
      
      const sessionData = {
        messages: safeMessages,
        appType: currentAppType.value,
        lastUpdated: Date.now(),
        userId: userId.value // 添加用户ID以便于多开检测
      };
      
      // 如果是首次同步，注册会话
      if (!sessionSynced.value) {
        const result = swManager.registerSession(currentConversationId.value, sessionData);
        if (result) {
          sessionSynced.value = true;
          console.log(`[Chat] 会话 ${currentConversationId.value} 已成功注册到中间层`);
        } else {
          console.warn(`[Chat] 会话 ${currentConversationId.value} 注册到中间层失败`);
        }
      } else {
        // 更新现有会话
        swManager.updateSession(currentConversationId.value, sessionData);
      }
    } catch (error) {
      console.error('[Chat] 同步会话到中间层时出错:', error);
    }
  };
  
  // 上传文件
  const uploadFileForChat = async (file) => {
    if (!file) return null;
    
    try {
      logDebug('正在上传文件...', { 
        name: file.name, 
        size: file.size, 
        type: file.type 
      });
      
      // 使用当前应用类型
      const result = await chatAPI.uploadFile(file, userId.value, currentAppType.value);
      
      logDebug('文件上传成功', result);
      
      return {
        id: result.id,
        name: result.name,
        size: result.size,
        type: result.mime_type,
        url: '', // 服务器返回的URL
        isUrl: false
      };
    } catch (error) {
      logDebug('文件上传失败', { error: error.message });
      throw error;
    }
  };
  
  // 停止生成
  const stopGenerating = async () => {
    if (!currentTask.value) {
      console.warn('没有活动任务可停止');
      isLoading.value = false;
      isStreaming.value = false;
      isGenerating.value = false;
      return false;
    }
    
    try {
      logDebug('正在停止响应...', { taskId: currentTask.value });
      
      // 使用当前应用类型
      const result = await chatAPI.stopResponse(currentTask.value, userId.value, currentAppType.value);
      
      logDebug('停止响应成功', result);
      
      // 找到对应的消息，更改状态
      const msgIndex = messages.value.findIndex(m => m.isStreaming);
      if (msgIndex !== -1) {
        messages.value[msgIndex].isStreaming = false;
        messages.value[msgIndex].content += '\n\n[用户已中断生成]';
      }
      
      // 重置所有状态
      isLoading.value = false;
      isStreaming.value = false;
      isGenerating.value = false;
      currentTask.value = null;
      lastMessageUpdateTime.value = 0;
      
      return true;
    } catch (error) {
      logDebug('停止响应失败', { error: error.message });
      
      // 即使API调用失败，也强制重置状态，避免UI卡住
      isLoading.value = false;
      isStreaming.value = false;
      isGenerating.value = false;
      currentTask.value = null;
      
      // 找到对应的消息，标记为已停止
      const msgIndex = messages.value.findIndex(m => m.isStreaming);
      if (msgIndex !== -1) {
        messages.value[msgIndex].isStreaming = false;
        messages.value[msgIndex].content += '\n\n[响应已停止，但可能出现错误]';
      }
      
      return false;
    }
  };
  
  // 初始化聊天状态
  const initialize = async (appType = null) => {
    logDebug('正在初始化聊天状态...');
    
    // 如果指定了应用类型，切换到该应用类型
    if (appType) {
      setAppType(appType);
    }
    
    try {
      // 检查Service Worker中间层是否可用
      if (isSWSupported && navigator.serviceWorker.controller) {
        isUsingMiddleLayer.value = true;
        logDebug('Service Worker中间层已启用，尝试恢复会话状态');
        
        // 尝试从中间层恢复会话状态
        if (currentConversationId.value) {
          await tryRestoreSessionFromMiddleLayer();
        }
        
        // 设置会话监听器
        setupSessionListener();
      } else {
        isUsingMiddleLayer.value = false;
        logDebug('Service Worker中间层未启用或未就绪，使用常规模式');
      }
      
      // 获取会话列表
      await fetchConversations();
      
      logDebug('聊天状态初始化完成');
      return true;
    } catch (error) {
      logDebug('聊天状态初始化失败', { error: error.message });
      return false;
    }
  };
  
  // 尝试从中间层恢复会话状态
  const tryRestoreSessionFromMiddleLayer = async () => {
    if (!isUsingMiddleLayer.value || !currentConversationId.value) return false;
    
    try {
      const sessionData = await swManager.getSession(currentConversationId.value);
      if (sessionData) {
        logDebug('从中间层恢复到会话状态', { sessionId: currentConversationId.value });
        
        // 恢复消息数据
        if (sessionData.messages && sessionData.messages.length > 0) {
          messages.value = sessionData.messages;
          sessionSynced.value = true;
          return true;
        }
      }
    } catch (error) {
      logDebug('从中间层恢复会话状态失败', { error: error.message });
    }
    
    return false;
  };
  
  // 设置会话状态变更监听器
  const setupSessionListener = () => {
    if (!isUsingMiddleLayer.value) return;
    
    // 监听会话状态变更
    const sessionUpdateListener = ({ sessionId, action }) => {
      if (sessionId === currentConversationId.value) {
        logDebug(`会话状态更新: ${action}`, { sessionId });
        
        if (action === 'updated') {
          // 当会话在另一个标签页更新时，尝试重新获取
          tryRestoreSessionFromMiddleLayer();
        }
      }
    };
    
    // 添加监听器
    if (currentConversationId.value) {
      swManager.addSessionListener(currentConversationId.value, sessionUpdateListener);
      
      // 组件卸载时清理监听器
      onUnmounted(() => {
        swManager.removeSessionListener(currentConversationId.value, sessionUpdateListener);
      });
    }
  };
  
  // 处理消息流
  const handleMessageStream = async (response) => {
    if (!response || !response.body) {
      throw new Error('响应格式错误');
    }
    
    // 设置当前任务为加载状态
    isGenerating.value = true;
    
    // 标记流式状态开始
    if (window.streamingState) {
      window.streamingState.setStreaming(true);
    }
    
    // 初始化流阅读器
    const reader = response.body.getReader();
    const textDecoder = new TextDecoder();
    let buffer = '';
    
    // 确保最后一条消息是助手消息
    const lastMessage = messages.value[messages.value.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') {
      console.warn('[Chat Store] 消息列表中没有助手消息，无法接收流式响应');
      return;
    }
    
    // 记录助手消息的索引，用于更新
    const assistantMessageIndex = messages.value.length - 1;
    
    // 初始化消息内容和元数据
    let messageContent = '';
    let taskId = null;
    // 添加标记，表示是否有接收到消息结束事件
    let receivedEndEvent = false;
    
    try {
      isStreaming.value = true;
      lastMessage.isStreaming = true; // 确保消息对象也标记为流式状态
      lastMessageUpdateTime.value = Date.now();
      
      // 为搜索助手添加额外的跟踪日志
      if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
        logDebug('搜索助手开始接收流式数据', { 
          time: new Date().toISOString(),
          messageId: lastMessage.id
        });
      }
      
      // 读取流数据
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          isStreaming.value = false;
          lastMessage.isStreaming = false;
          
          // 为搜索助手记录流式数据结束
          if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
            logDebug('搜索助手流式数据传输完成', { 
              time: new Date().toISOString(),
              messageId: lastMessage.id
            });
          }
          
          break;
        }
        
        // 解码数据并添加到缓冲区
        const decodedChunk = textDecoder.decode(value, { stream: true });
        buffer += decodedChunk;
        
        // 为搜索助手记录接收到数据块
        if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
          logDebug('搜索助手接收到数据块', { 
            time: new Date().toISOString(),
            dataLength: value.length,
            // 添加新的日志信息来显示原始数据块(最多显示前150个字符)
            preview: decodedChunk.length > 150 ? decodedChunk.substring(0, 150) + '...' : decodedChunk
          });
        }
        
        // 处理缓冲区中的完整事件
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
          logDebug('搜索助手处理数据行', { 
            lineCount: lines.length,
            bufferRemaining: buffer.length
          });
        }
        
        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) {
            if (currentAppType.value === chatAPI.APP_TYPES.SEARCH && line.trim()) {
              logDebug('搜索助手跳过非数据行', {
                lineContent: line.length > 50 ? line.substring(0, 50) + '...' : line
              });
            }
            continue;
          }
          
          try {
            // 提取JSON数据
            const jsonStr = line.slice(6); // 去掉 "data: "
            
            if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
              logDebug('搜索助手尝试解析JSON', {
                jsonPreview: jsonStr.length > 50 ? jsonStr.substring(0, 50) + '...' : jsonStr
              });
            }
            
            const data = JSON.parse(jsonStr);
            
            if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
              logDebug('搜索助手JSON解析成功', {
                event: data.event,
                hasAnswer: !!data.answer,
                answerLength: data.answer?.length || 0
              });
            }
            
            // 处理不同类型的事件
            if (data.event === 'message') {
              // 更多日志用于调试
              if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
                logDebug('搜索助手接收到message事件', {
                  time: new Date().toISOString(),
                  messageIndex: assistantMessageIndex,
                  hasCurrentMessage: assistantMessageIndex >= 0 && assistantMessageIndex < messages.value.length,
                  hasAnswer: !!data.answer,
                  answerLength: data.answer?.length || 0,
                  currentContentLength: messageContent.length
                });
              }
              
              // 更新消息内容
              const previousLength = messageContent.length;
              messageContent += data.answer || '';
              
              // 更新消息对象
              if (assistantMessageIndex >= 0 && assistantMessageIndex < messages.value.length) {
                const previousContent = messages.value[assistantMessageIndex].content;
                messages.value[assistantMessageIndex].content = messageContent;
                
                // 搜索助手特殊日志
                if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
                  logDebug('搜索助手更新消息内容', {
                    time: new Date().toISOString(),
                    messageIndex: assistantMessageIndex,
                    contentBefore: previousContent.length,
                    contentAfter: messages.value[assistantMessageIndex].content.length,
                    contentChanged: previousContent !== messages.value[assistantMessageIndex].content,
                    receivedContent: (data.answer || '').length,
                    totalContentLength: messageContent.length
                  });
                }
              } else if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
                logDebug('搜索助手更新消息失败', {
                  time: new Date().toISOString(),
                  messageIndex: assistantMessageIndex,
                  messagesLength: messages.value.length,
                  receivedContent: (data.answer || '').length
                });
              }
              
              // 记录taskId用于可能的停止请求
              if (data.task_id && !taskId) {
                taskId = data.task_id;
                currentTask.value = taskId;
                
                // 搜索助手特殊日志
                if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
                  logDebug('搜索助手设置任务ID', {
                    time: new Date().toISOString(),
                    taskId
                  });
                }
              }
              
              // 更新会话ID (如果存在且当前无会话ID)
              if (data.conversation_id && !currentConversationId.value) {
                currentConversationId.value = data.conversation_id;
                
                // 更新消息中的会话ID
                messages.value[assistantMessageIndex].conversation_id = data.conversation_id;
              }
              
              // 如果有消息ID，更新消息的ID
              if (data.message_id) {
                messages.value[assistantMessageIndex].id = data.message_id;
              }
              
              // 更新时间戳，用于防超时保护
              lastMessageUpdateTime.value = Date.now();
            } else if (data.event === 'agent_message') {
              // Agent模式下返回文本块事件，处理方式类似message事件
              if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
                logDebug('搜索助手接收到agent_message事件', {
                  time: new Date().toISOString(),
                  messageIndex: assistantMessageIndex,
                  hasCurrentMessage: assistantMessageIndex >= 0 && assistantMessageIndex < messages.value.length,
                  hasAnswer: !!data.answer,
                  answerLength: data.answer?.length || 0,
                  currentContentLength: messageContent.length
                });
              }
              
              // 更新消息内容
              messageContent += data.answer || '';
              
              // 更新消息对象
              if (assistantMessageIndex >= 0 && assistantMessageIndex < messages.value.length) {
                messages.value[assistantMessageIndex].content = messageContent;
                
                // 搜索助手特殊日志
                if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
                  logDebug('搜索助手更新agent_message内容', {
                    time: new Date().toISOString(),
                    messageIndex: assistantMessageIndex,
                    receivedContent: (data.answer || '').length,
                    totalContentLength: messageContent.length
                  });
                }
              }
              
              // 处理会话ID和消息ID，与message事件类似
              if (data.task_id && !taskId) {
                taskId = data.task_id;
                currentTask.value = taskId;
              }
              
              if (data.conversation_id && !currentConversationId.value) {
                currentConversationId.value = data.conversation_id;
                messages.value[assistantMessageIndex].conversation_id = data.conversation_id;
              }
              
              if (data.message_id) {
                messages.value[assistantMessageIndex].id = data.message_id;
              }
              
              // 更新时间戳
              lastMessageUpdateTime.value = Date.now();
            } else if (data.event === 'agent_thought') {
              // Agent模式下的思考步骤内容
              if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
                logDebug('搜索助手接收到agent_thought事件', {
                  time: new Date().toISOString(),
                  thoughtId: data.id,
                  position: data.position,
                  taskId: data.task_id,
                  messageId: data.message_id,
                  thoughtLength: (data.thought || '').length,
                  tool: data.tool,
                  hasToolInput: !!data.tool_input
                });
              }
              
              // 不再构建和显示任何思考内容
              // let thoughtContent = '';
              
              // if (data.thought) {
              //   thoughtContent += `思考: ${data.position || ''}\n${data.thought || ''}\n\n`;
              // }
              
              // if (data.tool) {
              //   thoughtContent += `使用工具: ${data.tool}\n\n`;
              
              //   if (data.tool_input) {
              //     try {
              //       // 尝试将JSON字符串转换为可读形式，但不添加高亮
              //       const toolInputObj = JSON.parse(data.tool_input);
              //       thoughtContent += `工具输入:\n${JSON.stringify(toolInputObj, null, 2)}\n\n`;
              //     } catch (e) {
              //       // 如果解析失败，直接显示原始内容
              //       thoughtContent += `工具输入: ${data.tool_input}\n\n`;
              //     }
              //   }
              // }
              
              // // 将思考内容追加到消息中
              // if (thoughtContent) {
              //   messageContent += thoughtContent;
              
              //   // 更新消息对象
              //   if (assistantMessageIndex >= 0 && assistantMessageIndex < messages.value.length) {
              //     messages.value[assistantMessageIndex].content = messageContent;
              
              //     // 搜索助手特殊日志
              //     if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
              //       logDebug('搜索助手更新agent_thought内容', {
              //         time: new Date().toISOString(),
              //         messageIndex: assistantMessageIndex,
              //         thoughtContentLength: thoughtContent.length,
              //         totalContentLength: messageContent.length
              //       });
              //     }
              //   }
              // }
              
              // 处理任务ID
              if (data.task_id && !taskId) {
                taskId = data.task_id;
                currentTask.value = taskId;
              }
              
              // 处理会话ID
              if (data.conversation_id && !currentConversationId.value) {
                currentConversationId.value = data.conversation_id;
                if (assistantMessageIndex >= 0 && assistantMessageIndex < messages.value.length) {
                  messages.value[assistantMessageIndex].conversation_id = data.conversation_id;
                }
              }
              
              // 更新时间戳
              lastMessageUpdateTime.value = Date.now();
            } else if (data.event === 'message_file') {
              // 处理文件事件
              if (currentAppType.value === chatAPI.APP_TYPES.SEARCH) {
                logDebug('搜索助手接收到message_file事件', {
                  time: new Date().toISOString(),
                  fileId: data.id,
                  fileType: data.type,
                  belongsTo: data.belongs_to
                });
              }
              
              // 目前仅处理图片类型文件
              if (data.type === 'image' && data.url) {
                // 构建图片Markdown格式
                const imageMarkdown = `\n\n![图片](${data.url})\n\n`;
                
                // 添加到消息内容
                messageContent += imageMarkdown;
                
                // 更新消息对象
                if (assistantMessageIndex >= 0 && assistantMessageIndex < messages.value.length) {
                  messages.value[assistantMessageIndex].content = messageContent;
                  
                  // 记录文件信息到消息对象
                  if (!messages.value[assistantMessageIndex].files) {
                    messages.value[assistantMessageIndex].files = [];
                  }
                  
                  messages.value[assistantMessageIndex].files.push({
                    id: data.id,
                    type: data.type,
                    url: data.url
                  });
                }
              }
              
              // 更新时间戳
              lastMessageUpdateTime.value = Date.now();
            } else if (data.event === 'message_end') {
              // 标记接收到了消息结束事件
              receivedEndEvent = true;
              
              // 消息结束，更新消息状态
              messages.value[assistantMessageIndex].isComplete = true;
              messages.value[assistantMessageIndex].id = data.message_id || messages.value[assistantMessageIndex].id;
              
              // 更新会话ID (如果存在且当前无会话ID)
              if (data.conversation_id && !currentConversationId.value) {
                currentConversationId.value = data.conversation_id;
              }
              
              // 重置任务状态
              currentTask.value = null;
              
              // 如果中间层已启用，更新会话数据
              if (isUsingMiddleLayer.value && currentConversationId.value) {
                swManager.updateSession(currentConversationId.value, {
                  messages: sortedMessages.value,
                  last_updated: Date.now()
                });
              }
            }
          } catch (error) {
            console.error('处理流事件失败:', error, line);
          }
        }
      }
      
      // 处理完成，更新UI状态
      isGenerating.value = false;
      isLoading.value = false;
      
      // 如果获取到了会话ID，刷新会话列表
      if (currentConversationId.value) {
        fetchConversations();
      }
      
      // 如果中间层已启用，更新会话状态
      if (isUsingMiddleLayer.value && currentConversationId.value) {
        swManager.updateSession(currentConversationId.value, {
          messages: sortedMessages.value,
          last_updated: Date.now()
        });
      }
      
      // 流式处理完成，重置流式状态
      if (window.streamingState) {
        window.streamingState.setStreaming(false);
      }
      
      return messageContent;
    } catch (error) {
      console.error('读取流数据失败:', error);
      isStreaming.value = false;
      isGenerating.value = false;
      isLoading.value = false;
      
      // 错误时也要结束流式状态标记
      if (window.streamingState) {
        window.streamingState.setStreaming(false);
      }
      
      // 检查消息内容，如果已经有内容则保留
      const currentMessage = messages.value[assistantMessageIndex];
      const hasContent = currentMessage && currentMessage.content && currentMessage.content.length > 30;
      
      // 如果消息已有实质内容或收到过消息结束事件，保留内容
      if (hasContent || receivedEndEvent) {
        // 如果消息已有实质内容，添加错误提示但不替换现有内容
        logDebug('流读取中断, 但消息已有足够内容或已收到结束事件，保留显示', {
          contentLength: currentMessage.content.length,
          receivedEndEvent,
          error: error.message
        });
        
        // 标记为流式传输结束，但不修改内容
        currentMessage.isStreaming = false;
      } else {
        // 内容很少，可能是真正的错误，设置错误状态
        messages.value[assistantMessageIndex].error = true;
        messages.value[assistantMessageIndex].content = `读取响应失败: ${error.message}`;
      }
      
      throw error;
    }
  };
  
  // 更新版本 - 接收原始响应内容
  const handleStreamEnd = (rawResponse = '') => {
    // 存储原始响应
    lastRawResponse.value = rawResponse;
    logDebug('流响应原始内容', { length: rawResponse.length });

    // 结束加载状态
    isLoading.value = false;
    isStreaming.value = false;
    
    // 确保流式状态被标记为结束
    if (window.streamingState) {
      window.streamingState.setStreaming(false);
    }
    
    // 如果我们有了新的会话ID，刷新会话列表
    if (currentConversationId.value) {
      fetchConversations();
    }
  };
  
  return {
    // 状态
    messages,
    sortedMessages,
    isLoading,
    isGenerating,
    isStreaming,
    currentConversationId,
    conversations,
    error,
    userId,
    connectionStatus, // 新增连接状态
    debugLogs,       // 新增调试日志
    enableDebugMode, // 新增调试模式标志
    lastRawResponse, // 新增原始响应存储
    rawResponse,    // 新增原始响应文本
    currentAppType,  // 新增当前应用类型
    isUsingMiddleLayer,
    sessionSynced,
    
    // 方法
    sendMessage,
    stopGenerating,
    fetchMessages,
    fetchConversations,
    createNewConversation,
    switchConversation,
    uploadFileForChat,
    initialize,
    tryRestoreSessionFromMiddleLayer,
    
    // 调试方法
    toggleDebugMode, // 切换调试模式
    clearDebugLogs,  // 清除调试日志
    checkConnection,  // 检查连接状态
    setAppType       // 设置应用类型
  };
}); 