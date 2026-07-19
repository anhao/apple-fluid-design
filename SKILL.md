---
name: fluid-glass-design
description: 使用 Fluid Glass 设计系统为整站网页与组件生成 Apple 风格界面。包含明暗双主题 design token、五档毛玻璃材质、按字号配字距的排版刻度、spring 流体动效参数与可中断手势物理，以及三档无障碍降级。做新页面、新组件或改造现有 UI 为该风格时使用。
user-invocable: true
---

# Fluid Glass Design Skill

先读 `README.md` 掌握规则，再用本目录的 token 与组件产出界面。产出静态 HTML 时直接引入三个 CSS；产出生产代码时把语义 token 与 spring 参数映射进目标工程（token 名与 shadcn 习惯对齐）。

## 快速地图

- `tokens.css` — 全部 token：语义色（light/dark）、排版刻度、间距/圆角/阴影、材质与 spring 参数
- `css.json` — token 的程序化导出（color/font/shadow/radius/spacing 与 apple-web 格式兼容，material/motion/排版刻度为扩展段）
- `materials.css` — 毛玻璃五档材质、vibrancy 文本、scroll-edge、materialize 出入场、无障碍降级
- `components.css` — 按钮/输入/开关/分段/卡片/导航/Sheet/Popover/列表/徽标
- `motion.js` — `createSpring`（可中断弹簧）、`VelocityTracker`、`project`（动量投射）、`rubberband`
- `preview/components.html` — 组件与材质总览
- `ui_kits/website/index.html` — 完整网页示例；bottom sheet 是手势物理的参考实现

## 不可妥协的规则

- 引入顺序：`tokens.css → materials.css → components.css`；只消费语义 token，不写死色值。
- 反馈在 pointer-down；按下缩放统一 `--press-scale`。
- 手势驱动的运动用 `motion.js` 弹簧，禁止 CSS transition；动画必须可被抓住（`spring.grab()`）。
- spring 默认临界阻尼（damping 1.0）；只有带动量的交互用 0.8。
- 材质：两层浅材质禁止叠放；材质上文字用 `.vibrancy-*`；模态加 `.scrim`，并行面板不加。
- 出入路径对称（`--ease-out`/`--ease-in` 互为镜像）；弹层从触发点生长。
- 三档无障碍降级（reduced-motion / reduced-transparency / contrast）不许移除；JS 动效必须检查 `FluidMotion.prefersReducedMotion()`。
- 最小触控目标 44×44px；拖拽迟滞 ≥6px 后才 `setPointerCapture`。
