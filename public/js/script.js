// Firebase configuration and initialization
// This assumes firebase.js is loaded and initialized, and a user is authenticated.
// The __app_id and __firebase_config are global variables provided by the environment.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Global variables to store user and cart information
let userId = null;
let cart = {};
let isAuthReady = false;

// Authenticate user and set up real-time listener for cart
onAuthStateChanged(auth, async (user) => {
    isAuthReady = true;
    if (user) {
        userId = user.uid;
        // Fetch user data from Firestore if available
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
            console.error("User data not found for authenticated user.");
        }

        // Set up real-time listener for the user's cart
        const cartDocRef = doc(db, 'carts', userId);
        onSnapshot(cartDocRef, (docSnap) => {
            if (docSnap.exists()) {
                cart = docSnap.data().items;
                updateCartCount();
                if (window.location.pathname.includes('cart.html')) {
                    loadCartItems();
                }
                if (window.location.pathname.includes('checkout.html')) {
                    loadCheckoutPage();
                }
            } else {
                cart = {}; // Reset cart if the document doesn't exist
                updateCartCount();
            }
        });
    } else {
        userId = null;
        cart = {}; // Reset cart on logout
        updateCartCount();
    }
});

// Helper function to show a custom alert message
function showAlert(message, type = 'success') {
    const alertBox = document.getElementById('alertBox');
    if (alertBox) {
        alertBox.textContent = message;
        alertBox.className = type === 'success' ? 'success-message' : 'error-message';
        alertBox.style.display = 'block';
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    }
}

// Function to update the cart count in the navigation bar
function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
}

// Function to handle product search
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (window.location.pathname.includes('products.html')) {
        loadAllProducts(searchTerm);
    } else {
        // Redirect to products page with search term
        window.location.href = `products.html?search=${searchTerm}`;
    }
}

// Function to load and display all products from Firestore
async function loadAllProducts(searchTerm = '') {
    const productGrid = document.getElementById('productGrid');
    const loader = document.getElementById('loader');
    const noProductsMessage = document.getElementById('noProductsMessage');
    
    if (!productGrid || !loader) return;

    productGrid.innerHTML = '';
    loader.style.display = 'block';
    noProductsMessage.style.display = 'none';

    try {
        const productsCol = collection(db, 'products');
        const productSnapshot = await getDocs(productsCol);
        
        let products = [];
        productSnapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        // Filter products if a search term is provided
        if (searchTerm) {
            products = products.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }

        if (products.length > 0) {
            products.forEach(product => {
                const productCard = createProductCard(product);
                productGrid.appendChild(productCard);
            });
        } else {
            noProductsMessage.style.display = 'block';
        }
    } catch (e) {
        console.error("Error loading products: ", e);
        showAlert('Failed to load products. Please try again later.', 'error');
    } finally {
        loader.style.display = 'none';
    }
}

// Helper function to create a product card HTML element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card fade-in';
    card.innerHTML = `
        <a href="product-detail.html?id=${product.id}">
            <img src="${product.imageUrl || 'https://placehold.co/400x300/e0e0e0/333?text=Product+Image'}" alt="${product.name}" class="product-image">
        </a>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.shortDescription}</p>
            <div class="product-price">
                <span class="selling-price">$${product.sellingPrice.toFixed(2)}</span>
                <span class="actual-price">$${product.actualPrice.toFixed(2)}</span>
                <span class="discount-rate">${product.discountRate}% off</span>
            </div>
            <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}">
                <i class="fas fa-shopping-cart"></i> Add to Cart
            </button>
        </div>
    `;

    // Add event listener for "Add to Cart" button
    card.querySelector('.add-to-cart-btn').addEventListener('click', () => {
        addToCart(product.id);
    });

    return card;
}

// Function to add a product to the cart
async function addToCart(productId) {
    if (!userId) {
        showAlert('Please log in to add items to your cart.', 'error');
        return;
    }

    if (!isAuthReady) {
        showAlert('Please wait while we set up your session.', 'info');
        return;
    }

    try {
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
            showAlert('Product not found.', 'error');
            return;
        }

        const product = { id: productSnap.id, ...productSnap.data() };
        
        // Update the cart state
        if (cart[productId]) {
            cart[productId].quantity += 1;
        } else {
            cart[productId] = {
                product,
                quantity: 1
            };
        }

        const cartDocRef = doc(db, 'carts', userId);
        await setDoc(cartDocRef, { items: cart });
        showAlert('Product added to cart!', 'success');
    } catch (e) {
        console.error("Error adding to cart: ", e);
        showAlert('Failed to add product to cart.', 'error');
    }
}

// Function to load and display a single product's detail page
async function loadProductDetail(productId) {
    const container = document.getElementById('productDetailContainer');
    if (!container) return;
    container.innerHTML = '<div class="loader-container"><div class="loader"></div><p>Loading product details...</p></div>';

    try {
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
            const product = { id: productSnap.id, ...productSnap.data() };
            container.innerHTML = createProductDetailHtml(product);
            
            // Add event listeners for cart buttons
            container.querySelector('.add-to-cart-btn').addEventListener('click', () => {
                addToCart(product.id);
            });
            container.querySelector('.buy-now-btn').addEventListener('click', () => {
                buyNow(product.id);
            });
            
            // Load reviews for this product
            loadProductReviews(productId);
            setupReviewForm(productId);
        } else {
            container.innerHTML = '<div class="empty-state-message"><p>Product not found.</p></div>';
        }
    } catch (e) {
        console.error("Error loading product detail: ", e);
        container.innerHTML = '<div class="empty-state-message error-message"><p>Failed to load product details.</p></div>';
    }
}

// Helper function to generate product detail HTML
function createProductDetailHtml(product) {
    return `
        <div class="product-images">
            <img src="${product.imageUrl || 'https://placehold.co/600x600/e0e0e0/333?text=Product+Image'}" alt="${product.name}" class="main-image">
        </div>
        <div class="product-details">
            <h1 class="product-title">${product.name}</h1>
            <p class="product-short-description">${product.shortDescription}</p>
            <div class="product-price">
                <span class="selling-price-large">$${product.sellingPrice.toFixed(2)}</span>
                <span class="actual-price-large">$${product.actualPrice.toFixed(2)}</span>
                <span class="discount-rate-large">${product.discountRate}% off</span>
            </div>
            <p class="product-long-description">${product.longDescription}</p>
            <div class="action-buttons">
                <button class="btn btn-primary add-to-cart-btn">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
                <button class="btn btn-secondary buy-now-btn">
                    <i class="fas fa-credit-card"></i> Buy Now
                </button>
            </div>
            <div class="product-meta">
                <p><strong>Stock:</strong> ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}</p>
                <p><strong>Seller:</strong> ${product.sellerId}</p>
            </div>
        </div>
    `;
}

// Function to handle the "Buy Now" action
async function buyNow(productId) {
    if (!userId) {
        showAlert('Please log in to make a purchase.', 'error');
        return;
    }

    try {
        // Clear the current cart and add the single product
        const newCart = {};
        newCart[productId] = {
            product: (await getDoc(doc(db, 'products', productId))).data(),
            quantity: 1
        };
        const cartDocRef = doc(db, 'carts', userId);
        await setDoc(cartDocRef, { items: newCart });
        
        // Redirect to checkout page
        window.location.href = 'checkout.html';
    } catch (e) {
        console.error("Error with Buy Now: ", e);
        showAlert('Failed to process your request. Please try again.', 'error');
    }
}


// Function to load cart items and display them
async function loadCartItems() {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartItemsContainer || !emptyCartMessage || !checkoutBtn) return;
    
    cartItemsContainer.innerHTML = '';
    
    if (Object.keys(cart).length === 0) {
        emptyCartMessage.style.display = 'block';
        checkoutBtn.disabled = true;
        updateCartSummary(0, 0);
        return;
    }
    
    emptyCartMessage.style.display = 'none';
    checkoutBtn.disabled = false;
    
    let subtotal = 0;
    
    for (const productId in cart) {
        const item = cart[productId];
        const product = item.product;
        const totalItemPrice = product.sellingPrice * item.quantity;
        subtotal += totalItemPrice;
        
        const cartItemHtml = `
            <div class="cart-item fade-in" data-product-id="${productId}">
                <img src="${product.imageUrl || 'https://placehold.co/80x80/e0e0e0/333?text=Image'}" alt="${product.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${product.name}</h4>
                    <p class="cart-item-price">$${totalItemPrice.toFixed(2)}</p>
                    <div class="quantity-controls">
                        <button class="quantity-btn decrease-btn"><i class="fas fa-minus"></i></button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn increase-btn"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
                <button class="remove-btn"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        cartItemsContainer.innerHTML += cartItemHtml;
    }
    
    updateCartSummary(subtotal, 5.00); // Assume a fixed shipping fee for now
    
    // Add event listeners for cart item controls
    cartItemsContainer.querySelectorAll('.cart-item').forEach(itemElement => {
        const productId = itemElement.dataset.productId;
        itemElement.querySelector('.decrease-btn').addEventListener('click', () => updateCartQuantity(productId, -1));
        itemElement.querySelector('.increase-btn').addEventListener('click', () => updateCartQuantity(productId, 1));
        itemElement.querySelector('.remove-btn').addEventListener('click', () => removeFromCart(productId));
    });
    
    // Checkout button click handler
    checkoutBtn.addEventListener('click', () => {
        window.location.href = 'checkout.html';
    });
}

// Function to update the cart summary
function updateCartSummary(subtotal, shipping) {
    const subtotalElement = document.getElementById('cartSubtotal');
    const shippingElement = document.getElementById('cartShipping');
    const totalElement = document.getElementById('cartTotal');
    
    if (subtotalElement && shippingElement && totalElement) {
        const total = subtotal + shipping;
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        shippingElement.textContent = `$${shipping.toFixed(2)}`;
        totalElement.textContent = `$${total.toFixed(2)}`;
    }
}

// Function to update product quantity in the cart
async function updateCartQuantity(productId, change) {
    if (!userId) return;

    if (!isAuthReady) {
        showAlert('Please wait while we set up your session.', 'info');
        return;
    }

    const currentQuantity = cart[productId]?.quantity || 0;
    const newQuantity = currentQuantity + change;
    
    if (newQuantity <= 0) {
        await removeFromCart(productId);
    } else {
        try {
            cart[productId].quantity = newQuantity;
            const cartDocRef = doc(db, 'carts', userId);
            await setDoc(cartDocRef, { items: cart });
        } catch (e) {
            console.error("Error updating cart quantity: ", e);
            showAlert('Failed to update cart.', 'error');
        }
    }
}

// Function to remove a product from the cart
async function removeFromCart(productId) {
    if (!userId) return;
    
    if (!isAuthReady) {
        showAlert('Please wait while we set up your session.', 'info');
        return;
    }
    
    try {
        delete cart[productId];
        const cartDocRef = doc(db, 'carts', userId);
        await setDoc(cartDocRef, { items: cart });
        showAlert('Product removed from cart.', 'success');
    } catch (e) {
        console.error("Error removing from cart: ", e);
        showAlert('Failed to remove product from cart.', 'error');
    }
}

// Function to load the checkout page with cart summary
async function loadCheckoutPage() {
    const checkoutItemsContainer = document.getElementById('checkoutItemsContainer');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    
    if (!checkoutItemsContainer || !placeOrderBtn) return;
    
    checkoutItemsContainer.innerHTML = '';
    
    if (Object.keys(cart).length === 0) {
        window.location.href = 'cart.html'; // Redirect to cart if it's empty
        return;
    }
    
    let subtotal = 0;
    
    for (const productId in cart) {
        const item = cart[productId];
        const product = item.product;
        const totalItemPrice = product.sellingPrice * item.quantity;
        subtotal += totalItemPrice;

        const checkoutItemHtml = `
            <div class="checkout-item">
                <img src="${product.imageUrl || 'https://placehold.co/60x60/e0e0e0/333?text=Image'}" alt="${product.name}">
                <div class="checkout-item-info">
                    <p>${product.name}</p>
                    <p>${item.quantity} x $${product.sellingPrice.toFixed(2)}</p>
                </div>
                <div class="checkout-item-price">$${totalItemPrice.toFixed(2)}</div>
            </div>
        `;
        checkoutItemsContainer.innerHTML += checkoutItemHtml;
    }
    
    updateCheckoutSummary(subtotal, 5.00); // Fixed shipping fee
    
    placeOrderBtn.addEventListener('click', placeOrder);
}

// Function to update the checkout summary
function updateCheckoutSummary(subtotal, shipping) {
    const subtotalElement = document.getElementById('checkoutSubtotal');
    const shippingElement = document.getElementById('checkoutShipping');
    const totalElement = document.getElementById('checkoutTotal');
    
    if (subtotalElement && shippingElement && totalElement) {
        const total = subtotal + shipping;
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        shippingElement.textContent = `$${shipping.toFixed(2)}`;
        totalElement.textContent = `$${total.toFixed(2)}`;
    }
}

// Function to place an order
async function placeOrder() {
    if (!userId) {
        showAlert('Please log in to place an order.', 'error');
        return;
    }
    
    const shippingForm = document.getElementById('shippingForm');
    const address = shippingForm.address.value;
    const street = shippingForm.street.value;
    const city = shippingForm.city.value;
    const state = shippingForm.state.value;
    const pincode = shippingForm.pincode.value;
    const landmark = shippingForm.landmark.value;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    if (!address || !street || !city || !state || !pincode) {
        showAlert('Please fill in all shipping details.', 'error');
        return;
    }
    
    const order = {
        userId,
        items: cart,
        shippingAddress: { address, street, city, state, pincode, landmark },
        paymentMethod,
        orderDate: new Date(),
        status: 'Pending'
    };
    
    try {
        const ordersCol = collection(db, 'orders');
        await addDoc(ordersCol, order);
        
        // Clear the cart after a successful order
        const cartDocRef = doc(db, 'carts', userId);
        await setDoc(cartDocRef, { items: {} });
        
        showAlert('Order placed successfully! Redirecting to profile...', 'success');
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 2000);
    } catch (e) {
        console.error("Error placing order: ", e);
        showAlert('Failed to place order. Please try again.', 'error');
    }
}


// Function to load the user profile
async function loadUserProfile() {
    if (!userId) {
        window.location.href = 'login.html'; // Redirect to login if not authenticated
        return;
    }
    
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    const profileAddress = document.getElementById('profileAddress');
    
    if (profileName) {
        try {
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                profileName.textContent = userData.name || 'N/A';
                profileEmail.textContent = userData.email || 'N/A';
                profilePhone.textContent = userData.phone || 'N/A';
                profileAddress.textContent = userData.address || 'N/A';
            } else {
                console.error("User data not found.");
            }
        } catch (e) {
            console.error("Error loading user profile: ", e);
            showAlert('Failed to load profile information.', 'error');
        }
    }
}

// Function to load a user's order history
async function loadUserOrders() {
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }
    
    const ordersContainer = document.getElementById('ordersContainer');
    const noOrdersMessage = document.getElementById('noOrdersMessage');
    
    if (!ordersContainer || !noOrdersMessage) return;
    
    ordersContainer.innerHTML = '';
    
    try {
        const ordersCol = collection(db, 'orders');
        const userOrdersQuery = query(ordersCol, where("userId", "==", userId));
        const ordersSnapshot = await getDocs(userOrdersQuery);
        
        if (ordersSnapshot.empty) {
            noOrdersMessage.style.display = 'block';
            return;
        }
        
        noOrdersMessage.style.display = 'none';
        
        ordersSnapshot.forEach(doc => {
            const order = { id: doc.id, ...doc.data() };
            const orderHtml = createOrderHtml(order);
            ordersContainer.innerHTML += orderHtml;
        });
    } catch (e) {
        console.error("Error loading user orders: ", e);
        showAlert('Failed to load order history.', 'error');
    }
}

// Helper function to generate HTML for a single order
function createOrderHtml(order) {
    const totalItems = Object.values(order.items).reduce((sum, item) => sum + item.quantity, 0);
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
        </div>
    `;
}

// Helper function to set up tab switching for dashboards/profiles
function setupProfileTabs() {
    const tabButtons = document.querySelectorAll('.profile-nav-btn');
    const tabContents = document.querySelectorAll('.profile-tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Deactivate all buttons and hide all contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activate clicked button and show corresponding content
            button.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// Helper function to set up tab switching for dashboards
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
        });
    });
}


// Function to load and display product reviews
async function loadProductReviews(productId) {
    const reviewsContainer = document.getElementById('reviewsContainer');
    const noReviewsMessage = document.getElementById('noReviewsMessage');
    if (!reviewsContainer || !noReviewsMessage) return;

    reviewsContainer.innerHTML = '';
    noReviewsMessage.style.display = 'none';

    try {
        const reviewsCol = collection(db, 'reviews');
        const productReviewsQuery = query(reviewsCol, where("productId", "==", productId));
        const reviewsSnapshot = await getDocs(productReviewsQuery);

        if (reviewsSnapshot.empty) {
            noReviewsMessage.style.display = 'block';
            return;
        }

        reviewsSnapshot.forEach(doc => {
            const review = doc.data();
            const reviewHtml = createReviewHtml(review);
            reviewsContainer.innerHTML += reviewHtml;
        });
    } catch (e) {
        console.error("Error loading reviews: ", e);
        showAlert('Failed to load reviews.', 'error');
    }
}

// Helper function to generate HTML for a single review
function createReviewHtml(review) {
    const starsHtml = '&#9733;'.repeat(review.rating);
    const date = review.date.toDate ? review.date.toDate().toLocaleDateString() : 'N/A';
    
    return `
        <div class="review-card fade-in">
            <div class="review-header">
                <span class="review-author">${review.userName}</span>
                <div class="review-rating">${starsHtml}</div>
            </div>
            <div class="review-body">
                <p>${review.text}</p>
            </div>
            <div class="review-footer">
                <span class="review-date">${date}</span>
            </div>
        </div>
    `;
}

// Function to set up and handle the review submission form
function setupReviewForm(productId) {
    const addReviewSection = document.getElementById('addReviewSection');
    const reviewForm = document.getElementById('reviewForm');
    const reviewAlert = document.getElementById('reviewAlert');
    const ratingStars = document.querySelectorAll('.rating-stars .star');
    let selectedRating = 0;

    if (!addReviewSection || !reviewForm) return;

    // Show the review section if the user is logged in
    if (userId) {
        addReviewSection.style.display = 'block';
    } else {
        addReviewSection.style.display = 'none';
        return;
    }

    ratingStars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            ratingStars.forEach(s => s.classList.remove('selected'));
            for (let i = 0; i < selectedRating; i++) {
                ratingStars[i].classList.add('selected');
            }
        });
    });

    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (selectedRating === 0) {
            showAlert('Please select a rating.', 'error');
            return;
        }

        const reviewText = document.getElementById('reviewText').value;
        const review = {
            productId,
            userId,
            userName: auth.currentUser.displayName || 'Anonymous', // Use display name if available
            rating: selectedRating,
            text: reviewText,
            date: new Date()
        };
        
        try {
            await addDoc(collection(db, 'reviews'), review);
            showAlert('Review submitted successfully!', 'success');
            reviewForm.reset();
            selectedRating = 0;
            ratingStars.forEach(s => s.classList.remove('selected'));
            loadProductReviews(productId); // Reload reviews to show the new one
        } catch (e) {
            console.error("Error adding review: ", e);
            showAlert('Failed to submit review. Please try again.', 'error');
        }
    });
}
