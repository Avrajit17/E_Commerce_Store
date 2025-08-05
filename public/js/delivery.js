// Firebase configuration and initialization
// This assumes firebase.js is loaded and initialized.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Global variables for user and UI state
let userId = null;
let isAuthReady = false;

// A helper function to display a custom alert message on the dashboard
function showAlert(message, type = 'success') {
    const alertBox = document.getElementById('deliveryAlert');
    if (alertBox) {
        alertBox.textContent = message;
        alertBox.className = type === 'success' ? 'success-message' : 'error-message';
        alertBox.style.display = 'block';
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    }
}

// Event listener for authentication state changes
onAuthStateChanged(auth, async (user) => {
    isAuthReady = true;
    if (user) {
        userId = user.uid;
        // Check if the user is a delivery person
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();

        if (userData && userData.role === 'delivery') {
            console.log("Delivery person authenticated successfully.");
            loadDeliveryOrders();
        } else {
            console.warn("User is not a delivery person, redirecting to homepage.");
            window.location.href = 'index.html';
        }
    } else {
        userId = null;
        console.log("No user is logged in, redirecting to login page.");
        window.location.href = 'login.html?type=delivery';
    }
});

// Function to load and display orders for delivery
async function loadDeliveryOrders() {
    const ordersContainer = document.getElementById('deliveryOrdersContainer');
    const noOrdersMessage = document.getElementById('noDeliveryOrdersMessage');

    if (!ordersContainer || !noOrdersMessage || !isAuthReady) return;

    ordersContainer.innerHTML = '';
    noOrdersMessage.style.display = 'none';

    try {
        const ordersCol = collection(db, 'orders');
        // Query for orders that are 'Processing' or 'Shipped'
        const q = query(ordersCol, where("status", "in", ["Processing", "Shipped"]));

        // Use onSnapshot to listen for real-time updates
        onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                noOrdersMessage.style.display = 'block';
                ordersContainer.innerHTML = '';
                return;
            }

            ordersContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const order = { id: doc.id, ...doc.data() };
                const orderHtml = createDeliveryOrderHtml(order);
                ordersContainer.innerHTML += orderHtml;
            });
        });
    } catch (e) {
        console.error("Error loading delivery orders: ", e);
        showAlert('Failed to load orders.', 'error');
    }
}

// Helper function to create the HTML for a delivery order
function createDeliveryOrderHtml(order) {
    const totalItems = Object.values(order.items).reduce((sum, item) => sum + item.quantity, 0);
    const orderDate = order.orderDate.toDate ? order.orderDate.toDate().toLocaleDateString() : 'N/A';
    
    let itemsHtml = '';
    for (const productId in order.items) {
        const item = order.items[productId];
        itemsHtml += `
            <div class="order-item">
                <img src="${item.product.imageUrl || 'https://placehold.co/50x50/e0e0e0/333?text=Image'}" alt="${item.product.name}" class="order-item-image">
                <p>${item.product.name} x ${item.quantity}</p>
            </div>
        `;
    }

    return `
        <div class="order-card fade-in">
            <div class="order-header">
                <div class="order-id">Order ID: <span>${order.id}</span></div>
                <div class="order-status status-${order.status.toLowerCase()}">${order.status}</div>
            </div>
            <div class="order-details">
                <p>Order Date: ${orderDate}</p>
                <p>Customer ID: ${order.userId}</p>
                <p>Total Items: ${totalItems}</p>
                <p>Shipping Address: ${order.shippingAddress.street}, ${order.shippingAddress.city}</p>
            </div>
            <div class="order-items-list">
                ${itemsHtml}
            </div>
            <div class="order-actions">
                <button class="btn btn-primary" onclick="markAsDelivered('${order.id}')">
                    <i class="fas fa-check-circle"></i> Mark as Delivered
                </button>
            </div>
        </div>
    `;
}

// Function to mark an order as 'Delivered'
async function markAsDelivered(orderId) {
    // Implement a custom modal for confirmation
    if (confirm('Are you sure you want to mark this order as delivered?')) {
        try {
            await updateDoc(doc(db, 'orders', orderId), {
                status: 'Delivered',
                deliveryDate: new Date(),
                deliveryPersonId: userId
            });
            showAlert('Order marked as Delivered successfully!', 'success');
        } catch (e) {
            console.error("Error marking order as delivered: ", e);
            showAlert('Failed to update order status.', 'error');
        }
    }
}
