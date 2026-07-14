<div align="center">
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px; border-radius: 16px; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 2.5rem;">⚙️ CD Store - Backend API</h1>
  </div>
  
  <p>A robust, scalable, and secure RESTful API powering the CD Store E-Commerce platform.</p>
  
  [![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![JWT](https://img.shields.io/badge/JWT-JSON_Web_Tokens-black?style=for-the-badge&logo=json-web-tokens)](https://jwt.io/)
</div>

<br />

## ✨ Features

- **🔐 Authentication & Authorization**: Secure login with JWT (JSON Web Tokens), including refresh token rotation stored in HTTP-only cookies.
- **👥 Role-Based Access Control (RBAC)**: Distinct permissions for `user` and `admin` roles, securing sensitive endpoints.
- **🛍️ Order Management**: Full lifecycle management of orders, from cart checkout to delivery tracking.
- **💳 Payment Gateway**: Integration with **PayOS** for seamless local QR code payments.
- **📧 Automated Emails**: Built-in `nodemailer` service for welcome emails, login alerts, OTPs, and order status updates.
- **🖼️ Media Uploads**: Direct integration with **Cloudinary** for managing product images efficiently.
- **📊 Analytics Engine**: MongoDB aggregation pipelines to serve revenue and top-selling product data to the admin dashboard.

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (with [Mongoose](https://mongoosejs.com/) ODM)
- **Authentication**: `jsonwebtoken`, `bcryptjs`
- **Email Service**: `nodemailer`
- **File Uploads**: `multer`, `cloudinary`
- **CORS & Security**: `cors`, `cookie-parser`

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed and access to a MongoDB instance (e.g., MongoDB Atlas).

### Installation

1. **Navigate to the backend directory**:
   ```bash
   cd be
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root of the backend directory. You will need API keys for Cloudinary, PayOS, and an SMTP account (like Gmail App Passwords).
   
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/cd-store
   
   # Security
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   
   # Cloudinary (Images)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Nodemailer (SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   
   # PayOS (Payments)
   PAYOS_CLIENT_ID=your_client_id
   PAYOS_API_KEY=your_api_key
   PAYOS_CHECKSUM_KEY=your_checksum_key
   
   # Client URLs
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server**:
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:5000` and connect to MongoDB.*

## 📂 Project Structure

```text
src/
├── config/           # Database and 3rd-party service configurations
├── middlewares/      # Custom Express middlewares (Auth, Error handling)
├── models/           # Mongoose schemas (User, Product, Order, etc.)
├── routes/           # Express route definitions
├── utils/            # Helper functions (Response formatter, Email templates)
└── server.js         # Express application entry point
```

## 🔒 Security Measures
- Passwords are hashed using `bcryptjs` before hitting the database.
- Refresh tokens are stored in secure, `httpOnly` cookies to prevent XSS attacks.
- Sensitive admin endpoints are protected by `verifyRole(['admin'])` middleware.

---
<div align="center">
  <i>Engineered for reliability and speed.</i>
</div>
