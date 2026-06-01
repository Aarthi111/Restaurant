# Restaurant Ordering System

A simple full-stack restaurant ordering app built with HTML, CSS, JS, Express and MySQL.

## Flow
Login (Phone + OTP) → Enter Table Number → Browse Menu → Cart & Bill → Place Order → Rate Your Order

## Features
- Phone + OTP login with JWT auth
- Browse menu by category with veg/non-veg indicator
- Like food items (toggle ♥)
- View ratings and reviews per item (tap item name)
- Add to cart, adjust quantities
- Bill with 5% tax breakdown
- Place order (prices verified server-side)
- Rate ordered items (verified purchase only)
- Dark / Light mode toggle (remembered across sessions)
- Auto redirect to login on token expiry

---

## Setup

### 1. MySQL — Create database and tables

Open MySQL and run:
```sql
CREATE DATABASE IF NOT EXISTS restaurant_db;
USE restaurant_db;
source /full/path/to/restaurant-app/database/schema.sql
```

Or paste the schema file contents directly into MySQL.

### 2. Configure .env

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=restaurant_db
JWT_SECRET=change_this_to_any_long_random_string
PORT=3000
TAX_PERCENT=5
```

### 3. Install & Run

```bash
npm install
npm run dev     # development with auto-reload
npm start       # production
```

Open: http://localhost:3000

---

## New Tables (run in MySQL if upgrading)
```sql
USE restaurant_db;

CREATE TABLE IF NOT EXISTS food_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_like (user_id, menu_item_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

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
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/send-otp | No | Send OTP to phone |
| POST | /api/auth/verify-otp | No | Verify OTP, get JWT |
| GET | /api/menu | No | Full menu |
| GET | /api/menu/validate-table/:n | No | Check table exists |
| POST | /api/orders | Yes | Place order |
| GET | /api/orders/:id | Yes | Get order details |
| POST | /api/reviews/like/:item_id | Yes | Toggle like on item |
| GET | /api/reviews/likes?item_ids=1,2 | Yes | Get like counts |
| POST | /api/reviews | Yes | Submit review (verified purchase) |
| GET | /api/reviews/:item_id | No | Get reviews for item |

---

## OTP in Development
OTPs print to the server console and are returned in the API response as `otp_preview`.
The login page auto-fills OTP digits in development.
To use real SMS, add Twilio/MSG91 in `backend/routes/auth.js`.
