# KPSULL Homepage Components

This directory contains the homepage components for the KPSULL platform.

## Components

### 1. HeroSection (Server Component)

Full-width hero section with logo, title, and subtitle.

**Features:**
- Full viewport height (100vh)
- Gradient background with overlay
- Centered content with logo, title, and subtitle
- Responsive text sizing
- Uses brand colors (accent for logo and subtitle)

**Usage:**
```tsx
import { HeroSection } from "@/components/home";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
    </main>
  );
}
```

### 2. CategorySlider (Client Component)

Horizontal scrollable category section with navigation buttons.

**Features:**
- 6 category cards with gradient backgrounds
- Horizontal scroll with snap behavior
- Previous/Next navigation buttons
- Responsive card sizing (300px mobile, 400px desktop)
- Links to catalogue with style filter
- Smooth scroll behavior

**Categories:**
- STREETSTYLE
- SCANDI
- CLASSIC
- AVANT-GARDE
- SPORTIF
- Y2K

**Usage:**
```tsx
import { CategorySlider } from "@/components/home";

export default function HomePage() {
  return (
    <main>
      <CategorySlider />
    </main>
  );
}
```

## Colors Used

- **accent**: Yellow/Gold color for logo and subtitle (oklch(0.861 0.147 95.419))
- **kpsull-nav**: Dark navy for next button (oklch(0.303 0.051 263.396))
- **muted-foreground**: For secondary text

## Fonts

- **Montserrat**: Primary font for headings (600 weight)
- **Archivo**: Font for body text and subtitle (700 weight)

## Note

The hero section currently uses a placeholder gradient background. Replace with actual image when available.
