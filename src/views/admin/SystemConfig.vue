<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-gray-800">系统配置</h2>
      <p class="text-gray-600">管理全局设置和系统参数</p>
    </div>
    
    <!-- 基本设置 -->
    <div class="bg-white rounded-lg shadow mb-8">
      <div class="p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-800">基础设置</h3>
      </div>
      <div class="p-6">
        <div class="max-w-3xl space-y-6">
          <!-- 系统名称 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">系统名称</label>
            <input 
              type="text" 
              v-model="config.systemName" 
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
            >
            <p class="mt-1 text-sm text-gray-500">显示在浏览器标题和系统界面上的应用名称</p>
          </div>
          
          <!-- 系统描述 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">系统描述</label>
            <textarea 
              v-model="config.systemDescription" 
              rows="3" 
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
            ></textarea>
            <p class="mt-1 text-sm text-gray-500">简要描述系统的主要功能</p>
          </div>
          
          <!-- 维护模式 -->
          <div class="flex items-start">
            <div class="flex items-center h-5">
              <input 
                id="maintenance" 
                type="checkbox" 
                v-model="config.maintenanceMode"
                class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              >
            </div>
            <div class="ml-3 text-sm">
              <label for="maintenance" class="font-medium text-gray-700">维护模式</label>
              <p class="text-gray-500">启用后，除管理员外的用户将无法访问系统</p>
            </div>
          </div>
        </div>
        
        <div class="mt-6">
          <button 
            @click="saveBasicSettings" 
            class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <i class="fas fa-save mr-2"></i>
            保存基础设置
          </button>
        </div>
      </div>
    </div>
    
    <!-- API设置 -->
    <div class="bg-white rounded-lg shadow mb-8">
      <div class="p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-800">API 设置</h3>
      </div>
      <div class="p-6">
        <div class="max-w-3xl space-y-6">
          <!-- API密钥 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">API 密钥</label>
            <div class="mt-1 flex rounded-md shadow-sm">
              <input 
                type="text" 
                value="app-teTr4D35YF5TMzMk1xoKIw06" 
                readonly
                class="block w-full rounded-l-md border-gray-300 px-4 py-2 border bg-gray-50 text-gray-500"
              >
              <button 
                type="button" 
                class="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 hover:bg-gray-100"
              >
                <i class="fas fa-copy"></i>
              </button>
            </div>
            <p class="mt-1 text-sm text-gray-500">用于API鉴权的密钥，请妥善保管</p>
          </div>
          
          <!-- 每日请求限制 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">每日请求限制</label>
            <input 
              type="number" 
              v-model="config.dailyRequestLimit" 
              min="1" 
              max="10000" 
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
            >
            <p class="mt-1 text-sm text-gray-500">每个用户每天可以发起的请求数量</p>
          </div>
          
          <!-- 超时设置 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">请求超时（秒）</label>
            <input 
              type="number" 
              v-model="config.requestTimeout" 
              min="1" 
              max="300" 
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
            >
            <p class="mt-1 text-sm text-gray-500">API请求的超时时间</p>
          </div>
        </div>
        
        <div class="mt-6">
          <button 
            @click="saveApiSettings" 
            class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <i class="fas fa-save mr-2"></i>
            保存API设置
          </button>
        </div>
      </div>
    </div>
    
    <!-- 缓存设置 -->
    <div class="bg-white rounded-lg shadow">
      <div class="p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-800">缓存设置</h3>
      </div>
      <div class="p-6">
        <div class="max-w-3xl space-y-6">
          <!-- 启用缓存 -->
          <div class="flex items-start">
            <div class="flex items-center h-5">
              <input 
                id="cache" 
                type="checkbox" 
                v-model="config.cacheEnabled"
                class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              >
            </div>
            <div class="ml-3 text-sm">
              <label for="cache" class="font-medium text-gray-700">启用结果缓存</label>
              <p class="text-gray-500">缓存API请求结果以提高响应速度</p>
            </div>
          </div>
          
          <!-- 缓存过期时间 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">缓存过期时间（分钟）</label>
            <input 
              type="number" 
              v-model="config.cacheExpiration" 
              min="1" 
              max="1440" 
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
              :disabled="!config.cacheEnabled"
            >
            <p class="mt-1 text-sm text-gray-500">缓存结果的有效期</p>
          </div>
        </div>
        
        <div class="mt-6 space-x-4">
          <button 
            @click="saveCacheSettings" 
            class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <i class="fas fa-save mr-2"></i>
            保存缓存设置
          </button>
          
          <button 
            @click="clearCache" 
            class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <i class="fas fa-broom mr-2"></i>
            清除所有缓存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getSystemConfig, saveSystemConfig } from '../../services/admin/system'

// 配置状态
const config = ref({
  systemName: '天枢AI中台管理系统',
  systemDescription: '人工智能中台服务管理系统，提供API服务、任务队列和负载均衡管理。',
  maintenanceMode: false,
  dailyRequestLimit: 1000,
  requestTimeout: 60,
  cacheEnabled: true,
  cacheExpiration: 30
})

// 保存基本设置
const saveBasicSettings = async () => {
  try {
    await saveSystemConfig({
      systemName: config.value.systemName,
      systemDescription: config.value.systemDescription,
      maintenanceMode: config.value.maintenanceMode
    })
    
    alert('基础设置已保存')
  } catch (error) {
    console.error('保存基础设置失败', error)
    alert('保存失败: ' + error.message)
  }
}

// 保存API设置
const saveApiSettings = async () => {
  try {
    await saveSystemConfig({
      dailyRequestLimit: config.value.dailyRequestLimit,
      requestTimeout: config.value.requestTimeout
    })
    
    alert('API设置已保存')
  } catch (error) {
    console.error('保存API设置失败', error)
    alert('保存失败: ' + error.message)
  }
}

// 保存缓存设置
const saveCacheSettings = async () => {
  try {
    await saveSystemConfig({
      cacheEnabled: config.value.cacheEnabled,
      cacheExpiration: config.value.cacheExpiration
    })
    
    alert('缓存设置已保存')
  } catch (error) {
    console.error('保存缓存设置失败', error)
    alert('保存失败: ' + error.message)
  }
}

// 清除缓存
const clearCache = async () => {
  if (confirm('确定要清除所有缓存吗？这可能会导致系统暂时变慢。')) {
    try {
      // 在实际中调用API
      // await clearSystemCache()
      
      // 模拟成功
      setTimeout(() => {
        alert('缓存已清除')
      }, 1000)
    } catch (error) {
      console.error('清除缓存失败', error)
      alert('清除缓存失败: ' + error.message)
    }
  }
}

// 加载配置
const loadConfig = async () => {
  try {
    // 在实际中调用API
    // const systemConfig = await getSystemConfig()
    // config.value = systemConfig
    
    // 这里使用模拟数据
  } catch (error) {
    console.error('加载配置失败', error)
  }
}

// 初始化
loadConfig()
</script> 