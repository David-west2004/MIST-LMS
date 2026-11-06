CREATE DATABASE IF NOT EXISTS `mist_lms_db`;
USE `mist_lms_db`;

-- UNIT TABLE
CREATE TABLE IF NOT EXISTS `units`(
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `units` (`name`, `description`) VALUES
  ('Software Development', 'Web, Mobile, and Enterprise App Engineering'),
  ('Cybersecurity', 'Network Security, Penetration Testing, and Audits'),
  ('Hardware & Network Engineering', 'Infrastructure, System Admin, and Repairs')
  ON DUPLICATE KEY UPDATE `name`=`name`;

-- USER TABLE (Strictly TWO user roles: 'student' and 'supervisor')
CREATE TABLE IF NOT EXISTS `users`(
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'supervisor') NOT NULL DEFAULT 'student',
  `unit` VARCHAR(100) DEFAULT NULL,
  `matric_number` VARCHAR(50) DEFAULT NULL UNIQUE,
  `institution` VARCHAR(150) DEFAULT NULL,
  `siwes_duration_weeks` INT DEFAULT 24, -- 12, 24, or 48 weeks
  `siwes_start_date` DATE DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `is_cleared_for_completion` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_email` (`email`),
  INDEX `idx_user_role` (`role`),
  INDEX `idx_user_unit` (`unit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `week_number` INT NOT NULL,
  `login_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_student_daily_checkin` (`user_id`, `date`),
  CONSTRAINT `fk_attendance_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_attendance_student_week` (`user_id`, `week_number`) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CURRICULUM MATERIALS TABLE
CREATE TABLE IF NOT EXISTS `materials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `unit` VARCHAR(100) NOT NULL,
  `module_number` INT DEFAULT 1,
  `file_url` VARCHAR(500) NOT NULL, -- Stores Cloudinary secure_url
  `public_id` VARCHAR(255) DEFAULT NULL, -- Cloudinary asset reference
  `file_type` VARCHAR(50) DEFAULT 'pdf', -- pdf, video, doc, etc.
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_material_creator` 
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_material_unit` (`unit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- COURSEWORK ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS `assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `unit` VARCHAR(100) NOT NULL,
  `module_tag` VARCHAR(100) DEFAULT NULL,
  `due_date` DATETIME NOT NULL,
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_assignment_creator` 
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_assignment_unit` (`unit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- STUDENT SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS `submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assignment_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `submission_url` VARCHAR(500) NOT NULL, -- Stores Cloudinary secure_url
  `public_id` VARCHAR(255) DEFAULT NULL,
  `grade` VARCHAR(10) DEFAULT NULL,
  `feedback` TEXT DEFAULT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_student_assignment` (`assignment_id`, `student_id`),
  CONSTRAINT `fk_submission_assignment` 
    FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_submission_student` 
    FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CLEARANCE REQUESTS & LETTERS TABLE
CREATE TABLE IF NOT EXISTS `clearance_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL UNIQUE,
  `weeks_completed` INT NOT NULL DEFAULT 0,
  `total_weeks_required` INT NOT NULL DEFAULT 24,
  `status` ENUM('pending', 'approved_by_supervisor', 'completed', 'rejected') DEFAULT 'pending',
  `clearance_letter_url` VARCHAR(500) DEFAULT NULL, -- Cloudinary link to generated PDF
  `remarks` TEXT DEFAULT NULL,
  `requested_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `approved_at` DATETIME DEFAULT NULL,
  CONSTRAINT `fk_clearance_student` 
    FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
