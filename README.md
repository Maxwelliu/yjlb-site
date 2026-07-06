# 硬件老兵学 AI · 静态站样板

GitHub Pages 零构建静态站样板 — 公众号文章归档 + 小工具集。

## 结构

```
.
├── docs/                        ← GitHub Pages 根目录
│   ├── index.html              ← 首页（最新文章 + 工具入口）
│   ├── articles/
│   │   ├── list.html           ← 全部文章列表
│   │   └── 2026-07-06-ai-agent.html  ← 单篇文章示例
│   ├── tools/
│   │   └── power-calc.html     ← 硬件参数计算器
│   ├── css/
│   │   └── style.css           ← 自定义样式（Tailwind 不够用的部分）
│   └── js/
│       └── power-calc.js       ← 计算器逻辑
├── .nojekyll                    ← 关掉 Jekyll（避免下划线开头文件被忽略）
└── README.md
```

## 部署（GitHub Pages）

1. 仓库 Settings → Pages
2. Source: Deploy from a branch
3. Branch: main / docs folder
4. 等 1-2 分钟，访问 `https://<user>.github.io/<repo>/`

## 新增一篇文章

复制 `docs/articles/2026-07-06-ai-agent.html` 改文件名/标题/正文，
然后在 `docs/index.html` 最新文章区加一行链接。

## 新增一个工具

复制 `docs/tools/power-calc.html` 改 id/逻辑，
然后在 `docs/index.html` 工具区加卡片。

## 为什么不用 Tailwind 打包

- 维护成本低：纯 HTML/CSS/JS，不学构建工具
- 部署快：GitHub Pages 秒级生效
- 私有化容易：整个目录拷到任何静态服务器都能跑