FROM postgres

ADD A-drop-db.sql /docker-entrypoint-initdb.d
ADD B-create-schema.sql /docker-entrypoint-initdb.d


EXPOSE 5432
