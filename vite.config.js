import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  publicDir: 'public',
  server: {
    fs: {
      allow: ['ui', '.', 'src']
    },
    allowedHosts: ['test000.natapp1.cc'],
    proxy: {
      '/api/baidu': {
        target: 'https://aip.baidubce.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/baidu/, '')
      }
    }
  }
}) 