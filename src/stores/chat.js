// src/stores/chat.js
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import * as chatAPI from '../services/chatAPI';

export const useChatStore = defineStore('chat', () => {
  // 状态
  const messages = ref([]);
  const isLoading = ref(false);
  const currentConversationId = ref('');
  const conversations = ref([]);
  const error = ref(null);
  const currentTask = ref(null);
  
  // 调试用 - 存储最近一次API的原始响应
  const lastRawResponse = ref('');
  
  // 用户ID (在实际应用中应该从用户会话中获取)
  const userId = ref(localStorage.getItem('chat_user_id') || uuidv4());
  
  // 保存用户ID到本地存储
  if (!localStorage.getItem('chat_user_id')) {
    localStorage.setItem('chat_user_id', userId.value);
  }
  
  // 计算属性
  const sortedMessages = computed(() => {
    return [...messages.value].sort((a, b) => a.created_at - b.created_at);
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
  
  // API连接状态监控
  const connectionStatus = ref('unknown'); // unknown, connected, disconnected
  
  // 检查API连接状态
  const checkConnection = async () => {
    try {
      const infoUrl = `${import.meta.env.VITE_API_BASE_URL}/info`;
      logDebug('正在检查API连接状态...', { url: infoUrl });
      
      // 使用URL构造器检查API地址是否有效
      new URL(import.meta.env.VITE_API_BASE_URL);
      
      // 测试连接
      const testResponse = await fetch(infoUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`
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
      // 只有当超过10秒没有收到更新且没有正在流式处理的消息时才重置
      if (isLoading.value && lastMessageUpdateTime.value > 0 && (now - lastMessageUpdateTime.value > 10000)) {
        // 查找是否有正在流式处理的消息
        const streamingMsg = messages.value.find(m => m.isStreaming);
        
        // 只有当没有正在流式处理的消息时，才重置状态
        if (!streamingMsg) {
          logDebug('检测到长时间无更新且无流式消息，重置按钮状态', { lastUpdate: new Date(lastMessageUpdateTime.value) });
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
  const sendMessage = async (content, files = []) => {
    if (!content.trim() && files.length === 0) return;
    
    // 添加用户消息到列表
    const userMessage = {
      id: uuidv4(),
      conversation_id: currentConversationId.value,
      role: 'user',
      content: content,
      files: files.map(f => ({
        id: f.id,
        type: f.type,
        url: f.url
      })),
      created_at: Date.now() / 1000
    };
    
    messages.value.push(userMessage);
    isLoading.value = true;
    error.value = null;
    
    try {
      // 添加等待中的AI回复占位
      const tempId = uuidv4();
      messages.value.push({
        id: tempId,
        conversation_id: currentConversationId.value,
        role: 'assistant',
        content: '',
        created_at: Date.now() / 1000,
        isStreaming: true
      });
      
      // 准备文件格式
      const apiFiles = files.map(file => ({
        type: file.type.startsWith('image/') ? 'image' : 'document',
        transfer_method: file.isUrl ? 'remote_url' : 'local_file',
        ...(file.isUrl ? { url: file.url } : { upload_file_id: file.id })
      }));
      
      // 发送消息到API
      const response = await chatAPI.sendChatMessage(
        content,
        userId.value,
        currentConversationId.value,
        apiFiles.length > 0 ? apiFiles : undefined
      );
      
      // 流式处理响应
      let assistantMessageId = null;
      let fullMessage = '';
      
      chatAPI.parseSSEResponse(
        response,
        (data) => {
          // 记录所有收到的事件
          logDebug('收到API事件', data);
          
          if (data.event === 'message') {
            // 更新消息ID和内容
            if (!assistantMessageId && data.message_id) {
              assistantMessageId = data.message_id;
              logDebug('设置消息ID', { id: assistantMessageId });
              
              // 更新临时消息ID
              const msgIndex = messages.value.findIndex(m => m.id === tempId);
              if (msgIndex !== -1) {
                messages.value[msgIndex].id = assistantMessageId;
              }
            }
            
            // 追加消息内容 - 保留原始HTML
            fullMessage += data.answer || '';
            
            // 更新最后消息时间戳，用于安全机制
            lastMessageUpdateTime.value = Date.now();
            
            // 更新消息内容 - 直接使用原始内容，不做预处理
            const msgIndex = messages.value.findIndex(m => 
              m.id === assistantMessageId || m.id === tempId
            );
            
            if (msgIndex !== -1) {
              messages.value[msgIndex].content = fullMessage;
              messages.value[msgIndex].conversation_id = data.conversation_id;
            } else {
              logDebug('无法找到要更新的消息', { tempId, assistantMessageId });
            }
            
            // 保存会话ID
            if (data.conversation_id && !currentConversationId.value) {
              currentConversationId.value = data.conversation_id;
              logDebug('设置会话ID', { conversation_id: data.conversation_id });
            }
            
            // 保存任务ID
            if (data.task_id) {
              currentTask.value = data.task_id;
              logDebug('设置任务ID', { task_id: data.task_id });
            }
          } 
          else if (data.event === 'workflow_started' || data.event === 'node_started' || 
                  data.event === 'node_finished' || data.event === 'workflow_finished') {
            // 这些是工作流相关事件，记录但不需要特殊处理
            logDebug(`工作流事件: ${data.event}`, data);
          }
          else if (data.event === 'message_end') {
            // 结束消息流
            logDebug('消息结束', data);
            const msgIndex = messages.value.findIndex(m => 
              m.id === assistantMessageId || m.id === tempId
            );
            
            if (msgIndex !== -1) {
              messages.value[msgIndex].isStreaming = false;
              messages.value[msgIndex].metadata = data.metadata;
              messages.value[msgIndex].retriever_resources = data.retriever_resources;
            } else {
              logDebug('结束消息时无法找到要更新的消息', { tempId, assistantMessageId });
            }
            
            // 清除任务ID
            currentTask.value = null;
            
            // 重要：在消息结束时就重置加载状态，使按钮立即可用
            isLoading.value = false;
          } 
          else if (data.event === 'message_file') {
            // 处理文件消息
            logDebug('收到文件消息', data);
            const msgIndex = messages.value.findIndex(m => 
              m.id === assistantMessageId || m.id === tempId
            );
            
            if (msgIndex !== -1) {
              if (!messages.value[msgIndex].files) {
                messages.value[msgIndex].files = [];
              }
              
              messages.value[msgIndex].files.push({
                id: data.id,
                type: data.type,
                url: data.url
              });
            } else {
              logDebug('添加文件时无法找到要更新的消息', { tempId, assistantMessageId });
            }
          } 
          else if (data.event === 'error') {
            // 处理API返回的错误事件
            logDebug('收到错误事件', data);
            handleStreamError(data, tempId);
          }
          else if (data.event === 'ping') {
            // ping事件，仅用于保持连接
            logDebug('收到ping事件');
          }
          else if (data.event === 'message_replace') {
            // 消息替换事件
            logDebug('收到消息替换事件', data);
            const msgIndex = messages.value.findIndex(m => 
              m.id === assistantMessageId || m.id === tempId
            );
            
            if (msgIndex !== -1) {
              // 直接使用原始HTML内容
              messages.value[msgIndex].content = data.answer || '';
            }
          }
          else {
            // 未知事件类型
            logDebug('收到未知事件类型', data);
          }
        },
        (errorData) => {
          // 处理错误
          logDebug('处理流错误', errorData);
          handleStreamError(errorData, tempId);
        },
        handleStreamEnd
      );
    } catch (err) {
      handleApiError(err, tempId);
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
  
  // 停止生成响应
  const stopGenerating = async () => {
    if (currentTask.value) {
      try {
        await chatAPI.stopResponse(currentTask.value, userId.value);
        
        // 找到正在流式传输的消息并标记为已完成
        const streamingMsg = messages.value.find(m => m.isStreaming);
        if (streamingMsg) {
          streamingMsg.isStreaming = false;
          streamingMsg.content += ' [已停止生成]';
        }
        
        // 重置任务和加载状态
        currentTask.value = null;
        isLoading.value = false; // 确保重置加载状态，使按钮可用
      } catch (err) {
        error.value = err.message || '停止生成时出错';
        isLoading.value = false; // 即使出错也要重置加载状态
      }
    }
  };
  
  // 获取会话消息历史
  const fetchMessages = async (conversationId = null) => {
    if (conversationId) {
      currentConversationId.value = conversationId;
    } else if (!currentConversationId.value) {
      // 如果没有会话ID，清空消息并返回
      messages.value = [];
      return;
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const result = await chatAPI.getConversationMessages(
        userId.value,
        currentConversationId.value
      );
      
      // 转换消息格式
      messages.value = result.data.map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        role: msg.query ? 'user' : 'assistant',
        content: msg.query || msg.answer,
        files: msg.message_files || [],
        created_at: msg.created_at,
        metadata: msg.metadata,
        retriever_resources: msg.retriever_resources,
        feedback: msg.feedback
      }));
      
      isLoading.value = false;
    } catch (err) {
      error.value = err.message || '获取消息历史时出错';
      isLoading.value = false;
    }
  };
  
  // 获取会话列表
  const fetchConversations = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const result = await chatAPI.getConversations(userId.value);
      conversations.value = result.data;
      isLoading.value = false;
    } catch (err) {
      error.value = err.message || '获取会话列表时出错';
      isLoading.value = false;
    }
  };
  
  // 创建新会话
  const createNewConversation = () => {
    currentConversationId.value = '';
    messages.value = [];
  };
  
  // 切换会话
  const switchConversation = async (conversationId) => {
    await fetchMessages(conversationId);
  };
  
  // 上传文件
  const uploadFileForChat = async (file) => {
    try {
      const result = await chatAPI.uploadFile(file, userId.value);
      return {
        id: result.id,
        name: result.name,
        type: result.mime_type,
        size: result.size,
        url: result.url,
        isUrl: false
      };
    } catch (err) {
      error.value = err.message || '文件上传失败';
      throw err;
    }
  };
  
  // 初始化 - 加载会话列表和检查连接
  const initialize = async () => {
    logDebug('初始化聊天模块...');
    
    // 设置按钮重置安全机制
    setupButtonResetSafeguard();
    
    const isConnected = await checkConnection();
    if (!isConnected) {
      error.value = '无法连接到AI服务器，请检查网络连接或联系管理员';
      return;
    }
    
    try {
      await fetchConversations();
      
      // 如果有当前会话，加载消息
      if (currentConversationId.value) {
        await fetchMessages();
      }
      
      logDebug('初始化完成');
    } catch (err) {
      logDebug('初始化失败', { error: err.message });
      error.value = '加载会话数据失败';
    }
  };
  
  // 更新版本 - 接收原始响应内容
  const handleStreamEnd = (rawResponse = '') => {
    // 存储原始响应
    lastRawResponse.value = rawResponse;
    logDebug('流响应原始内容', { length: rawResponse.length });

    // 结束加载状态
    isLoading.value = false;
    
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
    currentConversationId,
    conversations,
    error,
    userId,
    connectionStatus, // 新增连接状态
    debugLogs,       // 新增调试日志
    enableDebugMode, // 新增调试模式标志
    lastRawResponse, // 新增原始响应存储
    
    // 方法
    sendMessage,
    stopGenerating,
    fetchMessages,
    fetchConversations,
    createNewConversation,
    switchConversation,
    uploadFileForChat,
    initialize,
    
    // 调试方法
    toggleDebugMode, // 切换调试模式
    clearDebugLogs,  // 清除调试日志
    checkConnection  // 检查连接状态
  };
}); 