
ALTER TABLE user_policies ADD column variables JSONB DEFAULT '{}';
ALTER TABLE team_policies ADD column variables JSONB DEFAULT '{}';
ALTER TABLE organization_policies ADD column variables JSONB DEFAULT '{}';