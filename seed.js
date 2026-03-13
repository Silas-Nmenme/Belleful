#!/usr/bin/env node
/**
 * Belleful Demo Data Seeder
 * Run: node seed.js
 * Creates: 10 menu items, 1 admin user (if none exists)
 */

const mongoose = require('mongoose');
require('dotenv').config();
const MenuItem = require('./models/MenuItem');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Clear existing menu
    await MenuItem.deleteMany({});
    console.log('🧹 Cleared existing menu');
    
    // Create demo menu items
    const demoMenu = [
      { name: 'Jollof Rice + Chicken', category: 'food', price: 2500, description: 'Spicy Nigerian jollof with grilled chicken', available: true },
      { name: 'Pounded Yam + Egusi Soup', category: 'food', price: 3000, description: 'Smooth pounded yam with rich egusi', available: true },
      { name: 'Fried Rice + Beef', category: 'food', price: 2200, description: 'Vegetable fried rice with succulent beef', available: true },
      { name: 'Moi Moi + Pap', category: 'food', price: 1200, description: 'Steamed bean pudding with pap', available: true },
      { name: 'Pepper Soup', category: 'food', price: 1800, description: 'Spicy goat meat pepper soup', available: true },
      { name: 'Chapman Drink', category: 'drink', price: 800, description: 'Refreshing spicy ginger lemonade', available: true },
      { name: 'Fresh Orange Juice', category: 'drink', price: 700, description: 'Pure squeezed orange juice', available: true },
      { name: 'Plantain Chips', category: 'side', price: 500, description: 'Crispy fried plantain chips', available: true },
      { name: 'Suya', category: 'side', price: 1500, description: 'Spicy grilled beef suya', available: true }
    ];

    const menuItems = await MenuItem.insertMany(demoMenu);
    console.log(`✅ Added ${menuItems.length} demo menu items`);

    // Create admin user if none exists (idempotent)
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@belleful.com';
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        await User.create({
          name: 'Belleful Admin',
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          isVerified: true
        });
        console.log(`👑 Created admin: ${adminEmail} / admin123`);
      } else {
        console.log('👑 Admin already exists');
      }
    } catch (error) {
      if (error.code === 11000) {
        console.log('ℹ️ Admin email already exists (skipped)');
      } else {
        throw error;
      }
    }

    console.log('🎉 Demo data seeded successfully!');
    console.log('🌐 Test dashboards: http://localhost:1000/user-dashboard.html');
    console.log('👑 Admin: http://localhost:1000/admin-dashboard.html');
    
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Connection/uncatched error:', err.message);
    process.exit(1);
  });
