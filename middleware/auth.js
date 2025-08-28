const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// JWT token doğrulama middleware'i
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Erişim tokenı gerekli'
      });
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kullanıcı bilgilerini veritabanından al
    const users = await query(
      'SELECT id, username, email, first_name, last_name, role, is_active FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz token veya kullanıcı aktif değil'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token süresi dolmuş'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
};

// Rol tabanlı yetkilendirme middleware'i
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Kimlik doğrulama gerekli'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Bu işlem için yetkiniz yok'
      });
    }

    next();
  };
};

// Admin veya manager kontrolü
const requireAdminOrManager = authorizeRoles('admin', 'manager');

// Sadece admin kontrolü
const requireAdmin = authorizeRoles('admin');

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireAdminOrManager,
  requireAdmin
}; 