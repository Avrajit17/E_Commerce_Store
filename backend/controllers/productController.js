import { sql } from "../config/db.js";
import path from 'path';
import { sendNotification } from "./notificationController.js";

const __dirname = path.resolve();
const staticPath = path.join(__dirname, 'public');

/**
 * Handles product image uploads.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const uploadImage = (req, res) => {
    try {
        let file = req.files.image;
        let date = new Date();
        // Generate a unique image name
        let imageName = date.getTime() + file.name;
        // Define the image upload path
        let uploadPath = path.join(staticPath, 'uploads', imageName);

        // Move the file to the upload directory
        file.mv(uploadPath, (err) => {
            if (err) {
                console.error("File upload error:", err);
                return res.status(500).json({ 'alert': 'Failed to upload image.' });
            }
            res.status(200).json(`/uploads/${imageName}`);
        });
    } catch (error) {
        console.error("Error during image upload:", error);
        res.status(500).json({ 'alert': 'An error occurred during image upload.' });
    }
};

/**
 * Adds or updates a product..
 */
export const addProduct = async (req, res) => {
    let { name, shortDes, des, images, actualPrice, discount, sellPrice, stock, tags, tac, email, productId } = req.body;

    // Validation
    if (!name.length) {
        return res.status(400).json({ 'alert': 'Enter product name' });
    } else if (shortDes.length > 100 || shortDes.length < 10) {
        return res.status(400).json({ 'alert': 'Short description must be between 10 to 100 letters long' });
    } else if (!des.length) {
        return res.status(400).json({ 'alert': 'Enter a detailed description about the product' });
    } else if (!images || images.length === 0) {
        return res.status(400).json({ 'alert': 'Upload at least one product image' });
    } else if (!actualPrice || !discount || !sellPrice) {
        return res.status(400).json({ 'alert': 'You have to add pricings' });
    } else if (stock < 20) {
        return res.status(400).json({ 'alert': 'You should have at least 20 items in stock' });
    } else if (!tags.length) {
        return res.status(400).json({ 'alert': 'Enter a few tags to help with search results' });
    } else if (!tac) {
        return res.status(400).json({ 'alert': 'You must agree to our terms and conditions' });
    }

    const lowerCaseTags = tags.toLowerCase();

    try {
        if (productId) {
            // Update existing product
            await sql`
                UPDATE products
                SET name = ${name}, short_des = ${shortDes}, long_des = ${des},
                    actual_price = ${actualPrice}, discount = ${discount},
                    selling_price = ${sellPrice}, stock = ${stock}, tags = ${lowerCaseTags}
                WHERE product_id = ${productId}
            `;

            // Delete old images and insert new ones
            await sql`DELETE FROM product_images WHERE product_id = ${productId}`;
            for (const image of images) {
                await sql`
                    INSERT INTO product_images (image_url, product_id)
                    VALUES (${image}, ${productId})
                `;
            }
            res.status(200).json({ 'product': name, message: 'Product updated successfully.' });
        } else {
            // Add new product
            const newProductId = `${name.toLowerCase().replace(/\s/g, '-')}-${Math.floor(Math.random() * 5000)}`;

            await sql`
                INSERT INTO products (product_id, name, short_des, long_des, actual_price, discount,
                                      selling_price, stock, tags, seller_email)
                VALUES (${newProductId}, ${name}, ${shortDes}, ${des}, ${actualPrice}, ${discount},
                        ${sellPrice}, ${stock}, ${lowerCaseTags}, ${email})
            `;

            for (const image of images) {
                await sql`
                    INSERT INTO product_images (image_url, product_id)
                    VALUES (${image}, ${newProductId})
                `;
            }
            res.status(201).json({ 'product': name, message: 'Product added successfully.' });
        }
    } catch (error) {
        console.error("Error adding/updating product:", error);
        res.status(500).json({ 'alert': 'An error occurred while saving the product.' });
    }
};

/**
 * Gets product(s) based on query parameters.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const getProducts = async (req, res) => {
    let { email, productId, tags, manageProducts } = req.body;
    let products = [];
    let result;

    try {
        if (productId) {
            result = await sql`
                SELECT p.*, ARRAY_AGG(pi.image_url) as images
                FROM products p
                LEFT JOIN product_images pi ON p.product_id = pi.product_id
                WHERE p.product_id = ${productId}
                GROUP BY p.product_id
            `;
        } else if (email) {
            result = await sql`
                SELECT p.*, ARRAY_AGG(pi.image_url) as images
                FROM products p
                LEFT JOIN product_images pi ON p.product_id = pi.product_id
                WHERE p.seller_email = ${email}
                GROUP BY p.product_id
            `;
        } else if (tags) {
            const tagArray = tags.split(',').map(tag => `%${tag.trim().toLowerCase()}%`);
            const placeholders = tagArray.map((_, i) => `$${i + 1}`).join(' OR p.tags ILIKE ');
            result = await sql`
                SELECT p.*, ARRAY_AGG(pi.image_url) as images
                FROM products p
                LEFT JOIN product_images pi ON p.product_id = pi.product_id
                WHERE p.tags ILIKE ${sql.array(tagArray)}
                GROUP BY p.product_id
            `;
        } else if (manageProducts) {
            result = await sql`
                SELECT p.*, ARRAY_AGG(pi.image_url) as images
                FROM products p
                LEFT JOIN product_images pi ON p.product_id = pi.product_id
                GROUP BY p.product_id
            `;
        } else {
            // Get all products by default
            result = await sql`
                SELECT p.*, ARRAY_AGG(pi.image_url) as images
                FROM products p
                LEFT JOIN product_images pi ON p.product_id = pi.product_id
                GROUP BY p.product_id
                ORDER BY p.created_at DESC
            `;
        }

        if (result.length === 0) {
            return res.status(200).json('no products');
        }

        // Format the results
        products = result.map(row => ({
            productId: row.product_id,
            name: row.name,
            shortDes: row.short_des,
            des: row.long_des,
            actualPrice: row.actual_price,
            discount: row.discount,
            sellPrice: row.selling_price,
            stock: row.stock,
            tags: row.tags,
            images: row.images
        }));

        return res.status(200).json(products);
    } catch (error) {
        console.error("Error getting products:", error);
        res.status(500).json({ 'alert': 'An error occurred while fetching products.' });
    }
};

/**
 * Deletes a product and all associated data.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const deleteProduct = async (req, res) => {
    let { productId } = req.body;
    try {
        // Delete all associated data first to avoid foreign key constraints errors
        await sql`DELETE FROM product_images WHERE product_id = ${productId}`;
        await sql`DELETE FROM carts WHERE product_id = ${productId}`;
        await sql`DELETE FROM wishlists WHERE product_id = ${productId}`;
        await sql`DELETE FROM order_products WHERE product_id = ${productId}`;
        await sql`DELETE FROM reviews WHERE product_id = ${productId}`;
        await sql`DELETE FROM products WHERE product_id = ${productId}`;

        res.status(200).json('success');
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ 'alert': 'An error occurred while deleting the product.' });
    }
};

/**
 * Gets all reviews for a product.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const getReviews = async (req, res) => {
    let { productId } = req.body;
    try {
        const reviews = await sql`
            SELECT u.name, r.review_text, r.rating
            FROM reviews r
            JOIN users u ON r.user_email = u.email
            WHERE r.product_id = ${productId}
            ORDER BY r.review_date DESC
        `;
        res.status(200).json(reviews);
    } catch (error) {
        console.error("Error getting reviews:", error);
        res.status(500).json({ 'alert': 'An error occurred while fetching reviews.' });
    }
};

/**
 * Adds a new review for a product.
 */
export const addReview = async (req, res) => {
    let { productId, email, star, reviewText } = req.body;
    try {
        // Check if the user has purchased the product and it has been delivered
        const deliveredOrders = await sql`
            SELECT op.order_id
            FROM order_products op
            JOIN orders o ON o.order_id = op.order_id
            WHERE op.product_id = ${productId}
            AND o.user_email = ${email}
            AND o.delivery_status = 'delivered'
        `;

        if (deliveredOrders.length === 0) {
            return res.status(403).json({ 'alert': 'You must purchase and receive the product to leave a review.' });
        }

        // new review
        await sql`
            INSERT INTO reviews (user_email, product_id, rating, review_text)
            VALUES (${email}, ${productId}, ${star}, ${reviewText})
        `;
        res.status(201).json({ 'success': 'Review added successfully.' });
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ 'alert': 'An error occurred while adding the review.' });
    }
};
