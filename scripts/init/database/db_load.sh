#!/bin/bash
# TODO: team_members, team_policies
# TODO: statement_*
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d authorization <<EOF
SELECT 'Database installed, schemaversion = ' || MAX(version) from schemaversion;
\cd './scripts/init/database/testdata'
\! pwd
\COPY users(name) FROM 'users.csv' (FORMAT csv)
\COPY organizations(name, description) FROM 'organizations.csv' (FORMAT csv)
\COPY teams(name, description, team_parent_id, org_id) FROM 'teams.csv' (FORMAT csv)
\COPY policies(version, name) FROM 'policies.csv' (FORMAT csv)
\COPY user_policies(user_id, policy_id) FROM 'user_policies.csv' (FORMAT csv)
EOF
