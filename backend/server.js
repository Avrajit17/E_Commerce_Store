
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import fileupload from 'express-fileupload';
import path from 'path';

import { sql } from "./config/db.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";

dotenv.config();

const __dirname = path.resolve();

//it is for the public assets
let staticPath = path.join(__dirname, 'public');

const PORT = process.env.PORT || 3000;
const app = express();


app.use(express.static(staticPath));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(cors());
app.use(fileupload());

//my api routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/delivery", deliveryRoutes);

// Home route
app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"))
});

// 404 route
app.get('/404', (req, res) => {
    res.sendFile(path.join(staticPath, '404.html'))
});
app.use((req, res) => {
    res.redirect('/404');
});

//my database initialization
async function initDB() {
  try {
    // Create USERS table for customers and sellers
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20),
        is_seller BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create SELLERS table
    await sql`
      CREATE TABLE IF NOT EXISTS sellers (
        email VARCHAR(255) PRIMARY KEY REFERENCES users(email),
        business_name VARCHAR(255) NOT NULL,
        about TEXT,
        address VARCHAR(255),
        phone_number VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create ADMIN table
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        email VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        phone_number VARCHAR(20)
      )
    `;

    // Create DELIVERY_SYSTEM table
    await sql`
      CREATE TABLE IF NOT EXISTS delivery_systems (
        email VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20),
        area VARCHAR(255)
      )
    `;

    // Create PRODUCTS table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        product_id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        short_des VARCHAR(100),
        long_des TEXT,
        actual_price DECIMAL(10, 2) NOT NULL,
        discount DECIMAL(5, 2) NOT NULL,
        selling_price DECIMAL(10, 2) NOT NULL,
        stock INTEGER NOT NULL,
        tags VARCHAR(255),
        seller_email VARCHAR(255) REFERENCES sellers(email),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create IMAGES table for product images
    await sql`
      CREATE TABLE IF NOT EXISTS product_images (
        image_id SERIAL PRIMARY KEY,
        image_url VARCHAR(255) NOT NULL,
        product_id VARCHAR(255) REFERENCES products(product_id)
      )
    `;

    // Create CART table
    await sql`
      CREATE TABLE IF NOT EXISTS carts (
        user_email VARCHAR(255) REFERENCES users(email),
        product_id VARCHAR(255) REFERENCES products(product_id),
        quantity INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (user_email, product_id)
      )
    `;

    // Create WISHLIST table
    await sql`
      CREATE TABLE IF NOT EXISTS wishlists (
        user_email VARCHAR(255) REFERENCES users(email),
        product_id VARCHAR(255) REFERENCES products(product_id),
        PRIMARY KEY (user_email, product_id)
      )
    `;

    // Create ORDERS table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        order_id VARCHAR(255) PRIMARY KEY,
        user_email VARCHAR(255) REFERENCES users(email),
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_cost DECIMAL(10, 2) NOT NULL,
        address VARCHAR(255),
        street VARCHAR(255),
        city VARCHAR(255),
        state VARCHAR(255),
        pincode VARCHAR(20),
        landmark VARCHAR(255),
        delivery_status VARCHAR(50) DEFAULT 'not assigned',
        payment_method VARCHAR(50)
      )
    `;

    // Create ORDER_PRODUCTS table to link orders and products
    await sql`
      CREATE TABLE IF NOT EXISTS order_products (
        order_id VARCHAR(255) REFERENCES orders(order_id),
        product_id VARCHAR(255) REFERENCES products(product_id),
        quantity INTEGER NOT NULL,
        PRIMARY KEY (order_id, product_id)
      )
    `;

    // Create DELIVERY_ORDERS table to link delivery systems and orders
    await sql`
      CREATE TABLE IF NOT EXISTS delivery_orders (
        delivery_email VARCHAR(255) REFERENCES delivery_systems(email),
        order_id VARCHAR(255) REFERENCES orders(order_id),
        PRIMARY KEY (delivery_email, order_id)
      )
    `;

    // Create REVIEWS table
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        review_id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) REFERENCES users(email),
        product_id VARCHAR(255) REFERENCES products(product_id),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create NOTIFICATIONS table
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) REFERENCES users(email),
        notification_text TEXT,
        notification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log("Database tables created or already exist.");
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

// Initialize my database and start the server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
  });
});
