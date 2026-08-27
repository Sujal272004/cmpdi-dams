-- Seed Camps Master Data with GPS Coordinates and Drilling Targets
MERGE INTO camps (camp_code, camp_name, location, latitude, longitude, status, daily_target, weekly_target, monthly_target, yearly_target, created_at, updated_at, is_deleted)
KEY(camp_code)
VALUES
('CMPDI-AND-01', 'Anandwan Camp', 'Chandrapur District, Maharashtra', 19.961500, 79.296100, 'ACTIVE', 25.00, 150.00, 600.00, 4800.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false),
('CMPDI-MRP-02', 'Murpar Camp', 'Nagpur District, Maharashtra', 20.852400, 78.985600, 'ACTIVE', 20.00, 120.00, 450.00, 3600.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false),
('CMPDI-DGP-03', 'Durgapur Camp', 'Paschim Bardhaman, West Bengal', 23.520400, 87.311900, 'ACTIVE', 30.00, 180.00, 700.00, 5000.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false);

-- Seed Users Data (Initial Accounts)
-- Default Password for all seeded accounts is: password123
MERGE INTO users (employee_id, name, designation, email, password, role, camp_id, status, created_at, updated_at, is_deleted)
KEY(employee_id)
VALUES
('EMP001', 'System Administrator', 'Chief Mining Engineer / Admin', 'admin@cmpdi.co.in', '$2a$10$xKBmNCsFcqoSZC8bX4rY0OFKdnM2qiDOR9Ry9R3sN0Pw7pFIkewem', 'ROLE_ADMIN', NULL, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false),
('EMP002', 'Rajesh Sharma', 'Camp Executive - Anandwan', 'exec.anandwan@cmpdi.co.in', '$2a$10$xKBmNCsFcqoSZC8bX4rY0OFKdnM2qiDOR9Ry9R3sN0Pw7pFIkewem', 'ROLE_CAMP_EXEC', 1, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false),
('EMP003', 'Amit Patel', 'Camp Executive - Murpar', 'exec.murpar@cmpdi.co.in', '$2a$10$xKBmNCsFcqoSZC8bX4rY0OFKdnM2qiDOR9Ry9R3sN0Pw7pFIkewem', 'ROLE_CAMP_EXEC', 2, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false),
('EMP004', 'Dr. Sunita Deshmukh', 'General Manager (Exploration)', 'dept.head@cmpdi.co.in', '$2a$10$xKBmNCsFcqoSZC8bX4rY0OFKdnM2qiDOR9Ry9R3sN0Pw7pFIkewem', 'ROLE_DEPT_EXEC', NULL, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false);





