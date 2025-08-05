import express from 'express';
import {
    uploadImage,
    addProduct,
    getProducts,
    deleteProduct,
    getReviews,
    addReview
} from "../controllers/productController.js";

const router = express.Router();

// Product management routes (for sellers)
router.post("/upload", uploadImage);
router.post("/", addProduct);
router.delete("/", deleteProduct);

// Product data retrieval routes (for customers and sellers)
router.post("/get", getProducts);
router.post("/reviews", getReviews);
router.post("/add-review", addReview);

export default router;
