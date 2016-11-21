#!/bin/bash
# TODO: team_members, team_policies
# TODO: statement_*
docker exec labsauthorization_database_1 bash -c "rm -rf /testdata"
docker cp ./scripts/init/database/testdata labsauthorization_database_1:/testdata
docker exec -it labsauthorization_database_1 bash -c "PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d authorization <<EOF
SELECT 'Database installed, schemaversion = ' || MAX(version) from schemaversion;
\cd '/testdata'
\! pwd
\COPY organizations(id, name, description) FROM 'organizations.csv' (FORMAT csv)
\COPY users(name, org_id) FROM 'users.csv' (FORMAT csv)
\COPY teams(name, description, team_parent_id, org_id) FROM 'teams.csv' (FORMAT csv)
\COPY team_members(user_id, team_id) FROM 'team_members.csv' (FORMAT csv)
EOF"
node scripts/init/database/testdata/loadPolicies.js
docker exec -it labsauthorization_database_1 bash -c "PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d authorization <<EOF
\cd './testdata'
\! pwd
\COPY ref_actions(action) FROM 'ref_actions.csv' (FORMAT csv)
\COPY user_policies(user_id, policy_id) FROM 'user_policies.csv' (FORMAT csv)
\COPY team_policies(team_id, policy_id) FROM 'team_policies.csv' (FORMAT csv)
EOF"
