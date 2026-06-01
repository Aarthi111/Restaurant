CREATE DATABASE IF NOT EXISTS restaurant_db;
USE restaurant_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(15) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tables_list (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_number INT UNIQUE NOT NULL,
  is_occupied BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id INT,
  is_available BOOLEAN DEFAULT TRUE,
  is_veg BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  table_number INT NOT NULL,
  status ENUM('pending','confirmed','preparing','served') DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  quantity INT NOT NULL,
  price_at_time DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Seed tables
INSERT IGNORE INTO tables_list (table_number) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10);

-- Seed categories
INSERT IGNORE INTO categories (id, name) VALUES
(1, 'Starters'),
(2, 'Main Course'),
(3, 'Breads'),
(4, 'Rice & Biryani'),
(5, 'Desserts'),
(6, 'Drinks');

-- Seed menu items
INSERT IGNORE INTO menu_items (name, description, price, category_id, is_veg) VALUES
('Veg Spring Roll', 'Crispy rolls with mixed vegetables', 120.00, 1, TRUE),
('Paneer Tikka', 'Grilled cottage cheese with spices', 180.00, 1, TRUE),
('Chicken 65', 'Spicy deep fried chicken', 200.00, 1, FALSE),
('Soup of the Day', 'Ask server for today''s soup', 90.00, 1, TRUE),

('Paneer Butter Masala', 'Cottage cheese in rich tomato gravy', 220.00, 2, TRUE),
('Dal Tadka', 'Yellow lentils with tempering', 160.00, 2, TRUE),
('Chicken Curry', 'Home style chicken curry', 250.00, 2, FALSE),
('Palak Paneer', 'Spinach and cottage cheese curry', 210.00, 2, TRUE),
('Mutton Rogan Josh', 'Slow cooked mutton in Kashmiri spices', 320.00, 2, FALSE),

('Tandoori Roti', 'Whole wheat bread from tandoor', 30.00, 3, TRUE),
('Butter Naan', 'Soft leavened bread with butter', 40.00, 3, TRUE),
('Paratha', 'Layered whole wheat flatbread', 50.00, 3, TRUE),

('Steamed Rice', 'Plain basmati rice', 80.00, 4, TRUE),
('Veg Biryani', 'Fragrant rice with vegetables', 180.00, 4, TRUE),
('Chicken Biryani', 'Aromatic rice with chicken', 260.00, 4, FALSE),

('Gulab Jamun', 'Soft dumplings in sugar syrup (2 pcs)', 80.00, 5, TRUE),
('Ice Cream', 'Vanilla / Chocolate / Strawberry', 90.00, 5, TRUE),
('Kheer', 'Rice pudding with dry fruits', 100.00, 5, TRUE),

('Water Bottle', '1 litre', 20.00, 6, TRUE),
('Soft Drink', 'Coke / Pepsi / Sprite', 50.00, 6, TRUE),
('Fresh Lime Soda', 'Sweet or salted', 60.00, 6, TRUE),
('Lassi', 'Sweet or salted yogurt drink', 80.00, 6, TRUE);

-- Food likes
CREATE TABLE IF NOT EXISTS food_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_like (user_id, menu_item_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Food reviews (only after ordering)
CREATE TABLE IF NOT EXISTS food_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  order_id INT NOT NULL,
  stars TINYINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_review (user_id, menu_item_id, order_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
