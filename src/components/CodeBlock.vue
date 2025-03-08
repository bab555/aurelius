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
      return hljs.highlight(props.code, { language: props.language }).value;
    }
    return hljs.highlightAuto(props.code).value;
  } catch (error) {
    console.error('代码高亮失败:', error);
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