const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 8080;
const JWT_SECRET = 'mock-secret-key';

app.use(cors());
app.use(express.json());

// Mock database
const users = [];
const products = [
  {
    id: 1,
    name: "Eco-Friendly Water Bottle",
    description: "Reusable stainless steel water bottle",
    price: "25.99",
    imageUrl: null,
    co2SavedPerUnit: "2.5",
    ecoRating: "A+",
    stock: 50,
    categoryId: 1,
    sellerId: 1
  },
  {
    id: 2,
    name: "Solar Phone Charger",
    description: "Portable solar-powered phone charger",
    price: "49.99",
    imageUrl: null,
    co2SavedPerUnit: "5.0",
    ecoRating: "A",
    stock: 25,
    categoryId: 2,
    sellerId: 1
  }
];

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, phoneNumber, password, firstName, lastName } = req.body;
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email || u.phoneNumber === phoneNumber);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
      id: Date.now().toString(),
      email,
      phoneNumber,
      firstName,
      lastName,
      password: hashedPassword,
      totalPoints: 0,
      co2Saved: "0.0",
      createdAt: new Date()
    };
    
    users.push(user);
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        totalPoints: user.totalPoints,
        co2Saved: user.co2Saved
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    
    // Find user
    const user = users.find(u => 
      u.email === emailOrPhone || u.phoneNumber === emailOrPhone
    );
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        totalPoints: user.totalPoints,
        co2Saved: user.co2Saved
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/user', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json({
    id: user.id,
    email: user.email,
    phoneNumber: user.phoneNumber,
    firstName: user.firstName,
    lastName: user.lastName,
    totalPoints: user.totalPoints,
    co2Saved: user.co2Saved
  });
});

// Product routes
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

// Stats routes
app.get('/api/stats/global', (req, res) => {
  res.json({
    totalCo2Saved: "1250.5",
    treesPlanted: 125,
    activeUsers: users.length
  });
});

app.get('/api/stats/user', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  res.json({
    totalCo2Saved: user?.co2Saved || "0.0",
    totalPoints: user?.totalPoints || 0
  });
});

app.listen(PORT, () => {
  console.log(`Mock backend running on port ${PORT}`);
});