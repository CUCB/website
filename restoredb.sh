#!/bin/bash
docker-compose exec -T postgres pg_restore --disable-triggers --data-only --schema=cucb -U postgres -d postgres /backups/data.sql
