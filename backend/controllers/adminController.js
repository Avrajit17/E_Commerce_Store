import { sql } from "../config/db.js";
import bcrypt from "bcryptjs";
import { sendNotification } from "./notificationController.js";

/**
 * Gets dashboard statistics for the admin panel.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const getAdminDashboardStats = async (req, res) => {
    try {
        const newOrders = await sql`
            SELECT COUNT(*) FROM orders WHERE delivery_status = 'not assigned'
        `;
        const customerCount = await sql`
            SELECT COUNT(*) FROM users
        `;
        const productCount = await sql`
            SELECT COUNT(*) FROM products
        `;
        const sellerCount = await sql`
            SELECT COUNT(*) FROM sellers
        `;

        res.status(200).json({
            newOrders: newOrders[0].count,
            customerCount: customerCount[0].count,
            productCount: productCount[0].count,
            sellerCount: sellerCount[0].count
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ 'alert': 'An error occurred while fetching dashboard stats.' });
    }
};

/**
 * list of all customers.----quite important
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const getCustomers = async (req, res) => {
    try {
        const users = await sql`
            SELECT name, email, phone_number, is_seller FROM users
        `;
        const customers = [];
        for (const user of users) {
            const orders = await sql`
                SELECT total_cost FROM orders WHERE user_email = ${user.email}
            `;
            const totalOrders = orders.length;
            const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_cost), 0);
            customers.push({
                name: user.name,
                email: user.email,
                phone: user.phone_number,
                isSeller: user.is_seller,
                totalOrders,
                totalSpent
            });
        }
        res.status(200).json(customers);
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ 'alert': 'An error occurred while fetching customer data.' });
    }
};

/**
 * Gets a list of all sellers.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const getSellers = async (req, res) => {
    try {
        const sellers = await sql`
            SELECT s.business_name, s.address, s.phone_number, s.email
            FROM sellers s
        `;
        const sellerData = [];
        for (const seller of sellers) {
            const products = await sql`
                SELECT selling_price FROM products WHERE seller_email = ${seller.email}
            `;
            const totalProducts = products.length;
            const totalPrice = products.reduce((sum, product) => sum + Number(product.selling_price), 0);
            sellerData.push({
                name: seller.business_name,
                email: seller.email,
                phone: seller.phone_number,
                address: seller.address,
                totalProducts,
                totalPrice
            });
        }
        res.status(200).json(sellerData);
    } catch (error) {
        console.error("Error fetching sellers:", error);
        res.status(500).json({ 'alert': 'An error occurred while fetching seller data.' });
    }
};

/**
 * all unassigned orders.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const getUnassignedOrders = async (req, res) => {
    try {
        const orders = await sql`
            SELECT * FROM orders WHERE delivery_status = 'not assigned'
        `;
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching unassigned orders:", error);
        res.status(500).json({ 'alert': 'An error occurred while fetching orders.' });
    }
};

/**
 * Assigns an order to a delivery person.
 */
export const assignOrderToDelivery = async (req, res) => {
    let { orderId, deliveryEmail } = req.body;
    try {
        await sql`
            INSERT INTO delivery_orders (delivery_email, order_id) VALUES (${deliveryEmail}, ${orderId})
        `;
        await sql`
            UPDATE orders SET delivery_status = 'assigned' WHERE order_id = ${orderId}
        `;
        res.status(200).json('success');
    } catch (error) {
        console.error("Error assigning order:", error);
        res.status(500).json({ 'alert': 'An error occurred while assigning the order.' });
    }
};

/**
 * Cancels a user order.
 */
export const cancelOrder = async (req, res) => {
    let { orderId, email } = req.body;
    try {
        // Find products in the cancelled order to restore stock
        const productsInOrder = await sql`
            SELECT product_id, quantity FROM order_products WHERE order_id = ${orderId}
        `;

        // Restore stock for each product
        for (const product of productsInOrder) {
            await sql`
                UPDATE products SET stock = stock + ${product.quantity} WHERE product_id = ${product.product_id}
            `;
        }

        // Clean up all related order data
        await sql`
            DELETE FROM delivery_orders WHERE order_id = ${orderId}
        `;
        await sql`
            DELETE FROM order_products WHERE order_id = ${orderId}
        `;
        await sql`
            DELETE FROM orders WHERE order_id = ${orderId}
        `;

        await sendNotification(email, `Your order #${orderId.substring(0, 8)} has been cancelled by the admin.`, sql);

        res.status(200).json('success');
    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ 'alert': 'An error occurred while cancelling the order.' });
    }
};

/**
 * Adds a new admin account.
 */
export const addAdmin = async (req, res) => {
    let { name, address, email, phone, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await sql`
            INSERT INTO admins (name, email, password, address, phone_number)
            VALUES (${name}, ${email}, ${hashedPassword}, ${address}, ${phone})
        `;
        res.status(201).json('success');
    } catch (error) {
        console.error("Error adding admin:", error);
        res.status(500).json({ 'alert': 'An error occurred while adding a new admin.' });
    }
};

/**
 * Adds a new delivery person account.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const addDelivery = async (req, res) => {
    let { name, email, phone, password, area } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await sql`
            INSERT INTO delivery_systems (name, email, password, phone_number, area)
            VALUES (${name}, ${email}, ${hashedPassword}, ${phone}, ${area})
        `;
        res.status(201).json('success');
    } catch (error) {
        console.error("Error adding delivery person:", error);
        res.status(500).json({ 'alert': 'An error occurred while adding a new delivery person.' });
    }
};

/**
 * Gets a list of all delivery systems.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const getDeliverySystems = async (req, res) => {
    try {
        const deliverySystems = await sql`
            SELECT name, email, phone_number, area FROM delivery_systems
        `;
        res.status(200).json(deliverySystems);
    } catch (error) {
        console.error("Error fetching delivery systems:", error);
        res.status(500).json({ 'alert': 'An error occurred while fetching delivery systems.' });
    }
};

/**
 * Deletes a delivery person and their assigned orders..
 */
export const deleteDelivery = async (req, res) => {
    let { email } = req.body;
    try {
        // Re-assign orders to 'not assigned' before deleting the delivery person
        await sql`
            UPDATE orders o
            SET delivery_status = 'not assigned'
            WHERE o.order_id IN (
                SELECT order_id FROM delivery_orders WHERE delivery_email = ${email}
            ) AND o.delivery_status = 'assigned'
        `;

        await sql`
            DELETE FROM delivery_orders WHERE delivery_email = ${email}
        `;
        await sql`
            DELETE FROM delivery_systems WHERE email = ${email}
        `;

        res.status(200).json('success');
    } catch (error) {
        console.error("Error deleting delivery person:", error);
        res.status(500).json({ 'alert': 'An error occurred while deleting the delivery person.' });
    }
};

