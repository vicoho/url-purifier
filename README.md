# 网址净化工具（URL Purifier）

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployment-brightgreen.svg)](https://vicoho.github.io/url-purifier/) [![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)

纯静态的网址净化工具：从文本中提取 `http://` 和 `https://` 地址，谨慎清理 hostname 中的污染字符。GitHub Pages 预期地址为 [https://vicoho.github.io/url-purifier/](https://vicoho.github.io/url-purifier/)；需先在仓库 Settings → Pages 中将 Source 设为 GitHub Actions。

## 特性

- 支持同一段文本中的多个 URL，遇到下一个协议立即结束前一个候选。
- NFKC 规范化全角协议，清理零宽字符；hostname 可修复 emoji、空格和连续点号。
- 保留合法的中文路径、查询、锚点、百分号编码、连续点号、括号及国际化域名。
- URL 净化在浏览器中完成；页面不使用统计服务或外部 API，但会从 Google Fonts 加载字体。
- 本地历史最多 20 条，只保存 URL 结果，不保存整段输入文本；包含凭据的 URL 会在历史中脱敏。

网址净化是启发式处理。污染严重或结果提示需要核对的网址，请人工确认后再访问；不要通过 URL 传递敏感凭据。

## 使用方式

1. 粘贴包含完整 `http://` 或 `https://` 地址的文本。
2. 点击「一键净化」，或按 `Command + Enter` / `Ctrl + Enter`。
3. 页面打开时固定显示「历史记录」；净化后自动切换到「净化结果」。

## 本地运行与测试

```bash
npm test
python3 -m http.server 8000
```

然后访问 `http://localhost:8000`。也可以直接双击 `index.html` 通过 `file://` 使用；无需安装浏览器运行时依赖。

## 项目结构

```text
url-purifier/
├── index.html
├── package.json
├── src/
│   ├── css/style.css
│   └── js/
│       ├── app.js          # DOM、历史、主题、语言与交互
│       ├── i18n.js         # 中文与 English 文案
│       └── purifier.js     # 可测试的提取、净化与验证逻辑
├── tests/
│   ├── purifier.test.mjs   # URL 净化回归测试
│   ├── browser-compat.test.mjs
│   └── i18n.test.mjs
└── .github/workflows/static.yml
```

## 隐私与部署

URL 输入与净化在浏览器中执行，不会上传到项目服务端。历史只保存在当前浏览器的 localStorage，清除浏览器数据会一并删除。页面会请求 Google Fonts（Noto Sans SC、Noto Serif SC、JetBrains Mono）；字体服务不参与 URL 净化，加载失败时自动使用系统字体回退。

界面支持中文和 English，默认中文；语言按钮位于主题按钮左侧，选择会保存在浏览器中。

推送 `main` 后，GitHub Actions 会先执行 `npm test`，再只发布 `index.html`、`src/` 和 `.nojekyll` 到 GitHub Pages。首次部署前需在仓库 Settings → Pages → Source 选择 GitHub Actions；尚未完成该设置时，线上地址不会可用。

## 浏览器兼容性

支持具备 `URL`、Unicode 正则与 Clipboard API 的现代浏览器；复制功能在 Clipboard API 受限时会尝试浏览器原生回退。

## 贡献

欢迎通过 [Issues](https://github.com/vicoho/url-purifier/issues) 提交问题或建议；代码修改请保持原生静态实现，并在提交前运行 `npm test`。提交信息采用 Conventional Commits，例如 `fix: describe the change`。

## 开源协议

[MIT License](LICENSE)
