const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

// Upload dizinini oluştur
const uploadDir = process.env.UPLOAD_PATH || './uploads';
const createUploadDirs = () => {
  const dirs = [
    uploadDir,
    path.join(uploadDir, 'menu'),
    path.join(uploadDir, 'categories'),
    path.join(uploadDir, 'profile'),
    path.join(uploadDir, 'thumbnails')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Dosya filtreleme
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya türü. Sadece resim dosyaları yüklenebilir.'), false);
  }
};

// Multer konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadDir;
    
    // Dosya türüne göre alt klasör belirle
    if (req.body.type === 'menu' || req.url.includes('/menu/')) {
      uploadPath = path.join(uploadDir, 'menu');
    } else if (req.body.type === 'category' || req.url.includes('/categories/')) {
      uploadPath = path.join(uploadDir, 'categories');
    } else if (req.body.type === 'profile' || req.url.includes('/profile/')) {
      uploadPath = path.join(uploadDir, 'profile');
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Benzersiz dosya adı oluştur
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    const fileName = `${uniqueId}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  }
});

// Resim boyutlandırma middleware'i
const resizeImage = (options = {}) => {
  return async (req, res, next) => {
    if (!req.file) {
      return next();
    }

    try {
      const { width = 800, height = 600, quality = 80 } = options;
      const filePath = req.file.path;
      const thumbnailPath = path.join(uploadDir, 'thumbnails', req.file.filename);

      // Ana resmi optimize et
      await sharp(filePath)
        .resize(width, height, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality })
        .toFile(filePath + '_temp');

      // Eski dosyayı sil ve yeni dosyayı adlandır
      fs.unlinkSync(filePath);
      fs.renameSync(filePath + '_temp', filePath);

      // Thumbnail oluştur
      await sharp(filePath)
        .resize(200, 200, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 70 })
        .toFile(thumbnailPath);

      // Dosya bilgilerini güncelle
      req.file.thumbnailPath = thumbnailPath;
      req.file.url = `/uploads/${path.relative(uploadDir, filePath)}`;
      req.file.thumbnailUrl = `/uploads/thumbnails/${req.file.filename}`;

      next();
    } catch (error) {
      console.error('Image resize error:', error);
      next(error);
    }
  };
};

// Dosya silme yardımcı fonksiyonu
const deleteFile = (filePath) => {
  return new Promise((resolve) => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('File deletion error:', err);
        resolve();
      });
    } else {
      resolve();
    }
  });
};

// Eski dosyaları temizleme
const cleanupOldFile = async (oldPath) => {
  if (oldPath) {
    const fullPath = path.join(uploadDir, oldPath.replace('/uploads/', ''));
    const thumbnailPath = path.join(uploadDir, 'thumbnails', path.basename(fullPath));
    
    await Promise.all([
      deleteFile(fullPath),
      deleteFile(thumbnailPath)
    ]);
  }
};

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Dosya boyutu çok büyük. Maksimum 5MB yükleyebilirsiniz.'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'Dosya yükleme hatası: ' + error.message
    });
  }

  if (error.message.includes('Desteklenmeyen dosya türü')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  next(error);
};

module.exports = {
  upload,
  resizeImage,
  cleanupOldFile,
  handleUploadError,
  createUploadDirs
}; 