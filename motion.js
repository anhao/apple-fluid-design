/*
 * Fluid Glass 设计系统 — 流体动效工具库
 *
 * 实现 WWDC《Designing Fluid Interfaces》的核心机制：
 *   - spring 用 damping（阻尼比）/ response（响应秒数）两参数描述，与 tokens.css 一致
 *   - createSpring：可中断、可改目标、可"抓住"的弹簧积分器（rAF 驱动）
 *   - VelocityTracker：pointermove 采样，松手时取真实手速
 *   - project：动量投射 —— 按"手势要去哪"决定落点
 *   - rubberband：边界橡皮筋阻尼
 *
 * 经典 script 引入（file:// 可直接打开），挂载在 window.FluidMotion；
 * 工程化项目可将本文件改为 ESM 或直接把映射函数抄进代码库。
 */
(function () {
  "use strict";

  /* ── spring 预设（与 tokens.css 的 --spring-* 保持一致）──── */
  var Springs = {
    default: { damping: 1.0, response: 0.4 }, // 常规 UI：临界阻尼，无回弹
    snappy: { damping: 1.0, response: 0.3 },  // 小控件、popover
    bouncy: { damping: 0.8, response: 0.4 },  // 仅限带动量的交互（flick/拖拽释放）
    sheet: { damping: 0.8, response: 0.3 },   // 抽屉/底部面板
  };

  /* 从 CSS token 读取 spring 参数（token 为唯一事实源时使用） */
  function springFromToken(name) {
    var s = getComputedStyle(document.documentElement);
    var damping = parseFloat(s.getPropertyValue("--spring-" + name + "-damping"));
    var response = parseFloat(s.getPropertyValue("--spring-" + name + "-response"));
    if (isNaN(damping) || isNaN(response)) return Springs.default;
    return { damping: damping, response: response };
  }

  /* damping/response → 物理参数（mass=1）：
   * omega = 2π / response；stiffness = omega²；dampingCoeff = 2·ζ·omega */
  function toPhysicsSpring(p) {
    var omega = (2 * Math.PI) / p.response;
    return { stiffness: omega * omega, damping: 2 * p.damping * omega, mass: 1 };
  }

  /* damping/response → Motion / Framer Motion 的 spring 选项 */
  function toMotionSpring(p, velocity) {
    return {
      type: "spring",
      duration: p.response,
      bounce: Math.max(0, 1 - p.damping),
      velocity: velocity || 0,
    };
  }

  /* ── 动量投射（Apple 官方公式，指数衰减，非教科书 v²/2a）──
   * decelerationRate：0.998 = 常规滚动手感；0.99 = 更快停下 */
  function project(initialVelocity, decelerationRate) {
    var rate = decelerationRate == null ? 0.998 : decelerationRate;
    return ((initialVelocity / 1000) * rate) / (1 - rate);
  }

  /* 从投射落点选最近的吸附点 */
  function nearestSnapPoint(projected, points) {
    var best = points[0];
    for (var i = 1; i < points.length; i++) {
      if (Math.abs(points[i] - projected) < Math.abs(best - projected)) best = points[i];
    }
    return best;
  }

  /* ── 橡皮筋：越过边界越拖不动，但永远有响应 ──────────────── */
  function rubberband(overshoot, dimension, constant) {
    var c = constant == null ? 0.55 : constant;
    return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
  }

  /* ── 速度追踪：只信最近 ~80ms 的样本 ─────────────────────── */
  function VelocityTracker() {
    this.samples = [];
  }
  VelocityTracker.prototype.add = function (value) {
    var now = performance.now();
    this.samples.push({ t: now, v: value });
    while (this.samples.length && now - this.samples[0].t > 80) this.samples.shift();
  };
  VelocityTracker.prototype.velocity = function () {
    if (this.samples.length < 2) return 0;
    var a = this.samples[0];
    var b = this.samples[this.samples.length - 1];
    var dt = b.t - a.t;
    if (dt <= 0) return 0;
    return ((b.v - a.v) / dt) * 1000; // px/s
  };
  VelocityTracker.prototype.reset = function () {
    this.samples = [];
  };

  /* ── 可中断弹簧 ───────────────────────────────────────────
   * var s = createSpring(Springs.sheet)
   * s.start({ from, to, velocity, onUpdate, onSettle })
   * s.retarget(newTo)  — 飞行中改目标，速度连续，无"撞墙"
   * s.grab()           — 抓住：停止积分，返回 { value, velocity } 交还给手势
   * 始终从"当前呈现值"出发 —— 这就是可中断性的实现。
   */
  function createSpring(params) {
    var phys = toPhysicsSpring(params || Springs.default);
    var raf = null;
    var last = 0;
    var x = 0;
    var v = 0;
    var target = 0;
    var onUpdate = null;
    var onSettle = null;

    function tick(now) {
      var dt = Math.min((now - last) / 1000, 1 / 30); // 掉帧时限步，保持数值稳定
      last = now;
      // 半隐式欧拉积分
      var accel = -phys.stiffness * (x - target) - phys.damping * v;
      v += accel * dt;
      x += v * dt;
      if (Math.abs(v) < 2 && Math.abs(x - target) < 0.1) {
        x = target;
        v = 0;
        raf = null;
        if (onUpdate) onUpdate(x, v);
        if (onSettle) onSettle();
        return;
      }
      if (onUpdate) onUpdate(x, v);
      raf = requestAnimationFrame(tick);
    }

    return {
      start: function (opts) {
        x = opts.from != null ? opts.from : x;
        v = opts.velocity != null ? opts.velocity : 0;
        target = opts.to;
        onUpdate = opts.onUpdate || onUpdate;
        onSettle = opts.onSettle || null;
        if (raf) cancelAnimationFrame(raf);
        last = performance.now();
        raf = requestAnimationFrame(tick);
      },
      retarget: function (to) {
        target = to; // 不重置 x/v：速度穿过新目标，运动连续
        if (!raf) {
          last = performance.now();
          raf = requestAnimationFrame(tick);
        }
      },
      grab: function () {
        if (raf) cancelAnimationFrame(raf);
        raf = null;
        return { value: x, velocity: v };
      },
      isRunning: function () {
        return raf != null;
      },
      value: function () {
        return x;
      },
    };
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  window.FluidMotion = {
    Springs: Springs,
    springFromToken: springFromToken,
    toPhysicsSpring: toPhysicsSpring,
    toMotionSpring: toMotionSpring,
    project: project,
    nearestSnapPoint: nearestSnapPoint,
    rubberband: rubberband,
    VelocityTracker: VelocityTracker,
    createSpring: createSpring,
    prefersReducedMotion: prefersReducedMotion,
  };
})();
