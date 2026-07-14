# 网址净化工具 PRD

## 产品边界

本项目是纯静态的中英文网址净化工具，保持暖橙色双栏工作台与深色模式。只识别 `http://`、`https://`，不补全裸域名；URL 文本处理在浏览器本地完成。页面使用 Google Fonts（Noto Sans SC、Noto Serif SC、JetBrains Mono），字体加载不参与 URL 净化且失败时使用系统字体回退。

## URL 处理规则

1. 输入先做 Unicode NFKC，并清除 U+200B、U+200C、U+200D、U+2060、U+FEFF。
2. 提取器以协议为起点，换行、制表、常见中英文分隔符、说明性中文括号和下一个协议均为边界；同一行多个 URL 必须分开。
3. 净化按 protocol、authority、userinfo、hostname、port、pathname、search、hash 分区。仅 hostname 可清理 emoji、格式字符、插入空格、首尾/连续点号，并谨慎移除夹在 ASCII label 中的中文。
4. pathname、search、hash 保守保留：中文、国际化域名、百分号编码、等号、与号、加号、括号与连续点号均不得因净化被统一删除或压缩。
5. 验证要求协议为 HTTP(S)、hostname 非空且不为 `.`、没有空标签、没有第二个协议或拼接 hostname；不能仅凭 `new URL()` 可构造就通过。
6. 每项结果包含 `original`、`purified`、`changed`、`changeCount`、`warning`、`confidence`、`hasCredentials`。严重污染结果提示人工核对。

## 交互与历史

- 每次打开或刷新固定选中「历史记录」，空状态文案为“暂无历史记录，快去净化第一个网址吧”。支持中文和 English，默认中文，语言偏好保存为 `url_purifier_language`；语言切换不改变当前 Tab。
- 点击净化后，无论是否发现 URL，都会切换到「净化结果」；空结果显示“未检测到有效网址”及完整协议提示。
- 支持 `Command + Enter` 和 `Ctrl + Enter`。输入区可清空，清空不影响结果或历史。
- 历史最多 20 条，只保存 URL 结果及时间；不保存整段输入文本。读取时校验结构并兼容旧 `urls` 数据。含账号或密码的 URL 在历史中脱敏。
- 结果只在用户主动点击访问时以 `target="_blank" rel="noopener noreferrer"` 打开。

## 可访问性

输入有真实 label；Tab 使用 ARIA 语义并支持方向键、Home、End。弹窗具备焦点管理、Escape/遮罩关闭、背景滚动锁定和关闭后焦点返回。Toast 使用 polite live region；主题按钮同步更新标签。用户偏好减少动画时关闭非必要动效。

## 测试与部署

Node 内置测试覆盖空输入、重复 URL、多 URL 边界、全角协议、零宽字符、hostname 污染、中文路径/查询/锚点、国际化域名、连续点号、括号、端口、凭据、百分号编码及错误拼接。

GitHub Actions 在 `main` 推送后执行 `npm test`；通过后构造 `_site/`，仅上传 `index.html`、`src/`、`.nojekyll`，并由 GitHub Pages Actions 部署。可直接双击 `index.html`，也可使用本地 HTTP 服务。预期线上地址为 `https://vicoho.github.io/url-purifier/`；仓库还需在 Settings → Pages 中将 Source 设为 GitHub Actions。
