# Node.js 18 kullan
FROM node:18-alpine

# Çalışma dizini oluştur
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install --only=production

# Uygulama kodunu kopyala
COPY . .

# Uploads klasörü için izin ver
RUN mkdir -p uploads/categories uploads/menu uploads/profile uploads/thumbnails
RUN chown -R node:node uploads

# Port belirt
EXPOSE 5000

# Node kullanıcısı ile çalıştır
USER node

# Uygulamayı başlat
CMD ["npm", "start"]
