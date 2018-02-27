ALTER TABLE teams
    ADD CONSTRAINT "Unique Team Names" UNIQUE (name, org_id);

ALTER TABLE policies
    ADD CONSTRAINT "Unique Policy Names" UNIQUE (name, org_id);