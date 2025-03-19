<template>
  <div class="photo-restoration p-6 md:p-8 w-full">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">照片修复</h1>
      <p class="text-gray-400">修复老照片、去除杂物、提升图像清晰度（功能来自百度）</p>
    </div>
    
    <!-- 功能选择区 -->
    <div class="mb-8">
      <div class="bg-gray-900/50 p-6 rounded-xl">
        <h2 class="text-xl font-semibold text-white mb-4">选择功能</h2>
        <div class="grid grid-cols-2 gap-4">
          <button 
            @click="selectFunction('inpainting')"
            class="p-4 rounded-lg text-center transition-all" 
            :class="selectedFunction === 'inpainting' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'"
          >
            <i class="fas fa-eraser text-2xl mb-2"></i>
            <div class="font-medium">图像修复</div>
            <div class="text-xs mt-1 opacity-80">去除水印、划痕、杂物</div>
          </button>
          
          <button 
            @click="selectFunction('imageQuality')"
            class="p-4 rounded-lg text-center transition-all" 
            :class="selectedFunction === 'imageQuality' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'"
          >
            <i class="fas fa-wand-magic-sparkles text-2xl mb-2"></i>
            <div class="font-medium">清晰度增强</div>
            <div class="text-xs mt-1 opacity-80">提升图像清晰度和质量</div>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 上传区域 -->
    <div class="mb-8">
      <div class="bg-gray-900/50 p-6 rounded-xl">
        <h2 class="text-xl font-semibold text-white mb-4">上传图片</h2>
        
        <!-- 上传组件 -->
        <div 
          class="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors relative"
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
            @change="onFileSelected"
          >
          
          <div v-if="!uploadedImage && !isUploading">
            <i class="fas fa-cloud-upload-alt text-4xl text-gray-500 mb-4"></i>
            <p class="text-gray-400 mb-2">点击或拖拽图片到此处上传</p>
            <p class="text-gray-600 text-sm">支持 JPG、PNG、BMP 格式，最大 10MB</p>
          </div>
          
          <div v-else-if="isUploading" class="py-8">
            <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p class="text-gray-400">正在上传图片，请稍候...</p>
          </div>
          
          <div v-else class="relative">
            <img :src="uploadedImage" class="max-h-80 max-w-full mx-auto rounded-lg">
            <button 
              @click.stop="removeImage" 
              class="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        
        <!-- 工具栏 -->
        <div v-if="selectedFunction === 'inpainting' && uploadedImage" class="mt-4">
          <div class="flex flex-col md:flex-row gap-4 items-start">
            <div class="flex-1">
              <h3 class="text-white text-sm mb-2">橡皮擦工具</h3>
              <div class="flex gap-2 items-center">
                <span class="text-gray-400 text-xs">细</span>
                <input 
                  type="range" 
                  v-model="brushSize" 
                  min="5" 
                  max="50" 
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                >
                <span class="text-gray-400 text-xs">粗</span>
              </div>
              <p class="text-gray-500 text-xs mt-2">提示：请在图片上标记需要修复的区域</p>
            </div>
            <button 
              @click="clearMask" 
              class="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700"
            >
              重置标记
            </button>
          </div>
          
          <!-- 修复预览 -->
          <div v-if="isMaskMode" class="mt-4 relative">
            <canvas 
              ref="maskCanvas" 
              class="max-w-full mx-auto rounded-lg cursor-crosshair"
              @mousedown="startDrawing"
              @mousemove="draw"
              @mouseup="stopDrawing"
              @mouseleave="stopDrawing"
              @touchstart="startDrawingTouch"
              @touchmove="drawTouch"
              @touchend="stopDrawing"
            ></canvas>
            <div class="absolute inset-0 bg-black/30 flex items-center justify-center" v-if="isProcessing">
              <div class="text-white text-center">
                <i class="fas fa-spinner fa-spin text-2xl"></i>
                <p class="mt-2">正在处理...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 处理按钮 -->
    <div class="mb-8 flex justify-center">
      <button 
        @click="processImage" 
        class="px-8 py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg text-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed relative"
        :disabled="!uploadedImage || isProcessing"
      >
        <span v-if="!isProcessing">{{ buttonText }}</span>
        <span v-else class="flex items-center">
          <i class="fas fa-spinner fa-spin mr-2"></i> 处理中...
        </span>
      </button>
    </div>
    
    <!-- 消息提示区 -->
    <div class="mb-4">
      <div v-if="errorMessage" class="bg-red-500/20 text-red-400 p-4 rounded-lg mb-4">
        <i class="fas fa-exclamation-circle mr-2"></i> {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="bg-green-500/20 text-green-400 p-4 rounded-lg mb-4">
        <i class="fas fa-check-circle mr-2"></i> {{ successMessage }}
      </div>
    </div>
    
    <!-- 结果展示区 -->
    <div v-if="resultImage" class="mb-8">
      <div class="bg-gray-900/50 p-6 rounded-xl">
        <h2 class="text-xl font-semibold text-white mb-4">处理结果</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="text-gray-400 mb-2 text-center">原图</h3>
            <img :src="uploadedImage" class="max-w-full rounded-lg mx-auto">
          </div>
          <div>
            <h3 class="text-gray-400 mb-2 text-center">处理后</h3>
            <img :src="resultImage" class="max-w-full rounded-lg mx-auto">
          </div>
        </div>
        
        <div class="mt-6 flex flex-col md:flex-row gap-4 justify-center">
          <button 
            @click="downloadResult" 
            class="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors"
          >
            <i class="fas fa-download mr-2"></i> 下载结果
          </button>
          <button 
            @click="resetAll" 
            class="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <i class="fas fa-redo mr-2"></i> 重新开始
          </button>
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
              <i class="fas fa-eraser text-primary mr-2"></i> 图像修复
            </h3>
            <p class="text-gray-400 text-sm">
              图像修复技术可以智能去除图像中的水印、划痕、污渍等不需要的元素。使用橡皮擦工具标记需要修复的区域，系统将根据图像上下文智能填充，恢复自然画面。
            </p>
          </div>
          
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <h3 class="text-white mb-2 flex items-center">
              <i class="fas fa-wand-magic-sparkles text-primary mr-2"></i> 清晰度增强
            </h3>
            <p class="text-gray-400 text-sm">
              清晰度增强技术可以提升模糊、低分辨率图像的清晰度和细节。适用于老照片修复、提升扫描图像质量等场景，让图像更加清晰自然。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { 
  isApiAvailable, 
  imageInpainting, 
  imageQualityEnhance, 
  canvasToBase64,
  createMaskFromCanvas 
} from '../../services/baiduImageApi'

// 功能选择状态
const selectedFunction = ref('inpainting') // 默认选择图像修复
const selectFunction = (func) => {
  selectedFunction.value = func
  if (uploadedImage.value) {
    setupCanvas()
  }
}

// 文件上传相关
const fileInput = ref(null)
const uploadedImage = ref(null)
const isDragging = ref(false)

// 画布相关
const maskCanvas = ref(null)
const isMaskMode = ref(false)
const isDrawing = ref(false)
const brushSize = ref(20)
let ctx = null

// 处理状态
const isProcessing = ref(false)
const resultImage = ref(null)

// 添加更多状态控制
const isUploading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 计算属性
const buttonText = computed(() => {
  if (isProcessing.value) return '处理中...'
  return selectedFunction.value === 'inpainting' ? '开始修复' : '开始增强'
})

// 触发文件选择
const triggerFileInput = () => {
  if (!uploadedImage.value) {
    fileInput.value.click()
  }
}

// 文件选择处理
const onFileSelected = (event) => {
  const file = event.target.files[0]
  if (file) {
    processFile(file)
  }
}

// 文件拖放处理
const onFileDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file && file.type.match('image.*')) {
    processFile(file)
  }
}

// 处理上传的文件
const processFile = (file) => {
  if (!file) return
  
  if (file.size > 10 * 1024 * 1024) {
    errorMessage.value = '图片大小不能超过10MB'
    setTimeout(() => { errorMessage.value = '' }, 3000)
    return
  }
  
  isUploading.value = true
  errorMessage.value = ''
  
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage.value = e.target.result
    setupCanvas()
    isUploading.value = false
  }
  reader.onerror = () => {
    errorMessage.value = '图片读取失败，请重试'
    isUploading.value = false
    setTimeout(() => { errorMessage.value = '' }, 3000)
  }
  reader.readAsDataURL(file)
}

// 移除已上传图片
const removeImage = () => {
  uploadedImage.value = null
  resultImage.value = null
  isMaskMode.value = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 设置画布
const setupCanvas = () => {
  if (selectedFunction.value === 'inpainting') {
    isMaskMode.value = true;
    setTimeout(() => {
      if (!maskCanvas.value) return;
      
      const img = new Image();
      img.onload = () => {
        const canvas = maskCanvas.value;
        // 添加最大尺寸限制
        const maxSize = 4096;
        if (img.width > maxSize || img.height > maxSize) {
          errorMessage.value = `图片尺寸超过${maxSize}x${maxSize}限制`;
          resetAll();
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        
        // 初始化透明背景
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = uploadedImage.value;
    }, 100);
  } else {
    isMaskMode.value = false;
  }
};

// 绘制相关函数
const startDrawing = (event) => {
  isDrawing.value = true;
  draw(event);
};

const startDrawingTouch = (event) => {
  isDrawing.value = true;
  drawTouch(event);
};

// 设置最小笔刷尺寸
const getEffectiveBrushSize = () => {
  // 确保笔刷足够粗以便API识别
  return Math.max(brushSize.value, 15);
};

const draw = (event) => {
  if (!isDrawing.value || !ctx) return;
  
  const rect = maskCanvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // 绘制粗线条确保API能够识别
  const effectiveBrushSize = getEffectiveBrushSize();
  
  // 使用纯红色 RGB(255,0,0) 标记区域
  ctx.fillStyle = '#FF0000'; // 纯红色
  ctx.beginPath();
  ctx.arc(x, y, effectiveBrushSize, 0, Math.PI * 2);
  ctx.fill();
  
  // 添加连续绘制效果
  if (window._lastX && window._lastY) {
    ctx.beginPath();
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = effectiveBrushSize * 2;
    ctx.lineCap = 'round';
    ctx.moveTo(window._lastX, window._lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  
  window._lastX = x;
  window._lastY = y;
};

const drawTouch = (event) => {
  if (!isDrawing.value || !ctx) return;
  event.preventDefault();
  
  const rect = maskCanvas.value.getBoundingClientRect();
  const touch = event.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  // 绘制粗线条确保API能够识别
  const effectiveBrushSize = getEffectiveBrushSize();
  
  // 使用纯红色 RGB(255,0,0) 标记区域
  ctx.fillStyle = '#FF0000'; // 纯红色
  ctx.beginPath();
  ctx.arc(x, y, effectiveBrushSize, 0, Math.PI * 2);
  ctx.fill();
  
  // 添加连续绘制效果
  if (window._lastX && window._lastY) {
    ctx.beginPath();
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = effectiveBrushSize * 2;
    ctx.lineCap = 'round';
    ctx.moveTo(window._lastX, window._lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  
  window._lastX = x;
  window._lastY = y;
};

const stopDrawing = () => {
  isDrawing.value = false;
  window._lastX = null;
  window._lastY = null;
};

const clearMask = () => {
  if (!ctx || !maskCanvas.value) return
  
  const img = new Image()
  img.onload = () => {
    ctx.clearRect(0, 0, maskCanvas.value.width, maskCanvas.value.height)
    ctx.drawImage(img, 0, 0, maskCanvas.value.width, maskCanvas.value.height)
  }
  img.src = uploadedImage.value
}

// 处理图像
const processImage = async () => {
  if (!uploadedImage.value || isProcessing.value) return;
  
  // 检查API是否可用
  if (!isApiAvailable()) {
    errorMessage.value = '图像处理服务暂时不可用，请稍后再试';
    setTimeout(() => { errorMessage.value = '' }, 3000);
    return;
  }
  
  errorMessage.value = '';
  successMessage.value = '';
  isProcessing.value = true;
  
  try {
    if (selectedFunction.value === 'inpainting') {
      // 确保用户已经在图片上标记了区域
      if (!hasDrawnMask()) {
        errorMessage.value = '请先在图片上标记需要修复的区域（使用红色笔刷工具）';
        isProcessing.value = false;
        setTimeout(() => { errorMessage.value = '' }, 3000);
        return;
      }
      
      console.log('开始处理修复任务...');
      
      // 添加尺寸验证
      const img = new Image();
      img.src = uploadedImage.value;
      await new Promise(resolve => img.onload = resolve);
      
      if (img.width < 64 || img.height < 64) {
        errorMessage.value = '图片尺寸过小（最小64x64）';
        isProcessing.value = false;
        return;
      }
      
      if (img.width > 4096 || img.height > 4096) {
        errorMessage.value = '图片尺寸过大（最大4096x4096）';
        isProcessing.value = false;
        return;
      }
      
      console.log('图像尺寸验证通过');
      
      // 生成符合百度API要求的黑白掩码
      try {
        console.log('开始生成黑白掩码...');
        const maskData = createMaskFromCanvas(maskCanvas.value);
        
        // 检查掩码是否生成成功
        if (!maskData) {
          errorMessage.value = '生成掩码失败，请确保用纯红色标记了需要修复的区域';
          isProcessing.value = false;
          return;
        }
        
        console.log('掩码生成成功，长度:', maskData.length);
        
        // 调用百度图像修复API
        console.log('调用图像修复API...');
        resultImage.value = await imageInpainting(uploadedImage.value, maskData);
        console.log('API调用成功，获得处理结果');
      } catch (apiError) {
        console.error('API调用错误详情:', apiError);
        throw new Error(`图像修复失败: ${apiError.message}`);
      }
    } else {
      // 调用百度图像清晰度增强API
      console.log('开始调用清晰度增强API...');
      resultImage.value = await imageQualityEnhance(uploadedImage.value);
      console.log('清晰度增强API调用成功');
    }
    
    successMessage.value = selectedFunction.value === 'inpainting' ? '图像修复成功' : '图像清晰度增强成功';
    setTimeout(() => { successMessage.value = '' }, 3000);
  } catch (error) {
    console.error('处理图像时出错:', error);
    errorMessage.value = `图像处理失败: ${error.message}`;
    setTimeout(() => { errorMessage.value = '' }, 5000);
  } finally {
    isProcessing.value = false;
  }
};

// 检查用户是否已在画布上绘制
const hasDrawnMask = () => {
  if (!ctx || !maskCanvas.value) return false;
  
  const imageData = ctx.getImageData(0, 0, maskCanvas.value.width, maskCanvas.value.height).data;
  
  // 检查是否存在纯红色像素（R=255, G=0, B=0）
  for (let i = 0; i < imageData.length; i += 4) {
    if (imageData[i] === 255 && 
        imageData[i + 1] === 0 && 
        imageData[i + 2] === 0 &&
        imageData[i + 3] > 0) {
      return true;
    }
  }
  return false;
}

// 下载处理结果
const downloadResult = () => {
  if (!resultImage.value) return;
  
  const link = document.createElement('a');
  link.download = `restored_image_${Date.now()}.jpg`;
  link.href = resultImage.value;
  link.click();
}

// 重置所有状态
const resetAll = () => {
  uploadedImage.value = null
  resultImage.value = null
  isMaskMode.value = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  brushSize.value = 20
  clearMask()
}
</script>