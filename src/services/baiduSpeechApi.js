/**
 * 百度语音合成API服务
 * 
 * 提供语音合成功能
 * API文档: https://cloud.baidu.com/doc/SPEECH/s/mlbxh7xie
 */

// API密钥从环境变量中获取
const API_KEY = import.meta.env.VITE_BAIDU_SPEECH_API_KEY || '';
const SECRET_KEY = import.meta.env.VITE_BAIDU_SPEECH_SECRET_KEY || '';
// 直接从环境变量读取access_token
const ENV_ACCESS_TOKEN = import.meta.env.VITE_BAIDU_SPEECH_ACCESS_TOKEN || '';

// 使用环境变量中的TOKEN，避免硬编码
let ACCESS_TOKEN = ENV_ACCESS_TOKEN || '';
let TOKEN_EXPIRE_TIME = Date.now() + 29 * 24 * 60 * 60 * 1000; // 默认有效期为30天

/**
 * 检查API是否可用
 */
export function isApiAvailable() {
  return !!ACCESS_TOKEN;
}

/**
 * 语音合成 - 将文本转换为语音
 * 
 * @param {string} text - 需要转换的文本
 * @param {Object} options - 合成参数选项
 * @returns {Promise<string>} 合成后的音频URL (base64编码)
 */
export async function textToSpeech(text, options = {}) {
  if (!text) {
    throw new Error('合成文本不能为空');
  }
  
  if (!isApiAvailable()) {
    throw new Error('语音合成服务不可用，请检查API配置');
  }
  
  // API请求URL
  const apiUrl = `https://tsn.baidu.com/text2audio?tok=${ACCESS_TOKEN}`;
  
  // 默认参数
  const defaultOptions = {
    spd: 5, // 语速，取值0-15，默认5中语速
    pit: 5, // 音调，取值0-15，默认5中音调
    vol: 5, // 音量，取值0-15，默认5中音量
    per: 0, // 发音人，见文档
    aue: 3  // 音频格式：3为mp3格式(默认)； 4为pcm-16k；5为pcm-8k；6为wav
  };
  
  // 合并选项
  const mergedOptions = { ...defaultOptions, ...options };
  
  // 构建请求参数
  const params = new URLSearchParams();
  params.append('tex', encodeURIComponent(text));
  params.append('tok', ACCESS_TOKEN);
  params.append('cuid', 'aurelius_client');
  params.append('ctp', 1);
  params.append('lan', 'zh');
  
  // 添加其他参数
  Object.keys(mergedOptions).forEach(key => {
    params.append(key, mergedOptions[key]);
  });
  
  try {
    console.log('调用百度语音合成API...');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*'
      },
      body: params
    });
    
    // 检查响应类型
    const contentType = response.headers.get('Content-Type');
    
    // 如果返回的是JSON，说明有错误
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      throw new Error(`语音合成失败: ${errorData.err_msg || '未知错误'}`);
    }
    
    // 获取音频数据
    const audioBlob = await response.blob();
    
    // 将Blob转换为base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  } catch (error) {
    console.error('语音合成API调用失败:', error);
    throw error;
  }
}

/**
 * 获取可用的发音人列表
 * @returns {Array} 发音人列表
 */
export function getSpeakers() {
  return [
    { id: 0, name: '普通女声', description: '默认女声' },
    { id: 1, name: '普通男声', description: '男声' },
    { id: 3, name: '度逍遥', description: '男声' },
    { id: 4, name: '度丫丫', description: '女童声' },
    { id: 5003, name: '度逍遥', description: '精品男声' },
    { id: 5004, name: '度丫丫', description: '精品女童声' },
    { id: 5, name: '度小娇', description: '女声' },
    { id: 103, name: '度米朵', description: '可爱女声' },
    { id: 106, name: '度博文', description: '情感男声' },
    { id: 110, name: '度小童', description: '活泼男童' },
    { id: 111, name: '度小萌', description: '情感女声' },
    { id: 5118, name: '度小鹿', description: '温柔女声' }
  ];
} 