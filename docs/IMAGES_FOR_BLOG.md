# Images for AWS Builder Center Blog Post

## Required Images

### 1. Cover Image (Required)
**Dimensions:** 1200x630px
**File:** `cover-image.png`
**Description:** Professional banner with project title and key features

**Suggested Content:**
- Title: "Building a Production-Ready Hotel Billing System"
- Subtitle: "AI-Assisted Development • Sub-second Performance"
- Tech logos: Next.js, TypeScript, PostgreSQL
- Performance badge: "60x Faster"

---

### 2. Dashboard Screenshot
**File:** `dashboard-screenshot.png`
**Caption:** "Real-time table status dashboard showing BUSY (red) and FREE (green) tables"
**Where to use:** After "Key Features Implemented" section

---

### 3. Order Management Screenshot
**File:** `order-management-screenshot.png`
**Caption:** "Order taking interface with menu selection and cart management"
**Where to use:** In "Frontend Implementation" section

---

### 4. Billing Modal Screenshot
**File:** `billing-modal-screenshot.png`
**Caption:** "Billing modal with GST, service charge, and discount calculations"
**Where to use:** In "Billing System" section

---

### 5. Performance Comparison Chart
**File:** `performance-chart.png`
**Caption:** "Before and after performance optimization results"
**Where to use:** In "Performance Crisis & Optimization" section

**Data to visualize:**
```
Before:
- Invoice: 60s
- API: 2s
- DB: 500ms

After:
- Invoice: 1s
- API: 500ms
- DB: 100ms
```

---

### 6. Architecture Diagram
**File:** `architecture-diagram.png`
**Caption:** "System architecture showing client, API, and database layers"
**Where to use:** In "Architecture Overview" section

**Already included as ASCII art, but a visual diagram would be better**

---

### 7. Database Schema Diagram
**File:** `database-schema.png`
**Caption:** "Database schema with relationships and indexes"
**Where to use:** In "Database Schema Design" section

---

### 8. Code Editor Screenshot (Optional)
**File:** `code-example.png`
**Caption:** "TypeScript code with AI-assisted development in action"
**Where to use:** In "Implementation" section

---

## How to Add Images to AWS Builder Center

### Method 1: Direct Upload (Recommended)
1. Log in to AWS Builder Center
2. Create new post
3. Click "Add Image" button in editor
4. Upload images from `docs/images/` folder
5. Add captions
6. Position images in appropriate sections

### Method 2: Use GitHub URLs
1. Push images to GitHub repository
2. Get raw URLs:
```
https://raw.githubusercontent.com/Srinivas-BH/Hotel-Billing/main/docs/images/[filename].png
```
3. Use in markdown:
```markdown
![Alt text](https://raw.githubusercontent.com/Srinivas-BH/Hotel-Billing/main/docs/images/dashboard-screenshot.png)
*Caption text*
```

## Image Placement in Blog Post

```markdown
# Building a Production-Ready Hotel Billing System

[Cover Image Here]

## Introduction
...

## The Business Challenge
...

## The Solution
...

## Development Journey

### Day 1: Requirements & Design
...

### Day 2-3: Core Implementation

[Dashboard Screenshot Here]
*Real-time table status dashboard*

[Order Management Screenshot Here]
*Order taking interface*

### Day 4: Performance Crisis

[Performance Chart Here]
*Before and after optimization*

### Day 5: UX Polish

[Billing Modal Screenshot Here]
*Billing interface with calculations*

## Architecture Overview

[Architecture Diagram Here]
*System architecture*

## Database Design

[Database Schema Here]
*Database relationships*

## Performance Benchmarks
...

## Conclusion
...
```

## Creating Images

### For Screenshots:
1. Run your application: `npm run dev`
2. Create demo data (orders, menu items)
3. Take screenshots (Win + Shift + S on Windows)
4. Save to `docs/images/`

### For Diagrams:
**Tools:**
- [Excalidraw](https://excalidraw.com/) - Hand-drawn style diagrams
- [Draw.io](https://app.diagrams.net/) - Professional diagrams
- [Mermaid Live](https://mermaid.live/) - Code-based diagrams
- [Figma](https://figma.com/) - Design tool

### For Charts:
**Tools:**
- [Chart.js](https://www.chartjs.org/) - JavaScript charts
- [Google Charts](https://developers.google.com/chart) - Simple charts
- [Canva](https://www.canva.com/) - Design tool with chart templates

### For Cover Image:
**Tools:**
- [Canva](https://www.canva.com/) - Templates available
- [Figma](https://figma.com/) - Professional design
- [Photopea](https://www.photopea.com/) - Free Photoshop alternative

**Template Suggestion:**
```
Background: Gradient (Blue to Purple)
Title: "Building a Production-Ready Hotel Billing System"
Subtitle: "AI-Assisted Development in 5 Days"
Icons: Next.js, TypeScript, PostgreSQL logos
Badge: "60x Faster Performance"
Author: "By Srinivas B H"
```

## Image Optimization

Before uploading, optimize images:

```bash
# Install imagemin (if needed)
npm install -g imagemin-cli imagemin-pngquant

# Optimize PNG files
imagemin docs/images/*.png --out-dir=docs/images/optimized --plugin=pngquant
```

**Or use online tools:**
- [TinyPNG](https://tinypng.com/)
- [Squoosh](https://squoosh.app/)
- [ImageOptim](https://imageoptim.com/) (Mac)

**Target:**
- File size: < 500KB per image
- Format: PNG for screenshots, JPG for photos
- Resolution: 1920x1080 or 1280x720

## Checklist

- [ ] Cover image created (1200x630px)
- [ ] Dashboard screenshot taken
- [ ] Order management screenshot taken
- [ ] Billing modal screenshot taken
- [ ] Performance chart created
- [ ] Architecture diagram created
- [ ] Database schema diagram created
- [ ] All images optimized (< 500KB)
- [ ] Images saved in `docs/images/`
- [ ] Images pushed to GitHub
- [ ] Images added to blog post
- [ ] Captions added to all images
- [ ] Alt text added for accessibility
