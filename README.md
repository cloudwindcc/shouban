# 手办图片生成器

一个基于 Google Gemini AI 的手办图片生成网站，用户可以上传图片并生成对应的手办风格图片。

## 功能特性

- 🖼️ 图片上传（支持拖拽）
- 🤖 Google Gemini AI 图片生成
- ⚙️ 后台配置管理
- 📝 可自定义提示词
- 🎨 多种预设风格
- 📱 响应式设计

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (原生)
- **后端**: Node.js, Express
- **AI**: Google Gemini 2.5 Nano Banana
- **文件处理**: Multer
- **其他**: dotenv, axios, uuid

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
GEMINI_API_KEY=your_gemini_api_key_here
DEFAULT_PROMPT=将这个图片转换成可爱的手办风格，保持角色特征，增加手办质感，精细的细节，高质量渲染
PORT=3000
```

### 3. 获取 Gemini API Key

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建新的 API Key
3. 将 API Key 填入 `.env` 文件或通过后台管理界面配置

### 4. 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 5. 访问网站

- 主页: http://localhost:3000
- 管理后台: http://localhost:3000/admin.html

## 使用指南

### 主页面使用

1. 点击或拖拽上传图片
2. 编辑生成提示词（可使用默认提示词）
3. 点击"生成手办图片"按钮
4. 等待生成完成
5. 下载生成的图片

### 管理后台

访问 `/admin.html` 进行系统配置：

- **API配置**: 设置 Gemini API Key 和模型选择
- **默认提示词**: 配置默认的生成提示词
- **提示词预设**: 使用预定义的风格模板
- **系统状态**: 查看 API 连接状态

## 提示词预设

系统内置多种风格预设：

- **可爱风格**: 超可爱的Q版手办风格，大眼睛，圆润造型
- **精致风格**: 高品质手办风格，精细细节，专业涂装
- **动漫风格**: 经典动漫手办风格，还原动画角色
- **写实风格**: 写实风格手办，真实质感，细腻纹理

## 文件结构

```
shoubanIMG/
├── index.html          # 主页面
├── admin.html          # 管理后台
├── style.css           # 主页样式
├── admin-style.css     # 后台样式
├── script.js           # 主页脚本
├── admin-script.js     # 后台脚本
├── server.js           # 服务器入口
├── package.json        # 项目配置
├── .env.example        # 环境变量示例
├── README.md           # 说明文档
├── uploads/            # 上传文件目录
└── outputs/            # 生成文件目录
```

## API 接口

### POST /api/generate
生成手办图片

**参数:**
- `image`: 上传的图片文件
- `prompt`: 生成提示词

**响应:**
```json
{
  "success": true,
  "imageUrl": "/outputs/generated-image.jpg",
  "description": "生成描述"
}
```

### GET /api/config
获取当前配置

### POST /api/config
更新配置

**参数:**
```json
{
  "apiKey": "新的API密钥",
  "defaultPrompt": "默认提示词",
  "model": "模型名称"
}
```

## 注意事项

1. 确保有足够的存储空间用于图片上传和生成
2. Gemini API 有调用限制，请注意配额使用
3. 上传的图片大小限制为 10MB
4. 支持的图片格式：JPG, PNG, GIF

## 故障排除

### 常见问题

1. **API Key 错误**: 检查 Gemini API Key 是否正确设置
2. **文件上传失败**: 检查文件大小和格式是否符合要求
3. **生成失败**: 检查网络连接和 API 配额

### 日志查看

服务器日志会显示详细的错误信息，有助于调试问题。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！