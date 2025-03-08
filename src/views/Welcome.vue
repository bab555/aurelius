<template>
  <div class="min-h-screen bg-[#04031e] flex flex-col justify-between">
    <!-- 背景视频 - 修复z-index层级 -->
    <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <!-- 背景色作为备用 -->
      <div class="absolute inset-0 bg-[#04031e] z-0"></div>
      
      <!-- 视频元素 - 确保z-index正确 -->
      <video 
        id="video-bg" 
        autoplay 
        muted 
        loop 
        playsinline
        ref="videoRef"
      >
        <source src="/ui/img/nebula.mp4" type="video/mp4">
        您的浏览器不支持视频标签。
      </video>
      
      <!-- 视频遮罩 - 移除或大幅减轻暗度 -->
      <div class="video-mask absolute inset-0 z-[1] pointer-events-none"></div>
    </div>
    
    <div class="flex-1 flex flex-col justify-center items-center px-4 md:px-0 relative z-[2] pointer-events-auto">
      <div class="text-center mb-12 relative">
        <div class="mb-8 animate-fade-in">
          <img src="/ui/img/logo.png" alt="天枢AI" class="h-20 mx-auto mb-4">
          <h1 class="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-primary">
            天枢 AI 平台
          </h1>
          <p class="text-gray-400 mt-4 max-w-md mx-auto">
            探索人工智能的无限可能，释放创造力
          </p>
        </div>
        
        <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-center relative z-20">
          <router-link 
            to="/home" 
            class="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg flex items-center justify-center font-medium transition-all pointer-events-auto"
          >
            开始体验
            <i class="fas fa-chevron-right ml-2"></i>
          </router-link>
          
          <a 
            href="#about"
            class="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg flex items-center justify-center font-medium transition-all pointer-events-auto"
          >
            了解更多
            <i class="fas fa-arrow-down ml-2"></i>
          </a>
        </div>
      </div>
      
      <div class="absolute bottom-6 animate-bounce">
        <i class="fas fa-chevron-down text-gray-500"></i>
      </div>
      
      <!-- 背景装饰 - 修复z-index层级 -->
      <div class="absolute inset-0 overflow-hidden z-[-5] pointer-events-none">
        <!-- 渐变背景 - 减少不透明度 -->
        <div class="absolute inset-0 bg-gradient-to-b from-[#0c0a2d]/20 to-[#04031e]/10"></div>
        
        <!-- 装饰圆点 -->
        <div class="absolute w-full h-full">
          <div class="absolute top-[10%] left-[15%] w-72 h-72 bg-primary/10 rounded-full filter blur-3xl"></div>
          <div class="absolute top-[40%] right-[15%] w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
          <div class="absolute bottom-[15%] left-[25%] w-60 h-60 bg-indigo-500/10 rounded-full filter blur-3xl"></div>
        </div>
        
        <!-- 网格装饰 -->
        <div class="absolute inset-0 bg-[url('/ui/img/grid.svg')] bg-center opacity-10"></div>
      </div>
    </div>
    
    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Footer from '../components/Footer.vue'

const videoRef = ref(null)

// 页面加载时设置视频速度并确保播放
onMounted(() => {
  if (videoRef.value) {
    // 设置2倍速
    videoRef.value.playbackRate = 2
    
    // 强制设置视频样式
    videoRef.value.style.position = 'absolute'
    videoRef.value.style.top = '0'
    videoRef.value.style.left = '0'
    videoRef.value.style.width = '100%'
    videoRef.value.style.height = '100%'
    videoRef.value.style.objectFit = 'cover'
    videoRef.value.style.zIndex = '1'
    
    // 尝试播放视频
    const playPromise = videoRef.value.play()
    
    // 处理播放可能被拒绝的情况
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('视频自动播放被阻止:', error)
        
        // 添加事件监听器，在用户交互后尝试播放
        document.addEventListener('click', () => {
          videoRef.value.play()
        }, { once: true })
      })
    }
  }
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 1s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 视频元素样式 */
#video-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

/* 视频遮罩样式 */
.video-mask {
  background-color: rgba(0,0,0,0.1);
}
</style> 