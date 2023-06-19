#!/bin/bash
BLOCK=$(find /mnt -name "website_*")

docker-compose -f docker-compose.prod.yml run -v "$BLOCK/db_backup:/db_backup" postgres /bin/bash -c '
	chmod 777 /db_backup;
	# save the password to a file
	echo $POSTGRES_PASSWORD > /pgpassword;
	chmod 777 /pgpassword;
	su postgres -c '"'"'current_time=$(date "+%Y%m%d-%H%M%S");
	pg_dump -Fc -h postgres < /pgpassword > "/db_backup/$current_time-full.sql";
	pg_dump -Fc --data-only -h postgres < /pgpassword > "/db_backup/$current_time-data.sql"
	'"'" 2>&1

FILES=$(ls -d $BLOCK/db_backup/* | tail -n 2)

source /root/.env/dropbox_access_token && nvm run 16 /var/www/deploy/js/backup.js $FILES
