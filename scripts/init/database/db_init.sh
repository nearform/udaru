#!/bin/bash
# TODO: test if database exists before attempting to create it
createdb authorization
# TODO: test if user already exists before attempting to create it
psql --echo-all -c "CREATE USER admin WITH PASSWORD 'default';"
# remove old database, if it exists
node scripts/init/database/install_000.js;
# install new database
node scripts/init/database/install_001.js;
