# 网址净化工具 (URL Purifier)

> 自动识别并净化被表情符号、文字穿插污染的网址，还原原始可访问的URL。

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen.svg)](#在线使用)

---

## 在线使用

无需安装，直接在浏览器中打开 `index.html` 即可使用。

或者访问 GitHub Pages 在线版本（部署后更新链接）。

---

## 功能特性

| 功能 | 说明 |
|------|------|
| **智能净化** | 自动识别被污染的URL，移除表情符号、中文字符、多余空格和标点 |
| **批量处理** | 支持同时处理文本中的多个网址 |
| **历史记录** | 本地保存最近20条净化记录，支持查看、复制、删除 |
| **工作台布局** | 桌面端输入区与结果区并排等高显示，移动端自动堆叠 |
| **深色模式** | 支持浅色/深色主题切换，深色模式采用干净的 graphite 配色 |
| **隐私保护** | 纯前端实现，所有数据仅在本地处理，不上传服务器 |
| **响应式设计** | 完美适配桌面端和移动端 |

### 支持的污染类型

- 表情符号穿插：`https://exa😊mple.com`
- 空格穿插：`https://exa mple.com`
- 中文字符穿插：`https://exa测mple.com`
- 多余标点：`https://exa...mple.com`
- 提示文字包裹：`https://example.com（请复制到浏览器）`

---

## 项目结构

```
url-purifier/
├── index.html              # 主页面（单页应用入口）
├── LICENSE                 # MIT 开源协议
├── README.md               # 项目说明（本文件）
├── docs/
│   └── PRD.md              # 产品需求文档
├── src/
│   ├── css/
│   │   └── style.css       # 工作台布局、主题、动效、响应式样式
│   └── js/
│       └── app.js          # 核心功能逻辑
└── .github/
    └── workflows/          # GitHub Actions 工作流
```

---

## 技术栈

- **纯原生实现**：HTML5 + CSS3 + JavaScript（ES6+）
- **零依赖**：无需任何构建工具或第三方库
- **本地存储**：使用 localStorage 保存主题偏好和历史记录
- **字体**：Google Fonts（Noto Sans SC, Noto Serif SC, JetBrains Mono）

---

## 使用说明

1. 在输入框中粘贴包含被污染网址的文本
2. 点击「一键净化」按钮（或按 `Ctrl + Enter`）
3. 查看净化结果，可直接复制或访问
4. 切换「历史记录」Tab 查看过往处理记录
   - 历史记录直接显示净化后的URL链接，点击即可跳转
   - 点击「查看详情」可查看原始文本（支持一键复制）

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + Enter` | 快速触发净化 |

---

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/vicoho/url-purifier.git

# 进入项目目录
cd url-purifier

# 直接在浏览器中打开
open index.html
```

---

## 浏览器兼容性

| 浏览器 | 版本 |
|--------|------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

## 隐私声明

本项目完全在浏览器本地运行：
- 不会收集任何用户数据
- 不会发送任何请求到外部服务器
- 历史记录仅保存在浏览器的 localStorage 中
- 清除浏览器数据会同时清除历史记录

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 开源协议

本项目基于 [MIT License](LICENSE) 开源。

---

## 设计说明

- 首屏直接展示输入区和结果/历史区，避免把功能说明放在主流程之前
- 底部仅保留轻量 Tips，用于提示批量处理、本地处理和快捷键
- 浅色模式采用暖白纸面风格，深色模式采用干净的 graphite/charcoal 风格
- 字体由 [Google Fonts](https://fonts.google.com) 提供

---

> 网址净化工具 · 让被污染的链接重获新生
