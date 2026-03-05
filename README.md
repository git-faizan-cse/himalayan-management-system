# Himalayan Management System (Dealer Desk)

An all-in-one ERP and CRM platform designed for modern dealers and trading businesses. This application streamlines core business operations by unifying invoicing, inventory management, purchasing, and business reporting into a single dashboard.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Prisma](https://img.shields.io/badge/Prisma-5.22-blue?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css)

## 🌟 Key Features

- **Fast Invoicing**: Create GST-compliant invoices natively in seconds. Automatically track paid and pending balances for customer accounts.
- **Inventory Control**: Secure multi-location stock tracking with real-time valuation metrics to ensure optimal inventory levels.
- **Profit Tracking & Reporting**: Gain instant financial clarity. Track income versus expenses and generate detailed, accountant-ready reports.
- **Secure Authentication**: Built-in credential-based authentication using modern JWT tokens, featuring robust Role-Based Access Control (RBAC) supporting Admin and Staff roles.

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Frontend library**: React 19
- **Styling**: Tailwind CSS v4 and accessible Radix/Shadcn UI components
- **Database & ORM**: MySQL interfaced seamlessly via Prisma ORM for strong typing
- **Authentication**: JWT session management with `jose` and `bcryptjs`
- **Validation**: Strict schema validation using Zod and React Hook Form
- **Utilities**: `xlsx` for comprehensive data export into Excel, `@react-pdf/renderer` for automatic PDF generation.

## 📋 Prerequisites

Before you install the project, ensure you have the following software installed:
- [Node.js](https://nodejs.org/) (Version 18.x or higher)
- [npm](https://www.npmjs.com/) (usually shipped with Node.js)
- A running [MySQL](https://www.mysql.com/) server (locally or hosted on a platform like Railway, AWS RDS, etc.)

## 🚀 Setup Instructions & Installation

1. **Clone the project repository** (or download the source code):
   ```bash
   git clone <repository-url>
   cd himalayan-management-system
   ```

2. **Install dependencies**:
   Run the following command in your terminal to install all required Node.js packages:
   ```bash
   npm install
   ```

## ⚙️ Configuration

1. Create a `.env` file in the root directory of the application.
2. Configure your database connection string in the `.env` file using the following format:
   ```env
   # Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
   DATABASE_URL="mysql://root:yourpassword@localhost:3306/himalayan_db"
   ```

   *Note: If you are using a cloud database platform like [Railway](https://railway.app), copy the Database URL provided in their dashboard directly.*

3. **Initialize the Database Structure**:
   Synchronize the Prisma schema configuration with your actual MySQL database to construct the required schema tables:
   ```bash
   npx prisma db push
   ```
   *Note: Run `npx prisma generate` if the Prisma client isn't automatically generated.*

## 💻 Usage & Local Development

To start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to explore the Dealer Desk layout.

### Demo Credentials
To quickly explore the dashboard layout and specific staff limitations without needing to register a new user, you can use the built-in demo credentials located on the login page:

**Demo Admin Account:**
- **Email:** `demo@example.com`
- **Password:** `demo1234`

**Demo Staff Account:**
- **Email:** `demostaff@example.com`
- **Password:** `demo1234`

## 📦 Deployment Details

This Full-Stack Next.js application is production-ready and optimized to be effortlessly deployed to platforms like [Vercel](https://vercel.com), or any Virtual Private Server (VPS).

### Production Build

1. Build the optimal application for production environments. The default `build` script will automatically generate the Prisma client before compiling the application:
   ```bash
   npm run build
   ```

2. Launch the compiled production server:
   ```bash
   npm run start
   ```

### Vercel Deployment Tips
- Simply import your connected GitHub repository into Vercel. Vercel intrinsically understands Next.js projects and will run the proper build commands.
- Under **Settings -> Environment Variables**, firmly ensure that your production `DATABASE_URL` is safely populated before you deploy. Vercel will fail the build step if the DB client cannot be accurately instantiated or connected.

## 📄 License & Copyright

© 2026 Himalayan SaaS Platform. Built for Dealers. All rights reserved.
