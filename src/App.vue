<template>
  <div class="app-container">
    <!-- 根据路由元信息决定是否显示侧边栏 -->
    <template v-if="!isFullPage">
      <div class="flex min-h-screen bg-[#04031e] relative">
        <!-- 左侧导航 - 使用固定定位，保持独立滚动 -->
        <div class="fixed left-0 top-0 bottom-0 z-50 h-screen md:w-60">
          <Sidebar />
        </div>
        
        <!-- 右侧内容区 - 独立滚动区域 -->
        <div class="md:ml-60 w-full min-h-screen bg-[#04031e] overflow-x-hidden pt-16 md:pt-0">
          <router-view />
        </div>
      </div>
    </template>
    
    <!-- 全屏页面不显示侧边栏 -->
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'

const route = useRoute()

// 判断当前路由是否为全屏页面
const isFullPage = computed(() => {
  return route.meta.fullPage === true
})
</script>

<style>
/* 防止未编译的DOM元素闪现 */
[v-cloak] {
  display: none;
}

/* 修改全局滚动设置，恢复正常滚动行为 */
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  overflow-x: hidden; /* 只阻止水平滚动 */
  background-color: #04031e;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 移动端优化 */
@media (max-width: 767px) {
  input, select, textarea, button {
    font-size: 16px; /* 避免iOS缩放 */
  }
  
  .app-container * {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
}
</style> 