#!/bin/bash
source ./scripts/init/database/confirm.sh

if confirm "drop and re-create empty authorization database?" ; then
   PGPASSWORD=postgres dropdb -h localhost -p 5432 -U postgres authorization
   PGPASSWORD=postgres createdb -h localhost -p 5432 -U postgres authorization
  echo "database re-created"
  if confirm "drop and re-create database users?" ; then
    PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres --echo-all -c "DROP USER IF EXISTS admin;"
    PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres --echo-all -c "CREATE USER admin WITH PASSWORD 'default';"
  else
    echo "no changes made to the database users"
  fi
else
  echo "no changes made to the database"
fi
