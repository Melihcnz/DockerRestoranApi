const express = require('express');
const { body, validationResult, query: queryValidator } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');
const { upload, resizeImage, cleanupOldFile, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Validation rules
const categoryValidation = [
  body('name').notEmpty().withMessage('Kategori adı gerekli'),
  body('description').optional().isLength({ max: 500 }).withMessage('Açıklama 500 karakterden uzun olamaz')
];

const menuItemValidation = [
  body('category_id').isInt({ min: 1 }).withMessage('Geçerli bir kategori seçin'),
  body('name').notEmpty().withMessage('Ürün adı gerekli'),
  body('price').isFloat({ min: 0 }).withMessage('Fiyat pozitif bir sayı olmalı'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Açıklama 1000 karakterden uzun olamaz'),
  body('preparation_time').optional().isInt({ min: 1 }).withMessage('Hazırlık süresi pozitif bir sayı olmalı')
];

// ============ KATEGORİLER ============

// Tüm kategorileri getir
router.get('/categories', async (req, res) => {
  try {
    const categories = await query(`
      SELECT c.*, 
             COUNT(mi.id) as item_count,
             COUNT(CASE WHEN mi.is_available = 1 THEN 1 END) as available_count
      FROM categories c
      LEFT JOIN menu_items mi ON c.id = mi.category_id
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.sort_order, c.name
    `);

    res.json({
      success: true,
      data: categories,
      message: 'Kategoriler başarıyla alındı'
    });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Kategori oluştur
router.post('/categories', 
  authenticateToken, 
  requireAdminOrManager, 
  upload.single('image'),
  resizeImage({ width: 600, height: 400 }),
  categoryValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Geçersiz kategori bilgileri',
          details: errors.array()
        });
      }

      const { name, description, sort_order = 0 } = req.body;
      const image_url = req.file ? req.file.url : null;

      const result = await query(
        'INSERT INTO categories (name, description, image_url, sort_order) VALUES (?, ?, ?, ?)',
        [name, description, image_url, sort_order]
      );

      const newCategory = await query(
        'SELECT * FROM categories WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        data: newCategory[0],
        message: 'Kategori başarıyla oluşturuldu'
      });

    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }
);

// Kategori güncelle
router.put('/categories/:id', 
  authenticateToken, 
  requireAdminOrManager,
  upload.single('image'),
  resizeImage({ width: 600, height: 400 }),
  categoryValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Geçersiz kategori bilgileri',
          details: errors.array()
        });
      }

      const categoryId = req.params.id;
      const { name, description, sort_order, is_active = 1 } = req.body;

      // Mevcut kategoriyi kontrol et
      const existingCategories = await query(
        'SELECT * FROM categories WHERE id = ?',
        [categoryId]
      );

      if (existingCategories.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Kategori bulunamadı'
        });
      }

      const existingCategory = existingCategories[0];
      let image_url = existingCategory.image_url;

      // Yeni resim yüklendiyse eski resmi temizle
      if (req.file) {
        if (existingCategory.image_url) {
          await cleanupOldFile(existingCategory.image_url);
        }
        image_url = req.file.url;
      }

      await query(
        'UPDATE categories SET name = ?, description = ?, image_url = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, description, image_url, sort_order, is_active, categoryId]
      );

      const updatedCategory = await query(
        'SELECT * FROM categories WHERE id = ?',
        [categoryId]
      );

      res.json({
        success: true,
        data: updatedCategory[0],
        message: 'Kategori başarıyla güncellendi'
      });

    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }
);

// Kategori sil
router.delete('/categories/:id', authenticateToken, requireAdminOrManager, async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Kategori varlık kontrolü
    const existingCategories = await query(
      'SELECT * FROM categories WHERE id = ?',
      [categoryId]
    );

    if (existingCategories.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Kategori bulunamadı'
      });
    }

    // Bu kategoriye ait menü öğesi var mı kontrol et
    const categoryItems = await query(
      'SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?',
      [categoryId]
    );

    if (categoryItems[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Bu kategoriye ait menü öğeleri bulunduğu için kategori silinemez'
      });
    }

    const existingCategory = existingCategories[0];

    // Kategori resmini sil
    if (existingCategory.image_url) {
      await cleanupOldFile(existingCategory.image_url);
    }

    await query('DELETE FROM categories WHERE id = ?', [categoryId]);

    res.json({
      success: true,
      message: 'Kategori başarıyla silindi'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// ============ MENÜ ÖĞELERİ ============

// Menü öğelerini getir
router.get('/items', [
  queryValidator('category_id').optional().isInt().withMessage('Geçerli kategori ID\'si girin'),
  queryValidator('available_only').optional().isBoolean().withMessage('available_only boolean olmalı'),
  queryValidator('search').optional().isLength({ max: 100 }).withMessage('Arama terimi çok uzun')
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

    const { category_id, available_only, search, limit = 50, offset = 0 } = req.query;
    
    let whereConditions = ['mi.id IS NOT NULL'];
    let queryParams = [];

    if (category_id) {
      whereConditions.push('mi.category_id = ?');
      queryParams.push(category_id);
    }

    if (available_only === 'true') {
      whereConditions.push('mi.is_available = 1');
    }

    if (search) {
      whereConditions.push('(mi.name LIKE ? OR mi.description LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    const menuItems = await query(`
      SELECT mi.*, c.name as category_name
      FROM menu_items mi
      LEFT JOIN categories c ON mi.category_id = c.id
      WHERE ${whereClause}
      ORDER BY mi.sort_order, mi.name
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, queryParams);

    res.json({
      success: true,
      data: menuItems,
      message: 'Menü öğeleri başarıyla alındı'
    });

  } catch (error) {
    console.error('Menu items error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Menü öğesi detayı
router.get('/items/:id', async (req, res) => {
  try {
    const menuItems = await query(`
      SELECT mi.*, c.name as category_name
      FROM menu_items mi
      LEFT JOIN categories c ON mi.category_id = c.id
      WHERE mi.id = ?
    `, [req.params.id]);

    if (menuItems.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Menü öğesi bulunamadı'
      });
    }

    res.json({
      success: true,
      data: menuItems[0],
      message: 'Menü öğesi başarıyla alındı'
    });

  } catch (error) {
    console.error('Menu item detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Menü öğesi oluştur
router.post('/items',
  authenticateToken,
  requireAdminOrManager,
  upload.single('image'),
  resizeImage({ width: 800, height: 600 }),
  menuItemValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Geçersiz menü öğesi bilgileri',
          details: errors.array()
        });
      }

      const {
        category_id,
        name,
        description,
        price,
        ingredients,
        allergens,
        preparation_time = 15,
        calories,
        sort_order = 0,
        is_available = 1,
        is_featured = 0
      } = req.body;

      const image_url = req.file ? req.file.url : null;

      const result = await query(`
        INSERT INTO menu_items 
        (category_id, name, description, price, image_url, ingredients, allergens, 
         preparation_time, calories, sort_order, is_available, is_featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        category_id, name, description, price, image_url, ingredients,
        allergens, preparation_time, calories, sort_order, is_available, is_featured
      ]);

      const newMenuItem = await query(`
        SELECT mi.*, c.name as category_name
        FROM menu_items mi
        LEFT JOIN categories c ON mi.category_id = c.id
        WHERE mi.id = ?
      `, [result.insertId]);

      res.status(201).json({
        success: true,
        data: newMenuItem[0],
        message: 'Menü öğesi başarıyla oluşturuldu'
      });

    } catch (error) {
      console.error('Create menu item error:', error);
      res.status(500).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }
);

// Menü öğesi güncelle
router.put('/items/:id',
  authenticateToken,
  requireAdminOrManager,
  upload.single('image'),
  resizeImage({ width: 800, height: 600 }),
  menuItemValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Geçersiz menü öğesi bilgileri',
          details: errors.array()
        });
      }

      const itemId = req.params.id;
      const {
        category_id,
        name,
        description,
        price,
        ingredients,
        allergens,
        preparation_time,
        calories,
        sort_order,
        is_available,
        is_featured
      } = req.body;

      // Mevcut öğeyi kontrol et
      const existingItems = await query(
        'SELECT * FROM menu_items WHERE id = ?',
        [itemId]
      );

      if (existingItems.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Menü öğesi bulunamadı'
        });
      }

      const existingItem = existingItems[0];
      let image_url = existingItem.image_url;

      // Yeni resim yüklendiyse eski resmi temizle
      if (req.file) {
        if (existingItem.image_url) {
          await cleanupOldFile(existingItem.image_url);
        }
        image_url = req.file.url;
      }

      await query(`
        UPDATE menu_items SET 
        category_id = ?, name = ?, description = ?, price = ?, image_url = ?,
        ingredients = ?, allergens = ?, preparation_time = ?, calories = ?,
        sort_order = ?, is_available = ?, is_featured = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        category_id, name, description, price, image_url, ingredients,
        allergens, preparation_time, calories, sort_order, is_available,
        is_featured, itemId
      ]);

      const updatedMenuItem = await query(`
        SELECT mi.*, c.name as category_name
        FROM menu_items mi
        LEFT JOIN categories c ON mi.category_id = c.id
        WHERE mi.id = ?
      `, [itemId]);

      res.json({
        success: true,
        data: updatedMenuItem[0],
        message: 'Menü öğesi başarıyla güncellendi'
      });

    } catch (error) {
      console.error('Update menu item error:', error);
      res.status(500).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }
);

// Menü öğesi sil
router.delete('/items/:id', 
  authenticateToken, 
  requireAdminOrManager, 
  async (req, res) => {
    try {
      const itemId = req.params.id;

      // Önce öğenin varlığını ve resmini kontrol et
      const existingItems = await query(
        'SELECT image_url FROM menu_items WHERE id = ?',
        [itemId]
      );

      if (existingItems.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Menü öğesi bulunamadı'
        });
      }

      // Resmi temizle
      if (existingItems[0].image_url) {
        await cleanupOldFile(existingItems[0].image_url);
      }

      // Öğeyi sil
      await query('DELETE FROM menu_items WHERE id = ?', [itemId]);

      res.json({
        success: true,
        message: 'Menü öğesi başarıyla silindi'
      });

    } catch (error) {
      console.error('Delete menu item error:', error);
      res.status(500).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }
);

// Upload error handling
router.use(handleUploadError);

module.exports = router; 