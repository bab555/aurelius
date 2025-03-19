<template>
  <div class="code-block">
    <pre v-if="language" :class="`language-${language}`" class="bg-[#0a0a10] border border-primary/20 p-4 rounded-lg my-3 overflow-x-auto">
      <code :class="`language-${language}`" class="text-white font-mono text-xs" v-html="highlightedCode"></code>
    </pre>
    <pre v-else class="bg-[#0a0a10] border border-primary/20 p-4 rounded-lg my-3 overflow-x-auto">
      <code class="text-white font-mono text-xs" v-html="formattedCode"></code>
    </pre>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import markdown from 'highlight.js/lib/languages/markdown';
import 'highlight.js/styles/atom-one-dark.css';

// 注册语言
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
// 注册普通文本语言（将普通文本作为无高亮处理但不报错）
hljs.registerLanguage('plaintext', function() {
  return {
    name: 'plaintext',
    contains: []
  };
});
hljs.registerLanguage('text', function() {
  return {
    name: 'text',
    contains: []
  };
});

const props = defineProps({
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: ''
  }
});

const highlightedCode = computed(() => {
  if (!props.code) return '';
  
  try {
    if (props.language) {
      // 特殊处理markdown - 避免嵌套markdown内容导致的问题
      if (props.language === 'markdown' || props.language === 'md') {
        // 对markdown内容进行安全处理，避免渲染问题
        return escapeHtml(props.code);
      }
      
      // 验证语言是否被注册
      if (!hljs.getLanguage(props.language)) {
        console.warn(`未注册的语言: ${props.language}，使用纯文本显示`);
        return escapeHtml(props.code);
      }
      
      // 其他语言正常高亮
      try {
        return hljs.highlight(props.code, { language: props.language }).value;
      } catch (languageError) {
        console.warn(`语言 ${props.language} 高亮失败:`, languageError);
        return escapeHtml(props.code);
      }
    }
    
    // 自动检测语言
    try {
      return hljs.highlightAuto(props.code).value;
    } catch (autoError) {
      console.warn('自动语言检测失败，降级为普通显示', autoError);
      return escapeHtml(props.code);
    }
  } catch (error) {
    console.error('代码高亮失败:', error);
    // 发生错误时，返回安全转义的代码
    return escapeHtml(props.code);
  }
});

const formattedCode = computed(() => {
  return escapeHtml(props.code);
});

// HTML转义
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
</script>

<style scoped>
.code-block {
  position: relative;
}
</style> 