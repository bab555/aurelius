// src/services/chatAPI.js
// 聊天API服务

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 定义应用类型枚举
export const APP_TYPES = {
  TRAVEL: 'travel',           // 文旅助手
  DESTINY: 'destiny',         // 命理算命
  INTELLIGENT: 'intelligent', // 智能助手
  SOLUTION: 'solution',       // 写作助手
  ENTERPRISE: 'enterprise',   // 企业助手
  // 后续可以添加更多应用类型
  IMAGE: 'image',             // 图像生成
  VOICE: 'voice',             // 语音合成
  VIDEO: 'video',             // 视频生成
};

// 根据应用类型获取对应的API凭证
export const getCredentials = (appType = APP_TYPES.TRAVEL) => {
  switch(appType) {
    case APP_TYPES.DESTINY:
      return {
        appId: import.meta.env.VITE_DESTINY_APP_ID,
        apiKey: import.meta.env.VITE_DESTINY_API_KEY
      };
    case APP_TYPES.INTELLIGENT:
      return {
        appId: import.meta.env.VITE_INTELLIGENT_APP_ID,
        apiKey: import.meta.env.VITE_INTELLIGENT_API_KEY
      };
    case APP_TYPES.SOLUTION:
      return {
        appId: import.meta.env.VITE_SOLUTION_APP_ID,
        apiKey: import.meta.env.VITE_SOLUTION_API_KEY
      };
    case APP_TYPES.ENTERPRISE:
      return {
        appId: import.meta.env.VITE_ENTERPRISE_APP_ID,
        apiKey: import.meta.env.VITE_ENTERPRISE_API_KEY
      };
    case APP_TYPES.IMAGE:
      // 预留图像生成API凭证
      return {
        appId: import.meta.env.VITE_IMAGE_APP_ID || import.meta.env.VITE_APP_ID,
        apiKey: import.meta.env.VITE_IMAGE_API_KEY || import.meta.env.VITE_API_KEY
      };
    case APP_TYPES.VOICE:
      // 预留语音合成API凭证
      return {
        appId: import.meta.env.VITE_VOICE_APP_ID || import.meta.env.VITE_APP_ID,
        apiKey: import.meta.env.VITE_VOICE_API_KEY || import.meta.env.VITE_API_KEY
      };
    case APP_TYPES.VIDEO:
      // 预留视频生成API凭证
      return {
        appId: import.meta.env.VITE_VIDEO_APP_ID || import.meta.env.VITE_APP_ID,
        apiKey: import.meta.env.VITE_VIDEO_API_KEY || import.meta.env.VITE_API_KEY
      };
    case APP_TYPES.TRAVEL:
    default:
      return {
        appId: import.meta.env.VITE_TRAVEL_APP_ID || import.meta.env.VITE_APP_ID,
        apiKey: import.meta.env.VITE_TRAVEL_API_KEY || import.meta.env.VITE_API_KEY
      };
  }
};

/**
 * 发送聊天消息
 * @param {string} message - 用户输入的消息
 * @param {string} userId - 用户ID
 * @param {string} conversationId - 会话ID，可选
 * @param {Array} files - 文件列表，可选
 * @param {Object} inputs - 额外输入参数，可选
 * @param {string} appType - 应用类型，默认为文旅助手
 * @returns {Promise} - 返回一个Promise，resolves为文本流
 */
export const sendChatMessage = async (message, userId, conversationId = '', files = [], inputs = {}, appType = APP_TYPES.TRAVEL) => {
  const url = `${API_BASE_URL}/chat-messages`;
  const { apiKey } = getCredentials(appType);
  
  const payload = {
    query: message,
    user: userId,
    conversation_id: conversationId,
    response_mode: 'streaming',
    inputs: inputs || {}
  };
  
  if (files && files.length > 0) {
    payload.files = files;
  }
  
  console.log('发送聊天消息请求:', {
    url,
    appType,
    headers: {
      Authorization: `Bearer ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`,
      'Content-Type': 'application/json',
    },
    payload
  });
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('收到API响应:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers.entries()])
    });
    
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
        console.error('API错误响应内容:', errorData);
      } catch (e) {
        console.error('无法解析API错误响应:', e);
        const responseText = await response.text();
        console.error('API错误响应原始内容:', responseText);
      }
      
      const errorMessage = errorData.message || `请求失败 (${response.status})`;
      throw new Error(errorMessage);
    }
    
    return response;
  } catch (error) {
    console.error('发送消息失败:', error);
    
    // 增强错误信息
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到服务器，请检查网络连接');
    }
    
    throw error;
  }
};

/**
 * 获取会话消息历史
 * @param {string} userId - 用户ID
 * @param {string} conversationId - 会话ID
 * @param {string} firstId - 首条消息ID，用于分页
 * @param {number} limit - 每页数量
 * @param {string} appType - 应用类型，默认为文旅助手
 * @returns {Promise} - 返回一个Promise，resolves为消息列表
 */
export const getConversationMessages = async (userId, conversationId, firstId = null, limit = 20, appType = APP_TYPES.TRAVEL) => {
  const url = new URL(`${API_BASE_URL}/messages`);
  const { apiKey } = getCredentials(appType);
  
  url.searchParams.append('user', userId);
  url.searchParams.append('conversation_id', conversationId);
  
  if (firstId) {
    url.searchParams.append('first_id', firstId);
  }
  
  url.searchParams.append('limit', limit.toString());
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `获取消息失败 (${response.status})`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取会话消息失败:', error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到服务器，请检查网络连接');
    }
    
    throw error;
  }
};

/**
 * 获取会话列表
 * @param {string} userId - 用户ID
 * @param {string} lastId - 最后一条记录ID，用于分页
 * @param {number} limit - 每页数量
 * @param {string} appType - 应用类型，默认为文旅助手
 * @returns {Promise} - 返回一个Promise，resolves为会话列表
 */
export const getConversations = async (userId, lastId = null, limit = 20, appType = APP_TYPES.TRAVEL) => {
  const url = new URL(`${API_BASE_URL}/conversations`);
  const { apiKey } = getCredentials(appType);
  
  url.searchParams.append('user', userId);
  
  if (lastId) {
    url.searchParams.append('last_id', lastId);
  }
  
  url.searchParams.append('limit', limit.toString());
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `获取会话列表失败 (${response.status})`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取会话列表失败:', error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到服务器，请检查网络连接');
    }
    
    throw error;
  }
};

/**
 * 上传文件
 * @param {File} file - 要上传的文件
 * @param {string} userId - 用户ID
 * @param {string} appType - 应用类型，默认为文旅助手
 * @returns {Promise} - 返回一个Promise，resolves为上传结果
 */
export const uploadFile = async (file, userId, appType = APP_TYPES.TRAVEL) => {
  const url = `${API_BASE_URL}/files/upload`;
  const { apiKey } = getCredentials(appType);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user', userId);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `上传文件失败 (${response.status})`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('上传文件失败:', error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到服务器，请检查网络连接');
    }
    
    throw error;
  }
};

/**
 * 停止响应
 * @param {string} taskId - 任务ID
 * @param {string} userId - 用户ID
 * @param {string} appType - 应用类型，默认为文旅助手
 * @returns {Promise} - 返回一个Promise，resolves为停止结果
 */
export const stopResponse = async (taskId, userId, appType = APP_TYPES.TRAVEL) => {
  const url = `${API_BASE_URL}/chat-messages/${taskId}/stop`;
  const { apiKey } = getCredentials(appType);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user: userId })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `停止响应失败 (${response.status})`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('停止响应失败:', error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到服务器，请检查网络连接');
    }
    
    throw error;
  }
};

/**
 * 消息反馈
 * @param {string} messageId - 消息ID
 * @param {string} rating - 评分 like或dislike
 * @param {string} userId - 用户ID
 * @param {string} content - 反馈内容
 * @param {string} appType - 应用类型，默认为文旅助手
 * @returns {Promise} - 返回一个Promise，resolves为反馈结果
 */
export const feedbackMessage = async (messageId, rating, userId, content = '', appType = APP_TYPES.TRAVEL) => {
  const url = `${API_BASE_URL}/messages/${messageId}/feedbacks`;
  const { apiKey } = getCredentials(appType);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rating,
        user: userId,
        content
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `反馈失败 (${response.status})`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('发送反馈失败:', error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到服务器，请检查网络连接');
    }
    
    throw error;
  }
};

/**
 * 解析SSE流式响应
 * @param {Response} response - fetch响应对象
 * @param {Function} onMessage - 消息处理回调
 * @param {Function} onError - 错误处理回调
 * @param {Function} onEnd - 结束处理回调
 */
export const parseSSEResponse = (response, onMessage, onError, onEnd) => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let allContent = ''; // 存储所有收到的内容
  // 添加缓冲区安全限制
  const MAX_BUFFER_SIZE = 1024 * 1024; // 1MB限制
  
  console.log('开始解析SSE响应...');
  
  const processStreamResult = ({ done, value }) => {
    if (done) {
      console.log('SSE流结束');
      if (buffer.trim() !== '') {
        console.log('处理剩余缓冲区:', buffer);
        // 不再添加到allContent以避免内存过度使用
        processChunk(buffer);
      }
      // 清理以释放内存
      buffer = '';
      if (onEnd) onEnd(allContent);
      return;
    }
    
    const chunk = decoder.decode(value, { stream: true });
    // 仅打印片段以避免日志过大
    console.log(`收到原始数据块(${chunk.length}字节)`, chunk.length > 100 ? chunk.substring(0, 100) + '...' : chunk);
    
    // 检查buffer大小，防止过度增长
    if (buffer.length > MAX_BUFFER_SIZE) {
      console.warn(`缓冲区过大(${buffer.length}字节)，清理旧数据`);
      buffer = buffer.substring(buffer.length - MAX_BUFFER_SIZE/2); // 保留后半部分
    }
    
    buffer += chunk;
    
    // 仅保留有实际价值的内容用于返回
    if (chunk.includes('data: ') && !chunk.includes('event: ping')) {
      allContent += chunk;
    }
    
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';
    
    console.log(`解析出 ${lines.length} 个消息块，剩余缓冲区长度: ${buffer.length}`);
    
    for (const line of lines) {
      if (line.trim() !== '') {
        processChunk(line);
      }
    }
    
    // 安全措施：如果buffer太长但没有完整消息，可能是格式问题，进行清理
    if (buffer.length > MAX_BUFFER_SIZE/2 && !buffer.includes('\n\n')) {
      console.warn('缓冲区无法分割为完整消息，可能存在格式问题，进行清理');
      buffer = ''; // 清空缓冲区
    }
    
    reader.read().then(processStreamResult).catch(handleReadError);
  };
  
  const handleReadError = (error) => {
    console.error('读取流失败:', error);
    if (onError) onError({ message: '读取响应流失败', error: error.toString() });
  };
  
  const processChunk = (chunk) => {
    console.log('处理数据块:', chunk);
    
    // 处理心跳包 - 新增处理逻辑
    if (chunk.startsWith('event: ping') || chunk.trim() === 'event: ping') {
      console.log('收到心跳包，保持连接活跃');
      return; // 直接返回，不做进一步处理，也不累积到buffer中
    }
    
    // 处理其他可能的特殊事件
    if (chunk.startsWith('event:') || chunk.startsWith(':')) {
      console.log('收到SSE事件信息或注释:', chunk);
      return; // 同样直接返回，不累积
    }
    
    if (chunk.startsWith('data: ')) {
      const jsonStr = chunk.slice(6);
      try {
        const data = JSON.parse(jsonStr);
        console.log('解析出JSON数据:', data);
        
        if (data.event === 'error') {
          console.error('收到错误事件:', data);
          if (onError) onError(data);
        } else {
          console.log(`收到事件: ${data.event || 'unknown'}`);
          if (onMessage) onMessage(data);
        }
      } catch (e) {
        console.error('解析SSE数据失败:', e, jsonStr);
        if (onError) onError({ message: '解析响应失败', rawData: jsonStr, error: e.toString() });
      }
    } else if (chunk.trim() !== '') { // 只在非空白块时记录警告
      console.warn('收到未识别的SSE数据块:', chunk);
    }
  };
  
  reader.read().then(processStreamResult).catch(handleReadError);
};

/**
 * 获取应用参数
 * @param {string} appType - 应用类型，默认为文旅助手
 * @returns {Promise} - 返回一个Promise，resolves为应用参数
 */
export const getParameters = async (appType = APP_TYPES.TRAVEL) => {
  const url = `${API_BASE_URL}/parameters`;
  const { apiKey } = getCredentials(appType);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `获取参数失败 (${response.status})`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取参数失败:', error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到服务器，请检查网络连接');
    }
    
    throw error;
  }
}; 