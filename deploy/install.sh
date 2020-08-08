#!/bin/bash
apt update
apt install -y docker-compose npm nodejs duplicity python3-pip cronic
# install cron-apt with postfix (source https://serverfault.com/a/144010)
debconf-set-selections <<< "postfix postfix/mailname string dev.cucb.co.uk"
debconf-set-selections <<< "postfix postfix/main_mailer_type string 'Internet Site'"
apt install -y postfix cron-apt 
pip3 install dropbox

# modify postfix network configuration so that connections from docker are allowed 
postconf -e mynetworks="127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128 172.18.0.0/16"
postfix reload

locale-gen en_GB.UTF-8
timedatectl set-timezone Europe/London

cd /var/www/deploy/js && npm install

# Create database backup cron job
echo -e "MAILTO=webmaster@cucb.co.uk\n0 1 * * * cd /var/www/ && cronic ./deploy/backup.sh\n@reboot cd /var/www && cronic ./deploy/start.sh" > /var/spool/cron/root
crontab /var/spool/cron/root
