# Restaurant Management System - Backend API

Bu proje, restoran işletmeleri için geliştirilmiş kapsamlı bir yönetim sistemi backend API'sidir.

## 🚀 Özellikler

### 🔐 Kimlik Doğrulama & Yetkilendirme
- JWT tabanlı güvenli authentication
- Rol tabanlı erişim kontrolü (Admin, Manager, Staff, Waiter, Chef)
- Şifre hashleme (bcrypt)
- Session yönetimi

### 🍽️ Menü Yönetimi
- Kategori oluşturma ve yönetimi
- Menü öğesi CRUD işlemleri
- Resim yükleme ve otomatik boyutlandırma
- Fiyat ve stok durumu takibi
- Öne çıkan ürün özelliği

### 👥 Müşteri Yönetimi
- Müşteri kayıt ve profil yönetimi
- Sipariş geçmişi takibi
- Loyalite puanları
- Müşteri analitikleri

### 📋 Sipariş Sistemi
- Sipariş oluşturma ve takibi
- Durum güncelleme (Beklemede, Hazırlanıyor, Hazır, Teslim)
- Ödeme durumu yönetimi
- Sipariş detayları ve raporlama

### 📊 Raporlama & Analitik
- Günlük/aylık satış raporları
- Popüler ürün analizleri
- Müşteri davranış analizleri
- Ödeme yöntemi raporları
- Masa kullanım raporları

### 📁 Dosya Yönetimi
- Güvenli resim yükleme
- Otomatik resim optimizasyonu (Sharp)
- Thumbnail oluşturma
- Dosya boyutu ve tip validasyonu

## 🛠️ Teknoloji Stack

- **Framework**: Node.js + Express.js
- **Veritabanı**: MySQL/MariaDB
- **Authentication**: JSON Web Tokens (JWT)
- **Dosya Upload**: Multer + Sharp
- **Güvenlik**: Helmet, CORS, Rate Limiting
- **Validation**: Express-validator
- **Logging**: Morgan

## ⚙️ Kurulum

### Gereksinimler
- Node.js (v16+)
- MySQL/MariaDB
- npm veya yarn

### 1. Projeyi İndirin
```bash
git clone <repository-url>
cd restaurant-backend
```

### 2. Dependencies Yükleyin
```bash
npm install
```

### 3. Çevre Değişkenlerini Ayarlayın
```bash
cp env.example .env
```

`.env` dosyasını düzenleyin:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=restaurant_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# CORS Configuration
FRONTEND_URL=http://localhost:1420
```

### 4. Veritabanını Kurun
```bash
# MySQL'e bağlanın ve veritabanını oluşturun
mysql -u root -p < ../database/restaurant_db.sql
```

### 5. Upload Klasörlerini Oluşturun
```bash
mkdir -p uploads/menu uploads/categories uploads/profile uploads/thumbnails
```

### 6. Uygulamayı Başlatın
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### 🔐 Authentication
```
POST   /api/auth/login           # Kullanıcı girişi
POST   /api/auth/register        # Kullanıcı kaydı
GET    /api/auth/profile         # Profil bilgileri
PUT    /api/auth/profile         # Profil güncelleme
PUT    /api/auth/change-password # Şifre değiştirme
```

### 🍽️ Menu Management
```
GET    /api/menu/categories      # Kategorileri listele
POST   /api/menu/categories      # Kategori oluştur
PUT    /api/menu/categories/:id  # Kategori güncelle
DELETE /api/menu/categories/:id  # Kategori sil

GET    /api/menu/items           # Menü öğelerini listele
GET    /api/menu/items/:id       # Menü öğesi detayı
POST   /api/menu/items           # Menü öğesi oluştur
PUT    /api/menu/items/:id       # Menü öğesi güncelle
DELETE /api/menu/items/:id       # Menü öğesi sil
```

### 👥 Customer Management
```
GET    /api/customers            # Müşterileri listele
GET    /api/customers/:id        # Müşteri detayı
POST   /api/customers            # Müşteri oluştur
PUT    /api/customers/:id        # Müşteri güncelle
DELETE /api/customers/:id        # Müşteri sil
GET    /api/customers/analytics/summary # Müşteri analitikleri
```

### 📋 Order Management
```
GET    /api/orders               # Siparişleri listele
GET    /api/orders/:id           # Sipariş detayı
POST   /api/orders               # Sipariş oluştur
PUT    /api/orders/:id/status    # Sipariş durumu güncelle
PUT    /api/orders/:id/payment   # Ödeme durumu güncelle
GET    /api/orders/stats/summary # Sipariş özeti
```

### 📊 Reports
```
GET    /api/reports/daily-sales     # Günlük satış raporu
GET    /api/reports/monthly-sales   # Aylık satış raporu
GET    /api/reports/popular-items   # Popüler ürünler
GET    /api/reports/customer-analytics # Müşteri analitikleri
GET    /api/reports/payment-methods # Ödeme yöntemi raporu
GET    /api/reports/table-utilization # Masa kullanım raporu
```

### 🏥 Health Check
```
GET    /health                   # Sunucu durumu kontrolü
```

## 🔒 Güvenlik Özellikleri

- **Rate Limiting**: IP başına istek sınırlaması
- **CORS**: Cross-origin istekleri kontrolü
- **Helmet**: HTTP güvenlik başlıkları
- **Input Validation**: Tüm giriş verilerinin doğrulanması
- **File Upload Security**: Dosya türü ve boyut kontrolleri
- **SQL Injection Protection**: Parameterized queries

## 📁 Proje Yapısı

```
backend/
├── config/
│   └── database.js          # Veritabanı konfigürasyonu
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── upload.js            # File upload middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── menu.js              # Menu management routes
│   ├── customers.js         # Customer management routes
│   ├── orders.js            # Order management routes
│   └── reports.js           # Reporting routes
├── uploads/                 # Upload klasörleri
│   ├── menu/
│   ├── categories/
│   ├── profile/
│   └── thumbnails/
├── package.json
├── server.js                # Ana server dosyası
└── .env                     # Çevre değişkenleri
```

## 🧪 Testing

```bash
# Test çalıştırma
npm test

# Coverage raporu
npm run test:coverage
```

## 🚀 Production Deployment

### 1. Environment Variables
Production için `.env` dosyasını güncelleyin:
```env
NODE_ENV=production
DB_HOST=your_production_db_host
JWT_SECRET=your_very_secure_production_secret
```

### 2. Process Manager
PM2 ile production deployment:
```bash
npm install -g pm2
pm2 start server.js --name "restaurant-api"
pm2 startup
pm2 save
```

### 3. Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /path/to/your/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

Sorun yaşıyorsanız veya yardıma ihtiyacınız varsa:
- GitHub Issues açın
- Dokümantasyonu kontrol edin
- API endpoint'lerini test edin

---

## 📝 Changelog

### v1.0.0
- ✅ Temel authentication sistemi
- ✅ Menu yönetimi
- ✅ Müşteri yönetimi
- ✅ Sipariş sistemi
- ✅ Dosya yükleme
- ✅ Raporlama sistemi
- ✅ API güvenlik önlemleri 