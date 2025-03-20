<template>
  <div class="flex-1 flex flex-col relative">
    <!-- 主内容区 -->
    <div class="p-6 md:p-10 flex-1">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">欢迎使用天枢 AI</h1>
        <p class="text-gray-400">探索 AI 的可能性，体验智能未来</p>
      </div>
      
      <!-- 工具卡片网格 -->
      <div class="mb-10">
        <h2 class="text-xl font-semibold mb-4">热门智能工具</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <!-- 工具卡片 1 - 智能助手 -->
          <div class="tool-card bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20 hover:border-primary/50 transition-all cursor-pointer"
               @click="navigateTo('/assistant/intelligent')">
            <div class="flex items-start">
              <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <i class="fas fa-brain text-primary text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">智能助手</h3>
                <p class="text-sm text-gray-400 mb-4">多功能AI助手，擅长问答、创作、编程，根据您的需求提供精准服务</p>
                <div class="text-primary hover:text-primary/80 text-sm flex items-center">
                  立即体验
                  <i class="fas fa-chevron-right ml-1 text-xs"></i>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 工具卡片 2 - 文旅助手 -->
          <div class="tool-card bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20 hover:border-primary/50 transition-all cursor-pointer"
               @click="navigateTo('/assistant')">
            <div class="flex items-start">
              <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <i class="fas fa-globe text-primary text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">文旅助手</h3>
                <p class="text-sm text-gray-400 mb-4">专为浙江省丽水市云和县定制的智能AI导游，提供景点推荐、行程规划和文化探索</p>
                <div class="text-primary hover:text-primary/80 text-sm flex items-center">
                  立即体验
                  <i class="fas fa-chevron-right ml-1 text-xs"></i>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 工具卡片 3 - 图像处理 -->
          <div class="tool-card bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20 hover:border-primary/50 transition-all cursor-pointer"
               @click="navigateTo('/tools/photo-restoration')">
            <div class="flex items-start">
              <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <i class="fas fa-camera-retro text-primary text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">图像处理</h3>
                <p class="text-sm text-gray-400 mb-4">照片增强、去除杂物、黑白上色、图像去雾，多功能图像处理平台</p>
                <div class="text-primary hover:text-primary/80 text-sm flex items-center">
                  立即体验
                  <i class="fas fa-chevron-right ml-1 text-xs"></i>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 工具卡片 4 - 语音合成 -->
          <div class="tool-card bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20 hover:border-primary/50 transition-all cursor-pointer"
               @click="navigateTo('/tools/voice-synthesis')">
            <div class="flex items-start">
              <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <i class="fas fa-microphone-alt text-primary text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">语音合成</h3>
                <p class="text-sm text-gray-400 mb-4">自然流畅的AI语音生成，支持多种语言和音色，适用于多种场景</p>
                <div class="text-primary hover:text-primary/80 text-sm flex items-center">
                  立即体验
                  <i class="fas fa-chevron-right ml-1 text-xs"></i>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 工具卡片 5 - 命理算师 -->
          <div class="tool-card bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20 hover:border-primary/50 transition-all cursor-pointer"
               @click="navigateTo('/astrology/destiny')">
            <div class="flex items-start">
              <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <i class="fas fa-moon text-primary text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">命理算师</h3>
                <p class="text-sm text-gray-400 mb-4">智能命理分析，结合传统命理学与现代AI技术，提供个性化命理解读</p>
                <div class="text-primary hover:text-primary/80 text-sm flex items-center">
                  立即体验
                  <i class="fas fa-chevron-right ml-1 text-xs"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 项目展示 -->
      <div>
        <h2 class="text-xl font-semibold mb-4">精选项目</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 项目卡片 1 - 虚拟试穿 -->
          <div class="work-card bg-gradient-to-r from-gray-900 to-black rounded-xl overflow-hidden cursor-pointer group"
               @click="navigateTo('/tools/virtual-try-on')">
            <div class="p-6 relative z-10">
              <h3 class="text-lg font-semibold mb-2">虚拟试穿系统</h3>
              <p class="text-sm text-gray-400 mb-4">AI驱动的虚拟试衣体验，让用户不出门就能体验穿搭效果，提升购物体验</p>
              <div class="flex">
                <span class="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs mr-2">时尚科技</span>
                <span class="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-xs">电商应用</span>
              </div>
            </div>
            <div class="h-44 relative overflow-hidden">
              <img src="/ui/img/project1.jpg" alt="虚拟试穿" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
            </div>
          </div>
          
          <!-- 项目卡片 2 - 虚拟客服 -->
          <div class="work-card bg-gradient-to-r from-gray-900 to-black rounded-xl overflow-hidden cursor-pointer group"
               @click="navigateTo('/assistant/virtual')">
            <div class="p-6 relative z-10">
              <h3 class="text-lg font-semibold mb-2">智能客服系统</h3>
              <p class="text-sm text-gray-400 mb-4">7x24小时在线客服，自动解答客户问题，提升服务效率，降低运营成本</p>
              <div class="flex">
                <span class="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs mr-2">客户服务</span>
                <span class="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-xs">自动化</span>
              </div>
            </div>
            <div class="h-44 relative overflow-hidden">
              <img src="/ui/img/project2.jpg" alt="智能客服" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup>
// Home 页面逻辑
import { onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import Footer from '../components/Footer.vue'

const router = useRouter()

// 导航函数 - 使用编程式导航来确保在所有设备上正常工作
const navigateTo = (path) => {
  console.log('导航到:', path)
  
  // 为避免事件冒泡引起的问题，使用setTimeout
  setTimeout(() => {
    try {
      router.push(path)
    } catch (err) {
      console.error('导航错误:', err)
    }
  }, 50)
}

// 简单的生命周期钩子，确保页面资源被清理
onBeforeUnmount(() => {
  console.log('Home页面卸载，清理资源');
  // 清理可能的事件监听器或其他资源
});
</script>

<style scoped>
/* 修复移动端触摸事件 */
.work-card,
.tool-card {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  position: relative;
}

/* 添加一个透明的点击层，增大点击区域 */
.work-card::after,
.tool-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

/* 提高移动端按钮可点击性 */
@media (max-width: 767px) {
  .tool-card, .work-card {
    padding: 16px;
  }
  
  .tool-card .text-sm, 
  .work-card .text-sm {
    font-size: 14px;
  }
  
  .tool-card h3, 
  .work-card h3 {
    font-size: 18px;
  }
}
</style> 