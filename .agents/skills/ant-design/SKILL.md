---
name: ant-design
description: >-
  Enterprise-class UI design language, component guidelines, and responsive layout patterns based on Ant Design (antd).
  Use this skill when designing, refactoring, or enhancing UI components for cross-device compatibility (Windows, Mac, Android, iOS), modern aesthetic polish, dark-mode themes, responsive grid layouts, and polished accessibility.
---

# Ant Design UI & UX Optimization Skill

This skill provides comprehensive guidelines, design tokens, and procedural steps for integrating Ant Design (antd) principles and responsive layout patterns into FrostMate Royale across all devices (Windows, macOS, Linux, Android, iOS).

## 🌟 Core Ant Design Principles

1. **Natural & Meaningful Hierarchy**:
   - 8-point grid spatial system (4px, 8px, 12px, 16px, 24px, 32px padding/margins).
   - Clear visual weight with primary, secondary, and ghost buttons.
   - Standardized typography scale with high contrast legibility.

2. **Universal Cross-Device & OS Compatibility**:
   - **Windows / Mac Desktop**: Mouse hover states, cursor hints (`cursor-pointer`), keyboard shortcuts, fluid `clamp()` viewport scaling.
   - **Android / iOS Touch**: Minimum 44px touch targets, `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`, smooth swipe/tap feedback.
   - **Dynamic Viewport Height**: Use `dvh` (Dynamic Viewport Height) so iOS Safari / Android Chrome address bars do not cause layout jumping.

3. **High-Contrast Glassmorphic Esports Theme**:
   - Dark theme base: `#030611` deep background.
   - Card surfaces: `#0B1225`/90 backdrop blur with `border-white/15` and Ant Design primary cyan `#1890ff` / `#38bdf8` highlights.
   - Interactive feedback: Smooth scale micro-interactions (`scale-102` active/hover).

4. **Responsive Grid Breakpoints**:
   - `xs`: <576px (Mobile Phones)
   - `sm`: ≥576px (Large Phones / Small Tablets)
   - `md`: ≥768px (Tablets)
   - `lg`: ≥992px (Laptops)
   - `xl`: ≥1200px (Desktops & Large Monitors)

## 🛠️ Step-by-Step UI Enhancement Workflow

1. **Audit Responsive Layout**: Verify elements fit within `clamp()` bounds and don't overflow on small phone screens or 4K monitors.
2. **Apply Ant Design Design Tokens**: Use rounded borders (`rounded-2xl`, `rounded-3xl`), consistent shadow tokens (`shadow-2xl`, `shadow-glow-cyan`), and structured flex/grid containers.
3. **Verify Device Touch & Keyboard Controls**: Ensure buttons have proper ARIA attributes, non-selectable text (`select-none`), and instant visual feedback on click/tap.
