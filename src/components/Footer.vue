<template>
  <footer class="h-[48px] bg-black bg-opacity-40 backdrop-blur-sm mt-auto">
    <div class="max-w-[1440px] mx-auto px-8 h-full flex items-center justify-center text-gray-500">
      <div class="flex items-center space-x-8">
        <span>
          © {{ currentYear }} 浙江新红点智能科技股份有限公司（股票代码：839302）. 保留所有权利　<a href="https://beian.miit.gov.cn/" target="_blank" class="hover:text-gray-400 transition-colors">浙ICP备2025150834号-1</a>
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup>
// 获取当前年份
const currentYear = new Date().getFullYear()
</script>

<style scoped>
/* Footer样式 */
</style> 