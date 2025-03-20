<template>
  <div class="photo-restoration p-6 md:p-8 w-full">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">智能视频</h1>
      <p class="text-gray-400">通过文字描述或参考图片生成高质量短视频（功能来自智谱AI）</p>
    </div>
    
    <!-- 功能选择区 -->
    <div class="mb-8">
      <div class="bg-gray-900/50 p-6 rounded-xl">
        <h2 class="text-xl font-semibold text-white mb-4">选择功能</h2>
        <div class="grid grid-cols-2 gap-4">
          <button 
            @click="selectFunction('text-to-video')"
            class="p-4 rounded-lg text-center transition-all" 
            :class="selectedFunction === 'text-to-video' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'"
          >
            <i class="fas fa-comment-alt text-2xl mb-2"></i>
            <div class="font-medium">文生视频</div>
            <div class="text-xs mt-1 opacity-80">通过文本描述生成视频</div>
          </button>
          
          <button 
            @click="selectFunction('image-to-video')"
            class="p-4 rounded-lg text-center transition-all" 
            :class="selectedFunction === 'image-to-video' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'"
          >
            <i class="fas fa-image text-2xl mb-2"></i>
            <div class="font-medium">图生视频</div>
            <div class="text-xs mt-1 opacity-80">为静态图片添加动画效果</div>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 文生视频功能区域 -->
    <div v-if="selectedFunction === 'text-to-video'" class="mb-8">
      <div class="bg-gray-900/50 p-6 rounded-xl">
        <h2 class="text-xl font-semibold text-white mb-4 flex justify-between items-center">
          <span>文本生成视频</span>
          <span v-if="isGenerating && selectedFunction === 'text-to-video'" class="text-sm text-primary">
            <i class="fas fa-spinner fa-spin mr-1"></i> 处理中...
          </span>
        </h2>
        
        <div class="mb-5">
          <label for="textPrompt" class="block text-white mb-2">视频描述文本</label>
          <textarea 
            id="textPrompt" 
            v-model="textPrompt" 
            rows="4" 
            class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="请详细描述您想生成的视频内容，例如：夕阳下，一条小船在平静的湖面上缓缓前行，四周是金色的光芒和远处的山脉。"
          ></textarea>
        </div>
        
        <div class="mb-5">
          <label for="textVideoWithAudio" class="block text-white mb-2">生成音频</label>
          <select 
            id="textVideoWithAudio" 
            v-model="textVideoWithAudio" 
            class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option :value="true">是</option>
            <option :value="false">否</option>
          </select>
        </div>
        
        <!-- 文生视频生成按钮 -->
        <button 
          @click="generateTextVideo" 
          class="w-full px-6 py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg text-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed relative"
          :disabled="!textPrompt.trim() || isGenerating"
        >
          <span v-if="!(isGenerating && selectedFunction === 'text-to-video')" class="flex items-center justify-center">
            <i class="fas fa-play-circle mr-2"></i> 开始生成视频
          </span>
          <span v-else class="flex items-center justify-center">
            <i class="fas fa-spinner fa-spin mr-2"></i> 生成中...
          </span>
        </button>
      </div>
    </div>
    
    <!-- 图生视频功能区域 -->
    <div v-if="selectedFunction === 'image-to-video'" class="mb-8">
      <div class="bg-gray-900/50 p-6 rounded-xl">
        <h2 class="text-xl font-semibold text-white mb-4 flex justify-between items-center">
          <span>图像生成视频</span>
          <span v-if="isGenerating && selectedFunction === 'image-to-video'" class="text-sm text-primary">
            <i class="fas fa-spinner fa-spin mr-1"></i> 处理中...
          </span>
        </h2>
        
        <!-- 上传组件 -->
        <div 
          class="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors relative mb-5"
          @click="triggerFileInput"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onFileDrop"
          :class="{'border-primary': isDragging}"
        >
          <input 
            type="file" 
            ref="fileInput" 
            class="hidden" 
            accept="image/*" 
            @change="handleImageSelect"
          >
          
          <div v-if="!imagePreview">
            <i class="fas fa-cloud-upload-alt text-4xl text-gray-500 mb-4"></i>
            <p class="text-gray-400 mb-2">点击或拖拽图片到此处上传</p>
            <p class="text-gray-600 text-sm">支持 JPG、PNG、BMP 格式</p>
          </div>
          
          <div v-else class="relative">
            <img :src="imagePreview" class="max-h-80 max-w-full mx-auto rounded-lg">
            <button 
              @click.stop="clearImage" 
              class="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        
        <div v-if="imagePreview" class="mb-5">
          <label for="imagePrompt" class="block text-white mb-2">辅助文本描述 (可选)</label>
          <textarea 
            id="imagePrompt" 
            v-model="imagePrompt" 
            rows="2" 
            class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="可以添加额外的文本描述，帮助生成更符合您期望的视频效果"
          ></textarea>
        </div>
        
        <div v-if="imagePreview" class="mb-5">
          <label for="imageVideoWithAudio" class="block text-white mb-2">生成音频</label>
          <select 
            id="imageVideoWithAudio" 
            v-model="imageVideoWithAudio" 
            class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option :value="true">是</option>
            <option :value="false">否</option>
          </select>
        </div>
        
        <!-- 图生视频生成按钮 -->
        <button 
          @click="generateImageVideo" 
          class="w-full px-6 py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg text-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed relative"
          :disabled="!imagePreview || isGenerating"
        >
          <span v-if="!(isGenerating && selectedFunction === 'image-to-video')" class="flex items-center justify-center">
            <i class="fas fa-play-circle mr-2"></i> 开始生成视频
          </span>
          <span v-else class="flex items-center justify-center">
            <i class="fas fa-spinner fa-spin mr-2"></i> 生成中...
          </span>
          <span v-if="!imagePreview" class="absolute -bottom-7 left-0 w-full text-sm text-gray-400">
            请先上传图片
          </span>
        </button>
      </div>
    </div>
    
    <!-- 消息提示区 -->
    <div class="mb-4">
      <div v-if="errorMsg" class="bg-red-500/20 text-red-400 p-4 rounded-lg mb-4">
        <i class="fas fa-exclamation-circle mr-2"></i> {{ errorMsg }}
      </div>
      <div v-if="successMsg" class="bg-green-500/20 text-green-400 p-4 rounded-lg mb-4">
        <i class="fas fa-check-circle mr-2"></i> {{ successMsg }}
      </div>
    </div>
    
    <!-- 结果展示区 -->
    <div v-if="videoUrl" class="mb-8">
      <div class="bg-gray-900/50 p-6 rounded-xl">
        <h2 class="text-xl font-semibold text-white mb-4">处理结果</h2>
        
        <div>
          <video 
            :src="videoUrl" 
            controls 
            class="w-full h-auto rounded-lg max-h-96 mx-auto"
          ></video>
          
          <div class="mt-6 flex flex-col md:flex-row gap-4 justify-center">
            <a 
              :href="videoUrl" 
              download="generated-video.mp4" 
              class="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors text-center"
            >
              <i class="fas fa-download mr-2"></i> 下载视频
            </a>
            <button 
              @click="resetAll" 
              class="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <i class="fas fa-redo mr-2"></i> 重新开始
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 功能说明 -->
    <div class="mb-8">
      <div class="bg-gray-900/50 p-6 rounded-xl">
        <h2 class="text-xl font-semibold text-white mb-4">功能说明</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <h3 class="text-white mb-2 flex items-center">
              <i class="fas fa-comment-alt text-primary mr-2"></i> 文生视频
            </h3>
            <p class="text-gray-400 text-sm">
              文生视频功能利用AI技术将您输入的文字描述转化为高质量视频内容。您只需输入详细的视频场景描述，选择偏好的风格和时长，系统将为您生成流畅、自然的短视频。适用于创意探索、短视频创作、概念展示等多种场景。
            </p>
          </div>
          
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <h3 class="text-white mb-2 flex items-center">
              <i class="fas fa-image text-primary mr-2"></i> 图生视频
            </h3>
            <p class="text-gray-400 text-sm">
              图生视频功能可以为静态图像添加自然的动态效果，创造出生动的短视频。只需上传一张图片，选择动画程度和时长，系统将自动分析图像内容并添加适合的动态效果。适用于为照片增添生命力、制作简单动画、社交媒体内容创作等场景。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// 功能选择状态
const selectedFunction = ref('text-to-video'); // 默认选择文生视频
const selectFunction = (func) => {
  selectedFunction.value = func;
};

// 文生视频变量
const textPrompt = ref('');
const textVideoWithAudio = ref(true);    // 是否生成音频选择

// 图生视频变量
const fileInput = ref(null);
const imagePreview = ref('');
const imageFile = ref(null);
const imagePrompt = ref('');
const imageVideoWithAudio = ref(true);    // 是否生成音频选择
const isDragging = ref(false);

// 处理状态
const isGenerating = ref(false);
const videoUrl = ref('');
const errorMsg = ref('');
const successMsg = ref('');

// 触发文件选择
const triggerFileInput = () => {
  if (!imagePreview.value) {
    fileInput.value.click();
  }
};

// 处理图片选择
const handleImageSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    processFile(file);
  }
};

// 处理文件拖放
const onFileDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (file && file.type.match('image.*')) {
    processFile(file);
  }
};

// 处理上传的文件
const processFile = (file) => {
  if (!file) return;
  
  if (file.size > 10 * 1024 * 1024) {
    errorMsg.value = '图片大小不能超过10MB';
    setTimeout(() => { errorMsg.value = '' }, 3000);
    return;
  }
  
  errorMsg.value = '';
  imageFile.value = file;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
  };
  reader.onerror = () => {
    errorMsg.value = '图片读取失败，请重试';
    setTimeout(() => { errorMsg.value = '' }, 3000);
  };
  reader.readAsDataURL(file);
};

// 清除图片
const clearImage = (event) => {
  if (event) {
    event.stopPropagation();
  }
  imageFile.value = null;
  imagePreview.value = '';
};

// 获取Base64图像数据
const getBase64FromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};

// 计算属性
const buttonText = computed(() => {
  if (selectedFunction.value === 'text-to-video') {
    return '生成视频';
  } else if (selectedFunction.value === 'image-to-video') {
    return '生成视频';
  }
  return '开始处理';
});

const canGenerate = computed(() => {
  if (selectedFunction.value === 'text-to-video') {
    return textPrompt.value.trim().length > 0;
  } else if (selectedFunction.value === 'image-to-video') {
    return imagePreview.value !== '';
  }
  return false;
});

// GLM API配置
const API_KEY = import.meta.env.VITE_ZHIPU_API_KEY;
// 更新为正确的API端点
const API_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';
const API_ENDPOINT = `${API_BASE_URL}/videos/generations`;
const API_ASYNC_RESULT = `${API_BASE_URL}/async-result`;

// 根据方向获取分辨率
const getResolutionByOrientation = (orientation) => {
  return orientation === 'landscape' ? '1280x960' : '960x1280';
};

// 文生视频生成处理
const generateTextVideo = async () => {
  if (!textPrompt.value.trim() || isGenerating.value) return;
  
  errorMsg.value = '';
  successMsg.value = '';
  videoUrl.value = '';
  isGenerating.value = true;
  
  try {
    console.log('开始调用文生视频API');
    
    // 构建请求体
    const requestBody = {
      model: "cogvideox-flash",
      prompt: textPrompt.value,
      with_audio: textVideoWithAudio.value
      // 移除不需要的参数: quality, size, fps
    };
    
    console.log('请求参数:', JSON.stringify(requestBody));
    
    // 发送视频生成请求
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('API响应状态:', response.status);
    
    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = errorData.message || errorData.error || JSON.stringify(errorData);
        console.error('API错误详情:', errorData);
      } catch (e) {
        errorText = await response.text();
        console.error('API响应文本:', errorText);
      }
      throw new Error(`视频生成失败(${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log('API响应数据:', data);
    
    // 检查响应格式
    if (data.video_url) {
      // 直接返回了视频URL
      videoUrl.value = data.video_url;
      successMsg.value = '视频生成成功！';
    } else if (data.id || data.task_id || data.request_id) {
      // 返回了任务ID，需要轮询获取结果
      const taskId = data.id || data.task_id || data.request_id;
      successMsg.value = '视频生成任务已提交，生成可能需要几分钟，请稍等...';
      await pollTaskStatus(taskId);
    } else {
      throw new Error('API响应格式不符合预期：' + JSON.stringify(data));
    }
  } catch (error) {
    console.error('视频生成出错:', error);
    errorMsg.value = `生成失败: ${error.message || '请稍后重试'}`;
  } finally {
    isGenerating.value = false;
  }
};

// 添加轮询任务状态的函数
const pollTaskStatus = async (taskId) => {
  const maxRetries = 60; // 最多等待3分钟
  const interval = 3000; // 3秒轮询一次
  let retries = 0;
  
  const checkStatus = async () => {
    try {
      // 使用正确的任务查询端点
      const statusUrl = `${API_ASYNC_RESULT}/${taskId}`;
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`获取任务状态失败: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('任务状态:', data);
      
      // 检查任务状态
      if (data.task_status === 'SUCCESS' || data.status === 'SUCCESS') {
        // 任务完成，获取视频URL
        if (data.video_url || (data.video_result && data.video_result.length > 0 && data.video_result[0].url)) {
          videoUrl.value = data.video_url || data.video_result[0].url;
          successMsg.value = '视频生成成功！';
          return true;
        }
      } else if (data.task_status === 'FAIL' || data.status === 'FAIL') {
        // 任务失败
        throw new Error(`任务处理失败: ${data.error || '未知错误'}`);
      }
      // 其他状态（PROCESSING等）继续等待
    } catch (error) {
      console.error('轮询任务状态出错:', error);
      errorMsg.value = `获取视频失败: ${error.message}`;
      return true; // 停止轮询
    }
    return false;
  };
  
  while (retries < maxRetries) {
    const isDone = await checkStatus();
    if (isDone) break;
    
    await new Promise(resolve => setTimeout(resolve, interval));
    retries++;
    
    // 更新等待消息以显示进度
    successMsg.value = `视频生成任务进行中...(${retries}/${maxRetries})`;
  }
  
  if (retries >= maxRetries && !videoUrl.value) {
    errorMsg.value = '视频生成时间较长，可能仍在处理中，请稍后查看';
    successMsg.value = '';
  }
};

// 图生视频生成处理
const generateImageVideo = async () => {
  if (!imageFile.value || isGenerating.value) return;
  
  errorMsg.value = '';
  successMsg.value = '';
  videoUrl.value = '';
  isGenerating.value = true;
  
  try {
    console.log('开始调用图生视频API');
    // 获取图片base64
    const imageBase64 = await getBase64FromFile(imageFile.value);
    
    // 构建请求体 - 和文生视频使用相同的API，只是增加image_url参数
    const requestBody = {
      model: "cogvideox-flash",
      image_url: `data:image/${imageFile.value.type.split('/')[1]};base64,${imageBase64}`,
      prompt: imagePrompt.value.trim() || undefined, // 如果为空则不发送
      with_audio: imageVideoWithAudio.value
      // 移除不需要的参数: quality, size, fps
    };
    
    console.log('请求参数(不含图像数据):', {...requestBody, image_url: '[IMAGE_DATA]'});
    
    // 发送图生视频请求 - 使用相同的API端点
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('API响应状态:', response.status);
    
    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = errorData.message || errorData.error || JSON.stringify(errorData);
        console.error('API错误详情:', errorData);
      } catch (e) {
        errorText = await response.text();
        console.error('API响应文本:', errorText);
      }
      throw new Error(`视频生成失败(${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log('API响应数据:', data);
    
    // 检查响应格式 - 与文生视频相同的处理逻辑
    if (data.video_url) {
      // 直接返回了视频URL
      videoUrl.value = data.video_url;
      successMsg.value = '视频生成成功！';
    } else if (data.id || data.task_id || data.request_id) {
      // 返回了任务ID，需要轮询获取结果
      const taskId = data.id || data.task_id || data.request_id;
      successMsg.value = '视频生成任务已提交，生成可能需要几分钟，请稍等...';
      await pollTaskStatus(taskId);
    } else {
      throw new Error('API响应格式不符合预期：' + JSON.stringify(data));
    }
  } catch (error) {
    console.error('视频生成出错:', error);
    errorMsg.value = `生成失败: ${error.message || '请稍后重试'}`;
  } finally {
    isGenerating.value = false;
  }
};

// 重置所有状态
const resetAll = () => {
  textPrompt.value = '';
  imagePreview.value = '';
  imageFile.value = null;
  imagePrompt.value = '';
  videoUrl.value = '';
  errorMsg.value = '';
  successMsg.value = '';
  
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

onMounted(() => {
  // 在组件加载时确保状态正确
  resetAll();
});
</script> 

<style scoped>
/* 全局样式覆盖，使用深色主题 */
.photo-restoration {
  background-color: #121212;
  min-height: 100vh;
}

.bg-primary, .text-primary {
  --primary-color: #3465a4;
}

.bg-primary {
  background-color: var(--primary-color);
}

.text-primary {
  color: var(--primary-color);
}

.from-primary {
  --tw-gradient-from: var(--primary-color);
}

.border-primary {
  border-color: var(--primary-color);
}

.focus\:ring-primary:focus {
  --tw-ring-color: rgba(52, 101, 164, 0.5);
}

.focus\:border-primary:focus {
  border-color: var(--primary-color);
}
</style> 