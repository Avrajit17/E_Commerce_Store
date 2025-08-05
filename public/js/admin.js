// Firebase configuration and initialization
// This assumes firebase.js is loaded and initialized.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, doc, getDocs, onSnapshot, query, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
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
    const alertBox = document.getElementById('adminAlert');
    if (alertBox) {
        alertBox.textContent = message;
        alertBox.className = type === 'success' ? 'success-message' : 'error-message';
        alertBox.style.display = 'block';
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    }
}

// Function to handle tab switching on the dashboard
function setupDashboardTabs() {
    const tabButtons = document.querySelectorAll('.dashboard-nav-btn');
    const tabContents = document.querySelectorAll('.dashboard-tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Deactivate all buttons and hide all contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activate clicked button and show corresponding content
            button.classList.add('active');
            document.getElementById(tabName).classList.add('active');

            // Load content dynamically when a tab is clicked
            if (tabName === 'manageUsers') {
                loadAllUsers();
            } else if (tabName === 'manageOrders') {
                loadAllOrders();
            }
        });
    });
}

// Event listener for authentication state changes
onAuthStateChanged(auth, async (user) => {
    isAuthReady = true;
    if (user) {
        userId = user.uid;
        // Check if the user is an admin
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDocs(userDocRef);
        const userData = userDocSnap.data();

        if (userData && userData.role === 'admin') {
            console.log("Admin authenticated successfully.");
            // Initial load of the dashboard content
            loadAllUsers();
        } else {
            console.warn("User is not an admin, redirecting to homepage.");
            window.location.href = 'index.html';
        }
    } else {
        userId = null;
        console.log("No user is logged in, redirecting to login page.");
        window.location.href = 'login.html?type=admin';
    }
});

// Function to load and display all users
async function loadAllUsers() {
    const usersContainer = document.getElementById('usersContainer');
    const noUsersMessage = document.getElementById('noUsersMessage');

    if (!usersContainer || !noUsersMessage) return;
    
    usersContainer.innerHTML = '';
    noUsersMessage.style.display = 'none';

    try {
        const usersCol = collection(db, 'users');
        onSnapshot(usersCol, (snapshot) => {
            if (snapshot.empty) {
                noUsersMessage.style.display = 'block';
                usersContainer.innerHTML = '';
                return;
            }

            usersContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const user = { id: doc.id, ...doc.data() };
                const userCard = createUserCard(user);
                usersContainer.appendChild(userCard);
            });
        });
    } catch (e) {
        console.error("Error loading users: ", e);
        showAlert('Failed to load users.', 'error');
    }
}

// Helper function to create a user card for the admin dashboard
function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card fade-in';
    card.innerHTML = `
        <div class="user-info">
            <h4 class="user-name">${user.name || 'N/A'}</h4>
            <p class="user-email">${user.email || 'N/A'}</p>
            <p class="user-id">ID: ${user.id}</p>
        </div>
        <div class="user-actions">
            <select class="user-role-select" data-user-id="${user.id}">
                <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Customer</option>
                <option value="seller" ${user.role === 'seller' ? 'selected' : ''}>Seller</option>
                <option value="delivery" ${user.role === 'delivery' ? 'selected' : ''}>Delivery</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
            <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.id}')">
                <i class="fas fa-trash-alt"></i> Delete
            </button>
        </div>
    `;

    // Add event listener to role change
    card.querySelector('.user-role-select').addEventListener('change', (e) => {
        updateUserRole(user.id, e.target.value);
    });

    return card;
}

// Function to update a user's role
async function updateUserRole(userIdToUpdate, newRole) {
    if (userIdToUpdate === userId) {
        showAlert('You cannot change your own role.', 'error');
        return;
    }
    
    try {
        await updateDoc(doc(db, 'users', userIdToUpdate), {
            role: newRole
        });
        showAlert(`User role updated to ${newRole} successfully!`, 'success');
    } catch (e) {
        console.error("Error updating user role: ", e);
        showAlert('Failed to update user role.', 'error');
    }
}

// Function to delete a user
async function deleteUser(userIdToDelete) {
    if (userIdToDelete === userId) {
        showAlert('You cannot delete your own account.', 'error');
        return;
    }

    // Implement a custom modal for confirmation
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            await deleteDoc(doc(db, 'users', userIdToDelete));
            showAlert('User deleted successfully!', 'success');
        } catch (e) {
            console.error("Error deleting user: ", e);
            showAlert('Failed to delete user.', 'error');
        }
    }
}

// Function to load and display all orders
async function loadAllOrders() {
    const ordersContainer = document.getElementById('allOrdersContainer');
    const noOrdersMessage = document.getElementById('noAllOrdersMessage');

    if (!ordersContainer || !noOrdersMessage) return;

    ordersContainer.innerHTML = '';
    noOrdersMessage.style.display = 'none';

    try {
        const ordersCol = collection(db, 'orders');
        onSnapshot(ordersCol, (snapshot) => {
            if (snapshot.empty) {
                noOrdersMessage.style.display = 'block';
                ordersContainer.innerHTML = '';
                return;
            }

            ordersContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const order = { id: doc.id, ...doc.data() };
                const orderHtml = createAdminOrderHtml(order);
                ordersContainer.innerHTML += orderHtml;
            });
        });
    } catch (e) {
        console.error("Error loading all orders: ", e);
        showAlert('Failed to load orders.', 'error');
    }
}

// Helper function to create the HTML for an admin's order view
function createAdminOrderHtml(order) {
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
                <select class="order-status-select" data-order-id="${order.id}">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
                <button class="btn btn-danger btn-sm" onclick="deleteOrder('${order.id}')">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        </div>
    `;
}

// Function to update an order's status
async function updateOrderStatus(orderId, newStatus) {
    try {
        await updateDoc(doc(db, 'orders', orderId), {
            status: newStatus
        });
        showAlert(`Order status updated to ${newStatus} successfully!`, 'success');
    } catch (e) {
        console.error("Error updating order status: ", e);
        showAlert('Failed to update order status.', 'error');
    }
}

// Function to delete an order
async function deleteOrder(orderId) {
    // Implement a custom modal for confirmation
    if (confirm('Are you sure you want to delete this order?')) {
        try {
            await deleteDoc(doc(db, 'orders', orderId));
            showAlert('Order deleted successfully!', 'success');
        } catch (e) {
            console.error("Error deleting order: ", e);
            showAlert('Failed to delete order.', 'error');
        }
    }
}
