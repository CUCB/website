PG_PASSWORD=$(openssl rand -base64 40 | sed 's/\//-/g')
SESSION_SECRET=$(openssl rand -base64 40)
ADMIN_SECRET=$(openssl rand -base64 40 | sed 's/\//-/g')
cp .env.template .env
echo "PG_PASSWORD=$PG_PASSWORD" >> .env
echo "SESSION_SECRET=$SESSION_SECRET" >> .env
echo "HASURA_GRAPHQL_ADMIN_SECRET=$ADMIN_SECRET" >> .env
