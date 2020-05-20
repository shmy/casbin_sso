docker run --name sso-server -d \
-v $(pwd)/public:/opt/sso-server/public \
-p 4000:3000 \
-e NODE_ENV=production \
-e SERVER_PROTOCOL=http \
-e SERVER_PUBLIC_BASE=http://192.168.2.213:4000 \
-e SERVER_LISTEN_PORT=3000 \
-e SERVER_JWT_SECRET=1234 \
-e MYSQL_HOST=docker.for.mac.host.internal \
-e MYSQL_PORT=3306 \
-e MYSQL_USERNAME=root \
-e MYSQL_PASSWORD=123123 \
-e MYSQL_DATABASE=sso_latest \
shmy/sso:latest
