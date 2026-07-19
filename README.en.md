# Fluid Glass Design System

**English** | [简体中文](README.md)

An Apple-style design specification for full websites and components, built on the rules distilled from Apple's WWDC design talks (chiefly *Designing Fluid Interfaces*), translated into web technologies: CSS custom properties, Pointer Events, and rAF-driven springs.

> An interface feels alive because motion starts from the current on-screen value, inherits the user's velocity, projects momentum forward, and can be grabbed and reversed at any instant.

## Contents

```
design/apple-fluid/
├── README.md                     ← spec document (Chinese)
├── README.en.md                  ← this document
├── SKILL.md                      ← agent entry point
├── metadata.json
├── tokens.css                    ← all design tokens (light/dark themes + type scale + motion params)
├── css.json                      ← programmatic token export (with material/motion extension blocks)
├── materials.css                 ← frosted-glass material layer (5 thicknesses + vibrancy + fallbacks)
├── components.css                ← component specs (button/form/card/nav/sheet/popover/list/badge)
├── motion.js                     ← fluid motion toolkit (interruptible spring / velocity tracker / projection / rubber-band)
├── components/index.json         ← component index
├── preview/components.html      ← component & material preview (open directly in a browser)
└── ui_kits/website/index.html   ← full page demo (draggable bottom sheet with complete fluid physics)
```

Import order is fixed: `tokens.css → materials.css → components.css`; add `motion.js` when you need gestures/springs.

## 1. The Ten Rules

1. **Zero-latency response.** Feedback fires on pointer-down, not on release. Press = `scale(0.97)` with a 100ms transition. Audit every debounce and artificial delay on the input path.
2. **Direct manipulation, 1:1 tracking.** Drags use Pointer Events + `setPointerCapture` and respect the grab-point offset; the UI tracks the pointer for the whole gesture — never animate only at the end.
3. **Every animation is interruptible.** (The most important rule.) A running animation must be grabbable and reversible. New animations always start from the current presentation value; gesture-driven motion must never use CSS transitions/`@keyframes` — use the springs in `motion.js`.
4. **Behavior, not scripted animation.** Springs are described by damping (ratio) / response (seconds). Default is critically damped (damping 1.0, no overshoot); only momentum-carrying interactions (flick, drag release) use damping 0.8.
5. **Velocity handoff.** When a gesture ends, the release velocity becomes the spring's initial velocity — no velocity discontinuity between dragging and animating.
6. **Momentum projection.** On release, pick the snap point by where the gesture is *going*: `projected = current + project(velocity)`, with `project(v) = (v/1000)·d/(1−d)`, d ≈ 0.998.
7. **Spatial consistency.** Things exit the way they entered (symmetric paths, mirrored easings `--ease-out`/`--ease-in`); popovers grow from their trigger (`transform-origin` anchored to the trigger).
8. **Rubber-band boundaries.** Resist progressively at edges instead of stopping hard: `rubberband(overshoot, dimension, 0.55)`.
9. **Materials carry hierarchy.** Nav bars/toolbars/overlays are translucent floating layers with content scrolling underneath; material thickness encodes structural hierarchy. (See §3.)
10. **Accessibility is a built-in fallback path, not an option.** All three tiers ship by default: `prefers-reduced-motion` (springs → cross-fades), `prefers-reduced-transparency` (materials → solid), `prefers-contrast` (borders → solid lines).

## 2. Color

Two-layer architecture: **primitive palette** (gray ramp, system accent colors, translucent label colors) → **semantic tokens**. Components and pages may only consume semantic tokens.

| Role | Light | Dark | Usage |
| --- | --- | --- | --- |
| `--primary` | `#007aff` | `#0a84ff` | The only accent color, concentrated on actions |
| `--background` / `--card` | `#ffffff` | `#000000` / `#1c1c1e` | Page / card surfaces |
| `--foreground` | `#1d1d1f` | `#f5f5f7` | Primary text |
| `--label-secondary/tertiary/quaternary` | translucent black | translucent white | Text hierarchy (stays readable on materials) |
| `--destructive` / `--success` / `--warning` | `#ff3b30` / `#34c759` / `#ff9500` | dark variants | States |
| `--separator` | hairline rgba | hairline rgba | List separators |
| `--fill` / `--fill-subtle` | rgba(120,120,128,…) | same, deeper | Control fills |
| `--scrim` | rgba(0,0,0,.32) | rgba(0,0,0,.48) | Modal dimming |

Rules: a page should read as black, white, and gray before any blue appears; the accent concentrates on CTAs and selected states, never as background washes. Dark mode relies on text contrast and gray discipline, not higher saturation.

## 3. Materials (Frosted Glass)

`backdrop-filter: blur() saturate(180%)` + a translucent base + a bright top edge (light catching the material). Five thicknesses:

| Class | Base opacity (light) | Blur | Usage |
| --- | --- | --- | --- |
| `.material-ultrathin` | 0.40 | 12px | Small floating elements, transient hints |
| `.material-thin` | 0.55 | 16px | Glass buttons, inputs over imagery |
| `.material-regular` | 0.68 | 22px | Glass cards |
| `.material-thick` | 0.80 | 30px | Sheets, popovers, modal surfaces |
| `.material-chrome` | 0.82 | 20px | Nav bars / toolbars only |

Hard rules:

- Bigger, more structural surfaces get thicker material and deeper shadows (`--shadow-glass` → `--shadow-glass-lg`).
- **Never stack two light materials.** If stacking is unavoidable, the upper layer must be thick/chrome or solid.
- Text on materials uses the vibrancy classes (`.vibrancy-primary/secondary/tertiary`): higher contrast + slightly heavier weight + a small tracking bump — not flat gray. Colored content belongs on solid layers.
- Modal task = material surface + `.scrim`; a parallel panel = material + offset, no scrim, so flow isn't broken.
- Where floating chrome meets content, use the `.scroll-edge` fade (JS adds `.is-scrolled` after scrolling) instead of a 1px divider.
- Glass surfaces enter/exit with `.materialize-in/-out`: blur and scale animate together, reading as "material arriving" rather than a plain fade.
- Triple fallback: no `backdrop-filter` support → near-solid; `prefers-reduced-transparency` → solid, blur removed; `prefers-contrast: more` → solid + solid border. All built into `materials.css`; components need no extra handling.

## 4. Typography

Default to the system font stack (`-apple-system … PingFang SC`); mono is only for code and data. **Tracking is size-specific — one global `letter-spacing` is forbidden:**

| Class | Spec | Tracking |
| --- | --- | --- |
| `.text-display-xl` | 700 / clamp(2.75–4.5rem) / 1.03 | −0.025em |
| `.text-display` | 700 / clamp(2–3rem) / 1.08 | −0.022em |
| `.text-title-1/2/3` | 600 / 1.75 / 1.375 / 1.1875rem | −0.019 / −0.014 / −0.010em |
| `.text-headline` | 600 / 1rem / 1.4 | −0.004em |
| `.text-body` | 400 / 1rem / 1.5 | 0 |
| `.text-footnote` | 400 / 0.8125rem / 1.4 | +0.006em |
| `.text-caption` | 500 / 0.75rem / 1.35 | +0.010em |
| `.text-eyebrow` | 600 / 0.75rem / uppercase | +0.08em |

Hierarchy = weight + size + line-height changing as a set; emphasize with weight first. All spacing is in rem (`--spacing: 0.25rem`) so layouts scale with the user's font-size setting. Use `.text-nums` (tabular figures) for data.

## 5. Shape & Shadow

- Radius scale: 6 / 10 / 14 / 20 / 28px + capsule. Buttons are always capsules; cards use `--radius-xl`; inputs use `--radius-md`.
- Control heights: 32 / 44 / 52px, with **44px as the minimum touch target**.
- Whisper-level shadows: hierarchy comes first from 1px borders and material thickness; resting state uses `--shadow-xs/sm`; `--shadow-lg` and above are reserved for hover, drag, and overlays; glass surfaces use the dedicated `--shadow-glass(-lg)`.

## 6. Motion

### Spring parameters (tokens map 1:1 to the `motion.js` presets)

| Preset | Damping | Response | Scenario |
| --- | --- | --- | --- |
| `default` | 1.0 | 0.4s | Regular repositioning, settling |
| `snappy` | 1.0 | 0.3s | Small controls, popovers |
| `bouncy` | 0.8 | 0.4s | Momentum-carrying interactions only |
| `sheet` | 0.8 | 0.3s | Drawers / bottom sheets |

Response is not a duration — a spring has no fixed duration; settle time emerges from the parameters. Mapping to Motion/Framer Motion: `{ type:'spring', duration: response, bounce: 1 − damping, velocity }` (`FluidMotion.toMotionSpring`); physics form: `stiffness = (2π/response)²`, `dampingCoeff = 2ζ·(2π/response)` (`toPhysicsSpring`).

### CSS fallback (non-gesture transitions)

Duration bands 100/200/300/450ms (press / hover / regular / large transitions) with `--ease-out`; exits use the mirrored `--ease-in`. Animate only `transform` and `opacity`.

### Gesture checklist

- Tap: highlight on down, commit on up; allow cancel by dragging away.
- Drag: ≥6px hysteresis before committing to a direction, then 1:1; **only `setPointerCapture` after crossing the hysteresis** (capturing too early swallows clicks on inner elements).
- Release: velocity decides commit vs. return (projection), not position.
- Decompose 2D motion into independent X and Y springs.
- Full reference implementation: the bottom sheet in `ui_kits/website/index.html` (mid-flight grabbing, rubber-banding, projection, velocity handoff — all included).

## 7. Components

| Component | Classes | Key behavior |
| --- | --- | --- |
| Button | `.btn` + `filled/tinted/glass/plain/destructive` | Capsule; instant press scale 0.97; at most one filled per screen |
| Field | `.field` (+`-glass`) | Focus switches to solid + ring; inline validation `.field-hint.is-error` |
| Switch | `.switch` | Tap has no momentum → no bounce; thumb stretches while held |
| Segmented | `.segmented` | `:has(:checked)` drives the raised selection |
| Card | `.card` (+`-interactive`/`-glass`) | Resting shadow-sm, hover lifts −2px |
| Navbar | `.navbar` + `.material-chrome .scroll-edge` | Glass chrome, content scrolls underneath |
| Sheet | `.sheet` + `.scrim` | Transform driven only by springs; detents full/half/closed |
| Popover | `.popover` + `.materialize-in/out` | Grows from its trigger (`--popover-origin`) |
| List | `.list-inset` | Hairline separators, row height ≥48px |
| Badge | `.badge` + semantic variants | Translucent capsules |

Every new component must answer: press feedback? focus-visible? disabled state? is its motion interruptible? what does it look like under all three accessibility fallbacks?

## 8. Adopting in an Existing Project

- **Static pages / any framework**: import the three CSS files in order and use the class names; dark mode = `<html class="dark">` (the demo page shows follow-system + manual toggle).
- **React / Tailwind**: semantic token names align with shadcn conventions (`--background/--foreground/--primary/--muted…`) and map directly into a Tailwind theme; use spring params via `toMotionSpring` with Motion/Framer Motion, or convert `motion.js` to ESM.
- Only consume semantic tokens — never hardcode color values or reference the primitive palette in application code.

## 9. Voice & Tone

Headlines are short and restrained, with deliberate line breaks for rhythm. Body copy explains value and choices — no exclamation-mark enthusiasm, no emoji. Specific ("Usage stats") beats vague ("More").
