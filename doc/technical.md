# 《异常手牌 / Anomaly Hand》技术文档

## 1. 技术栈

- React 18 + TypeScript 5 构建界面与回合状态。
- Less 负责响应式布局、位图裁切/遮罩、卡牌视觉和动效。
- Vite 5 构建，`base: './'`，生产输出位于 `dist/`，资源路径可在任意部署子目录运行。
- Web Audio API 合成纸张、机械定位、命中、护盾、受伤、签名技、评级、发牌和结算多层音效；首次用户操作后才创建 `AudioContext`，压缩器限制峰值。
- 8 位英雄各使用独立透明 WebP；人物由 Aigram transit raster 流程生成，卡框和套印系统由 CSS/SVG 绘制。
- 未选英雄复用统一透明 WebP 并以敌对档案筛网进入战斗；6 张基础行动牌使用本地 SVG 象征物插图。
- `src/shared/` 提供存档、头像生图、模型异变和按永久游戏 UUID 分区的平台排行榜请求。
- 轻量 `i18n` 模块支持中文与英文，通过 `localStorage.game_locale` 覆盖或浏览器语言自动检测。

## 2. 目录结构

```text
anomaly-hand/
├── doc/
│   ├── requirements.md          # 玩法、数值、控制、胜负与音效蓝图
│   ├── visual.md                # “异能档案”视觉系统
│   ├── screen-contract.md       # 屏幕、状态、层级与恢复规则
│   ├── feedback-matrix.md       # 交互反馈与时间设计
│   ├── technical.md             # 本文档
│   └── visual-qa.md             # 运行截图、问题与复验记录
├── public/art/
│   └── style-exploration-board.png # 当前 meta 封面与探索记录，不被游戏 CSS 直接引用
├── src/
│   ├── fonts/                   # Onest、JetBrains Mono 与中英展示字体子集
│   ├── AnomalyHand/
│   │   ├── img/heroes/cutouts/  # 8 位英雄战备透明 WebP
│   │   ├── img/heroes/states/   # 8 位英雄战损透明 WebP
│   │   ├── img/interface/        # 敌方档案与共享战斗底板 WebP
│   │   ├── i18n/index.ts        # zh/en 字典、语言检测与变量插值
│   │   ├── AnomalyHand.tsx      # 所有屏幕与可访问交互
│   │   ├── AnomalyHand.less     # 视觉系统、响应式与动效
│   │   ├── useAnomalyHand.ts    # 单局状态机与战斗结算
│   │   ├── data.ts              # 英雄、卡牌、敌人和强化数据
│   │   ├── types.ts             # 游戏类型
│   │   ├── icons.tsx            # 同一几何语法的内联 SVG 图标
│   │   ├── audio.ts             # 合成音效与静音状态
│   │   └── index.ts             # 组件导出
│   ├── App.tsx
│   ├── index.less
│   └── main.tsx
├── _artifacts/heroes/           # 生图日志、阶段产物与角色联系表
├── _qa/ui/                      # 390×844 与 320×568 首轮/复验截图
├── scripts/generate-heroes.cjs  # 上传参考、transit 生图与透明化脚本
├── scripts/generate-interface-art.cjs # 界面位图制作与请求日志
├── meta.json
├── package.json
└── vite.config.ts
```

## 3. 核心模块

### 状态管理与回合

`useAnomalyHand.ts` 管理 `select → evolution → battle → reward → defeat`。选择页把当前人物池完整洗牌并铺开；确认后进入可停留的“活体档案”说明页，再开始首场。每一轮由“当前人物池减去玩家所选角色”的全部对手组成，`createRivalEncounterRoster(player, round)` 随机排序并按遭遇序号/轮次计算生命和攻击；清空数组时显示 2,400 ms 的轮次封存章，随后进入下一轮，生命归零才是唯一结算。`turnOwner`、`battleEntry`、`chapter`、`feedback`、`playedCardId` 与 `handDealId` 维持战斗节奏；`round`、`totalEncounters`、`maxStreak`、`runId` 支持无尽挑战和一次性分数上报。

### 卡牌与序列

`data.ts` 定义 6 张基础牌和 8 位英雄。每回合随机抽取 3 张不重复牌；连续使用不同类别增加序列。序列达到 3 时，`makeHand()` 把最右牌替换为当前英雄的签名牌。8 位英雄的被动和签名技在 `playCard()` 与敌方意图结算中处理；临时状态包括 Smith 的怒意、Isabel 的首次恢复、G€tü 的动能与 KI_Bo 的预见序列。

### 敌人与战后强化

当前人物池中的全部未选行动员都可作为敌对档案，拥有固定意图 pattern。除最后一名敌人外，奇数序号的胜利进入 reward 状态，从 5 个强化中随机显示 3 个；强化写入 `Upgrades` 并影响后续牌值、开场序列、胜后回血或暴露伤害。`selectedRewardId` 单独保存 620 毫秒的装订反馈状态：选中卡保持语义专色与确认章，其余卡禁用并降噪，反馈完成后再初始化下一场。

### 屏幕适配

界面是响应式 DOM，不使用整页 transform 缩放。主容器宽度上限 520 px；战斗舞台与手牌通过 CSS Grid 分配。320 × 568 媒体查询把外边距和牌间距压缩，使三张牌保持 104 × 150，顶部图标按钮保持 44 × 44。

### 英雄资产与完整卡面

`data.ts` 静态导入 `img/heroes/cutouts/*.webp`，供首发 8 位英雄的战斗状态与战损切换使用。运行时个人档案则不使用这条扣底链路：`usePlayerArchiveCard.ts` 会从 6 个 `ARCHIVE_CARD_STYLES` 中用加密随机数锁定一个方向，将 `pendingStyle` 先持久化，再以头像作身份参考调用 `useGenImage` 生成一张完整场景插画。成功卡保存为 `artUrl` 和 `style`；旧存档的 `portraitUrl` 仅作兼容读取。`AnomalyHand.tsx` 的个人档案预览优先渲染 `artUrl`，Less 用圆角遮罩、细纸边高光和柔和投影承载整张插画，而不是叠加厚重档案框。

### 界面位图

`AnomalyHand.tsx` 静态导入三张敌人 WebP 并通过 `ENEMY_ART` 映射到敌人 ID。`HeroArt` 与 `EnemyArt` 均将 raster 人物层和可响应的档案框、定位环、扫描层、角标分离；`ah-stage__atmosphere` 输出常态的低频纸屑，`ah-stage__burst` 只在真实命中时输出短促专色纸屑。战斗网格把桌面固定在层级 1、手牌在 2、`ah-battle__resolution` 在 40；两拍结算不再嵌入舞台，而是由隔离的结果覆盖层承载，底板伪元素只在结果卡内部叠放。`AnomalyHand.less` 把 `battle-table.webp` 作为战斗舞台、战术卡、奖励与规则面板的共享纸张底纹，通过裁切位置、暗色遮罩和语义专色区分状态。错误生成的手机框、紫色卡面与人物污染素材不被源码引用，因此不会进入 `dist/`。

### 字体系统

`fonts/NotoSansSC-AH.ttf` 与 `fonts/OstrichSans-AH.otf` 是依据 `i18n/index.ts` 制作的字符子集。Noto Sans SC 负责中文标题和中文正文回退；Ostrich Sans Heavy 负责英文展示字与阿拉伯数字；Onest 负责拉丁正文；JetBrains Mono 负责小型协议标签。`AnomalyHand.less` 通过 `@font-display`、`@font-number` 与 Less mixin 统一标题、卡名、生命、伤害、档案编号和结果数值，数字启用等宽排列并使用 1 px 红青硬边套印。

### 敌人与图标

三名敌人使用独立 raster 档案图；Less 只叠加暗部可读层、套印标记、命中错位和裁切框。功能图标全部由 `icons.tsx` 内的 24 × 24 SVG 提供，不使用 Emoji。

### 音频与输入

`audio.ts` 延迟创建 Web Audio，并通过模块级静音标志阻止新音效。振荡器、噪声缓冲、滤波器和总线压缩器组成纸张/机械/冲击的分层声响；常规牌、精准应对、签名技和结算拥有不同的音高、密度与低频强度。战斗牌、奖励和结果按钮使用 `onPointerDown`；菜单、规则与静音等工具控件使用 `onClick`，避免菜单在浏览器的按下态中失效；可滚动英雄列表使用 `onClick`。键盘 `1/2/3` 可打牌，规则覆盖层支持 Escape 关闭。

### 多语言

`i18n/index.ts` 在模块初始化时读取 `localStorage.game_locale`，未覆盖时依据 `navigator.language` 选择 `zh` 或 `en`。所有界面、卡牌、英雄能力、敌人和奖励文案通过 `t(key, vars)` 输出；切换语言后刷新即可生效。

### 个人档案、异变与排行榜

`usePlayerArchiveCard.ts` 用 `useGameSave` 的本地镜像保存个人行动员卡、敌对记录和异变。首次点击接入才读取公开资料并调用 `useGenImage`；风格选择在请求前写入 `pendingStyle`，所以 4 分钟生成恢复窗口、3 分钟失败冷却与 210 秒超时后的重试仍会使用同一套卡面方向，不会出现同一人物重进后变成不同风格的卡。旧存档只含 `portraitUrl` 时不再被当作完成卡：它会作为一次身份参考，保留原 ID/姓名/创建时间并升级为 `artUrl`。4/8/12 张记录时串行调用 `useChat`，只接受白名单中的异变效果。`useArchiveLeaderboard.ts` 只在 Aigram 和永久 UUID 存在时调用 `/rank/score/save` 与 `/rank/score/list/by/session_id`；同一 `runId` 只上报一次，榜单的非本人行通过 `openAigramProfile` 打开资料。

## 4. 扩展点

- 增加英雄：在 `data.ts` 添加 Hero，补齐 `i18n/index.ts` 的中英文能力键，并在 `makeSignature()` 与出牌/敌方结算中加入被动和签名效果；把独立肖像放入 `src/AnomalyHand/img/heroes/cutouts/`。
- 换首发人物素材：替换对应透明 WebP import；保持头顶/角/耳朵安全区、统一光向和底部落位，不需要改 `HeroArt`。
- 增加运行时卡面方向：在 `usePlayerArchiveCard.ts` 的 `ARCHIVE_CARD_STYLES` 添加唯一 ID 和完整场景提示词；不得把风格 ID 改为不稳定随机字符串，已生成卡依赖该 ID 复原归档含义。
- 增加基础牌：在 `BASE_CARDS` 添加定义，并在 `playCard()` 增加结算分支。
- 调整数值与局长：修改 `data.ts` 的敌人生命/攻击/pattern 和 `useAnomalyHand.ts` 的牌值、回血与序列规则。
- 增加敌人：在 `ENEMIES` 添加数据，导入对应 WebP 并写入 `ENEMY_ART` 映射；需要独立裁切时再增加 `.ah-enemy-art--<id>`。
- 改视觉：编辑 `AnomalyHand.less` 顶部语义色和 `doc/visual.md`；图标线宽与切角规则在 `icons.tsx`。
- 改文案/多语言：编辑 `i18n/index.ts` 的同名 zh/en 键；新增语言时扩展 `Locale`、语言检测和字典映射。
- 接平台身份：平台用户名查询可用后，将真实 `telegram_id`、`head_url` 和 `avatar_describe` 写入独立身份数据；不得通过名字推测 ID。
- 发布：补独立 UUID、正式 poster、`games/games.json` 条目、zipurl 与部署记录，再走 `game-publish` 和 `pre-ship-verify`。
