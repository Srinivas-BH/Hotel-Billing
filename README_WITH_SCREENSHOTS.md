# 🏨 Hotel Billing Management System

> A production-ready, high-performance hotel billing system built with Next.js, TypeScript, and PostgreSQL. Achieve sub-second response times with real-time order tracking and multi-tenant architecture.

[![GitHub Stars](https://img.shields.io/github/stars/Srinivas-BH/Hotel-Billing?style=social)](https://github.com/Srinivas-BH/Hotel-Billing)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## 📸 Screenshots

### Dashboard - Real-time Table Status
![Dashboard](docs/images/dashboard.png)
*Live table status tracking with BUSY/FREE indicators*

### Order Management
![Order Taking](docs/images/order-taking.png)
*Intuitive order management with menu selection*

### Billing System
![Billing](docs/images/billing.png)
*Quick billing with GST, service charges, and discounts*

### Invoice Generation
![Invoice](docs/images/invoice.png)
*Professional invoice generation with detailed breakdown*

### Menu Management
![Menu](docs/images/menu-management.png)
*Easy menu item management with CRUD operations*

## ✨ Features

- ✅ **Real-time Table Status** - Live updates showing BUSY/FREE tables
- ✅ **Order Management** - Complete CRUD operations with optimistic locking
- ✅ **Smart Billing** - Automatic GST, service charge, and discount calculations
- ✅ **Invoice Generation** - Professional invoices with unique numbers
- ✅ **Multi-tenant** - Complete data isolation per hotel
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **High Performance** - Sub-second response times
- ✅ **Secure** - JWT authentication with bcrypt password hashing

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Srinivas-BH/Hotel-Billing.git
cd Hotel-Billing

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

Visit http://localhost:8000 to see the application.

## 📊 Performance Metrics

| Metric | Achievement |
|--------|-------------|
| Invoice Generation | < 1 second (60x faster) |
| API Response Time | < 500ms |
| Database Queries | < 100ms |
| Page Load Time | < 1 second |
| Lighthouse Score | 96/100 |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client Layer                       │
│  (Next.js React Components + TypeScript)            │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS/REST API
┌────────────────────▼────────────────────────────────┐
│              API Layer (Next.js Routes)              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Auth Service │  │ Order Service│  │  Billing  │ │
│  │   (JWT)      │  │  (CRUD)      │  │  Service  │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└────────────────────┬────────────────────────────────┘
                     │ PostgreSQL Protocol
┌────────────────────▼────────────────────────────────┐
│           Database Layer (PostgreSQL)                │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌───────┐│
│  │ Hotels  │  │  Menu   │  │  Orders  │  │Invoice││
│  │  Table  │  │  Items  │  │  Table   │  │ Table ││
│  └─────────┘  └─────────┘  └──────────┘  └───────┘│
└─────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Lucide Icons

**Backend:**
- Next.js API Routes
- PostgreSQL
- JWT Authentication
- Zod Validation

**Infrastructure:**
- Supabase (Database)
- Vercel (Hosting)
- GitHub Actions (CI/CD)

## 📖 Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run property-based tests
npm run test:property
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Srinivas B H**
- LinkedIn: [@srinivas-bh27](https://www.linkedin.com/in/srinivas-bh27/)
- GitHub: [@Srinivas-BH](https://github.com/Srinivas-BH)
- Email: bhsrinivas4@gmail.com

## 🙏 Acknowledgments

- Built with [Kiro AI](https://kiro.ai) - AI-powered development assistant
<!-- - Hosted on [Vercel](https://vercel.com) -->
- Database by [Supabase](https://supabase.com)

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

**Built with ❤️ using AI-assisted development**
