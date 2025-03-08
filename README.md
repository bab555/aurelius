# 天枢 AI (Aurelius)

天枢 AI 是一个综合性 AI 工具集平台，旨在为用户提供多种 AI 功能，包括AI方案助手、AI文生图、AI修图、AI视频、AI PPT助手等智能工具。

## 技术栈

- 前端框架：Vue.js 3 (Composition API)
- 路由管理：Vue Router 4
- 状态管理：Pinia
- UI框架：TailwindCSS
- 构建工具：Vite

## 项目结构

```
aurelius/
├── public/                 # 静态资源
├── src/                    # 源代码
│   ├── assets/             # 静态资源
│   ├── components/         # 公共组件
│   ├── views/              # 页面组件
│   ├── router/             # 路由配置
│   ├── stores/             # 状态管理
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
├── index.html              # HTML模板
├── package.json            # 项目配置
├── vite.config.js          # Vite配置
├── tailwind.config.js      # TailwindCSS配置
└── README.md               # 项目说明
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 功能模块

- **首页**：展示推荐AI工具和优秀作品
- **AI 方案助手**：基于大型语言模型的聊天式AI辅助
- **AI 文生图**：文本生成图像功能
- **AI 修图**：智能图像编辑功能
- **AI 视频**：智能视频创作与编辑
- **AI PPT 助手**：智能生成演示文稿
- **AI 文字游戏**：创意写作辅助

## 后端集成

本项目主要关注前端实现，后端通过API与各种AI服务进行集成：

- Dify：提供对话式AI功能
- ComfyUI：提供图像生成功能
- 其他AI服务

## 开发规范

详见 [rules.txt](./rules.txt) 文件。 