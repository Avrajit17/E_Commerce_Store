import { sql } from "../config/db.js";
import bcrypt from "bcryptjs";

// Signup for new users (customers/sellers)-------for my authentication system
export const signup = async (req, res) => {
    let { name, email, password, number, tac, seller } = req.body;

    
    if (name.length < 3) {
        return res.status(400).json({ 'alert': 'Name must be 3 letters long' });
    } else if (!email.length) {
        return res.status(400).json({ 'alert': 'Enter your email' });
    } else if (password.length < 8) {
        return res.status(400).json({ 'alert': 'Password should be at least 8 characters long' });
    } else if (!Number(number) || number.length < 10) {
        return res.status(400).json({ 'alert': 'Invalid number, please enter a valid one' });
    } else if (!tac) {
        return res.status(400).json({ 'alert': 'You must agree to our terms and conditions' });
    }

    try {
       
        const existingUser = await sql`SELECT email FROM users WHERE email = ${email}`;
        if (existingUser.length > 0) {
            return res.status(409).json({ 'alert': 'Email already exists' });
        }

        // Hashing the password 
        const hashedPassword = await bcrypt.hash(password, 10);
        const isSeller = (seller === 'true');

        // Insert new user into my database
        await sql`
            INSERT INTO users (name, email, password, phone_number, is_seller) 
            VALUES (${name}, ${email}, ${hashedPassword}, ${number}, ${isSeller})
        `;

        res.status(201).json({
            name,
            email,
            isSeller
        });
    } catch (error) {
        console.error("Error during user signup:", error);
        res.status(500).json({ 'alert': 'An error occurred during registration.' });
    }
};

// Login for users (customers/sellers)
export const login = async (req, res) => {
    let { email, password } = req.body;

    if (!email.length || !password.length) {
        return res.status(400).json({ 'alert': 'Fill all the inputs' });
    }

    try {
        
        const users = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (users.length === 0) {
            return res.status(401).json({ 'alert': `Email doesn't exist` });
        }

        const user = users[0];

        // Comparing the provided password 
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ 'alert': 'Password is incorrect' });
        }

        res.status(200).json({
            name: user.name,
            email: user.email,
            isSeller: user.is_seller
        });

    } catch (error) {
        console.error("Error during user login:", error);
        res.status(500).json({ 'alert': 'An error occurred during login.' });
    }
};

// Application for a seller account-----good thing
export const applyForSeller = async (req, res) => {
    let { name, about, address, number, tac, legit, email } = req.body;

    if (!name.length || !address.length || !about.length || number.length < 10 || !Number(number)) {
        return res.status(400).json({ 'alert': 'Some information is invalid' });
    } else if (!tac) {
        return res.status(400).json({ 'alert': 'You have to agree to our terms and conditions' });
    } else if (!legit) {
        return res.status(400).json({ 'alert': 'You have to put legit information' });
    }

    try {
        // Update user's seller status
        await sql`
            UPDATE users SET is_seller = TRUE WHERE email = ${email}
        `;

        
        await sql`
            INSERT INTO sellers (business_name, about, address, phone_number, email) 
            VALUES (${name}, ${about}, ${address}, ${number}, ${email})
        `;

        return res.status(200).json({ success: true, message: "Seller account application successful." });
    } catch (error) {
        console.error("Error during seller application:", error);
        res.status(500).json({ 'alert': 'An error occurred during seller application.' });
    }
};

// Admin login part of my db project
export const adminLogin = async (req, res) => {
    let { email, password } = req.body;
    if (!email.length || !password.length) {
        return res.status(400).json({ 'alert': 'Fill all the inputs' });
    }

    try {
        const admins = await sql`SELECT * FROM admins WHERE email = ${email}`;
        if (admins.length === 0) {
            return res.status(401).json({ 'alert': `Email doesn't exist` });
        }

        const admin = admins[0];
        const isPasswordCorrect = await bcrypt.compare(password, admin.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ 'alert': 'Password is incorrect' });
        }

        res.status(200).json({
            name: admin.name,
            email: admin.email
        });
    } catch (error) {
        console.error("Error during admin login:", error);
        res.status(500).json({ 'alert': 'An error occurred during login.' });
    }
};

// Delivery system login ------
export const deliveryLogin = async (req, res) => {
    let { email, password } = req.body;
    if (!email.length || !password.length) {
        return res.status(400).json({ 'alert': 'Fill all the inputs' });
    }

    try {
        const deliveryUsers = await sql`SELECT * FROM delivery_systems WHERE email = ${email}`;
        if (deliveryUsers.length === 0) {
            return res.status(401).json({ 'alert': `Email doesn't exist` });
        }

        const deliveryUser = deliveryUsers[0];
        const isPasswordCorrect = await bcrypt.compare(password, deliveryUser.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ 'alert': 'Password is incorrect' });
        }

        res.status(200).json({
            name: deliveryUser.name,
            email: deliveryUser.email
        });
    } catch (error) {
        console.error("Error during delivery login:", error);
        res.status(500).json({ 'alert': 'An error occurred during login.' });
    }
};
