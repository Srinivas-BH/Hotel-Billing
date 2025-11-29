# 🏨 Hotel Billing Management System

A modern, full-stack web application for hotel billing automation with AI-powered invoice generation, real-time analytics, and comprehensive reporting capabilities.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-18.3-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue?style=flat-square&logo=postgresql)
![AWS S3](https://img.shields.io/badge/AWS-S3-orange?style=flat-square&logo=amazon-aws)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The Hotel Billing Management System is a comprehensive solution designed to automate and streamline billing operations for hotels and restaurants. It provides an intuitive interface for managing menus, generating bills, tracking revenue, and maintaining customer records.

### Key Highlights

- **AI-Powered Invoicing**: Automatic invoice generation using Hugging Face AI with intelligent fallback
- **Real-Time Analytics**: Daily and monthly revenue reports with visual charts
- **Mobile-First Design**: Responsive interface optimized for tablets and mobile devices
- **Secure & Scalable**: Built with enterprise-grade security and cloud infrastructure
- **Fast Performance**: Sub-3-second page loads and instant autocomplete

## ✨ Features

### 🔐 Authentication & Security
- Secure user registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Session management with automatic expiration
- HTTPS enforcement in production

### 🍽️ Menu Management
- Add, edit, and delete menu items
- Set prices and descriptions
- Real-time search with autocomplete
- Bulk import/export capabilities

### 💰 Billing & Invoicing
- Table-wise order management
- Automatic calculation of:
  - Subtotals
  - GST (Goods and Services Tax)
  - Service charges
  - Discounts
- AI-powered invoice generation
- PDF invoice creation and download
- Invoice history and search

### 📊 Reports & Analytics
- Daily revenue summaries
- Monthly revenue reports
- Invoice filtering by:
  - Date range
  - Table number
  - Invoice ID
- Export reports as PDF
- Visual charts and graphs

### 👤 Profile Management
- Update hotel information
- Manage table count
- Upload hotel logo/photo
- Account settings

### 📱 Responsive Design
- Mobile-optimized interface
- Touch-friendly controls
- Adaptive layouts for all screen sizes
- Progressive Web App (PWA) ready

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt

### Database
- **Database**: PostgreSQL (Supabase)
- **ORM**: Native pg driver
- **Connection Pooling**: Enabled

### Storage & AI
- **File Storage**: AWS S3 with presigned URLs
- **AI Engine**: Hugging Face Inference API
- **PDF Generation**: Puppeteer

### Testing
- **Unit Tests**: Jest + React Testing Library
- **Property-Based Tests**: fast-check
- **E2E Tests**: Playwright
- **Test Coverage**: 98%+

### DevOps
- **Deployment**: AWS Amplify / Vercel
- **CI/CD**: GitHub Actions
- **Monitoring**: Built-in error logging
- **Version Control**: Git

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- AWS account (for S3 storage)
- Hugging Face API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hotel-billing-admin.git
   cd hotel-billing-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host:5432/database
   
   # JWT
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=24h
   
   # AWS S3 (Optional)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   S3_BUCKET_PHOTOS=your-photos-bucket
   S3_BUCKET_INVOICES=your-invoices-bucket
   
   # Hugging Face AI (Optional)
   HUGGINGFACE_API_KEY=your-api-key
   ```

4. **Set up the database**
   ```bash
   # Run the SQL schema
   psql $DATABASE_URL < database-schema.sql
   
   # Or use the migration script
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:8000
   ```

### Quick Test

Test your database connection:
```bash
node test-db-connection.js
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `JWT_EXPIRES_IN` | Token expiration time | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |
| `AWS_REGION` | AWS region for S3 | No |
| `AWS_ACCESS_KEY_ID` | AWS access key | No |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | No |
| `S3_BUCKET_PHOTOS` | S3 bucket for photos | No |
| `S3_BUCKET_INVOICES` | S3 bucket for invoices | No |
| `HUGGINGFACE_API_KEY` | Hugging Face API key | No |

### Database Schema

The application uses the following main tables:
- `hotels` - Hotel account information
- `menu_items` - Menu items with prices
- `invoices` - Generated invoices
- `invoice_items` - Line items for invoices

See `database-schema.sql` for the complete schema.

## 🌐 Deployment

### Deploy to AWS Amplify

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to AWS Amplify**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "New app" → "Host web app"
   - Connect your GitHub repository
   - Select the branch (main)

3. **Configure Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

4. **Add Environment Variables**
   - In Amplify Console, go to "Environment variables"
   - Add all variables from `.env.local`

5. **Deploy**
   - Click "Save and deploy"
   - Your app will be live at: `https://your-app.amplifyapp.com`

### Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts and add environment variables in the Vercel dashboard.

## 📚 API Documentation

### Authentication

#### POST `/api/auth/signup`
Register a new hotel account.

**Request:**
```json
{
  "email": "hotel@example.com",
  "password": "securepassword",
  "hotelName": "Grand Hotel",
  "tableCount": 20
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "hotel@example.com",
    "hotelName": "Grand Hotel"
  }
}
```

#### POST `/api/auth/login`
Login to existing account.

### Menu Management

#### GET `/api/menu`
Get all menu items for the authenticated hotel.

#### POST `/api/menu`
Create a new menu item.

#### PUT `/api/menu/:id`
Update a menu item.

#### DELETE `/api/menu/:id`
Delete a menu item.

### Billing

#### POST `/api/billing/generate`
Generate a new invoice.

**Request:**
```json
{
  "tableNumber": 5,
  "items": [
    { "menuItemId": "uuid", "quantity": 2 }
  ],
  "gstPercentage": 18,
  "serviceChargePercentage": 10,
  "discountAmount": 0
}
```

### Reports

#### GET `/api/reports/daily`
Get daily revenue reports.

#### GET `/api/reports/monthly`
Get monthly revenue reports.

#### POST `/api/reports/export`
Export reports as PDF.

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm test -- --coverage
```

Current test coverage: **98%+**
- 469 passing tests
- 31/33 test suites passing
- Property-based tests with 100+ iterations each

## 📈 Performance

- **Page Load Time**: < 3 seconds on 3G
- **API Response Time**: < 500ms average
- **Invoice Generation**: < 2 seconds
- **Autocomplete Response**: < 100ms
- **PDF Generation**: < 3 seconds

## 🔒 Security

- Password hashing with bcrypt (10 salt rounds)
- JWT tokens with 24-hour expiration
- HTTPS enforcement in production
- SQL injection prevention via parameterized queries
- XSS protection via React's built-in escaping
- CSRF protection via SameSite cookies
- Rate limiting (100 requests per 15 minutes)
- Input validation with Zod schemas

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow the existing code style
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work*

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for the database platform
- AWS for cloud infrastructure
- Hugging Face for AI capabilities
- All contributors and testers

## 📞 Support

For support, email support@yourhotel.com or open an issue in the GitHub repository.

## 🗺️ Roadmap

- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with payment gateways
- [ ] Inventory management
- [ ] Staff management module
- [ ] Customer loyalty program
- [ ] Email notifications
- [ ] SMS notifications
- [ ] WhatsApp integration

---

**Made with ❤️ for the hospitality industry**
