#!/bin/bash

# remove old database, if it exists
node scripts/init/database/install_000.js;
# install new database
node scripts/init/database/install_001.js;

