# 📸 Screenshot Guide

## How to Add Screenshots to Your Project

### Step 1: Take Screenshots

Take screenshots of the following pages in your application:

1. **Dashboard** (`/dashboard`)
   - Show table status grid with some BUSY (red) and FREE (green) tables
   - Filename: `dashboard.png`

2. **Order Taking** (`/orders`)
   - Show the order page with menu items and cart
   - Filename: `order-taking.png`

3. **Billing Modal**
   - Show the billing modal with GST/service charge inputs
   - Filename: `billing.png`

4. **Invoice Preview**
   - Show a generated invoice
   - Filename: `invoice.png`

5. **Menu Management** (`/menu`)
   - Show the menu management page
   - Filename: `menu-management.png`

### Step 2: Optimize Screenshots

**Recommended Tools:**
- **Windows:** Snipping Tool (Win + Shift + S)
- **Mac:** Screenshot (Cmd + Shift + 4)
- **Online:** [TinyPNG](https://tinypng.com/) for compression

**Best Practices:**
- Resolution: 1920x1080 or 1280x720
- Format: PNG for UI screenshots
- File size: < 500KB (compress if needed)
- Clear, readable text
- Hide sensitive information (emails, real names)

### Step 3: Save Screenshots

Save all screenshots in the `docs/images/` folder:

```
docs/
└── images/
    ├── dashboard.png
    ├── order-taking.png
    ├── billing.png
    ├── invoice.png
    ├── menu-management.png
    └── architecture-diagram.png (optional)
```

### Step 4: Reference in Markdown

**For GitHub README:**
```markdown
![Dashboard](docs/images/dashboard.png)
```

**For AWS Builder Center:**
1. Upload images to the Builder Center editor
2. Or host on GitHub and use absolute URLs:
```markdown
![Dashboard](https://raw.githubusercontent.com/Srinivas-BH/Hotel-Billing/main/docs/images/dashboard.png)
```

### Step 5: Add to Git

```bash
# Add images to git
git add docs/images/*.png

# Commit
git commit -m "docs: Add application screenshots"

# Push to GitHub
git push origin main
```

## For AWS Builder Center

### Option 1: Upload Directly
1. Go to AWS Builder Center editor
2. Click "Add Image" button
3. Upload your screenshots
4. Add captions

### Option 2: Use GitHub URLs
1. Push images to GitHub first
2. Get raw image URLs from GitHub
3. Use in Builder Center markdown:

```markdown
![Dashboard](https://raw.githubusercontent.com/Srinivas-BH/Hotel-Billing/main/docs/images/dashboard.png)
*Real-time table status tracking*
```

## Screenshot Checklist

- [ ] Dashboard with table status
- [ ] Order taking page
- [ ] Billing modal
- [ ] Invoice preview
- [ ] Menu management
- [ ] Login page (optional)
- [ ] Profile page (optional)
- [ ] Reports page (optional)

## Tips for Great Screenshots

1. **Use Demo Data** - Create sample orders and menu items
2. **Clean UI** - Close unnecessary browser tabs/windows
3. **Consistent Theme** - Use same browser and theme
4. **Highlight Features** - Show key functionality
5. **Add Annotations** - Use arrows or highlights if needed
6. **Mobile Views** - Include responsive design screenshots

## Example Screenshot Workflow

```bash
# 1. Start your app
npm run dev

# 2. Create demo data
# - Login as test hotel
# - Add menu items
# - Create orders for tables 1, 2, 3
# - Generate an invoice

# 3. Take screenshots
# - Dashboard: Show BUSY tables
# - Orders: Show cart with items
# - Billing: Show modal with calculations
# - Invoice: Show generated invoice

# 4. Save and optimize
# - Save to docs/images/
# - Compress with TinyPNG
# - Verify file sizes < 500KB

# 5. Commit and push
git add docs/images/*.png
git commit -m "docs: Add application screenshots"
git push origin main
```

## Cover Image for AWS Builder Center

Create a professional cover image (1200x630px) with:
- Project title
- Key features
- Tech stack logos
- Performance metrics

**Tools:**
- [Canva](https://www.canva.com/) - Free design tool
- [Figma](https://www.figma.com/) - Professional design
- [Photopea](https://www.photopea.com/) - Free Photoshop alternative

**Template:**
```
┌─────────────────────────────────────────┐
│                                         │
│   🏨 Hotel Billing System               │
│                                         │
│   ⚡ Sub-second Performance             │
│   🔄 Real-time Updates                  │
│   🔒 Multi-tenant Architecture          │
│                                         │
│   Next.js • TypeScript • PostgreSQL     │
│                                         │
└─────────────────────────────────────────┘
```
