<template>
  <a :href="link">
    <div class="work-card tool-card rounded-lg overflow-hidden">
      <img :src="imageUrl" class="w-full h-48 object-cover" :alt="title">
      <div class="p-4">
        <h3 class="text-white font-semibold mb-2">{{ title }}</h3>
        <div class="flex items-center justify-between">
          <span class="text-gray-400 text-sm">by {{ author }}</span>
          <div class="flex items-center space-x-2">
            <i class="far fa-heart text-red-500"></i>
            <span class="text-gray-400 text-sm">{{ likes }}</span>
          </div>
        </div>
      </div>
    </div>
  </a>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  likes: {
    type: [String, Number],
    default: 0
  },
  link: {
    type: String,
    default: '#'
  }
})
</script> 