# 🚀 Cloudflare Pages 部署指南

## 简介
本项目已配置支持直接部署到 **Cloudflare Pages**，无需服务器即可运行。Cloudflare Pages 提供全球 CDN 加速、自动 SSL、免费域名等特性。

## 🎯 特性
- ✅ **零服务器部署** - 无需 VPS 或服务器
- ✅ **全球 CDN** - 自动全球加速
- ✅ **免费 SSL** - 自动 HTTPS 证书
- ✅ **自定义域名** - 支持绑定自定义域名
- ✅ **自动部署** - GitHub Actions 自动部署
- ✅ **环境变量** - 安全存储 API 密钥

## 📋 部署要求

### 1. 准备工作
- **Cloudflare 账户** - [注册](https://dash.cloudflare.com/sign-up)
- **GitHub 账户** - 用于代码托管
- **Gemini API Key** - 从 [Google AI Studio](https://makersuite.google.com/app/apikey) 获取

### 2. 项目结构
```
shouban-figurine-generator/
├── index.html           # 主页面
├── admin.html           # 管理后台
├── style.css            # 主样式
├── admin-style.css      # 管理后台样式
├── script.js            # 前端脚本
├── admin-script.js      # 管理后台脚本
├── _worker.js           # Cloudflare Worker
├── wrangler.toml        # Cloudflare 配置
├── .env                 # 环境变量模板
└── package.json         # 项目配置
```

## 🔧 快速部署

### 方法一：一键部署 (推荐)

1. **Fork 本项目** 到你的 GitHub 账户

2. **在 Cloudflare Dashboard**:
   - 进入 [Cloudflare Pages](https://dash.cloudflare.com/pages)
   - 点击 "Create a project"
   - 选择 "Connect to Git"
   - 选择你的 GitHub 账户和 fork 的项目

3. **配置构建设置**:
   - **Build command**: `npm run build`
   - **Build output directory**: `./`
   - **Root directory**: `./`

4. **设置环境变量**:
   ```bash
   GEMINI_API_KEY=你的_gemini_api_key
   DEFAULT_PROMPT=Use the nano-banana model to create a 1/7 scale commercialized figure...
   GEMINI_MODEL=nano-banana
   PORT=3000
   ```

5. **点击 "Save and Deploy"**

### 方法二：手动部署

#### 1. 安装 Wrangler CLI
```bash
npm install -g wrangler
```

#### 2. 登录 Cloudflare
```bash
wrangler login
```

#### 3. 配置环境变量
创建 `.env` 文件：
```bash
GEMINI_API_KEY=你的_gemini_api_key
DEFAULT_PROMPT=Use the nano-banana model to create a 1/7 scale commercialized figure...
GEMINI_MODEL=nano-banana
```

#### 4. 部署到 Cloudflare Pages
```bash
# 开发环境测试
npm run serve

# 部署到生产环境
npm run deploy

# 部署到测试环境
npm run deploy:staging
```

## 🌍 环境配置

### 1. 设置 KV 存储 (可选)
用于存储用户配置：

```bash
# 创建 KV 命名空间
wrangler kv:namespace create "CONFIG_KV"

# 在 wrangler.toml 中配置
[[kv_namespaces]]
binding = "CONFIG_KV"
id = "your-kv-namespace-id"
```

### 2. 环境变量
在 Cloudflare Pages 设置中配置：

| 变量名 | 描述 | 示例 |
|--------|------|------|
| `GEMINI_API_KEY` | Google Gemini API 密钥 | `AIzaSy...` |
| `DEFAULT_PROMPT` | 默认生成提示词 | `生成手办风格的...` |
| `GEMINI_MODEL` | Gemini 模型名称 | `nano-banana` |
| `ENVIRONMENT` | 环境标识 | `production` |

## 🔄 自动部署

项目已配置 GitHub Actions，推送代码到 main 分支将自动部署：

1. **Fork 项目**
2. **在 GitHub 设置 Secrets**:
   - `CLOUDFLARE_ACCOUNT_ID`: 你的 Cloudflare 账户 ID
   - `GEMINI_API_KEY`: Gemini API 密钥
   - `DEFAULT_PROMPT`: 默认提示词
   - `GEMINI_MODEL`: 模型名称

3. **推送代码**:
```bash
git add .
git commit -m "feat: 更新功能"
git push origin main
# 自动触发部署
```

## 🌐 自定义域名

1. **在 Cloudflare Pages 设置中**
2. **点击 "Custom domains"**
3. **添加你的域名**
4. **按照提示配置 DNS**

## 📱 访问地址

部署完成后，你将获得：
- **主页面**: `https://your-project.pages.dev`
- **管理后台**: `https://your-project.pages.dev/admin.html`
- **API 测试**: `https://your-project.pages.dev/api/config`

## 🛠️ 故障排除

### 常见问题

1. **API 调用失败**
   - 检查 `GEMINI_API_KEY` 是否正确设置
   - 确认 API 密钥有访问权限

2. **部署失败**
   - 检查 GitHub Actions 日志
   - 确认所有环境变量已设置

3. **自定义域名不工作**
   - 确认 DNS 记录已正确配置
   - 等待 DNS 生效 (通常几分钟到几小时)

### 调试命令

```bash
# 本地测试
wrangler pages dev

# 查看日志
wrangler pages deployment tail

# 检查配置
wrangler pages deployment list
```

## 📝 高级配置

### 1. 自定义 KV 存储
```javascript
// 在 _worker.js 中使用 KV
const config = await env.CONFIG_KV.get("user_config");
```

### 2. 速率限制
```javascript
// 添加速率限制中间件
const rateLimit = async (request, env) => {
  // 实现速率限制逻辑
};
```

### 3. 图片优化
```javascript
// 使用 Cloudflare Images 优化
const optimizedImage = await fetch(`https://imagedelivery.net/${env.CF_ACCOUNT_HASH}/${imageId}/public`);
```

## 🔗 相关链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Google Gemini API 文档](https://ai.google.dev/docs)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

## 📞 支持

如有问题，请检查：
1. Cloudflare 控制台日志
2. GitHub Actions 运行日志
3. 浏览器开发者工具网络面板

---

**🎉 恭喜！** 现在你可以一键部署手办生成器到全球 CDN 了！