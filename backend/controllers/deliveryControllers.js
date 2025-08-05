import { sql } from "../config/db.js";
import { sendNotification } from "./notificationController.js";

/**
 * Gets all orders assigned to a specific delivery person.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const getAssignedOrders = async (req, res) => {
    let { email } = req.body;
    try {
        const orders = await sql`
            SELECT o.*, u.name AS customer_name, u.phone_number AS customer_phone
            FROM orders o
            JOIN delivery_orders d ON o.order_id = d.order_id
            JOIN users u ON o.user_email = u.email
            WHERE d.delivery_email = ${email}
            ORDER BY o.order_date DESC
        `;
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching assigned orders:", error);
        res.status(500).json({ 'alert': 'An error occurred while fetching assigned orders.' });
    }
};

/**
 * Updates the status of an order.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const updateOrderStatus = async (req, res) => {
    let { orderId, status } = req.body;

    // Validate the status
    const validStatuses = ['assigned', 'out for delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 'alert': 'Invalid delivery status provided.' });
    }

    try {
        await sql`
            UPDATE orders SET delivery_status = ${status} WHERE order_id = ${orderId}
        `;

        // Get the user's email to send a notification
        const order = await sql`SELECT user_email FROM orders WHERE order_id = ${orderId}`;
        if (order.length > 0) {
            const userEmail = order[0].user_email;
            await sendNotification(userEmail, `The status of your order #${orderId.substring(0, 8)} has been updated to '${status}'.`, sql);
        }

        res.status(200).json('success');
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ 'alert': 'An error occurred while updating the order status.' });
    }
};
