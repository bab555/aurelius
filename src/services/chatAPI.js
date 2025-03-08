// src/services/chatAPI.js
// 聊天API服务

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const APP_ID = import.meta.env.VITE_APP_ID;
const API_KEY = import.meta.env.VITE_API_KEY;

/**
 * 发送聊天消息
 * @param {string} message - 用户输入的消息
 * @param {string} userId - 用户ID
 * @param {string} conversationId - 会话ID，可选
 * @param {Array} files - 文件列表，可选
 * @returns {Promise} - 返回一个Promise，resolves为文本流
 */
export const sendChatMessage = async (message, userId, conversationId = '', files = []) => {
  const url = `${API_BASE_URL}/chat-messages`;
  
  const payload = {
    query: message,
    user: userId,
    conversation_id: conversationId,
    response_mode: 'streaming',
    inputs: {}
  };
  
  if (files && files.length > 0) {
    payload.files = files;
  }
  
  console.log('发送聊天消息请求:', {
    url,
    headers: {
      Authorization: `Bearer ${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}`,
      'Content-Type': 'application/json',
    },
    payload
  });
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
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
 * @returns {Promise} - 返回一个Promise，resolves为消息列表
 */
export const getConversationMessages = async (userId, conversationId, firstId = null, limit = 20) => {
  const url = new URL(`${API_BASE_URL}/messages`);
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
        'Authorization': `Bearer ${API_KEY}`
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
 * @returns {Promise} - 返回一个Promise，resolves为会话列表
 */
export const getConversations = async (userId, lastId = null, limit = 20) => {
  const url = new URL(`${API_BASE_URL}/conversations`);
  url.searchParams.append('user', userId);
  
  if (lastId) {
    url.searchParams.append('last_id', lastId);
  }
  
  url.searchParams.append('limit', limit.toString());
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
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
 * @param {File} file - 文件对象
 * @param {string} userId - 用户ID
 * @returns {Promise} - 返回一个Promise，resolves为上传结果
 */
export const uploadFile = async (file, userId) => {
  const url = `${API_BASE_URL}/files/upload`;
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user', userId);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `文件上传失败 (${response.status})`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('文件上传失败:', error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到服务器，请检查网络连接');
    } else if (error.message.includes('413')) {
      throw new Error('文件过大，请上传小于15MB的文件');
    }
    
    throw error;
  }
};

/**
 * 停止响应
 * @param {string} taskId - 任务ID
 * @param {string} userId - 用户ID
 * @returns {Promise} - 返回一个Promise
 */
export const stopResponse = async (taskId, userId) => {
  const url = `${API_BASE_URL}/chat-messages/${taskId}/stop`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
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
 * 消息反馈（点赞/踩）
 * @param {string} messageId - 消息ID
 * @param {string} rating - 评分：like, dislike, null(取消)
 * @param {string} userId - 用户ID
 * @param {string} content - 反馈内容
 * @returns {Promise} - 返回一个Promise
 */
export const feedbackMessage = async (messageId, rating, userId, content = '') => {
  const url = `${API_BASE_URL}/messages/${messageId}/feedbacks`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
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
      const errorMessage = errorData.message || `消息反馈失败 (${response.status})`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('消息反馈失败:', error);
    
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
  
  console.log('开始解析SSE响应...');
  
  const processStreamResult = ({ done, value }) => {
    if (done) {
      console.log('SSE流结束');
      if (buffer.trim() !== '') {
        console.log('处理剩余缓冲区:', buffer);
        allContent += buffer;
        processChunk(buffer);
      }
      if (onEnd) onEnd(allContent);
      return;
    }
    
    const chunk = decoder.decode(value, { stream: true });
    console.log('收到原始数据块:', chunk);
    buffer += chunk;
    allContent += chunk; // 累积所有内容
    
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';
    
    console.log(`解析出 ${lines.length} 个消息块，剩余缓冲区长度: ${buffer.length}`);
    
    for (const line of lines) {
      if (line.trim() !== '') {
        processChunk(line);
      }
    }
    
    reader.read().then(processStreamResult).catch(handleReadError);
  };
  
  const handleReadError = (error) => {
    console.error('读取流失败:', error);
    if (onError) onError({ message: '读取响应流失败', error: error.toString() });
  };
  
  const processChunk = (chunk) => {
    console.log('处理数据块:', chunk);
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
    } else {
      console.warn('收到非标准SSE数据块:', chunk);
    }
  };
  
  reader.read().then(processStreamResult).catch(handleReadError);
};

/**
 * 获取应用参数
 * @returns {Promise} - 返回一个Promise，resolves为应用参数
 */
export const getParameters = async () => {
  const url = `${API_BASE_URL}/parameters`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `获取应用参数失败 (${response.status})`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取应用参数失败:', error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到服务器，请检查网络连接');
    }
    
    throw error;
  }
}; 