const admin = require('firebase-admin');
const User = require('../models/User');

/**
 * Firebase Push Notification Service
 * Handles sending push notifications to users
 */

// Initialize Firebase Admin (only if credentials exist)
let firebaseInitialized = false;
try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      })
    });
    firebaseInitialized = true;
    console.log('✅ Firebase notifications initialized');
  } else {
    console.log('⚠️ Firebase credentials not found - notifications disabled');
  }
} catch (error) {
  console.log('❌ Firebase initialization failed:', error.message);
}

/**
 * Send push notification to a specific user
 * @param {string} userId - User ID to send notification to
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 */
const sendNotification = async (userId, title, body, data = {}) => {
  if (!firebaseInitialized) {
    console.log('Firebase not initialized, skipping notification');
    return;
  }

  try {
    const user = await User.findById(userId).select('deviceTokens notificationsEnabled name');
    if (!user?.notificationsEnabled || !user.deviceTokens?.length) {
      console.log(`User ${userId} has notifications disabled or no device tokens`);
      return;
    }

    const tokens = user.deviceTokens.map(dt => dt.token).filter(token => token);

    if (!tokens.length) {
      console.log(`No valid tokens found for user ${userId}`);
      return;
    }

    const message = {
      tokens,
      notification: {
        title,
        body
      },
      data: {
        ...data,
        userId: userId.toString(),
        timestamp: Date.now().toString()
      },
      webpush: {
        fcmOptions: {
          link: data.link || `${process.env.FRONTEND_URL || 'https://bellefulchop.netlify.app'}`
        },
        notification: {
          icon: '/asset/icon-192.png',
          badge: '/asset/icon-192.png',
          requireInteraction: true,
          actions: data.orderId ? [{
            action: 'view_order',
            title: 'View Order'
          }] : []
        }
      }
    };

    const response = await admin.messaging().sendMulticast(message);

    console.log(`📱 Notification sent to ${response.successCount}/${tokens.length} devices for user ${user.name || userId}`);

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      if (failedTokens.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $pull: { deviceTokens: { token: { $in: failedTokens } } }
        });
        console.log(`🧹 Cleaned up ${failedTokens.length} invalid tokens for user ${userId}`);
      }
    }

  } catch (error) {
    console.error('❌ Notification failed:', error.message);
  }
};

/**
 * Send notification to all admin users
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 */
const sendAdminNotification = async (title, body, data = {}) => {
  if (!firebaseInitialized) return;

  try {
    const admins = await User.find({ role: 'admin', notificationsEnabled: true })
      .select('deviceTokens name')
      .lean();

    const allTokens = [];
    const tokenToUserMap = new Map();

    admins.forEach(admin => {
      if (admin.deviceTokens?.length) {
        admin.deviceTokens.forEach(dt => {
          if (dt.token) {
            allTokens.push(dt.token);
            tokenToUserMap.set(dt.token, admin._id);
          }
        });
      }
    });

    if (!allTokens.length) {
      console.log('No admin device tokens found');
      return;
    }

    const message = {
      tokens: allTokens,
      notification: { title, body },
      data: { ...data, type: 'admin', timestamp: Date.now().toString() }
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`📱 Admin notification sent to ${response.successCount}/${allTokens.length} devices`);

  } catch (error) {
    console.error('❌ Admin notification failed:', error.message);
  }
};

module.exports = { sendNotification, sendAdminNotification };