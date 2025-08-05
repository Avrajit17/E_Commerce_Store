import express from 'express';
import {
    getCart,
    addToCart,
    removeFromCart,
    placeOrder,
    getOrderHistory,
    getNotifications
} from "../controllers/shopController.js";

const router = express.Router();

// Cart routes
router.post("/cart", getCart);
router.post("/cart/add", addToCart);
router.post("/cart/remove", removeFromCart);

// Order routes
router.post("/order", placeOrder);
router.post("/history", getOrderHistory);

// Notification route
router.post("/notifications", getNotifications);

export default router;
