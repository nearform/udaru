ALTER TABLE organizations
    ADD COLUMN metadata jsonb;
ALTER TABLE teams
    ADD COLUMN metadata jsonb;
ALTER TABLE users
    ADD COLUMN metadata jsonb;
    