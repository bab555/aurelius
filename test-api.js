// 测试多API应用支持

console.log('测试多API应用类型支持');
console.log('===================');

// 模拟环境变量
const env = {
  VITE_API_BASE_URL: 'http://127.0.0.1/v1',
  VITE_TRAVEL_APP_ID: 'travel-app-id',
  VITE_TRAVEL_API_KEY: 'travel-api-key',
  VITE_DESTINY_APP_ID: 'destiny-app-id',
  VITE_DESTINY_API_KEY: 'destiny-api-key',
  VITE_IMAGE_APP_ID: 'image-app-id',
  VITE_IMAGE_API_KEY: 'image-api-key',
};

// 模拟API类型枚举
const APP_TYPES = {
  TRAVEL: 'travel',
  DESTINY: 'destiny',
  IMAGE: 'image',
};

// 模拟获取凭证函数
function getCredentials(appType) {
  switch(appType) {
    case APP_TYPES.DESTINY:
      return {
        appId: env.VITE_DESTINY_APP_ID,
        apiKey: env.VITE_DESTINY_API_KEY
      };
    case APP_TYPES.IMAGE:
      return {
        appId: env.VITE_IMAGE_APP_ID,
        apiKey: env.VITE_IMAGE_API_KEY
      };
    case APP_TYPES.TRAVEL:
    default:
      return {
        appId: env.VITE_TRAVEL_APP_ID,
        apiKey: env.VITE_TRAVEL_API_KEY
      };
  }
}

// 模拟发送消息函数
function sendChatMessage(message, userId, conversationId, files, inputs, appType) {
  const { appId, apiKey } = getCredentials(appType);
  
  console.log(`[${appType}] 发送消息:`, {
    url: `${env.VITE_API_BASE_URL}/chat-messages`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    payload: {
      query: message,
      user: userId,
      conversation_id: conversationId,
      response_mode: 'streaming',
      inputs: inputs || {},
      files: files || []
    }
  });
}

// 模拟Store
const chatStore = {
  currentAppType: APP_TYPES.TRAVEL,
  
  setAppType(appType) {
    if (Object.values(APP_TYPES).includes(appType)) {
      this.currentAppType = appType;
      console.log(`应用类型已切换为: ${appType}`);
    } else {
      console.error(`无效的应用类型: ${appType}`);
    }
  },
  
  sendMessage(content, files, inputs) {
    sendChatMessage(
      content,
      'user-123',
      'conv-456',
      files,
      inputs,
      this.currentAppType
    );
  }
};

// 测试1: 文旅助手
console.log('\n测试1: 文旅助手消息');
chatStore.setAppType(APP_TYPES.TRAVEL);
chatStore.sendMessage('云和县有什么好玩的地方？');

// 测试2: 命理算命
console.log('\n测试2: 命理算命');
chatStore.setAppType(APP_TYPES.DESTINY);
chatStore.sendMessage('开始八字分析', [], {
  year: 1990,
  month: 1,
  day: 1,
  time: 12
});

// 测试3: 图像生成
console.log('\n测试3: 图像生成');
chatStore.setAppType(APP_TYPES.IMAGE);
chatStore.sendMessage('生成一张猫咪图片');

console.log('\n测试完成!'); 