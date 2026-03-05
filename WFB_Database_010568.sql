-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: wfpdb
-- ------------------------------------------------------
-- Server version	11.6.2-MariaDB-ubu2404

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `fund` decimal(10,2) DEFAULT NULL,
  `per_times` decimal(10,2) DEFAULT NULL,
  `per_years` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `welfare_types_id` bigint(20) NOT NULL,
  `per_users` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_categories_welfare_types1_idx` (`welfare_types_id`),
  CONSTRAINT `fk_categories_welfare_types1` FOREIGN KEY (`welfare_types_id`) REFERENCES `welfare_types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'สวัสดิการค่าตรวจสุขภาพประจำปี',3000.00,NULL,NULL,'2025-01-25 11:03:47','2025-04-11 16:51:12',1,NULL),(2,'สวัสดิการค่าทำฟันเพื่อการรักษา ยกเว้นทันตกรรมเพื่อความสวยงาม',2000.00,2000.00,3,'2025-01-25 11:03:47','2025-04-11 16:53:08',1,NULL),(3,'สวัสดิการกรณีเจ็บป่วย',NULL,NULL,NULL,'2025-01-25 11:03:47','2025-04-11 16:49:10',1,NULL),(4,'สวัสดิการค่าสงเคราะห์การสมรสโดยนิตินัย',2000.00,NULL,NULL,'2025-01-25 11:05:38','2025-04-11 16:55:28',2,1),(5,'สวัสดิการค่าสงเคราะห์การอุปสมบทหรือการไปประกอบพิธีฮัจญ์',2000.00,NULL,NULL,'2025-01-25 11:05:38','2025-04-11 16:56:05',2,1),(6,'สวัสดิการค่าสงเคราะห์การรับขวัญบัตรแรกเกิด',1000.00,NULL,NULL,'2025-01-25 11:05:38','2025-04-11 16:56:41',2,NULL),(7,'สวัสดิการค่าสงเคราะห์กรณีประสบภัยพิบัติสำหรับผู้ปฏิบัติงานในมหาวิทยาลัย',10000.00,NULL,NULL,'2025-01-25 11:05:38','2025-04-11 16:57:16',2,NULL),(8,'สวัสดิการเสียชีวิตคนในครอบครัว',NULL,NULL,NULL,'2025-01-25 11:05:38','2025-04-11 17:22:10',2,NULL),(9,'สวัสดิการผู้ปฏิบัติงานเสียชีวิต',NULL,10000.00,NULL,'2025-01-25 11:11:12','2025-04-11 17:23:43',3,NULL),(10,'ค่าสนับสนุนค่าพวงหรีดในนามส่วนบุคคล',NULL,2000.00,NULL,'2025-01-25 11:11:12','2025-04-14 13:14:45',3,NULL),(11,'ค่าสนับสนุนค่าพวงหรีดในนามมหาวิทยาลัยบูรพา',NULL,2000.00,NULL,'2025-01-25 11:11:12','2025-04-14 13:14:45',3,NULL),(12,'ค่าสนับสนุนค่าพาหนะเหมาจ่ายเพื่อไปร่วมงานศพ',NULL,20000.00,NULL,'2025-01-25 11:11:12','2025-04-14 13:14:46',3,NULL),(13,'ก',NULL,NULL,NULL,'2025-01-25 11:11:11','2025-02-05 11:29:13',4,NULL),(14,'ข',NULL,NULL,NULL,'2025-01-25 11:11:11','2025-02-05 11:30:12',4,NULL),(15,'ค (พิบูลบำเพ็ญ ก)',NULL,NULL,NULL,'2025-01-25 11:11:11','2025-04-01 07:44:29',4,NULL),(16,'ค (พิบูลบำเพ็ญ ข)',NULL,NULL,NULL,'2025-04-01 07:44:52','2025-04-01 07:44:52',4,NULL),(17,'ก (พิบูลบำเพ็ญ นานาชาติ)',NULL,NULL,NULL,'2025-01-25 11:11:12','2025-04-01 07:42:53',4,NULL),(18,'ข (พิบูลบำเพ็ญ นานาชาติ)',NULL,NULL,NULL,'2025-01-25 11:11:12','2025-04-01 07:42:49',4,NULL);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `children`
--

DROP TABLE IF EXISTS `children`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `children` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `birthday` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint(20) NOT NULL,
  `updated_by` bigint(20) NOT NULL,
  `users_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`,`users_id`),
  KEY `fk_children_users1_idx` (`users_id`),
  CONSTRAINT `fk_children_users1` FOREIGN KEY (`users_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `children`
--

LOCK TABLES `children` WRITE;
/*!40000 ALTER TABLE `children` DISABLE KEYS */;
/*!40000 ALTER TABLE `children` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `children_infomation`
--

DROP TABLE IF EXISTS `children_infomation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `children_infomation` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `fund_receipt` decimal(10,2) NOT NULL,
  `fund_eligible` decimal(10,2) NOT NULL,
  `fund_sum_request` decimal(10,2) NOT NULL,
  `child_name` varchar(255) NOT NULL,
  `child_number` int(11) NOT NULL,
  `child_birth_day` date NOT NULL,
  `child_father_number` int(11) NOT NULL,
  `child_mother_number` int(11) NOT NULL,
  `child_type` enum('DELEGATE','COMMON','DIED') NOT NULL,
  `school_name` varchar(255) NOT NULL,
  `school_type` enum('ทั่วไป','สาธิตพิบูลบําเพ็ญ') NOT NULL,
  `district` varchar(255) NOT NULL,
  `province` varchar(255) NOT NULL,
  `delegate_name` varchar(255) DEFAULT NULL,
  `delegate_number` int(11) DEFAULT NULL,
  `delegate_birth_day` date DEFAULT NULL,
  `delegate_death_day` date DEFAULT NULL,
  `fund_university` decimal(10,2) DEFAULT NULL,
  `fund_sub_university` decimal(10,2) DEFAULT NULL,
  `fund_other` decimal(10,2) DEFAULT NULL,
  `sub_categories_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_children_infomation_sub_categories1_idx` (`sub_categories_id`),
  CONSTRAINT `fk_children_infomation_sub_categories1` FOREIGN KEY (`sub_categories_id`) REFERENCES `sub_categories` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `children_infomation`
--

LOCK TABLES `children_infomation` WRITE;
/*!40000 ALTER TABLE `children_infomation` DISABLE KEYS */;
/*!40000 ALTER TABLE `children_infomation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `departments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'คณะวิทยาการสารสนเทศ','2025-01-24 10:10:29','2025-03-30 11:19:30');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_types`
--

DROP TABLE IF EXISTS `employee_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employee_types` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_types`
--

LOCK TABLES `employee_types` WRITE;
/*!40000 ALTER TABLE `employee_types` DISABLE KEYS */;
INSERT INTO `employee_types` VALUES (1,'ข้าราชการ / ลูกจ้างประจำ','2025-01-24 10:07:46','2025-02-19 08:40:33'),(2,'พนักงานมหาวิทยาลัย (สิทธิข้าราชการบำนาญ)','2025-01-25 10:56:51','2025-01-25 10:56:51'),(3,'พนักงานมหาวิทยาลัย','2025-01-25 10:56:51','2025-01-25 10:56:51'),(4,'ลูกจ้างมหาวิทยาลัย','2025-01-25 10:56:51','2025-01-25 10:56:51');
/*!40000 ALTER TABLE `employee_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `log_category`
--

DROP TABLE IF EXISTS `log_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `log_category` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `fund_old` decimal(10,2) DEFAULT NULL,
  `fund_new` decimal(10,2) DEFAULT NULL,
  `per_times_old` decimal(10,2) DEFAULT NULL,
  `per_times_new` decimal(10,2) DEFAULT NULL,
  `per_years_old` int(11) DEFAULT NULL,
  `per_years_new` int(11) DEFAULT NULL,
  `per_users_old` int(11) DEFAULT NULL,
  `per_users_new` int(11) DEFAULT NULL,
  `created_by` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `categories_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_log_category_categories1_idx` (`categories_id`),
  CONSTRAINT `fk_log_category_categories1` FOREIGN KEY (`categories_id`) REFERENCES `categories` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log_category`
--

LOCK TABLES `log_category` WRITE;
/*!40000 ALTER TABLE `log_category` DISABLE KEYS */;
/*!40000 ALTER TABLE `log_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `log_sub_category`
--

DROP TABLE IF EXISTS `log_sub_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `log_sub_category` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `fund_old` decimal(10,2) DEFAULT NULL,
  `fund_new` decimal(10,2) DEFAULT NULL,
  `per_times_old` decimal(10,2) DEFAULT NULL,
  `per_times_new` decimal(10,2) DEFAULT NULL,
  `per_years_old` int(11) DEFAULT NULL,
  `per_years_new` int(11) DEFAULT NULL,
  `per_users_old` int(11) DEFAULT NULL,
  `per_users_new` int(11) DEFAULT NULL,
  `created_by` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `sub_categories_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_log_sub_category_sub_categories1_idx` (`sub_categories_id`),
  CONSTRAINT `fk_log_sub_category_sub_categories1` FOREIGN KEY (`sub_categories_id`) REFERENCES `sub_categories` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log_sub_category`
--

LOCK TABLES `log_sub_category` WRITE;
/*!40000 ALTER TABLE `log_sub_category` DISABLE KEYS */;
INSERT INTO `log_sub_category` VALUES (1,'ประสบอุบัติเหตุขณะปฏิบัติงาน',NULL,NULL,3000.00,1000.00,NULL,NULL,NULL,NULL,2,'2025-04-10 01:15:59','2025-04-10 01:15:59',1);
/*!40000 ALTER TABLE `log_sub_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'สวัสดิการทั่วไป','2025-01-25 11:44:03','2025-01-25 11:44:03'),(2,'สวัสดิการค่าสงเคราะห์ต่าง ๆ','2025-01-25 11:44:03','2025-01-25 11:44:03'),(3,'สวัสดิการเกี่ยวกับการศึกษาบุตร','2025-01-25 11:44:03','2025-01-25 11:44:03'),(4,'สวัสดิการค่าสงเคราะห์การเสียชีวิต','2025-01-25 11:44:03','2025-01-25 11:44:03'),(5,'จัดการข้อมูลการเบิกสวัสดิการ','2025-01-25 11:44:03','2025-01-25 11:44:03'),(6,'จัดการข้อมูลสวัสดิการ','2025-01-25 11:44:04','2025-01-25 11:44:04'),(7,'จัดการข้อมูลบุคลากร','2025-01-25 11:44:04','2025-01-28 09:09:34'),(8,'รายงาน','2025-01-28 09:09:34','2025-01-28 09:09:34');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions_has_roles`
--

DROP TABLE IF EXISTS `permissions_has_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions_has_roles` (
  `permissions_id` bigint(20) NOT NULL,
  `roles_id` bigint(20) NOT NULL,
  PRIMARY KEY (`permissions_id`,`roles_id`),
  KEY `fk_permissions_has_roles_roles1_idx` (`roles_id`),
  KEY `fk_permissions_has_roles_permissions1_idx` (`permissions_id`),
  CONSTRAINT `fk_permissions_has_roles_permissions1` FOREIGN KEY (`permissions_id`) REFERENCES `permissions` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_permissions_has_roles_roles1` FOREIGN KEY (`roles_id`) REFERENCES `roles` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions_has_roles`
--

LOCK TABLES `permissions_has_roles` WRITE;
/*!40000 ALTER TABLE `permissions_has_roles` DISABLE KEYS */;
INSERT INTO `permissions_has_roles` VALUES (1,1),(2,1),(3,1),(1,2),(2,2),(3,2),(4,2),(5,2),(6,2),(8,2),(1,3),(2,3),(3,3),(4,3),(7,4),(5,5);
/*!40000 ALTER TABLE `permissions_has_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `positions`
--

DROP TABLE IF EXISTS `positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `positions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `positions`
--

LOCK TABLES `positions` WRITE;
/*!40000 ALTER TABLE `positions` DISABLE KEYS */;
INSERT INTO `positions` VALUES (1,'อาจารย์','2025-01-24 10:07:30','2025-01-24 10:07:30'),(2,'อาจารย์/ผู้ช่วยศาสตราจารย์','2025-03-30 10:56:40','2025-03-30 10:56:40'),(3,'อาจารย์/รองศาสตราจารย์','2025-03-30 10:56:54','2025-03-30 10:56:54'),(4,'คณบดี','2025-03-30 10:58:48','2025-03-30 10:58:48'),(5,'รองคณบดี','2025-03-30 10:58:52','2025-03-30 10:58:52'),(6,'นักวิชาการศึกษาชำนาญการ','2025-04-03 11:52:38','2025-04-03 11:52:38'),(7,'นักวิชาการพัสดุชำนาญการ','2025-04-03 11:53:36','2025-04-03 11:53:36'),(8,'นักวิชาการเงินและบัญชีชำนาญการ','2025-04-03 11:53:42','2025-04-03 11:53:42'),(9,'นักวิชาการคอมพิวเตอร์ชำนาญการ','2025-04-03 11:53:49','2025-04-03 11:53:49'),(10,'เจ้าหน้าที่บริหารงานทั่วไปชำนาญการ','2025-04-03 11:53:53','2025-04-03 11:53:53'),(11,'นักวิเคราะห์นโยบายและแผนชำนาญการ','2025-04-03 11:53:58','2025-04-03 11:53:58'),(12,'นักวิจัยชำนาญการ','2025-04-03 11:54:04','2025-04-03 11:54:04'),(13,'นักวิจัย','2025-04-03 11:54:09','2025-04-03 11:54:09'),(14,'นักวิชาการคอมพิวเตอร์','2025-04-03 11:54:14','2025-04-03 11:54:14'),(15,'ผู้ปฏิบัติงานช่าง','2025-04-03 11:54:27','2025-04-03 11:54:27'),(16,'คนงาน','2025-04-03 11:54:31','2025-04-03 11:54:31');
/*!40000 ALTER TABLE `positions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reimbursements_assist`
--

DROP TABLE IF EXISTS `reimbursements_assist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reimbursements_assist` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `reim_number` varchar(45) NOT NULL,
  `fund_receipt` decimal(10,2) NOT NULL,
  `fund_sum_request` decimal(10,2) NOT NULL,
  `fund_sum_receipt` decimal(10,2) NOT NULL,
  `fund_eligible` decimal(10,2) NOT NULL,
  `fund_decease` decimal(10,2) DEFAULT NULL,
  `fund_wreath_university` decimal(10,2) DEFAULT NULL,
  `fund_wreath_arrange` decimal(10,2) DEFAULT NULL,
  `fund_receipt_wreath` decimal(10,2) DEFAULT NULL,
  `fund_receipt_vechicle` decimal(10,2) DEFAULT NULL,
  `fund_vechicle` decimal(10,2) DEFAULT NULL,
  `document_path` varchar(255) DEFAULT NULL,
  `status` enum('บันทึกฉบับร่าง','รอตรวจสอบ','อนุมัติ','ไม่อนุมัติ') NOT NULL, -- รออนุมัติ
  `deceased` varchar(255) DEFAULT NULL,
  `deceased_type` int(11) DEFAULT NULL,
  `request_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` bigint(20) NOT NULL,
  `created_by` bigint(20) NOT NULL,
  `categories_id` bigint(20) NOT NULL,
  `file_receipt` varchar(255) DEFAULT NULL,
  `file_document` varchar(255) DEFAULT NULL,
  `file_photo` varchar(255) DEFAULT NULL,
  `file_house_registration` varchar(255) DEFAULT NULL,
  `file_death_certificate` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_reimbursements_assist_categories1_idx` (`categories_id`),
  KEY `fk_reimbursements_assist_users1_idx` (`created_by`),
  CONSTRAINT `fk_reimbursements_assist_categories1` FOREIGN KEY (`categories_id`) REFERENCES `categories` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_reimbursements_assist_users1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reimbursements_assist`
--

LOCK TABLES `reimbursements_assist` WRITE;
/*!40000 ALTER TABLE `reimbursements_assist` DISABLE KEYS */;
/*!40000 ALTER TABLE `reimbursements_assist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reimbursements_assist_has_sub_categories`
--

DROP TABLE IF EXISTS `reimbursements_assist_has_sub_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reimbursements_assist_has_sub_categories` (
  `reimbursements_assist_id` bigint(20) NOT NULL,
  `sub_categories_id` bigint(20) NOT NULL,
  PRIMARY KEY (`reimbursements_assist_id`,`sub_categories_id`),
  KEY `fk_reimbursements_assist_has_sub_categories_sub_categories1_idx` (`sub_categories_id`),
  KEY `fk_reimbursements_assist_has_sub_categories_reimbursements__idx` (`reimbursements_assist_id`),
  CONSTRAINT `fk_reimbursements_assist_has_sub_categories_reimbursements_as1` FOREIGN KEY (`reimbursements_assist_id`) REFERENCES `reimbursements_assist` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_reimbursements_assist_has_sub_categories_sub_categories1` FOREIGN KEY (`sub_categories_id`) REFERENCES `sub_categories` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reimbursements_assist_has_sub_categories`
--

LOCK TABLES `reimbursements_assist_has_sub_categories` WRITE;
/*!40000 ALTER TABLE `reimbursements_assist_has_sub_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `reimbursements_assist_has_sub_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reimbursements_children_education`
--

DROP TABLE IF EXISTS `reimbursements_children_education`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reimbursements_children_education` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `reim_number` varchar(45) NOT NULL,
  `fund_receipt` decimal(10,2) NOT NULL,
  `fund_eligible` decimal(10,2) NOT NULL,
  `fund_sum_request` decimal(10,2) NOT NULL,
  `fund_sum_receipt` decimal(10,2) NOT NULL,
  `fund_university` decimal(10,2) NOT NULL,
  `fund_other` decimal(10,2) DEFAULT NULL,
  `status` enum('บันทึกฉบับร่าง','รอตรวจสอบ','อนุมัติ','ไม่อนุมัติ','รออนุมัติ') NOT NULL,
  `spouse` varchar(255) DEFAULT NULL,
  `marry_regis` enum('YES','NO') NOT NULL,
  `role` varchar(255) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `eligible` enum('ตามสิทธิ','เฉพาะส่วนที่ยังขาดจากสิทธิ') DEFAULT NULL,
  `parental_status` enum('บิดา','มารดา') NOT NULL,
  `eligible_benefits` enum('ก','ข','ค') DEFAULT NULL,
  `eligible_sub_benefits` enum('ก','ข','ค') DEFAULT NULL,
  `request_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` bigint(20) NOT NULL,
  `created_by` bigint(20) NOT NULL,
  `categories_id` bigint(20) DEFAULT NULL,
  `file_receipt` varchar(255) DEFAULT NULL COMMENT 'NEW: ใบเสร็จรับเงินและประกาศค่าธรรมเนียมการศึกษา',
  `file_id_card` varchar(255) DEFAULT NULL COMMENT 'NEW: สำเนาบัตรประจำตัวประชาชน (ผู้เบิก)',
  `file_birth_certificate` varchar(255) DEFAULT NULL COMMENT 'NEW: สำเนาสูติบัตร (บุตร)',
  `file_document` varchar(255) DEFAULT NULL COMMENT 'NEW: สำเนาทะเบียนสมรส หรือ สำเนาทะเบียนรับรองบุตร',
  `document_path` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_reimbursements_children_education_users1_idx` (`created_by`),
  KEY `fk_reimbursements_children_education_categories1_idx` (`categories_id`),
  CONSTRAINT `fk_reimbursements_children_education_categories1` FOREIGN KEY (`categories_id`) REFERENCES `categories` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_reimbursements_children_education_users1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reimbursements_children_education`
--

LOCK TABLES `reimbursements_children_education` WRITE;
/*!40000 ALTER TABLE `reimbursements_children_education` DISABLE KEYS */;
/*!40000 ALTER TABLE `reimbursements_children_education` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reimbursements_children_education_has_children_infomation`
--

DROP TABLE IF EXISTS `reimbursements_children_education_has_children_infomation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reimbursements_children_education_has_children_infomation` (
  `reimbursements_children_education_id` bigint(20) NOT NULL,
  `children_infomation_id` bigint(20) NOT NULL,
  PRIMARY KEY (`reimbursements_children_education_id`,`children_infomation_id`),
  KEY `fk_reimbursements_children_education_has_children_infomatio_idx` (`children_infomation_id`),
  KEY `fk_reimbursements_children_education_has_children_infomatio_idx1` (`reimbursements_children_education_id`),
  CONSTRAINT `fk_reimbursements_children_education_has_children_infomation_1` FOREIGN KEY (`reimbursements_children_education_id`) REFERENCES `reimbursements_children_education` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_reimbursements_children_education_has_children_infomation_2` FOREIGN KEY (`children_infomation_id`) REFERENCES `children_infomation` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reimbursements_children_education_has_children_infomation`
--

LOCK TABLES `reimbursements_children_education_has_children_infomation` WRITE;
/*!40000 ALTER TABLE `reimbursements_children_education_has_children_infomation` DISABLE KEYS */;
/*!40000 ALTER TABLE `reimbursements_children_education_has_children_infomation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reimbursements_employee_deceased`
--

DROP TABLE IF EXISTS `reimbursements_employee_deceased`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reimbursements_employee_deceased` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `reim_number` varchar(45) NOT NULL,
  `fund_receipt` decimal(10,2) NOT NULL,
  `fund_request` decimal(10,2) NOT NULL,
  `fund_sum_request` decimal(10,2) NOT NULL,
  `fund_sum_receipt` decimal(10,2) NOT NULL,
  `fund_wreath_university` decimal(10,2) DEFAULT NULL,
  `fund_wreath_arrange` decimal(10,2) DEFAULT NULL,
  `fund_receipt_wreath` decimal(10,2) DEFAULT NULL,
  `fund_receipt_vehicle` decimal(10,2) DEFAULT NULL,
  `fund_vehicle` decimal(10,2) DEFAULT NULL,
  `document_path` varchar(255) DEFAULT NULL,
  `status` enum('บันทึกฉบับร่าง','รอตรวจสอบ','อนุมัติ','ไม่อนุมัติ','รออนุมัติ') NOT NULL,
  `organizer` varchar(255) DEFAULT NULL,
  `deceased` bigint(20) NOT NULL,
  `request_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` bigint(20) NOT NULL,
  `created_by` bigint(20) NOT NULL,
  `file_receipt` varchar(255) DEFAULT NULL COMMENT 'NEW: ใบสำคัญรับเงินโดยผู้จัดการงานศพ',
  `file_id_card` varchar(255) DEFAULT NULL COMMENT 'NEW: สำเนาบัตรประจำตัวประชาชนผู้จัดการงานศพ',
  `file_death_certificate` varchar(255) DEFAULT NULL COMMENT 'NEW: สำเนาใบมรณะบัตรผู้ปฏิบัติงาน',
  `file_wreath_receipt` varchar(255) DEFAULT NULL COMMENT 'NEW: ใบเสร็จรับเงิน (พวงหรีด)',
  `file_wreath_document` varchar(255) DEFAULT NULL COMMENT 'NEW: ใบสำคัญรับเงิน เจ้าหน้าที่ (พวงหรีด)',
  `file_vehicle_receipt` varchar(255) DEFAULT NULL COMMENT 'NEW: ใบสำคัญรับเงิน เจ้าหน้าที่ (พาหนะ)',
  `file_vehicle_document` varchar(255) DEFAULT NULL COMMENT 'NEW: ใบสำคัญรับเงินหรือหลักฐานอื่น (พาหนะ)',
  PRIMARY KEY (`id`),
  KEY `fk_reimbursements_employee_deceased_users1_idx` (`created_by`),
  CONSTRAINT `fk_reimbursements_employee_deceased_users1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reimbursements_employee_deceased`
--

LOCK TABLES `reimbursements_employee_deceased` WRITE;
/*!40000 ALTER TABLE `reimbursements_employee_deceased` DISABLE KEYS */;
/*!40000 ALTER TABLE `reimbursements_employee_deceased` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reimbursements_employee_deceased_has_categories`
--

DROP TABLE IF EXISTS `reimbursements_employee_deceased_has_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reimbursements_employee_deceased_has_categories` (
  `reimbursements_employee_deceased_id` bigint(20) NOT NULL,
  `categories_id` bigint(20) NOT NULL,
  PRIMARY KEY (`reimbursements_employee_deceased_id`,`categories_id`),
  KEY `fk_reimbursements_employee_deceased_has_categories_categori_idx` (`categories_id`),
  KEY `fk_reimbursements_employee_deceased_has_categories_reimburs_idx` (`reimbursements_employee_deceased_id`),
  CONSTRAINT `fk_reimbursements_employee_deceased_has_categories_categories1` FOREIGN KEY (`categories_id`) REFERENCES `categories` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_reimbursements_employee_deceased_has_categories_reimbursem1` FOREIGN KEY (`reimbursements_employee_deceased_id`) REFERENCES `reimbursements_employee_deceased` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reimbursements_employee_deceased_has_categories`
--

LOCK TABLES `reimbursements_employee_deceased_has_categories` WRITE;
/*!40000 ALTER TABLE `reimbursements_employee_deceased_has_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `reimbursements_employee_deceased_has_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reimbursements_general`
--

DROP TABLE IF EXISTS `reimbursements_general`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reimbursements_general` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `reim_number` varchar(45) NOT NULL,
  `fund_receipt` decimal(10,2) DEFAULT NULL,
  `fund_eligible` decimal(10,2) DEFAULT NULL,
  `fund_sum_request` decimal(10,2) NOT NULL,
  `fund_decree` decimal(10,2) DEFAULT NULL,
  `fund_university` decimal(10,2) DEFAULT NULL,
  `fund_eligible_name` varchar(255) DEFAULT NULL,
  `fund_eligible_sum` decimal(10,2) DEFAULT NULL,
  `fund_receipt_patient_visit` decimal(10,2) DEFAULT NULL,
  `fund_sum_request_patient_visit` decimal(10,2) DEFAULT NULL,
  `document_path` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `date_receipt` date DEFAULT NULL,
  `request_date` date DEFAULT NULL,
  `status` enum('บันทึกฉบับร่าง','รอตรวจสอบ','อนุมัติ','ไม่อนุมัติ','รออนุมัติ') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` bigint(20) NOT NULL,
  `created_by` bigint(20) NOT NULL,
  `categories_id` bigint(20) NOT NULL,
  `file_receipt` varchar(255) DEFAULT NULL,
  `file_medical_certificate` varchar(255) DEFAULT NULL,
  `file_supervisor_letter` varchar(255) DEFAULT NULL,
  `file_receipt_patient_visit` varchar(255) DEFAULT NULL,
  `file_medical_certificate_patient_visit` varchar(255) DEFAULT NULL,
  `file_social_security` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_reimbursements_general_users1_idx` (`created_by`),
  KEY `fk_reimbursements_general_categories1_idx` (`categories_id`),
  CONSTRAINT `fk_reimbursements_general_categories1` FOREIGN KEY (`categories_id`) REFERENCES `categories` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_reimbursements_general_users1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reimbursements_general`
--

LOCK TABLES `reimbursements_general` WRITE;
/*!40000 ALTER TABLE `reimbursements_general` DISABLE KEYS */;
/*!40000 ALTER TABLE `reimbursements_general` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reimbursements_general_has_sub_categories`
--

DROP TABLE IF EXISTS `reimbursements_general_has_sub_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reimbursements_general_has_sub_categories` (
  `reimbursements_general_id` bigint(20) NOT NULL,
  `sub_categories_id` bigint(20) NOT NULL,
  PRIMARY KEY (`reimbursements_general_id`,`sub_categories_id`),
  KEY `fk_reimbursements_general_has_sub_categories_sub_categories_idx` (`sub_categories_id`),
  KEY `fk_reimbursements_general_has_sub_categories_reimbursements_idx` (`reimbursements_general_id`),
  CONSTRAINT `fk_reimbursements_general_has_sub_categories_reimbursements_g1` FOREIGN KEY (`reimbursements_general_id`) REFERENCES `reimbursements_general` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_reimbursements_general_has_sub_categories_sub_categories1` FOREIGN KEY (`sub_categories_id`) REFERENCES `sub_categories` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reimbursements_general_has_sub_categories`
--

LOCK TABLES `reimbursements_general_has_sub_categories` WRITE;
/*!40000 ALTER TABLE `reimbursements_general_has_sub_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `reimbursements_general_has_sub_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'บุคลากรทั่วไป','2025-05-01 08:52:30','2025-05-01 08:52:30'),(2,'เจ้าหน้าที่การเงิน','2025-01-25 10:58:31','2025-03-07 08:02:32'),(3,'เจ้าหน้าที่รับผิดชอบด้านบุคคล','2025-05-01 08:52:30','2025-05-01 08:52:30'),(4,'ผู้ดูแลระบบ','2025-01-28 07:00:56','2025-01-28 07:00:56'),(5,'คณบดี','2025-05-01 08:52:30','2025-05-01 08:52:30');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sector`
--

DROP TABLE IF EXISTS `sector`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sector` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sector`
--

LOCK TABLES `sector` WRITE;
/*!40000 ALTER TABLE `sector` DISABLE KEYS */;
INSERT INTO `sector` VALUES (1,'วิศวกรรมซอฟต์แวร์','2025-01-24 10:07:09','2025-01-24 10:07:09'),(2,'เทคโนโลยีสารสนเทศเพื่ออุตสาหกรรมดิจิทัล','2025-03-30 10:40:10','2025-03-30 10:40:10'),(3,'วิทยาการคอมพิวเตอร์','2025-03-30 10:40:10','2025-03-30 10:40:10'),(4,'ปัญญาประดิษฐ์ประยุกต์และเทคโนโลยีอัจฉริยะ','2025-03-30 10:40:10','2025-03-30 10:40:10'),(5,'วิทยาการข้อมูล','2025-03-30 10:40:10','2025-03-30 10:40:10');
/*!40000 ALTER TABLE `sector` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sub_categories`
--

DROP TABLE IF EXISTS `sub_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sub_categories` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `fund` decimal(10,2) DEFAULT NULL,
  `per_times` decimal(10,2) DEFAULT NULL,
  `per_years` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `categories_id` bigint(20) DEFAULT NULL,
  `per_users` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_sub_categories_categories1_idx` (`categories_id`),
  CONSTRAINT `fk_sub_categories_categories1` FOREIGN KEY (`categories_id`) REFERENCES `categories` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_categories`
--

LOCK TABLES `sub_categories` WRITE;
/*!40000 ALTER TABLE `sub_categories` DISABLE KEYS */;
INSERT INTO `sub_categories` VALUES (1,'ประสบอุบัติเหตุขณะปฏิบัติงานในหน้าที่',NULL,1000.00,NULL,'2025-01-25 11:14:34','2025-04-11 16:50:40',3,NULL),(2,'ค่าเยี่ยมไข้ผู้ปฏิบัติงาน กรณีเป็นผู้ป่วยใน',NULL,1000.00,3,'2025-01-25 11:15:34','2025-04-11 16:50:40',3,NULL),(3,'บิดา',5000.00,NULL,NULL,'2025-01-25 11:19:39','2025-03-11 23:32:05',8,1),(4,'มารดา',5000.00,NULL,NULL,'2025-01-25 11:19:39','2025-03-11 23:37:14',8,1),(5,'คู่สมรส',5000.00,NULL,NULL,'2025-01-25 11:19:39','2025-03-11 23:37:24',8,1),(6,'บุตร',5000.00,NULL,NULL,'2025-01-25 11:19:39','2025-03-11 23:37:30',8,1),(7,'ค่าสนับสนุนค่าพวงหรีดในนามส่วนบุคคล ',NULL,2000.00,NULL,'2025-02-05 11:19:15','2025-04-14 13:14:28',8,NULL),(8,'ค่าสนับสนุนค่าพวงหรีดในนามมหาวิทยาลัยบูรพา',NULL,2000.00,NULL,'2025-02-05 11:19:15','2025-04-14 13:14:28',8,NULL),(9,'ค่าสนับสนุนค่าพาหนะเหมาจ่ายเพื่อไปร่วมงานศพ',NULL,10000.00,NULL,'2025-02-05 11:19:15','2025-04-14 13:14:28',8,NULL),(10,'ระดับปฐมวัย',12300.00,6150.00,0,'2025-04-01 08:32:40','2025-04-01 08:48:20',13,NULL),(11,'ระดับประถมศึกษาปีที่ 1 - 6',7700.00,3850.00,0,'2025-04-01 08:32:40','2025-04-03 15:53:58',13,NULL),(12,'ระดับมัธยมศึกษาปีที่ 1 - 3',7700.00,3850.00,2,'2025-01-25 11:23:37','2025-04-01 08:40:05',13,NULL),(13,'ระดับมัธยมศึกษาปีที่ 4 - 6',7700.00,3850.00,2,'2025-01-25 11:23:37','2025-04-01 08:40:05',13,NULL),(14,'ระดับปฐมวัย',6000.00,3000.00,2,'2025-01-25 11:23:37','2025-04-01 08:38:19',14,NULL),(15,'ระดับมัธยมศึกษาปีที่ 4 - 6 (หรือเทียบเท่า)',13300.00,6650.00,2,'2025-01-25 11:23:38','2025-04-03 15:57:11',14,NULL),(16,'ระดับปฐมศึกษาปีที่ 1 - 3',6400.00,3200.00,2,'2025-01-25 11:23:37','2025-04-01 08:37:52',14,NULL),(17,'ระดับปฐมศึกษาปีที่ 4 - 6',7100.00,3550.00,2,'2025-01-25 11:23:37','2025-04-01 08:37:47',14,NULL),(18,'ระดับมัธยมศึกษาปีที่ 1 - 3',10300.00,5150.00,2,'2025-01-25 11:23:38','2025-04-01 08:37:47',14,NULL),(19,'ระดับปฐมวัยโปรแกรมทั่วไป',26700.00,13350.00,2,'2025-01-25 11:31:16','2025-04-01 08:37:41',15,NULL),(20,'ระดับปฐมวัยโปรแกรมเน้นความสามารถทางภาษา',31100.00,15550.00,2,'2025-01-25 11:31:16','2025-04-01 08:37:41',15,NULL),(21,'ระดับปฐมศึกษาปีที่ 1 - 6 โปรแกรมทั่วไป',16700.00,8350.00,2,'2025-01-25 11:31:16','2025-04-03 15:59:20',15,NULL),(22,'ระดับปฐมศึกษาปีที่ 1 - 6 โปรแกรมเน้นความสามารถทางภาษา',25700.00,12850.00,2,'2025-01-25 11:31:16','2025-04-03 15:59:20',15,NULL),(23,'ระดับปฐมศึกษาปีที่ 1 - 6 โปรแกรมศึกษาพิเศษแบบบูรณาการ',46700.00,23350.00,2,'2025-01-25 11:31:16','2025-04-03 15:59:20',15,NULL),(24,'ระดับมัธยมศึกษาโปรแกรมทั่วไป',16700.00,8350.00,2,'2025-01-25 11:31:16','2025-04-01 08:37:31',15,NULL),(25,'ระดับมัธยมศึกษาโปรแกรมเน้นความสามารถทางภาษา',28700.00,14350.00,2,'2025-01-25 11:31:17','2025-04-01 08:37:26',15,NULL),(26,'ระดับมัธยมศึกษาโปรแกรมเน้นความสามารถทางคณิต-วิทย์',28700.00,14350.00,2,'2025-01-25 11:31:17','2025-04-01 08:37:26',15,NULL),(27,'ระดับมัธยมศึกษาโปรแกรมศึกษาพิเศษแบบบูรณาการ',46700.00,23350.00,2,'2025-01-25 11:31:17','2025-04-01 08:37:21',15,NULL),(28,'ระดับปฐมวัยโปรแกรมทั่วไป',20400.00,10200.00,0,'2025-04-01 07:51:17','2025-04-01 08:55:40',16,NULL),(29,'ระดับปฐมวัยโปรแกรมเน้นความสามารถทางภาษา',29400.00,14700.00,0,'2025-04-01 07:51:17','2025-04-01 08:55:40',16,NULL),(30,'ระดับปฐมศึกษาปีที่ 1 - 3 โปรแกรมทั่วไป',15400.00,7700.00,0,'2025-04-01 07:51:17','2025-04-03 15:59:20',16,NULL),(31,'ระดับปฐมศึกษาปีที่ 4 - 6 โปรแกรมทั่วไป',16100.00,8050.00,0,'2025-04-01 07:51:17','2025-04-03 15:59:20',16,NULL),(32,'ระดับปฐมศึกษาปีที่ 1 - 3 โปรแกรมเน้นความสามารถทางภาษา',24400.00,12200.00,0,'2025-04-01 07:51:17','2025-04-03 15:59:20',16,NULL),(33,'ระดับปฐมศึกษาปีที่ 4 - 6 โปรแกรมเน้นความสามารถทางภาษา',25100.00,12550.00,0,'2025-04-01 07:51:17','2025-04-03 15:59:20',16,NULL),(34,'ระดับปฐมศึกษาปีที่ 1 - 3 โปรแกรมศึกษาพิเศษแบบบูรณาการ',45400.00,22700.00,0,'2025-04-01 07:51:18','2025-04-03 15:59:20',16,NULL),(35,'ระดับปฐมศึกษาปีที่ 4 - 6 โปรแกรมศึกษาพิเศษแบบบูรณาการ',46100.00,23050.00,0,'2025-04-01 07:51:18','2025-04-03 15:59:20',16,NULL),(36,'ระดับมัธยมศึกษาโปรแกรมทั่วไป 1 - 3',22000.00,11000.00,0,'2025-04-01 07:51:18','2025-04-03 15:59:20',16,NULL),(37,'ระดับมัธยมศึกษาโปรแกรมทั่วไป 4 - 6',22300.00,11150.00,0,'2025-04-01 08:46:42','2025-04-03 15:59:20',16,NULL),(38,'ระดับมัธยมศึกษาโปรแกรมเน้นความสามารถทางภาษา 1 - 3',31300.00,15650.00,0,'2025-04-01 08:46:42','2025-04-03 15:59:20',16,NULL),(39,'ระดับมัธยมศึกษาโปรแกรมเน้นความสามารถทางภาษา 4 - 6',34300.00,17150.00,0,'2025-04-01 08:46:42','2025-04-03 15:59:21',16,NULL),(40,'ระดับมัธยมศึกษาโปรแกรมเน้นความสามารถทางคณิต-วิทย์ 1 - 3',31300.00,15650.00,0,'2025-04-01 08:46:42','2025-04-03 15:59:21',16,NULL),(41,'ระดับมัธยมศึกษาโปรแกรมเน้นความสามารถทางคณิต-วิทย์ 4 - 6',34300.00,17150.00,0,'2025-04-01 08:46:42','2025-04-03 15:59:21',16,NULL),(42,'ระดับมัธยมศึกษาโปรแกรมศึกษาพิเศษแบบบูรณาการ 1 - 3',49300.00,24650.00,0,'2025-04-01 08:46:42','2025-04-03 15:59:21',16,NULL),(43,'ระดับมัธยมศึกษาโปรแกรมศึกษาพิเศษแบบบูรณาการ 4 - 6',52300.00,26150.00,0,'2025-04-01 08:46:42','2025-04-03 15:59:21',16,NULL),(44,'ระดับปฐมศึกษาปีที่ 1 - 6',45000.00,22500.00,2,'2025-01-25 11:33:44','2025-04-03 15:59:21',17,NULL),(45,'ระดับมัธยมศึกษาปีที่ 1 - 6',45000.00,22500.00,2,'2025-01-25 11:33:44','2025-04-01 08:42:43',17,NULL),(46,'ระดับปฐมศึกษาปีที่ 1 - 3',45000.00,22500.00,2,'2025-01-25 11:33:44','2025-04-01 08:42:43',18,NULL),(47,'ระดับปฐมศึกษาปีที่ 4 - 6',45000.00,22500.00,2,'2025-01-25 11:33:44','2025-04-01 08:42:43',18,NULL),(48,'ระดับมัธยมศึกษาปีที่ 1 - 3',45000.00,22500.00,2,'2025-01-25 11:33:44','2025-04-01 08:42:43',18,NULL),(49,'ระดับมัธยมศึกษาปีที่ 4 - 6',45000.00,22500.00,2,'2025-01-25 11:33:44','2025-04-01 08:42:43',18,NULL);
/*!40000 ALTER TABLE `sub_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `username` varchar(45) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `first_working_date` date NOT NULL,
  `created_by` bigint(20) NOT NULL,
  `updated_by` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `house_number` varchar(255) NOT NULL,
  `street` varchar(255) NOT NULL,
  `district` varchar(255) NOT NULL,
  `sub_district` varchar(255) NOT NULL,
  `province` varchar(255) NOT NULL,
  `postal_code` varchar(255) NOT NULL,
  `employee_types_id` bigint(20) NOT NULL,
  `positions_id` bigint(20) NOT NULL,
  `departments_id` bigint(20) NOT NULL,
  `roles_id` bigint(20) NOT NULL,
  `sector_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`),
  KEY `fk_users_employee_types1_idx` (`employee_types_id`),
  KEY `fk_users_positions1_idx` (`positions_id`),
  KEY `fk_users_departments1_idx` (`departments_id`),
  KEY `fk_users_roles1_idx` (`roles_id`),
  KEY `fk_users_sector1_idx` (`sector_id`),
  CONSTRAINT `fk_users_departments1` FOREIGN KEY (`departments_id`) REFERENCES `departments` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_users_employee_types1` FOREIGN KEY (`employee_types_id`) REFERENCES `employee_types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_users_positions1` FOREIGN KEY (`positions_id`) REFERENCES `positions` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_users_roles1` FOREIGN KEY (`roles_id`) REFERENCES `roles` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_users_sector1` FOREIGN KEY (`sector_id`) REFERENCES `sector` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'นาย แอดมินจ้า เอาไว้ทดสอบ','64160289@buu.ac.th','admin','$2y$12$Sh7lfGBRiEe5yspam6bc9.XTpYPYnRl1Hr35IkN3nqOEX2OndNFFi','2025-01-24',0,0,'2025-01-24 10:10:32','2025-05-01 04:12:31',NULL,'205','-','เมืองชลบุรี','แสนสุข','ชลบุรี','12345',1,1,1,4,1),(2,'นาย เจ้าหน้าที่ฝ่ายการเงิน','64160284@go.buu.ac.th','financial','$2y$12$lD7pIgjemlUfV9gVPsvzcOsZ7.srIaIiXif0LVzU294tLm3yiQPs.','2025-01-29',0,34,'2025-02-02 05:27:58','2025-05-01 04:13:06',NULL,'111','-','สนามชัยเขต','ท่ากระดาน','ฉะเชิงเทรา','24160',1,1,1,2,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `view_category_welfare_sub`
--

DROP TABLE IF EXISTS `view_category_welfare_sub`;
/*!50001 DROP VIEW IF EXISTS `view_category_welfare_sub`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `view_category_welfare_sub` AS SELECT
 1 AS `welfare_id`,
  1 AS `welfare_name`,
  1 AS `category_id`,
  1 AS `category_name`,
  1 AS `category_per_times`,
  1 AS `category_per_users`,
  1 AS `category_per_years`,
  1 AS `category_fund`,
  1 AS `sub_category_id`,
  1 AS `sub_category_name`,
  1 AS `sub_category_per_times`,
  1 AS `sub_category_per_users`,
  1 AS `sub_category_per_years`,
  1 AS `sub_category_fund` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `view_dashboard`
--

DROP TABLE IF EXISTS `view_dashboard`;
/*!50001 DROP VIEW IF EXISTS `view_dashboard`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `view_dashboard` AS SELECT
 1 AS `welfare_type`,
  1 AS `id`,
  1 AS `reim_number`,
  1 AS `fund_sum_request`,
  1 AS `created_by`,
  1 AS `request_date`,
  1 AS `updated_at`,
  1 AS `status`,
  1 AS `category_id`,
  1 AS `sub_category_id`,
  1 AS `created_by_user_name`,
  1 AS `category_name`,
  1 AS `sub_category_name`,
  1 AS `created_by_name`,
  1 AS `employee_types_id`,
  1 AS `employee_types_name` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `view_reimbursements`
--

DROP TABLE IF EXISTS `view_reimbursements`;
/*!50001 DROP VIEW IF EXISTS `view_reimbursements`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `view_reimbursements` AS SELECT
 1 AS `welfare_type`,
  1 AS `id`,
  1 AS `reim_number`,
  1 AS `created_by`,
  1 AS `request_date`,
  1 AS `updated_at`,
  1 AS `status`,
  1 AS `category_id`,
  1 AS `sub_category_id`,
  1 AS `created_by_user_name`,
  1 AS `category_name`,
  1 AS `sub_category_name` */;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `welfare_types`
--

DROP TABLE IF EXISTS `welfare_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `welfare_types` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `welfare_types`
--

LOCK TABLES `welfare_types` WRITE;
/*!40000 ALTER TABLE `welfare_types` DISABLE KEYS */;
INSERT INTO `welfare_types` VALUES (1,'ประเภทสวัสดิการทั่วไป','2025-01-25 11:02:18','2025-01-25 11:02:18'),(2,'ประเภทสวัสดิการค่าสงเคราะห์ต่าง ๆ','2025-01-25 11:02:18','2025-01-25 11:02:18'),(3,'ประเภทสวัสดิการค่าสงเคราะห์การเสียชีวิตของผู้ปฏิบัติงาน','2025-01-25 11:02:18','2025-01-25 11:43:04'),(4,'ประเภทสวัสดิการเกี่ยวกับการศึกษาของบุตร','2025-01-25 11:02:18','2025-01-25 11:43:04');
/*!40000 ALTER TABLE `welfare_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `view_category_welfare_sub`
--

/*!50001 DROP VIEW IF EXISTS `view_category_welfare_sub`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_uca1400_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`user`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `view_category_welfare_sub` AS select `category_welfare_type`.`welfare_id` AS `welfare_id`,`category_welfare_type`.`welfare_name` AS `welfare_name`,`category_welfare_type`.`category_id` AS `category_id`,`category_welfare_type`.`category_name` AS `category_name`,`category_welfare_type`.`category_per_times` AS `category_per_times`,`category_welfare_type`.`category_per_users` AS `category_per_users`,`category_welfare_type`.`category_per_years` AS `category_per_years`,`category_welfare_type`.`category_fund` AS `category_fund`,`sub`.`id` AS `sub_category_id`,`sub`.`name` AS `sub_category_name`,`sub`.`per_times` AS `sub_category_per_times`,`sub`.`per_users` AS `sub_category_per_users`,`sub`.`per_years` AS `sub_category_per_years`,`sub`.`fund` AS `sub_category_fund` from ((select `welfare`.`id` AS `welfare_id`,`welfare`.`name` AS `welfare_name`,`cat`.`id` AS `category_id`,`cat`.`name` AS `category_name`,`cat`.`per_times` AS `category_per_times`,`cat`.`per_users` AS `category_per_users`,`cat`.`per_years` AS `category_per_years`,`cat`.`fund` AS `category_fund` from (`welfare_types` `welfare` left join `categories` `cat` on(`welfare`.`id` = `cat`.`welfare_types_id`))) `category_welfare_type` left join `sub_categories` `sub` on(`category_welfare_type`.`category_id` = `sub`.`categories_id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `view_dashboard`
--

/*!50001 DROP VIEW IF EXISTS `view_dashboard`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_uca1400_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`user`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `view_dashboard` AS select 'สวัสดิการค่าสงเคราะห์ต่าง ๆ' collate utf8mb4_unicode_ci AS `welfare_type`,`ra`.`id` AS `id`,`ra`.`reim_number` AS `reim_number`,`ra`.`fund_sum_request` AS `fund_sum_request`,`ra`.`created_by` AS `created_by`,`ra`.`request_date` AS `request_date`,`ra`.`updated_at` AS `updated_at`,`ra`.`status` AS `status`,`ra`.`categories_id` AS `category_id`,`ras`.`sub_categories_id` AS `sub_category_id`,`u`.`name` AS `created_by_user_name`,`c`.`name` AS `category_name`,`sc`.`name` AS `sub_category_name`,`u`.`name` AS `created_by_name`,`u`.`employee_types_id` AS `employee_types_id`,`em`.`name` AS `employee_types_name` from (((((`reimbursements_assist` `ra` join `users` `u` on(`ra`.`created_by` = `u`.`id`)) left join `categories` `c` on(`ra`.`categories_id` = `c`.`id`)) left join `reimbursements_assist_has_sub_categories` `ras` on(`ra`.`id` = `ras`.`reimbursements_assist_id`)) left join `sub_categories` `sc` on(`ras`.`sub_categories_id` = `sc`.`id`)) left join `employee_types` `em` on(`u`.`employee_types_id` = `em`.`id`)) where `ra`.`status` = 3 union all select 'สวัสดิการเกี่ยวกับการศึกษาของบุตร' collate utf8mb4_unicode_ci AS `welfare_type`,`rce`.`id` AS `id`,`rce`.`reim_number` AS `reim_number`,`rce`.`fund_sum_request` AS `fund_sum_request`,`rce`.`created_by` AS `created_by`,`rce`.`request_date` AS `request_date`,`rce`.`updated_at` AS `updated_at`,`rce`.`status` AS `status`,NULL AS `category_id`,`rcec`.`children_infomation_id` AS `sub_category_id`,`u`.`name` AS `created_by_user_name`,NULL AS `category_name`,NULL AS `sub_category_name`,`u`.`name` AS `created_by_name`,`u`.`employee_types_id` AS `employee_types_id`,`em`.`name` AS `employee_types_name` from (((`reimbursements_children_education` `rce` join `users` `u` on(`rce`.`created_by` = `u`.`id`)) left join `reimbursements_children_education_has_children_infomation` `rcec` on(`rce`.`id` = `rcec`.`reimbursements_children_education_id`)) left join `employee_types` `em` on(`u`.`employee_types_id` = `em`.`id`)) where `rce`.`status` = 3 union all select 'สวัสดิการค่าสงเคราะห์การเสียชีวิต' collate utf8mb4_unicode_ci AS `welfare_type`,`red`.`id` AS `id`,`red`.`reim_number` AS `reim_number`,`red`.`fund_sum_request` AS `fund_sum_request`,`red`.`created_by` AS `created_by`,`red`.`request_date` AS `request_date`,`red`.`updated_at` AS `updated_at`,`red`.`status` AS `status`,NULL AS `category_id`,`rec`.`categories_id` AS `sub_category_id`,`u`.`name` AS `created_by_user_name`,NULL AS `category_name`,NULL AS `sub_category_name`,`u`.`name` AS `created_by_name`,`u`.`employee_types_id` AS `employee_types_id`,`em`.`name` AS `employee_types_name` from ((((`reimbursements_employee_deceased` `red` join `users` `u` on(`red`.`created_by` = `u`.`id`)) left join `reimbursements_employee_deceased_has_categories` `rec` on(`red`.`id` = `rec`.`reimbursements_employee_deceased_id`)) left join `categories` `c` on(`rec`.`categories_id` = `c`.`id`)) left join `employee_types` `em` on(`u`.`employee_types_id` = `em`.`id`)) where `red`.`status` = 3 union all select 'สวัสดิการทั่วไป' collate utf8mb4_unicode_ci AS `welfare_type`,`rg`.`id` AS `id`,`rg`.`reim_number` AS `reim_number`,`rg`.`fund_sum_request` AS `fund_sum_request`,`rg`.`created_by` AS `created_by`,`rg`.`request_date` AS `request_date`,`rg`.`updated_at` AS `updated_at`,`rg`.`status` AS `status`,`rg`.`categories_id` AS `category_id`,`rgs`.`sub_categories_id` AS `sub_category_id`,`u`.`name` AS `created_by_user_name`,`c`.`name` AS `category_name`,`sc`.`name` AS `sub_category_name`,`u`.`name` AS `created_by_name`,`u`.`employee_types_id` AS `employee_types_id`,`em`.`name` AS `employee_types_name` from (((((`reimbursements_general` `rg` join `users` `u` on(`rg`.`created_by` = `u`.`id`)) left join `categories` `c` on(`rg`.`categories_id` = `c`.`id`)) left join `reimbursements_general_has_sub_categories` `rgs` on(`rg`.`id` = `rgs`.`reimbursements_general_id`)) left join `sub_categories` `sc` on(`rgs`.`sub_categories_id` = `sc`.`id`)) left join `employee_types` `em` on(`u`.`employee_types_id` = `em`.`id`)) where `rg`.`status` = 3 */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `before_data` json DEFAULT NULL,
  `after_data` json DEFAULT NULL,
  `detail` json DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_activity_logs_users1_idx` (`user_id`),
  CONSTRAINT `fk_activity_logs_users1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `view_reimbursements`
--

/*!50001 DROP VIEW IF EXISTS `view_reimbursements`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_uca1400_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`user`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `view_reimbursements` AS select 'สวัสดิการค่าสงเคราะห์ต่าง ๆ' collate utf8mb4_unicode_ci AS `welfare_type`,`ra`.`id` AS `id`,`ra`.`reim_number` AS `reim_number`,`ra`.`created_by` AS `created_by`,`ra`.`request_date` AS `request_date`,`ra`.`updated_at` AS `updated_at`,`ra`.`status` AS `status`,`ra`.`categories_id` AS `category_id`,NULL AS `sub_category_id`,`u`.`name` AS `created_by_user_name`,`c`.`name` AS `category_name`,NULL AS `sub_category_name` from ((`reimbursements_assist` `ra` join `users` `u` on(`ra`.`created_by` = `u`.`id`)) left join `categories` `c` on(`ra`.`categories_id` = `c`.`id`)) where `ra`.`status` <> 1 union all select 'สวัสดิการเกี่ยวกับการศึกษาของบุตร' collate utf8mb4_unicode_ci AS `welfare_type`,`rce`.`id` AS `id`,`rce`.`reim_number` AS `reim_number`,`rce`.`created_by` AS `created_by`,`rce`.`request_date` AS `request_date`,`rce`.`updated_at` AS `updated_at`,`rce`.`status` AS `status`,NULL AS `category_id`,NULL AS `sub_category_id`,`u`.`name` AS `created_by_user_name`,NULL AS `category_name`,NULL AS `sub_category_name` from (`reimbursements_children_education` `rce` join `users` `u` on(`rce`.`created_by` = `u`.`id`)) where `rce`.`status` <> 1 union all select 'สวัสดิการค่าสงเคราะห์การเสียชีวิต' collate utf8mb4_unicode_ci AS `welfare_type`,`red`.`id` AS `id`,`red`.`reim_number` AS `reim_number`,`red`.`created_by` AS `created_by`,`red`.`request_date` AS `request_date`,`red`.`updated_at` AS `updated_at`,`red`.`status` AS `status`,NULL AS `category_id`,NULL AS `sub_category_id`,`u`.`name` AS `created_by_user_name`,NULL AS `category_name`,NULL AS `sub_category_name` from (`reimbursements_employee_deceased` `red` join `users` `u` on(`red`.`created_by` = `u`.`id`)) where `red`.`status` <> 1 union all select 'สวัสดิการทั่วไป' collate utf8mb4_unicode_ci AS `welfare_type`,`rg`.`id` AS `id`,`rg`.`reim_number` AS `reim_number`,`rg`.`created_by` AS `created_by`,`rg`.`request_date` AS `request_date`,`rg`.`updated_at` AS `updated_at`,`rg`.`status` AS `status`,`rg`.`categories_id` AS `category_id`,NULL AS `sub_category_id`,`u`.`name` AS `created_by_user_name`,`c`.`name` AS `category_name`,NULL AS `sub_category_name` from ((`reimbursements_general` `rg` join `users` `u` on(`rg`.`created_by` = `u`.`id`)) left join `categories` `c` on(`rg`.`categories_id` = `c`.`id`)) where `rg`.`status` <> 1 */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-01 15:56:57
