PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    CHECK (length(trim(name)) BETWEEN 1 AND 100),
    CHECK (description IS NULL OR length(description) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_category_name ON category(name);
CREATE INDEX IF NOT EXISTS idx_category_is_active ON category(is_active);

CREATE TABLE IF NOT EXISTS location (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('WAREHOUSE', 'STORE')),
    address TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    CHECK (length(trim(name)) BETWEEN 1 AND 100),
    CHECK (address IS NULL OR length(address) <= 300)
);

CREATE INDEX IF NOT EXISTS idx_location_name ON location(name);
CREATE INDEX IF NOT EXISTS idx_location_type ON location(type);
CREATE INDEX IF NOT EXISTS idx_location_is_active ON location(is_active);

CREATE TABLE IF NOT EXISTS app_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'WAREHOUSE_OPERATOR', 'STORE_OPERATOR', 'MANAGER')),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    CHECK (length(trim(username)) BETWEEN 1 AND 50),
    CHECK (length(password_hash) >= 20),
    CHECK (length(trim(full_name)) BETWEEN 1 AND 100),
    CHECK (length(trim(email)) BETWEEN 3 AND 254),
    CHECK (instr(email, '@') > 1)
);

CREATE INDEX IF NOT EXISTS idx_user_username ON app_user(username);
CREATE INDEX IF NOT EXISTS idx_user_email ON app_user(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON app_user(role);

CREATE TABLE IF NOT EXISTS product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL,
    unit_of_measure TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0 CHECK (price >= 0),
    reorder_threshold INTEGER NOT NULL DEFAULT 0 CHECK (reorder_threshold >= 0),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    CHECK (length(trim(sku)) BETWEEN 1 AND 50),
    CHECK (sku = upper(sku)),
    CHECK (length(trim(name)) BETWEEN 1 AND 200),
    CHECK (description IS NULL OR length(description) <= 1000),
    CHECK (length(trim(unit_of_measure)) BETWEEN 1 AND 20),
    FOREIGN KEY (category_id)
        REFERENCES category(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_product_sku ON product(sku);
CREATE INDEX IF NOT EXISTS idx_product_category_id ON product(category_id);
CREATE INDEX IF NOT EXISTS idx_product_is_active ON product(is_active);
CREATE INDEX IF NOT EXISTS idx_product_name ON product(name);

CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (product_id, location_id),
    FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,
    FOREIGN KEY (location_id)
        REFERENCES location(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location_id ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_location ON inventory(product_id, location_id);

CREATE TABLE IF NOT EXISTS inventory_movement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('RECEIVE', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT')),
    quantity_delta INTEGER NOT NULL CHECK (quantity_delta <> 0),
    reference_id TEXT,
    reason TEXT,
    transfer_counterpart_id INTEGER,
    performed_by INTEGER NOT NULL,
    performed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    CHECK (reference_id IS NULL OR length(reference_id) <= 100),
    CHECK (reason IS NULL OR length(reason) <= 500),
    CHECK (movement_type <> 'ADJUSTMENT' OR (reason IS NOT NULL AND length(trim(reason)) > 0)),
    CHECK (
        (movement_type = 'RECEIVE' AND quantity_delta > 0) OR
        (movement_type = 'TRANSFER_OUT' AND quantity_delta < 0) OR
        (movement_type = 'TRANSFER_IN' AND quantity_delta > 0) OR
        (movement_type = 'ADJUSTMENT' AND quantity_delta <> 0)
    ),
    FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,
    FOREIGN KEY (location_id)
        REFERENCES location(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,
    FOREIGN KEY (performed_by)
        REFERENCES app_user(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,
    FOREIGN KEY (transfer_counterpart_id)
        REFERENCES inventory_movement(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_movement_product_id ON inventory_movement(product_id);
CREATE INDEX IF NOT EXISTS idx_movement_location_id ON inventory_movement(location_id);
CREATE INDEX IF NOT EXISTS idx_movement_performed_at ON inventory_movement(performed_at);
CREATE INDEX IF NOT EXISTS idx_movement_type ON inventory_movement(movement_type);
CREATE INDEX IF NOT EXISTS idx_movement_performed_by ON inventory_movement(performed_by);
CREATE INDEX IF NOT EXISTS idx_movement_product_location_at ON inventory_movement(product_id, location_id, performed_at);

CREATE TRIGGER IF NOT EXISTS trg_category_set_updated_at
AFTER UPDATE ON category
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE category
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_location_set_updated_at
AFTER UPDATE ON location
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE location
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_app_user_set_updated_at
AFTER UPDATE ON app_user
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE app_user
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_product_set_updated_at
AFTER UPDATE ON product
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE product
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_set_updated_at
AFTER UPDATE ON inventory
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE inventory
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_movement_no_update
BEFORE UPDATE ON inventory_movement
FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'inventory_movement is immutable and cannot be updated');
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_movement_no_delete
BEFORE DELETE ON inventory_movement
FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'inventory_movement is immutable and cannot be deleted');
END;

COMMIT;
