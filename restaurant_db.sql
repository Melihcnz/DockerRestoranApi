-- Restaurant Management System Database
-- Docker MySQL 8.0 compatible version
-- Generated for containerized deployment

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Veritabanını kullan (Docker'da otomatik oluşturulur)
USE restaurant_db;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `image_url`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'Başlangıçlar', 'Lezzetli başlangıç yemekleri', NULL, 1, 1, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(2, 'Ana Yemekler', 'Doyurucu ana yemek seçenekleri', NULL, 1, 2, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(3, 'Pizzalar', 'Taze malzemeli pizzalarımız', NULL, 1, 3, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(4, 'İçecekler', 'Sıcak ve soğuk içecekler', NULL, 1, 4, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(5, 'Tatlılar', 'Ev yapımı tatlılarımız', NULL, 1, 5, '2025-06-17 09:40:01', '2025-06-17 09:40:01');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `loyalty_points` int(11) DEFAULT 0,
  `total_orders` int(11) DEFAULT 0,
  `total_spent` decimal(10,2) DEFAULT 0.00,
  `is_vip` tinyint(1) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `customers`
--

INSERT INTO `customers` (`id`, `first_name`, `last_name`, `email`, `phone`, `address`, `birth_date`, `loyalty_points`, `total_orders`, `total_spent`, `is_vip`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'Mehmet', 'Demir', 'mehmet@email.com', '+90 555 111 2233', NULL, NULL, 150, 12, 850.00, 0, NULL, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(2, 'Ayşe', 'Kaya', 'ayse@email.com', '+90 555 222 3344', NULL, NULL, 75, 6, 420.00, 0, NULL, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(3, 'Ali', 'Öz', 'ali@email.com', '+90 555 333 4455', NULL, NULL, 200, 18, 1200.00, 0, NULL, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(4, 'Ali', 'Veli', 'ali.veli@example.com', '+905551234567', 'İstanbul, Türkiye', '1990-05-15', 0, 0, 0.00, 0, 'VIP müşteri', '2025-06-18 10:08:25', '2025-06-18 10:08:25');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `inventory`
--

CREATE TABLE `inventory` (
  `id` int(11) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `current_stock` decimal(10,2) NOT NULL DEFAULT 0.00,
  `minimum_stock` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unit` varchar(20) NOT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `supplier` varchar(100) DEFAULT NULL,
  `last_restocked` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `menu_items`
--

CREATE TABLE `menu_items` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `ingredients` text DEFAULT NULL,
  `allergens` varchar(255) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `is_featured` tinyint(1) DEFAULT 0,
  `preparation_time` int(11) DEFAULT 15,
  `calories` int(11) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `menu_items`
--

INSERT INTO `menu_items` (`id`, `category_id`, `name`, `description`, `price`, `image_url`, `ingredients`, `allergens`, `is_available`, `is_featured`, `preparation_time`, `calories`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 1, 'Çorba', 'Günün çorbası', 25.00, NULL, NULL, NULL, 1, 0, 5, NULL, 0, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(2, 1, 'Meze Tabağı', 'Karışık meze tabağı', 45.00, NULL, NULL, NULL, 1, 1, 10, NULL, 0, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(3, 2, 'Izgara Köfte', 'Ev yapımı köfte', 65.00, NULL, NULL, NULL, 1, 1, 20, NULL, 0, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(4, 2, 'Tavuk Şiş', 'Marine edilmiş tavuk şiş', 55.00, NULL, NULL, NULL, 1, 0, 25, NULL, 0, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(5, 3, 'Margherita Pizza', 'Klasik margherita pizza', 75.00, NULL, NULL, NULL, 1, 1, 15, NULL, 0, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(6, 3, 'Karışık Pizza', 'Sucuk, salam, mantar, biber', 85.00, NULL, NULL, NULL, 1, 0, 18, NULL, 0, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(7, 4, 'Çay', 'Türk çayı', 8.00, NULL, NULL, NULL, 1, 0, 3, NULL, 0, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(8, 4, 'Kahve', 'Türk kahvesi', 15.00, NULL, NULL, NULL, 1, 0, 5, NULL, 0, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(9, 5, 'Baklava', 'Ev yapımı baklava', 35.00, NULL, NULL, NULL, 1, 1, 5, NULL, 0, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(10, 5, 'Sütlaç', 'Geleneksel sütlaç', 25.00, NULL, NULL, NULL, 1, 0, 5, NULL, 0, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(11, 5, 'Pasta', 'Pasta', 10.00, NULL, 'çikolata, bal, muz', 'süt', 1, 1, 10, 400, 0, '2025-06-18 15:37:55', '2025-06-18 15:37:55'),
(12, 1, 'Yeşillik', 'Yeşillik', 15.00, NULL, 'yeşil biber, domates, soğan', 'gluten', 1, 0, 5, 100, 0, '2025-06-21 15:08:43', '2025-06-21 15:08:43');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `order_number` varchar(20) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `table_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `order_type` enum('dine_in','takeaway','delivery') DEFAULT 'dine_in',
  `status` enum('pending','confirmed','preparing','ready','served','completed','cancelled') DEFAULT 'pending',
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_status` enum('pending','paid','refunded') DEFAULT 'pending',
  `payment_method` enum('cash','card','online') DEFAULT 'cash',
  `special_instructions` text DEFAULT NULL,
  `estimated_time` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `customer_id`, `table_id`, `user_id`, `order_type`, `status`, `subtotal`, `tax_amount`, `discount_amount`, `total_amount`, `payment_status`, `payment_method`, `special_instructions`, `estimated_time`, `created_at`, `updated_at`) VALUES
(1, 'ORD1750241271101', 1, 5, 4, 'dine_in', 'completed', 115.00, 20.70, 0.00, 135.70, 'pending', 'cash', 'Hızlı servis isteniyor', NULL, '2025-06-18 10:07:51', '2025-06-18 15:36:17'),
(2, 'ORD1750252738334', 4, 1, 4, 'dine_in', 'completed', 8.00, 1.44, 0.00, 9.44, 'pending', 'cash', '', NULL, '2025-06-18 13:18:58', '2025-08-25 19:09:49'),
(3, 'ORD1750254083499', 3, 2, 4, 'dine_in', 'ready', 35.00, 6.30, 0.00, 41.30, 'pending', 'cash', '', NULL, '2025-06-18 13:41:23', '2025-07-20 07:31:14'),
(4, 'ORD1750260935649', 3, 6, 4, 'takeaway', 'served', 8.00, 1.44, 0.00, 9.44, 'pending', 'cash', '', NULL, '2025-06-18 15:35:35', '2025-07-20 11:54:07'),
(5, 'ORD1750272969813', 1, 5, 4, 'dine_in', 'served', 8.00, 1.44, 0.00, 9.44, 'pending', 'cash', '', NULL, '2025-06-18 18:56:09', '2025-07-20 11:54:06'),
(6, 'ORD1750513472217', NULL, 1, 4, 'dine_in', 'completed', 25.00, 4.50, 0.00, 29.50, 'paid', 'card', '', NULL, '2025-06-21 13:44:32', '2025-06-21 14:07:19'),
(7, 'ORD1750513874408', NULL, 2, 4, 'dine_in', 'completed', 110.00, 19.80, 0.00, 129.80, 'paid', 'card', '', NULL, '2025-06-21 13:51:14', '2025-06-21 14:07:23'),
(8, 'ORD1750514780972', NULL, 3, 4, 'dine_in', 'served', 185.00, 33.30, 0.00, 218.30, 'paid', 'card', '', NULL, '2025-06-21 14:06:20', '2025-06-21 14:07:33'),
(9, 'ORD1750514879790', NULL, 1, 4, 'dine_in', 'served', 85.00, 15.30, 0.00, 100.30, 'paid', 'cash', '', NULL, '2025-06-21 14:07:59', '2025-07-20 11:54:06'),
(10, 'ORD1750519493476', NULL, 2, 4, 'dine_in', 'preparing', 23.00, 4.14, 0.00, 27.14, 'paid', 'cash', '', NULL, '2025-06-21 15:24:53', '2025-06-21 15:54:32'),
(11, 'ORD1750521261074', NULL, 3, 4, 'dine_in', 'completed', 35.00, 6.30, 0.00, 41.30, 'paid', 'card', '', NULL, '2025-06-21 15:54:21', '2025-06-21 15:56:34'),
(12, 'ORD1750521561962', NULL, 3, 4, 'dine_in', 'served', 65.00, 11.70, 0.00, 76.70, 'paid', 'card', '', NULL, '2025-06-21 15:59:21', '2025-07-20 07:19:59'),
(13, 'ORD1750607186315', NULL, 1, 4, 'dine_in', 'served', 25.00, 4.50, 0.00, 29.50, 'paid', 'card', '', NULL, '2025-06-22 15:46:26', '2025-07-20 11:54:06'),
(14, 'ORD1750794780983', NULL, 1, 4, 'dine_in', 'served', 130.00, 23.40, 0.00, 153.40, 'paid', 'card', '', NULL, '2025-06-24 19:53:00', '2025-07-20 11:54:05'),
(15, 'ORD1751207523014', NULL, 1, 4, 'dine_in', 'served', 50.00, 9.00, 0.00, 59.00, 'paid', 'card', '', NULL, '2025-06-29 14:32:03', '2025-07-20 11:54:05'),
(16, 'ORD1751729973042', NULL, 1, 4, 'dine_in', 'served', 65.00, 11.70, 0.00, 76.70, 'paid', 'card', '', NULL, '2025-07-05 15:39:33', '2025-07-20 11:54:05'),
(17, 'ORD1752304404955', NULL, 1, 4, 'dine_in', 'completed', 50.00, 9.00, 0.00, 59.00, 'paid', 'card', '', NULL, '2025-07-12 07:13:24', '2025-07-20 07:20:14'),
(18, 'ORD1753012653240', NULL, 1, 4, 'dine_in', 'preparing', 50.00, 9.00, 0.00, 59.00, 'paid', 'card', '', NULL, '2025-07-20 11:57:33', '2025-07-20 12:15:41'),
(19, 'ORD1753012694476', NULL, 2, 4, 'dine_in', 'preparing', 105.00, 18.90, 0.00, 123.90, 'paid', 'card', '', NULL, '2025-07-20 11:58:14', '2025-07-25 13:19:44'),
(20, 'ORD1753449563548', NULL, NULL, 4, 'takeaway', 'pending', 170.00, 30.60, 0.00, 200.60, 'paid', 'card', '', NULL, '2025-07-25 13:19:23', '2025-07-25 13:19:23'),
(21, 'ORD1753454767289', NULL, 3, 4, 'dine_in', 'pending', 75.00, 13.50, 0.00, 88.50, 'paid', 'card', '', NULL, '2025-07-25 14:46:07', '2025-07-25 14:46:07'),
(22, 'ORD1753458030440', NULL, 1, 4, 'dine_in', 'pending', 400.00, 72.00, 0.00, 472.00, 'paid', 'card', '', NULL, '2025-07-25 15:40:30', '2025-07-25 15:40:30'),
(23, 'ORD1753513720579', NULL, 1, 4, 'dine_in', 'pending', 39.00, 7.02, 0.00, 46.02, 'paid', 'card', '', NULL, '2025-07-26 07:08:40', '2025-07-26 07:08:40'),
(24, 'ORD1754578213217', NULL, 2, 4, 'dine_in', 'pending', 25.00, 4.50, 0.00, 29.50, 'paid', 'card', '', NULL, '2025-08-07 14:50:13', '2025-08-07 14:50:13'),
(25, 'ORD1755122969959', NULL, 1, 4, 'dine_in', 'pending', 25.00, 4.50, 0.00, 29.50, 'paid', 'card', '', NULL, '2025-08-13 22:09:29', '2025-08-13 22:09:29'),
(26, 'ORD1755683524483', NULL, 1, 4, 'dine_in', 'pending', 40.00, 7.20, 0.00, 47.20, 'paid', 'card', '', NULL, '2025-08-20 09:52:04', '2025-08-20 09:52:04'),
(27, 'ORD1755684078835', NULL, NULL, 4, 'takeaway', 'pending', 90.00, 16.20, 0.00, 106.20, 'paid', 'cash', '', NULL, '2025-08-20 10:01:18', '2025-08-20 10:01:18'),
(28, 'ORD1755684128137', NULL, 2, 4, 'dine_in', 'preparing', 368.00, 66.24, 0.00, 434.24, 'paid', 'cash', '', NULL, '2025-08-20 10:02:08', '2025-08-20 10:02:11'),
(29, 'ORD1755955718332', NULL, 1, 4, 'dine_in', 'pending', 32.00, 5.76, 0.00, 37.76, 'paid', 'cash', '', NULL, '2025-08-23 13:28:38', '2025-08-23 13:28:38'),
(30, 'ORD1755987350902', NULL, 1, 4, 'dine_in', 'pending', 90.00, 16.20, 0.00, 106.20, 'paid', 'card', '', NULL, '2025-08-23 22:15:50', '2025-08-23 22:15:50'),
(31, 'ORD1755987365331', NULL, 2, 4, 'dine_in', 'pending', 35.00, 6.30, 0.00, 41.30, 'paid', 'card', '', NULL, '2025-08-23 22:16:05', '2025-08-23 22:16:05'),
(32, 'ORD1756149018638', NULL, 8, 4, 'dine_in', 'pending', 165.00, 29.70, 0.00, 194.70, 'paid', 'card', '', NULL, '2025-08-25 19:10:18', '2025-08-25 19:10:18'),
(33, 'ORD1756149054403', NULL, NULL, 4, 'takeaway', 'pending', 550.00, 99.00, 0.00, 649.00, 'paid', 'card', '', NULL, '2025-08-25 19:10:54', '2025-08-25 19:10:54');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `menu_item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `special_requests` text DEFAULT NULL,
  `status` enum('pending','preparing','ready','served') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `menu_item_id`, `quantity`, `unit_price`, `total_price`, `special_requests`, `status`, `created_at`) VALUES
(1, 1, 1, 2, 25.00, 50.00, 'Az baharatlı', 'pending', '2025-06-18 10:07:51'),
(2, 1, 3, 1, 65.00, 65.00, NULL, 'pending', '2025-06-18 10:07:51'),
(3, 2, 7, 1, 8.00, 8.00, NULL, 'pending', '2025-06-18 13:18:58'),
(4, 3, 9, 1, 35.00, 35.00, NULL, 'pending', '2025-06-18 13:41:23'),
(5, 4, 7, 1, 8.00, 8.00, NULL, 'pending', '2025-06-18 15:35:35'),
(6, 5, 7, 1, 8.00, 8.00, NULL, 'pending', '2025-06-18 18:56:09'),
(7, 6, 1, 1, 25.00, 25.00, NULL, 'pending', '2025-06-21 13:44:32'),
(8, 7, 1, 1, 25.00, 25.00, NULL, 'pending', '2025-06-21 13:51:14'),
(9, 7, 6, 1, 85.00, 85.00, NULL, 'pending', '2025-06-21 13:51:14'),
(10, 8, 3, 2, 65.00, 130.00, NULL, 'pending', '2025-06-21 14:06:20'),
(11, 8, 4, 1, 55.00, 55.00, NULL, 'pending', '2025-06-21 14:06:20'),
(12, 9, 6, 1, 85.00, 85.00, NULL, 'pending', '2025-06-21 14:07:59'),
(13, 10, 7, 1, 8.00, 8.00, NULL, 'pending', '2025-06-21 15:24:53'),
(14, 10, 8, 1, 15.00, 15.00, NULL, 'pending', '2025-06-21 15:24:53'),
(15, 11, 9, 1, 35.00, 35.00, NULL, 'pending', '2025-06-21 15:54:21'),
(16, 12, 3, 1, 65.00, 65.00, NULL, 'pending', '2025-06-21 15:59:21'),
(17, 13, 1, 1, 25.00, 25.00, NULL, 'pending', '2025-06-22 15:46:26'),
(18, 14, 3, 2, 65.00, 130.00, NULL, 'pending', '2025-06-24 19:53:00'),
(19, 15, 1, 2, 25.00, 50.00, NULL, 'pending', '2025-06-29 14:32:03'),
(20, 16, 3, 1, 65.00, 65.00, NULL, 'pending', '2025-07-05 15:39:33'),
(21, 17, 1, 2, 25.00, 50.00, NULL, 'pending', '2025-07-12 07:13:24'),
(22, 18, 1, 2, 25.00, 50.00, NULL, 'pending', '2025-07-20 11:57:33'),
(23, 19, 9, 3, 35.00, 105.00, NULL, 'pending', '2025-07-20 11:58:14'),
(24, 20, 6, 2, 85.00, 170.00, NULL, 'pending', '2025-07-25 13:19:23'),
(25, 21, 1, 3, 25.00, 75.00, NULL, 'pending', '2025-07-25 14:46:07'),
(26, 22, 1, 16, 25.00, 400.00, NULL, 'pending', '2025-07-25 15:40:30'),
(27, 23, 7, 3, 8.00, 24.00, NULL, 'pending', '2025-07-26 07:08:40'),
(28, 23, 8, 1, 15.00, 15.00, NULL, 'pending', '2025-07-26 07:08:40'),
(29, 24, 1, 1, 25.00, 25.00, NULL, 'pending', '2025-08-07 14:50:13'),
(30, 25, 1, 1, 25.00, 25.00, NULL, 'pending', '2025-08-13 22:09:29'),
(31, 26, 7, 5, 8.00, 40.00, NULL, 'pending', '2025-08-20 09:52:04'),
(32, 27, 12, 6, 15.00, 90.00, NULL, 'pending', '2025-08-20 10:01:18'),
(33, 28, 6, 3, 85.00, 255.00, NULL, 'pending', '2025-08-20 10:02:08'),
(34, 28, 5, 1, 75.00, 75.00, NULL, 'pending', '2025-08-20 10:02:08'),
(35, 28, 7, 1, 8.00, 8.00, NULL, 'pending', '2025-08-20 10:02:08'),
(36, 28, 8, 2, 15.00, 30.00, NULL, 'pending', '2025-08-20 10:02:08'),
(37, 29, 7, 4, 8.00, 32.00, NULL, 'pending', '2025-08-23 13:28:38'),
(38, 30, 12, 6, 15.00, 90.00, NULL, 'pending', '2025-08-23 22:15:50'),
(39, 31, 9, 1, 35.00, 35.00, NULL, 'pending', '2025-08-23 22:16:05'),
(40, 32, 4, 3, 55.00, 165.00, NULL, 'pending', '2025-08-25 19:10:18'),
(41, 33, 4, 10, 55.00, 550.00, NULL, 'pending', '2025-08-25 19:10:54');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `reservations`
--

CREATE TABLE `reservations` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `table_id` int(11) DEFAULT NULL,
  `reservation_date` date NOT NULL,
  `reservation_time` time NOT NULL,
  `party_size` int(11) NOT NULL,
  `status` enum('pending','confirmed','seated','completed','cancelled','no_show') DEFAULT 'pending',
  `special_requests` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `settings`
--

INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `description`, `created_at`, `updated_at`) VALUES
(1, 'restaurant_name', 'Lezzet Durağı', 'Restoran adı', '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(2, 'tax_rate', '18', 'KDV oranı (%)', '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(3, 'currency', 'TL', 'Para birimi', '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(4, 'working_hours', '09:00-23:00', 'Çalışma saatleri', '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(5, 'phone', '+90 555 123 4567', 'Restoran telefonu', '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(6, 'address', 'Merkez Mah. Lezzet Sok. No:1 İstanbul', 'Restoran adresi', '2025-06-17 09:40:01', '2025-06-17 09:40:01');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `tables`
--

CREATE TABLE `tables` (
  `id` int(11) NOT NULL,
  `table_number` varchar(10) NOT NULL,
  `capacity` int(11) NOT NULL,
  `location` varchar(50) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `qr_code` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `tables`
--

INSERT INTO `tables` (`id`, `table_number`, `capacity`, `location`, `is_available`, `qr_code`, `created_at`) VALUES
(1, 'M1', 2, 'indoor', 1, NULL, '2025-06-17 09:40:01'),
(2, 'M2', 4, 'indoor', 1, NULL, '2025-06-17 09:40:01'),
(3, 'M3', 4, 'indoor', 1, NULL, '2025-06-17 09:40:01'),
(4, 'M4', 6, 'indoor', 1, NULL, '2025-06-17 09:40:01'),
(5, 'T1', 4, 'outdoor', 1, NULL, '2025-06-17 09:40:01'),
(6, 'T2', 6, 'outdoor', 1, NULL, '2025-06-17 09:40:01'),
(8, 'T3', 4, 'outdoor', 1, '', '2025-06-18 13:43:54'),
(9, 't4', 4, 'outdoor', 1, '', '2025-06-21 13:15:13');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `role` enum('admin','manager','staff','waiter','chef') DEFAULT 'staff',
  `phone` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `first_name`, `last_name`, `role`, `phone`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@restaurant.com', '$2a$10$eB/igOeyyWg6LLpP6kehxOSUz6ygU/uNul0YTcM0GFUbmpGb4osuq', 'Admin', 'User', 'admin', '+90 555 123 4567', 1, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(2, 'manager', 'manager@restaurant.com', '$2a$10$LOFVWx13N3Mzc49B9iHlgO2Ke6wjV4NhDDCVNDzes2I5mPnMHXPye', 'Restoran', 'Müdürü', 'manager', '+90 555 234 5678', 1, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(3, 'garson1', 'garson1@restaurant.com', '$2a$10$MXkRcLfWYFBAVH2GMX5/suU/f6BSwAsAYBMo89epvbyzXyRB4w432', 'Ahmet', 'Yılmaz', 'waiter', '+90 555 345 6789', 1, '2025-06-17 09:40:01', '2025-06-17 09:40:01'),
(4, 'melih', 'melih@gmail.com', '$2a$10$qQpyGRMs7k/cuhtDObtIEuYlpL8ZMmgzf3bbvrE1U.pgi0KigeLAi', 'Melih', 'Canaz', 'admin', '05538851409', 1, '2025-06-17 09:41:12', '2025-06-17 09:41:12'),
(5, 'Kadir', 'kadir@gmail.com', '$2a$10$cffQ6T/vmjYgcUSBdJbCvu8u6dbLkAVwxCpKwEg96jaoHXuEBfuwi', 'Kadir', 'Binici', 'admin', '05538853131', 1, '2025-06-17 09:48:19', '2025-06-17 09:48:19');

--
-- Dökümü yapılmış tablolar için indeksler
--

--
-- Tablo için indeksler `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Tablo için indeksler `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Tablo için indeksler `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`);

--
-- Tablo için indeksler `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Tablo için indeksler `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `table_id` (`table_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Tablo için indeksler `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `menu_item_id` (`menu_item_id`);

--
-- Tablo için indeksler `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `table_id` (`table_id`);

--
-- Tablo için indeksler `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Tablo için indeksler `tables`
--
ALTER TABLE `tables`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `table_number` (`table_number`);

--
-- Tablo için indeksler `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Dökümü yapılmış tablolar için AUTO_INCREMENT değeri
--

--
-- Tablo için AUTO_INCREMENT değeri `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Tablo için AUTO_INCREMENT değeri `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Tablo için AUTO_INCREMENT değeri `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Tablo için AUTO_INCREMENT değeri `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- Tablo için AUTO_INCREMENT değeri `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- Tablo için AUTO_INCREMENT değeri `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Tablo için AUTO_INCREMENT değeri `tables`
--
ALTER TABLE `tables`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Tablo için AUTO_INCREMENT değeri `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Dökümü yapılmış tablolar için kısıtlamalar
--

--
-- Tablo kısıtlamaları `menu_items`
--
ALTER TABLE `menu_items`
  ADD CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Tablo kısıtlamaları `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`);

--
-- Tablo kısıtlamaları `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
