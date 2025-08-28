const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Siparişleri getir
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, date, limit = 50, offset = 0 } = req.query;
    
    let whereConditions = ['1=1'];
    let queryParams = [];

    if (status) {
      whereConditions.push('o.status = ?');
      queryParams.push(status);
    }

    if (date) {
      whereConditions.push('DATE(o.created_at) = ?');
      queryParams.push(date);
    }

    const whereClause = whereConditions.join(' AND ');

    const orders = await query(`
      SELECT o.*, 
             CONCAT(c.first_name, ' ', c.last_name) as customer_name,
             c.phone as customer_phone,
             t.table_number,
             CONCAT(u.first_name, ' ', u.last_name) as waiter_name,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, queryParams);

    res.json({
      success: true,
      data: orders,
      message: 'Siparişler başarıyla alındı'
    });

  } catch (error) {
    console.error('Orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Sipariş detayı
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const orderDetails = await query(`
      SELECT o.*, 
             CONCAT(c.first_name, ' ', c.last_name) as customer_name,
             c.phone as customer_phone,
             c.email as customer_email,
             t.table_number,
             CONCAT(u.first_name, ' ', u.last_name) as waiter_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [req.params.id]);

    if (orderDetails.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Sipariş bulunamadı'
      });
    }

    const orderItems = await query(`
      SELECT oi.*, mi.name as item_name, mi.image_url
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `, [req.params.id]);

    res.json({
      success: true,
      data: {
        order: orderDetails[0],
        items: orderItems
      },
      message: 'Sipariş detayları başarıyla alındı'
    });

  } catch (error) {
    console.error('Order detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Sipariş oluştur
router.post('/', authenticateToken, [
  body('items').isArray({ min: 1 }).withMessage('En az bir ürün seçilmeli'),
  body('items.*.menu_item_id').isInt({ min: 1 }).withMessage('Geçerli ürün ID\'si girin'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Miktar pozitif olmalı'),
  body('order_type').isIn(['dine_in', 'takeaway', 'delivery']).withMessage('Geçerli sipariş türü seçin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz sipariş bilgileri',
        details: errors.array()
      });
    }

    const { 
      customer_id, 
      table_id, 
      order_type = 'dine_in', 
      items, 
      special_instructions 
    } = req.body;

    const result = await transaction(async (connection) => {
      // Sipariş numarası oluştur
      const orderNumber = `ORD${Date.now()}`;
      
      // Sipariş toplamını hesapla
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const menuItems = await query(
          'SELECT price FROM menu_items WHERE id = ? AND is_available = 1',
          [item.menu_item_id]
        );

        if (menuItems.length === 0) {
          throw new Error(`Ürün bulunamadı veya mevcut değil: ${item.menu_item_id}`);
        }

        const unitPrice = menuItems[0].price;
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        orderItems.push({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          special_requests: item.special_requests || null
        });
      }

      const taxAmount = subtotal * 0.18; // %18 KDV
      const totalAmount = subtotal + taxAmount;

      // Siparişi oluştur
      const orderResult = await connection.execute(
        `INSERT INTO orders 
         (order_number, customer_id, table_id, user_id, order_type, subtotal, tax_amount, total_amount, special_instructions) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderNumber, customer_id, table_id, req.user.id, order_type, subtotal, taxAmount, totalAmount, special_instructions]
      );

      const orderId = orderResult[0].insertId;

      // Sipariş öğelerini ekle
      for (const item of orderItems) {
        await connection.execute(
          'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_requests) VALUES (?, ?, ?, ?, ?, ?)',
          [orderId, item.menu_item_id, item.quantity, item.unit_price, item.total_price, item.special_requests]
        );
      }

      return orderId;
    });

    // Oluşturulan siparişi getir
    const newOrder = await query(`
      SELECT o.*, 
             CONCAT(c.first_name, ' ', c.last_name) as customer_name,
             t.table_number,
             CONCAT(u.first_name, ' ', u.last_name) as waiter_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [result]);

    res.status(201).json({
      success: true,
      data: newOrder[0],
      message: 'Sipariş başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Sunucu hatası'
    });
  }
});

// Sipariş durumu güncelle
router.put('/:id/status', authenticateToken, [
  body('status').isIn(['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled']).withMessage('Geçerli durum seçin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz durum bilgisi',
        details: errors.array()
      });
    }

    const orderId = req.params.id;
    const { status } = req.body;

    await query(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, orderId]
    );

    res.json({
      success: true,
      message: 'Sipariş durumu başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Ödeme durumu güncelle
router.put('/:id/payment', authenticateToken, [
  body('payment_status').isIn(['pending', 'paid', 'refunded']).withMessage('Geçerli ödeme durumu seçin'),
  body('payment_method').optional().isIn(['cash', 'card', 'online']).withMessage('Geçerli ödeme yöntemi seçin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz ödeme bilgileri',
        details: errors.array()
      });
    }

    const orderId = req.params.id;
    const { payment_status, payment_method } = req.body;

    await query(
      'UPDATE orders SET payment_status = ?, payment_method = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [payment_status, payment_method, orderId]
    );

    res.json({
      success: true,
      message: 'Ödeme durumu başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Günlük sipariş özeti
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const [stats] = await query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'preparing' THEN 1 END) as preparing_orders,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN payment_status = 'paid' THEN total_amount END), 0) as average_order_value
      FROM orders
      WHERE DATE(created_at) = ?
    `, [date]);

    res.json({
      success: true,
      data: stats,
      message: 'Sipariş özeti başarıyla alındı'
    });

  } catch (error) {
    console.error('Order stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

module.exports = router; 