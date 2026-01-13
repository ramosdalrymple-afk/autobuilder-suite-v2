# AutoBuilder Suite - Design System

---

## 🎨 Colors

| Token | Value | Usage |
|-------|-------|-------|
| `bg.primary` | `#0f172a` | Main background |
| `bg.secondary` | `#1e293b` | Cards, gradients |
| `accent.blue` | `#3B82F6` | Primary accent |
| `accent.purple` | `#8B5CF6` | Secondary accent |
| `text.primary` | `#ffffff` | Headings |
| `text.secondary` | `rgba(255,255,255,0.5)` | Body text |
| `text.muted` | `rgba(255,255,255,0.4)` | Subdued text |
| `error` | `#FCA5A5` | Error messages |
| `glass.bg` | `rgba(255,255,255,0.02)` | Glass surfaces |
| `glass.border` | `rgba(255,255,255,0.1)` | Glass borders |

---

## 🌈 Gradients

| Name | CSS |
|------|-----|
| **Background** | `radial-gradient(circle at bottom right, #1e293b 0%, #0f172a 100%)` |
| **Accent** | `linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)` |
| **Glow** | Accent gradient + `blur(120px)` + `opacity: 0.15` |

---

## 🪟 Glassmorphism

```css
background: rgba(255, 255, 255, 0.02);
backdrop-filter: blur(30px);
border: 1px solid rgba(255, 255, 255, 0.1);
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
```

---

## 📐 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `organic` | `60px 20px 60px 20px` | Feature cards, login |
| `standard` | `12px` | Buttons, inputs |
| `small` | `6px` | Tags, badges |

---

## 🔤 Typography

**Font:** Inter, sans-serif

| Element | Size | Weight |
|---------|------|--------|
| Hero | 56px | 700 |
| Section Title | 20px | 600 |
| Body | 18px | 400 |
| Small | 12px | 400 |

---

## 🔘 Buttons

| Type | Background | Border | Text |
|------|------------|--------|------|
| **Primary** | `rgba(255,255,255,0.9)` | none | `#0f172a` |
| **Secondary** | `rgba(0,0,0,0.3)` | `rgba(255,255,255,0.1)` | `#ffffff` |

---

## 🏷️ Brand

**Logo:** Stylized "A" with blue→purple gradient  
**Tagline:** "Build visually. Own the code."  
**Favicon:** `public/favicon.ico` (32x32), `public/favicon.svg`

```tsx
// Sidebar brand usage
<Flex align="center" gap="2">
  <WebstudioIcon size={22} />
  <Text variant="brandSectionTitle" css={{ fontWeight: 600 }}>
    Autobuilder Suite
  </Text>
</Flex>
```

---

## 📊 Dashboard Sidebar

```
+----------------------------+
|  A  Autobuilder Suite      |  <- Header (icon + brand)
+----------------------------+
|  Search                    |
|  Projects                  |
|  Templates                 |
|  Resources                 |
|         ...                |
+----------------------------+
|  ProfileMenu               |  <- Footer (marginTop: auto)
+----------------------------+
```

---

## 📦 Design Tokens (JS)

```javascript
const tokens = {
  colors: {
    bg: { primary: "#0f172a", secondary: "#1e293b" },
    accent: { blue: "#3B82F6", purple: "#8B5CF6" },
    text: { primary: "#fff", secondary: "rgba(255,255,255,0.5)", muted: "rgba(255,255,255,0.4)" },
    glass: { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.1)" },
  },
  radius: { organic: "60px 20px 60px 20px", standard: "12px" },
  effects: { blur: "30px", glowBlur: "120px", shadow: "0 25px 50px -12px rgba(0,0,0,0.5)" },
};
```

---

*Last updated: January 11, 2026*
