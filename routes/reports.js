const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Günlük satış raporu
router.get('/daily-sales', authenticateToken, async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    // Günlük toplam veriler
    const dailySales = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN payment_status = 'paid' THEN total_amount END) as avg_order_value,
        COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_payments,
        COUNT(CASE WHEN payment_method = 'card' THEN 1 END) as card_payments
      FROM orders
      WHERE DATE(created_at) = ?
      GROUP BY DATE(created_at)
    `, [date]);

    // Saatlik dağılım verisi
    const hourlyBreakdown = await query(`
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as orders,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as revenue
      FROM orders
      WHERE DATE(created_at) = ?
      GROUP BY HOUR(created_at)
      ORDER BY HOUR(created_at)
    `, [date]);

    // Saatlik verileri 0-23 saatleri ile doldur (eksik saatleri 0 ile doldur)
    const fullHourlyData = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourData = hourlyBreakdown.find(h => h.hour === hour);
      fullHourlyData.push({
        hour: hour.toString().padStart(2, '0') + ':00',
        orders: hourData ? hourData.orders : 0,
        revenue: hourData ? parseFloat(hourData.revenue || 0) : 0
      });
    }

    console.log('Daily sales data:', {
      date,
      summary: dailySales[0],
      hourlyCount: hourlyBreakdown.length,
      fullHourlyCount: fullHourlyData.length
    });

    const responseData = dailySales[0] || {
      date,
      total_orders: 0,
      completed_orders: 0,
      total_revenue: 0,
      avg_order_value: 0,
      cash_payments: 0,
      card_payments: 0
    };

    // Saatlik dağılımı ekle
    responseData.hourly_breakdown = fullHourlyData;

    res.json({
      success: true,
      data: responseData,
      message: 'Günlük satış raporu başarıyla alındı'
    });

  } catch (error) {
    console.error('Daily sales error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Aylık satış raporu
router.get('/monthly-sales', authenticateToken, async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

    const monthlySales = await query(`
      SELECT 
        YEAR(created_at) as year,
        MONTH(created_at) as month,
        COUNT(*) as total_orders,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN payment_status = 'paid' THEN total_amount END) as avg_order_value
      FROM orders
      WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
      GROUP BY YEAR(created_at), MONTH(created_at)
    `, [year, month]);

    // Günlük detaylar
    const dailyBreakdown = await query(`
      SELECT 
        DAY(created_at) as day,
        COUNT(*) as orders,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as revenue
      FROM orders
      WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
      GROUP BY DAY(created_at)
      ORDER BY DAY(created_at)
    `, [year, month]);

    console.log('Monthly sales data:', {
      params: { year, month },
      summary: monthlySales[0],
      dailyCount: dailyBreakdown.length
    });

    res.json({
      success: true,
      data: {
        summary: monthlySales[0] || { year, month, total_orders: 0, total_revenue: 0, avg_order_value: 0 },
        daily_breakdown: dailyBreakdown
      },
      message: 'Aylık satış raporu başarıyla alındı'
    });

  } catch (error) {
    console.error('Monthly sales error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Popüler ürünler raporu
router.get('/popular-items', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, date_from, date_to } = req.query;
    
    let whereClause = '1=1';
    let queryParams = [];

    if (date_from && date_to) {
      whereClause = 'DATE(o.created_at) BETWEEN ? AND ?';
      queryParams.push(date_from, date_to);
    }

    const popularItems = await query(`
      SELECT 
        mi.id,
        mi.name,
        mi.price,
        c.name as category_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total_price) as total_revenue,
        COUNT(DISTINCT o.id) as order_count
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN categories c ON mi.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE ${whereClause} AND o.payment_status = 'paid'
      GROUP BY mi.id, mi.name, mi.price, c.name
      ORDER BY total_sold DESC
      LIMIT ${parseInt(limit)}
    `, queryParams);

    res.json({
      success: true,
      data: popularItems,
      message: 'Popüler ürünler raporu başarıyla alındı'
    });

  } catch (error) {
    console.error('Popular items error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Müşteri analitikleri
router.get('/customer-analytics', authenticateToken, async (req, res) => {
  try {
    const analytics = await query(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) 
                   AND YEAR(created_at) = YEAR(CURRENT_DATE()) THEN 1 END) as new_customers_this_month,
        COALESCE(AVG(CASE WHEN total_spent > 0 THEN total_spent END), 0) as average_customer_value,
        COUNT(CASE WHEN is_vip = 1 THEN 1 END) as vip_customers
      FROM customers
    `);

    // En iyi müşteriler
    const topCustomers = await query(`
      SELECT 
        CONCAT(first_name, ' ', last_name) as name,
        phone,
        total_orders,
        total_spent,
        loyalty_points
      FROM customers
      WHERE total_spent > 0
      ORDER BY total_spent DESC
      LIMIT 10
    `);

    console.log('Customer analytics data:', {
      analytics: analytics[0],
      topCustomers: topCustomers.length
    });

    res.json({
      success: true,
      data: {
        summary: analytics[0],
        top_customers: topCustomers
      },
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

// Ödeme yöntemi raporu
router.get('/payment-methods', authenticateToken, async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    let whereClause = 'payment_status = "paid"';
    let queryParams = [];

    if (date_from && date_to) {
      whereClause += ' AND DATE(created_at) BETWEEN ? AND ?';
      queryParams.push(date_from, date_to);
    }

    const paymentMethods = await query(`
      SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_amount,
        AVG(total_amount) as average_amount
      FROM orders
      WHERE ${whereClause}
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `, queryParams);

    res.json({
      success: true,
      data: paymentMethods,
      message: 'Ödeme yöntemi raporu başarıyla alındı'
    });

  } catch (error) {
    console.error('Payment methods error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Masa kullanım raporu
router.get('/table-utilization', authenticateToken, async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const tableUtilization = await query(`
      SELECT 
        t.table_number,
        t.capacity,
        COUNT(o.id) as orders_count,
        SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END) as revenue,
        AVG(o.total_amount) as avg_order_value
      FROM tables t
      LEFT JOIN orders o ON t.id = o.table_id AND DATE(o.created_at) = ?
      GROUP BY t.id, t.table_number, t.capacity
      ORDER BY orders_count DESC
    `, [date]);

    res.json({
      success: true,
      data: tableUtilization,
      message: 'Masa kullanım raporu başarıyla alındı'
    });

  } catch (error) {
    console.error('Table utilization error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

module.exports = router; 