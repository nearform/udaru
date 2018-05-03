ALTER TABLE organizations ADD CONSTRAINT valid_chars CHECK (id SIMILAR TO '[A-Za-z0-9-]+');
ALTER TABLE users ADD CONSTRAINT valid_chars CHECK (id SIMILAR TO '[A-Za-z0-9-]+');
ALTER TABLE teams ADD CONSTRAINT valid_chars CHECK (id SIMILAR TO '[A-Za-z0-9-]+');
ALTER TABLE policies ADD CONSTRAINT valid_chars CHECK (id SIMILAR TO '[A-Za-z0-9-]+');