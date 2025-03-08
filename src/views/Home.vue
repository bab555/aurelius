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
          <div class="tool-card bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20 hover:border-primary/50 transition-all">
            <div class="flex items-start">
              <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <i class="fas fa-brain text-primary text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">智能助手</h3>
                <p class="text-sm text-gray-400 mb-4">多功能AI助手，擅长问答、创作、编程，根据您的需求提供精准服务</p>
                <a href="/assistant/intelligent" class="text-primary hover:text-primary/80 text-sm flex items-center">
                  立即体验
                  <i class="fas fa-chevron-right ml-1 text-xs"></i>
                </a>
              </div>
            </div>
          </div>
          
          <!-- 工具卡片 2 - 文旅助手 -->
          <div class="tool-card bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20 hover:border-primary/50 transition-all">
            <div class="flex items-start">
              <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <i class="fas fa-globe text-primary text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">文旅助手</h3>
                <p class="text-sm text-gray-400 mb-4">专为浙江省丽水市云和县定制的智能AI导游，提供景点推荐、行程规划和文化探索</p>
                <router-link to="/assistant" class="text-primary hover:text-primary/80 text-sm flex items-center">
                  立即体验
                  <i class="fas fa-chevron-right ml-1 text-xs"></i>
                </router-link>
              </div>
            </div>
          </div>
          
          <!-- 工具卡片 3 - 照片修复 -->
          <div class="tool-card bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20 hover:border-primary/50 transition-all">
            <div class="flex items-start">
              <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <i class="fas fa-camera-retro text-primary text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">照片修复</h3>
                <p class="text-sm text-gray-400 mb-4">老照片修复翻新、照片增强、去除污损和瑕疵，恢复珍贵记忆</p>
                <router-link to="/tools/photo-restoration" class="text-primary hover:text-primary/80 text-sm flex items-center">
                  立即体验
                  <i class="fas fa-chevron-right ml-1 text-xs"></i>
                </router-link>
              </div>
            </div>
          </div>
          
          <!-- 工具卡片 4 - 语音合成 -->
          <div class="tool-card bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20 hover:border-primary/50 transition-all">
            <div class="flex items-start">
              <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <i class="fas fa-microphone-alt text-primary text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">语音合成</h3>
                <p class="text-sm text-gray-400 mb-4">自然流畅的AI语音生成，支持多种语言和音色，适用于多种场景</p>
                <router-link to="/tools/voice-synthesis" class="text-primary hover:text-primary/80 text-sm flex items-center">
                  立即体验
                  <i class="fas fa-chevron-right ml-1 text-xs"></i>
                </router-link>
              </div>
            </div>
          </div>
          
          <!-- 工具卡片 5 - 命理算师 -->
          <div class="tool-card bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20 hover:border-primary/50 transition-all">
            <div class="flex items-start">
              <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <i class="fas fa-moon text-primary text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">命理算师</h3>
                <p class="text-sm text-gray-400 mb-4">智能命理分析，结合传统命理学与现代AI技术，提供个性化命理解读</p>
                <router-link to="/astrology/destiny" class="text-primary hover:text-primary/80 text-sm flex items-center">
                  立即体验
                  <i class="fas fa-chevron-right ml-1 text-xs"></i>
                </router-link>
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
          <div class="work-card bg-gradient-to-r from-gray-900 to-black rounded-xl overflow-hidden cursor-pointer group">
            <div class="p-6 relative z-10">
              <h3 class="text-lg font-semibold mb-2">虚拟试穿系统</h3>
              <p class="text-sm text-gray-400 mb-4">AI驱动的虚拟试衣体验，让用户不出门就能体验穿搭效果，提升购物体验</p>
              <div class="flex">
                <span class="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs mr-2">时尚科技</span>
                <span class="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-xs">电商应用</span>
              </div>
            </div>
            <div class="h-44 relative overflow-hidden">
              <img src="/ui/img/project1.jpg" alt="虚拟试穿" class="w-full object-cover transition-transform duration-500 group-hover:scale-110">
            </div>
          </div>
          
          <!-- 项目卡片 2 - 虚拟客服 -->
          <div class="work-card bg-gradient-to-r from-gray-900 to-black rounded-xl overflow-hidden cursor-pointer group">
            <div class="p-6 relative z-10">
              <h3 class="text-lg font-semibold mb-2">智能客服系统</h3>
              <p class="text-sm text-gray-400 mb-4">7x24小时在线客服，自动解答客户问题，提升服务效率，降低运营成本</p>
              <div class="flex">
                <span class="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs mr-2">客户服务</span>
                <span class="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-xs">自动化</span>
              </div>
            </div>
            <div class="h-44 relative overflow-hidden">
              <img src="/ui/img/project2.jpg" alt="智能客服" class="w-full object-cover transition-transform duration-500 group-hover:scale-110">
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
import Footer from '../components/Footer.vue'
</script> 