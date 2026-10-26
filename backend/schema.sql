CREATE DATABASE IF NOT EXISTS inclusive_portal;
USE inclusive_portal;

-- The project does not drop or overwrite your existing service_requests table.
CREATE TABLE IF NOT EXISTS service_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(190) NOT NULL,
  email VARCHAR(190) NOT NULL,
  service VARCHAR(100) NOT NULL,
  details TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'Submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_requests_email ON service_requests(email);

CREATE TABLE IF NOT EXISTS portal_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(190) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
