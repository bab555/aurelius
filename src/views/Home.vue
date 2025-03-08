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
        <h2 class="text-xl font-semibold mb-4">热门 AI 工具</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- 工具卡片 1 -->
          <div class="tool-card bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20 hover:border-primary/50 transition-all">
            <div class="flex items-start">
              <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <i class="fas fa-robot text-primary text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">天枢助手</h3>
                <p class="text-sm text-gray-400 mb-4">基于大语言模型的智能助手，能够回答问题、提供建议</p>
                <router-link to="/assistant" class="text-primary hover:text-primary/80 text-sm flex items-center">
                  立即体验
                  <i class="fas fa-chevron-right ml-1 text-xs"></i>
                </router-link>
              </div>
            </div>
          </div>
          
          <!-- 工具卡片 2 -->
          <div class="tool-card bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20 hover:border-primary/50 transition-all">
            <div class="flex items-start">
              <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <i class="fas fa-magic text-primary text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">AI 图像生成</h3>
                <p class="text-sm text-gray-400 mb-4">通过文本描述生成高质量图像，支持多种风格和场景</p>
                <a href="#" class="text-primary hover:text-primary/80 text-sm flex items-center">
                  立即体验
                  <i class="fas fa-chevron-right ml-1 text-xs"></i>
                </a>
              </div>
            </div>
          </div>
          
          <!-- 工具卡片 3 -->
          <div class="tool-card bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20 hover:border-primary/50 transition-all">
            <div class="flex items-start">
              <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <i class="fas fa-file-alt text-primary text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">AI 文案助手</h3>
                <p class="text-sm text-gray-400 mb-4">智能生成各类营销文案、报告和文章，提高内容创作效率</p>
                <a href="#" class="text-primary hover:text-primary/80 text-sm flex items-center">
                  立即体验
                  <i class="fas fa-chevron-right ml-1 text-xs"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 项目展示 -->
      <div>
        <h2 class="text-xl font-semibold mb-4">精选项目</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 项目卡片 1 -->
          <div class="work-card bg-gradient-to-r from-gray-900 to-black rounded-xl overflow-hidden cursor-pointer group">
            <div class="p-6 relative z-10">
              <h3 class="text-lg font-semibold mb-2">企业知识库助手</h3>
              <p class="text-sm text-gray-400 mb-4">基于企业内部文档构建智能问答系统，提升信息获取效率</p>
              <div class="flex">
                <span class="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs mr-2">企业应用</span>
                <span class="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-xs">知识库</span>
              </div>
            </div>
            <div class="h-44 relative overflow-hidden">
              <img src="/ui/img/project1.jpg" alt="企业知识库" class="w-full object-cover transition-transform duration-500 group-hover:scale-110">
            </div>
          </div>
          
          <!-- 项目卡片 2 -->
          <div class="work-card bg-gradient-to-r from-gray-900 to-black rounded-xl overflow-hidden cursor-pointer group">
            <div class="p-6 relative z-10">
              <h3 class="text-lg font-semibold mb-2">智能客服系统</h3>
              <p class="text-sm text-gray-400 mb-4">7x24小时在线客服，自动解答客户问题，提升服务效率</p>
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