# Font assets

- `NotoSansSC-AH.ttf`：Noto Sans SC variable font 的游戏字典子集，用于中文正文与标题回退。原字体采用 SIL Open Font License 1.1。
- `OstrichSans-AH.otf`：Ostrich Sans Heavy 的游戏字典子集，用于英文展示字与阿拉伯数字。原字体采用 SIL Open Font License 1.1。
- `onest-var.woff2`：Onest，用于拉丁正文。
- `JetBrainsMono-500.woff2`：JetBrains Mono，用于小型协议标签。

两个子集仅保留游戏中实际使用的字符，以降低首屏字体负担；CSS 中使用项目专属 family alias，不修改字体文件的内部名称。
