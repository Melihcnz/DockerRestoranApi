const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const loginValidation = [
  body('username').notEmpty().withMessage('Kullanıcı adı gerekli'),
  body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı')
];

const registerValidation = [
  body('username').isLength({ min: 3 }).withMessage('Kullanıcı adı en az 3 karakter olmalı'),
  body('email').isEmail().withMessage('Geçerli bir email adresi girin'),
  body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),
  body('first_name').notEmpty().withMessage('Ad gerekli'),
  body('last_name').notEmpty().withMessage('Soyad gerekli')
];

// JWT token oluştur
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};

// Login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz giriş bilgileri',
        details: errors.array()
      });
    }

    const { username, password } = req.body;

    // Kullanıcıyı veritabanında ara
    const users = await query(
      'SELECT * FROM users WHERE username = ? AND is_active = 1',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı adı veya şifre hatalı'
      });
    }

    const user = users[0];

    // Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı adı veya şifre hatalı'
      });
    }

    // Token oluştur
    const token = generateToken(user.id);

    // Şifreyi response'dan çıkar
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: 'Giriş başarılı'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Register
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz kayıt bilgileri',
        details: errors.array()
      });
    }

    const { username, email, password, first_name, last_name, phone, role = 'staff' } = req.body;

    // Kullanıcı adı ve email kontrolü
    const existingUsers = await query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Bu kullanıcı adı veya email zaten kullanılıyor'
      });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcıyı kaydet
    const result = await query(
      'INSERT INTO users (username, email, password, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, first_name, last_name, phone, role]
    );

    // Token oluştur
    const token = generateToken(result.insertId);

    // Kullanıcı bilgilerini getir
    const newUser = await query(
      'SELECT id, username, email, first_name, last_name, role, phone, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: {
        user: newUser[0],
        token
      },
      message: 'Kayıt başarılı'
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Profile - Kullanıcı bilgilerini getir
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user,
      message: 'Profil bilgileri başarıyla alındı'
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Profile güncelle
router.put('/profile', authenticateToken, [
  body('first_name').optional().notEmpty().withMessage('Ad boş olamaz'),
  body('last_name').optional().notEmpty().withMessage('Soyad boş olamaz'),
  body('email').optional().isEmail().withMessage('Geçerli bir email adresi girin'),
  body('phone').optional().isMobilePhone('tr-TR').withMessage('Geçerli bir telefon numarası girin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz bilgiler',
        details: errors.array()
      });
    }

    const { first_name, last_name, email, phone } = req.body;
    const userId = req.user.id;

    // Email kontrolü (eğer değiştiriliyorsa)
    if (email && email !== req.user.email) {
      const existingUsers = await query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Bu email adresi zaten kullanılıyor'
        });
      }
    }

    // Güncelle
    await query(
      'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [first_name, last_name, email, phone, userId]
    );

    // Güncellenmiş kullanıcı bilgilerini getir
    const updatedUser = await query(
      'SELECT id, username, email, first_name, last_name, role, phone, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: updatedUser[0],
      message: 'Profil başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Şifre değiştir
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Mevcut şifre gerekli'),
  body('newPassword').isLength({ min: 6 }).withMessage('Yeni şifre en az 6 karakter olmalı')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz şifre bilgileri',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Mevcut şifreyi kontrol et
    const users = await query('SELECT password FROM users WHERE id = ?', [userId]);
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Mevcut şifre hatalı'
      });
    }

    // Yeni şifreyi hashle ve güncelle
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, userId]
    );

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

module.exports = router; 