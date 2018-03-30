ALTER TABLE organization_policies ADD COLUMN policy_instance serial;
ALTER TABLE team_policies ADD COLUMN policy_instance serial;
ALTER TABLE user_policies ADD COLUMN policy_instance serial;