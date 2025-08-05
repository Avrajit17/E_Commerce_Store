import express from 'express';
import {
    getAdminDashboardStats,
    getCustomers,
    getSellers,
    getUnassignedOrders,
    assignOrderToDelivery,
    cancelOrder,
    addAdmin,
    addDelivery,
    getDeliverySystems,
    deleteDelivery
} from "../controllers/adminController.js";

const router = express.Router();

router.post("/stats", getAdminDashboardStats);
router.post("/customers", getCustomers);
router.post("/sellers", getSellers);
router.post("/orders", getUnassignedOrders);
router.post("/assign-order", assignOrderToDelivery);
router.post("/cancel-order", cancelOrder);
router.post("/add-admin", addAdmin);
router.post("/add-delivery", addDelivery);
router.post("/delivery-systems", getDeliverySystems);
router.post("/delete-delivery", deleteDelivery);

export default router;
