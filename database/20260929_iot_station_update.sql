ALTER TABLE transactions
ADD COLUMN order_type ENUM('TAKEAWAY', 'DINE_IN')
NOT NULL DEFAULT 'TAKEAWAY'
AFTER payment_method;


ALTER TABLE iot_validations
ADD COLUMN validation_station ENUM('TAKEAWAY', 'DINE_IN')
NOT NULL DEFAULT 'TAKEAWAY'
AFTER transaction_id;