#!/bin/bash

echo Loading KGs

#chmod 777 fuseki-base
chmod 777 fuseki-base/configuration
mkdir -p fuseki-base/databases
chmod 777 fuseki-base/databases

cat fuseki-base/configuration/prefixes.ttl.template > fuseki-base/configuration/assembler.ttl
for kg in $(ls ./data/kgs | grep -vP '\.baseUrl'); do
  KG_NAME=`basename $kg`
  echo -e "\t$KG_NAME"
  if [ -d "fuseki-base/databases/$KG_NAME" ]; then
    echo -e "\t\tfolder fuseki-base/databases/$KG_NAME exists"
  else
    tdb2.tdbloader --loc fuseki-base/databases/$KG_NAME ./data/kgs/$kg/$kg.nt
  fi
    KG_NAME=$KG_NAME envsubst < fuseki-base/configuration/service.ttl.template >> fuseki-base/configuration/assembler.ttl
  chmod -R 777 fuseki-base/databases/$KG_NAME
done

echo Starting Fuseki
docker build -t fuseki-kgs .

docker run --rm -it -p 3030:3030 --name fuseki \
  --mount type=bind,source="$(pwd)"/fuseki-base/databases,target=/fuseki-base/databases \
  --mount type=bind,source="$(pwd)"/fuseki-base/configuration,target=/fuseki-base/configuration \
  fuseki-kgs
