# Markdown Reader

一个纯前端、零依赖的 Markdown 本地阅读器。拖入 `.md` 文件即可渲染，**文件不离开本地**。

## 功能

- 拖拽 / 点击打开 `.md` 文件，本地渲染
- 左侧目录（TOC），滚动跟随高亮
- 全文搜索定位标题
- 复制渲染结果、导出为 HTML
- 本地运行，无网络请求，文件不上传

## 快速开始

直接双击 `index.html` 打开即可使用，无需构建。

本地起服务（可选，配合 `.claude/launch.json` 的 `md-reader` 预览）：

```bash
python3 -m http.server 8001 --bind 127.0.0.1
```

然后浏览器访问 http://127.0.0.1:8001 。

## 技术栈

- 原生 HTML/CSS/JS，无框架
- [marked](https://github.com/markedjs/marked) 渲染 Markdown
- [DOMPurify](https://github.com/cure53/DOMPurify) 清洗 HTML，防 XSS
- 依赖已内置于 `vendor/`，离线可用

## 目录结构

```
.
├── index.html    # 入口
├── app.js        # 渲染 / 目录 / 搜索逻辑
├── style.css     # 样式
├── vendor/       # marked + DOMPurify（本地内置）
└── 示例文档.md    # 测试样例
```
