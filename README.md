# My AI Chat

一个基于现代技术栈构建的AI聊天应用，包含前端React界面和后端Express服务器，使用Ollama进行AI模型集成。

## 项目结构

```
my-ai-chat/
├── client/              # 前端React应用
├── server/              # 后端Express服务器
├── packages/
│   └── shared/          # 共享代码库
├── .github/             # GitHub配置
├── .gitignore           # Git忽略文件配置
├── .husky/              # Git钩子配置
├── biome.json           # Biome代码风格配置
├── package.json         # 根目录package.json
├── pnpm-lock.yaml       # pnpm依赖锁文件
└── pnpm-workspace.yaml  # pnpm工作区配置
```

## 技术栈

### 前端 (client/)
- **框架**: React 19
- **语言**: TypeScript
- **样式**: TailwindCSS
- **构建工具**: Rsbuild
- **测试**: Testing Library + JSDOM
- **代码风格**: Biome

### 后端 (server/)
- **框架**: Express
- **语言**: TypeScript
- **AI集成**: Ollama
- **环境变量**: dotenv
- **跨域支持**: CORS

### 开发工具
- **包管理器**: pnpm
- **Git钩子**: Husky + lint-staged
- **代码检查**: Biome

## 功能特性

### 前端功能
- AI聊天界面
- Markdown渲染支持
- 响应式设计
- 实时消息显示

### 后端功能
- RESTful API
- AI模型集成 (Ollama)
- 环境变量配置
- CORS支持

## 安装和运行

### 前置要求
- Node.js 18+
- pnpm 10+
- Ollama (用于AI模型)

### 安装依赖

```bash
# 安装所有依赖
pnpm install
```

### 运行项目

#### 开发模式

```bash
# 同时运行前端和后端开发服务器
# 注意：需要分别在不同终端运行

# 运行前端开发服务器
cd client
pnpm dev

# 运行后端开发服务器
cd server
pnpm dev
```

#### 构建和生产运行

```bash
# 构建所有项目
pnpm build

# 运行后端生产服务器
cd server
pnpm start
```

## 项目脚本

### 根目录脚本

```bash
# 构建所有项目
pnpm build

# 运行所有项目的lint检查
pnpm lint

# 运行所有项目的测试
pnpm test

# 运行所有项目的类型检查
pnpm type-check
```

### 前端脚本 (client/)

```bash
# 开发服务器
pnpm dev

# 构建项目
pnpm build

# 预览构建结果
pnpm preview

# 运行测试
pnpm test

# 代码检查和修复
pnpm lint:fix

# 类型检查
pnpm type-check
```

### 后端脚本 (server/)

```bash
# 开发服务器
pnpm dev

# 构建项目
pnpm build

# 生产运行
pnpm start

# 类型检查
pnpm type-check
```

## 环境配置

### 后端环境变量

在 `server/.env` 文件中配置：

```env
# 服务器端口
PORT=3000

# Ollama API配置
OLLAMA_URL=http://localhost:11434
```

## 代码风格

项目使用 Biome 进行代码检查和格式化。提交代码前会自动运行 lint-staged 进行检查。

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

ISC
