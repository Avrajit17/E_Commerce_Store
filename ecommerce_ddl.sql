-- E-Commerce Database DDL (Data Definition Language)
-- PostgreSQL Schema


-- =====================================================
-- CREATE TABLES
-- =====================================================

-- 1. USERS table for customers and sellers 
CREATE TABLE IF NOT EXISTS users (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    is_seller BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. SELLERS table
CREATE TABLE IF NOT EXISTS sellers (
    email VARCHAR(255) PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    about TEXT,
    address VARCHAR(255),
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ADMINS table
CREATE TABLE IF NOT EXISTS admins (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    phone_number VARCHAR(20)
);

-- 4. DELIVERY_SYSTEMS table
CREATE TABLE IF NOT EXISTS delivery_systems (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    area VARCHAR(255)
);

-- 5. PRODUCTS table
CREATE TABLE IF NOT EXISTS products (
    product_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_des VARCHAR(100),
    long_des TEXT,
    actual_price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(5, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL,
    tags VARCHAR(255),
    seller_email VARCHAR(255) REFERENCES sellers(email) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. PRODUCT_IMAGES table for product images
CREATE TABLE IF NOT EXISTS product_images (
    image_id SERIAL PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 7. CARTS table
CREATE TABLE IF NOT EXISTS carts (
    user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    product_id VARCHAR(255) REFERENCES products(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_email, product_id)
);
 
-- 8. WISHLISTS table
CREATE TABLE IF NOT EXISTS wishlists (
    user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    product_id VARCHAR(255) REFERENCES products(product_id) ON DELETE CASCADE,
    PRIMARY KEY (user_email, product_id)
);

-- 9. ORDERS table
CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(255) PRIMARY KEY,
    user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_cost DECIMAL(10, 2) NOT NULL,
    address VARCHAR(255),
    street VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    pincode VARCHAR(20),
    landmark VARCHAR(255),
    delivery_status VARCHAR(50) DEFAULT 'not assigned',
    payment_method VARCHAR(50)
);

-- 10. ORDER_PRODUCTS table to link orders and products
CREATE TABLE IF NOT EXISTS order_products (
    order_id VARCHAR(255) REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id VARCHAR(255) REFERENCES products(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (order_id, product_id)
);

-- 11. DELIVERY_ORDERS table to link delivery systems and orders
CREATE TABLE IF NOT EXISTS delivery_orders (
    delivery_email VARCHAR(255) REFERENCES delivery_systems(email) ON DELETE CASCADE,
    order_id VARCHAR(255) REFERENCES orders(order_id) ON DELETE CASCADE,
    PRIMARY KEY (delivery_email, order_id)
);

-- 12. REVIEWS table
CREATE TABLE IF NOT EXISTS reviews (
    review_id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    product_id VARCHAR(255) REFERENCES products(product_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. NOTIFICATIONS table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    notification_text TEXT,
    notification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert into ADMINS table
INSERT INTO admins (name, email, password, address, phone_number) VALUES
('HM nayem', 'hmnayem@gmail.com', 'helloworld', 'Palashi, Sher E Bangla hall,Buet', '1773275870'),
('Web Developer', 'bdffgb@ygvfdu.isug', 'ereronieg', 'vfgbtbgb', '84983473987'),
('67u67u67uj', 'uyjuyjuy', '675577uj juy', '7j7jyufj', '67667766578787');

-- Insert into DELIVERY_SYSTEMS table
INSERT INTO delivery_systems (name, email, password, phone_number, area) VALUES
('ujytuj', 'fhythyth', 'tnh6trh65', '1733347793', 'trhtrthytr'),
('gretrg', 'rgeerggegr', 'freegrer', '45345334', 'grtgt g'),
('iuwbu7blhlomnsau', 'uhdfiu@uyd.uyg', 'uvbjjdfbb', '938242664', 'Barishal, Khulna'),
('tayt ytf hafv usd', 'cddziu@uyd.uyg', '9843gbbjks', '943898465', 'Rajshahi, Chittagong');

-- Insert into USERS table
INSERT INTO users (name, email, password, phone_number, is_seller) VALUES
('Avra', 'avrajitb5@gmail.com', '500600700', '1733347793', TRUE),
('someone', 'b@gmail.com', '123456789', '3232424234324', TRUE),
('sajib', 'sajib73677@gmail.com', '12345678', '1234567890', TRUE),
('someone', 'someone@gmail.com', '123456789', '7843437837', TRUE),
('John Smith', 'john.smith@gmail.com', 'password123', '1234567890', FALSE),
('Emma Wilson', 'emma.wilson@gmail.com', 'securepass', '9876543210', FALSE),
('Michael Brown', 'michael.brown@gmail.com', 'mypassword', '5555555555', TRUE),
('Sarah Davis', 'sarah.davis@gmail.com', 'pass1234', '7777777777', FALSE);

-- Insert into SELLERS table
INSERT INTO sellers (business_name, about, address, phone_number, email) VALUES
('TechGear Solutions', 'Leading electronics and gadgets retailer specializing in cutting-edge technology', '6trh67rjyfjyujyuju7y', '324343234322243423', 'avrajitb5@gmail.com'),
('Fashion Forward', 'Premium clothing and accessories for modern lifestyle', 'gnyumnjh', '657576567755', 'b@gmail.com'),
('BookHaven Store', 'Your destination for books, educational materials and literary treasures', 'hg5rth5hytrhytrhr', '554545545565655556', 'sajib73677@gmail.com'),
('Daily Essentials Hub', 'Quality everyday products and household necessities at affordable prices', 'sfdsrgvf grthgrthg', '434355435433', 'someone@gmail.com'),
('Premium Electronics', 'High-end electronics and gaming accessories', '123 Tech Street, Silicon Valley', '1111111111', 'michael.brown@gmail.com');

-- Insert into PRODUCTS table
INSERT INTO products (product_id, name, long_des, actual_price, discount, selling_price, stock, tags, seller_email, short_des) VALUES
('lg gram 16z90p-3817', 'LG Gram 16Z90P', 'Ultra-lightweight 16-inch laptop featuring Intel 11th Gen processor, 16GB RAM, and 512GB SSD. Perfect for professionals who need powerful performance in a portable design. The stunning IPS display delivers vibrant colors and sharp details, while the long-lasting battery ensures all-day productivity. With its military-grade durability and premium build quality, this laptop combines elegance with exceptional performance for demanding users.', 3200, 10, 2880, 55, 'laptop', 'avrajitb5@gmail.com', 'Ultra-lightweight 16-inch laptop with powerful performance'),
('amazon basics gaming headset for pc and consoles-4336', 'Amazon Basics Gaming Headset', 'Professional gaming headset designed for serious gamers. Features crystal-clear audio, noise-canceling microphone, and comfortable over-ear design for extended gaming sessions. Compatible with PC, PlayStation, Xbox, and Nintendo Switch. The adjustable headband and soft ear cushions provide maximum comfort, while the premium drivers deliver immersive sound quality that gives you the competitive edge in any game.', 2800, 10, 2520, 31, 'accessories', 'avrajitb5@gmail.com', 'Professional gaming headset with crystal-clear audio'),
('audio-technica ath-g1wl-3075', 'Audio-Technica ATH-G1WL', 'Premium wireless gaming headset with studio-quality audio and professional-grade microphone. Features low-latency 2.4GHz wireless connection, 15-hour battery life, and exceptional comfort for marathon gaming sessions. The closed-back design provides excellent noise isolation, while the detachable boom microphone ensures clear team communication. Perfect for competitive gaming and content creation.', 2000, 10, 1800, 41, 'accessories', 'avrajitb5@gmail.com', 'Premium wireless gaming headset with studio-quality audio'),
('amazon essentials men''s regular-fit-930', 'Amazon Essentials Men''s Regular-fit Jeans', 'Classic regular-fit jeans crafted from premium denim for comfort and durability. Features traditional five-pocket styling, perfect for casual and semi-formal occasions. The relaxed fit through seat and thigh with straight leg opening provides all-day comfort. Made from high-quality cotton blend that maintains shape wash after wash. Available in multiple washes and sizes to suit every style preference.', 2300, 10, 2070, 34, 'men', 'avrajitb5@gmail.com', 'Classic regular-fit jeans for everyday comfort'),
('wrangler authentics men''s classic-1077', 'Wrangler Authentics Men''s Classic Jeans', 'Authentic Western-style jeans with classic five-pocket design and comfortable regular fit. Made from durable cotton denim that gets better with age. Features traditional Wrangler styling with quality construction that lasts. The perfect balance of comfort and durability makes these jeans ideal for work, weekend activities, or casual everyday wear. True to the Wrangler heritage of quality and craftsmanship.', 2300, 43, 1311, 323, 'men', 'avrajitb5@gmail.com', 'Authentic Western-style jeans with classic design'),
('samsung galaxy s22-1002', 'Samsung Galaxy S22', 'Flagship smartphone with cutting-edge technology and premium design. Features 6.1-inch Dynamic AMOLED display, triple camera system with 50MP main sensor, and powerful Snapdragon processor. The sleek aluminum frame and Gorilla Glass protection ensure durability and style. With 5G connectivity, wireless charging, and all-day battery life, this phone delivers flagship performance in a compact form factor.', 23000, 10, 20700, 233, 'phone', 'avrajitb5@gmail.com', 'Flagship smartphone with cutting-edge technology'),
('this here flesh-552', 'This Here Flesh: Spirituality, Liberation, and the Stories That Make Us', 'A powerful memoir exploring faith, identity, and liberation through personal stories. This thought-provoking book examines the intersection of spirituality and social justice, offering insights into healing and transformation. Through vulnerable storytelling and theological reflection, the author weaves together themes of race, gender, faith, and belonging. An essential read for anyone seeking deeper understanding of contemporary spirituality and social consciousness.', 2300, 10, 2070, 243, 'books', 'sajib73677@gmail.com', 'Powerful memoir exploring faith, identity, and liberation'),
('frito-lay ultimate snack-591', 'Frito-Lay Ultimate Snack Mix', 'Premium variety pack featuring the best of Frito-Lay snacks. Includes popular favorites like Doritos, Cheetos, Fritos, and Lay''s chips in convenient single-serving packages. Perfect for parties, office snacking, lunch boxes, or anytime you need a delicious treat. Each pack is fresh and full of flavor, offering something for every taste preference. Great value pack that ensures you never run out of your favorite snacks.', 230, 10, 207, 233, 'daily need', 'someone@gmail.com', 'Premium variety pack of popular Frito-Lay snacks'),
('gatorade classic thirst-2887', 'Gatorade Classic Thirst Quencher', 'The original sports drink trusted by athletes worldwide. Scientifically formulated to replace electrolytes lost through sweat and fuel working muscles during intense physical activity. Available in classic flavors that have been satisfying athletes for decades. Whether you''re training, competing, or just staying active, Gatorade helps you perform at your best by keeping you properly hydrated and energized throughout your workout.', 2500, 10, 2250, 350, 'daily need', 'someone@gmail.com', 'Original sports drink for optimal hydration and performance'),
('3-tier metal rolling utility cart-4738', '3-Tier Metal Rolling Utility Cart', 'Versatile storage solution perfect for kitchen, bathroom, office, or garage organization. Features three spacious tiers with raised edges to prevent items from falling, smooth-rolling casters for easy mobility, and durable metal construction that lasts for years. The compact design fits through standard doorways while maximizing storage capacity. Ideal for organizing supplies, tools, toiletries, or kitchen essentials with style and functionality.', 2400, 30, 1680, 34, 'daily need', 'someone@gmail.com', 'Versatile 3-tier storage cart for home organization'),
('real friends-3486', 'Real Friends: A Novel', 'A heartwarming contemporary fiction exploring the complexities of modern friendship and personal growth. Follow the journey of lifelong friends as they navigate career changes, relationships, and life''s unexpected challenges. This emotionally resonant story examines what it truly means to be there for each other through thick and thin. With authentic characters and relatable situations, this novel celebrates the power of genuine connections and the importance of chosen family.', 1200, 20, 960, 434, 'books', 'sajib73677@gmail.com', 'Heartwarming novel about friendship and personal growth'),
('apple macbook pro 14-5001', 'Apple MacBook Pro 14-inch', 'Revolutionary laptop powered by Apple M2 Pro chip delivering exceptional performance and battery life. Features stunning Liquid Retina XDR display, advanced camera and audio, and comprehensive connectivity. Perfect for creative professionals, developers, and power users who demand the best. The sleek Space Gray finish and premium build quality make this the ultimate mobile workstation for serious productivity and creative work.', 45000, 15, 38250, 25, 'laptop', 'michael.brown@gmail.com', 'Revolutionary laptop with M2 Pro chip and XDR display'),
('sony wh-1000xm5-6789', 'Sony WH-1000XM5 Wireless Headphones', 'Industry-leading noise canceling headphones with exceptional sound quality and 30-hour battery life. Features adaptive sound control, quick charge capability, and premium comfort for all-day listening. The advanced V1 processor and dual noise sensor technology deliver unparalleled noise cancellation. Perfect for travel, work, or everyday listening with touch controls and voice assistant compatibility.', 8500, 20, 6800, 15, 'accessories', 'michael.brown@gmail.com', 'Industry-leading noise canceling headphones'),
('nike air max 270-3344', 'Nike Air Max 270 Running Shoes', 'Modern lifestyle sneaker featuring Nike''s largest heel Air unit for exceptional comfort and style. The engineered mesh upper provides breathability while the rubber outsole offers durable traction. Perfect for casual wear or light athletic activities. The iconic design and comfortable fit make these shoes a versatile addition to any wardrobe, combining athletic performance with street-ready style.', 3500, 25, 2625, 120, 'shoes', 'b@gmail.com', 'Modern lifestyle sneaker with maximum comfort'),
('instant pot duo 7-in-1-7788', 'Instant Pot Duo 7-in-1 Pressure Cooker', 'Multi-functional kitchen appliance that replaces 7 traditional cooking methods. Features pressure cooking, slow cooking, rice cooking, steaming, sautéing, yogurt making, and food warming capabilities. The 6-quart capacity is perfect for families, while the intuitive controls make cooking effortless. Save time and counter space while creating delicious, healthy meals with this versatile kitchen essential.', 4200, 30, 2940, 45, 'kitchen', 'someone@gmail.com', 'Versatile 7-in-1 pressure cooker for modern kitchens'),

('logitech-keyboard-3456', 'Logitech K120 USB Keyboard', 'A reliable and durable USB keyboard from Logitech, designed for comfortable and quiet typing. Features a standard layout with full-size F-keys and a numeric pad. Spill-resistant design and sturdy adjustable tilt legs make it a great choice for home or office use.', 1500, 15, 1275, 150, 'accessories', 'new.seller@gmail.com', 'Reliable USB keyboard for everyday use'),
('mechanical-keyboard-7890', 'Mechanical Gaming Keyboard', 'High-performance mechanical keyboard with responsive blue switches for a satisfying clicky sound and tactile feedback. Features RGB backlighting with multiple lighting effects, anti-ghosting keys, and a durable metal plate construction. Perfect for serious gamers and enthusiasts who demand precision.', 6000, 20, 4800, 85, 'accessories', 'new.seller@gmail.com', 'High-performance mechanical keyboard with RGB lighting'),
('office-chair-1234', 'Ergonomic Mesh Office Chair', 'A comfortable and supportive office chair featuring an ergonomic design with a breathable mesh back. Includes adjustable lumbar support, armrests, and seat height to ensure proper posture during long work hours. The smooth-rolling casters provide easy mobility on any floor surface.', 9000, 25, 6750, 75, 'daily need', 'new.seller@gmail.com', 'Ergonomic office chair with breathable mesh back'),
('storage-rack-5678', '4-Tier Metal Storage Rack', 'A heavy-duty storage rack with four adjustable shelves, perfect for organizing items in a garage, kitchen, or pantry. The durable steel construction can support significant weight, and the open design allows for easy access to all your stored items. Simple to assemble with no tools required.', 3500, 10, 3150, 110, 'daily need', 'new.seller@gmail.com', 'Heavy-duty 4-tier metal storage rack'),
('wrist-watch-9101', 'Classic Leather Strap Watch', 'A stylish and classic analog watch with a genuine leather strap and a minimalist dial. Features a durable stainless steel case and is water-resistant. The perfect accessory for both casual and formal wear, adding a touch of timeless elegance to any outfit.', 3000, 20, 2400, 200, 'accessories', 'new.seller@gmail.com', 'Classic leather strap watch with minimalist design'),
('sunglass-1213', 'Aviator-Style Sunglasses', 'Timeless aviator-style sunglasses with a lightweight metal frame and polarized lenses that reduce glare and provide 100% UV protection. Suitable for both men and women, these sunglasses are perfect for driving, outdoor activities, or daily wear.', 2500, 15, 2125, 180, 'accessories', 'new.seller@gmail.com', 'Classic aviator-style sunglasses with polarized lenses'),
('school-bag-1415', 'Durable Multi-Compartment School Bag', 'A spacious and durable school bag with multiple compartments to organize books, notebooks, and other essentials. Features padded shoulder straps and a cushioned back panel for comfort. Made from water-resistant material to protect your belongings from rain.', 1800, 10, 1620, 250, 'accessories', 'new.seller@gmail.com', 'Spacious and durable school bag for students'),
('chal-rice-1617', 'Premium Long-Grain Basmati Rice 5kg', 'High-quality long-grain Basmati rice known for its distinctive aroma and delicate flavor. Perfect for preparing biryani, pilaf, and other special rice dishes. Each grain cooks up light and fluffy, making it a staple for any kitchen.', 1000, 5, 950, 500, 'daily need', 'new.seller@gmail.com', 'Aroma and flavorful premium Basmati rice'),
('daal-1819', 'Organic Split Red Lentils (Masoor Dal) 1kg', 'Healthy and nutritious organic split red lentils. A great source of protein and fiber, these lentils cook quickly and are perfect for a variety of soups, stews, and curries. A must-have pantry item for any health-conscious home cook.', 150, 0, 150, 450, 'daily need', 'new.seller@gmail.com', 'Nutritious and quick-cooking red lentils'),
('travel-bag-2021', 'Lightweight Carry-On Travel Bag', 'A lightweight and durable carry-on travel bag with a spacious main compartment and a front pocket for easy access to travel documents. Features a retractable handle and smooth-rolling wheels for effortless travel. Meets most airline carry-on size requirements.', 4500, 25, 3375, 90, 'accessories', 'new.seller@gmail.com', 'Lightweight and durable carry-on travel bag'),
('hazabarala-sukumar-roy-2223', 'hazabarala-Sukumar Roy', 'A whimsical and nonsensical story for children, filled with humorous characters and creative wordplay. Written by the legendary Sukumar Roy, this book is a classic of Bengali literature that has entertained generations. A must-read for its wit and imagination.', 500, 10, 450, 100, 'books', 'sajib73677@gmail.com', 'A whimsical and classic Bengali children''s story'),
('tripitak-novel-maxim-gorki-2425', 'Tripitak Novel-Maxim Gorki', 'A powerful and insightful novel by Maxim Gorki that explores the complexities of human nature and society. This book is a deep dive into the lives of its characters, offering a compelling narrative that resonates with readers. A significant work of Russian literature.', 1500, 10, 1350, 80, 'books', 'sajib73677@gmail.com', 'A powerful and insightful novel by Maxim Gorki'),
('baghbor-uprendra-kishore-roy-ch-2627', 'Baghbor--Uprndra Kishore Roy Chowdhury', 'A collection of delightful children''s stories by Upendra Kishore Roy Chowdhury. The tales are full of adventure, wit, and moral lessons, making them both entertaining and educational. A staple in Bengali children''s literature.', 450, 10, 405, 120, 'books', 'sajib73677@gmail.com', 'Delightful children''s stories by Upendra Kishore Roy Chowdhury'),
('hamlet-william-shakespeare-2829', 'Hamlet- Willliam Shakespeare', 'One of William Shakespeare''s most famous tragedies, exploring themes of revenge, madness, and morality. The story of Prince Hamlet and his quest for vengeance is a masterpiece of world literature, known for its complex characters and timeless dialogues.', 600, 10, 540, 95, 'books', 'sajib73677@gmail.com', 'A classic tragedy by William Shakespeare'),
('bangla-sahitter-itihash-anisuzzaman-3031', 'Bangla Sahitter itihash-1st Part-Dr.Anisuzzaman', 'A comprehensive history of Bengali literature, meticulously researched and authored by the renowned scholar Dr. Anisuzzaman. This first part covers the early period of Bengali literary history, providing valuable insights and analysis for students and researchers.', 800, 10, 720, 60, 'books', 'sajib73677@gmail.com', 'Comprehensive history of Bengali literature by Dr. Anisuzzaman'),
('probondho-songhroho-promotho-chowdhury-3233', 'probondho Songhroho-Promotho Chowdhury', 'A collection of essays by Promotho Chowdhury, a pioneer of modern Bengali prose. His writings are known for their sharp intellect, wit, and progressive ideas, making them highly influential in Bengali literature. This collection showcases his distinctive style and intellectual depth.', 700, 10, 630, 70, 'books', 'sajib73677@gmail.com', 'Essays by a pioneer of modern Bengali prose'),
('bisad-sindhu-mir-mosarraf-hossain-3435', 'bisadSindhu-MIr Mosarraf Hossain', 'A poignant historical novel based on the tragedy of Karbala. Written by Mir Mosarraf Hossain, this epic work of Bengali literature is revered for its emotional depth, rich prose, and dramatic narrative. A timeless classic that has deeply impacted Bengali readers.', 650, 10, 585, 85, 'books', 'sajib73677@gmail.com', 'A poignant historical novel based on the tragedy of Karbala'),
('deshe-bideshe-syed-mujtaba-ali-3637', 'deshe bideshe-Syed Mujtaba Ali', 'A travelogue and memoir by Syed Mujtaba Ali, detailing his experiences and observations while living abroad. The book is famous for its humorous and witty storytelling, combining personal anecdotes with cultural insights. A celebrated work of Bengali travel literature.', 750, 10, 675, 110, 'books', 'sajib73677@gmail.com', 'A celebrated travelogue by Syed Mujtaba Ali'),
('ayna-abul-mansur-ahmed-3839', 'Ayna-Abul Mansur Ahmed', 'A collection of satirical short stories by Abul Mansur Ahmed, a master of social satire in Bengali literature. The stories use humor and wit to critique social and political issues, offering sharp commentary on contemporary society. A must-read for its powerful message and clever writing.', 550, 10, 495, 90, 'books', 'sajib73677@gmail.com', 'A collection of satirical short stories'),
('the-adventure-of-robinhood-howard-pyle-4041', 'The adventure of Robinhood--Howard Paile', 'A classic tale of the heroic outlaw Robin Hood and his band of merry men. Howard Pyle''s beautifully illustrated version is a cornerstone of children''s literature, bringing the legendary story to life with vivid detail and captivating adventure. A timeless book for all ages.', 500, 10, 450, 130, 'books', 'sajib73677@gmail.com', 'A classic tale of the heroic outlaw Robin Hood'),
('greek-mythology-adi-theke-anto-sm-neaz-mawla-4243', 'Greek Mythology Adi Theke Anto -S.M.Neaz Mawla', 'A comprehensive and accessible guide to Greek mythology, covering everything from the beginning to the end. This book provides a detailed overview of the gods, heroes, and epic tales, making the complex world of Greek myths easy to understand for a Bengali audience.', 850, 10, 765, 75, 'books', 'sajib73677@gmail.com', 'A comprehensive guide to Greek mythology'),
('rokta-prantor-munir-chowdhury-4445', 'Roktanto Prantor -Munir Chowdhury', 'A powerful and poignant play by Munir Chowdhury, based on the historical event of the Battle of Karbala. The drama explores themes of loyalty, betrayal, and sacrifice with deep emotional resonance, making it a masterpiece of modern Bengali theater.', 600, 10, 540, 50, 'books', 'sajib73677@gmail.com', 'A powerful and poignant play by Munir Chowdhury.')
ON CONFLICT (product_id) DO NOTHING;

-- Insert into PRODUCT_IMAGES table
-- Note: The image_id is SERIAL, so we only need to provide the image_url and product_id.
INSERT INTO product_images (image_url, product_id) VALUES
('http://localhost:3000/uploads/1645603354271A1aawsUZVKL._AC_UY550_.jpg', 'amazon essentials men''s regular-fit-930'),
('http://localhost:3000/uploads/164560369403271vq85GMg0L._AC_SL1500_.jpg', 'samsung galaxy s22-1002'),
('http://localhost:3000/uploads/164560335678991PgdFDORRL._AC_UX522_.jpg', 'amazon essentials men''s regular-fit-930'),
('http://localhost:3000/uploads/164560371371941-VWweOp6L._AC_SL1500_.jpg', 'samsung galaxy s22-1002'),
('http://localhost:3000/uploads/1645604312510A1Zk8RWirNL._SL1500_.jpg', 'frito-lay ultimate snack-591'),
('http://localhost:3000/uploads/164560446138241lVITg8TtL.jpg', 'gatorade classic thirst-2887'),
('http://localhost:3000/uploads/1645604466823812uU6XQOWL._SL1500_.jpg', 'gatorade classic thirst-2887'),
('http://localhost:3000/uploads/164560462206581YsoD2R5mL._AC_SL1500_.jpg', '3-tier metal rolling utility cart-4738'),
('http://localhost:3000/uploads/164560461505361gaO09-xnL._AC_SL1500_.jpg', '3-tier metal rolling utility cart-4738'),
('http://localhost:3000/uploads/16456056182191626727856.01._SCLZZZZZZZ_SX500_.jpg', 'real friends-3486'),
('http://localhost:3000/uploads/164560165447871ofj+D95ZL._AC_SL1500_.jpg', 'audio-technica ath-g1wl-3075'),
('http://localhost:3000/uploads/164560166669871IC2T4ZaaL._AC_SL1500_.jpg', 'audio-technica ath-g1wl-3075'),
('http://localhost:3000/uploads/164560118607781rWGeUKLKL._AC_SL1500_.jpg', 'amazon basics gaming headset for pc and consoles-4336'),
('http://localhost:3000/uploads/164560246742671SsE8kWTDL._AC_SX679_.jpg', 'lg gram 16z90p-3817'),
('http://localhost:3000/uploads/1645601189876812TK2KyseL._AC_SL1500_.jpg', 'amazon basics gaming headset for pc and consoles-4336'),
('http://localhost:3000/uploads/1645602464071714RyAbEjbL._AC_SX679_.jpg', 'lg gram 16z90p-3817'),
('http://localhost:3000/uploads/1645603359688915PysYDuAL._AC_UY550_.jpg', 'amazon essentials men''s regular-fit-930'),
('http://localhost:3000/uploads/164560165766581No6G8DnwL._AC_SL1500_.jpg', 'audio-technica ath-g1wl-3075'),
('http://localhost:3000/uploads/164560166348381i9T-0UZeL._AC_SL1500_.jpg', 'audio-technica ath-g1wl-3075'),
('http://localhost:3000/uploads/164560118348771M2X5-7jjL._AC_SL1500_.jpg', 'amazon basics gaming headset for pc and consoles-4336'),
('http://localhost:3000/uploads/164560118068371kWaWSmlYL._AC_SL1500_.jpg', 'amazon basics gaming headset for pc and consoles-4336'),
('http://localhost:3000/uploads/macbook-pro-14-main.jpg', 'apple macbook pro 14-5001'),
('http://localhost:3000/uploads/macbook-pro-14-side.jpg', 'apple macbook pro 14-5001'),
('http://localhost:3000/uploads/sony-wh1000xm5-main.jpg', 'sony wh-1000xm5-6789'),
('http://localhost:3000/uploads/nike-air-max-270-main.jpg', 'nike air max 270-3344'),
('http://localhost:3000/uploads/instant-pot-duo-main.jpg', 'instant pot duo 7-in-1-7788'),

('http://localhost:3000/uploads/logitech-keyboard.jpg', 'logitech-keyboard-3456'),
('http://localhost:3000/uploads/mechanical-keyboard-1.jpg', 'mechanical-keyboard-7890'),
('http://localhost:3000/uploads/mechanical-keyboard-2.jpg', 'mechanical-keyboard-7890'),
('http://localhost:3000/uploads/office-chair.jpg', 'office-chair-1234'),
('http://localhost:3000/uploads/office-chair-side.jpg', 'office-chair-1234'),
('http://localhost:3000/uploads/storage-rack.jpg', 'storage-rack-5678'),
('http://localhost:3000/uploads/wrist-watch.jpg', 'wrist-watch-9101'),
('http://localhost:3000/uploads/sunglass.jpg', 'sunglass-1213'),
('http://localhost:3000/uploads/school-bag.jpg', 'school-bag-1415'),
('http://localhost:3000/uploads/chal-rice.jpg', 'chal-rice-1617'),
('http://localhost:3000/uploads/daal.jpg', 'daal-1819'),
('http://localhost:3000/uploads/travel-bag.jpg', 'travel-bag-2021'),
('http://localhost:3000/uploads/hazabarala-sukumar-roy.jpg', 'hazabarala-sukumar-roy-2223'),
('http://localhost:3000/uploads/tripitak-novel-maxim-gorki.jpg', 'tripitak-novel-maxim-gorki-2425'),
('http://localhost:3000/uploads/baghbor-uprendra-kishore-roy-ch.jpg', 'baghbor-uprendra-kishore-roy-ch-2627'),
('http://localhost:3000/uploads/hamlet-william-shakespeare.jpg', 'hamlet-william-shakespeare-2829'),
('http://localhost:3000/uploads/bangla-sahitter-itihash-anisuzzaman.jpg', 'bangla-sahitter-itihash-anisuzzaman-3031'),
('http://localhost:3000/uploads/probondho-songhroho-promotho-chowdhury.jpg', 'probondho-songhroho-promotho-chowdhury-3233'),
('http://localhost:3000/uploads/bisad-sindhu-mir-mosarraf-hossain.jpg', 'bisad-sindhu-mir-mosarraf-hossain-3435'),
('http://localhost:3000/uploads/deshe-bideshe-syed-mujtaba-ali.jpg', 'deshe-bideshe-syed-mujtaba-ali-3637'),
('http://localhost:3000/uploads/ayna-abul-mansur-ahmed.jpg', 'ayna-abul-mansur-ahmed-3839'),
('http://localhost:3000/uploads/the-adventure-of-robinhood-howard-pyle.jpg', 'the-adventure-of-robinhood-howard-pyle-4041'),
('http://localhost:3000/uploads/greek-mythology-adi-theke-anto-sm-neaz-mawla.jpg', 'greek-mythology-adi-theke-anto-sm-neaz-mawla-4243'),
('http://localhost:3000/uploads/rokta-prantor-munir-chowdhury.jpg', 'rokta-prantor-munir-chowdhury-4445')
ON CONFLICT (product_id) DO NOTHING;

-- Insert into CARTS table
INSERT INTO carts (user_email, product_id, quantity) VALUES
('john.smith@gmail.com', 'nike air max 270-3344', 1),
('sarah.davis@gmail.com', 'instant pot duo 7-in-1-7788', 1),
('emma.wilson@gmail.com', 'lg gram 16z90p-3817', 1),
('avrajitb5@gmail.com', 'real friends-3486', 2),
('b@gmail.com', 'frito-lay ultimate snack-591', 3);

-- Insert into WISHLISTS table
INSERT INTO wishlists (user_email, product_id) VALUES
('b@gmail.com', 'amazon basics gaming headset for pc and consoles-4336'),
('john.smith@gmail.com', 'nike air max 270-3344'),
('avrajitb5@gmail.com', 'apple macbook pro 14-5001'),
('emma.wilson@gmail.com', 'instant pot duo 7-in-1-7788'),
('sarah.davis@gmail.com', 'sony wh-1000xm5-6789');

-- Insert into ORDERS table
INSERT INTO orders (order_id, user_email, order_date, total_cost, address, street, city, state, pincode, landmark, delivery_status, payment_method) VALUES
('2025-07-23T04:00:41.316Z', 'avrajitb5@gmail.com', '2025-07-23 10:00:41', 37395.6, 'Palashi, Ahsanullah hall,Buet', 'hyth', 'Dhaka', 'Dhaka', '1211', 'hytht', 'assigned', 'bkash'),
('2025-07-23T10:27:26.958Z', 'b@gmail.com', '2025-07-23 16:27:26', 11160, 'Palashi, Ahsanullah hall,Buet', 'fefer er', 'Dhaka', 'Dhaka', '1211', 'ergfegrf', 'assigned', 'bkash'),
('2025-07-21T22:05:07.573Z', 'avrajitb5@gmail.com', '2025-07-22 04:05:07', 2598.05, 'Palashi, Ahsanullah hall,Buet', 'rfgerg', 'Dhaka', 'Dhaka', '1211', 'gerger', 'delivered', 'bkash'),
('2025-07-23T06:40:15.032Z', 'avrajitb5@gmail.com', '2025-07-23 12:40:15', 2158.49, 'Palashi, Ahsanullah hall,Buet', 'egtrg', 'Dhaka', 'Dhaka', '1211', 'tgtrgtr', 'assigned', 'cash-on-delivery'),
('2025-07-25T14:30:22.145Z', 'john.smith@gmail.com', '2025-07-25 14:30:22', 38250, '123 Main Street, New York, NY, 10001', 'Main Street', 'New York', 'NY', '10001', 'Near Central Park', 'processing', 'credit-card'),
('2025-07-25T16:45:33.678Z', 'emma.wilson@gmail.com', '2025-07-25 16:45:33', 6800, '456 Oak Avenue, Los Angeles, CA, 90210', 'Oak Avenue', 'Los Angeles', 'CA', '90210', 'Beverly Hills', 'shipped', 'paypal');

-- Insert into ORDER_PRODUCTS table
INSERT INTO order_products (order_id, product_id, quantity) VALUES
('2025-07-23T10:27:26.958Z', 'amazon basics gaming headset for pc and consoles-4336', 3),
('2025-07-23T10:27:26.958Z', 'audio-technica ath-g1wl-3075', 2),
('2025-07-21T22:05:07.573Z', 'samsung galaxy s22-1002', 1),
('2025-07-23T06:40:15.032Z', 'frito-lay ultimate snack-591', 5),
('2025-07-23T06:40:15.032Z', 'gatorade classic thirst-2887', 2),
('2025-07-25T14:30:22.145Z', 'apple macbook pro 14-5001', 1),
('2025-07-25T16:45:33.678Z', 'sony wh-1000xm5-6789', 1);

-- Insert into DELIVERY_ORDERS table
INSERT INTO delivery_orders (delivery_email, order_id) VALUES
('uhdfiu@uyd.uyg', '2025-07-21T22:05:07.573Z'),
('cddziu@uyd.uyg', '2025-07-23T04:00:41.316Z'),
('uhdfiu@uyd.uyg', '2025-07-23T10:27:26.958Z'),
('uhdfiu@uyd.uyg', '2025-07-23T06:40:15.032Z');

-- Insert into REVIEWS table
-- Note: The review_id is SERIAL, so we only need to provide the other columns.
INSERT INTO reviews (user_email, product_id, review_text, rating, review_date) VALUES
('avrajitb5@gmail.com', 'samsung galaxy s22-1002', 'Excellent phone with amazing camera quality and fast performance. Highly recommended for anyone looking for a flagship device.', 5, '2025-07-24 10:30:15'),
('b@gmail.com', 'amazon basics gaming headset for pc and consoles-4336', 'Great headset for the price. Good sound quality and comfortable for long gaming sessions.', 4, '2025-07-24 14:20:30'),
('b@gmail.com', 'audio-technica ath-g1wl-3075', 'Outstanding wireless gaming headset. The sound quality is phenomenal and battery life is excellent.', 5, '2025-07-24 16:45:22'),
('john.smith@gmail.com', 'apple macbook pro 14-5001', 'Incredible performance and build quality. Perfect for professional work and creative tasks.', 5, '2025-07-26 09:15:45'),
('emma.wilson@gmail.com', 'sony wh-1000xm5-6789', 'Best noise-canceling headphones I have ever used. Worth every penny!', 5, '2025-07-26 11:30:20');

-- Insert into NOTIFICATIONS table
-- Note: The notification_id is SERIAL, so we only need to provide the other columns.
INSERT INTO notifications (notification_text, user_email, notification_date) VALUES
('LG Gram 16Z90P has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-18 23:32:43'),
('Your order has been successfully placed! Order id: 2025-07-18T17:33:02.174Z', 'avrajitb5@gmail.com', '2025-07-18 23:33:02'),
('Amazon Basics Gaming has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-19 17:17:25'),
('Your order has been successfully placed! Order id: 2025-07-21T19:56:46.795Z', 'avrajitb5@gmail.com', '2025-07-22 01:56:46'),
('Frito-Lay Ultimate Snack has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-22 02:07:02'),
('Audio-Technica ATH-G1WL has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-18 22:22:09'),
('Samsung Galaxy S22 has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-22 02:06:59'),
('Your order 2025-07-21T22:08:33.284Z has been cancelled', 'avrajitb5@gmail.com', '2025-07-23 09:52:56'),
('Your order 2025-07-21T22:08:33.284Z has been cancelled', 'avrajitb5@gmail.com', '2025-07-23 09:58:08'),
('Your order 2025-07-21T21:27:07.689Z has been cancelled', 'avrajitb5@gmail.com', '2025-07-23 09:59:13'),
('Samsung Galaxy S22 has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-23 10:00:16'),
('Frito-Lay Ultimate Snack has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-23 10:00:19'),
('Gatorade Classic Thirst has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-23 10:00:23'),
('Your order has been successfully placed! Order id: 2025-07-23T04:00:41.316Z', 'avrajitb5@gmail.com', '2025-07-23 10:00:41'),
('3-Tier Metal Rolling Utility Cart has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-18 21:22:06'),
('Your order has been successfully placed! Order id: 2025-07-18T15:22:21.123Z', 'avrajitb5@gmail.com', '2025-07-18 21:22:21'),
('Your order has been successfully placed! Order id: 2025-07-21T21:27:07.689Z', 'avrajitb5@gmail.com', '2025-07-22 03:27:07'),
('Samsung Galaxy S22 has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-22 04:04:45'),
('Real Friends has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-22 04:04:48'),
('This Here Flesh has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-22 04:04:53'),
('Your order has been successfully placed! Order id: 2025-07-21T22:05:07.573Z', 'avrajitb5@gmail.com', '2025-07-22 04:05:07'),
('Amazon Basics Gaming has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-22 04:07:27'),
('Real Friends has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-22 04:07:31'),
('Your order has been successfully placed! Order id: 2025-07-21T22:08:33.284Z', 'avrajitb5@gmail.com', '2025-07-22 04:08:33'),
('Amazon Basics Gaming has been added to your cart!', 'b@gmail.com', '2025-07-23 16:26:22'),
('LG Gram 16Z90P has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-19 16:18:14'),
('Samsung Galaxy S22 has been added to your wishlist!', 'avrajitb5@gmail.com', '2025-07-19 16:19:35'),
('Amazon Basics Gaming has been added to your wishlist!', 'b@gmail.com', '2025-07-23 16:26:37'),
('Audio-Technica ATH-G1WL has been added to your cart!', 'b@gmail.com', '2025-07-23 16:26:45'),
('Your order has been successfully placed! Order id: 2025-07-23T10:27:26.958Z', 'b@gmail.com', '2025-07-23 16:27:26'),
('LG Gram 16Z90P has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-19 16:18:14'),
('Real Friends has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-23 12:40:00'),
('Gatorade Classic Thirst has been added to your cart!', 'avrajitb5@gmail.com', '2025-07-23 12:40:03'),
('Your order has been successfully placed! Order id: 2025-07-23T06:40:15.032Z', 'avrajitb5@gmail.com', '2025-07-23 12:40:15'),
('Your order 2025-07-21T22:05:07.573Z has been delivered! Please give review on the purchased products. Thank you!', 'avrajitb5@gmail.com', '2025-07-23 13:14:31'),
('Apple MacBook Pro 14-inch has been added to your cart!', 'john.smith@gmail.com', '2025-07-25 14:25:30'),
('Your order has been successfully placed! Order id: 2025-07-25T14:30:22.145Z', 'john.smith@gmail.com', '2025-07-25 14:30:22'),
('Sony WH-1000XM5 Wireless Headphones has been added to your cart!', 'emma.wilson@gmail.com', '2025-07-25 16:40:15'),
('Your order has been successfully placed! Order id: 2025-07-25T16:45:33.678Z', 'emma.wilson@gmail.com', '2025-07-25 16:45:33'),
('Nike Air Max 270 Running Shoes has been added to your wishlist!', 'john.smith@gmail.com', '2025-07-25 18:20:45'),
('Instant Pot Duo 7-in-1 has been added to your cart!', 'sarah.davis@gmail.com', '2025-07-25 19:15:30');




-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index on users table
CREATE INDEX IF NOT EXISTS idx_users_is_seller ON users(is_seller);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Index on products table
CREATE INDEX IF NOT EXISTS idx_products_seller_email ON products(seller_email);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products(tags);
CREATE INDEX IF NOT EXISTS idx_products_selling_price ON products(selling_price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- Index on orders table
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);

-- Index on reviews table
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_email ON reviews(user_email);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Index on notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(notification_date);

-- Index on product_images table
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- =====================================================
-- CREATE CONSTRAINTS (Additional Business Logic)
-- =====================================================

-- Ensure selling price is positive
ALTER TABLE products ADD CONSTRAINT check_positive_selling_price 
    CHECK (selling_price > 0);

-- Ensure actual price is positive
ALTER TABLE products ADD CONSTRAINT check_positive_actual_price 
    CHECK (actual_price > 0);

-- Ensure discount is between 0 and 100
ALTER TABLE products ADD CONSTRAINT check_discount_range 
    CHECK (discount >= 0 AND discount <= 100);

-- Ensure stock is non-negative
ALTER TABLE products ADD CONSTRAINT check_non_negative_stock 
    CHECK (stock >= 0);

-- Ensure cart quantity is positive
ALTER TABLE carts ADD CONSTRAINT check_positive_cart_quantity 
    CHECK (quantity > 0);

-- Ensure order product quantity is positive
ALTER TABLE order_products ADD CONSTRAINT check_positive_order_quantity 
    CHECK (quantity > 0);

-- Ensure total cost is positive
ALTER TABLE orders ADD CONSTRAINT check_positive_total_cost 
    CHECK (total_cost > 0);

-- =====================================================
-- CREATE TRIGGERS (Optional - for audit trail)
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create trigger for products table
CREATE TRIGGER update_products_timestamp 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for product details with images
CREATE OR REPLACE VIEW product_details AS
SELECT 
    p.product_id,
    p.name,
    p.short_des,
    p.long_des,
    p.actual_price,
    p.discount,
    p.selling_price,
    p.stock,
    p.tags,
    p.seller_email,
    s.business_name,
    p.created_at,
    ARRAY_AGG(pi.image_url) as images
FROM products p
LEFT JOIN sellers s ON p.seller_email = s.email
LEFT JOIN product_images pi ON p.product_id = pi.product_id
GROUP BY p.product_id, s.business_name;

-- View for order summary
CREATE OR REPLACE VIEW order_summary AS
SELECT 
    o.order_id,
    o.user_email,
    u.name as customer_name,
    o.order_date,
    o.total_cost,
    o.delivery_status,
    o.payment_method,
    CONCAT(o.address, ', ', o.street, ', ', o.city, ', ', o.state, ' - ', o.pincode) as full_address,
    COUNT(op.product_id) as total_items
FROM orders o
JOIN users u ON o.user_email = u.email
LEFT JOIN order_products op ON o.order_id = op.order_id
GROUP BY o.order_id, u.name;

-- View for seller statistics
CREATE OR REPLACE VIEW seller_stats AS
SELECT 
    s.email,
    s.business_name,
    s.address,
    s.phone_number,
    COUNT(p.product_id) as total_products,
    COALESCE(SUM(p.stock), 0) as total_stock,
    COALESCE(AVG(r.rating), 0) as avg_rating,
    COUNT(DISTINCT r.review_id) as total_reviews
FROM sellers s
LEFT JOIN products p ON s.email = p.seller_email
LEFT JOIN reviews r ON p.product_id = r.product_id
GROUP BY s.email, s.business_name, s.address, s.phone_number;