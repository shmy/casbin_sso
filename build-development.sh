npm run build
rm -rf ./deploy
mkdir -p ./deploy
mv ./dist ./deploy/dist
cp ./model.conf ./deploy/model.conf
cp ./package.json ./deploy/package.json
cp ./package-lock.json ./deploy/package-lock.json
cp ./Dockerfile ./deploy/Dockerfile
cd ./deploy
docker build -t shmy/sso:latest .
#echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
#docker push shmy/sso:latest
#sudo apt-get update && sudo apt-get install sshpass -y
#sshpass -p $SSH_PASS ssh -o StrictHostKeyChecking=no root@47.75.55.94 "cd /home/sso && ./start.sh"
