<template>
  <div class="tool-card p-6 rounded-lg">
    <a :href="link">
      <div class="flex items-center mb-4">
        <div class="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
          <i :class="iconClass + ' text-primary text-xl'"></i>
        </div>
        <h3 class="text-white text-xl font-semibold ml-4">{{ title }}</h3>
      </div>
      <p class="text-gray-400">{{ description }}</p>
    </a>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  iconClass: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: '#'
  }
})
</script> 