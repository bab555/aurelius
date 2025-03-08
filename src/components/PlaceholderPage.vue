<template>
  <div class="placeholder-page w-full h-full flex flex-col items-center justify-center text-center relative">
    <div class="absolute inset-0 bg-cover bg-center z-0" style="background-image: url('/ui/img/bg.jpg')"></div>
    <div class="absolute inset-0 bg-black/60 z-0"></div>
    
    <div class="relative z-10 max-w-lg px-4">
      <img src="/ui/img/logo.png" alt="天枢AI" class="mx-auto w-24 h-24 mb-6">
      <h1 class="text-4xl font-bold text-white mb-2">{{ title }}</h1>
      <div class="w-20 h-1 bg-primary mx-auto mb-6"></div>
      <p class="text-xl text-gray-300 mb-6">功能配置中，马上开放</p>
      <router-link to="/home" class="inline-block px-6 py-3 bg-primary text-white rounded-full transition hover:bg-primary/80">
        返回首页
      </router-link>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  }
});
</script>

<style scoped>
.placeholder-page {
  min-height: calc(100vh - 80px);
}
</style> 