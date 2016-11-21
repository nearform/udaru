#!/bin/bash

docker exec -it labsauthorization_database_1 bash -c "PGPASSWORD=postgres dropdb -h localhost -p 5432 -U postgres authorization"
docker exec -it labsauthorization_database_1 bash -c "PGPASSWORD=postgres createdb -h localhost -p 5432 -U postgres authorization"
# by default the db has UTF8 character encoding with auto-commit

docker exec -it labsauthorization_database_1 bash -c "PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres --echo-all -c \"DROP USER IF EXISTS admin;\""
docker exec -it labsauthorization_database_1 bash -c "PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres --echo-all -c \"CREATE USER admin WITH PASSWORD 'default';\""
# install new database
node scripts/init/database/install_001.js;
