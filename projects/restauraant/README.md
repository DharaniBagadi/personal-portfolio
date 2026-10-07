# ⚜️ ROYAL FLAME — Luxury Restaurant Food-Ordering & Admin Management Platform

Welcome to **Royal Flame**, a full-stack luxury restaurant web application and enterprise administration portal. Crafted with an opulent obsidian and 24K polished gold aesthetic, this application provides an end-to-end e-commerce dining experience from menu browsing to banquet dispatch, customer notifications, and deep restaurant analytics.

---

## 💎 Complete Platform Highlights (Parts 1, 2, 3 & 4)

### 1. 🛡️ Authentication & Access Control (Part 1 & 4)
* **Customer & Admin Sign In / Sign Up**: Email, phone, password with role-based routing (`user` vs `admin`).
* **Security**: Passwords hashed with **bcrypt** (10 salt rounds), signed with **JWT (JSON Web Tokens)**.
* **Strict Admin Authorization**: Role-based access control middleware (`adminMiddleware.js`). Non-admin patrons attempting to access admin APIs or pages receive immediate `403 Forbidden` rejection.
* **Zero Password Exposure**: User retrieval endpoints strictly filter out sensitive password hashes (`-password`).

### 2. 📖 Menu Book, Search & Culinary Catalog (Part 2)
* **Comprehensive Categories**: Starters, Main Course, Biryani, Indian, Chinese, Italian, Burgers, Pizza, Desserts, Beverages, Vegetarian, Non-Vegetarian.
* **Multi-Attribute Search & Filter**: Real-time debounced search matching dish titles, descriptions, cuisines, and key ingredients (e.g. Saffron, Truffle).
* **Detailed Food Views**: Preparation times, calorie counts, spice levels, chef notes, allergen alerts, and related dish recommendations.
* **Ratings & Customer Reviews**: 5-star rating system with verified customer testimonials and automatic average score recalculation.
* **Persistent Wishlist**: Save favorite gourmet delicacies to MongoDB.

### 3. 🛒 Cart, Addresses, Checkout & Orders (Part 3)
* **MongoDB User Cart**: Add dishes, dynamically increment/decrement quantities, and compute subtotal, 5% GST, complimentary valet delivery, and promotional coupons.
* **Address Book**: Multi-address management with custom labels (Villa, Estate, Residence) and primary default address selection.
* **Express & Multi-Method Checkout**: Support for UPI, Credit/Debit Cards, Net Banking, and Cash on Delivery with mock payment verification.
* **Live Order Tracking**: Chronological status tracker (`Pending` → `Confirmed` → `Preparing` → `Ready` → `Out for Delivery` → `Delivered` → `Cancelled`).

### 4. 👑 Executive Admin Dashboard & Operations Suite (Part 4)
* **KPI Metrics & Quick Stats**: Total Users, Total Orders, Today's Orders, Total Revenue, Total Dishes, and Pending Orders with real-time counters.
* **Financial & Sales Charts**: Interactive Chart.js graphs for Monthly Revenue Dynamics (6-month trend), Daily Sales (7 days), Category distribution, and Order Status breakdown.
* **Food & Dish Management (`admin/dishes.html`)**: Add, Edit, and Delete dishes with category selection, price, discount %, veg/non-veg flag, prep time, calories, and ingredients.
* **Category Architecture (`admin/categories.html`)**: Create, calibrate, and delete menu categories with dynamic dish count tracking.
* **Order Dispatch Center (`admin/orders.html`)**: Supervise all patron orders, update kitchen progress in real-time, and trigger automatic customer notification alerts.
* **Patron & User Registry (`admin/users.html`)**: Inspect registered members, total order counts, lifetime spend, and toggle account activation or admin roles.
* **Review Moderation (`admin/reviews.html`)**: Curate guest reviews, filter inappropriate remarks, and trigger instant dish rating recalculation.
* **Deep Business Analytics (`admin/analytics.html`)**: Average Order Value (AOV), top delicacies, revenue drivers, and financial intelligence.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | HTML5, Vanilla CSS3 (Custom Luxury Design System), JavaScript (ES6+), Chart.js (CDN), FontAwesome 6 |
| **Backend** | Node.js, Express.js REST API |
| **Database** | MongoDB & Mongoose (with embedded MongoDB zero-config development fallback) |
| **Security** | JWT (`jsonwebtoken`), `bcryptjs`, CORS, Express input validation |
| **Typography** | Cinzel, Playfair Display, Outfit, Inter |

---

## 📂 Final Project Structure

```
restaurant-project/
├── frontend/
│   ├── admin/
│   │   ├── dashboard.html      # KPI cards, revenue charts, recent orders
│   │   ├── dishes.html         # Add, edit, delete dishes catalog
│   │   ├── categories.html     # Category grid & dish count manager
│   │   ├── orders.html         # Order status updater & notifications
│   │   ├── users.html          # User registry & activation toggles
│   │   ├── reviews.html        # Review moderation & deletion
│   │   └── analytics.html      # Deep financial analytics & AOV
│   ├── css/
│   │   ├── style.css           # Core luxury design system tokens
│   │   ├── login.css           # Auth page styling
│   │   ├── home.css            # Hero, carousels, dish cards
│   │   ├── menu.css            # Menu book & category filters
│   │   ├── product.css         # Single dish details & reviews
│   │   ├── wishlist.css        # Saved favorites styling
│   │   ├── cart.css            # Cart table & summary
│   │   ├── checkout.css        # Multi-step checkout & address picker
│   │   ├── payment.css         # Mock payment gateways
│   │   ├── orders.css          # Order timeline & invoice
│   │   ├── profile.css         # Patron profile & address book
│   │   └── admin.css           # Admin sidebar, tables, modals, charts
│   ├── js/
│   │   ├── auth.js             # Client login/signup/JWT logic
│   │   ├── home.js             # Homepage dynamic sections & search
│   │   ├── menu.js             # Menu book filtering & search
│   │   ├── product.js          # Dish details, reviews, related dishes
│   │   ├── wishlist.js         # Wishlist management
│   │   ├── cart.js             # Cart CRUD operations & totals
│   │   ├── checkout.js         # Address selection & checkout calculation
│   │   ├── payment.js          # Payment simulation & order submission
│   │   ├── orders.js           # Order history & live status tracking
│   │   ├── profile.js          # Patron profile & notifications
│   │   └── admin.js            # Master Admin suite & Chart.js engine
│   ├── index.html              # Entrypoint router
│   ├── login.html              # Customer & Admin authentication
│   ├── home.html               # Main restaurant showcase
│   ├── menu.html               # Full menu book catalog
│   ├── dish-details.html       # Single dish page
│   ├── wishlist.html           # Patron saved items
│   ├── cart.html               # Dining cart
│   ├── checkout.html           # Delivery address & bill breakdown
│   ├── payment.html            # Payment settlement
│   ├── orders.html             # Order history
│   ├── order-details.html      # Single order invoice & tracking
│   ├── profile.html            # Patron account & address book
│   └── messages.html           # Real-time customer notifications center
├── backend/
│   ├── config/
│   │   └── database.js         # MongoDB connection with embedded fallback
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT authentication verification
│   │   └── adminMiddleware.js  # Role: admin authorization gate
│   ├── models/
│   │   ├── User.js             # User schema with bcrypt password hashing
│   │   ├── Dish.js             # Dish schema with ratings, tags, cuisine
│   │   ├── Category.js         # Category schema with display order
│   │   ├── Review.js           # Review schema with 1-5 rating & comments
│   │   ├── Order.js            # Order schema with items, status, address
│   │   └── Notification.js     # Real-time customer notification schema
│   ├── routes/
│   │   ├── authRoutes.js       # Signup, Login, Me, Profile, Addresses
│   │   ├── dishRoutes.js       # Menu listing, search, sections, single dish
│   │   ├── categoryRoutes.js   # Public categories & dish count aggregation
│   │   ├── wishlistRoutes.js   # Patron wishlist add/remove/list
│   │   ├── cartRoutes.js       # MongoDB Cart add/update/delete/clear
│   │   ├── reviewRoutes.js     # Public & customer review endpoints
│   │   ├── orderRoutes.js      # Order placement, history, tracking
│   │   ├── notificationRoutes.js # Customer notification alerts
│   │   └── adminRoutes.js      # Protected Admin Suite (Analytics, CRUD)
│   ├── seed.js                 # 25+ Gourmet dishes & demo accounts
│   └── server.js               # Express server entrypoint & static routing
├── test_api.js                 # Part 1 test suite
├── test_part2.js               # Part 2 test suite
├── test_part3.js               # Part 3 test suite
├── test_part4.js               # Part 4 admin integration test suite
├── package.json
├── .env.example
├── .env
└── README.md
```

---

## 🔑 Pre-Configured Demo Accounts

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Executive Admin** | `admin@royalflame.com` | `Admin@123456` | Full Admin Dashboard, Food Management, Categories, Orders, Users, Reviews, Analytics |
| **Royal Patron** | `customer@royalflame.com` | `User@123456` | Storefront, Menu Book, Cart, Checkout, Order History, Profile, Notifications |

---

## 🚀 Step-by-Step Installation & Setup

### 1. Prerequisites
* **Node.js** (v18.x or higher)
* **npm** (v9.x or higher)
* Optional: Local MongoDB Server (If MongoDB is not running, the application automatically launches an embedded memory database for seamless zero-config local testing).

### 2. Install Dependencies
```bash
cd restauraant
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` configuration:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/royal_flame
JWT_SECRET=royal_flame_super_secret_jwt_key_2026_fine_dining
NODE_ENV=development
```

### 4. Start the Application
```bash
node backend/server.js
```
The server will start on: `http://localhost:5000`

### 5. Access the Web Application
* **Storefront Home**: [http://localhost:5000/home.html](http://localhost:5000/home.html)
* **Menu Book**: [http://localhost:5000/menu.html](http://localhost:5000/menu.html)
* **Login / Sign Up**: [http://localhost:5000/login.html](http://localhost:5000/login.html)
* **Admin Dashboard**: [http://localhost:5000/admin/dashboard.html](http://localhost:5000/admin/dashboard.html)
* **Patron Profile**: [http://localhost:5000/profile.html](http://localhost:5000/profile.html)
* **Customer Notifications**: [http://localhost:5000/messages.html](http://localhost:5000/messages.html)

---

## 🧪 Verification & Automated Testing

Run the integration test suites across all 4 parts:

```bash
# Part 1: Authentication & Basic Dish APIs
node test_api.js

# Part 2: Menu Book, Search, Reviews & Wishlist
node test_part2.js

# Part 3: Cart, Addresses, Checkout, Payment & Orders
node test_part3.js

# Part 4: Admin Dashboard, Food CRUD, Category CRUD, Order Progression & Analytics
node test_part4.js
```

---

## 📡 REST API Reference

### Public Endpoints
* `GET /api/health` — Health check status
* `POST /api/auth/register` — Register a new customer
* `POST /api/auth/login` — Sign in and receive JWT
* `GET /api/dishes` — List dishes with category, dietary, spice, and rating filters
* `GET /api/dishes/search?q=query` — Multi-field search
* `GET /api/dishes/sections` — Curated homepage carousels
* `GET /api/dishes/:id` — Single dish details
* `GET /api/dishes/:id/related` — Related delicacies
* `GET /api/categories` — Active categories with dynamic dish counts
* `GET /api/reviews/dish/:dishId` — Customer reviews for a dish

### Authenticated Patron Endpoints (`Bearer <token>`)
* `GET /api/auth/me` — Authenticated profile
* `PUT /api/auth/profile` — Update name & phone
* `POST /api/auth/addresses` — Add delivery address
* `PUT /api/auth/addresses/:id/default` — Set primary address
* `DELETE /api/auth/addresses/:id` — Delete address
* `GET /api/cart` — Retrieve user's MongoDB cart
* `POST /api/cart` — Add dish to cart
* `PUT /api/cart/:itemId` — Update quantity
* `DELETE /api/cart/:itemId` — Remove item from cart
* `DELETE /api/cart` — Clear cart
* `GET /api/wishlist` — Retrieve wishlist
* `POST /api/wishlist/:dishId` — Toggle item in wishlist
* `POST /api/orders` — Submit banquet order
* `GET /api/orders/my-orders` — Patron order history
* `GET /api/orders/:id` — Single order tracking & invoice
* `POST /api/reviews` — Submit a dish review
* `GET /api/notifications` — Customer kitchen alerts & status updates
* `PUT /api/notifications/read-all` — Mark all alerts as read

### Protected Admin Endpoints (`Role: admin`)
* `GET /api/admin/analytics` — Revenue, sales charts, popular dishes, and AOV
* `POST /api/admin/dishes` — Create a new dish
* `PUT /api/admin/dishes/:id` — Edit existing dish details
* `DELETE /api/admin/dishes/:id` — Delete dish from catalog
* `POST /api/admin/categories` — Create culinary category
* `PUT /api/admin/categories/:id` — Edit category
* `DELETE /api/admin/categories/:id` — Delete category
* `GET /api/admin/orders` — List all orders across all patrons
* `PUT /api/admin/orders/:id` — Update order status (triggers customer alert)
* `GET /api/admin/users` — List registered patrons (passwords hidden)
* `PUT /api/admin/users/:id` — Toggle user activation or role
* `GET /api/admin/reviews` — Moderate guest reviews
* `DELETE /api/admin/reviews/:id` — Delete review & recalculate dish rating

---

## 👑 Royal Flame Luxury Design Philosophy
* **Palette**: Midnight Obsidian (`#08080a`), Charcoal (`#121217`), 24K Gold (`#d4af37`), Champagne Cream (`#f5e7a9`), Warm Amber (`#996515`).
* **Visuals**: Radial gold lighting, glassmorphic backdrop blurs (`backdrop-filter: blur(14px)`), smooth CSS transitions, interactive Chart.js visualizations.
* **Micro-interactions**: Hover lifts, gold border glows, custom scrollbars, animated loading skeletons, and floating status toasts.
