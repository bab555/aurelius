<template>
  <div class="message-formatter">
    <!-- 当内容包含markdown代码块且内容包含八字排盘内容时，使用格式化处理，不进入代码块模式 -->
    <template v-if="hasCodeBlock && (content.includes('八字') || content.includes('命盘') || content.includes('五行'))">
      <div class="content-container" :class="{'allow-copy': allowCopy}" v-html="formatGeneral()"></div>
    </template>
    
    <!-- 处理普通代码块 -->
    <template v-else-if="hasCodeBlock">
      <code-block :code="extractCodeBlock()" :language="extractCodeLanguage()"></code-block>
    </template>
    
    <template v-else-if="hasDetailsBlock">
      <div class="custom-details-container" :class="{'allow-copy': allowCopy}">
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
      <div class="content-container" :class="{'allow-copy': allowCopy}" v-html="formatGeneral()"></div>
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
  },
  allowCopy: {
    type: Boolean,
    default: false
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
  // 修改正则表达式，确保准确匹配代码块
  // 使用更精确的检测，确保仅识别独立的代码块
  const codeBlockRegex = /^```([a-z]*)\n([\s\S]+?)\n```$/;
  const hasInlineCode = /```([a-z]*)\n([\s\S]+?)\n```/g.test(props.content);
  
  // 检查是否是markdown格式的命理内容
  const isBaziMarkdown = (props.content.includes('八字') || props.content.includes('命盘') || props.content.includes('五行')) 
                       && props.content.includes('```markdown');
  
  // 如果是命理内容且有markdown标记，使用特殊处理
  if (isBaziMarkdown) {
    console.log('检测到markdown格式的命理内容，使用特殊处理');
    return true;
  }
  
  return hasInlineCode;
});

// 检测内容中是否含有多个代码块
const hasMultipleCodeBlocks = computed(() => {
  if (!props.content) return false;
  
  // 计算代码块的数量
  const matches = props.content.match(/```([a-z]*)\n/g);
  return matches && matches.length > 1;
});

// 检测是否包含details标签
const hasDetailsBlock = computed(() => {
  const hasDetailsOpen = props.content.includes('<details>');
  const hasDetailsClose = props.content.includes('</details>');
  const hasSummaryOpen = props.content.includes('<summary>');
  
  return hasDetailsOpen && hasDetailsClose && hasSummaryOpen;
});

// 提取第一个代码块
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
  
  // 处理多个思考框（双模型叠加作业）
  if (formatted.includes('<details') && formatted.includes('Thinking')) {
    try {
      // 发出内容处理开始信号
      emits('thinking-processing');
      
      // 添加调试信息，查看内容长度和预览
      console.log('检测到思考标签，内容长度:', formatted.length, '前100字符:', formatted.substring(0, 100));
      
      // 首先检查是否有多个 <details 标签，这可能表示多个思考框
      const detailsCount = (formatted.match(/<details/g) || []).length;
      const hasMultipleDetails = detailsCount > 1;
      
      console.log('检测到details标签数量:', detailsCount);
      
      // 检查已完成的思考框数量
      const completedThinkingCount = (formatted.match(/<details[^>]*>[\s\S]*?<\/details>/g) || []).length;
      console.log('完整思考框数量:', completedThinkingCount);
      
      // 支持多个思考框的正则表达式 - 同时匹配完整和不完整的思考框
      const allThinkingBlocks = [];
      
      // 1. 先尝试匹配完整的思考框
      const completeThinkingRegex = /<details[^>]*>\s*<summary>\s*Thinking[^<]*<\/summary>([\s\S]*?)<\/details>/gi;
      
      let match;
      let processedText = formatted;
      let index = 0;
      
      // 提取所有完整的思考块
      while ((match = completeThinkingRegex.exec(formatted)) !== null) {
        const fullMatch = match[0];
        const thinkingContent = match[1].trim();
        
        // 替换为临时标记
        const placeholder = `__THINKING_BLOCK_${index}__`;
        processedText = processedText.replace(fullMatch, placeholder);
        
        // 存储思考块信息
        allThinkingBlocks.push({
          content: thinkingContent,
          placeholder,
          isComplete: true
        });
        
        index++;
      }
      
      // 2. 再检查是否有不完整的思考框（没有结束标签）
      if (hasMultipleDetails && allThinkingBlocks.length < detailsCount) {
        // 可能有不完整的思考框，尝试匹配
        // 使用更宽松的正则表达式，匹配开始但没有结束的思考框
        const incompleteThinkingRegex = /<details[^>]*>\s*<summary>\s*Thinking[^<]*<\/summary>([\s\S]*)$/gi;
        
        // 重置正则状态
        incompleteThinkingRegex.lastIndex = 0;
        
        // 找到可能的不完整思考框
        const incompleteMatch = incompleteThinkingRegex.exec(processedText);
        if (incompleteMatch) {
          const fullMatch = incompleteMatch[0];
          const thinkingContent = incompleteMatch[1].trim();
          
          // 只有当这部分没有被前面的完整匹配替换过，才处理它
          if (processedText.includes(fullMatch)) {
            const placeholder = `__THINKING_BLOCK_${index}__`;
            processedText = processedText.replace(fullMatch, placeholder);
            
            allThinkingBlocks.push({
              content: thinkingContent,
              placeholder,
              isComplete: false
            });
            
            index++;
          }
        }
        
        // 更积极地检测第二个思考框 - 寻找第二个details开头但还没完成的思考框
        if (allThinkingBlocks.length < detailsCount) {
          // 提取第一个完整思考框后的所有内容
          const remainingContent = processedText.split('__THINKING_BLOCK_0__')[1] || '';
          
          // 检查是否有details开头的内容
          if (remainingContent.includes('<details') && remainingContent.includes('Thinking')) {
            console.log('在剩余内容中检测到可能的第二个思考框');
            
            // 尝试匹配第二个思考框的开始部分
            const secondThinkingMatch = remainingContent.match(/<details[^>]*>[\s\S]*?<summary>[\s\S]*?Thinking[\s\S]*?<\/summary>([\s\S]*)/i);
            
            if (secondThinkingMatch) {
              const fullMatch = secondThinkingMatch[0];
              let thinkingContent = secondThinkingMatch[1].trim();
              
              // 限制内容长度，避免匹配过多
              if (thinkingContent.length > 1000) {
                thinkingContent = thinkingContent.substring(0, 1000) + '...';
              }
              
              const placeholder = `__THINKING_BLOCK_${index}__`;
              
              // 替换处理后的内容
              const updatedContent = remainingContent.replace(fullMatch, placeholder);
              processedText = processedText.replace(remainingContent, updatedContent);
              
              allThinkingBlocks.push({
                content: thinkingContent,
                placeholder,
                isComplete: false
              });
              
              index++;
            }
          }
        }
      }
      
      // 如果检测到思考框
      if (allThinkingBlocks.length > 0) {
        console.log(`检测到 ${allThinkingBlocks.length} 个思考框，其中完整的有 ${completedThinkingCount} 个`);
        
        // 处理每个思考框
        for (let i = 0; i < allThinkingBlocks.length; i++) {
          const { content, placeholder, isComplete } = allThinkingBlocks[i];
          
          // 处理内容，移除多余的空白和缩进
          const processedContent = trimThinkingContent(content);
          
          // 减小估计高度的系数，进一步降低高度
          const estimatedHeight = Math.max(50, Math.min(150, processedContent.length / 30));
          
          // 对不完整的思考框添加"思考中..."状态
          const thinkingHeaderText = isComplete 
            ? `AI思考过程${allThinkingBlocks.length > 1 ? ` (${i+1})` : ''}` 
            : `思考中...${allThinkingBlocks.length > 1 ? ` (${i+1})` : ''}`;
          
          const thinkingBoxClass = isComplete ? 'thinking-box' : 'thinking-box thinking-in-progress';
          
          // 创建思考框HTML - 移除多余的margin和padding，减少最小高度
          const thinkingBoxHtml = `
            <div class="${thinkingBoxClass}" style="min-height: ${estimatedHeight}px; transition: none; margin-bottom: 12px;">
              <div class="thinking-header">
                <div class="thinking-dot"></div>
                <div class="thinking-dot"></div>
                <div class="thinking-dot"></div>
                <span>${thinkingHeaderText}</span>
              </div>
              <div class="thinking-content" style="min-height: ${Math.max(40, estimatedHeight - 40)}px;">
                ${processedContent}
                ${!isComplete ? `
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>` : ''}
              </div>
            </div>
          `;
          
          // 替换临时标记
          processedText = processedText.replace(placeholder, thinkingBoxHtml);
        }
        
        // 检查是否有markdown格式的排盘结果
        const hasMarkdownBazi = processedText.includes('```markdown') && 
                            (processedText.includes('八字') || processedText.includes('命盘') || 
                             processedText.includes('五行') || processedText.includes('生肖'));
        
        if (hasMarkdownBazi) {
          processedText = processedText
            .replace(/```markdown\n/g, '<div class="markdown-content">')
            .replace(/\n```/g, '</div>');
        }
        
        // 延迟通知处理完成
        setTimeout(() => {
          emits('thinking-processed');
        }, 500);
        
        return sanitizeHtml(processedText);
      }
    } catch (e) {
      console.error('处理多个思考框时出错:', e);
    }
  }
  
  // 特殊处理：检查是否包含markdown格式的命理内容
  const hasMarkdownBazi = formatted.includes('```markdown') && 
                        (formatted.includes('八字') || formatted.includes('命盘') || formatted.includes('五行'));
  
  if (hasMarkdownBazi) {
    try {
      // 使用特殊处理逻辑处理markdown格式的排盘结果
      console.log('处理markdown格式的排盘结果');
      
      // 如果同时有思考内容，确保不丢失思考内容
      if (formatted.includes('<details') && formatted.includes('Thinking')) {
        // 提取思考内容
        const thinkingCompleteRegex = /<details[^>]*>\s*<summary>\s*Thinking[^<]*<\/summary>([\s\S]*?)<\/details>/i;
        const thinkingCompleteMatch = formatted.match(thinkingCompleteRegex);
        
        if (thinkingCompleteMatch) {
          // 保留思考内容框，处理缩进
          const rawThinkingContent = thinkingCompleteMatch[1].trim();
          const thinkingContent = trimThinkingContent(rawThinkingContent);
          const estimatedHeight = Math.max(50, Math.min(150, thinkingContent.length / 30));
          
          // 提取排盘内容（思考内容之后的所有内容）
          let afterThinking = formatted.replace(thinkingCompleteRegex, '').trim();
          
          // 处理markdown代码块，但保留markdown格式不被转换成代码块
          afterThinking = afterThinking
            .replace(/```markdown\n/g, '<div class="markdown-content">')
            .replace(/\n```/g, '</div>');
          
          // 创建组合结果
          const combinedResult = `
            <div class="thinking-box" style="min-height: ${estimatedHeight}px; transition: none; margin-bottom: 12px;">
              <div class="thinking-header">
                <div class="thinking-dot"></div>
                <div class="thinking-dot"></div>
                <div class="thinking-dot"></div>
                <span>AI思考过程</span>
              </div>
              <div class="thinking-content" style="min-height: ${Math.max(40, estimatedHeight - 40)}px;">
                ${thinkingContent}
              </div>
            </div>
            <div class="result-content">
              ${afterThinking}
            </div>
          `;
          
          return sanitizeHtml(combinedResult);
        }
      }
      
      // 如果没有思考内容，直接处理markdown格式
      formatted = formatted
        .replace(/```markdown\n/g, '<div class="markdown-content">')
        .replace(/\n```/g, '</div>');
    } catch (e) {
      console.error('处理markdown命理内容时出错:', e);
    }
  }
  
  // 处理命理排盘内容 - 识别特定格式和标记
  if (formatted.includes('八字') || formatted.includes('命盘') || formatted.includes('五行') || formatted.includes('生肖')) {
    try {
      // 增强对表格和图表的处理
      formatted = enhanceAstrologyContent(formatted);
    } catch (e) {
      console.error('处理命理内容时出错:', e);
    }
  }
  
  // 特殊处理思考内容 - 包括流式传输中的部分内容
  // 更宽松的正则，可以匹配流式传输中未完成的思考内容
  if (formatted.includes('<details') && formatted.includes('Thinking')) {
    try {
      // 发出内容处理开始信号
      emits('thinking-processing');
      
      // 修改：使用更宽松的匹配条件，更早地捕获思考框内容
      // 尝试匹配开始的思考标签，即使是不完整的
      const thinkingStartMatch = formatted.match(/<details[^>]*>.*?<summary[^>]*>.*?Thinking/i);
      
      if (thinkingStartMatch) {
        // 先检查是否有完整的思考内容（已结束）
        const thinkingCompleteRegex = /<details[^>]*>\s*<summary>\s*Thinking[^<]*<\/summary>([\s\S]*?)<\/details>/i;
        const thinkingCompleteMatch = formatted.match(thinkingCompleteRegex);
        
        // 检查是否有"回答："标记
        const hasAnswer = formatted.includes('回答：') || formatted.includes('回答:');
        
        // 添加：即使思考内容很短也应该立即处理
        const partialContentMatch = formatted.match(/<details[^>]*>\s*<summary>\s*Thinking[^<]*<\/summary>([\s\S]*?)(?:<\/details>|$)/i);
        
        // 检测到完整思考块
        if (thinkingCompleteMatch && thinkingCompleteMatch[1]) {
          // 完整思考内容的处理，移除多余的空白和缩进
          const rawThinkingContent = thinkingCompleteMatch[1].trim();
          const thinkingContent = trimThinkingContent(rawThinkingContent);
          
          // 根据内容长度预先计算最小高度，减少高度变化
          const estimatedHeight = Math.max(50, Math.min(150, thinkingContent.length / 30));
          
          // 创建科技感黑色代码框 - 使用与思考中状态一致的类和结构保持样式连续性
          let newFormatted = `
            <div class="thinking-box" style="min-height: ${estimatedHeight}px; transition: none;">
              <div class="thinking-header">
                <div class="thinking-dot"></div>
                <div class="thinking-dot"></div>
                <div class="thinking-dot"></div>
                <span>AI思考过程</span>
              </div>
              <div class="thinking-content" style="min-height: ${Math.max(40, estimatedHeight - 40)}px;">
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
        } 
        // 没有完整思考块但有思考内容 - 早期流式思考
        else if (partialContentMatch && partialContentMatch[1]) {
          // 处理流式传输中的部分思考内容，处理缩进
          const rawPartialContent = partialContentMatch[1].trim();
          const partialThinkingContent = trimThinkingContent(rawPartialContent);
          
          // 获取内容长度，用于估计需要的高度
          const contentLength = partialThinkingContent.length;
          // 设置最小高度，避免高度变化导致的抖动
          const minHeight = Math.max(50, Math.min(150, contentLength / 30));
          
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
              <div class="thinking-content" style="min-height: ${Math.max(40, minHeight - 40)}px;">
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
  
  // 处理多个代码块的情况
  if (hasMultipleCodeBlocks.value) {
    try {
      formatted = processMultipleCodeBlocks(formatted);
    } catch (e) {
      console.error('处理多个代码块出错:', e);
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
  
  // 处理URL而不替换换行符
  formatted = formatted
    // .replace(/\n/g, '<br>') // 注释掉换行符替换，保留原始的换行符
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-primary hover:underline">$1</a>');
  
  return sanitizeHtml(formatted);
}

// 增强对命理排盘内容的处理
function enhanceAstrologyContent(text) {
  // 如果检测到可能是命理排盘结果
  let enhanced = text;
  
  // 处理可能的表格结构
  enhanced = enhanced.replace(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g, '<div class="astrology-table-row"><div>$1</div><div>$2</div></div>');
  
  // 处理描述性文本段落
  enhanced = enhanced.replace(/【([^】]+)】/g, '<div class="astrology-section-title">【$1】</div>');
  
  // 处理关键字和年份
  enhanced = enhanced.replace(/(\d{4})年/g, '<span class="astrology-year">$1年</span>');
  
  // 强调五行属性
  const wuxingElements = ['金', '木', '水', '火', '土'];
  wuxingElements.forEach(element => {
    enhanced = enhanced.replace(new RegExp(`${element}命`, 'g'), `<span class="wuxing wuxing-${element}">${element}命</span>`);
    enhanced = enhanced.replace(new RegExp(`${element}相`, 'g'), `<span class="wuxing wuxing-${element}">${element}相</span>`);
  });
  
  return enhanced;
}

// 处理多个代码块
function processMultipleCodeBlocks(text) {
  // 替换代码块为临时标记，以便后续处理
  let processed = text;
  const codeBlocks = [];
  
  // 提取所有代码块
  let match;
  const codeRegex = /```([a-z]*)\n([\s\S]+?)\n```/g;
  let index = 0;
  
  while ((match = codeRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const language = match[1] || '';
    const code = match[2] || '';
    
    // 存储代码块信息
    codeBlocks.push({ language, code });
    
    // 替换为临时标记
    const placeholder = `__CODE_BLOCK_${index}__`;
    processed = processed.replace(fullMatch, placeholder);
    index++;
  }
  
  // 替换临时标记为HTML格式化后的代码块
  for (let i = 0; i < codeBlocks.length; i++) {
    const { language, code } = codeBlocks[i];
    const placeholder = `__CODE_BLOCK_${i}__`;
    
    // 创建代码块HTML
    const codeHtml = `<div class="code-block-wrapper">
      <div class="code-header">${language || '代码'}</div>
      <pre class="language-${language || 'plaintext'}"><code>${escapeHtml(code)}</code></pre>
    </div>`;
    
    processed = processed.replace(placeholder, codeHtml);
  }
  
  return processed;
}

// HTML转义函数
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
            
            // 添加点击事件到header上
            header.addEventListener('click', () => {
              // 切换折叠状态
              thinkingBoxOpenState.value[boxId] = !thinkingBoxOpenState.value[boxId];
              
              // 更新指示器
              indicator.innerHTML = thinkingBoxOpenState.value[boxId] ? '▼' : '▲';
              
              // 切换内容显示状态
              content.style.display = thinkingBoxOpenState.value[boxId] ? 'block' : 'none';
              
              // 调整box的最小高度
              if (thinkingBoxOpenState.value[boxId]) {
                // 展开时保持原有高度
                const contentHeight = content.scrollHeight;
                // 设置最小高度为内容高度+header高度
                box.style.minHeight = `${contentHeight + 25}px`;
              } else {
                // 折叠时，最小高度仅为header高度
                box.style.minHeight = '24px';
              }
            });
            
            // 更新内容显示状态
            content.style.display = thinkingBoxOpenState.value[boxId] ? 'block' : 'none';
            
            // 调整初始高度
            if (thinkingBoxOpenState.value[boxId]) {
              // 确保最小高度不会过高，限制为内容的实际高度
              setTimeout(() => {
                const contentHeight = Math.min(150, content.scrollHeight);
                box.style.minHeight = `${contentHeight + 25}px`;
              }, 10);
            } else {
              box.style.minHeight = '24px';
            }
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

// 处理思考框内容的缩进，移除前导空白
function trimThinkingContent(content) {
  if (!content) return '';
  
  // 移除开头的空白行
  let trimmed = content.replace(/^\s*\n+/, '');
  
  // 检查是否有共同的缩进
  const lines = trimmed.split('\n');
  if (lines.length > 1) {
    // 找出非空行的最小缩进
    let minIndent = Infinity;
    lines.forEach(line => {
      if (line.trim() !== '') {
        const indent = line.search(/\S|$/);
        if (indent < minIndent) minIndent = indent;
      }
    });
    
    // 如果存在共同缩进，移除它
    if (minIndent > 0 && minIndent < Infinity) {
      trimmed = lines.map(line => {
        return line.trim() !== '' ? line.substring(minIndent) : line;
      }).join('\n');
    }
  }
  
  return trimmed;
}
</script>

<style scoped>
.message-formatter :deep(a) {
  color: #6366f1;
  text-decoration: none;
}

.message-formatter :deep(a:hover) {
  text-decoration: underline;
}

/* 确保内容正确换行 */
.content-container {
  white-space: pre-wrap !important;
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
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent);
  animation: scanline 6s linear infinite; /* 减慢动画速度 */
  z-index: 20; /* 确保最高层级，高于所有元素 */
  opacity: 0.7;
}

/* 思考框样式优化 - 减少空间占用 */
.message-formatter :deep(.thinking-box) {
  margin: 0.3rem 0;
  background-color: rgba(5, 5, 15, 0.7);
  border-radius: 0.4rem;
  border: 1px solid rgba(99, 102, 241, 0.2);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 5px rgba(99, 102, 241, 0.08);
  position: relative;
  transform: translateZ(0); /* 启用GPU加速 */
  will-change: transform; /* 优化渲染性能 */
  transition: min-height 0.3s ease;
}

/* 禁用悬停动画效果，减少可能的频闪 */
.message-formatter :deep(.thinking-box:hover) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15), 0 0 8px rgba(99, 102, 241, 0.15);
}

/* 思考框横条位于最上方 */
.message-formatter :deep(.thinking-box.thinking-in-progress::before) {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent);
  animation: scanline 6s linear infinite; /* 减慢动画速度 */
  z-index: 20; /* 确保最高层级，高于所有元素 */
  opacity: 0.7;
}

/* 思考内容容器 - 减少内边距和过渡效果 */
.message-formatter :deep(.thinking-content) {
  padding: 0.4rem 0.6rem;
  color: #d1d5db;
  font-family: monospace;
  font-size: 0.8rem;
  line-height: 1.4;
  background-color: rgba(5, 5, 15, 0.8);
  white-space: pre-wrap;
  overflow-x: auto;
  position: relative;
  transition: none;
  border-top: 1px dashed rgba(99, 102, 241, 0.15);
  transform: translateZ(0); /* 启用GPU加速 */
}

/* 调整思考框标题的样式 */
.message-formatter :deep(.thinking-header) {
  display: flex;
  align-items: center;
  padding: 0.3rem 0.6rem;
  height: 24px;
  background-color: rgba(15, 15, 35, 0.9);
  border-bottom: 1px solid rgba(99, 102, 241, 0.15);
  cursor: pointer;
  user-select: none;
  position: relative;
  transition: background-color 0.2s ease;
  z-index: 2;
}

/* 减小标题图标大小 */
.message-formatter :deep(.thinking-dot) {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  margin-right: 3px;
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

/* 减小标题文字大小 */
.message-formatter :deep(.thinking-header span) {
  margin-left: 0.4rem;
  font-size: 0.65rem;
  color: #a3a8c3;
  font-family: monospace;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* 减小折叠指示器大小 */
.message-formatter :deep(.thinking-toggle) {
  position: absolute;
  right: 0.75rem;
  color: #a3a8c3;
  font-size: 0.7rem;
  transition: transform 0.3s ease;
}

.message-formatter :deep(.thinking-header:hover) {
  background-color: #181c36;
}

.message-formatter :deep(.thinking-header:hover .thinking-toggle) {
  color: #b9bdd7;
}

/* 减小思考中的打字机指示器大小和间距 */
.message-formatter :deep(.typing-indicator) {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed rgba(99, 102, 241, 0.2);
}

.message-formatter :deep(.typing-indicator span) {
  width: 5px;
  height: 5px;
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

/* 动画效果 */
@keyframes scanline {
  0% {
    transform: translateY(0%);
    opacity: 0.8;
  }
  100% {
    transform: translateY(0%);
    opacity: 0.2;
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

@keyframes typing {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-3px);
    opacity: 1;
  }
}

/* 增加命理排盘相关样式 */
.message-formatter :deep(.astrology-table-row) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 6px 0;
  padding: 6px;
  border-radius: 4px;
  background-color: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.message-formatter :deep(.astrology-section-title) {
  margin: 12px 0 6px;
  font-weight: 600;
  color: #6366f1;
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
  padding-bottom: 4px;
}

.message-formatter :deep(.astrology-year) {
  font-weight: 500;
  color: #f59e0b;
}

.message-formatter :deep(.wuxing) {
  font-weight: 500;
  padding: 2px 5px;
  border-radius: 3px;
  margin: 0 2px;
}

.message-formatter :deep(.wuxing-金) {
  background: rgba(255, 215, 0, 0.2);
  color: #ffb700;
}

.message-formatter :deep(.wuxing-木) {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.message-formatter :deep(.wuxing-水) {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.message-formatter :deep(.wuxing-火) {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.message-formatter :deep(.wuxing-土) {
  background: rgba(161, 98, 7, 0.2);
  color: #b45309;
}

/* 多代码块处理样式 */
.message-formatter :deep(.code-block-wrapper) {
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  background: #0a0a10;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.message-formatter :deep(.code-header) {
  background: rgba(99, 102, 241, 0.15);
  padding: 6px 12px;
  font-size: 0.8rem;
  color: #a5b4fc;
  font-family: monospace;
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
}

.message-formatter :deep(.code-block-wrapper pre) {
  margin: 0;
  padding: 12px;
  background: transparent;
  border: none;
  white-space: pre-wrap;
}

.message-formatter :deep(.code-block-wrapper code) {
  background: transparent;
  padding: 0;
  border: none;
  font-size: 0.85rem;
  color: #e5e7eb;
}

/* 处理markdown内容的样式 */
.message-formatter :deep(.markdown-content) {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 12px 0;
  padding: 8px 12px;
  background-color: rgba(99, 102, 241, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.message-formatter :deep(.markdown-content h1),
.message-formatter :deep(.markdown-content h2),
.message-formatter :deep(.markdown-content h3) {
  margin-top: 16px;
  margin-bottom: 8px;
  color: #a5b4fc;
}

.message-formatter :deep(.markdown-content ul),
.message-formatter :deep(.markdown-content ol) {
  margin-left: 20px;
  margin-bottom: 12px;
}

.message-formatter :deep(.markdown-content li) {
  margin-bottom: 4px;
}

.message-formatter :deep(.markdown-content table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.message-formatter :deep(.markdown-content th),
.message-formatter :deep(.markdown-content td) {
  border: 1px solid rgba(99, 102, 241, 0.2);
  padding: 6px 10px;
}

.message-formatter :deep(.markdown-content th) {
  background: rgba(99, 102, 241, 0.1);
}

.message-formatter :deep(.result-content) {
  margin-top: 16px;
}

.allow-copy {
  user-select: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  cursor: text;
}

.allow-copy * {
  user-select: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
}
</style> 