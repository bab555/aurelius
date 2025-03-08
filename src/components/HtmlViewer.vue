<template>
  <div class="html-viewer">
    <details 
      v-if="isDetailContent" 
      class="my-3 bg-[#070620] rounded-lg overflow-hidden border border-primary/10"
    >
      <summary class="p-3 cursor-pointer text-gray-300 font-medium hover:bg-[#0a0830] transition-colors">
        {{ extractSummary() }}
      </summary>
      <div class="p-3 border-t border-primary/10 bg-[#080722] text-gray-300">
        <div v-html="sanitizeHtml(extractDetailsContent())"></div>
      </div>
    </details>
    
    <div v-else v-html="sanitizeHtml(content)"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import DOMPurify from 'dompurify';

const props = defineProps({
  content: {
    type: String,
    required: true
  }
});

// 检测是否包含details标签
const isDetailContent = computed(() => {
  const hasDetailsOpen = props.content.includes('<details>');
  const hasDetailsClose = props.content.includes('</details>');
  const hasSummaryOpen = props.content.includes('<summary>');
  const hasSummaryClose = props.content.includes('</summary>');
  
  return hasDetailsOpen && hasDetailsClose && hasSummaryOpen && hasSummaryClose;
});

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
      return contentMatch[1].trim();
    }
    return '';
  } catch (e) {
    console.error('提取details内容失败:', e);
    return props.content;
  }
}

// 净化HTML
function sanitizeHtml(html) {
  // 使用DOMPurify净化HTML，防止XSS攻击
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['a', 'p', 'br', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'code', 'pre', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'class', 'style']
  });
}
</script>

<style scoped>
.html-viewer :deep(a) {
  color: #6366f1;
  text-decoration: none;
}

.html-viewer :deep(a:hover) {
  text-decoration: underline;
}

.html-viewer :deep(pre) {
  background-color: #0a0a10;
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  margin: 0.75rem 0;
}

.html-viewer :deep(code) {
  font-family: monospace;
  background-color: #0a0a10;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(99, 102, 241, 0.1);
  font-size: 0.75rem;
  color: white;
}

.html-viewer :deep(ul), .html-viewer :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.html-viewer :deep(li) {
  margin-bottom: 0.25rem;
}
</style> 