/**
 * AI相关服务接口
 */
import { fetchAPI } from './api'

/**
 * 发送聊天消息
 * @param {string} message - 用户消息内容
 * @param {string} conversationId - 会话ID (可选)
 * @returns {Promise} - 聊天响应
 */
export const sendChatMessage = async (message, conversationId = null) => {
  const payload = {
    message,
    ...(conversationId && { conversationId })
  }
  
  return fetchAPI('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

/**
 * 获取历史会话列表
 * @returns {Promise} - 会话列表
 */
export const getConversations = async () => {
  return fetchAPI('/ai/conversations')
}

/**
 * 获取指定会话的消息
 * @param {string} conversationId - 会话ID
 * @returns {Promise} - 会话消息
 */
export const getConversationMessages = async (conversationId) => {
  return fetchAPI(`/ai/conversations/${conversationId}/messages`)
}

/**
 * 生成AI图像
 * @param {Object} params - 图像生成参数
 * @returns {Promise} - 生成结果
 */
export const generateImage = async (params) => {
  return fetchAPI('/ai/image/generate', {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

/**
 * 编辑AI图像
 * @param {Object} params - 图像编辑参数
 * @returns {Promise} - 编辑结果
 */
export const editImage = async (params) => {
  return fetchAPI('/ai/image/edit', {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

/**
 * 生成AI视频
 * @param {Object} params - 视频生成参数
 * @returns {Promise} - 生成结果
 */
export const generateVideo = async (params) => {
  return fetchAPI('/ai/video/generate', {
    method: 'POST',
    body: JSON.stringify(params)
  })
} 