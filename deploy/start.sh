#!/bin/bash
source ~/.ssh/environment
cd /var/www && DEPLOY_REGISTRY=$DEPLOY_REGISTRY docker-compose -f docker-compose.prod.yml up --force-recreate -d
