#!/bin/bash
cd /var/www && docker-compose -f docker-compose.prod.yml build && docker-compose -f docker-compose.prod.yml up --force-recreate -d
