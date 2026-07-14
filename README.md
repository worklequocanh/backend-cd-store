# CD Store - Backend

This is the backend API for the CD Store E-Commerce application, built with Node.js, Express, and MongoDB.

## Features
- **RESTful API:** Structured and standard API endpoints.
- **Authentication:** JWT-based authentication with bcrypt password hashing.
- **Role-based Access Control:** Protected routes for Users and Admins.
- **Database:** MongoDB with Mongoose ODM.
- **Media Uploads:** Cloudinary integration for product images.
- **Security:** Helmet for HTTP headers, CORS protection.

## Tech Stack
- Node.js & Express.js
- MongoDB & Mongoose
- JSON Web Token (JWT)
- Cloudinary
- Nodemailer

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB running locally or a MongoDB Atlas URI

### Installation
1. Clone the repository and navigate to this folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in the values:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/cd-store
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints
- **Auth:** `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- **Products:** `/api/products`
- **Cart:** `/api/cart`
- **Orders:** `/api/orders`
- **Admin:** `/api/admin/*`
