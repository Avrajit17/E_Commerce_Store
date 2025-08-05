import { sql } from "../config/db.js";
import { sendNotification } from "./notificationController.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * Gets a user's shopping cart.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const getCart = async (req, res) => {
    let { email } = req.body;
    try {
        const cartItems = await sql`
            SELECT p.product_id, p.product_name, p.selling_price, p.stock, c.quantity,
                   (SELECT image_url FROM images WHERE product_id = p.product_id ORDER BY image_id ASC LIMIT 1) AS image
            FROM carts c
            JOIN products p ON c.product_id = p.product_id
            WHERE c.user_email = ${email}
        `;

        const totalCost = cartItems.reduce((total, item) => total + (item.selling_price * item.quantity), 0);
        res.status(200).json({ cartItems, totalCost });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ 'alert': 'An error occurred while fetching cart data.' });
    }
};

/**
 * Adds an item to the user's cart or updates its quantity.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const addToCart = async (req, res) => {
    let { email, productId, quantity } = req.body;
    if (quantity <= 0) {
        return res.status(400).json({ 'alert': 'Quantity must be greater than 0' });
    }
    try {
        const existingCartItem = await sql`SELECT * FROM carts WHERE user_email = ${email} AND product_id = ${productId}`;

        if (existingCartItem.length > 0) {
            await sql`UPDATE carts SET quantity = quantity + ${quantity} WHERE user_email = ${email} AND product_id = ${productId}`;
        } else {
            await sql`INSERT INTO carts (user_email, product_id, quantity) VALUES (${email}, ${productId}, ${quantity})`;
        }

        res.status(200).json('success');
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ 'alert': 'An error occurred while updating the cart.' });
    }
};

/**
 * Removes an item from the cart.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const removeFromCart = async (req, res) => {
    let { email, productId } = req.body;
    try {
        await sql`DELETE FROM carts WHERE user_email = ${email} AND product_id = ${productId}`;
        res.status(200).json('success');
    } catch (error) {
        console.error("Error removing from cart:", error);
        res.status(500).json({ 'alert': 'An error occurred while removing the item from the cart.' });
    }
};

/**
 * Places an order from the user's cart.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const placeOrder = async (req, res) => {
    let { email, address } = req.body;
    try {
        const cartItems = await sql`SELECT product_id, quantity FROM carts WHERE user_email = ${email}`;
        if (cartItems.length === 0) {
            return res.status(400).json({ 'alert': 'Your cart is empty.' });
        }

        const newOrderId = uuidv4();
        let totalCost = 0;
        for (const item of cartItems) {
            const product = await sql`SELECT selling_price FROM products WHERE product_id = ${item.product_id}`;
            if (product.length > 0) {
                totalCost += product[0].selling_price * item.quantity;
            }
        }

        await sql`
            INSERT INTO orders (order_id, user_email, total_cost, address, delivery_status, order_date)
            VALUES (${newOrderId}, ${email}, ${totalCost}, ${address}, 'not assigned', CURRENT_TIMESTAMP)
        `;

        for (const item of cartItems) {
            await sql`
                INSERT INTO order_products (order_id, product_id, quantity)
                VALUES (${newOrderId}, ${item.product_id}, ${item.quantity})
            `;
            await sql`UPDATE products SET stock = stock - ${item.quantity} WHERE product_id = ${item.product_id}`;
        }

        await sql`DELETE FROM carts WHERE user_email = ${email}`;

        await sendNotification(email, `Your order #${newOrderId.substring(0, 8)} has been placed successfully.`, sql);

        res.status(200).json({ 'success': 'Order placed successfully.' });
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ 'alert': 'An error occurred while placing the order.' });
    }
};

/**
 * Gets a user's order history.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const getOrderHistory = async (req, res) => {
    let { email } = req.body;
    try {
        const orders = await sql`
            SELECT order_id, total_cost, address, delivery_status, order_date
            FROM orders
            WHERE user_email = ${email}
            ORDER BY order_date DESC
        `;

        let orderHistory = [];
        for (const order of orders) {
            const products = await sql`
                SELECT op.product_id, p.product_name, op.quantity
                FROM order_products op
                JOIN products p ON op.product_id = p.product_id
                WHERE op.order_id = ${order.order_id}
            `;
            orderHistory.push({
                orderId: order.order_id,
                totalCost: order.total_cost,
                address: order.address,
                deliveryStatus: order.delivery_status,
                orderDate: order.order_date,
                products
            });
        }
        res.status(200).json(orderHistory);
    } catch (error) {
        console.error("Error fetching order history:", error);
        res.status(500).json({ 'alert': 'An error occurred while fetching order history.' });
    }
};

/**
 * Gets notifications for a user.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const getNotifications = async (req, res) => {
    let { email } = req.body;
    try {
        const notifications = await sql`
            SELECT notification_text FROM notifications
            WHERE user_email = ${email}
            ORDER BY notification_date DESC
        `;
        res.status(200).json(notifications.map(n => n.notification_text));
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ 'alert': 'An error occurred while fetching notifications.' });
    }
};

