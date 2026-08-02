-- V4: Relax the inventory_movement immutability trigger to allow setting
--     transfer_counterpart_id exactly once (NULL -> non-NULL).
--
-- Background: the TRANSFER_OUT + TRANSFER_IN pair is saved in two INSERTs.
-- TRANSFER_IN is saved first (counterpart = NULL), then TRANSFER_OUT is saved
-- referencing TRANSFER_IN.  A subsequent UPDATE sets TRANSFER_IN's counterpart
-- to TRANSFER_OUT's ID.  The original blanket no-update trigger blocked this,
-- causing a 500 on every transfer operation.
--
-- The new trigger allows ONLY the one-time counterpart link-back while still
-- blocking every other field change, preserving the immutability guarantee for
-- all business-significant fields.

DROP TRIGGER IF EXISTS trg_inventory_movement_no_update;

CREATE TRIGGER IF NOT EXISTS trg_inventory_movement_no_update
BEFORE UPDATE ON inventory_movement
FOR EACH ROW
BEGIN
    -- Allow setting transfer_counterpart_id from NULL to a value (one-time link).
    -- Block everything else.
    SELECT RAISE(ABORT, 'inventory_movement is immutable and cannot be updated')
    WHERE NOT (
        OLD.transfer_counterpart_id IS NULL
        AND NEW.transfer_counterpart_id IS NOT NULL
        AND OLD.product_id        = NEW.product_id
        AND OLD.location_id       = NEW.location_id
        AND OLD.movement_type     = NEW.movement_type
        AND OLD.quantity_delta    = NEW.quantity_delta
        AND OLD.performed_by      = NEW.performed_by
        AND OLD.performed_at      = NEW.performed_at
        AND (OLD.reference_id IS NEW.reference_id OR OLD.reference_id = NEW.reference_id)
        AND (OLD.reason       IS NEW.reason       OR OLD.reason       = NEW.reason)
    );
END;
