-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 05, 2026 at 07:15 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lanvai_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_logins`
--

CREATE TABLE `admin_logins` (
  `id` int(11) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `login_status` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `advertiser_access_codes`
--

CREATE TABLE `advertiser_access_codes` (
  `id` int(11) NOT NULL,
  `access_code` varchar(50) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `advertiser_campaigns`
--

CREATE TABLE `advertiser_campaigns` (
  `id` int(11) NOT NULL,
  `campaign_id` varchar(50) DEFAULT NULL,
  `advertiser_name` varchar(255) NOT NULL,
  `advertiser_email` varchar(255) NOT NULL,
  `advertiser_phone` varchar(50) DEFAULT NULL,
  `business_name` varchar(255) DEFAULT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `ad_format` varchar(100) NOT NULL,
  `budget` decimal(10,2) NOT NULL,
  `duration_days` int(11) NOT NULL,
  `target_audience` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `impressions` int(11) DEFAULT 0,
  `clicks` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `response` text DEFAULT NULL,
  `admin_name` varchar(100) DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `advertiser_campaigns`
--

INSERT INTO `advertiser_campaigns` (`id`, `campaign_id`, `advertiser_name`, `advertiser_email`, `advertiser_phone`, `business_name`, `industry`, `ad_format`, `budget`, `duration_days`, `target_audience`, `message`, `status`, `impressions`, `clicks`, `created_at`, `updated_at`, `response`, `admin_name`, `responded_at`) VALUES
(1, 'CAMMRYOSI29970D', 'Bryson Henry', 'brysonwaswa24@gmail.com', '+254794914597', 'Brystech', 'E-commerce', 'Banner', 699.00, 67, 'Local', 'jjjkkk', 'responded', 0, 0, '2026-07-24 08:37:03', '2026-07-24 13:17:16', 'hhhhh', 'EDULINK Team', '2026-07-24 13:17:16'),
(2, 'CAMMRYYWWXWYNKO', 'Bryson Henry Waswa', 'brysonwaswa24@gmail.com', '+254794914597', 'Brystech', 'Retail', 'Banner', 7888.00, 9, 'General', 'hhhhh', 'responded', 0, 0, '2026-07-24 13:20:25', '2026-07-24 13:20:53', 'hello', 'Lanvai Ad Team', '2026-07-24 13:20:53'),
(3, 'CAMMRYZDOOAGUQL', 'Bryson Henry Waswa', 'brysonwaswa24@gmail.com', '+254794914597', 'Brystech', 'Entertainment', 'Banner', 79999.00, 9, 'Students', 'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjbbbbbbbbbbbbbbbbb', 'responded', 0, 0, '2026-07-24 13:33:28', '2026-07-24 13:34:26', 'hhhjjjhjhj', 'Lanvai Ad Team', '2026-07-24 13:34:26'),
(4, 'CAMMRZ029W9P3Y3', 'Bryson Henry', 'brysonwaswa1@gmail.com', '+254794914597', 'Brystech', 'Finance', 'Sponsored', 258.00, 36, 'Business', 'ttgfvy', 'pending', 0, 0, '2026-07-24 13:52:35', '2026-07-24 13:52:35', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `ad_exchange_inquiries`
--

CREATE TABLE `ad_exchange_inquiries` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `inquiry_type` varchar(50) NOT NULL,
  `course` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `response` text DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `admin_name` varchar(100) DEFAULT NULL,
  `email_sent` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ad_exchange_inquiries`
--

INSERT INTO `ad_exchange_inquiries` (`id`, `full_name`, `email`, `phone`, `inquiry_type`, `course`, `message`, `status`, `response`, `responded_at`, `admin_name`, `email_sent`, `created_at`, `updated_at`) VALUES
(1, 'Bryson Henry Waswa', 'brysonwaswa24@gmail.com', '0794914597', 'adowner', 'Ad Space Listing: tiktok', 'Ad Space: tiktok\n\nMessage: hhhh', 'responded', 'kkk', '2026-07-24 08:36:00', 'Lanvai AdExchange Team', 0, '2026-07-24 08:35:25', '2026-07-24 08:36:00'),
(2, 'Bryson Henry Waswa', 'brysonwaswa24@gmail.com', '0794914597', 'adowner', 'Ad Space Listing: tiktok', 'Ad Space: tiktok\n\nMessage: jjjjj', 'responded', 'kkkk', '2026-07-24 10:09:23', 'Lanvai Ad Team', 0, '2026-07-24 09:53:25', '2026-07-24 10:09:23'),
(3, 'Bryson Henry Waswa', 'brysonwaswa24@gmail.com', '0794914597', 'adowner', 'Ad Space Listing: tiktok', 'Ad Space: tiktok\n\nMessage: hhihihiouio', 'responded', 'jjjjjjjjjjjjj,,,,,,,,,,,,,,,,,,,,', '2026-07-24 10:43:44', 'Lanvai Ad Team', 0, '2026-07-24 10:43:12', '2026-07-24 10:43:44'),
(4, 'Bryson Henry', 'brysonwaswa1@gmail.com', '0794914597', 'adowner', 'Ad Space Listing: tiktok', 'Ad Space: tiktok\n\nMessage: jjjjj', 'responded', 'jjjjjj', '2026-07-24 13:03:32', 'Lanvai Ad Team', 0, '2026-07-24 13:03:02', '2026-07-24 13:03:32'),
(5, 'Bryson Henry Waswa', 'brysonwaswa24@gmail.com', '0794914597', 'adowner', 'Ad Space Listing: tiktok', 'Ad Space: tiktok\n\nMessage: hello', 'responded', 'hhello', '2026-07-24 13:22:11', 'Lanvai Ad Team', 0, '2026-07-24 13:21:37', '2026-07-24 13:22:11'),
(6, 'Bryson Henry Waswa', 'brysonwaswa24@gmail.com', '0794914597', 'adowner', 'Ad Space Listing: tiktok', 'Ad Space: tiktok\n\nMessage: jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'responded', 'jjjjjjjjjjjjjjjjjjj', '2026-07-24 13:33:48', 'Lanvai Ad Team', 0, '2026-07-24 13:32:50', '2026-07-24 13:33:48'),
(7, 'Bryson Henry', 'brysonwaswa1@gmail.com', '+254794914597', 'adowner', 'Ad Space Listing: tiktok', 'Ad Space: tiktok\n\nMessage: hhgvh', 'pending', NULL, NULL, NULL, 0, '2026-07-24 13:51:53', '2026-07-24 13:51:53');

-- --------------------------------------------------------

--
-- Table structure for table `ad_exchange_selections`
--

CREATE TABLE `ad_exchange_selections` (
  `id` int(11) NOT NULL,
  `visitor_id` varchar(50) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `selected_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ad_exchange_selections`
--

INSERT INTO `ad_exchange_selections` (`id`, `visitor_id`, `category`, `selected_at`) VALUES
(1, 'visitor_2lxu06ljlb', 'Real Estate', '2026-07-24 08:35:14');

-- --------------------------------------------------------

--
-- Table structure for table `ad_packages`
--

CREATE TABLE `ad_packages` (
  `id` int(11) NOT NULL,
  `package_name` varchar(255) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `impressions_estimate` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `duration_days` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ad_packages`
--

INSERT INTO `ad_packages` (`id`, `package_name`, `category`, `price`, `impressions_estimate`, `description`, `duration_days`, `is_active`, `created_at`) VALUES
(1, 'Premium Homepage Banner', 'premium', 2500.00, 100000, 'Prime placement at the top of our homepage with maximum visibility.', 30, 1, '2026-07-24 08:13:12'),
(2, 'Sidebar Banner', 'standard', 800.00, 35000, 'Strategic sidebar placement visible on every page of the website.', 30, 1, '2026-07-24 08:13:12'),
(3, 'In-Content Native Ad', 'native', 1200.00, 50000, 'Seamlessly integrated ads that match content style for better engagement.', 30, 1, '2026-07-24 08:13:12'),
(4, 'Newsletter Sponsorship', 'newsletter', 600.00, 20000, 'Reach our engaged subscriber base directly in their inbox.', 30, 1, '2026-07-24 08:13:12'),
(5, 'Video Pre-roll Ad', 'premium', 3000.00, 80000, '15-second video ads before our premium video content.', 30, 1, '2026-07-24 08:13:12'),
(6, 'Category Page Banner', 'standard', 500.00, 20000, 'Targeted ads on specific category pages for relevant audiences.', 30, 1, '2026-07-24 08:13:12'),
(7, 'Sponsored Article', 'native', 1800.00, 60000, 'Full sponsored article written by our team about your brand.', 30, 1, '2026-07-24 08:13:12'),
(8, 'Weekly Spotlight', 'newsletter', 400.00, 15000, 'Featured placement in our weekly newsletter reaching key audiences.', 7, 1, '2026-07-24 08:13:12');

-- --------------------------------------------------------

--
-- Table structure for table `book_categories`
--

CREATE TABLE `book_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `book_categories`
--

INSERT INTO `book_categories` (`id`, `name`, `description`, `is_active`, `created_at`) VALUES
(1, 'Novels', 'Novels collection', 1, '2026-07-24 08:13:12'),
(2, 'Short stories', 'Short stories collection', 1, '2026-07-24 08:13:12'),
(3, 'Poems', 'Poems collection', 1, '2026-07-24 08:13:12'),
(4, 'Tongue twisters', 'Tongue twisters collection', 1, '2026-07-24 08:13:12'),
(5, 'Classic', 'Classic collection', 1, '2026-07-24 08:13:12'),
(6, 'Adventure', 'Adventure collection', 1, '2026-07-24 08:13:12'),
(7, 'Fantasy', 'Fantasy collection', 1, '2026-07-24 08:13:12'),
(8, 'Science fiction', 'Science fiction collection', 1, '2026-07-24 08:13:12'),
(9, 'Detective', 'Detective collection', 1, '2026-07-24 08:13:12'),
(10, 'Children', 'Children collection', 1, '2026-07-24 08:13:12'),
(11, 'Historical', 'Historical collection', 1, '2026-07-24 08:13:12'),
(12, 'Philosophy', 'Philosophy collection', 1, '2026-07-24 08:13:12'),
(13, 'Drama', 'Drama collection', 1, '2026-07-24 08:13:12'),
(14, 'Essays', 'Essays collection', 1, '2026-07-24 08:13:12'),
(15, 'Biography', 'Biography collection', 1, '2026-07-24 08:13:12'),
(16, 'Fairytales', 'Fairytales collection', 1, '2026-07-24 08:13:12'),
(17, 'Religion', 'Religion collection', 1, '2026-07-24 08:13:12'),
(18, 'Romance', 'Romance collection', 1, '2026-07-24 08:13:12'),
(19, 'Mystery', 'Mystery collection', 1, '2026-07-24 08:13:12'),
(20, 'Professional literature', 'Professional literature collection', 1, '2026-07-24 08:13:12');

-- --------------------------------------------------------

--
-- Table structure for table `book_submissions`
--

CREATE TABLE `book_submissions` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `book_type` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `year_published` int(11) DEFAULT NULL,
  `genre` varchar(100) DEFAULT NULL,
  `other_books` text DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `submission_status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `book_submissions`
--

INSERT INTO `book_submissions` (`id`, `title`, `author`, `category`, `book_type`, `price`, `year_published`, `genre`, `other_books`, `phone`, `email`, `submission_status`, `created_at`, `updated_at`) VALUES
(1, 'vgyugui', 'jkiuhi', 'Physical book', 'ebook', 55.00, NULL, 'fantasy', 'hhjjkk', '254794914597', 'brysonwaswa24@gmail.com', 'pending', '2026-08-05 15:59:08', '2026-08-05 15:59:08');

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `name`, `address`, `latitude`, `longitude`, `phone`, `email`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Nairobi Campus', 'Nairobi, Kenya', -1.29210000, 36.82190000, '+254 700 000 000', 'nairobi@lanvai.com', 1, '2026-07-24 08:13:12', '2026-07-24 08:13:12'),
(2, 'Online Campus', 'Remote Learning', 0.00000000, 0.00000000, '+254 700 000 001', 'online@lanvai.com', 1, '2026-07-24 08:13:12', '2026-07-24 08:13:12'),
(3, 'Innovation Hub Lagos', 'Lagos, Nigeria', 6.52440000, 3.37920000, '+234 800 000 000', 'lagos@lanvai.com', 1, '2026-07-24 08:13:12', '2026-07-24 08:13:12');

-- --------------------------------------------------------

--
-- Table structure for table `click_events`
--

CREATE TABLE `click_events` (
  `id` int(11) NOT NULL,
  `visitor_id` varchar(50) DEFAULT NULL,
  `element_id` varchar(255) DEFAULT NULL,
  `element_class` varchar(255) DEFAULT NULL,
  `element_text` text DEFAULT NULL,
  `page_url` varchar(500) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `click_events`
--

INSERT INTO `click_events` (`id`, `visitor_id`, `element_id`, `element_class`, `element_text`, `page_url`, `ip_address`, `user_agent`, `created_at`) VALUES
(27, '1', 'btn-apply', 'btn-primary', 'Apply Now', '/courses.html', '192.168.1.1', 'Chrome/120.0.0.0', '2026-07-23 13:58:45'),
(28, '1', 'link-courses', 'nav-link', 'View Courses', '/index.html', '192.168.1.2', 'Firefox/120.0.0.0', '2026-07-23 13:58:45'),
(29, '1', 'btn-register', 'btn-success', 'Register', '/adexchange.html', '192.168.1.3', 'Safari/17.0.0.0', '2026-07-22 13:58:45'),
(30, 'visitor_2lxu06ljlb', 'nextStepBtn', 'btn-next-step', 'Next Step →', '/', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:53:06'),
(31, 'visitor_2lxu06ljlb', '', 'btn-next-step', 'Submit →', '/', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:53:08'),
(32, 'visitor_2lxu06ljlb', 'chatToggle', 'chat-toggle', '💬AI', '/', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:57:17'),
(33, 'visitor_2lxu06ljlb', 'chatClose', 'chat-close', '✕', '/', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:57:20'),
(34, 'visitor_2lxu06ljlb', 'nextStepBtn', 'btn-next-step', 'Next Step →', '/', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:57:33'),
(35, 'visitor_2lxu06ljlb', '', 'btn-next-step', 'Submit →', '/', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:57:35'),
(36, 'visitor_2lxu06ljlb', '', 'dropdown-btn', '🌐 PartnerWebsites ▾', '/index.html', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:58:09'),
(37, 'visitor_2lxu06ljlb', '', 'nav-link', '👥 Our Team', '/index.html', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:58:13'),
(38, 'visitor_2lxu06ljlb', '', '', '📚 EduLink Courses', '/team.html', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:58:18'),
(39, 'visitor_2lxu06ljlb', '', '', 'Institution', '/courses.html', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:58:22'),
(40, 'visitor_2lxu06ljlb', '', '', 'Students', '/courses.html', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:58:28'),
(41, 'visitor_2lxu06ljlb', '', 'btn', 'Library', '/students.html', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:58:36'),
(42, 'visitor_2lxu06ljlb', '', '', 'Institution Hosted Courses', '/institution.html', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:59:18'),
(43, 'visitor_2lxu06ljlb', '', '', '⬅️', '/institutionhosted.html', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:59:25');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `course_name` varchar(255) NOT NULL,
  `cluster_points` varchar(50) DEFAULT NULL,
  `period_years` decimal(5,2) NOT NULL,
  `category` varchar(100) NOT NULL,
  `program_type` varchar(100) NOT NULL,
  `semesters` int(11) NOT NULL,
  `offers_certificate` tinyint(1) DEFAULT 0,
  `pacing` varchar(50) NOT NULL CHECK (`pacing` in ('Self-paced','Semester Live')),
  `cost_per_year` decimal(12,2) NOT NULL,
  `intake_date` date NOT NULL,
  `enrollment_mode` varchar(50) NOT NULL CHECK (`enrollment_mode` in ('online','physical','hybrid')),
  `enrollment_schedule` varchar(50) NOT NULL CHECK (`enrollment_schedule` in ('rolling','intake')),
  `enrollment_type` varchar(50) NOT NULL CHECK (`enrollment_type` in ('fulltime','parttime','both')),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_analytics`
--

CREATE TABLE `course_analytics` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `views` int(11) DEFAULT 0,
  `clicks` int(11) DEFAULT 0,
  `enrollments` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_inquiries`
--

CREATE TABLE `course_inquiries` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `course` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `response` text DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `email_sent` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_inquiries`
--

INSERT INTO `course_inquiries` (`id`, `full_name`, `email`, `phone`, `course`, `message`, `status`, `response`, `responded_at`, `email_sent`, `created_at`, `updated_at`) VALUES
(1, 'Bryson Henry Waswa', 'brysonwaswa24@gmail.com', '+254794914597', 'Python', 'hello', 'responded', 'hello', '2026-07-24 08:17:30', 1, '2026-07-24 08:16:49', '2026-07-24 08:17:31'),
(2, 'Bryson Henry Waswa', 'brysonwaswa24@gmail.com', '+254794914597', 'AI & ML', 'jkjhiuiuhuiy', 'responded', 'hjjmjmjkmk,k,kjuiu', '2026-08-05 16:00:23', 1, '2026-07-24 13:35:24', '2026-08-05 16:00:24');

-- --------------------------------------------------------

--
-- Table structure for table `course_topics`
--

CREATE TABLE `course_topics` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `topic_name` varchar(255) NOT NULL,
  `video_url` varchar(500) DEFAULT NULL,
  `pdf_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_weekly_timetables`
--

CREATE TABLE `course_weekly_timetables` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `timetable_file` varchar(500) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `daily_stats`
--

CREATE TABLE `daily_stats` (
  `id` int(11) NOT NULL,
  `stat_date` date DEFAULT NULL,
  `total_visitors` int(11) DEFAULT 0,
  `total_page_views` int(11) DEFAULT 0,
  `total_clicks` int(11) DEFAULT 0,
  `total_submissions` int(11) DEFAULT 0,
  `unique_visitors` int(11) DEFAULT 0,
  `avg_session_duration` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `daily_stats`
--

INSERT INTO `daily_stats` (`id`, `stat_date`, `total_visitors`, `total_page_views`, `total_clicks`, `total_submissions`, `unique_visitors`, `avg_session_duration`, `created_at`, `updated_at`) VALUES
(1, '2026-07-24', 0, 28, 26, 8, 1, 0, '2026-07-24 08:14:08', '2026-07-24 13:43:04'),
(2, '2026-08-05', 0, 15, 14, 2, 1, 0, '2026-08-05 15:52:38', '2026-08-05 15:59:25');

-- --------------------------------------------------------

--
-- Table structure for table `expert_consultations`
--

CREATE TABLE `expert_consultations` (
  `id` int(11) NOT NULL,
  `visitor_id` varchar(50) DEFAULT NULL,
  `business_category` varchar(100) NOT NULL,
  `business_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `consultation_status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expert_consultations`
--

INSERT INTO `expert_consultations` (`id`, `visitor_id`, `business_category`, `business_name`, `email`, `phone`, `consultation_status`, `created_at`) VALUES
(1, 'visitor_2lxu06ljlb', 'Manufacturing', 'Brystech', 'brysonwaswa24@gmail.com', '0794914597', 'pending', '2026-07-24 08:18:17'),
(2, 'visitor_2lxu06ljlb', 'Hospitality', 'Brystech', 'brysonwaswa24@gmail.com', '0794914597', 'pending', '2026-07-24 13:36:10'),
(3, 'visitor_2lxu06ljlb', 'Construction', 'Brystech', 'brysonwaswa24@gmail.com', '0794914597', 'pending', '2026-07-24 13:42:51'),
(4, 'visitor_2lxu06ljlb', 'Hospitality', 'Brystech', 'brysonwaswa24@gmail.com', '0794914597', 'pending', '2026-08-05 15:53:08'),
(5, 'visitor_2lxu06ljlb', 'Legal', 'Brystech', 'brysonwaswa24@gmail.com', '0794914597', 'pending', '2026-08-05 15:57:35');

-- --------------------------------------------------------

--
-- Table structure for table `expert_services`
--

CREATE TABLE `expert_services` (
  `id` int(11) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `service_type` varchar(100) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `business_category` varchar(100) DEFAULT 'General',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expert_services`
--

INSERT INTO `expert_services` (`id`, `category`, `service_type`, `title`, `description`, `icon`, `business_category`, `is_active`, `created_at`) VALUES
(1, 'marketing', 'marketing_services', 'Search Engine Optimization (SEO)', 'Boost your online visibility with our proven SEO strategies that drive organic traffic and improve search rankings.', 'fa-google', 'General', 0, '2026-07-24 08:13:11'),
(2, 'marketing', 'marketing_services', 'Social Media Management brysonggg', 'Engage your audience across all major platforms with tailored content strategies and community management.', 'fa-share-alt', 'General', 1, '2026-07-24 08:13:11'),
(3, 'marketing', 'marketing_services', 'Content Marketing', 'Create compelling content that tells your brand story and converts visitors into loyal customers.', 'fa-edit', 'General', 1, '2026-07-24 08:13:11'),
(4, 'marketing', 'marketing_services', 'Email Marketing Campaigns', 'Reach your customers directly with personalized email campaigns that drive engagement and sales.', 'fa-envelope', 'General', 1, '2026-07-24 08:13:11'),
(5, 'marketing', 'marketing_services', 'Pay-Per-Click Advertising (PPC)', 'Get immediate visibility with targeted PPC campaigns that maximize your ROI.', 'fa-ad', 'General', 1, '2026-07-24 08:13:11'),
(6, 'marketing', 'marketing_strategies', 'Digital Transformation Strategy', 'Comprehensive digital strategy to transform your business operations and customer engagement.', 'fa-rocket', 'General', 1, '2026-07-24 08:13:11'),
(7, 'marketing', 'marketing_strategies', 'Brand Identity Development', 'Build a powerful brand identity that resonates with your target audience and sets you apart.', 'fa-paint-brush', 'General', 1, '2026-07-24 08:13:11'),
(8, 'marketing', 'marketing_strategies', 'Market Penetration Strategy', 'Strategic approach to expand your market share and reach new customer segments effectively.', 'fa-bullseye', 'General', 1, '2026-07-24 08:13:11'),
(9, 'marketing', 'marketing_strategies', 'Customer Retention Programs', 'Develop loyalty programs and retention strategies to maximize customer lifetime value.', 'fa-heart', 'General', 1, '2026-07-24 08:13:11'),
(10, 'restructuring', 'restructuring_services', 'Organizational Restructuring', 'Redesign your organizational structure for improved efficiency, agility, and growth.', 'fa-sitemap', 'General', 1, '2026-07-24 08:13:11'),
(11, 'restructuring', 'restructuring_services', 'Business Process Reengineering', 'Transform your business processes to achieve dramatic improvements in productivity and quality.', 'fa-cogs', 'General', 1, '2026-07-24 08:13:12'),
(12, 'restructuring', 'restructuring_services', 'Financial Restructuring', 'Optimize your financial structure for sustainable growth and improved profitability.', 'fa-chart-line', 'General', 1, '2026-07-24 08:13:12'),
(13, 'restructuring', 'restructuring_services', 'Digital Workflow Optimization', 'Streamline your workflows with digital solutions that enhance efficiency and collaboration.', 'fa-tasks', 'General', 1, '2026-07-24 08:13:12'),
(14, 'restructuring', 'restructuring_strategies', 'Change Management Strategy', 'Effectively manage organizational change with proven strategies that ensure smooth transitions.', 'fa-exchange-alt', 'General', 1, '2026-07-24 08:13:12'),
(15, 'restructuring', 'restructuring_strategies', 'Lean Operations Implementation', 'Implement lean methodologies to eliminate waste and maximize value delivery.', 'fa-microscope', 'General', 1, '2026-07-24 08:13:12'),
(16, 'restructuring', 'restructuring_strategies', 'Innovation Framework Design', 'Design an innovation framework that fosters creativity and drives continuous improvement.', 'fa-lightbulb', 'General', 1, '2026-07-24 08:13:12'),
(17, 'restructuring', 'restructuring_strategies', 'Strategic Partnership Development', 'Identify and develop strategic partnerships that accelerate growth and create value.', 'fa-handshake', 'General', 1, '2026-07-24 08:13:12'),
(18, 'marketing', 'marketing_services', 'Social Media Management bryson', 'nnnnnnnnn', 'fa-cog', 'E-commerce', 1, '2026-07-24 08:41:13'),
(19, 'marketing', 'marketing_services', 'bryson', 'bryosonnnjknfkecr', 'fa-cog', 'E-commerce', 1, '2026-07-24 13:56:52');

-- --------------------------------------------------------

--
-- Table structure for table `form_submissions`
--

CREATE TABLE `form_submissions` (
  `id` int(11) NOT NULL,
  `visitor_id` varchar(50) DEFAULT NULL,
  `form_type` varchar(100) DEFAULT NULL,
  `form_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`form_data`)),
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `form_submissions`
--

INSERT INTO `form_submissions` (`id`, `visitor_id`, `form_type`, `form_data`, `ip_address`, `user_agent`, `created_at`) VALUES
(9, '1', 'contact', '{\"name\":\"John Doe\",\"email\":\"john@email.com\"}', '192.168.1.1', 'Chrome/120.0.0.0', '2026-07-23 13:58:45'),
(10, '1', 'inquiry', '{\"name\":\"Jane Smith\",\"email\":\"jane@email.com\"}', '192.168.1.2', 'Firefox/120.0.0.0', '2026-07-22 13:58:45'),
(11, 'visitor_2lxu06ljlb', 'expertsForm', '{}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:53:08'),
(12, 'visitor_2lxu06ljlb', 'expertsForm', '{}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:57:35');

-- --------------------------------------------------------

--
-- Table structure for table `institutions`
--

CREATE TABLE `institutions` (
  `id` int(11) NOT NULL,
  `institution_name` varchar(255) NOT NULL,
  `branches` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`branches`)),
  `email` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `about` text DEFAULT NULL,
  `achievements` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `review_status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `institution_branches`
--

CREATE TABLE `institution_branches` (
  `id` int(11) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `website` varchar(500) DEFAULT NULL,
  `manual_address` text DEFAULT NULL,
  `automatic_address` text DEFAULT NULL,
  `social_whatsapp` varchar(255) DEFAULT NULL,
  `social_instagram` varchar(255) DEFAULT NULL,
  `social_linkedin` varchar(255) DEFAULT NULL,
  `social_twitter` varchar(255) DEFAULT NULL,
  `social_telegram` varchar(255) DEFAULT NULL,
  `social_facebook` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `institution_hosted_courses`
--

CREATE TABLE `institution_hosted_courses` (
  `id` int(11) NOT NULL,
  `institution_id` int(11) DEFAULT NULL,
  `enrollment_type` varchar(50) DEFAULT NULL,
  `course_name` varchar(255) NOT NULL,
  `cluster_points` varchar(50) DEFAULT NULL,
  `period_years` decimal(3,1) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `branch_offering` varchar(255) DEFAULT NULL,
  `program_type` varchar(100) DEFAULT NULL,
  `cost_per_year` decimal(10,2) DEFAULT NULL,
  `intake_date` varchar(50) DEFAULT NULL,
  `realtime_videos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`realtime_videos`)),
  `status` varchar(50) DEFAULT 'active',
  `views` int(11) DEFAULT 0,
  `clicks` int(11) DEFAULT 0,
  `students` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lanvai_hosted_courses`
--

CREATE TABLE `lanvai_hosted_courses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `institution_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `about_us` text DEFAULT NULL,
  `achievements` text DEFAULT NULL,
  `consent_10_percent` tinyint(1) DEFAULT 0,
  `course_name` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `semesters` int(11) DEFAULT NULL,
  `certification_body` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `delivery_mode` varchar(50) DEFAULT NULL,
  `admission` varchar(100) DEFAULT NULL,
  `study` varchar(50) DEFAULT NULL,
  `course_type` varchar(50) DEFAULT NULL,
  `topics` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`topics`)),
  `timetable_files` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`timetable_files`)),
  `review_status` varchar(50) DEFAULT 'pending',
  `is_active` tinyint(1) DEFAULT 1,
  `enrollment_type` varchar(50) DEFAULT 'onlineRollingFulltime',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lanvai_inquiries`
--

CREATE TABLE `lanvai_inquiries` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `response` text DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `email_sent` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lanvai_inquiries`
--

INSERT INTO `lanvai_inquiries` (`id`, `full_name`, `email`, `phone`, `subject`, `message`, `status`, `response`, `responded_at`, `email_sent`, `created_at`, `updated_at`) VALUES
(1, 'Bryson Henry Waswa', 'brysonwaswa24@gmail.com', '+254794914597', 'General Inquiry', 'iiouj09i09ij0', 'responded', 'hello', '2026-07-24 08:15:03', 1, '2026-07-24 08:14:46', '2026-07-24 08:15:06'),
(2, 'Bryson Henry', 'brysonwaswa1@gmail.com', '+254794914597', 'General Inquiry', 'yuhuihjjk', 'responded', 'kkkk', '2026-07-24 08:21:53', 1, '2026-07-24 08:21:26', '2026-07-24 08:21:54'),
(3, 'Bryson Henry Waswa', 'brysonwaswa24@gmail.com', '+254794914597', 'Partnership', 'gyutyu78tyutty8t78gyuty8gyu78ty', 'pending', NULL, NULL, 0, '2026-07-24 13:35:01', '2026-07-24 13:35:01');

-- --------------------------------------------------------

--
-- Table structure for table `library_books`
--

CREATE TABLE `library_books` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `genre` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `book_type` varchar(50) DEFAULT 'ebook',
  `year_published` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `cover_image` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `library_books`
--

INSERT INTO `library_books` (`id`, `title`, `author`, `category`, `genre`, `price`, `book_type`, `year_published`, `description`, `cover_image`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'The Alchemist', 'Paulo Coelho', 'Novels', 'Adventure', 12.99, 'ebook', 1988, NULL, NULL, 1, '2026-07-24 08:13:12', '2026-07-24 08:13:12'),
(2, 'Dune', 'Frank Herbert', 'Science fiction', 'Science fiction', 18.50, 'ebook', 1965, NULL, NULL, 1, '2026-07-24 08:13:12', '2026-07-24 08:13:12'),
(3, 'Pride and Prejudice', 'Jane Austen', 'Classic', 'Classic', 9.99, 'ebook', 1813, NULL, NULL, 1, '2026-07-24 08:13:12', '2026-07-24 08:13:12'),
(4, 'Sherlock Holmes', 'Arthur Conan Doyle', 'Detective', 'Mystery', 14.20, 'ebook', 1887, NULL, NULL, 1, '2026-07-24 08:13:12', '2026-07-24 08:13:12'),
(5, 'Harry Potter and the Sorcerer\'s Stone', 'J.K. Rowling', 'Fantasy', 'Fantasy', 22.00, 'ebook', 1997, NULL, NULL, 1, '2026-07-24 08:13:12', '2026-07-24 08:13:12'),
(6, 'The Hobbit', 'J.R.R. Tolkien', 'Adventure', 'Fantasy', 11.40, 'ebook', 1937, NULL, NULL, 1, '2026-07-24 08:13:12', '2026-07-24 08:13:12'),
(7, '1984', 'George Orwell', 'Science fiction', 'Science fiction', 10.99, 'ebook', 1949, NULL, NULL, 1, '2026-07-24 08:13:12', '2026-07-24 08:13:12'),
(8, 'Little Women', 'Louisa May Alcott', 'Classic', 'Classic', 8.75, 'ebook', 1868, NULL, NULL, 1, '2026-07-24 08:13:12', '2026-07-24 08:13:12');

-- --------------------------------------------------------

--
-- Table structure for table `media_insights`
--

CREATE TABLE `media_insights` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `type` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `author` varchar(255) DEFAULT NULL,
  `image` longtext DEFAULT NULL,
  `content_type` varchar(50) DEFAULT 'Marketing',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `media_insights`
--

INSERT INTO `media_insights` (`id`, `title`, `category`, `type`, `description`, `author`, `image`, `content_type`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Future of Digital Commerce', 'E-commerce', 'Trend Analysis', 'In-depth analysis of where e-commerce is heading in the next 5 years.', 'Dr. Sarah Johnson', NULL, 'Marketing', 1, '2026-07-24 08:13:11', '2026-07-24 08:13:11'),
(2, 'Tech Industry Disruption', 'Technology', 'Market Research', 'How emerging technologies are reshaping the tech landscape.', 'Mark Thompson', NULL, 'Marketing', 1, '2026-07-24 08:13:11', '2026-07-24 08:13:11'),
(3, 'Healthcare Digital Transformation', 'Healthcare', 'Case Study', 'Case study of successful digital transformation in healthcare.', 'Dr. James Wilson', NULL, 'Restructuring', 1, '2026-07-24 08:13:11', '2026-07-24 08:13:11'),
(4, 'Real Estate Investment Strategies', 'Real Estate', 'Expert Opinion', 'Expert insights on real estate investment opportunities.', 'Lisa Martinez', NULL, 'Restructuring', 1, '2026-07-24 08:13:11', '2026-07-24 08:13:11'),
(5, 'Educational Technology Trends', 'Education', 'Trend Analysis', 'Latest trends and innovations in educational technology.', 'Prof. David Chen', NULL, 'Marketing', 1, '2026-07-24 08:13:11', '2026-07-24 08:13:11');

-- --------------------------------------------------------

--
-- Table structure for table `media_news`
--

CREATE TABLE `media_news` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `alert` varchar(50) NOT NULL DEFAULT 'not-causing',
  `description` text NOT NULL,
  `source` varchar(255) DEFAULT NULL,
  `image` longtext DEFAULT NULL,
  `content_type` varchar(50) DEFAULT 'Marketing',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `media_news`
--

INSERT INTO `media_news` (`id`, `title`, `category`, `date`, `alert`, `description`, `source`, `image`, `content_type`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Digital Marketing Trends 2024', 'Technology', '2024-03-15', 'not-causing', 'Latest trends in digital marketing that will shape the industry this year.', 'TechCrunch', NULL, 'Marketing', 1, '2026-07-24 08:13:11', '2026-07-24 08:13:11'),
(2, 'E-commerce Boom in Africa', 'E-commerce', '2024-03-10', 'causing', 'Rapid growth of e-commerce platforms across African markets causing major shifts.', 'Business Daily', NULL, 'Marketing', 1, '2026-07-24 08:13:11', '2026-07-24 08:13:11'),
(3, 'Healthcare Tech Revolution', 'Healthcare', '2024-03-05', 'not-causing', 'New technologies transforming healthcare delivery and patient care.', 'Health Tech Magazine', NULL, 'Restructuring', 1, '2026-07-24 08:13:11', '2026-07-24 08:13:11'),
(4, 'Real Estate Market Update', 'Real Estate', '2024-02-28', 'causing', 'Property prices surge causing alarm among potential homebuyers.', 'Property Weekly', NULL, 'Restructuring', 1, '2026-07-24 08:13:11', '2026-07-24 08:13:11'),
(5, 'EdTech Growth Statistics', 'Education', '2024-02-20', 'not-causing', 'Educational technology sector shows remarkable growth.', 'EdSurge', NULL, 'Marketing', 1, '2026-07-24 08:13:11', '2026-07-24 08:13:11'),
(6, 'AI in Marketing', 'Technology', '2024-03-12', 'causing', 'AI adoption causing disruption in traditional marketing roles.', 'Wired', NULL, 'Marketing', 1, '2026-07-24 08:13:11', '2026-07-24 08:13:11');

-- --------------------------------------------------------

--
-- Table structure for table `media_submissions`
--

CREATE TABLE `media_submissions` (
  `id` int(11) NOT NULL,
  `visitor_id` varchar(50) DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `submission_status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `page_views`
--

CREATE TABLE `page_views` (
  `id` int(11) NOT NULL,
  `visitor_id` varchar(50) DEFAULT NULL,
  `page_url` varchar(500) DEFAULT NULL,
  `page_title` varchar(255) DEFAULT NULL,
  `referrer_url` varchar(500) DEFAULT NULL,
  `time_spent` int(11) DEFAULT 0,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `page_views`
--

INSERT INTO `page_views` (`id`, `visitor_id`, `page_url`, `page_title`, `referrer_url`, `time_spent`, `ip_address`, `user_agent`, `created_at`) VALUES
(29, '1', '/index.html', 'Homepage', 'https://google.com', 0, '192.168.1.1', 'Chrome/120.0.0.0', '2026-07-23 13:58:45'),
(30, '1', '/courses.html', 'Courses', 'https://google.com', 0, '192.168.1.2', 'Firefox/120.0.0.0', '2026-07-23 13:58:45'),
(31, '1', '/adexchange.html', 'AdExchange', 'https://google.com', 0, '192.168.1.3', 'Safari/17.0.0.0', '2026-07-22 13:58:45'),
(32, '1', '/experts.html', 'Experts', 'https://google.com', 0, '192.168.1.4', 'Chrome/120.0.0.0', '2026-07-22 13:58:45'),
(33, '1', '/contact.html', 'Contact', 'https://google.com', 0, '192.168.1.5', 'Firefox/120.0.0.0', '2026-07-21 13:58:45'),
(34, 'visitor_2lxu06ljlb', '/', 'Lanvai Marketing', '', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:52:38'),
(35, 'visitor_2lxu06ljlb', '/service-details.html', 'Service Details - Lanvai Experts', 'http://localhost:5000/experts.html?category=Hospitality', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:53:35'),
(36, 'visitor_2lxu06ljlb', '/get-quote.html', 'Get a Quote - Lanvai Experts', 'http://localhost:5000/service-details.html?title=bryson&service=Marketing%20Services&category=E-commerce&details=bryosonnnjknfkecr', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:53:38'),
(37, 'visitor_2lxu06ljlb', '/', 'Lanvai Marketing', '', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:54:01'),
(38, 'visitor_2lxu06ljlb', '/', 'Lanvai Marketing', '', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:57:00'),
(39, 'visitor_2lxu06ljlb', '/service-details.html', 'Service Details - Lanvai Experts', 'http://localhost:5000/experts.html?category=Legal', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:57:49'),
(40, 'visitor_2lxu06ljlb', '/get-quote.html', 'Get a Quote - Lanvai Experts', 'http://localhost:5000/service-details.html?title=Digital%20Transformation%20Strategy&service=Marketing%20Strategies&category=E-commerce&details=Comprehensive%20digital%20strategy%20to%20transform%20your%20business%20operations%20and%20customer%20engagement.', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:57:52'),
(41, 'visitor_2lxu06ljlb', '/index.html', 'Lanvai Marketing', 'http://localhost:5000/service-details.html?title=Digital%20Transformation%20Strategy&service=Marketing%20Strategies&category=E-commerce&details=Comprehensive%20digital%20strategy%20to%20transform%20your%20business%20operations%20and%20customer%20engagement.', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:58:07'),
(42, 'visitor_2lxu06ljlb', '/team.html', 'Lanvai - Our Team', 'http://localhost:5000/index.html', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:58:13'),
(43, 'visitor_2lxu06ljlb', '/courses.html', 'EDULINK | Elevate Your Learning Journey', 'http://localhost:5000/team.html', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:58:19'),
(44, 'visitor_2lxu06ljlb', '/institution.html', 'EDULINK | Institution', 'http://localhost:5000/courses.html', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:58:22'),
(45, 'visitor_2lxu06ljlb', '/students.html', 'Lanvai | Student Course Search', 'http://localhost:5000/courses.html', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:58:28'),
(46, 'visitor_2lxu06ljlb', '/institution.html', 'EDULINK | Institution', 'http://localhost:5000/library.html', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:59:16'),
(47, 'visitor_2lxu06ljlb', '/institutionhosted.html', 'EDULINK | Institution Course Submission', 'http://localhost:5000/institution.html', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:59:18'),
(48, 'visitor_2lxu06ljlb', '/institution.html', 'EDULINK | Institution', 'http://localhost:5000/institutionhosted.html', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-05 15:59:25');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `payment_id` varchar(50) DEFAULT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `user_phone` varchar(50) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'KES',
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_type` varchar(50) DEFAULT 'deposit',
  `status` varchar(50) DEFAULT 'pending',
  `reference` varchar(255) DEFAULT NULL,
  `intasend_payment_id` varchar(100) DEFAULT NULL,
  `intasend_invoice_id` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `bank_reference` varchar(100) DEFAULT NULL,
  `payment_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `completion_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `payment_id`, `user_id`, `user_email`, `user_phone`, `amount`, `currency`, `payment_method`, `payment_type`, `status`, `reference`, `intasend_payment_id`, `intasend_invoice_id`, `description`, `bank_reference`, `payment_date`, `completion_date`, `created_at`, `updated_at`) VALUES
(1, 'PAYMSG9V5VHJ508', 'visitor_2lxu06ljlb', NULL, '254794914597', 100.00, 'KES', 'mpesa', 'deposit', 'completed', 'ERROR_1785945546657', NULL, NULL, 'EDULINK Book Listing Fee - vgyugui', NULL, '2026-08-05 15:59:06', '2026-08-05 15:59:09', '2026-08-05 15:59:06', '2026-08-05 15:59:09');

-- --------------------------------------------------------

--
-- Table structure for table `payment_transactions`
--

CREATE TABLE `payment_transactions` (
  `id` int(11) NOT NULL,
  `transaction_id` varchar(50) DEFAULT NULL,
  `payment_id` int(11) DEFAULT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `balance_before` decimal(10,2) DEFAULT NULL,
  `balance_after` decimal(10,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'completed',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_transactions`
--

INSERT INTO `payment_transactions` (`id`, `transaction_id`, `payment_id`, `user_id`, `type`, `amount`, `balance_before`, `balance_after`, `description`, `status`, `created_at`) VALUES
(1, 'TXNMSG9V9MR3IKF', 1, 'visitor_2lxu06ljlb', 'deposit', 100.00, 0.00, 100.00, 'M-Pesa deposit of KES 100.00 (Simulated)', 'completed', '2026-08-05 15:59:09');

-- --------------------------------------------------------

--
-- Table structure for table `quote_requests`
--

CREATE TABLE `quote_requests` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `company` varchar(255) DEFAULT NULL,
  `service_type` varchar(100) NOT NULL,
  `business_category` varchar(100) NOT NULL,
  `budget` varchar(50) DEFAULT NULL,
  `message` text NOT NULL,
  `response` text DEFAULT NULL,
  `admin_name` varchar(100) DEFAULT NULL,
  `status` enum('pending','responded') DEFAULT 'pending',
  `email_sent` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quote_requests`
--

INSERT INTO `quote_requests` (`id`, `full_name`, `email`, `phone`, `company`, `service_type`, `business_category`, `budget`, `message`, `response`, `admin_name`, `status`, `email_sent`, `created_at`, `updated_at`) VALUES
(1, 'Bryson Henry', 'brysonwaswa1@gmail.com', '+254794914597', 'Brystech', 'Marketing Strategies', 'Manufacturing', 'Under $500', 'I\'m interested in \"Digital Transformation Strategy\" for my E-commerce. Please provide a detailed quote.\n\nAdditional details:', 'jhhh', NULL, 'responded', 1, '2026-07-24 08:19:27', '2026-07-24 13:41:31'),
(2, 'Bryson Henry Waswa', 'brysonwaswa24@gmail.com', '+254794914597', 'Brystech', 'Marketing Services', 'Legal', 'Under $500', 'I\'m interested in \"Social Media Management bryson\" for my E-commerce. Please provide a detailed quote.\n\nAdditional details:', 'hhghghgggj', NULL, 'responded', 1, '2026-07-24 13:36:39', '2026-07-24 13:37:46'),
(3, 'Bryson Henry', 'brysonwaswa1@gmail.com', '+254794914597', 'Brystech', 'Marketing Strategies', 'E-commerce', 'Under $500', 'I\'m interested in \"Social Media Management bryson\" for my E-commerce. Please provide a detailed quote.gyuuhnui\n\nAdditional details:', 'jkjkkkkkj', NULL, 'responded', 0, '2026-07-24 13:43:23', '2026-07-24 13:45:11'),
(4, 'Bryson Henry Waswa', 'brysonwaswa24@gmail.com', '+254794914597', 'Brystech', 'Marketing Strategies', 'Agriculture', '$500 - $2,000', 'I\'m interested in \"bryson\" for my E-commerce. Please provide a detailed quote.\n\nAdditional details:', NULL, NULL, 'pending', 0, '2026-08-05 15:53:49', '2026-08-05 15:53:49');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `user_type` varchar(50) DEFAULT NULL,
  `user_role` varchar(50) DEFAULT 'user',
  `institution_name` varchar(255) DEFAULT NULL,
  `institution_type` varchar(100) DEFAULT NULL,
  `institution_reg_number` varchar(100) DEFAULT NULL,
  `institution_branches` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`institution_branches`)),
  `institution_website` varchar(255) DEFAULT NULL,
  `institution_logo` varchar(500) DEFAULT NULL,
  `institution_verified` tinyint(1) DEFAULT 0,
  `institution_verification_docs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`institution_verification_docs`)),
  `verification_code` varchar(10) DEFAULT NULL,
  `verification_expires` timestamp NULL DEFAULT NULL,
  `reset_password_code` varchar(10) DEFAULT NULL,
  `reset_password_expires` timestamp NULL DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wallet_balances`
--

CREATE TABLE `wallet_balances` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT 0.00,
  `total_deposited` decimal(10,2) DEFAULT 0.00,
  `total_spent` decimal(10,2) DEFAULT 0.00,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `wallet_balances`
--

INSERT INTO `wallet_balances` (`id`, `user_id`, `user_email`, `balance`, `total_deposited`, `total_spent`, `last_updated`, `created_at`) VALUES
(1, 'visitor_2lxu06ljlb', NULL, 100.00, 100.00, 0.00, '2026-08-05 15:59:09', '2026-08-05 15:59:09');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_logins`
--
ALTER TABLE `admin_logins`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `advertiser_access_codes`
--
ALTER TABLE `advertiser_access_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `access_code` (`access_code`),
  ADD KEY `idx_access_code` (`access_code`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `advertiser_campaigns`
--
ALTER TABLE `advertiser_campaigns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `campaign_id` (`campaign_id`),
  ADD KEY `idx_email` (`advertiser_email`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `ad_exchange_inquiries`
--
ALTER TABLE `ad_exchange_inquiries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_type` (`inquiry_type`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `ad_exchange_selections`
--
ALTER TABLE `ad_exchange_selections`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ad_packages`
--
ALTER TABLE `ad_packages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `book_categories`
--
ALTER TABLE `book_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `book_submissions`
--
ALTER TABLE `book_submissions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `click_events`
--
ALTER TABLE `click_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_visitor_id` (`visitor_id`),
  ADD KEY `idx_element_id` (`element_id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_branch_id` (`branch_id`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_intake_date` (`intake_date`),
  ADD KEY `idx_pacing` (`pacing`);

--
-- Indexes for table `course_analytics`
--
ALTER TABLE `course_analytics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_date` (`date`);

--
-- Indexes for table `course_inquiries`
--
ALTER TABLE `course_inquiries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `course_topics`
--
ALTER TABLE `course_topics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_course_id` (`course_id`);

--
-- Indexes for table `course_weekly_timetables`
--
ALTER TABLE `course_weekly_timetables`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_course_id` (`course_id`);

--
-- Indexes for table `daily_stats`
--
ALTER TABLE `daily_stats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `stat_date` (`stat_date`),
  ADD KEY `idx_stat_date` (`stat_date`);

--
-- Indexes for table `expert_consultations`
--
ALTER TABLE `expert_consultations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `expert_services`
--
ALTER TABLE `expert_services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `form_submissions`
--
ALTER TABLE `form_submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_visitor_id` (`visitor_id`),
  ADD KEY `idx_form_type` (`form_type`);

--
-- Indexes for table `institutions`
--
ALTER TABLE `institutions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `institution_branches`
--
ALTER TABLE `institution_branches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_institution_id` (`institution_id`);

--
-- Indexes for table `institution_hosted_courses`
--
ALTER TABLE `institution_hosted_courses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `institution_id` (`institution_id`);

--
-- Indexes for table `lanvai_hosted_courses`
--
ALTER TABLE `lanvai_hosted_courses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `lanvai_inquiries`
--
ALTER TABLE `lanvai_inquiries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `library_books`
--
ALTER TABLE `library_books`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `media_insights`
--
ALTER TABLE `media_insights`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_content_type` (`content_type`);

--
-- Indexes for table `media_news`
--
ALTER TABLE `media_news`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_alert` (`alert`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_content_type` (`content_type`);

--
-- Indexes for table `media_submissions`
--
ALTER TABLE `media_submissions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `page_views`
--
ALTER TABLE `page_views`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_visitor_id` (`visitor_id`),
  ADD KEY `idx_page_url` (`page_url`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_id` (`payment_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_payment_method` (`payment_method`);

--
-- Indexes for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_id` (`transaction_id`),
  ADD KEY `payment_id` (`payment_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_type` (`type`);

--
-- Indexes for table `quote_requests`
--
ALTER TABLE `quote_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_service_type` (`service_type`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `wallet_balances`
--
ALTER TABLE `wallet_balances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_logins`
--
ALTER TABLE `admin_logins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `advertiser_access_codes`
--
ALTER TABLE `advertiser_access_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `advertiser_campaigns`
--
ALTER TABLE `advertiser_campaigns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `ad_exchange_inquiries`
--
ALTER TABLE `ad_exchange_inquiries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `ad_exchange_selections`
--
ALTER TABLE `ad_exchange_selections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `ad_packages`
--
ALTER TABLE `ad_packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `book_categories`
--
ALTER TABLE `book_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `book_submissions`
--
ALTER TABLE `book_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `click_events`
--
ALTER TABLE `click_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_analytics`
--
ALTER TABLE `course_analytics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_inquiries`
--
ALTER TABLE `course_inquiries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `course_topics`
--
ALTER TABLE `course_topics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_weekly_timetables`
--
ALTER TABLE `course_weekly_timetables`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `daily_stats`
--
ALTER TABLE `daily_stats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `expert_consultations`
--
ALTER TABLE `expert_consultations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `expert_services`
--
ALTER TABLE `expert_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `form_submissions`
--
ALTER TABLE `form_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `institutions`
--
ALTER TABLE `institutions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `institution_branches`
--
ALTER TABLE `institution_branches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `institution_hosted_courses`
--
ALTER TABLE `institution_hosted_courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lanvai_hosted_courses`
--
ALTER TABLE `lanvai_hosted_courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lanvai_inquiries`
--
ALTER TABLE `lanvai_inquiries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `library_books`
--
ALTER TABLE `library_books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `media_insights`
--
ALTER TABLE `media_insights`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `media_news`
--
ALTER TABLE `media_news`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `media_submissions`
--
ALTER TABLE `media_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `page_views`
--
ALTER TABLE `page_views`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `quote_requests`
--
ALTER TABLE `quote_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wallet_balances`
--
ALTER TABLE `wallet_balances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `institution_branches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `courses_ibfk_2` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_analytics`
--
ALTER TABLE `course_analytics`
  ADD CONSTRAINT `course_analytics_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `institution_hosted_courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_topics`
--
ALTER TABLE `course_topics`
  ADD CONSTRAINT `course_topics_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_weekly_timetables`
--
ALTER TABLE `course_weekly_timetables`
  ADD CONSTRAINT `course_weekly_timetables_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `institution_branches`
--
ALTER TABLE `institution_branches`
  ADD CONSTRAINT `institution_branches_ibfk_1` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `institution_hosted_courses`
--
ALTER TABLE `institution_hosted_courses`
  ADD CONSTRAINT `institution_hosted_courses_ibfk_1` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lanvai_hosted_courses`
--
ALTER TABLE `lanvai_hosted_courses`
  ADD CONSTRAINT `lanvai_hosted_courses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  ADD CONSTRAINT `payment_transactions_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
