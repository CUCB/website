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
    cat "~/.env/hcaptcha" >> .env
fi

echo "Downloading standard documents from dropbox"
mkdir -p docs
mkdir -p docs-new
apt update && apt install unzip
curl -X POST https://content.dropboxapi.com/2/files/download \
    --header "Authorization: Bearer $DROPBOX_ACCESS_TOKEN" \
    --header "Dropbox-API-Arg: {\"path\": \"/standard-documents.zip\"}" \
    --output standard-documents.zip && \
unzip standard-documents.zip -d docs-new && \
mv docs docs-old && \
mv docs-new docs && \
rm -rf docs-old

echo "Pulling latest build from registry"
docker login -u $DEPLOY_REGISTRY_USER -p $DEPLOY_REGISTRY_PASSWORD $DEPLOY_REGISTRY
docker pull $DEPLOY_REGISTRY/cucb/website/sapper:latest

# Start the server, cleaning out unused docker stuff
echo "Starting server"
cd /var/www && \
./deploy/start.sh && \
docker system prune -f
