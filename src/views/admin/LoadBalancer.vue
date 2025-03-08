<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-gray-800">负载均衡配置</h2>
      <p class="text-gray-600">管理服务节点和设置任务分发策略</p>
    </div>
    
    <!-- 负载均衡设置 -->
    <div class="bg-white rounded-lg shadow mb-8">
      <div class="p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-800">基本设置</h3>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 最大并发设置 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">最大并发数</label>
            <div class="flex items-center">
              <input 
                type="number" 
                v-model="maxConcurrent" 
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                min="1" 
                max="20"
              >
              <div class="ml-4 text-sm text-gray-600">
                <button 
                  @click="incrementConcurrent(1)" 
                  class="inline-flex items-center justify-center h-8 w-8 rounded bg-gray-100 hover:bg-gray-200"
                >
                  <i class="fas fa-plus"></i>
                </button>
                <button 
                  @click="incrementConcurrent(-1)" 
                  class="inline-flex items-center justify-center h-8 w-8 rounded bg-gray-100 hover:bg-gray-200 ml-1"
                >
                  <i class="fas fa-minus"></i>
                </button>
              </div>
            </div>
            <p class="mt-1 text-sm text-gray-500">设置系统允许的最大并发任务数</p>
          </div>
          
          <!-- 负载策略 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">负载均衡策略</label>
            <select 
              v-model="balanceStrategy" 
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            >
              <option value="round-robin">轮询</option>
              <option value="weighted">加权轮询</option>
              <option value="least-conn">最少连接</option>
              <option value="ip-hash">IP哈希</option>
            </select>
            <p class="mt-1 text-sm text-gray-500">选择任务分发到各节点的策略</p>
          </div>
        </div>
        
        <div class="mt-6">
          <button 
            @click="applySettings" 
            class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <i class="fas fa-save mr-2"></i>
            保存基本设置
          </button>
        </div>
      </div>
    </div>
    
    <!-- 服务节点管理 -->
    <div class="bg-white rounded-lg shadow mb-8">
      <div class="p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-800">服务节点配置</h3>
      </div>
      <div class="p-6">
        <!-- 节点列表 -->
        <div v-for="(node, index) in serviceNodes" :key="index" class="flex items-stretch mb-4 border-b border-gray-200 pb-4">
          <div class="flex-1 mr-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">节点地址</label>
            <input 
              type="text" 
              v-model="node.url" 
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="http://example.com:3000"
            >
          </div>
          
          <div class="w-32 mr-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">权重</label>
            <input 
              type="number" 
              v-model="node.weight" 
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              min="1" 
              max="100"
            >
          </div>
          
          <div class="w-36 mr-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select 
              v-model="node.enabled" 
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            >
              <option :value="true">启用</option>
              <option :value="false">停用</option>
            </select>
          </div>
          
          <div class="flex items-end">
            <button 
              @click="removeNode(index)" 
              class="inline-flex items-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 mb-1"
            >
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
        
        <!-- 添加节点按钮 -->
        <div class="mt-4">
          <button 
            @click="addNode" 
            class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <i class="fas fa-plus mr-2"></i>
            添加服务节点
          </button>
          
          <button 
            @click="saveNodes" 
            class="ml-4 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <i class="fas fa-save mr-2"></i>
            保存节点配置
          </button>
        </div>
      </div>
    </div>
    
    <!-- 服务节点状态 -->
    <div class="bg-white rounded-lg shadow">
      <div class="p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-800">节点运行状态</h3>
      </div>
      <div class="p-4">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">节点</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前连接</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总处理任务</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内存</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="node in nodeStatus" :key="node.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ node.url }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span :class="{
                    'px-2 py-1 text-xs rounded-full': true,
                    'bg-green-100 text-green-800': node.status === 'online',
                    'bg-red-100 text-red-800': node.status === 'offline',
                    'bg-yellow-100 text-yellow-800': node.status === 'degraded'
                  }">
                    {{ getStatusText(node.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ node.connections }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ node.processed }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ node.cpu }}%
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ node.memory }}%
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button 
                    @click="toggleNodeStatus(node.id)" 
                    :class="{
                      'px-2 py-1 rounded text-xs font-medium': true,
                      'bg-yellow-100 text-yellow-800': node.status === 'online',
                      'bg-green-100 text-green-800': node.status === 'offline',
                    }"
                  >
                    {{ node.status === 'online' ? '暂停' : '启用' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTaskStore } from '../../stores/task'
import { saveLoadBalancerConfig, getLoadBalancerStatus } from '../../services/admin/system'

const taskStore = useTaskStore()

// 状态和配置
const maxConcurrent = ref(taskStore.maxConcurrent || 3)
const balanceStrategy = ref('weighted')
const serviceNodes = ref([
  { url: 'http://localhost:3000', weight: 10, enabled: true },
  { url: 'http://localhost:3001', weight: 5, enabled: true }
])

// 节点实时状态
const nodeStatus = ref([
  { id: 1, url: 'http://localhost:3000', status: 'online', connections: 3, processed: 1250, cpu: 34, memory: 45 },
  { id: 2, url: 'http://localhost:3001', status: 'online', connections: 1, processed: 866, cpu: 28, memory: 37 },
  { id: 3, url: 'http://localhost:3002', status: 'degraded', connections: 6, processed: 422, cpu: 88, memory: 76 },
  { id: 4, url: 'http://localhost:3003', status: 'offline', connections: 0, processed: 155, cpu: 0, memory: 12 }
])

// 增减并发数
const incrementConcurrent = (val) => {
  const newVal = maxConcurrent.value + val
  if (newVal >= 1 && newVal <= 20) {
    maxConcurrent.value = newVal
  }
}

// 添加节点
const addNode = () => {
  serviceNodes.value.push({
    url: '',
    weight: 10,
    enabled: true
  })
}

// 移除节点
const removeNode = (index) => {
  if (confirm('确定要移除此节点吗？')) {
    serviceNodes.value.splice(index, 1)
  }
}

// 保存设置
const applySettings = async () => {
  try {
    await saveLoadBalancerConfig({
      maxConcurrent: maxConcurrent.value,
      strategy: balanceStrategy.value
    })
    
    // 更新任务队列配置
    taskStore.setMaxConcurrent(maxConcurrent.value)
    
    alert('设置已保存')
  } catch (error) {
    console.error('保存设置失败', error)
    alert('保存设置失败: ' + error.message)
  }
}

// 保存节点配置
const saveNodes = async () => {
  try {
    await saveLoadBalancerConfig({
      nodes: serviceNodes.value
    })
    
    alert('节点配置已保存')
  } catch (error) {
    console.error('保存节点配置失败', error)
    alert('保存节点配置失败: ' + error.message)
  }
}

// 切换节点状态
const toggleNodeStatus = async (nodeId) => {
  const node = nodeStatus.value.find(n => n.id === nodeId)
  if (!node) return
  
  try {
    // 模拟API调用切换状态
    const newStatus = node.status === 'online' ? 'offline' : 'online'
    
    // 这里应该调用API
    // await changeNodeStatus(nodeId, newStatus)
    
    // 直接修改状态（模拟）
    node.status = newStatus
    
    // 如果禁用，连接数归零
    if (newStatus === 'offline') {
      node.connections = 0
      node.cpu = 0
    }
  } catch (error) {
    console.error('切换节点状态失败', error)
    alert('切换节点状态失败: ' + error.message)
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'online': return '在线'
    case 'offline': return '离线'
    case 'degraded': return '异常'
    default: return status
  }
}

// 加载节点状态
const loadNodeStatus = async () => {
  try {
    // 实际项目应该调用API
    // const status = await getLoadBalancerStatus()
    // nodeStatus.value = status.nodes
    
    // 更新节点状态（模拟）
    nodeStatus.value.forEach(node => {
      if (node.status === 'online') {
        // 随机变化连接数
        node.connections = Math.max(0, node.connections + Math.floor(Math.random() * 3) - 1)
        // 增加处理任务数
        node.processed += Math.floor(Math.random() * 5)
        // 更新CPU和内存使用率
        node.cpu = Math.min(100, Math.max(10, node.cpu + Math.floor(Math.random() * 10) - 5))
        node.memory = Math.min(100, Math.max(10, node.memory + Math.floor(Math.random() * 8) - 4))
      }
    })
  } catch (error) {
    console.error('加载节点状态失败', error)
  }
}

onMounted(() => {
  // 初始化
  loadNodeStatus()
  
  // 定期更新节点状态
  setInterval(loadNodeStatus, 5000)
})
</script> 