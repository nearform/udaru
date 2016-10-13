#!/bin/bash

PGPASSWORD=postgres dropdb -h localhost -p 5432 -U postgres authorization
PGPASSWORD=postgres createdb -h localhost -p 5432 -U postgres authorization

PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres --echo-all -c "DROP USER IF EXISTS admin;"
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres --echo-all -c "CREATE USER admin WITH PASSWORD 'default';"
# install new database
node scripts/init/database/install_001.js;

