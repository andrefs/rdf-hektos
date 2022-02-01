#!/bin/bash

echo Starting GraphDB preload container
docker-compose  up -d --build --force-recreate > run.log

echo Loading KGs
for kg in $(ls ./data/kgs | grep -vP '\.baseUrl'); do
  KG_NAME=`basename $kg`
  echo -e "\t$KG_NAME"
  KG_NAME=$KG_NAME envsubst < data/config.ttl.template > data/config/$KG_NAME.ttl
  docker exec graphdb-kgs /opt/graphdb/dist/bin/preload --force --recursive \
                                -q /tmp \
                                -c /opt/graphdb/config/$KG_NAME.ttl \
                                /opt/graphdb/home/graphdb-import/$KG_NAME \
                                >/dev/null 2>&1

done

echo Starting GraphDB
docker exec -d graphdb-kgs /opt/graphdb/dist/bin/graphdb -Dgraphdb.home=/opt/graphdb/home

