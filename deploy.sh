#!/bin/bash

# Start the ssh agent (required to clone/pull)
eval $(ssh-agent -s)
ssh-add <(cat ~/.ssh/gitlab_ci)

# Load environment variables passed in from CI container
source ~/.ssh/environment
cd /var

# Install git if necessary and fetch the latest version
apt update && apt install git

if [ -d /var/www ]; then
    echo -e "--------------------\nFetching latest code\n--------------------"
    cd /var/www && \
    git fetch && \
    git checkout $CI_COMMIT_BRANCH && \
    git pull
else 
    echo -e "-------------\nCloning code\n------------"
    ssh-keyscan gitlab.com > gitlabKey && \
    ssh-keygen -lf gitlabKey && \
    cat gitlabKey >> ~/.ssh/known_hosts && \
    git clone git@gitlab.com:cucb/website www && \
    cd www && \
    git checkout $CI_COMMIT_BRANCH
fi

# Install docker and the cron job
/var/www/deploy/install.sh

if test ! -e .env; then
    # Initialise environment variables if they don't exist
    echo "Initialising .env file"
    cd /var/www && ./createenv.sh
    cat "~/.env/cloudflare_api_key" >> .env
fi

# Start the server, cleaning out unused docker stuff
echo "Starting server"
cd /var/www && \
./deploy/start.sh && \
docker system prune -f
