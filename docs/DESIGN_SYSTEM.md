# PULSE — Design System

## Brand Colours (Jera Legacy)

| Token | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| Jera Red | `#911431` | `--red` | Primary accent, active nav, buttons, progress fills |
| Red Light | `#F5E8EB` | `--red-light` | Announcement backgrounds, hover states |
| Red Glow | `#91143120` | `--red-glow` | Focus rings, box shadows |
| Jera Blue | `#2b72b9` | `--blue` | Secondary accent, links, IT-related badges |
| Blue Light | `#EBF3FB` | `--blue-light` | Alternating table rows, info backgrounds |
| Jera Pink | `#db4fb2` | `--pink` | Accent (sparingly), some avatar colours |
| Green | `#2D8A56` | `--green` | Success, completed states, approved badges |
| Amber | `#C4880C` | `--amber` | Warning, pending states, in-progress |
| Background | `#FAF9F7` | `--bg` | Warm off-white page background |
| Card | `#FFFFFF` | `--card` | Card surfaces |
| Border | `#E8E4DF` | `--border` | Card borders, dividers |
| Border Light | `#F0ECE8` | `--border-light` | Subtle dividers, table row borders |
| Text | `#1a1a1a` | `--text` | Primary text |
| Text Muted | `#8C857D` | `--text-muted` | Labels, captions |
| Text Secondary | `#6B645C` | `--text-secondary` | Body text in cards |
| Sidebar BG | `#1a1a1a` | `--sidebar-bg` | Sidebar background, dark headers |
| Sidebar Hover | `#2a2a2a` | `--sidebar-hover` | Sidebar item hover |

## Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Display / Headings | Outfit | 800 | 28px (page titles) |
| Body | Outfit | 400-500 | 13-14px |
| Labels | Outfit | 600-700 | 11-13px |
| Data / Monospace | JetBrains Mono | 400-700 | 12-13px (avatars, badges, code) |

Load via Google Fonts:
```
Outfit:wght@300;400;500;600;700;800;900
JetBrains+Mono:wght@400;500;600;700
```

## Spacing & Radius

| Token | Value |
|-------|-------|
| `--radius` | 14px (cards, large elements) |
| `--radius-sm` | 8px (buttons, inputs, badges) |
| `--radius-xs` | 5px (small badges, tags) |
| Card padding | 24px |
| Page header padding | 32px 40px |
| Section gap | 14-20px |

## Component Patterns

### Stat Cards
- Top 3px colour bar (different colour per card)
- Large number (32px, 800 weight)
- Small label below (12px, muted)
- Subtle shadow

### Action Cards
- 20px padding, border, radius-14
- Hover: border turns red, subtle red shadow, translateY(-1px)
- Icon (26px emoji), bold title, muted description

### Phase Headers (Workflow)
- Expandable accordion
- Closed: white card with border
- Open: dark background (#1a1a1a), red border, white text
- Mini progress bar on the right

### SOP Cards
- Dark gradient header (linear-gradient 135deg, #1a1a1a → #2a2a2a)
- Large emoji icon (44px), red eyebrow text, white title
- Light body with detail text, action hint (red bg), tip (amber bg)

### Badges
- Inline-flex, 11px font, 5px radius
- Colour is text colour; background is colour at 15% opacity; border at 30% opacity
- Example: `background: #2D8A5615; color: #2D8A56; border: 1px solid #2D8A5630;`

### Notifications (Toast)
- Fixed top-right stack
- Dark background (#1a1a1a), red left border
- Avatar, name (white), message (grey)
- Auto-dismiss after 5 seconds
- Slide-in animation from right

### Tables (Admin/Leave)
- Header row: dark bg (#1a1a1a or #911431), white text, uppercase, letter-spacing
- Rounded corners on first/last header cells
- Alternating row colours (white / red-light or bg)
- 13px body text

## Sidebar
- Width: 260px fixed
- Dark background (#1a1a1a)
- Section labels: 10px, uppercase, 25% white opacity
- Nav items: 13.5px, 70% white, 8px radius
- Active state: red background (#911431), white text, red shadow
- Bottom: user card (dark card, avatar, name, role) + sign out button

## Auth Screens
- Full-screen dark gradient background (135deg, #1a1a1a → #2d1520 → #1a1a1a)
- Decorative radial gradient circles (subtle red + blue)
- White card (420px max, 20px radius, 44px padding)
- PULSE logo icon (red square, white "P")
- Clean form fields with red focus rings

## Responsive
- Below 900px: stat cards go 2-column
- Below 700px: sidebar collapses to 60px icon-only mode
