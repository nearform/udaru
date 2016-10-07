#!/bin/bash
createdb authorization
psql -c "CREATE USER admin WITH PASSWORD 'default';"
node scripts/init/database/install_001.js;
node scripts/init/database/testdata/loadUsers.js
