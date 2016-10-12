#!/bin/bash
source ./scripts/init/database/confirm.sh

if confirm "drop and re-create empty authorization database?" ; then
  dropdb authorization
  createdb authorization
  echo "database re-created"
  if confirm "drop and re-create database users?" ; then
    psql --echo-all -c "DROP USER IF EXISTS admin;"
    psql --echo-all -c "CREATE USER admin WITH PASSWORD 'default';"
  else
    echo "no changes made to the database users"
  fi
else
  echo "no changes made to the database"
fi
