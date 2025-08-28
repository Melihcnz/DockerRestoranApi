const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Routes import
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const reportRoutes = require('./routes/reports');
const tableRoutes = require('./routes/tables');

const app = express();
const PORT = process.env.PORT || 5000;

// Güvenlik middleware'leri
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting - Sadece production'da aktif
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 dakika
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // IP başına maksimum istek
    message: {
      success: false,
      error: 'Çok fazla istek gönderdiniz. Lütfen bir süre bekleyip tekrar deneyin.'
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use(limiter);
  console.log('✅ Rate limiting aktif (Production)');
} else {
  console.log('ℹ️  Rate limiting devre dışı (Development)');
}

// CORS konfigürasyonu - Tüm kaynaklara izin ver
app.use(cors({
  origin: true, // Tüm kaynaklara izin ver
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200 // Legacy browser support
}));

// Ekstra CORS headers - Preflight issues için
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Static files - Upload edilmiş dosyalar için
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server çalışıyor',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Request logging middleware - geliştirme için
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tables', tableRoutes);

// Ana Route - Welcome Page
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Restaurant Management System API',
    version: '1.0.0',
    status: 'Server çalışıyor! 🚀',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      menu: '/api/menu',
      customers: '/api/customers',
      orders: '/api/orders',
      reports: '/api/reports',
      tables: '/api/tables'
    },
    documentation: {
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register',
      profile: 'GET /api/auth/profile',
      menu_items: 'GET /api/menu/items',
      categories: 'GET /api/menu/categories',
      customers: 'GET /api/customers',
      orders: 'GET /api/orders',
      tables: 'GET /api/tables'
    }
  });
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    message: 'Server sağlıklı çalışıyor! ✅',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint bulunamadı',
    path: req.originalUrl
  });
});

// Global Error Handler
app.use((error, req, res, next) => {
  console.error('Global Error:', error);

  // Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'Dosya boyutu çok büyük'
    });
  }

  // Database errors
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      success: false,
      error: 'Bu kayıt zaten mevcut'
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Geçersiz token'
    });
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Geçersiz veri',
      details: error.details
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Sunucu hatası' 
      : error.message
  });
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} sinyali alındı. Sunucu kapatılıyor...`);
  
  server.close(() => {
    console.log('HTTP sunucusu kapatıldı.');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.log('Zorla kapatılıyor...');
    process.exit(1);
  }, 10000);
};

// Server başlatma
const startServer = async () => {
  try {
    // Veritabanı bağlantısını test et
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Veritabanı bağlantısı başarısız. Sunucu başlatılamıyor.');
      process.exit(1);
    }

    const server = app.listen(PORT, () => {
      console.log('🚀 Restaurant Management System Backend');
      console.log(`📍 Server: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/health`);
      console.log('✅ Server başarıyla başlatıldı!\n');
    });

    // Server timeout ayarları
    server.timeout = 120000; // 2 dakika
    server.keepAliveTimeout = 65000; // 65 saniye
    server.headersTimeout = 66000; // 66 saniye

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    console.error('❌ Server başlatma hatası:', error);
    process.exit(1);
  }
};

// Sadece doğrudan çalıştırılırsa server'ı başlat
if (require.main === module) {
  startServer();
}

module.exports = app;