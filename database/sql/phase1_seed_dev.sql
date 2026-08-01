PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

INSERT OR IGNORE INTO app_user (username, password_hash, full_name, email, role, is_active)
VALUES (
    'admin',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoO5Y6Q4QfM9vDOMkMt2rtI8exG99HCa9.',
    'System Administrator',
    'admin@warehouse.local',
    'ADMIN',
    1
);

INSERT OR IGNORE INTO category (name, description, is_active)
VALUES
    ('Beverages', 'Drinks and beverage products', 1),
    ('Electronics', 'Electronic and battery products', 1);

INSERT OR IGNORE INTO location (name, type, address, is_active)
VALUES
    ('Warehouse A', 'WAREHOUSE', '12 Industrial Road, Belgrade', 1),
    ('Store 01', 'STORE', '1 Main Street, Belgrade', 1);

COMMIT;
