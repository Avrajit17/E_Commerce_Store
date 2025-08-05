import express from 'express';
import {
    getAssignedOrders,
    updateOrderStatus
} from "../controllers/deliveryControllers.js";

const router = express.Router();

router.post("/orders", getAssignedOrders);
router.post("/update-status", updateOrderStatus);

export default router;
