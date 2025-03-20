<template>
  <div class="text-to-image p-6 md:p-8 w-full">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">智能生图</h1>
      <p class="text-gray-400">通过文字描述生成高质量图片（功能来自智谱AI）</p>
    </div>
    
    <!-- 功能区域 -->
    <div class="mb-8">
      <div class="bg-gray-900/50 p-6 rounded-xl">
        <h2 class="text-xl font-semibold text-white mb-4 flex justify-between items-center">
          <span>文本生成图像</span>
          <span v-if="isGenerating" class="text-sm text-primary">
            <i class="fas fa-spinner fa-spin mr-1"></i> 处理中...
          </span>
        </h2>
        
        <div class="mb-5">
          <label for="textPrompt" class="block text-white mb-2">图像描述文本</label>
          <textarea 
            id="textPrompt" 
            v-model="textPrompt" 
            rows="4" 
            class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="请详细描述您想生成的图像内容，例如：一只穿着宇航服的猫咪在太空中漂浮，背景是蓝色的地球和闪烁的星星"
          ></textarea>
        </div>
        
        <div class="mb-5">
          <label for="imageSize" class="block text-white mb-2">图像尺寸</label>
          <select 
            id="imageSize" 
            v-model="imageSize" 
            class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="1024x1024">方形 (1024×1024)</option>
            <option value="768x1344">竖版 (768×1344)</option>
            <option value="864x1152">竖版 (864×1152)</option>
            <option value="1344x768">横版 (1344×768)</option>
            <option value="1152x864">横版 (1152×864)</option>
            <option value="1440x720">横版 (1440×720)</option>
            <option value="720x1440">竖版 (720×1440)</option>
          </select>
        </div>
        
        <!-- 生成按钮 -->
        <button 
          @click="generateImage" 
          class="w-full px-6 py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg text-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed relative"
          :disabled="!textPrompt.trim() || isGenerating"
        >
          <span v-if="!isGenerating" class="flex items-center justify-center">
            <i class="fas fa-magic mr-2"></i> 开始生成图像
          </span>
          <span v-else class="flex items-center justify-center">
            <i class="fas fa-spinner fa-spin mr-2"></i> 生成中...
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
    <div v-if="imageUrl" class="mb-8">
      <div class="bg-gray-900/50 p-6 rounded-xl">
        <h2 class="text-xl font-semibold text-white mb-4">处理结果</h2>
        
        <div>
          <img 
            :src="imageUrl" 
            alt="生成的图像" 
            class="w-full h-auto rounded-lg max-h-[70vh] max-w-full mx-auto object-contain"
          />
          
          <div class="mt-6 flex flex-col md:flex-row gap-4 justify-center">
            <a 
              :href="imageUrl" 
              download="generated-image.jpg" 
              class="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors text-center"
            >
              <i class="fas fa-download mr-2"></i> 下载图像
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
        
        <div class="bg-gray-800/50 p-4 rounded-lg">
          <h3 class="text-white mb-2 flex items-center">
            <i class="fas fa-info-circle text-primary mr-2"></i> 使用提示
          </h3>
          <div class="text-gray-400 text-sm space-y-3">
            <p>
              文本生成图像技术可以将您输入的文字描述转化为高质量图片。为获得更好的效果，建议：
            </p>
            <ol class="list-decimal pl-5 space-y-1">
              <li>使用详细的描述：包括场景、主体、颜色、风格等细节</li>
              <li>指定图像风格：如油画、水彩画、照片风格、动漫风格等</li>
              <li>添加光线描述：如"在日落的金色光芒中"或"在柔和的月光下"</li>
              <li>标明构图：如"近景"、"全景"、"侧面视角"等</li>
            </ol>
            <p>
              图像生成可能需要几秒到几十秒不等，请耐心等待。生成的图像链接有效期为30天，请及时保存。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 参数变量
const textPrompt = ref('');
const imageSize = ref('1024x1024');

// 处理状态
const isGenerating = ref(false);
const imageUrl = ref('');
const errorMsg = ref('');
const successMsg = ref('');

// GLM API配置（复用视频API的密钥）
const API_KEY = import.meta.env.VITE_ZHIPU_API_KEY;
const API_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/images/generations';

// 生成图像处理
const generateImage = async () => {
  if (!textPrompt.value.trim() || isGenerating.value) return;
  
  errorMsg.value = '';
  successMsg.value = '';
  imageUrl.value = '';
  isGenerating.value = true;
  
  try {
    console.log('开始调用生成图像API');
    
    // 构建请求体
    const requestBody = {
      model: "cogview-4-250304", // 智谱AI图像生成模型
      prompt: textPrompt.value,
      size: imageSize.value,
      user_id: "aurelius_user_" + Math.random().toString(36).substring(2, 10) // 添加用户ID参数
    };
    
    console.log('请求参数:', JSON.stringify(requestBody));
    
    // 发送图像生成请求
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
      throw new Error(`图像生成失败(${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log('API响应数据:', data);
    
    // 根据API文档，结果在data[0].url中
    if (data && data.data && data.data.length > 0 && data.data[0].url) {
      imageUrl.value = data.data[0].url;
      successMsg.value = '图像生成成功！';
    } else {
      throw new Error('API响应格式不符合预期：' + JSON.stringify(data));
    }
  } catch (error) {
    console.error('图像生成出错:', error);
    errorMsg.value = `生成失败: ${error.message || '请稍后重试'}`;
  } finally {
    isGenerating.value = false;
  }
};

// 重置所有状态
const resetAll = () => {
  textPrompt.value = '';
  imageUrl.value = '';
  errorMsg.value = '';
  successMsg.value = '';
};

onMounted(() => {
  // 在组件加载时确保状态正确
  resetAll();
});
</script>

<style scoped>
/* 全局样式覆盖，使用深色主题 */
.text-to-image {
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