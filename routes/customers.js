const express = require('express');
const { body, validationResult, query: queryValidator } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const customerValidation = [
  body('first_name').notEmpty().withMessage('Ad gerekli'),
  body('last_name').notEmpty().withMessage('Soyad gerekli'),
  body('phone').isMobilePhone('tr-TR').withMessage('Geçerli telefon numarası girin'),
  body('email').optional().isEmail().withMessage('Geçerli email adresi girin')
];

// Tüm müşterileri getir
router.get('/', authenticateToken, [
  queryValidator('search').optional().isLength({ max: 100 }).withMessage('Arama terimi çok uzun'),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit 1-100 arasında olmalı')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz arama parametreleri',
        details: errors.array()
      });
    }

    const { search, limit = 50, offset = 0 } = req.query;
    
    let whereConditions = ['1=1'];
    let queryParams = [];

    if (search) {
      whereConditions.push('(first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR email LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    const customers = await query(`
      SELECT c.*,
             COUNT(DISTINCT o.id) as order_count,
             COALESCE(SUM(o.total_amount), 0) as total_spent,
             MAX(o.created_at) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, queryParams);

    res.json({
      success: true,
      data: customers,
      message: 'Müşteriler başarıyla alındı'
    });

  } catch (error) {
    console.error('Customers error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Müşteri detayı
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const customers = await query(`
      SELECT c.*,
             COUNT(DISTINCT o.id) as order_count,
             COALESCE(SUM(o.total_amount), 0) as total_spent,
             MAX(o.created_at) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [req.params.id]);

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Müşteri bulunamadı'
      });
    }

    res.json({
      success: true,
      data: customers[0],
      message: 'Müşteri detayları başarıyla alındı'
    });

  } catch (error) {
    console.error('Customer detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Müşteri oluştur
router.post('/', authenticateToken, customerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz müşteri bilgileri',
        details: errors.array()
      });
    }

    const { first_name, last_name, email, phone, address, birth_date, notes } = req.body;

    // Telefon numarası kontrolü
    const existingCustomers = await query(
      'SELECT id FROM customers WHERE phone = ?',
      [phone]
    );

    if (existingCustomers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Bu telefon numarası zaten kayıtlı'
      });
    }

    const result = await query(
      'INSERT INTO customers (first_name, last_name, email, phone, address, birth_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, phone, address, birth_date, notes]
    );

    const newCustomer = await query(
      'SELECT * FROM customers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: newCustomer[0],
      message: 'Müşteri başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Müşteri güncelle
router.put('/:id', authenticateToken, customerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz müşteri bilgileri',
        details: errors.array()
      });
    }

    const customerId = req.params.id;
    const { first_name, last_name, email, phone, address, birth_date, notes, loyalty_points } = req.body;

    // Müşteri varlık kontrolü
    const existingCustomers = await query(
      'SELECT * FROM customers WHERE id = ?',
      [customerId]
    );

    if (existingCustomers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Müşteri bulunamadı'
      });
    }

    // Telefon numarası kontrolü (kendisi hariç)
    const phoneCheck = await query(
      'SELECT id FROM customers WHERE phone = ? AND id != ?',
      [phone, customerId]
    );

    if (phoneCheck.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Bu telefon numarası başka bir müşteri tarafından kullanılıyor'
      });
    }

    await query(
      'UPDATE customers SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?, birth_date = ?, notes = ?, loyalty_points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [first_name, last_name, email, phone, address, birth_date, notes, loyalty_points, customerId]
    );

    const updatedCustomer = await query(
      'SELECT * FROM customers WHERE id = ?',
      [customerId]
    );

    res.json({
      success: true,
      data: updatedCustomer[0],
      message: 'Müşteri başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Müşteri sil
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.id;

    // Müşteri varlık kontrolü
    const existingCustomers = await query(
      'SELECT id FROM customers WHERE id = ?',
      [customerId]
    );

    if (existingCustomers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Müşteri bulunamadı'
      });
    }

    // Aktif siparişleri kontrol et
    const activeOrders = await query(
      'SELECT id FROM orders WHERE customer_id = ? AND status NOT IN ("completed", "cancelled")',
      [customerId]
    );

    if (activeOrders.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Bu müşterinin aktif siparişleri var. Önce siparişleri tamamlayın.'
      });
    }

    await query('DELETE FROM customers WHERE id = ?', [customerId]);

    res.json({
      success: true,
      message: 'Müşteri başarıyla silindi'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Müşteri analitikleri
router.get('/analytics/summary', authenticateToken, async (req, res) => {
  try {
    const [analytics] = await query(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) 
                   AND YEAR(created_at) = YEAR(CURRENT_DATE()) THEN 1 END) as new_customers_this_month,
        AVG(total_spent) as average_order_value,
        89 as satisfaction_rate
      FROM customers
    `);

    res.json({
      success: true,
      data: analytics,
      message: 'Müşteri analitikleri başarıyla alındı'
    });

  } catch (error) {
    console.error('Customer analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

module.exports = router; 