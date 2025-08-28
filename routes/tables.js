const express = require('express');
const { body, validationResult, query: queryValidator } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const tableValidation = [
  body('table_number').notEmpty().withMessage('Masa numarası gerekli'),
  body('capacity').isInt({ min: 1, max: 20 }).withMessage('Kapasite 1-20 arasında olmalı'),
  body('location').isIn(['indoor', 'outdoor', 'terrace']).withMessage('Geçerli konum seçin')
];

// Tüm masaları getir
router.get('/', authenticateToken, [
  queryValidator('location').optional().isIn(['indoor', 'outdoor', 'terrace']).withMessage('Geçerli konum seçin'),
  queryValidator('available_only').optional().isBoolean().withMessage('available_only boolean olmalı')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz parametreler',
        details: errors.array()
      });
    }

    const { location, available_only } = req.query;
    
    let whereConditions = ['1=1'];
    let queryParams = [];

    if (location) {
      whereConditions.push('t.location = ?');
      queryParams.push(location);
    }

    if (available_only === 'true') {
      whereConditions.push('t.is_available = 1');
    }

    const whereClause = whereConditions.join(' AND ');

    const tables = await query(`
      SELECT t.*,
             COUNT(CASE WHEN o.status IN ('pending', 'confirmed', 'preparing', 'ready') THEN 1 END) as active_orders,
             MAX(o.created_at) as last_order_time
      FROM tables t
      LEFT JOIN orders o ON t.id = o.table_id AND DATE(o.created_at) = CURDATE()
      WHERE ${whereClause}
      GROUP BY t.id
      ORDER BY t.table_number
    `, queryParams);

    // Masa durumunu hesapla
    const formattedTables = tables.map(table => ({
      ...table,
      status: table.active_orders > 0 ? 'occupied' : (table.is_available ? 'available' : 'maintenance'),
      active_orders: parseInt(table.active_orders) || 0
    }));

    res.json({
      success: true,
      data: formattedTables,
      message: 'Masalar başarıyla alındı'
    });

  } catch (error) {
    console.error('Tables error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Masa detayı getir
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const tableId = req.params.id;

    const tables = await query(`
      SELECT t.*,
             COUNT(CASE WHEN o.status IN ('pending', 'confirmed', 'preparing', 'ready') THEN 1 END) as active_orders
      FROM tables t
      LEFT JOIN orders o ON t.id = o.table_id AND DATE(o.created_at) = CURDATE()
      WHERE t.id = ?
      GROUP BY t.id
    `, [tableId]);

    if (tables.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Masa bulunamadı'
      });
    }

    // Masanın aktif siparişlerini getir
    const activeOrders = await query(`
      SELECT o.*, 
             CONCAT(c.first_name, ' ', c.last_name) as customer_name,
             c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.table_id = ? AND o.status IN ('pending', 'confirmed', 'preparing', 'ready')
      ORDER BY o.created_at DESC
    `, [tableId]);

    const table = {
      ...tables[0],
      active_orders: parseInt(tables[0].active_orders) || 0,
      current_orders: activeOrders
    };

    res.json({
      success: true,
      data: table,
      message: 'Masa detayları başarıyla alındı'
    });

  } catch (error) {
    console.error('Table detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Yeni masa oluştur
router.post('/', authenticateToken, requireAdminOrManager, tableValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz masa bilgileri',
        details: errors.array()
      });
    }

    const { table_number, capacity, location, qr_code } = req.body;

    // Masa numarası kontrolü
    const existingTables = await query(
      'SELECT id FROM tables WHERE table_number = ?',
      [table_number]
    );

    if (existingTables.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Bu masa numarası zaten kullanılıyor'
      });
    }

    const result = await query(
      'INSERT INTO tables (table_number, capacity, location, qr_code) VALUES (?, ?, ?, ?)',
      [table_number, capacity, location, qr_code]
    );

    const newTable = await query(
      'SELECT * FROM tables WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: newTable[0],
      message: 'Masa başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Masa güncelle
router.put('/:id', authenticateToken, requireAdminOrManager, tableValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz masa bilgileri',
        details: errors.array()
      });
    }

    const tableId = req.params.id;
    const { table_number, capacity, location, is_available, qr_code } = req.body;

    // Masa varlık kontrolü
    const existingTables = await query(
      'SELECT * FROM tables WHERE id = ?',
      [tableId]
    );

    if (existingTables.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Masa bulunamadı'
      });
    }

    // Masa numarası kontrolü (kendisi hariç)
    const tableNumberCheck = await query(
      'SELECT id FROM tables WHERE table_number = ? AND id != ?',
      [table_number, tableId]
    );

    if (tableNumberCheck.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Bu masa numarası başka bir masa tarafından kullanılıyor'
      });
    }

    await query(
      'UPDATE tables SET table_number = ?, capacity = ?, location = ?, is_available = ?, qr_code = ? WHERE id = ?',
      [table_number, capacity, location, is_available, qr_code, tableId]
    );

    const updatedTable = await query(
      'SELECT * FROM tables WHERE id = ?',
      [tableId]
    );

    res.json({
      success: true,
      data: updatedTable[0],
      message: 'Masa başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Masa durumunu güncelle (müsait/dolu/bakım)
router.put('/:id/status', authenticateToken, [
  body('is_available').isBoolean().withMessage('is_available boolean olmalı')
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

    const tableId = req.params.id;
    const { is_available } = req.body;

    const tableCheck = await query(
      'SELECT id FROM tables WHERE id = ?',
      [tableId]
    );

    if (tableCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Masa bulunamadı'
      });
    }

    await query(
      'UPDATE tables SET is_available = ? WHERE id = ?',
      [is_available, tableId]
    );

    const updatedTable = await query(
      'SELECT * FROM tables WHERE id = ?',
      [tableId]
    );

    res.json({
      success: true,
      data: updatedTable[0],
      message: 'Masa durumu başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Update table status error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Masa sil
router.delete('/:id', authenticateToken, requireAdminOrManager, async (req, res) => {
  try {
    const tableId = req.params.id;

    // Masa varlık kontrolü
    const existingTables = await query(
      'SELECT * FROM tables WHERE id = ?',
      [tableId]
    );

    if (existingTables.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Masa bulunamadı'
      });
    }

    // Aktif sipariş kontrolü
    const activeOrders = await query(
      'SELECT id FROM orders WHERE table_id = ? AND status IN ("pending", "confirmed", "preparing", "ready")',
      [tableId]
    );

    if (activeOrders.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Aktif siparişi olan masa silinemez'
      });
    }

    await query('DELETE FROM tables WHERE id = ?', [tableId]);

    res.json({
      success: true,
      message: 'Masa başarıyla silindi'
    });

  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Masa istatistikleri
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const stats = await query(`
      SELECT 
        COUNT(*) as total_tables,
        COUNT(CASE WHEN is_available = 1 THEN 1 END) as available_tables,
        COUNT(CASE WHEN is_available = 0 THEN 1 END) as maintenance_tables,
        SUM(capacity) as total_capacity
      FROM tables
    `);

    const occupiedTables = await query(`
      SELECT COUNT(DISTINCT o.table_id) as occupied_count
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      WHERE DATE(o.created_at) = ? AND o.status IN ('pending', 'confirmed', 'preparing', 'ready')
    `, [date]);

    const locationStats = await query(`
      SELECT 
        location,
        COUNT(*) as table_count,
        SUM(capacity) as location_capacity
      FROM tables
      GROUP BY location
    `);

    res.json({
      success: true,
      data: {
        summary: {
          ...stats[0],
          occupied_tables: occupiedTables[0].occupied_count || 0
        },
        by_location: locationStats
      },
      message: 'Masa istatistikleri başarıyla alındı'
    });

  } catch (error) {
    console.error('Table stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

module.exports = router; 