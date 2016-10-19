#!/bin/bash
# TODO: team_members, team_policies
# TODO: statement_*
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d authorization <<EOF
SELECT 'Database installed, schemaversion = ' || MAX(version) from schemaversion;
\cd './scripts/init/database/testdata'
\! pwd
\COPY organizations(id, name, description) FROM 'organizations.csv' (FORMAT csv)
\COPY users(name, org_id) FROM 'users.csv' (FORMAT csv)
\COPY teams(name, description, team_parent_id, org_id) FROM 'teams.csv' (FORMAT csv)
\COPY team_members(user_id, team_id) FROM 'team_members.csv' (FORMAT csv)
\COPY policies(version, name) FROM 'policies.csv' (FORMAT csv)
\COPY statement_elements(effect, policy_id) FROM 'statement_elements.csv' (FORMAT csv)
\COPY statement_actions(action, element_id) FROM 'statement_actions.csv' (FORMAT csv)
\COPY statement_resources(resource, element_id) FROM 'statement_resources.csv' (FORMAT csv)
\COPY user_policies(user_id, policy_id) FROM 'user_policies.csv' (FORMAT csv)
\COPY team_policies(team_id, policy_id) FROM 'team_policies.csv' (FORMAT csv)
EOF
