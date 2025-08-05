// Firebase configuration and initialization
// This assumes firebase.js is loaded and initialized via a script tag.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// A helper function to display a custom alert message
function showAlert(message, type = 'success') {
    const alertBox = document.getElementById('alertBox');
    if (alertBox) {
        alertBox.textContent = message;
        alertBox.className = type === 'success' ? 'success-message' : 'error-message';
        alertBox.style.display = 'block';
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    } else {
        console.warn('Alert box element not found. Message:', message);
    }
}

/**
 * Handles user login with email and password.
 * @param {string} email The user's email.
 * @param {string} password The user's password.
 */
async function loginUser(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // On successful login, Firebase's onAuthStateChanged listener will handle redirection.
        showAlert('Login successful!', 'success');
        console.log('User logged in successfully.');
    } catch (error) {
        console.error("Error during login:", error.code, error.message);
        let errorMessage = 'Login failed. Please check your credentials.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'Invalid email or password.';
        }
        showAlert(errorMessage, 'error');
    }
}

/**
 * Handles user registration with email and password.
 * This function also creates a user document in Firestore.
 * @param {string} email The user's email.
 * @param {string} password The user's password.
 * @param {string} name The user's name.
 * @param {string} phone The user's phone number.
 */
async function registerUser(email, password, name, phone) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create a user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            name: name,
            email: email,
            phone: phone,
            role: 'customer', // Assign a default role
            createdAt: new Date(),
        });

        showAlert('Registration successful! You are now logged in.', 'success');
        // Redirection is handled by the onAuthStateChanged listener.
        console.log('User registered and profile created.');
    } catch (error) {
        console.error("Error during registration:", error.code, error.message);
        let errorMessage = 'Registration failed.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email address is already in use.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password should be at least 6 characters.';
        }
        showAlert(errorMessage, 'error');
    }
}

/**
 * Logs out the currently authenticated user.
 */
async function logoutUser() {
    try {
        await signOut(auth);
        showAlert('Logged out successfully!', 'success');
        // Redirect to the homepage after logout
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Error during logout:", error.message);
        showAlert('Failed to log out. Please try again.', 'error');
    }
}

/**
 * Checks the user's authentication status and redirects them if they are already logged in
 * on pages like login or register.
 */
function checkAuthStatus() {
    onAuthStateChanged(auth, (user) => {
        // If user is logged in and is on a login/register page, redirect to the homepage
        if (user && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) {
            window.location.href = 'index.html';
        }
        
        // If user is not logged in and is on a page that requires authentication (e.g., profile, checkout)
        // redirect them to the login page.
        if (!user && (window.location.pathname.includes('profile.html') || window.location.pathname.includes('checkout.html'))) {
            window.location.href = 'login.html';
        }
    });
}
