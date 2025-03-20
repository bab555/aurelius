<template>
  <div class="voice-synthesis p-6 md:p-8 w-full">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">语音合成</h1>
      <p class="text-gray-400">将文本转换为自然流畅的语音（功能来自百度）</p>
    </div>
    
    <!-- 功能区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 文本输入区 -->
      <div class="lg:col-span-2">
        <div class="bg-gray-900/50 p-6 rounded-xl mb-6">
          <h2 class="text-xl font-semibold text-white mb-4">文本内容</h2>
          <textarea
            v-model="inputText"
            rows="8"
            placeholder="请输入要转换成语音的文本内容..."
            class="w-full p-4 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-primary focus:outline-none resize-none"
            :maxlength="maxTextLength"
          ></textarea>
          <div class="flex justify-between mt-2 text-sm text-gray-500">
            <div>
              <span :class="{'text-red-500': inputText.length > maxTextLength}">
                {{ inputText.length }}
              </span> / {{ maxTextLength }} 字符
            </div>
            <button
              @click="clearText"
              class="text-gray-400 hover:text-white"
              v-if="inputText.length > 0"
            >
              清除
            </button>
          </div>
        </div>
        
        <!-- 合成历史记录 -->
        <div class="bg-gray-900/50 p-6 rounded-xl">
          <h2 class="text-xl font-semibold text-white mb-4">历史记录</h2>
          
          <div v-if="history.length === 0" class="text-center py-8 text-gray-500">
            <i class="fas fa-history text-4xl mb-4"></i>
            <p>暂无合成历史记录</p>
          </div>
          
          <div v-else class="space-y-4">
            <div
              v-for="(item, index) in history"
              :key="index"
              class="bg-gray-800/50 p-4 rounded-lg"
            >
              <div class="flex justify-between mb-2">
                <span class="text-gray-300 truncate max-w-[70%]">{{ item.text.substring(0, 50) }}{{ item.text.length > 50 ? '...' : '' }}</span>
                <span class="text-gray-500 text-sm">{{ item.speakerName }}</span>
              </div>
              
              <div class="flex items-center justify-between">
                <audio 
                  :src="item.audioUrl" 
                  controls 
                  class="w-full max-w-[calc(100%-80px)]"
                ></audio>
                <div class="flex space-x-2">
                  <button 
                    @click="downloadAudio(item.audioUrl, index)" 
                    class="text-primary hover:text-blue-400"
                    title="下载"
                  >
                    <i class="fas fa-download"></i>
                  </button>
                  <button 
                    @click="removeHistoryItem(index)" 
                    class="text-red-500 hover:text-red-400"
                    title="删除"
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 参数设置区 -->
      <div class="lg:col-span-1">
        <!-- 发音人选择 -->
        <div class="bg-gray-900/50 p-6 rounded-xl mb-6">
          <h2 class="text-xl font-semibold text-white mb-4">发音人</h2>
          
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="speaker in speakers"
              :key="speaker.id"
              @click="selectSpeaker(speaker)"
              class="p-3 rounded-lg text-center transition-all border"
              :class="selectedSpeaker.id === speaker.id 
                ? 'bg-primary text-white border-primary' 
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'"
            >
              <div class="font-medium">{{ speaker.name }}</div>
              <div class="text-xs mt-1 opacity-80">{{ speaker.description }}</div>
            </button>
          </div>
        </div>
        
        <!-- 参数调整 -->
        <div class="bg-gray-900/50 p-6 rounded-xl mb-6">
          <h2 class="text-xl font-semibold text-white mb-4">语音参数</h2>
          
          <!-- 语速调整 -->
          <div class="mb-4">
            <div class="flex justify-between mb-1">
              <label class="text-gray-300 text-sm">语速</label>
              <span class="text-gray-500 text-sm">{{ speechOptions.spd }}</span>
            </div>
            <input
              v-model="speechOptions.spd"
              type="range"
              min="0"
              max="15"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            >
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>慢</span>
              <span>快</span>
            </div>
          </div>
          
          <!-- 音调调整 -->
          <div class="mb-4">
            <div class="flex justify-between mb-1">
              <label class="text-gray-300 text-sm">音调</label>
              <span class="text-gray-500 text-sm">{{ speechOptions.pit }}</span>
            </div>
            <input
              v-model="speechOptions.pit"
              type="range"
              min="0"
              max="15"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            >
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>低</span>
              <span>高</span>
            </div>
          </div>
          
          <!-- 音量调整 -->
          <div class="mb-4">
            <div class="flex justify-between mb-1">
              <label class="text-gray-300 text-sm">音量</label>
              <span class="text-gray-500 text-sm">{{ speechOptions.vol }}</span>
            </div>
            <input
              v-model="speechOptions.vol"
              type="range"
              min="0"
              max="15"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            >
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>小</span>
              <span>大</span>
            </div>
          </div>
          
          <!-- 格式选择 -->
          <div class="mb-4">
            <label class="text-gray-300 text-sm block mb-1">音频格式</label>
            <select
              v-model="speechOptions.aue"
              class="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-primary focus:outline-none"
            >
              <option value="3">MP3 格式</option>
              <option value="6">WAV 格式</option>
              <option value="4">PCM-16K</option>
              <option value="5">PCM-8K</option>
            </select>
          </div>
        </div>
        
        <!-- 合成按钮 -->
        <div class="bg-gray-900/50 p-6 rounded-xl">
          <button
            @click="generateSpeech"
            class="w-full py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg text-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed relative"
            :disabled="!inputText.trim() || isProcessing"
          >
            <span v-if="!isProcessing">生成语音</span>
            <span v-else class="flex items-center justify-center">
              <i class="fas fa-spinner fa-spin mr-2"></i> 合成中...
            </span>
          </button>
          
          <div v-if="errorMessage" class="mt-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">
            <i class="fas fa-exclamation-circle mr-1"></i> {{ errorMessage }}
          </div>
          
          <div class="mt-4 text-gray-500 text-sm">
            <p class="mb-1"><i class="fas fa-info-circle mr-1"></i> 说明：</p>
            <ul class="list-disc pl-5 space-y-1">
              <li>每次最多合成{{ maxTextLength }}个字符</li>
              <li>支持中文、英文和数字</li>
              <li>合成的语音将自动保存到历史记录</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { textToSpeech, getSpeakers, isApiAvailable } from '../../services/baiduSpeechApi';

// 常量定义
const maxTextLength = 300; // 最大文本长度限制

// 反应性状态
const inputText = ref('');
const isProcessing = ref(false);
const errorMessage = ref('');
const speakers = ref(getSpeakers());
const selectedSpeaker = ref(speakers.value[0]);
const history = ref([]);

// 语音合成参数
const speechOptions = reactive({
  spd: 5, // 语速，0-15
  pit: 5, // 音调，0-15
  vol: 5, // 音量，0-15
  aue: 3, // 音频格式：3为mp3格式(默认)
});

// 检查API是否可用
onMounted(() => {
  if (!isApiAvailable()) {
    errorMessage.value = '语音合成服务暂时不可用，请联系管理员';
  }
  
  // 从本地存储加载历史记录
  const savedHistory = localStorage.getItem('voiceSynthesisHistory');
  if (savedHistory) {
    try {
      history.value = JSON.parse(savedHistory);
    } catch (e) {
      console.error('加载历史记录失败:', e);
    }
  }
});

// 选择发音人
const selectSpeaker = (speaker) => {
  selectedSpeaker.value = speaker;
};

// 清除文本
const clearText = () => {
  inputText.value = '';
};

// 生成语音
const generateSpeech = async () => {
  if (!inputText.value.trim()) {
    errorMessage.value = '请输入要合成的文本';
    return;
  }
  
  if (inputText.value.length > maxTextLength) {
    errorMessage.value = `文本长度超过限制（${maxTextLength}字符）`;
    return;
  }
  
  errorMessage.value = '';
  isProcessing.value = true;
  
  try {
    // 设置发音人ID
    const options = { 
      ...speechOptions,
      per: selectedSpeaker.value.id
    };
    
    // 调用API生成语音
    const audioUrl = await textToSpeech(inputText.value, options);
    
    // 添加到历史记录
    const historyItem = {
      text: inputText.value,
      audioUrl,
      speakerName: selectedSpeaker.value.name,
      timestamp: Date.now(),
      options
    };
    
    history.value.unshift(historyItem);
    saveHistory();
    
  } catch (error) {
    console.error('语音合成失败:', error);
    errorMessage.value = error.message || '语音合成失败，请稍后再试';
  } finally {
    isProcessing.value = false;
  }
};

// 下载音频
const downloadAudio = (audioUrl, index) => {
  const link = document.createElement('a');
  link.href = audioUrl;
  link.download = `语音合成_${new Date().toISOString().slice(0, 10)}_${index}.mp3`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 移除历史记录项
const removeHistoryItem = (index) => {
  history.value.splice(index, 1);
  saveHistory();
};

// 保存历史记录到本地存储
const saveHistory = () => {
  // 限制历史记录数量，防止存储过大
  if (history.value.length > 20) {
    history.value = history.value.slice(0, 20);
  }
  
  // 保存到本地存储
  localStorage.setItem('voiceSynthesisHistory', JSON.stringify(history.value));
};
</script> 

<style scoped>
/* 自定义滑块样式 */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-primary, #3b82f6);
  border-radius: 50%;
  cursor: pointer;
}

/* 自定义音频播放器样式 */
audio {
  height: 36px;
  border-radius: 18px;
  background-color: rgba(30, 41, 59, 0.5);
}

audio::-webkit-media-controls-panel {
  background-color: rgba(30, 41, 59, 0.5);
}

audio::-webkit-media-controls-play-button,
audio::-webkit-media-controls-mute-button {
  color: var(--color-primary, #3b82f6);
}
</style> 