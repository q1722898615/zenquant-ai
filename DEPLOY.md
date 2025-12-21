# ZenQuant 部署文档

本项目目前为一个 **单页应用 (SPA)**，基于 React 构建。可以直接部署到任何支持静态网站托管的服务商 (如 Vercel, Netlify, Cloudflare Pages) 或使用 Nginx/Docker 在私有服务器上部署。

## 1. 环境依赖

*   **Node.js**: v18.0.0 或更高版本
*   **Google Gemini API Key**: 需要从 Google AI Studio 获取

## 2. 本地构建

在项目根目录下运行以下命令安装依赖并构建：

```bash
# 安装依赖
npm install

# 设置环境变量 (Linux/Mac)
export API_KEY="你的_GOOGLE_GEMINI_API_KEY"

# 构建生产环境代码
# 注意：由于使用了 process.env.API_KEY，构建工具(如Vite/Webpack)通常需要在构建时注入变量
# 如果使用 Vite，请确保在 .env 文件中以 VITE_ 开头，或者配置 define 选项
npm run build
```

构建完成后，生成的静态文件位于 `dist/` 或 `build/` 目录中。

---

## 3. 部署方案 A: 使用 Vercel (推荐)

最简单的部署方式，支持自动化 CI/CD。

1.  将代码推送到 GitHub/GitLab。
2.  在 Vercel控制台 导入项目。
3.  在 **Settings > Environment Variables** 中添加：
    *   Key: `API_KEY` (注意：如果是前端直接调用，需确保构建工具配置允许暴露此 Key，或者使用 Vercel 的 Serverless Function 代理请求以保护 Key)
    *   *安全提示*: 当前 MVP 版本是在前端直接调用 Gemini API。生产环境建议将 API 调用逻辑移至 Next.js API Routes 或后端服务器，以防 API Key 泄露。
4.  点击 **Deploy**。

---

## 4. 部署方案 B: Docker + Nginx (私有服务器)

适用于部署到阿里云/AWS等云服务器。

### Dockerfile 示例

在根目录创建 `Dockerfile`:

```dockerfile
# Stage 1: Build
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# 传入 API Key (注意：仅在构建时使用，构建出的静态文件包含 Key，请勿公开镜像)
ARG API_KEY
ENV API_KEY=$API_KEY
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# 如果有 React Router 路由问题，需要配置 nginx.conf 支持 History 模式
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf 示例

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
```

### 启动命令

```bash
docker build --build-arg API_KEY=你的key -t zenquant-app .
docker run -d -p 80:80 zenquant-app
```

---

## 5. 安全注意事项

当前版本为 **MVP (最小可行性产品)**，Google Gemini API Key 在前端代码中使用。
*   **风险**: 任何访问网页的人都可以通过浏览器开发者工具查看到 API Key。
*   **生产环境建议**: 
    1.  **后端代理**: 创建一个轻量级后端 (Python FastAPI 或 Node.js)，将 Key 保存在后端环境变量中。前端请求后端，后端转发请求给 Google。
    2.  **API 限制**: 在 Google Cloud Console 中限制该 API Key 只能被特定的 HTTP Referer (你的域名) 调用。
