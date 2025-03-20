<template>
  <div class="container mx-auto py-8 px-4">
    <h1 class="text-3xl font-bold text-center mb-8 text-primary">智能生图</h1>
    
    <div class="bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto">
      <!-- 功能介绍 -->
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold mb-3">CogView-3-Flash 智能图像生成</h2>
        <p class="text-gray-600 mb-4">
          基于智谱AI的CogView-3-Flash模型，将文字描述转化为精美图像。只需输入文本提示，系统将为您创建独特而精细的图像内容。
        </p>
        <div class="flex flex-wrap gap-2">
          <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">快速生成</span>
          <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">多种风格</span>
          <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">高精度</span>
          <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">中文友好</span>
        </div>
      </div>
      
      <!-- 输入区域 -->
      <div class="p-6">
        <div class="mb-6">
          <label for="prompt" class="block text-gray-700 font-medium mb-2">图像描述</label>
          <textarea 
            id="prompt" 
            v-model="prompt" 
            rows="4" 
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="请描述您想生成的图像，例如：一只金色的猫咪坐在窗台上，窗外是蓝天白云，阳光照射进来，形成温暖的光晕。"
          ></textarea>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label for="style" class="block text-gray-700 font-medium mb-2">图像风格</label>
            <select 
              id="style" 
              v-model="style" 
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="photographic">摄影写实</option>
              <option value="anime">动漫风格</option>
              <option value="oil-painting">油画风格</option>
              <option value="watercolor">水彩画风格</option>
              <option value="sketch">素描风格</option>
              <option value="3d-render">3D渲染</option>
              <option value="pixel-art">像素艺术</option>
            </select>
          </div>
          
          <div>
            <label for="resolution" class="block text-gray-700 font-medium mb-2">图像分辨率</label>
            <select 
              id="resolution" 
              v-model="resolution" 
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="512x512">512x512（标准）</option>
              <option value="768x768">768x768（高清）</option>
              <option value="1024x1024">1024x1024（超清）</option>
              <option value="512x768">512x768（竖向）</option>
              <option value="768x512">768x512（横向）</option>
            </select>
          </div>
        </div>
        
        <div class="mb-6">
          <label for="negative_prompt" class="block text-gray-700 font-medium mb-2">负面提示词 (可选)</label>
          <textarea 
            id="negative_prompt" 
            v-model="negativePrompt" 
            rows="2" 
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="指定您不希望在图像中出现的元素，例如：模糊的，低质量的，变形的"
          ></textarea>
        </div>
        
        <button 
          @click="generateImage" 
          class="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
          :disabled="isGenerating"
        >
          <span v-if="isGenerating" class="inline-block mr-2">
            <i class="fas fa-spinner fa-spin"></i>
          </span>
          {{ isGenerating ? '生成中...' : '生成图像' }}
        </button>
      </div>
      
      <!-- 结果展示区域 -->
      <div v-if="images.length > 0 || errorMsg" class="p-6 border-t border-gray-200">
        <h3 class="text-lg font-semibold mb-4">生成结果</h3>
        
        <div v-if="errorMsg" class="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          {{ errorMsg }}
        </div>
        
        <div v-if="images.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="(image, index) in images" :key="index" class="bg-gray-50 rounded-lg p-2">
            <img :src="image" class="w-full h-auto rounded-lg shadow-md" />
            
            <div class="mt-2 flex justify-end">
              <a 
                :href="image" 
                :download="`generated-image-${index+1}.png`" 
                class="bg-green-600 text-white py-1 px-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center text-sm"
              >
                <i class="fas fa-download mr-1"></i>
                下载
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 使用提示 -->
    <div class="max-w-4xl mx-auto mt-8 bg-blue-50 p-6 rounded-lg">
      <h3 class="text-xl font-semibold mb-3 text-blue-800">使用技巧</h3>
      <ul class="list-disc pl-5 space-y-2 text-blue-800">
        <li>提供详细的描述，包括场景、对象、颜色、光线等元素</li>
        <li>指定艺术风格可以产生不同的视觉效果</li>
        <li>使用负面提示词排除不想要的元素，提高图像质量</li>
        <li>生成的图像仅临时保存，请及时下载保存</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

// 状态变量
const prompt = ref('');
const style = ref('photographic');
const resolution = ref('512x512');
const negativePrompt = ref('');
const isGenerating = ref(false);
const images = ref([]);
const errorMsg = ref('');

// GLM API配置
const API_KEY = import.meta.env.VITE_ZHIPU_API_KEY;
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/images/cogview-3-flash';

// 生成图像函数
async function generateImage() {
  if (!prompt.value.trim()) {
    errorMsg.value = '请输入图像描述';
    return;
  }
  
  errorMsg.value = '';
  images.value = [];
  isGenerating.value = true;
  
  try {
    // 解析分辨率
    const [width, height] = resolution.value.split('x').map(Number);
    
    // 构建API请求
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        prompt: prompt.value,
        negative_prompt: negativePrompt.value,
        style: style.value,
        n: 2, // 生成2张图片
        width: width,
        height: height,
        seed: Math.floor(Math.random() * 1000000)
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '图像生成失败，请稍后重试');
    }
    
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      // 提取图像URL
      images.value = data.data.map(item => item.url);
    } else {
      throw new Error('未能获取图像URL');
    }
  } catch (error) {
    console.error('图像生成出错:', error);
    errorMsg.value = `生成失败: ${error.message || '请稍后重试'}`;
  } finally {
    isGenerating.value = false;
  }
}
</script>

<style scoped>
.text-primary {
  color: #3465a4;
}
.bg-primary {
  background-color: #3465a4;
}
.bg-primary-dark {
  background-color: #2a5380;
}
.focus\:ring-primary:focus {
  --tw-ring-color: rgba(52, 101, 164, 0.5);
}
.focus\:border-primary:focus {
  border-color: #3465a4;
}
.hover\:bg-primary-dark:hover {
  background-color: #2a5380;
}
</style> 