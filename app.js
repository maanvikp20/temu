import express from "express";
import expressLayouts from "express-ejs-layouts";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret-change-this',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

app.use(express.static(path.join(__dirname, "public")));

// Load product data with error handling
const dataPath = path.join(__dirname, "data", "products.json");
let jsonData;

try {
  jsonData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  console.log('✓ Product data loaded successfully');
} catch (error) {
  console.error('✗ Failed to load products.json:', error.message);
  process.exit(1);
}

// Middleware to initialize cart and pass to all views
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  // Calculate total items in cart (sum of quantities)
  res.locals.cartCount = req.session.cart.reduce((sum, item) => sum + item.quantity, 0);
  res.locals.cart = req.session.cart;
  next();
});

// Home route
app.get("/", (req, res) => {
  res.render("index", {
    title: "Temu Tech Store",
    items: jsonData.items,
  });
});

// Search route
app.get("/search", (req, res) => {
  const query = req.query.query || "";
  const searchTerm = query.toLowerCase().trim();
  
  let filteredItems = jsonData.items;
  
  if (searchTerm) {
    filteredItems = jsonData.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      (item.description && item.description.toLowerCase().includes(searchTerm))
    );
  }
  
  res.render("search", {
    title: `Search Results for "${query}"`,
    items: filteredItems,
    query: query,
    resultCount: filteredItems.length
  });
});

// Bestsellers route
app.get("/bestsellers", (req, res) => {
  res.render("bestsellers", {
    title: "Best-Selling Items",
    items: jsonData.items.filter(item => item.isBestSeller),
  });
});

// Five star items route
app.get("/fivestaritems", (req, res) => {
  res.render("fivestaritems", {
    title: "Five Star Items",
    items: jsonData.items.filter(item => item.rating === 5),
  });
});

// Early Black Friday route
app.get("/earlyblackfriday", (req, res) => {
  res.render("earlyblackfriday", {
    title: "Early Black Friday Deals",
    items: jsonData.items.filter(item => 
      item.price < 50 && item.inStock && item.blackFridayDeal === true
    ),
  });
});

// Support route
app.get("/support", (req, res) => {
  res.render("support", {
    title: "Customer Support",
  });
});

// Cart routes
app.get("/cart", (req, res) => {
  const cartItems = req.session.cart.map(cartItem => {
    const product = jsonData.items.find(item => item.id === cartItem.id);
    return {
      ...product,
      quantity: cartItem.quantity
    };
  });
  
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  res.render("cart", {
    title: "Shopping Cart",
    cartItems: cartItems,
    total: total.toFixed(2)
  });
});

// Add to cart API
app.post("/api/cart/add", (req, res) => {
  const { productId } = req.body;
  
  const product = jsonData.items.find(item => item.id === parseInt(productId));
  
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  
  if (!product.inStock) {
    return res.status(400).json({ success: false, message: "Product out of stock" });
  }
  
  const existingItem = req.session.cart.find(item => item.id === parseInt(productId));
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    req.session.cart.push({
      id: parseInt(productId),
      quantity: 1
    });
  }
  
  res.json({ 
    success: true, 
    message: "Product added to cart",
    cartCount: req.session.cart.reduce((sum, item) => sum + item.quantity, 0)
  });
});

// Update cart quantity API
app.post("/api/cart/update", (req, res) => {
  const { productId, quantity } = req.body;
  
  const cartItem = req.session.cart.find(item => item.id === parseInt(productId));
  
  if (cartItem) {
    if (quantity <= 0) {
      req.session.cart = req.session.cart.filter(item => item.id !== parseInt(productId));
    } else {
      cartItem.quantity = parseInt(quantity);
    }
  }
  
  res.json({ 
    success: true,
    cartCount: req.session.cart.reduce((sum, item) => sum + item.quantity, 0)
  });
});

// Remove from cart API
app.post("/api/cart/remove", (req, res) => {
  const { productId } = req.body;
  
  req.session.cart = req.session.cart.filter(item => item.id !== parseInt(productId));
  
  res.json({ 
    success: true,
    cartCount: req.session.cart.reduce((sum, item) => sum + item.quantity, 0)
  });
});

// Clear cart API
app.post("/api/cart/clear", (req, res) => {
  req.session.cart = [];
  
  res.json({ 
    success: true,
    cartCount: 0
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('404 - Page Not Found');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('500 - Internal Server Error');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});