/**
 * 百度图像处理API服务
 * 
 * 提供图像修复和清晰度增强功能
 * API文档: https://ai.baidu.com/ai-doc/IMAGEPROCESS/ok3bclome
 */

// API密钥从环境变量中获取
const API_KEY = import.meta.env.VITE_BAIDU_API_KEY || '';
const SECRET_KEY = import.meta.env.VITE_BAIDU_SECRET_KEY || '';
// 直接从环境变量读取access_token
const ENV_ACCESS_TOKEN = import.meta.env.VITE_BAIDU_ACCESS_TOKEN || '';

// 如果环境变量中有token则使用，否则使用本地变量
let ACCESS_TOKEN = ENV_ACCESS_TOKEN || '24.cc8a2a851eeee35290a13e9bad0be97e.2592000.1718528775.282335-41387887';
let TOKEN_EXPIRE_TIME = Date.now() + 29 * 24 * 60 * 60 * 1000; // 默认有效期为30天

/**
 * 检查API是否可用
 */
export function isApiAvailable() {
  // 如果已经有access_token，则认为可用
  if (ACCESS_TOKEN) return true;
  // 否则检查是否有API_KEY和SECRET_KEY
  return API_KEY && SECRET_KEY;
}

/**
 * 手动设置Access Token
 * 供用户手动设置从百度平台获取的token
 */
export function setAccessToken(token, expireInSeconds = 2592000) {
  ACCESS_TOKEN = token;
  TOKEN_EXPIRE_TIME = Date.now() + (expireInSeconds * 1000);
  console.log('百度API token已手动设置，有效期至:', new Date(TOKEN_EXPIRE_TIME).toLocaleString());
  return true;
}

/**
 * 获取访问令牌
 * 参考文档: https://ai.baidu.com/ai-doc/REFERENCE/Ck3dwjhhu
 */
export async function getAccessToken() {
  // 如果已有有效token，直接返回
  if (ACCESS_TOKEN && Date.now() < TOKEN_EXPIRE_TIME) {
    return ACCESS_TOKEN;
  }
  
  // 如果token过期，提示用户需要手动更新
  if (ACCESS_TOKEN && Date.now() >= TOKEN_EXPIRE_TIME) {
    console.error('百度API token已过期，请更新.env文件中的VITE_BAIDU_ACCESS_TOKEN');
    console.error(`获取新token请访问: https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`);
    throw new Error('百度API token已过期，请更新.env文件中的VITE_BAIDU_ACCESS_TOKEN');
  }
  
  if (!API_KEY || !SECRET_KEY) {
    throw new Error('API密钥未配置，请联系管理员');
  }
  
  throw new Error('请手动获取百度API token并更新.env文件中的VITE_BAIDU_ACCESS_TOKEN');
}

/**
 * 图像修复API - 去除图片中不需要的遮挡物或水印
 * 
 * @param {string} imageUrl - 原始图片的base64或URL
 * @param {string} maskUrl - 标记图片的base64或URL
 * @returns {Promise<string>} 修复后的图像base64
 */
export async function imageInpainting(imageUrl, maskUrl) {
  console.log('===== 图像修复API调用开始 =====');
  
  if (!maskUrl) {
    throw new Error('未提供有效的掩码图像，请在原图上标记需要修复的区域');
  }
  
  // 获取token
  const token = await getAccessToken();
  
  // 确保base64数据不包含前缀
  const extractPureBase64 = (url) => {
    if (!url) return '';
    if (url.startsWith('data:image')) {
      const parts = url.split('base64,');
      return parts.length > 1 ? parts[1] : '';
    }
    return url;
  };

  // 提取并验证base64数据
  const imageBase64 = extractPureBase64(imageUrl);
  const maskBase64 = extractPureBase64(maskUrl);
  
  if (!imageBase64) {
    throw new Error('无效的图像数据');
  }
  
  // 检查mask是否有效
  if (!maskBase64 || maskBase64.length < 100) {
    throw new Error('掩码图像无效或为空，请确保标记了需要修复的区域');
  }

  // 打印详细调试信息
  console.log({
    '原图数据类型': typeof imageBase64,
    '掩码数据类型': typeof maskBase64,
    '原图数据长度': imageBase64.length,
    '掩码数据长度': maskBase64.length,
    '原图前20字符': imageBase64.substring(0, 20),
    '掩码前20字符': maskBase64.substring(0, 20)
  });

  // 根据百度API文档构建请求
  // 文档地址: https://cloud.baidu.com/doc/IMAGEPROCESS/s/ok3bclome
  const apiUrl = `https://aip.baidubce.com/rest/2.0/image-process/v1/inpainting?access_token=${token}`;
  
  // 构建请求体 - 根据文档修改为JSON格式
  // rectangle是必需参数，提供一个很小的区域以满足要求
  const requestBody = {
    image: imageBase64,
    mask: maskBase64,
    rectangle: [{ 'width': 10, 'top': 10, 'height': 10, 'left': 10 }]
  };
  
  console.log('请求参数设置完成');

  try {
    console.log('调用百度图像修复API...');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // 打印响应状态和头信息进行调试
    console.log('响应状态:', response.status, response.statusText);
    
    // 获取响应内容
    const responseText = await response.text();
    console.log('原始响应:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
    
    // 尝试解析JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('响应解析失败:', parseError);
      throw new Error(`API响应格式错误: ${responseText.substring(0, 100)}`);
    }
    
    console.log('解析后的响应:', data);
    
    // 检查API错误
    if (data.error_code) {
      console.error('百度API返回错误:', data);
      throw new Error(`图像修复失败 (${data.error_code}): ${data.error_msg}`);
    }
    
    // 验证返回的图像数据
    if (!data?.image) {
      console.error('API未返回图像数据:', data);
      throw new Error('图像修复失败: 未返回处理结果');
    }

    console.log('===== 图像修复API调用完成 =====');
    return `data:image/jpeg;base64,${data.image}`;
  } catch (error) {
    console.error('图像修复API调用失败:', error);
    throw error;
  }
}

/**
 * 图像清晰度增强API - 提升图片的清晰度
 * 
 * @param {string} imageUrl - 原始图片的base64或URL
 * @returns {Promise<string>} 增强后的图像base64
 */
export async function imageQualityEnhance(imageUrl) {
  const token = await getAccessToken();
  
  // 确保base64数据不包含前缀
  const extractPureBase64 = (url) => {
    const parts = url.split('base64,');
    return parts.length > 1 ? parts[1] : url;
  };
  
  const imageBase64 = extractPureBase64(imageUrl);
  
  // 清晰度增强API，根据文档：https://cloud.baidu.com/doc/IMAGEPROCESS/s/5k4i6mzqk
  const apiUrl = `https://aip.baidubce.com/rest/2.0/image-process/v1/image_definition_enhance?access_token=${token}`;
  
  // 添加调试日志
  console.debug('清晰度增强请求详情:', {
    imageLength: imageBase64.length,
    apiEndpoint: 'image_definition_enhance'
  });
  
  const params = new URLSearchParams();
  params.append('image', imageBase64);
  
  try {
    console.log('开始调用百度图像清晰度增强API...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params
    });
    
    const data = await response.json();
    console.log('百度API响应:', data);
    
    if (data.error_code) {
      console.error('API返回错误:', data);
      throw new Error(`图像清晰度增强失败: ${data.error_msg}`);
    }
    
    if (!data?.image) {
      console.error('API未返回图像数据:', data);
      throw new Error('图像清晰度增强失败: 未返回处理结果');
    }
    
    return `data:image/jpeg;base64,${data.image}`;
  } catch (error) {
    console.error('图像清晰度增强处理失败:', error);
    throw error;
  }
}

/**
 * 将Canvas转换为base64
 * 用于获取掩码数据
 * 
 * @param {HTMLCanvasElement} canvas - Canvas元素
 * @returns {string} base64编码的图像
 */
export function canvasToBase64(canvas) {
  return canvas.toDataURL('image/jpeg', 0.8);
}

/**
 * 将Canvas转换为适合百度图像修复API的掩码
 * 百度API要求掩码是黑白图像，黑色部分表示需要修复的区域
 * 
 * @param {HTMLCanvasElement} canvas - 包含红色标记的Canvas
 * @returns {string} 处理后的base64编码掩码图像
 */
export function createMaskFromCanvas(canvas) {
  console.log('====== 开始生成掩码图像 ======');
  
  // 创建新的Canvas用于生成黑白掩码
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  
  // 输出Canvas尺寸
  console.log(`Canvas尺寸: ${canvas.width}x${canvas.height}`);
  
  // 获取上下文
  const maskCtx = maskCanvas.getContext('2d');
  
  // 首先绘制白色背景
  maskCtx.fillStyle = 'white';
  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
  
  // 获取原始Canvas上下文
  const sourceCtx = canvas.getContext('2d', { willReadFrequently: true });
  
  // 获取原始图像数据
  let imageData;
  try {
    imageData = sourceCtx.getImageData(0, 0, canvas.width, canvas.height);
    console.log(`获取到图像数据: ${imageData.width}x${imageData.height}, 共${imageData.data.length}字节`);
  } catch (error) {
    console.error('获取Canvas图像数据失败:', error);
    throw new Error('无法从Canvas获取图像数据');
  }
  
  const data = imageData.data;
  let hasMarkedArea = false;
  let markedPixelsCount = 0;
  
  // 创建新的图像数据，完全白色背景
  const maskImageData = maskCtx.createImageData(canvas.width, canvas.height);
  const maskData = maskImageData.data;
  
  // 初始化为全白
  for (let i = 0; i < maskData.length; i += 4) {
    maskData[i] = 255;     // R
    maskData[i+1] = 255;   // G
    maskData[i+2] = 255;   // B
    maskData[i+3] = 255;   // Alpha
  }
  
  // 检测红色像素并在掩码上对应位置绘制黑色
  for (let i = 0; i < data.length; i += 4) {
    // 检测纯红色像素 (R值高，G和B值低)
    if (data[i] > 200 && data[i+1] < 50 && data[i+2] < 50) {
      // 在掩码图像中设置为黑色
      maskData[i] = 0;      // R
      maskData[i+1] = 0;    // G
      maskData[i+2] = 0;    // B
      maskData[i+3] = 255;  // Alpha (完全不透明)
      
      hasMarkedArea = true;
      markedPixelsCount++;
    }
  }
  
  // 将处理后的数据放回掩码Canvas
  maskCtx.putImageData(maskImageData, 0, 0);
  
  if (!hasMarkedArea) {
    console.warn('警告: 未检测到标记区域，掩码将全为白色');
    return null;
  } else {
    console.log(`成功检测到红色标记区域: ${markedPixelsCount}个像素点已标记为黑色`);
  }
  
  // 使用PNG格式确保不会丢失黑白信息（无压缩损失）
  const base64Data = maskCanvas.toDataURL('image/png', 1.0);
  console.log(`生成的掩码图像数据长度: ${base64Data.length}`);
  
  console.log('====== 掩码图像生成完成 ======');
  return base64Data;
}

// 在imageInpainting函数中添加参数验证
const validateImageParams = (image, mask) => {
  // 验证base64有效性
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  if (!base64Regex.test(image)) throw new Error('原始图片base64格式错误');
  if (!base64Regex.test(mask)) throw new Error('掩码图片base64格式错误');
  
  // 验证图片尺寸（示例验证，具体限制参考百度文档）
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (image.length > maxSize) throw new Error('原始图片大小超过10MB限制');
  if (mask.length > maxSize) throw new Error('掩码图片大小超过10MB限制');
}; 