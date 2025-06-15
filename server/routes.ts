import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { db } from "./db";
import { categories as categoriesTable, sellers as sellersTable, products as productsTable, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  insertSellerSchema,
  insertProductSchema,
  insertCartSchema,
  insertOrderSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Seed initial data
  await seedData();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Customer APIs
  app.get('/api/products', async (req, res) => {
    try {
      const { category, seller, priceMin, priceMax } = req.query;
      const filters: any = {};
      
      if (category) filters.categoryId = parseInt(category as string);
      if (seller) filters.sellerId = parseInt(seller as string);
      if (priceMin && priceMax) {
        filters.priceRange = [parseFloat(priceMin as string), parseFloat(priceMax as string)];
      }

      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProduct(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartData = insertCartSchema.parse({ ...req.body, userId });
      const cartItem = await storage.addToCart(cartData);
      res.json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.get('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.put('/api/cart/:productId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = parseInt(req.params.productId);
      const { quantity } = req.body;
      await storage.updateCartItem(userId, productId, quantity);
      res.json({ message: "Cart updated successfully" });
    } catch (error) {
      console.error("Error updating cart:", error);
      res.status(500).json({ message: "Failed to update cart" });
    }
  });

  app.delete('/api/cart/:productId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = parseInt(req.params.productId);
      await storage.removeFromCart(userId, productId);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  app.post('/api/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { shippingAddress, paymentMethod } = req.body;

      // Get cart items
      const cartItems = await storage.getCartItems(userId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Calculate totals
      const totalAmount = cartItems.reduce((sum, item) => 
        sum + (parseFloat(item.product.price) * item.quantity), 0
      ).toFixed(2);
      
      const totalCo2Saved = cartItems.reduce((sum, item) => 
        sum + (parseFloat(item.product.co2SavedPerUnit) * item.quantity), 0
      ).toFixed(2);

      // Create order
      const orderData = insertOrderSchema.parse({
        userId,
        totalAmount,
        totalCo2Saved,
        status: "pending",
        shippingAddress,
        paymentMethod,
      });

      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
        co2Saved: (parseFloat(item.product.co2SavedPerUnit) * item.quantity).toFixed(2),
        orderId: 0, // Will be set by storage.createOrder
      }));

      const order = await storage.createOrder(orderData, orderItems);

      // Update user points and CO2 stats
      const pointsEarned = Math.floor(parseFloat(totalCo2Saved));
      await storage.updateUserPoints(userId, pointsEarned, totalCo2Saved);

      // Create CO2 contribution record
      await storage.createCo2Contribution({
        userId,
        orderId: order.id,
        co2Amount: totalCo2Saved,
        pointsEarned,
      });

      // Clear cart
      await storage.clearCart(userId);

      res.json({ 
        message: "Order placed successfully", 
        orderId: order.id,
        pointsEarned,
        co2Saved: totalCo2Saved 
      });
    } catch (error) {
      console.error("Error processing checkout:", error);
      res.status(500).json({ message: "Failed to process checkout" });
    }
  });

  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Seller APIs
  app.post('/api/sellers/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sellerData = insertSellerSchema.parse({ ...req.body, userId });
      const seller = await storage.createSeller(sellerData);
      res.json(seller);
    } catch (error) {
      console.error("Error registering seller:", error);
      res.status(500).json({ message: "Failed to register seller" });
    }
  });

  app.get('/api/sellers/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const seller = await storage.getSellerByUserId(userId);
      res.json(seller);
    } catch (error) {
      console.error("Error fetching seller profile:", error);
      res.status(500).json({ message: "Failed to fetch seller profile" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const seller = await storage.getSellerByUserId(userId);
      
      if (!seller) {
        return res.status(403).json({ message: "Not registered as seller" });
      }

      const productData = insertProductSchema.parse({ ...req.body, sellerId: seller.id });
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.get('/api/seller/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const seller = await storage.getSellerByUserId(userId);
      
      if (!seller) {
        return res.status(403).json({ message: "Not registered as seller" });
      }

      const products = await storage.getProductsBySeller(seller.id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching seller products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/seller/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const seller = await storage.getSellerByUserId(userId);
      
      if (!seller) {
        return res.status(403).json({ message: "Not registered as seller" });
      }

      const orders = await storage.getOrdersBySeller(seller.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching seller orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.put('/api/orders/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      const orderId = parseInt(req.params.id);
      await storage.updateOrderStatus(orderId, status);
      res.json({ message: "Order status updated" });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Stats APIs
  app.get('/api/stats/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserCo2Stats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get('/api/stats/global', async (req, res) => {
    try {
      const stats = await storage.getGlobalCo2Stats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching global stats:", error);
      res.status(500).json({ message: "Failed to fetch global stats" });
    }
  });

  app.get('/api/stats/company', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user.claims.email;
      if (!userEmail) {
        return res.status(400).json({ message: "Email not available" });
      }
      
      const domain = userEmail.split('@')[1];
      const stats = await storage.getCompanyCo2Stats(domain);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching company stats:", error);
      res.status(500).json({ message: "Failed to fetch company stats" });
    }
  });

  // Seller registration endpoint
  app.post('/api/sellers/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;
      
      // Check if user is already a seller
      const existingSeller = await storage.getSellerByUserId(userId);
      if (existingSeller) {
        return res.status(400).json({ message: "User is already registered as a seller" });
      }

      const result = insertSellerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid seller data", errors: result.error.errors });
      }

      const seller = await storage.createSeller({
        ...result.data,
        userId,
        isVerified: false // New sellers need verification
      });

      res.status(201).json(seller);
    } catch (error) {
      console.error("Error registering seller:", error);
      res.status(500).json({ message: "Failed to register seller" });
    }
  });

  // Seller API endpoints
  app.get('/api/sellers/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const seller = await storage.getSellerByUserId(userId);
      if (!seller) {
        return res.status(404).json({ message: "Not registered as a seller" });
      }
      res.json(seller);
    } catch (error) {
      console.error("Error fetching seller profile:", error);
      res.status(500).json({ message: "Failed to fetch seller profile" });
    }
  });

  app.get('/api/sellers/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const seller = await storage.getSellerByUserId(userId);
      if (!seller) {
        return res.status(404).json({ message: "Seller profile not found" });
      }
      const products = await storage.getProductsBySeller(seller.id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching seller products:", error);
      res.status(500).json({ message: "Failed to fetch seller products" });
    }
  });

  app.post('/api/sellers/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const seller = await storage.getSellerByUserId(userId);
      if (!seller) {
        return res.status(404).json({ message: "Seller profile not found" });
      }

      const result = insertProductSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid product data", errors: result.error.errors });
      }

      const product = await storage.createProduct({
        ...result.data,
        sellerId: seller.id,
        isActive: true,
        isVerified: false // New products need verification
      });

      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch('/api/sellers/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const seller = await storage.getSellerByUserId(userId);
      if (!seller) {
        return res.status(404).json({ message: "Seller profile not found" });
      }

      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      if (!product || product.sellerId !== seller.id) {
        return res.status(404).json({ message: "Product not found" });
      }

      const result = insertProductSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid product data", errors: result.error.errors });
      }

      await storage.updateProduct(productId, result.data);
      res.json({ message: "Product updated successfully" });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/sellers/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const seller = await storage.getSellerByUserId(userId);
      if (!seller) {
        return res.status(404).json({ message: "Seller profile not found" });
      }

      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      if (!product || product.sellerId !== seller.id) {
        return res.status(404).json({ message: "Product not found" });
      }

      await storage.deleteProduct(productId);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.get('/api/sellers/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const seller = await storage.getSellerByUserId(userId);
      if (!seller) {
        return res.status(404).json({ message: "Seller profile not found" });
      }
      const orders = await storage.getOrdersBySeller(seller.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching seller orders:", error);
      res.status(500).json({ message: "Failed to fetch seller orders" });
    }
  });

  // Product verification endpoint (for admin use)
  app.post('/api/admin/verify-product/:id', isAuthenticated, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { approved, notes } = req.body;
      
      await storage.verifyProduct(productId, approved, notes || "");
      res.json({ message: "Product verification updated successfully" });
    } catch (error) {
      console.error("Error verifying product:", error);
      res.status(500).json({ message: "Failed to verify product" });
    }
  });

  // Company API routes
  app.get('/api/company/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      
      if (!company) {
        // Create a default company based on user's email domain
        const userEmail = req.user.claims.email;
        if (!userEmail) {
          return res.status(400).json({ message: "Email not available" });
        }
        
        const domain = userEmail.split('@')[1];
        let existingCompany = await storage.getCompanyByDomain(domain);
        
        if (!existingCompany) {
          // Create new company
          existingCompany = await storage.createCompany({
            name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
            domain: domain,
            industry: "Technology",
          });
        }
        
        // Associate user with company
        await storage.addEmployeeToCompany(userId, existingCompany.id);
        return res.json(existingCompany);
      }
      
      res.json(company);
    } catch (error) {
      console.error("Error fetching company profile:", error);
      res.status(500).json({ message: "Failed to fetch company profile" });
    }
  });

  app.get('/api/company/employees/:timeRange?', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      const employees = await storage.getCompanyEmployees(company.id);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching company employees:", error);
      res.status(500).json({ message: "Failed to fetch company employees" });
    }
  });

  app.get('/api/company/stats/:timeRange?', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      const stats = await storage.getCompanyStats(company.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching company stats:", error);
      res.status(500).json({ message: "Failed to fetch company stats" });
    }
  });

  app.get('/api/company/points-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      const history = await storage.getCompanyPointsHistory(company.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching company points history:", error);
      res.status(500).json({ message: "Failed to fetch company points history" });
    }
  });

  app.post('/api/company/employees', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Find user by email
      const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (userResult.length === 0) {
        return res.status(404).json({ message: "User with this email not found" });
      }
      
      const foundUser = userResult[0];
      
      // Check if user already belongs to a company
      if (foundUser.companyId && foundUser.companyId !== company.id) {
        return res.status(400).json({ message: "User already belongs to another company" });
      }
      
      // Add employee to company
      await storage.addEmployeeToCompany(foundUser.id, company.id);
      res.json({ message: "Employee added successfully" });
    } catch (error) {
      console.error("Error adding employee:", error);
      res.status(500).json({ message: "Failed to add employee" });
    }
  });

  app.post('/api/company/redeem-points', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { points, action } = req.body;
      
      if (!points || points < 100) {
        return res.status(400).json({ message: "Minimum 100 points required for redemption" });
      }
      
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      if ((company.totalPoints || 0) < points) {
        return res.status(400).json({ message: "Insufficient points" });
      }
      
      const description = action === 'plant_trees' 
        ? `Redeemed ${points} points to plant ${Math.floor(points / 20)} trees`
        : `Redeemed ${points} points`;
      
      await storage.redeemCompanyPoints(company.id, points, description);
      res.json({ message: "Points redeemed successfully" });
    } catch (error) {
      console.error("Error redeeming points:", error);
      res.status(500).json({ message: "Failed to redeem points" });
    }
  });

  // Points donation
  app.post('/api/donate-points', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { points } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user || (user.totalPoints || 0) < points) {
        return res.status(400).json({ message: "Insufficient points" });
      }

      // Deduct points (mock tree planting)
      await storage.updateUserPoints(userId, -points, "0");
      
      const treesPlanted = Math.floor(points / 50); // 50 points = 1 tree
      res.json({ 
        message: `Successfully donated ${points} points to plant ${treesPlanted} trees!`,
        treesPlanted 
      });
    } catch (error) {
      console.error("Error donating points:", error);
      res.status(500).json({ message: "Failed to donate points" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function seedData() {
  try {
    const categories = await storage.getCategories();
    if (categories.length === 0) {
      // Seed categories
      const categoryData = await db.insert(categoriesTable).values([
        { name: "Eco-Friendly Home", icon: "🏠" },
        { name: "Sustainable Fashion", icon: "👕" },
        { name: "Natural Beauty", icon: "💄" },
        { name: "Organic Food", icon: "🥗" },
        { name: "Green Electronics", icon: "📱" },
        { name: "Zero Waste", icon: "♻️" }
      ]).returning();

      // Create a sample user for the seller
      const sampleUser = await storage.upsertUser({
        id: "sample-seller-user",
        email: "seller@ecofarm.com",
        firstName: "John",
        lastName: "Green",
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"
      });

      // Create a sample seller
      const sampleSeller = await db.insert(sellersTable).values({
        userId: sampleUser.id,
        businessName: "EcoFarm Co.",
        certificationType: "organic",
        isVerified: true
      }).returning();

      // Seed products
      await db.insert(productsTable).values([
        {
          sellerId: sampleSeller[0].id,
          categoryId: categoryData[0].id, // Eco-Friendly Home
          name: "Bamboo Toothbrush Set",
          description: "Biodegradable bamboo toothbrushes with soft bristles. Plastic-free packaging.",
          price: "12.99",
          co2SavedPerUnit: "2.5",
          stock: 50,
          isActive: true,
          imageUrl: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400"
        },
        {
          sellerId: sampleSeller[0].id,
          categoryId: categoryData[0].id, // Eco-Friendly Home
          name: "Reusable Glass Straws",
          description: "Set of 4 borosilicate glass straws with cleaning brush. Dishwasher safe.",
          price: "15.99",
          co2SavedPerUnit: "3.2",
          stock: 35,
          isActive: true,
          imageUrl: "https://images.unsplash.com/photo-1543286386-2e659306cd6c?w=400"
        },
        {
          sellerId: sampleSeller[0].id,
          categoryId: categoryData[1].id, // Sustainable Fashion
          name: "Organic Cotton T-Shirt",
          description: "100% organic cotton t-shirt, fair trade certified. Available in multiple colors.",
          price: "24.99",
          co2SavedPerUnit: "4.8",
          stock: 25,
          isActive: true,
          imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"
        },
        {
          sellerId: sampleSeller[0].id,
          categoryId: categoryData[2].id, // Natural Beauty
          name: "Natural Lip Balm Set",
          description: "Set of 3 organic lip balms with beeswax and essential oils. Zero waste packaging.",
          price: "18.99",
          co2SavedPerUnit: "1.8",
          stock: 40,
          isActive: true,
          imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"
        },
        {
          sellerId: sampleSeller[0].id,
          categoryId: categoryData[3].id, // Organic Food
          name: "Organic Quinoa (2lb)",
          description: "Certified organic quinoa from sustainable farms. High protein superfood.",
          price: "16.99",
          co2SavedPerUnit: "6.2",
          stock: 30,
          isActive: true,
          imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400"
        },
        {
          sellerId: sampleSeller[0].id,
          categoryId: categoryData[4].id, // Green Electronics
          name: "Solar Power Bank",
          description: "10,000mAh solar-powered portable charger. Waterproof and dustproof design.",
          price: "45.99",
          co2SavedPerUnit: "8.7",
          stock: 15,
          isActive: true,
          imageUrl: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400"
        },
        {
          sellerId: sampleSeller[0].id,
          categoryId: categoryData[5].id, // Zero Waste
          name: "Beeswax Food Wraps",
          description: "Set of 3 reusable beeswax wraps. Replace plastic wrap with this natural alternative.",
          price: "22.99",
          co2SavedPerUnit: "5.4",
          stock: 45,
          isActive: true,
          imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"
        },
        {
          sellerId: sampleSeller[0].id,
          categoryId: categoryData[0].id, // Eco-Friendly Home
          name: "Coconut Fiber Dish Scrubber",
          description: "Natural coconut fiber scrubber. Biodegradable alternative to plastic sponges.",
          price: "8.99",
          co2SavedPerUnit: "1.2",
          stock: 60,
          isActive: true,
          imageUrl: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400"
        },
        {
          sellerId: sampleSeller[0].id,
          categoryId: categoryData[1].id, // Sustainable Fashion
          name: "Hemp Canvas Backpack",
          description: "Durable hemp canvas backpack with leather straps. Eco-friendly travel companion.",
          price: "79.99",
          co2SavedPerUnit: "12.3",
          stock: 20,
          isActive: true,
          imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"
        },
        {
          sellerId: sampleSeller[0].id,
          categoryId: categoryData[2].id, // Natural Beauty
          name: "Shampoo Bar - Lavender",
          description: "Zero-waste shampoo bar with organic lavender. Plastic-free and sulfate-free.",
          price: "12.99",
          co2SavedPerUnit: "3.7",
          stock: 55,
          isActive: true,
          imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400"
        }
      ]);

      console.log("✅ Database seeded with categories, seller, and products");
    }
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}
