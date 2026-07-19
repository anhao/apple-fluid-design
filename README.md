# Fluid Glass 设计系统

[English](README.en.md) | **简体中文**

一套面向整站网页与组件的 Apple 风格设计规范，基于 WWDC《Designing Fluid Interfaces》等设计演讲提炼的规则构建，落地为 Web 技术（CSS 自定义属性、Pointer Events、rAF 弹簧）。

> 界面之所以「活」，是因为运动从当前屏上值出发、继承用户的手速、向前投射动量，并且随时可以被抓住和反转。


## 目录

```
design/apple-fluid/
├── README.md                     ← 本规范文档
├── SKILL.md                      ← agent 使用入口
├── metadata.json
├── tokens.css                    ← 全部 design token（明暗双主题 + 排版刻度 + 动效参数）
├── css.json                      ← token 的程序化导出（供工具消费，含 material/motion 扩展段）
├── materials.css                 ← 毛玻璃材质层（五档厚度 + vibrancy + 降级）
├── components.css                ← 组件规范（按钮/表单/卡片/导航/Sheet/Popover/列表/徽标）
├── motion.js                     ← 流体动效工具库（可中断弹簧/速度追踪/动量投射/橡皮筋）
├── components/index.json         ← 组件索引
├── preview/components.html      ← 组件与材质预览页（浏览器直接打开）
└── ui_kits/website/index.html   ← 完整网页示例（含可拖拽 bottom sheet 的全套流体物理）
```

引入顺序固定：`tokens.css → materials.css → components.css`，需要手势/弹簧时加 `motion.js`。

## 一、设计守则（十条）

1. **响应零延迟。** 反馈发生在 pointer-down，不等松手。按下即 `scale(0.97)`，过渡 100ms。审计一切输入路径上的 debounce、人为延时。
2. **直接操纵，1:1 跟手。** 拖拽用 Pointer Events + `setPointerCapture`，尊重抓取点偏移；拖拽全程 UI 与指针同步更新，不许只在手势结束时才动画。
3. **一切动画可中断。**（最重要的一条）动画途中必须能被抓住、反转。新动画永远从当前呈现值出发；手势驱动的运动禁止用 CSS transition/`@keyframes`，用 `motion.js` 的弹簧。
4. **用行为，不用脚本动画。** spring 以 damping（阻尼比）/ response（响应秒数）描述。默认临界阻尼（damping 1.0，无回弹）；只有手势带动量的交互（flick、拖拽释放）才用 damping 0.8。
5. **速度交接。** 手势结束时把松手速度作为弹簧初速度，拖拽与动画之间不许有速度断层。
6. **动量投射。** 松手后按「手势要去哪」选吸附点：`projected = 当前位置 + project(速度)`，`project(v) = (v/1000)·d/(1−d)`，d ≈ 0.998。
7. **空间一致性。** 从哪来回哪去（出入路径对称，缓动互为镜像 `--ease-out`/`--ease-in`）；弹层从触发元素生长（`transform-origin` 锚定触发点）。
8. **橡皮筋边界。** 到达边界渐进阻尼而非硬停：`rubberband(overshoot, dimension, 0.55)`。
9. **材质承载层级。** 导航/工具栏/弹层是半透明浮层，内容从下面滚过；材质厚度编码结构层级。（详见第三节）
10. **无障碍是降级路径，不是可选项。** `prefers-reduced-motion`（弹簧→淡入淡出）、`prefers-reduced-transparency`（材质→实底）、`prefers-contrast`（边框→实线）三档全部内建。

## 二、色彩

两层架构：**原始色板**（gray 阶梯、系统强调色、label 半透明文本色）→ **语义 token**。组件与页面只允许消费语义 token。

| 角色 | Light | Dark | 用途 |
| --- | --- | --- | --- |
| `--primary` | `#007aff` | `#0a84ff` | 唯一强调色，集中在操作上 |
| `--background` / `--card` | `#ffffff` | `#000000` / `#1c1c1e` | 页面 / 卡面 |
| `--foreground` | `#1d1d1f` | `#f5f5f7` | 主文本 |
| `--label-secondary/tertiary/quaternary` | 半透明黑 | 半透明白 | 层级文本（压材质也可读） |
| `--destructive` / `--success` / `--warning` | `#ff3b30` / `#34c759` / `#ff9500` | dark 变体 | 状态 |
| `--separator` | rgba 发丝线 | rgba 发丝线 | 列表分隔 |
| `--fill` / `--fill-subtle` | rgba(120,120,128,…) | 同左更深 | 控件底色 |
| `--scrim` | rgba(0,0,0,.32) | rgba(0,0,0,.48) | 模态遮罩 |

规则：整页在蓝色出现前应读作黑、白、灰；强调色集中在 CTA 与选中态，不做背景铺色。暗色主题靠文本对比与灰阶纪律，不靠提高饱和度。

## 三、材质（毛玻璃）

`backdrop-filter: blur() saturate(180%)` + 半透明底 + 顶部亮边（受光）。五档厚度：

| 类名 | 底色透明度（light） | blur | 用途 |
| --- | --- | --- | --- |
| `.material-ultrathin` | 0.40 | 12px | 小型悬浮件、临时提示 |
| `.material-thin` | 0.55 | 16px | 玻璃按钮、图上输入框 |
| `.material-regular` | 0.68 | 22px | 玻璃卡片 |
| `.material-thick` | 0.80 | 30px | Sheet、Popover、模态面 |
| `.material-chrome` | 0.82 | 20px | 导航栏/工具栏专用 |

硬规则：

- 面积越大、越结构化的面材质越厚，阴影越深（`--shadow-glass` → `--shadow-glass-lg`）。
- **两层浅材质禁止叠放**，叠放时上层必须 thick/chrome 或实底。
- 材质面上的文字用 vibrancy 类（`.vibrancy-primary/secondary/tertiary`）：更高对比 + 稍重字重 + 微加字距，不用扁平灰；彩色内容放实底层。
- 模态任务 = 材质面 + `.scrim` 遮罩；并行面板 = 材质 + 位移，不加遮罩，不打断心流。
- 悬浮 chrome 与内容交界用 `.scroll-edge` 渐隐（滚动后 JS 加 `.is-scrolled`），不用 1px 硬分割线。
- 玻璃面出入场用 `.materialize-in/-out`：blur 与 scale 一起动画，读作「材质到场」，不是普通淡入。
- 降级三连：不支持 `backdrop-filter` → 近实底；`prefers-reduced-transparency` → 实底去模糊；`prefers-contrast: more` → 实底 + 实线边框。已在 `materials.css` 内建，组件无需自行处理。

## 四、排版

默认系统字体（`-apple-system … PingFang SC`），mono 只用于代码与数据。**字距按字号定，禁止一个 `letter-spacing` 全站通用**：

| 类名 | 规格 | 字距 |
| --- | --- | --- |
| `.text-display-xl` | 700 / clamp(2.75–4.5rem) / 1.03 | −0.025em |
| `.text-display` | 700 / clamp(2–3rem) / 1.08 | −0.022em |
| `.text-title-1/2/3` | 600 / 1.75 / 1.375 / 1.1875rem | −0.019 / −0.014 / −0.010em |
| `.text-headline` | 600 / 1rem / 1.4 | −0.004em |
| `.text-body` | 400 / 1rem / 1.5 | 0 |
| `.text-footnote` | 400 / 0.8125rem / 1.4 | +0.006em |
| `.text-caption` | 500 / 0.75rem / 1.35 | +0.010em |
| `.text-eyebrow` | 600 / 0.75rem / 大写 | +0.08em |

层级 = 字重 + 字号 + 行高成组变化；强调优先加字重。间距全部用 rem（`--spacing: 0.25rem`），跟随用户字号设置缩放。数字用 `.text-nums`（等宽数字）。

## 五、形状与阴影

- 圆角刻度：6 / 10 / 14 / 20 / 28px + 胶囊。按钮永远是胶囊；卡片 `--radius-xl`；输入框 `--radius-md`。
- 控件高度：32 / 44 / 52px，**44px 为最小触控目标**。
- 阴影耳语级：层级先靠 1px 边和材质厚度；静息态 `--shadow-xs/sm`，悬停/拖拽/弹层才允许 `--shadow-lg` 以上；玻璃面专用 `--shadow-glass(-lg)`。

## 六、动效

### spring 参数（token 与 `motion.js` 预设一一对应）

| 预设 | damping | response | 场景 |
| --- | --- | --- | --- |
| `default` | 1.0 | 0.4s | 常规位移、归位 |
| `snappy` | 1.0 | 0.3s | 小控件、popover |
| `bouncy` | 0.8 | 0.4s | 仅限带动量的交互 |
| `sheet` | 0.8 | 0.3s | 抽屉/底部面板 |

response 不是时长——弹簧没有固定时长，停止时间由参数涌现。映射到 Motion/Framer Motion：`{ type:'spring', duration: response, bounce: 1 − damping, velocity }`（`FluidMotion.toMotionSpring`）；物理形式 `stiffness = (2π/response)²`、`dampingCoeff = 2ζ·(2π/response)`（`toPhysicsSpring`）。

### CSS 退化实现（非手势驱动的过渡）

时长带 100/200/300/450ms（按下/悬停/常规/大转场）+ `--ease-out`，出场用镜像 `--ease-in`。只动 `transform` 和 `opacity`。

### 手势 checklist

- 点按：down 高亮、up 提交，允许拖离取消。
- 拖拽：≥6px 迟滞再判定方向，之后 1:1；**越过迟滞才 `setPointerCapture`**（过早捕获会吞掉内部元素的 click）。
- 松手：速度决定去留（投射），不是位置决定。
- 二维运动拆成独立的 X/Y 两根弹簧。
- 完整参考实现见 `ui_kits/website/index.html` 的 bottom sheet（抓取中断、橡皮筋、投射、速度交接俱全）。

## 七、组件

| 组件 | 类 | 关键行为 |
| --- | --- | --- |
| Button | `.btn` + `filled/tinted/glass/plain/destructive` | 胶囊；按下即时 scale 0.97；一屏至多一个 filled |
| Field | `.field` (+`-glass`) | 聚焦换实底 + ring；行内校验 `.field-hint.is-error` |
| Switch | `.switch` | 点按无动量→无回弹；按住滑块拉长 |
| Segmented | `.segmented` | `:has(:checked)` 驱动选中浮起 |
| Card | `.card` (+`-interactive`/`-glass`) | 静息 shadow-sm，悬停浮起 −2px |
| Navbar | `.navbar` + `.material-chrome .scroll-edge` | 毛玻璃 chrome，内容从下滚过 |
| Sheet | `.sheet` + `.scrim` | transform 只由弹簧驱动；detents 全开/半开/收起 |
| Popover | `.popover` + `.materialize-in/out` | 从触发点生长（`--popover-origin`） |
| List | `.list-inset` | 发丝线分隔，行高 ≥48px |
| Badge | `.badge` + 语义变体 | 半透明胶囊 |

新组件必须回答：按下反馈？focus-visible？禁用态？动效是否可中断？三档无障碍降级后长什么样？

## 八、接入现有工程

- **静态页 / 任意框架**：三个 CSS 顺序引入即可用类名；暗色 = `<html class="dark">`（示例页含跟随系统 + 手动切换的写法）。
- **React / Tailwind（web/default）**：语义 token 名与 shadcn 习惯对齐（`--background/--foreground/--primary/--muted…`），可直接映射进 Tailwind 主题；spring 参数经 `toMotionSpring` 用于 Motion/Framer Motion，或将 `motion.js` 改为 ESM 引入。
- 只消费语义 token，禁止在业务代码里写死色值或直接引用原始色板。

## 九、内容语调

标题短而克制，允许刻意断行制造节奏；正文说清价值与选择，不用感叹号堆情绪、不用表情符号。具体（"用量统计"）优于含糊（"更多"）。
