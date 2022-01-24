
#  #docker build -t graphdb-kgs --force-rm .
#  docker-compose  up -d --build --force-recreate
#  
#  CONTAINER_ID=`docker-compose ps -q graphdb`
#  # /opt/graphdb/dist/bin/preload --force   -q /tmp -c /opt/graphdb/graphdb-repo-config.ttl /opt/graphdb/home/graphdb-import/wordnet.nt
#  
#  
#  
#  #/opt/graphdb/dist/bin/graphdb -Dgraphdb.home=/opt/graphdb/home


echo Starting GraphDB preload container
docker-compose  up -d --build --force-recreate > run.log

echo Loading KGs
for kg in $(ls ./data/kgs); do
  KG_NAME=`basename $kg`
  echo -e "\t$KG_NAME"
  KG_NAME=$KG_NAME envsubst < data/config.ttl.template > data/config/$KG_NAME.ttl
  docker exec graphdb-kgs /opt/graphdb/dist/bin/preload --force --recursive \
                                -q /tmp \
                                -c /opt/graphdb/config/$KG_NAME.ttl \
                                /opt/graphdb/home/graphdb-import/$KG_NAME

done

echo Starting GraphDB
docker exec -d graphdb-kgs /opt/graphdb/dist/bin/graphdb -Dgraphdb.home=/opt/graphdb/home

