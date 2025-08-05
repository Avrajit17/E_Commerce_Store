// Firebase configuration and initialization
// This assumes firebase.js is loaded and initialized.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Global variables for user and UI state
let userId = null;
let isAuthReady = false;
let currentProductToEdit = null;

// A helper function to display a custom alert message on the dashboard
function showAlert(message, type = 'success') {
    const alertBox = document.getElementById('productAlert');
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
            if (tabName === 'manageProducts') {
                loadSellerProducts();
            } else if (tabName === 'sellerOrders') {
                loadSellerOrders();
            }
        });
    });
}

// Event listener for authentication state changes
onAuthStateChanged(auth, async (user) => {
    isAuthReady = true;
    if (user) {
        userId = user.uid;
        // Check if the user is a seller
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();

        if (userData && userData.role === 'seller') {
            console.log("Seller authenticated successfully.");
            // Set up event listeners for product form
            const productForm = document.getElementById('productForm');
            if (productForm) {
                productForm.addEventListener('submit', handleProductFormSubmit);
                document.getElementById('actualPrice').addEventListener('input', updateSellingPrice);
                document.getElementById('discountRate').addEventListener('input', updateSellingPrice);
            }
        } else {
            console.warn("User is not a seller, redirecting to homepage.");
            window.location.href = 'index.html';
        }
    } else {
        userId = null;
        console.log("No user is logged in, redirecting to login page.");
        window.location.href = 'login.html?type=seller';
    }
});

// Function to update the selling price based on actual price and discount rate
function updateSellingPrice() {
    const actualPrice = parseFloat(document.getElementById('actualPrice').value) || 0;
    const discountRate = parseFloat(document.getElementById('discountRate').value) || 0;
    const sellingPrice = actualPrice * (1 - discountRate / 100);
    document.getElementById('sellingPrice').value = sellingPrice.toFixed(2);
}

// Function to handle the product form submission
async function handleProductFormSubmit(e) {
    e.preventDefault();
    if (!userId) {
        showAlert('You must be logged in to add a product.', 'error');
        return;
    }

    const form = e.target;
    const productId = form.productId.value;
    
    // Get form data
    const productData = {
        name: form.productName.value,
        shortDescription: form.shortDes.value,
        longDescription: form.longDes.value,
        tags: form.productTags.value.split(',').map(tag => tag.trim()),
        actualPrice: parseFloat(form.actualPrice.value),
        discountRate: parseFloat(form.discountRate.value),
        sellingPrice: parseFloat(form.sellingPrice.value),
        stock: parseInt(form.stock.value),
        sellerId: userId,
        createdAt: new Date()
    };

    // Placeholder for image handling (actual image upload logic is not included)
    // For now, we will use a placeholder image URL
    productData.imageUrl = 'https://placehold.co/400x300/e0e0e0/333?text=Product+Image';
    
    try {
        if (productId) {
            // Update an existing product
            await updateDoc(doc(db, 'products', productId), productData);
            showAlert('Product updated successfully!', 'success');
        } else {
            // Add a new product
            await addDoc(collection(db, 'products'), productData);
            showAlert('Product added successfully!', 'success');
        }
        form.reset();
        document.getElementById('productId').value = '';
    } catch (e) {
        console.error("Error saving product: ", e);
        showAlert('Failed to save product. Please try again.', 'error');
    }
}

// Function to load and display the seller's products
async function loadSellerProducts() {
    const productsContainer = document.getElementById('myProductsContainer');
    const noProductsMessage = document.getElementById('noSellerProductsMessage');

    if (!productsContainer || !noProductsMessage || !userId) return;

    productsContainer.innerHTML = '';
    noProductsMessage.style.display = 'none';

    try {
        const productsCol = collection(db, 'products');
        const q = query(productsCol, where("sellerId", "==", userId));
        const productsSnapshot = await getDocs(q);

        if (productsSnapshot.empty) {
            noProductsMessage.style.display = 'block';
            return;
        }

        productsSnapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            const productCard = createSellerProductCard(product);
            productsContainer.appendChild(productCard);
        });
    } catch (e) {
        console.error("Error loading seller products: ", e);
        showAlert('Failed to load your products.', 'error');
    }
}

// Helper function to create a product card for the seller dashboard
function createSellerProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card fade-in';
    card.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.shortDescription}</p>
            <div class="product-price">
                <span class="selling-price">$${product.sellingPrice.toFixed(2)}</span>
            </div>
            <div class="product-actions">
                <button class="btn btn-secondary btn-sm" onclick="editProduct('${product.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        </div>
    `;
    return card;
}

// Function to populate the form for editing a product
async function editProduct(productId) {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
        const product = productSnap.data();
        document.getElementById('productId').value = productId;
        document.getElementById('productName').value = product.name;
        document.getElementById('shortDes').value = product.shortDescription;
        document.getElementById('longDes').value = product.longDescription;
        document.getElementById('productTags').value = product.tags.join(', ');
        document.getElementById('actualPrice').value = product.actualPrice;
        document.getElementById('discountRate').value = product.discountRate;
        document.getElementById('sellingPrice').value = product.sellingPrice;
        document.getElementById('stock').value = product.stock;

        // Switch to the 'Add Product' tab
        document.querySelector('[data-tab="addProduct"]').click();
        showAlert('Product data loaded for editing.', 'info');
    } else {
        showAlert('Product not found.', 'error');
    }
}

// Function to delete a product
async function deleteProduct(productId) {
    // Implement a custom modal for confirmation instead of alert()
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await deleteDoc(doc(db, 'products', productId));
            showAlert('Product deleted successfully!', 'success');
            loadSellerProducts(); // Reload the product list
        } catch (e) {
            console.error("Error deleting product: ", e);
            showAlert('Failed to delete product.', 'error');
        }
    }
}

// Function to load and display orders for the seller's products
async function loadSellerOrders() {
    const ordersContainer = document.getElementById('sellerOrdersContainer');
    const noOrdersMessage = document.getElementById('noSellerOrdersMessage');

    if (!ordersContainer || !noOrdersMessage || !userId) return;

    ordersContainer.innerHTML = '';
    noOrdersMessage.style.display = 'none';

    try {
        const ordersCol = collection(db, 'orders');
        const q = query(ordersCol, where("status", "!=", "Delivered")); // Example query: show pending/shipped orders

        onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                noOrdersMessage.style.display = 'block';
                ordersContainer.innerHTML = '';
                return;
            }

            ordersContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const order = { id: doc.id, ...doc.data() };
                
                // Filter orders to only show items from this seller
                const sellerItems = Object.values(order.items).filter(item => item.product.sellerId === userId);
                
                if (sellerItems.length > 0) {
                    const orderHtml = createSellerOrderHtml(order, sellerItems);
                    ordersContainer.innerHTML += orderHtml;
                }
            });

            if (ordersContainer.innerHTML === '') {
                noOrdersMessage.style.display = 'block';
            } else {
                noOrdersMessage.style.display = 'none';
            }
        });
    } catch (e) {
        console.error("Error loading seller orders: ", e);
        showAlert('Failed to load orders.', 'error');
    }
}

// Helper function to create the HTML for a seller's order
function createSellerOrderHtml(order, sellerItems) {
    const totalItems = sellerItems.reduce((sum, item) => sum + item.quantity, 0);
    let itemsHtml = '';
    sellerItems.forEach(item => {
        itemsHtml += `
            <div class="order-item">
                <img src="${item.product.imageUrl || 'https://placehold.co/50x50/e0e0e0/333?text=Image'}" alt="${item.product.name}" class="order-item-image">
                <p>${item.product.name} x ${item.quantity}</p>
            </div>
        `;
    });
    
    const orderDate = order.orderDate.toDate ? order.orderDate.toDate().toLocaleDateString() : 'N/A';
    
    return `
        <div class="order-card fade-in">
            <div class="order-header">
                <div class="order-id">Order ID: <span>${order.id}</span></div>
                <div class="order-status status-${order.status.toLowerCase()}">${order.status}</div>
            </div>
            <div class="order-details">
                <p>Order Date: ${orderDate}</p>
                <p>Total Items: ${totalItems}</p>
                <p>Shipping Address: ${order.shippingAddress.street}, ${order.shippingAddress.city}</p>
            </div>
            <div class="order-items-list">
                ${itemsHtml}
            </div>
            <div class="order-actions">
                <button class="btn btn-primary btn-sm">Mark as Shipped</button>
            </div>
        </div>
    `;
}
