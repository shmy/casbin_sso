rm -rf ./deploy/dist ./deploy/model.conf ./deploy/package.json ./deploy/package-lock.json ./deploy/.env
npm run build
mv ./dist ./deploy/dist
cp ./model.conf ./deploy/model.conf
cp ./package.json ./deploy/package.json
cp ./package-lock.json ./deploy/package-lock.json
echo "MYSQL_HOST=172.17.0.1
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=914111374
MYSQL_DATABASE=sso" > ./deploy/.env
cd ./deploy
docker build -t shmy/sso:latest .
echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
docker push shmy/sso:latest
