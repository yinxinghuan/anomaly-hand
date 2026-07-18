# 《异常手牌 / Anomaly Hand》视觉规范

## 1. Visual thesis

- Game and audience：面向 Aigram 移动信息流玩家的 3–5 分钟英雄卡牌战斗。
- Emotional promise：把熟悉的个人主页形象变成一张值得收藏、又能真正参与战斗的异常行动员档案。
- One-sentence visual thesis：一套从地下异能机构流出的丝网印刷行动档案，在战斗中被盖章、撕裂、套印和重新归档。
- Signature visual moment：序列达到 3 时，英雄卡上的酸性青蓝套印层横向错位，最右手牌被一枚朱红封条“改写”为签名牌。
- Three required qualities：手机缩略图下可辨认；专色丰富但信息清楚；不同人类与非人类角色仍像同一队伍。
- Three directions to avoid：通用魔幻卡框；霓虹玻璃赛博界面；光滑动漫抽卡立绘。

## 2. Composition and camera

- Orientation and aspect ratios：主界面响应式竖屏，设计基准 390 × 844；最低支持 320 × 568，桌面最大内容宽度 520。
- Camera and perspective：英雄与敌人统一胸像三分之四视角，视线朝向画面中心；轻微仰视不超过 6°。
- Playfield focal area：敌我舞台占屏幕高度 42%–48%，三张手牌占 29%–34%。
- Foreground, midground, background：前景为出牌碎片和伤害章；中景为英雄/敌人卡；背景为低对比档案纸、装订线和裁切标记。
- HUD safe areas：顶部预留 `max(16px, env(safe-area-inset-top))`；底部牌区与 Home Indicator 之间至少 12 px + safe area。
- Attention path：敌人意图 → 双方生命 → 三张手牌 → 序列轨 → 临时结果。

## 3. Color

- Background：Archive Black `#111315`。
- Raised surface：Carbon Board `#1B1E20`。
- Paper edge：Bone Stock `#E9E1D0`。
- Primary text：Chalk `#F3EFE5`。
- Muted text：Dust `#9A958B`。
- Action / danger：Signal Vermilion `#FF4B35`。
- Player / technical：Acid Cyan `#19D7D0`。
- Reward / rare：Oxidized Brass `#C8A65A`。
- Guard / recovery：Faded Mint `#78BFA4`。
- Usage ratios：黑与炭灰 68%，骨白 17%，朱红 8%，青蓝 5%，黄铜与薄荷合计 2%。
- Forbidden combinations：不得大面积同时使用朱红与青蓝发光；骨白不作为整屏纯背景；状态不能只依靠颜色区分。

## 4. Typography

- Chinese display：本地子集 `AH CJK`（Noto Sans SC variable），短标题使用 800–900 字重、`-0.045em` 字距，形成厚重、方整、接近粗丝网印刷的中文标题。
- English display：本地子集 `AH Archive`（Ostrich Sans Heavy），标题、敌人名、卡名与强化名使用高窄工业标识比例；英文标题字距 `0.035em`，保持档案编号般的节奏。
- UI/body：`AH Onest` 为拉丁正文主字体，中文自动回退到 `AH CJK`；正文 13–16 px / 1.3–1.45。小型协议标签使用 `AH Mono`（JetBrains Mono）。
- Numeric/HUD：阿拉伯数字使用 `AH Archive`，开启 `tabular-nums` 与 `lining-nums`。生命、伤害、卡牌数值、`01/08` 编号和结果数字使用 1 px 红青硬边套印；大数值轻微 `skewX(-4deg)`，不得使用霓虹发光。
- Display title：中文 32–42 px / 800–900；英文 32–48 px / 800；均保持紧凑行高。
- Card title：中文 15–17 px / 800；英文使用高窄字形并保留至少 `0.035em` 字距；卡牌数值 24–37 px。
- 复杂肖像上的文字必须落在不透明信息带；正文不使用展示字体，避免牺牲可读性。

## 5. Shape, material, and lighting

- Dominant shapes：直角、45° 裁角、断裂矩形、偏移圆环；圆角只允许 2–6 px，不使用大胶囊。
- Frame language：卡框四角至少一个不对称切口；顶部左侧固定稀有度槽，底部固定能力图标区。
- Outline：人物外缘使用 1–2 px 炭黑粗线与局部青蓝套印影，不做白色贴纸描边。
- Borders：结构边 1 px 骨白 35% 透明；关键选中态增加 2 px 青蓝实体边。
- Shadows：只使用硬边印刷阴影，偏移 3–5 px，透明度 25%–38%；禁止柔软悬浮阴影。
- Materials：再生炭纸、粗网点油墨、干刷缺墨、细小套印偏移、少量黄铜铆钉。
- Lighting：人物主光从左上 35° 进入，右侧用低强度青蓝边光；背景不做电影级光污染。

## 6. Characters, environments, and assets

- Proportions：胸口以上占卡面 68%–76%；头部高度占卡面 27%–34%；必须保留发型、角、耳朵、胡须、制服或伙伴等身份锚点。
- Silhouette：每位英雄在纯黑缩略图中仍可通过头肩轮廓区分。
- Expression range：每位英雄拥有中性战备与明确战损两张立绘；受击时直接切换为睁眼、可辨识的痛感/反击表情，配合血痕、破损和套印冲击。签名技继续由前端扫描、碎片和专色覆写表达，避免为每位角色制作不必要的第三套完整立绘。
- Pose：统一三分之四胸像，肩线朝内；手臂最多进入画面下方 25%，不得遮挡脸和姓名带。
- Detail density：脸部与身份锚点最高；服装中等；背景图案最低。手机 120 px 宽时仍应看清眼睛、发型/物种和主色块。
- Asset method：8 位人物使用 Aigram 平台 transit raster 生图接口，以用户提供的主页截图头像为身份参考；不使用截图中的帖子画面作为角色身份事实。生成记录保存在 `_artifacts/heroes/generation-log.json`。
- Export：每位英雄保留独立透明 PNG 源图，并导出质量 86–88 的透明 WebP 供游戏加载；战损图位于 `img/heroes/states/`。人物与卡框分离，卡框、图标、套印遮罩和状态变化使用前端 SVG/CSS。
- Interface raster：3 名敌人各使用独立 C 风格高细节 WebP 档案图；战斗桌、战术牌、奖励与规则面板共享一张无人物的丝网印刷档案底板位图。位图负责材质、叙事和收藏感，CSS 负责状态、文字、可访问性和响应式。
- Rejected generation rule：出现手机外框、紫色霓虹、无关人物/动物、可读字母或透明棋盘预览的卡面一律拒绝，不因接口成功而接入。
- Cropping：头顶/角/耳朵安全区至少 7%；下方姓名带覆盖区域不得放身份关键物。

## 7. UI and icons

- Icon family：自制 24 × 24 SVG，2 px 直线与 45° 切角；攻击、格挡、技术、生命、序列、意图使用同一几何语法。
- Button hierarchy：主按钮为骨白底炭黑字并带朱红 4 px 左边；次按钮透明底骨白边；危险操作朱红文字但不整块填红。
- Targets：所有按钮至少 44 × 44；战斗牌最低 104 × 154。
- HUD：生命使用数字 + 断裂条；序列使用 3 个可点亮的偏移圆环；意图使用图标、动作名和具体数值三重表达。
- Default：炭纸面 + 骨白边。
- Pressed：下移 3 px、硬阴影归零、青蓝套印偏移收拢，时长 70 ms。
- Focus：2 px 骨白外框 + 2 px 间隔。
- Disabled：饱和度降低 70%，纹理保留，不只降低透明度。
- Loading：有限循环的三段装订线，不使用无限旋转圆环。
- Warning：朱红角标 + 文本；Success：青蓝归档章 + 文本。
- Emoji policy：功能图标禁止使用 Emoji。

## 8. Motion and VFX

- Personality：机械归档、纸张受力、套印错位；快速、有阻力、不弹软。
- Tokens：按下 70 ms；出牌滑入 160 ms；命中 90 ms；结算停顿 180 ms；奖励盖章 260 ms；强化确认停留 620 ms；页面切换 260 ms。
- Card play：牌按下后 0–90 ms 向上 13 px 预备并翻面，约 210 ms 冲入舞台；命中后在 230 ms 内以旋转、降亮和裁切感退出，下一手三张相隔 70 ms 逐张发入。
- Hit：目标卡横移 3 px，朱红/青蓝双影分离 2 px 后归位。结算必须分两拍：第一拍为中央大字“攻击命中 / 格挡部署”等效果引导，680 ms 后进入第二拍，以对象标签 + 78–116 px 数值落下，并触发纸屑、套印射线与封条冲击。玩家受到未格挡伤害时切换战损立绘并保留至恢复或下一遭遇。
- Signature：70 ms 视觉冻结感、18–24 个碎片、一次最大 3 px 舞台震动；总时长不超过 900 ms。
- Particles：矩形纸屑、三角裁角、短套印线；禁用圆形发光粒子。战术分、精准连段与 `S/A/B/C` 评级采用硬边印刷字而非发光积分 UI。
- Reduced motion：取消震动、位移和碎片飞行，保留 120 ms 色层切换、数字变化和结果章。

### 当前执行基线（2026-07-18）

- 每个阶段都必须有独立的“档案物件”主视觉：选择为大幅人物档案、遭遇为全屏识别封面、战斗为叠放双档案、强化为三张改造卡、结果为最终归档卡、规则为协议卷宗；禁止退化成只有文字和普通深色面板的过渡页。
- 角色卡统一叠加环形定位轨、档案角标、裁切内框、专色底栏与低密度扫描纹。人物脸和眼睛始终优先于装饰层。
- 战场常驻背景只允许低频纸屑和几何定位点；命中才短促爆发错版射线、纸屑、封条抖动和卡框红青分离。签名技可升格为全屏覆写，但普通牌不得持续闪烁或遮住生命与意图。
- 结算数值必须用“对象 + 语义标签 + 明确符号”表达，如“敌人生命 −6”“你的格挡 +6”“敌方蓄力 +5”；红、青只作为冗余的语义辅助，不能要求玩家通过颜色猜正负。
- 可读性下限：可交互卡牌说明在常规手机宽度使用 12–13 px / 1.38，短屏最低 11 px；行动员能力、强化说明、规则正文和结果摘要分别不低于 13 / 12 / 15 / 15 px。7–10 px 仅允许用于编号、档案标签和非关键 HUD 微文案。

## 9. References translated into principles

- Reference：视觉探索 C「异能档案」。
- Useful principle：高对比专色、丝网网点、裁切档案框可以容纳人类、怪物和动物角色。
- Adaptation：降低背景噪声密度，把最丰富的图形集中在英雄肖像与签名技，常规 HUD 保持骨白单线。
- Element not to copy：不复制探索样张中的伪文字、随机条码和装饰性英文。

- Reference：视觉探索 A「漆金战谱」。
- Useful principle：深色材质和有限金属点缀能提升收藏感。
- Adaptation：黄铜只用于稀有度、奖励和封存章，不成为主色。
- Element not to copy：不使用东方文字装饰、圆月背景或历史服饰。

- Reference：视觉探索 B「星骸圣典」。
- Useful principle：统一的图标行和几何背景提高套牌秩序。
- Adaptation：保留固定能力区、统一镜头和低对比圆环结构。
- Element not to copy：不采用整套占星/宗教符号或骨白主背景。

## 10. Anti-patterns

- 禁止 Hearthstone 式厚重奇幻框、宝石能量球和高光塑料按钮。
- 禁止通用玻璃拟态、紫蓝霓虹渐变、外发光描边和柔焦背景。
- 禁止不同角色分别使用照片、3D、动漫、油画等互不相干的媒介。
- 禁止把圆形头像直接贴在卡面中央。
- 禁止无法读取的伪文字占据显著位置；装饰标记必须抽象为几何。
- 禁止每张牌都使用同等强度的纹理、印章、碎片和警告色。
- 禁止大圆角浮动卡片、胶囊 HUD 和 Emoji 功能图标。
- 视觉漂移示例：青蓝变成全屏赛博发光；黄铜扩张成蒸汽朋克；朱红与黑变成普通军事 UI；角色服装各自来自不同世界。

## 11. Acceptance

- Entry/start：390 × 844 首屏在 3 秒内看出这是“人物英雄卡牌战斗”；主英雄档案卡完整展示姓名、身份锚点、被动与签名技，横向索引可到达全部 8 位。
- Gameplay：不看教程也能按敌人意图在 3 张牌中做出选择；敌人、英雄、生命、意图和手牌形成单一注意路径。
- High-feedback moment：序列达到 3 时签名牌替换清楚，使用后视觉峰值明显高于普通攻击但不遮挡生命变化。
- Completion/end：胜负原因、英雄、剩余生命/遭遇和下一步行动清楚；结果章与卡牌世界一致。
- Narrow mobile：320 × 568 不横向溢出，三张牌仍各自拥有至少 44 px 可点击核心区域，正文不低于 13 px。
- Visual QA findings and decision：垂直切片阶段发现签名牌使用旧序列、320 宽单牌仅 99 px 两个 P1，均已修复。8 人扩展阶段完成中英文 390 × 844、英文 320 × 568、签名技、奖励和结算自动化检查；窄屏单牌达到 104 × 150，工具按钮 44 × 44，无横向溢出、资源加载错误或控制台错误。当前 8 人版本通过界面视觉门禁。
