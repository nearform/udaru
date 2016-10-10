#!/bin/bash
# TODO: test if database exists before attempting to create it
createdb authorization
# TODO: test if user already exists before attempting to create it
psql -c "CREATE USER admin WITH PASSWORD 'default';"
node scripts/init/database/install_001.js;
node scripts/init/database/testdata/loadUsers.js
