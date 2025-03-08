<template>
  <div class="message-formatter">
    <template v-if="hasCodeBlock">
      <code-block :code="extractCodeBlock()" :language="extractCodeLanguage()"></code-block>
    </template>
    
    <template v-else-if="hasDetailsBlock">
      <div class="custom-details-container">
        <details 
          class="my-3 bg-[#070620] rounded-lg overflow-hidden border border-primary/10"
          :class="{'is-open': isOpen}"
          @toggle="handleDetailsToggle($event)"
        >
          <summary class="p-3 cursor-pointer text-gray-300 font-medium hover:bg-[#0a0830] transition-colors">
            {{ extractSummary() }}
          </summary>
          <div class="p-3 border-t border-primary/10 bg-[#080722] text-gray-300" v-html="sanitizeHtml(extractDetailsContent())"></div>
        </details>
      </div>
    </template>
    
    <template v-else>
      <div class="content-container" v-html="formatGeneral()"></div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue';
import DOMPurify from 'dompurify';
import CodeBlock from './CodeBlock.vue';

const props = defineProps({
  content: {
    type: String,
    required: true
  }
});

// 控制details的展开状态
const isOpen = ref(false);

// 处理details的toggle事件
const handleDetailsToggle = (event) => {
  isOpen.value = event.target.open;
};

// 检测是否包含代码块
const hasCodeBlock = computed(() => {
  return /```([a-z]*)\n([\s\S]+?)\n```/g.test(props.content);
});

// 检测是否包含details标签
const hasDetailsBlock = computed(() => {
  const hasDetailsOpen = props.content.includes('<details>');
  const hasDetailsClose = props.content.includes('</details>');
  const hasSummaryOpen = props.content.includes('<summary>');
  
  return hasDetailsOpen && hasDetailsClose && hasSummaryOpen;
});

// 提取代码块
function extractCodeBlock() {
  try {
    const codeMatch = props.content.match(/```([a-z]*)\n([\s\S]+?)\n```/);
    if (codeMatch && codeMatch[2]) {
      return codeMatch[2].trim();
    }
    return '';
  } catch (e) {
    console.error('提取代码失败:', e);
    return props.content;
  }
}

// 提取代码语言
function extractCodeLanguage() {
  try {
    const langMatch = props.content.match(/```([a-z]*)\n/);
    if (langMatch && langMatch[1]) {
      return langMatch[1].trim();
    }
    return '';
  } catch (e) {
    console.error('提取代码语言失败:', e);
    return '';
  }
}

// 提取summary内容
function extractSummary() {
  try {
    const summaryMatch = props.content.match(/<summary>(.*?)<\/summary>/s);
    if (summaryMatch && summaryMatch[1]) {
      return summaryMatch[1].trim();
    }
    return '详细信息';
  } catch (e) {
    console.error('提取summary失败:', e);
    return '详细信息';
  }
}

// 提取details内容
function extractDetailsContent() {
  try {
    const contentMatch = props.content.match(/<details>.*?<summary>.*?<\/summary>(.*?)<\/details>/s);
    if (contentMatch && contentMatch[1]) {
      return formatGeneral(contentMatch[1].trim());
    }
    return '';
  } catch (e) {
    console.error('提取details内容失败:', e);
    return formatGeneral(props.content);
  }
}

// 定义事件，用于通知外部组件思考框内容正在处理
const emits = defineEmits(['thinking-processing', 'thinking-processed']);

// 通用格式化
function formatGeneral(text = props.content) {
  let formatted = text || ''; // 确保text不是null或undefined
  
  // 特殊处理思考内容 - 包括流式传输中的部分内容
  // 更宽松的正则，可以匹配流式传输中未完成的思考内容
  if (formatted.includes('<details') && formatted.includes('Thinking')) {
    try {
      // 发出内容处理开始信号
      emits('thinking-processing');
      
      // 尝试匹配开始的思考标签
      const thinkingStartMatch = formatted.match(/<details[^>]*>\s*<summary>\s*Thinking[^<]*<\/summary>/i);
      
      if (thinkingStartMatch) {
        // 检查是否有完整的思考内容（已结束）
        const thinkingCompleteRegex = /<details[^>]*>\s*<summary>\s*Thinking[^<]*<\/summary>([\s\S]*?)<\/details>/i;
        const thinkingCompleteMatch = formatted.match(thinkingCompleteRegex);
        
        // 检查是否有"回答："标记
        const hasAnswer = formatted.includes('回答：') || formatted.includes('回答:');
        
        if (thinkingCompleteMatch && thinkingCompleteMatch[1]) {
          // 完整思考内容的处理 - 与之前相同
          const thinkingContent = thinkingCompleteMatch[1].trim();
          
          // 根据内容长度预先计算最小高度，减少高度变化
          const estimatedHeight = Math.max(150, Math.min(300, thinkingContent.length / 10));
          
          // 创建科技感黑色代码框 - 使用与思考中状态一致的类和结构保持样式连续性
          let newFormatted = `
            <div class="thinking-box" style="min-height: ${estimatedHeight}px; transition: none;">
              <div class="thinking-header">
                <div class="thinking-dot"></div>
                <div class="thinking-dot"></div>
                <div class="thinking-dot"></div>
                <span>AI思考过程</span>
              </div>
              <div class="thinking-content" style="min-height: ${Math.max(80, estimatedHeight - 40)}px;">
                ${thinkingContent}
              </div>
            </div>
          `;
          
          // 如果有回答部分，提取并添加
          if (hasAnswer) {
            const answerRegex = /<p[^>]*>\s*(?:回答：|回答:)\s*<\/p>\s*([\s\S]*)/i;
            const answerMatch = formatted.match(answerRegex);
            if (answerMatch && answerMatch[1]) {
              newFormatted += answerMatch[1].trim();
            } else {
              // 尝试提取所有思考内容之后的文本
              const afterThinking = formatted.replace(thinkingCompleteRegex, '').trim();
              if (afterThinking) {
                newFormatted += afterThinking;
              }
            }
          }
          
          // 延迟更长时间再通知处理完成，确保DOM完全稳定
          setTimeout(() => {
            emits('thinking-processed');
          }, 500); // 增加延迟时间，确保DOM完全稳定
          
          return sanitizeHtml(newFormatted);
        } else {
          // 处理流式传输中的部分思考内容
          // 提取已经传输的部分思考内容
          const partialContentMatch = formatted.match(/<details[^>]*>\s*<summary>\s*Thinking[^<]*<\/summary>([\s\S]*)/i);
          
          if (partialContentMatch && partialContentMatch[1]) {
            const partialThinkingContent = partialContentMatch[1].trim();
            
            // 获取内容长度，用于估计需要的高度
            const contentLength = partialThinkingContent.length;
            // 设置最小高度，避免高度变化导致的抖动
            const minHeight = Math.max(150, Math.min(300, contentLength / 6));
            
            // 创建科技感黑色代码框，但标记为"思考中..."
            // 设置固定最小高度以减少高度变化带来的抖动
            const result = sanitizeHtml(`
              <div class="thinking-box thinking-in-progress" style="min-height: ${minHeight}px; transform: translateZ(0); transition: none;">
                <div class="thinking-header">
                  <div class="thinking-dot"></div>
                  <div class="thinking-dot"></div>
                  <div class="thinking-dot"></div>
                  <span>思考中...</span>
                </div>
                <div class="thinking-content" style="min-height: ${Math.max(80, minHeight - 40)}px;">
                  ${partialThinkingContent}
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            `);
            
            return result;
          }
        }
      }
      
      // 到这里意味着没有匹配到思考内容，也需要发出处理完成信号
      nextTick(() => {
        emits('thinking-processed');
      });
    } catch (e) {
      console.error('处理思考内容时出错:', e);
      // 出错时回退到默认处理方式
      nextTick(() => {
        emits('thinking-processed');
      });
    }
  }
  
  // 如果文本已经包含HTML标签，处理流式内容中的details标签
  if (/<\/?[a-z][\s\S]*>/i.test(formatted)) {
    // 处理原始HTML中的details标签，改为自定义样式
    formatted = formatted.replace(
      /<details>([\s\S]*?)<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g, 
      '<div class="dynamic-details"><div class="dynamic-summary">$2</div><div class="dynamic-content">$3</div></div>'
    );
    
    return sanitizeHtml(formatted);
  }
  
  // 处理行内代码
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-[#0a0a10] border border-primary/10 px-1.5 py-0.5 rounded text-white font-mono text-xs">$1</code>');
  
  // 处理换行符和URL
  formatted = formatted
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-primary hover:underline">$1</a>');
  
  return sanitizeHtml(formatted);
}

// 净化HTML
function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['a', 'p', 'br', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'code', 'pre', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'article', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'details', 'summary'],
    ALLOWED_ATTR: ['href', 'target', 'class', 'style', 'id', 'title', 'open']
  });
}

// 存储动态details的打开状态
const dynamicOpenStates = ref({});

// 处理动态内容交互
const activateContentInteraction = () => {
  // 使用setTimeout确保在下一个DOM更新周期执行
  setTimeout(() => {
    // 发出内容处理开始信号
    emits('thinking-processing');
    
    try {
      const containers = document.querySelectorAll('.content-container');
      
      if (!containers || !containers.length) {
        // 如果没有找到容器，也需要通知处理完成
        nextTick(() => {
          emits('thinking-processed');
        });
        return;
      }
      
      // 处理每个内容容器
      containers.forEach(container => {
        if (!container) return; // 跳过不存在的元素
        
        // 查找并处理动态details
        const detailsElements = container.querySelectorAll('.dynamic-details');
        
        if (!detailsElements || !detailsElements.length) return;
        
        detailsElements.forEach((detail, idx) => {
          if (!detail) return; // 跳过不存在的元素
          
          const detailId = `detail-${Date.now()}-${idx}`;
          
          // 只处理未初始化的元素
          if (!detail.dataset.initialized) {
            detail.dataset.initialized = 'true';
            
            // 设置初始状态
            if (!(detailId in dynamicOpenStates.value)) {
              dynamicOpenStates.value[detailId] = false; // 默认关闭
            }
            
            const summary = detail.querySelector('.dynamic-summary');
            
            if (summary && !summary.dataset.initialized) {
              summary.dataset.initialized = 'true';
              
              try {
                summary.addEventListener('click', () => {
                  dynamicOpenStates.value[detailId] = !dynamicOpenStates.value[detailId];
                  
                  // 根据状态更新UI
                  updateDetailState(detail, dynamicOpenStates.value[detailId]);
                });
              } catch (e) {
                console.error('添加details点击事件失败:', e);
              }
            }
            
            // 初始更新状态
            updateDetailState(detail, dynamicOpenStates.value[detailId]);
          }
        });
      });
      
      // 查找与处理思考框
      const thinkingBoxes = document.querySelectorAll('.thinking-box');
      activateThinkingBoxes(thinkingBoxes);
    } catch (e) {
      console.error('激活内容交互失败:', e);
    } finally {
      // 无论处理成功与否，都通知内容处理完成
      nextTick(() => {
        emits('thinking-processed');
      });
    }
  }, 0);
};

// 更新details状态
const updateDetailState = (detail, isOpen) => {
  if (!detail) return; // 确保detail元素存在
  
  const summary = detail.querySelector('.dynamic-summary');
  const content = detail.querySelector('.dynamic-content');
  
  if (summary && content) {
    try {
      // 更新summary样式
      if (isOpen) {
        summary.classList.add('is-open');
      } else {
        summary.classList.remove('is-open');
      }
      
      // 更新内容显示
      content.style.display = isOpen ? 'block' : 'none';
    } catch (e) {
      console.error('更新details状态失败:', e);
    }
  }
};

// 存储MutationObserver实例
const observer = ref(null);

// 思考框折叠状态
const thinkingBoxOpenState = ref({});

// 激活思考框交互
const activateThinkingBoxes = (boxes) => {
  if (!boxes || !boxes.length) return;
  
  boxes.forEach((box, index) => {
    if (!box) return; // 确保box元素存在
    
    const boxId = `thinking-box-${Date.now()}-${index}`;
    
    if (!box.dataset.boxId) {
      box.dataset.boxId = boxId;
      
      const header = box.querySelector('.thinking-header');
      const content = box.querySelector('.thinking-content');
      
      if (header && content) {
        // 判断是否为思考中状态
        const isInProgress = box.classList.contains('thinking-in-progress');
        
        // 思考中的内容不允许折叠
        if (!isInProgress) {
          // 设置初始折叠状态
          if (!(boxId in thinkingBoxOpenState.value)) {
            thinkingBoxOpenState.value[boxId] = true; // 默认展开
          }
          
          try {
            // 添加折叠/展开指示器
            const indicator = document.createElement('div');
            indicator.className = 'thinking-toggle';
            indicator.innerHTML = thinkingBoxOpenState.value[boxId] ? '▼' : '▲';
            header.appendChild(indicator);
            
            // 更新内容显示状态
            content.style.display = thinkingBoxOpenState.value[boxId] ? 'block' : 'none';
          } catch (e) {
            console.error('添加思考框交互元素失败:', e);
          }
        }
      }
    }
  });
};

// 增强观察器，也监控思考框，但添加防抖
let mutationDebounceTimer = null;
let isProcessing = false;

const enhancedObserver = () => {
  if (observer.value) {
    observer.value.disconnect();
  }
  
  observer.value = new MutationObserver((mutations) => {
    // 如果正在处理中，跳过此次观察
    if (isProcessing) {
      return;
    }
    
    let shouldProcess = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        shouldProcess = true;
        break;
      }
    }
    
    if (!shouldProcess) {
      return;
    }
    
    // 设置处理状态，防止重复触发
    isProcessing = true;
    
    // 使用防抖，延迟处理DOM变更
    clearTimeout(mutationDebounceTimer);
    mutationDebounceTimer = setTimeout(() => {
      activateContentInteraction(); // 处理函数会发出thinking-processed信号
      
      // 重置处理状态
      isProcessing = false;
    }, 100); // 100ms防抖延迟
  });
  
  // 获取内容容器并开始观察
  const contentContainers = document.querySelectorAll('.content-container, .custom-details-container');
  contentContainers.forEach(container => {
    if (container) {
      observer.value.observe(container, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  });
};

// 在组件挂载后处理动态内容
onMounted(() => {
  try {
    // 延迟处理，确保DOM完全加载
    setTimeout(() => {
      activateContentInteraction();
    }, 10);
  } catch (e) {
    console.error('组件挂载后处理动态内容失败:', e);
    // 确保即使出错也通知完成
    emits('thinking-processed');
  }
});

// 监听内容更新，处理新的动态内容
watch(() => props.content, () => {
  try {
    // 激活内容交互功能
    setTimeout(() => {
      activateContentInteraction();
    }, 10);
  } catch (e) {
    console.error('内容更新处理失败:', e);
    // 确保即使出错也通知完成
    emits('thinking-processed');
  }
});

// 组件即将卸载前清理
onBeforeUnmount(() => {
  // 如果有MutationObserver实例，需要断开连接
  if (observer.value) {
    try {
      observer.value.disconnect();
    } catch (e) {
      console.error('断开MutationObserver连接失败:', e);
    }
  }
});
</script>

<style scoped>
.message-formatter :deep(a) {
  color: #6366f1;
  text-decoration: none;
}

.message-formatter :deep(a:hover) {
  text-decoration: underline;
}

.message-formatter :deep(pre) {
  background-color: #0a0a10;
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  margin: 0.75rem 0;
}

.message-formatter :deep(code) {
  font-family: monospace;
  background-color: #0a0a10;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(99, 102, 241, 0.1);
  font-size: 0.75rem;
  color: white;
}

.message-formatter :deep(ul), .message-formatter :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.message-formatter :deep(li) {
  margin-bottom: 0.25rem;
}

/* 自定义details样式 */
.custom-details-container :deep(details) {
  transition: all 0.3s ease;
}

.custom-details-container :deep(details[open]) summary {
  background-color: rgba(99, 102, 241, 0.1);
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
}

.custom-details-container :deep(details.is-open) summary {
  background-color: rgba(99, 102, 241, 0.1);
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
}

.custom-details-container :deep(summary) {
  position: relative;
  list-style: none; /* 移除默认箭头 */
}

.custom-details-container :deep(summary::-webkit-details-marker) {
  display: none; /* 移除Webkit浏览器的默认箭头 */
}

.custom-details-container :deep(summary::after) {
  content: '▼';
  position: absolute;
  right: 1rem;
  font-size: 0.75rem;
  transition: transform 0.3s;
}

.custom-details-container :deep(details[open] summary::after) {
  transform: rotate(180deg);
}

/* 动态生成的details样式 */
.content-container :deep(.dynamic-details) {
  background-color: #070620;
  border: 1px solid rgba(99, 102, 241, 0.1);
  border-radius: 0.5rem;
  margin: 0.75rem 0;
  overflow: hidden;
}

.content-container :deep(.dynamic-summary) {
  padding: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  color: #d1d5db;
  background-color: #04031e;
  transition: background-color 0.2s;
  position: relative;
  user-select: none; /* 防止文字选择 */
}

.content-container :deep(.dynamic-summary)::after {
  content: '▼';
  position: absolute;
  right: 1rem;
  font-size: 0.75rem;
  transition: transform 0.3s;
}

.content-container :deep(.dynamic-summary.is-open)::after {
  transform: rotate(180deg);
}

.content-container :deep(.dynamic-summary:hover) {
  background-color: #0a0830;
}

.content-container :deep(.dynamic-summary.is-open) {
  background-color: rgba(99, 102, 241, 0.1);
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
}

.content-container :deep(.dynamic-content) {
  padding: 0.75rem;
  border-top: 1px solid rgba(99, 102, 241, 0.1);
  background-color: #080722;
  color: #d1d5db;
  transition: max-height 0.3s ease, height 0.3s ease; /* 平滑高度变化 */
}

/* 思考中状态样式 */
.message-formatter :deep(.thinking-in-progress) {
  position: relative;
}

.message-formatter :deep(.thinking-in-progress .thinking-header span) {
  position: relative;
}

.message-formatter :deep(.thinking-in-progress .thinking-header span::after) {
  content: "";
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #6366f1;
  margin-left: 4px;
  animation: thinking-pulse 1.5s infinite;
  box-shadow: 0 0 5px rgba(99, 102, 241, 0.8);
}

.message-formatter :deep(.thinking-in-progress .thinking-dot:nth-child(1)) {
  animation: dot-pulse 1.5s infinite 0s;
}

.message-formatter :deep(.thinking-in-progress .thinking-dot:nth-child(2)) {
  animation: dot-pulse 1.5s infinite 0.2s;
}

.message-formatter :deep(.thinking-in-progress .thinking-dot:nth-child(3)) {
  animation: dot-pulse 1.5s infinite 0.4s;
}

.message-formatter :deep(.thinking-in-progress::before) {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #6366f1, transparent);
  animation: thinking-scan 2s linear infinite;
  z-index: 1;
}

/* 思考框样式优化 - 减少动画和频闪 */
.message-formatter :deep(.thinking-box) {
  margin: 1rem 0;
  background-color: #0a0a10;
  border-radius: 0.5rem;
  border: 1px solid rgba(99, 102, 241, 0.3);
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 0 10px rgba(99, 102, 241, 0.1);
  position: relative;
  transform: translateZ(0); /* 启用GPU加速 */
  will-change: transform; /* 优化渲染性能 */
}

/* 禁用悬停动画效果，减少可能的频闪 */
.message-formatter :deep(.thinking-box:hover) {
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15), 0 0 15px rgba(99, 102, 241, 0.2);
  /* 移除transform变换，减少频闪 */
  /* transform: translateY(-1px); */
}

/* 减少扫描线动画速度 */
.message-formatter :deep(.thinking-box.thinking-in-progress::before) {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.6), transparent);
  animation: scanline 6s linear infinite; /* 减慢动画速度 */
  z-index: 1;
  opacity: 0.7;
}

/* 思考内容容器 - 减少过渡效果 */
.message-formatter :deep(.thinking-content) {
  padding: 1rem;
  color: #d1d5db;
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  background-color: #0a0a10;
  white-space: pre-wrap;
  overflow-x: auto;
  position: relative;
  /* 移除height和max-height的过渡，减少频闪 */
  transition: none;
  border-top: 1px dashed rgba(99, 102, 241, 0.2);
  transform: translateZ(0); /* 启用GPU加速 */
}

.message-formatter :deep(.thinking-header) {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #131525;
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
  cursor: pointer;
  user-select: none;
  position: relative;
  transition: background-color 0.2s ease;
  z-index: 2; /* 确保在scanline之上 */
}

.message-formatter :deep(.thinking-dot) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.message-formatter :deep(.thinking-box:hover .thinking-dot) {
  opacity: 1;
}

.message-formatter :deep(.thinking-dot:nth-child(1)) {
  background-color: #ff5f56;
}

.message-formatter :deep(.thinking-dot:nth-child(2)) {
  background-color: #ffbd2e;
}

.message-formatter :deep(.thinking-dot:nth-child(3)) {
  background-color: #27c93f;
}

.message-formatter :deep(.thinking-header span) {
  margin-left: 0.75rem;
  font-size: 0.75rem;
  color: #a3a8c3;
  font-family: monospace;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.message-formatter :deep(.thinking-toggle) {
  position: absolute;
  right: 1rem;
  color: #a3a8c3;
  font-size: 0.75rem;
  transition: transform 0.3s ease;
}

.message-formatter :deep(.thinking-header:hover) {
  background-color: #181c36;
}

.message-formatter :deep(.thinking-header:hover .thinking-toggle) {
  color: #b9bdd7;
}

/* 添加扫描线动画 */
@keyframes scanline {
  0% {
    transform: translateY(-100%);
  }
  50% {
    transform: translateY(1500%);
  }
  100% {
    transform: translateY(3000%);
    opacity: 0;
  }
}

@keyframes thinking-pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.5);
  }
}

@keyframes dot-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

@keyframes thinking-scan {
  0% {
    left: -20%;
    width: 20%;
  }
  100% {
    left: 100%;
    width: 20%;
  }
}

/* 思考中的打字机指示器 */
.message-formatter :deep(.typing-indicator) {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(99, 102, 241, 0.2);
}

.message-formatter :deep(.typing-indicator span) {
  width: 6px;
  height: 6px;
  margin: 0 2px;
  background-color: #6366f1;
  border-radius: 50%;
  display: inline-block;
  opacity: 0.4;
}

.message-formatter :deep(.typing-indicator span:nth-of-type(1)) {
  animation: typing 1.3s infinite 0.1s;
}

.message-formatter :deep(.typing-indicator span:nth-of-type(2)) {
  animation: typing 1.3s infinite 0.2s;
}

.message-formatter :deep(.typing-indicator span:nth-of-type(3)) {
  animation: typing 1.3s infinite 0.3s;
}

@keyframes typing {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-5px);
    opacity: 1;
  }
}
</style> 