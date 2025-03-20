<template>
  <div class="photo-restoration p-6 md:p-8 w-full">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">图像处理</h1>
      <p class="text-gray-400">去除杂物、增强清晰度、图像去雾、黑白上色和无损放大（功能来自百度）</p>
    </div>
    
    <!-- 功能选择区 -->
    <div class="mb-8">
      <div class="bg-gray-900/50 p-6 rounded-xl">
        <h2 class="text-xl font-semibold text-white mb-4">选择功能</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <button 
            @click="selectFunction('inpainting')"
            class="p-4 rounded-lg text-center transition-all" 
            :class="selectedFunction === 'inpainting' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'"
          >
            <i class="fas fa-eraser text-2xl mb-2"></i>
            <div class="font-medium">去除杂物</div>
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
          
          <button 
            @click="selectFunction('dehaze')"
            class="p-4 rounded-lg text-center transition-all" 
            :class="selectedFunction === 'dehaze' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'"
          >
            <i class="fas fa-cloud-sun text-2xl mb-2"></i>
            <div class="font-medium">图像去雾</div>
            <div class="text-xs mt-1 opacity-80">去除雾霾、保持自然色彩</div>
          </button>
          
          <button 
            @click="selectFunction('coloring')"
            class="p-4 rounded-lg text-center transition-all" 
            :class="selectedFunction === 'coloring' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'"
          >
            <i class="fas fa-paint-brush text-2xl mb-2"></i>
            <div class="font-medium">黑白上色</div>
            <div class="text-xs mt-1 opacity-80">为黑白图像增加自然颜色</div>
          </button>
          
          <button 
            @click="selectFunction('superResolution')"
            class="p-4 rounded-lg text-center transition-all" 
            :class="selectedFunction === 'superResolution' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'"
          >
            <i class="fas fa-expand-arrows-alt text-2xl mb-2"></i>
            <div class="font-medium">无损放大</div>
            <div class="text-xs mt-1 opacity-80">提升图像分辨率与清晰度</div>
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
              <h3 class="text-white text-sm mb-2">矩形选框工具</h3>
              <p class="text-gray-500 text-xs mt-2">提示：请在图片上拖动鼠标绘制矩形框，选择需要去除的区域。API需要矩形区域才能正常工作。</p>
            </div>
            <button 
              @click="clearMask" 
              class="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700"
            >
              重置选区
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
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <h3 class="text-white mb-2 flex items-center">
              <i class="fas fa-eraser text-primary mr-2"></i> 去除杂物
            </h3>
            <p class="text-gray-400 text-sm">
              去除杂物功能可以智能去除图像中的水印、划痕、污渍等不需要的元素。使用矩形选框工具标记需要处理的区域，系统将根据图像上下文智能填充，恢复自然画面。注意：必须使用矩形选框，不支持自由形状。
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
          
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <h3 class="text-white mb-2 flex items-center">
              <i class="fas fa-cloud-sun text-primary mr-2"></i> 图像去雾
            </h3>
            <p class="text-gray-400 text-sm">
              图像去雾技术可以智能去除图像中的雾霾、烟雾或雾气效果，恢复图像的真实色彩和细节。适用于户外摄影、风景照片等受雾气影响的场景，提升图像清晰度和观感。
            </p>
          </div>
          
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <h3 class="text-white mb-2 flex items-center">
              <i class="fas fa-paint-brush text-primary mr-2"></i> 黑白图像上色
            </h3>
            <p class="text-gray-400 text-sm">
              黑白图像上色技术利用人工智能为黑白照片添加自然的颜色。适用于老照片修复、历史图像处理等场景，让黑白图像焕发新生，展现更丰富的视觉效果和历史细节。
            </p>
          </div>
          
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <h3 class="text-white mb-2 flex items-center">
              <i class="fas fa-expand-arrows-alt text-primary mr-2"></i> 图像无损放大
            </h3>
            <p class="text-gray-400 text-sm">
              图像无损放大技术可以在保持图像清晰度的同时提升图像分辨率。利用先进的AI算法补充细节信息，适用于需要高质量放大的图像，如打印照片、海报制作等场景。
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
  createMaskFromCanvas,
  imageDehaze,
  imageColoring,
  imageSuperResolution
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
// 矩形选框开始和结束位置
let startX = 0
let startY = 0
let currentRect = null // 当前绘制的矩形，用于API请求

// 处理状态
const isProcessing = ref(false)
const resultImage = ref(null)

// 添加更多状态控制
const isUploading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 计算属性
const buttonText = computed(() => {
  if (isProcessing.value) return '处理中...';
  
  const buttonTexts = {
    'inpainting': '开始去除',
    'imageQuality': '开始增强',
    'dehaze': '开始去雾',
    'coloring': '开始上色',
    'superResolution': '开始放大'
  };
  
  return buttonTexts[selectedFunction.value] || '开始处理';
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
  
  // 获取鼠标在canvas中的位置
  const rect = maskCanvas.value.getBoundingClientRect();
  startX = event.clientX - rect.left;
  startY = event.clientY - rect.top;
  
  // 保存当前画布状态，以便在拖动时恢复
  if (ctx) {
    ctx.save();
  }
};

const startDrawingTouch = (event) => {
  isDrawing.value = true;
  event.preventDefault();
  
  // 获取触摸点在canvas中的位置
  const rect = maskCanvas.value.getBoundingClientRect();
  const touch = event.touches[0];
  startX = touch.clientX - rect.left;
  startY = touch.clientY - rect.top;
  
  // 保存当前画布状态，以便在拖动时恢复
  if (ctx) {
    ctx.save();
  }
};

const draw = (event) => {
  if (!isDrawing.value || !ctx) return;
  
  // 清除上一次的临时矩形
  restoreCanvas();
  
  // 获取当前鼠标位置
  const rect = maskCanvas.value.getBoundingClientRect();
  const currentX = event.clientX - rect.left;
  const currentY = event.clientY - rect.top;
  
  // 计算矩形尺寸
  const width = currentX - startX;
  const height = currentY - startY;
  
  // 绘制红色半透明矩形
  ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 2;
  
  // 考虑各种拖动方向
  let rectX = startX;
  let rectY = startY;
  let rectWidth = width;
  let rectHeight = height;
  
  if (width < 0) {
    rectX = startX + width;
    rectWidth = Math.abs(width);
  }
  
  if (height < 0) {
    rectY = startY + height;
    rectHeight = Math.abs(height);
  }
  
  // 绘制矩形
  ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
  ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
  
  // 保存当前矩形信息，用于API调用
  currentRect = {
    left: Math.round(rectX),
    top: Math.round(rectY),
    width: Math.round(rectWidth),
    height: Math.round(rectHeight)
  };
};

const drawTouch = (event) => {
  if (!isDrawing.value || !ctx) return;
  event.preventDefault();
  
  // 清除上一次的临时矩形
  restoreCanvas();
  
  // 获取当前触摸位置
  const rect = maskCanvas.value.getBoundingClientRect();
  const touch = event.touches[0];
  const currentX = touch.clientX - rect.left;
  const currentY = touch.clientY - rect.top;
  
  // 计算矩形尺寸
  const width = currentX - startX;
  const height = currentY - startY;
  
  // 绘制红色半透明矩形
  ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 2;
  
  // 考虑各种拖动方向
  let rectX = startX;
  let rectY = startY;
  let rectWidth = width;
  let rectHeight = height;
  
  if (width < 0) {
    rectX = startX + width;
    rectWidth = Math.abs(width);
  }
  
  if (height < 0) {
    rectY = startY + height;
    rectHeight = Math.abs(height);
  }
  
  // 绘制矩形
  ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
  ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
  
  // 保存当前矩形信息，用于API调用
  currentRect = {
    left: Math.round(rectX),
    top: Math.round(rectY),
    width: Math.round(rectWidth),
    height: Math.round(rectHeight)
  };
};

// 恢复画布到初始状态（不包括选择的矩形）
const restoreCanvas = () => {
  if (!ctx) return;
  
  // 恢复到保存的状态
  ctx.restore();
  // 再次保存当前状态，用于下一次恢复
  ctx.save();
};

const stopDrawing = () => {
  isDrawing.value = false;
  
  // 在停止绘制时，确认当前矩形
  if (ctx && currentRect && currentRect.width > 5 && currentRect.height > 5) {
    // 矩形已确认，不需要其他操作
    console.log('矩形选区已确认:', currentRect);
  }
};

const clearMask = () => {
  if (!ctx || !maskCanvas.value) return
  
  // 重置当前矩形
  currentRect = null;
  
  const img = new Image()
  img.onload = () => {
    ctx.clearRect(0, 0, maskCanvas.value.width, maskCanvas.value.height)
    ctx.drawImage(img, 0, 0, maskCanvas.value.width, maskCanvas.value.height)
    
    // 保存初始状态
    ctx.save();
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
      // 确保用户已经选择了矩形区域
      if (!currentRect || currentRect.width < 10 || currentRect.height < 10) {
        errorMessage.value = '请先在图片上拖动绘制矩形框，标记需要去除的区域';
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
        console.log('开始生成矩形掩码...');
        // 使用选择的矩形生成掩码
        const maskData = createMaskFromRect(maskCanvas.value, currentRect);
        
        // 检查掩码是否生成成功
        if (!maskData) {
          errorMessage.value = '生成掩码失败，请确保选择了有效的矩形区域';
          isProcessing.value = false;
          return;
        }
        
        console.log('掩码生成成功，长度:', maskData.length);
        console.log('使用矩形区域:', currentRect);
        
        // 调用百度图像修复API - 将矩形区域参数传递给API
        console.log('调用图像修复API...');
        resultImage.value = await imageInpainting(uploadedImage.value, maskData, currentRect);
        console.log('API调用成功，获得处理结果');
      } catch (apiError) {
        console.error('API调用错误详情:', apiError);
        throw new Error(`图像修复失败: ${apiError.message}`);
      }
    } else if (selectedFunction.value === 'imageQuality') {
      // 调用百度图像清晰度增强API
      console.log('开始调用清晰度增强API...');
      resultImage.value = await imageQualityEnhance(uploadedImage.value);
      console.log('清晰度增强API调用成功');
    } else if (selectedFunction.value === 'dehaze') {
      // 调用百度图像去雾API
      console.log('开始调用图像去雾API...');
      resultImage.value = await imageDehaze(uploadedImage.value);
      console.log('图像去雾API调用成功');
    } else if (selectedFunction.value === 'coloring') {
      // 调用百度黑白图像上色API
      console.log('开始调用黑白图像上色API...');
      resultImage.value = await imageColoring(uploadedImage.value);
      console.log('黑白图像上色API调用成功');
    } else if (selectedFunction.value === 'superResolution') {
      // 调用百度图像无损放大API
      console.log('开始调用图像无损放大API...');
      resultImage.value = await imageSuperResolution(uploadedImage.value);
      console.log('图像无损放大API调用成功');
    }
    
    const successMessages = {
      'inpainting': '杂物去除成功',
      'imageQuality': '图像清晰度增强成功',
      'dehaze': '图像去雾成功',
      'coloring': '黑白图像上色成功',
      'superResolution': '图像无损放大成功'
    };
    
    successMessage.value = successMessages[selectedFunction.value] || '图像处理成功';
    setTimeout(() => { successMessage.value = '' }, 3000);
  } catch (error) {
    console.error('处理图像时出错:', error);
    errorMessage.value = `图像处理失败: ${error.message}`;
    setTimeout(() => { errorMessage.value = '' }, 5000);
  } finally {
    isProcessing.value = false;
  }
};

// 从矩形区域创建掩码
const createMaskFromRect = (canvas, rect) => {
  if (!canvas || !rect) return null;
  
  // 创建新的Canvas用于生成黑白掩码
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  
  // 获取上下文
  const maskCtx = maskCanvas.getContext('2d');
  
  // 首先绘制白色背景
  maskCtx.fillStyle = 'white';
  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
  
  // 在矩形区域绘制黑色
  maskCtx.fillStyle = 'black';
  maskCtx.fillRect(rect.left, rect.top, rect.width, rect.height);
  
  // 使用PNG格式确保不会丢失黑白信息（无压缩损失）
  return maskCanvas.toDataURL('image/png', 1.0);
};

// 检查用户是否已在画布上绘制
const hasDrawnMask = () => {
  // 使用矩形选区模式，不再需要像素检查
  return currentRect && currentRect.width > 0 && currentRect.height > 0;
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