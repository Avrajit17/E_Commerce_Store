import express from "express";
import {
    signup,
    login,
    adminLogin,
    deliveryLogin,
    applyForSeller
} from "../controllers/authController.js";

const router = express.Router();

// User 
router.post("/signup", signup);
router.post("/login", login);
router.post("/apply-for-seller", applyForSeller);

// Admin
router.post("/admin-login", adminLogin);

// Delivery system authentication 
router.post("/delivery-login", deliveryLogin);

export default router;
//the end of my auth routes 