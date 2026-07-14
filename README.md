# 网址净化工具（URL Purifier）

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-在线使用-brightgreen.svg)](https://vicoho.github.io/url-purifier/) [![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)

纯静态的网址净化工具：从文本中提取 `http://` 和 `https://` 地址，谨慎清理 hostname 中的污染字符。在线使用：[https://vicoho.github.io/url-purifier/](https://vicoho.github.io/url-purifier/)

## 特性

- 支持同一段文本中的多个 URL，遇到下一个协议立即结束前一个候选。
- NFKC 规范化全角协议，清理零宽字符；hostname 可修复 emoji、空格和连续点号。
- 保留合法的中文路径、查询、锚点、百分号编码、连续点号、括号及国际化域名。
- 所有处理均在浏览器本地完成；不加载第三方字体、统计服务或外部 API。
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

然后访问 `http://localhost:8000`。无需安装浏览器运行时依赖。

## 项目结构

```text
url-purifier/
├── index.html
├── package.json
├── src/
│   ├── css/style.css
│   └── js/
│       ├── app.js          # DOM、历史、主题与交互
│       └── purifier.js     # 可测试的提取、净化与验证逻辑
├── tests/purifier.test.mjs
├── docs/PRD.md
└── .github/workflows/static.yml
```

## 隐私与部署

输入内容不会上传；运行页面时不请求第三方字体、CDN、统计或广告服务。历史只保存在当前浏览器的 localStorage，清除浏览器数据会一并删除。

推送 `main` 后，GitHub Actions 会先执行 `npm test`，再只发布 `index.html`、`src/` 和 `.nojekyll` 到 GitHub Pages。

## 浏览器兼容性

支持具备 ES Modules、`URL`、Unicode 正则与 Clipboard API 的现代浏览器；复制功能在 Clipboard API 受限时会尝试浏览器原生回退。

## 开源协议

[MIT License](LICENSE)
