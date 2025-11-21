# OniCommerce

A modern, full-stack e-commerce platform built with Next.js 14, TypeScript, MongoDB, and Tailwind CSS.

## 🚀 Features

- **Next.js 14** with App Router for optimal performance
- **TypeScript** for type-safe development
- **MongoDB & Mongoose** for robust data management
- **Tailwind CSS** for responsive, mobile-first design
- **JWT Authentication** with role-based access control
- **Cloudinary Integration** for image management
- **Shopping Cart** with context-based state management
- **Product Management** with variants and inventory tracking
- **Order Management** with comprehensive status tracking
- **Admin Dashboard** for store management

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **Image Storage**: Cloudinary
- **State Management**: React Context
- **API**: Next.js API Routes

## 📁 Project Structure

```
OniCommerce/
├── app/                          # Next.js 14 App Router
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── products/           # Product management
│   │   ├── orders/             # Order management
│   │   └── health/             # Health check endpoint
│   ├── admin/                  # Admin dashboard pages
│   ├── cart/                   # Shopping cart pages
│   ├── products/               # Product listing and details
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/                  # Reusable React components
├── context/                     # React Context providers
│   ├── AuthContext.tsx         # Authentication state
│   └── CartContext.tsx         # Shopping cart state
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts              # Authentication utilities
│   └── useCart.ts              # Cart management utilities
├── lib/                         # Utility libraries
│   ├── auth.ts                 # JWT token utilities
│   ├── cloudinary.ts           # Cloudinary integration
│   └── mongoose.ts             # MongoDB connection
├── models/                      # Mongoose schemas
│   ├── Admin.ts                # Admin user model
│   ├── Product.ts              # Product model
│   └── Order.ts                # Order model
├── types/                       # TypeScript type definitions
│   ├── Common.ts               # Shared types
│   ├── Product.ts              # Product types
│   ├── Order.ts                # Order types
│   └── Cart.ts                 # Shopping cart types
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies and scripts
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── next.config.js              # Next.js configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB instance (local or cloud)
- Cloudinary account (for image uploads)

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd OniCommerce
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```
   Configure your environment variables in `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/onicommerce
   JWT_ACCESS_TOKEN_SECRET=your-super-secret-access-token
   JWT_REFRESH_TOKEN_SECRET=your-super-secret-refresh-token
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Visit the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Authentication

The platform includes a comprehensive authentication system:

- **JWT-based authentication** with access and refresh tokens
- **Role-based access control** (Super Admin, Admin, Moderator)
- **Permission-based authorization** for different features
- **Session management** with automatic timeout
- **Password security** with bcrypt hashing

## 🛒 Shopping Cart

Features a powerful cart management system:

- **Persistent cart** using localStorage
- **Real-time updates** with React Context
- **Discount codes** support
- **Multiple shipping methods**
- **Inventory validation**
- **Bulk operations** support

## 📦 Product Management

Comprehensive product management capabilities:

- **Product variants** with different attributes
- **Inventory tracking** with low stock alerts
- **Multiple images** with Cloudinary integration
- **Product categories** and tags
- **SEO optimization** fields
- **Product specifications** and details

## 📋 Order Management

Complete order processing system:

- **Order status tracking** (pending, confirmed, shipped, delivered)
- **Payment status management**
- **Shipping integration** with tracking
- **Order history** and analytics
- **Tax and discount calculations**

## 🖼️ Image Management

Integrated with Cloudinary for optimal image handling:

- **Automatic optimization** for web delivery
- **Multiple sizes** and formats (WebP, AVIF)
- **Secure uploads** with signed URLs
- **Bulk operations** support
- **CDN delivery** for fast loading

## 🎨 Styling

Built with Tailwind CSS for modern, responsive design:

- **Mobile-first approach**
- **Custom theme** with brand colors
- **Responsive components**
- **Dark mode support** (configurable)
- **Animation utilities**

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Type checking

## 🔧 Environment Variables

Key environment variables (see `.env.example` for full list):

```env
# Database
MONGODB_URI=mongodb://localhost:27017/onicommerce

# Authentication
JWT_ACCESS_TOKEN_SECRET=your-access-token-secret
JWT_REFRESH_TOKEN_SECRET=your-refresh-token-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Application
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** - Vercel handles the rest

### Docker

```bash
# Build the image
docker build -t onicommerce .

# Run the container
docker run -p 3000:3000 --env-file .env.local onicommerce
```

### Manual

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

1. Check the [documentation](docs/)
2. Search [existing issues](../../issues)
3. Create a [new issue](../../issues/new)

---

Built with ❤️ using Next.js 14, TypeScript, and modern web technologies.
