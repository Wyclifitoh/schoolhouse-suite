-- Migration: Create calendar_events table
-- Created at: 2026-07-03

CREATE TABLE IF NOT EXISTS `calendar_events` (
  `id` char(36) NOT NULL,
  `school_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `location` varchar(255),
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `all_day` tinyint(1) NOT NULL DEFAULT 0,
  `color` varchar(20) DEFAULT '#3b82f6',
  `category` varchar(50) DEFAULT 'general',
  `audience` varchar(50) DEFAULT 'all',
  `grade_id` char(36) DEFAULT NULL,
  `stream_id` char(36) DEFAULT NULL,
  `reminder_minutes` int NOT NULL DEFAULT 60,
  `reminder_sent` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_calendar_events_school` (`school_id`),
  KEY `idx_calendar_events_starts` (`starts_at`),
  KEY `idx_calendar_events_audience` (`audience`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
