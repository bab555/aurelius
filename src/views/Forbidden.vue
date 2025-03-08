<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-[#04031e]">
    <div class="text-center">
      <div class="text-red-500 mb-6">
        <i class="fas fa-exclamation-triangle text-8xl"></i>
      </div>
      <h1 class="text-4xl font-bold text-white mb-4">禁止访问</h1>
      <p class="text-xl text-gray-400 mb-8">很抱歉，您没有权限访问此页面</p>
      <div class="space-x-4">
        <router-link to="/" class="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
          返回首页
        </router-link>
        <router-link to="/login" class="bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors">
          登录账户
        </router-link>
      </div>
    </div>
  </div>
</template> 