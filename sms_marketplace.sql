/*
 Navicat Premium Data Transfer

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 80032 (8.0.32)
 Source Host           : localhost:3306
 Source Schema         : sms_marketplace

 Target Server Type    : MySQL
 Target Server Version : 80032 (8.0.32)
 File Encoding         : 65001

 Date: 19/05/2023 18:00:57
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for tbl_clients
-- ----------------------------
DROP TABLE IF EXISTS `tbl_clients`;
CREATE TABLE `tbl_clients`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `pwd` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `role` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT 'client',
  `sms_cost` float NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 22 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of tbl_clients
-- ----------------------------
INSERT INTO `tbl_clients` VALUES (1, 'admin', 'admin@gmail.com', '$2a$10$Cg4pqwdfPro2r8ObGzE9SeHH3R31sXbPPwVyaMp8/LlMPWEirnQC6', 'admin', NULL, '2023-04-07 21:25:35');
INSERT INTO `tbl_clients` VALUES (20, 'test1234', 'test1234@gmail.com', '$2a$10$/cxrpArPvrIQc0lagIOwIeEmNEecYfworffkoNHwX/PAM/LnWEQo.', 'client', 1.6, '2023-05-16 15:35:47');

-- ----------------------------
-- Table structure for tbl_numbers
-- ----------------------------
DROP TABLE IF EXISTS `tbl_numbers`;
CREATE TABLE `tbl_numbers`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `number` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `type` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `status` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `client_id`(`client_id` ASC) USING BTREE,
  CONSTRAINT `tbl_numbers_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `tbl_clients` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 37 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of tbl_numbers
-- ----------------------------

-- ----------------------------
-- Table structure for tbl_pay_history
-- ----------------------------
DROP TABLE IF EXISTS `tbl_pay_history`;
CREATE TABLE `tbl_pay_history`  (
  `client_id` int NOT NULL,
  `amount` float NULL DEFAULT NULL,
  `pay_at` datetime NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tbl_pay_history
-- ----------------------------
INSERT INTO `tbl_pay_history` VALUES (20, 0.8, '2023-05-16 16:00:25');
INSERT INTO `tbl_pay_history` VALUES (20, 0.8, '2023-05-16 16:14:08');

-- ----------------------------
-- Table structure for tbl_payment
-- ----------------------------
DROP TABLE IF EXISTS `tbl_payment`;
CREATE TABLE `tbl_payment`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `cardname` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cardnumber` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `expiredate` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `securitycode` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `customer_id` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `card_id` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `userid` int NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of tbl_payment
-- ----------------------------
INSERT INTO `tbl_payment` VALUES (9, 'Alek', '4242 4242 4242 4242', '03/57', '124', 'cus_NgdguDj10AtQFZ', NULL, 20);

-- ----------------------------
-- Table structure for tbl_settings
-- ----------------------------
DROP TABLE IF EXISTS `tbl_settings`;
CREATE TABLE `tbl_settings`  (
  `sms_cost` float NOT NULL
) ENGINE = InnoDB CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tbl_settings
-- ----------------------------
INSERT INTO `tbl_settings` VALUES (0.7);

-- ----------------------------
-- Table structure for tbl_sms
-- ----------------------------
DROP TABLE IF EXISTS `tbl_sms`;
CREATE TABLE `tbl_sms`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NULL DEFAULT NULL,
  `content` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL,
  `number` varchar(128) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `send_at` int NULL DEFAULT NULL,
  `send_status` tinyint NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `client_id`(`client_id` ASC) USING BTREE,
  CONSTRAINT `tbl_sms_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `tbl_clients` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of tbl_sms
-- ----------------------------

-- ----------------------------
-- View structure for client_view
-- ----------------------------
DROP VIEW IF EXISTS `client_view`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `client_view` AS select `tbl_clients`.`id` AS `id`,`tbl_clients`.`name` AS `name`,`tbl_clients`.`email` AS `email`,`tbl_clients`.`role` AS `role`,`tbl_clients`.`created_at` AS `created_at` from `tbl_clients`;

SET FOREIGN_KEY_CHECKS = 1;
