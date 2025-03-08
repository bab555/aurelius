<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-gray-800">系统概览</h2>
      <p class="text-gray-600">查看系统状态和关键指标</p>
    </div>
    
    <!-- 概览卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <!-- 用户总数 -->
      <div class="bg-white rounded-lg shadow p-5">
        <div class="flex justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">用户总数</p>
            <p class="text-xl font-semibold text-gray-800 mt-1">{{ totalUsers }}</p>
          </div>
          <div class="p-3 rounded-full bg-indigo-50">
            <i class="fas fa-users text-indigo-500 text-xl"></i>
          </div>
        </div>
        <p class="mt-2 text-xs text-gray-500">
          <span class="text-green-600">↑ 12%</span> 较上月增长
        </p>
      </div>
      
      <!-- 今日任务 -->
      <div class="bg-white rounded-lg shadow p-5">
        <div class="flex justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">今日任务</p>
            <p class="text-xl font-semibold text-gray-800 mt-1">{{ todayTasks }}</p>
          </div>
          <div class="p-3 rounded-full bg-green-50">
            <i class="fas fa-tasks text-green-500 text-xl"></i>
          </div>
        </div>
        <p class="mt-2 text-xs text-gray-500">
          <span class="text-red-600">↓ 5%</span> 较昨日减少
        </p>
      </div>
      
      <!-- 服务健康度 -->
      <div class="bg-white rounded-lg shadow p-5">
        <div class="flex justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">服务健康度</p>
            <p class="text-xl font-semibold text-gray-800 mt-1">{{ serviceHealth }}%</p>
          </div>
          <div class="p-3 rounded-full bg-blue-50">
            <i class="fas fa-heartbeat text-blue-500 text-xl"></i>
          </div>
        </div>
        <p class="mt-2 text-xs text-gray-500">
          <span class="text-green-600">↑ 2%</span> 较昨日提升
        </p>
      </div>
      
      <!-- 系统负载 -->
      <div class="bg-white rounded-lg shadow p-5">
        <div class="flex justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">系统负载</p>
            <p class="text-xl font-semibold text-gray-800 mt-1">{{ systemLoad }}%</p>
          </div>
          <div class="p-3 rounded-full bg-yellow-50">
            <i class="fas fa-server text-yellow-500 text-xl"></i>
          </div>
        </div>
        <p class="mt-2 text-xs text-gray-500">
          <span :class="systemLoad > 70 ? 'text-red-600' : 'text-green-600'">{{ systemLoad > 70 ? '⚠ 较高' : '✓ 正常' }}</span>
        </p>
      </div>
    </div>
    
    <!-- 任务处理统计 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 任务队列状态 -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-800">任务队列状态</h3>
        </div>
        <div class="p-4">
          <div class="flex justify-between items-center mb-5">
            <div>
              <span class="text-sm font-medium text-gray-500">当前队列任务</span>
              <p class="text-xl font-semibold text-gray-800">{{ queuedTasks }}</p>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-500">处理中任务</span>
              <p class="text-xl font-semibold text-gray-800">{{ processingTasks }}</p>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-500">今日完成</span>
              <p class="text-xl font-semibold text-gray-800">{{ completedTasks }}</p>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-500">失败任务</span>
              <p class="text-xl font-semibold text-gray-800">{{ failedTasks }}</p>
            </div>
          </div>
          
          <!-- 任务队列进度条 -->
          <div class="relative pt-1">
            <div class="flex mb-2 items-center justify-between">
              <div>
                <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                  队列进度
                </span>
              </div>
              <div class="text-right">
                <span class="text-xs font-semibold inline-block text-indigo-600">
                  {{ queueProgress }}%
                </span>
              </div>
            </div>
            <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
              <div :style="{ width: queueProgress + '%' }" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"></div>
            </div>
          </div>
          
          <div class="mt-4">
            <button class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">查看详情</button>
          </div>
        </div>
      </div>
      
      <!-- 服务器节点状态 -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-800">服务器节点状态</h3>
        </div>
        <div class="p-4">
          <table class="min-w-full">
            <thead>
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">节点</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">负载</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">响应时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="node in serverNodes" :key="node.id" class="border-b border-gray-200">
                <td class="px-4 py-2 text-sm">{{ node.name }}</td>
                <td class="px-4 py-2">
                  <span :class="{
                    'px-2 py-1 text-xs rounded-full': true,
                    'bg-green-100 text-green-800': node.status === 'online',
                    'bg-red-100 text-red-800': node.status === 'offline',
                    'bg-yellow-100 text-yellow-800': node.status === 'warning'
                  }">
                    {{ node.statusText }}
                  </span>
                </td>
                <td class="px-4 py-2 text-sm">{{ node.load }}%</td>
                <td class="px-4 py-2 text-sm">{{ node.responseTime }}ms</td>
              </tr>
            </tbody>
          </table>
          
          <div class="mt-4">
            <button class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">查看详情</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 最近活动 -->
    <div class="bg-white rounded-lg shadow mb-8">
      <div class="p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-800">最近系统活动</h3>
      </div>
      <div class="p-4">
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead>
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">事件</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">详情</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(activity, index) in recentActivities" :key="index" class="border-b border-gray-200">
                <td class="px-4 py-2 text-sm text-gray-500">{{ activity.time }}</td>
                <td class="px-4 py-2">
                  <span :class="{
                    'px-2 py-1 text-xs rounded-full': true,
                    'bg-blue-100 text-blue-800': activity.type === 'info',
                    'bg-green-100 text-green-800': activity.type === 'success',
                    'bg-yellow-100 text-yellow-800': activity.type === 'warning',
                    'bg-red-100 text-red-800': activity.type === 'error'
                  }">
                    {{ activity.event }}
                  </span>
                </td>
                <td class="px-4 py-2 text-sm">{{ activity.user }}</td>
                <td class="px-4 py-2 text-sm text-gray-500">{{ activity.details }}</td>
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

const taskStore = useTaskStore()

// 仪表盘数据
const totalUsers = ref(245)
const todayTasks = ref(118)
const serviceHealth = ref(98.7)
const systemLoad = ref(62)

const queuedTasks = ref(0)
const processingTasks = ref(0)
const completedTasks = ref(0)
const failedTasks = ref(0)
const queueProgress = ref(0)

// 服务器节点状态
const serverNodes = ref([
  { id: 1, name: '主节点-1', status: 'online', statusText: '在线', load: 75, responseTime: 120 },
  { id: 2, name: '工作节点-1', status: 'online', statusText: '在线', load: 62, responseTime: 145 },
  { id: 3, name: '工作节点-2', status: 'warning', statusText: '警告', load: 87, responseTime: 210 },
  { id: 4, name: '工作节点-3', status: 'offline', statusText: '离线', load: 0, responseTime: 0 }
])

// 最近活动
const recentActivities = ref([
  { time: '2023-03-08 10:23', event: '系统启动', type: 'info', user: '系统', details: '系统服务启动完成' },
  { time: '2023-03-08 10:45', event: '用户登录', type: 'info', user: 'admin', details: '管理员登录系统' },
  { time: '2023-03-08 11:12', event: '任务完成', type: 'success', user: 'user1', details: '图像生成任务#1082成功完成' },
  { time: '2023-03-08 11:30', event: '系统警告', type: 'warning', user: '系统', details: '工作节点-2负载过高' },
  { time: '2023-03-08 11:45', event: '任务失败', type: 'error', user: 'user2', details: '视频生成任务#1085失败' }
])

// 初始化数据
onMounted(async () => {
  // 初始化任务队列数据
  taskStore.initialize()
  
  // 更新任务统计
  queuedTasks.value = taskStore.pendingTasks.length
  processingTasks.value = taskStore.processingTasks.length
  completedTasks.value = taskStore.completedTasks.length
  failedTasks.value = taskStore.failedTasks.length
  
  const total = queuedTasks.value + processingTasks.value + completedTasks.value + failedTasks.value
  queueProgress.value = total > 0 ? Math.round((completedTasks.value / total) * 100) : 0
})
</script> 