PG_PASSWORD=$(openssl rand -base64 40 | sed 's/\//-/g')
# SESSION_SECRET=$(openssl rand -base64 40)
# ADMIN_SECRET=$(openssl rand -base64 40 | sed 's/\//-/g')
# BLOCK_STORAGE=$(find /mnt -name "website_*")
cp .env.template .env
echo "PG_PASSWORD=$PG_PASSWORD" >> .env
# echo "SESSION_SECRET=$SESSION_SECRET" >> .env
# echo "HASURA_GRAPHQL_ADMIN_SECRET=$ADMIN_SECRET" >> .env
# echo "BLOCK_STORAGE=$BLOCK_STORAGE" >> .env
