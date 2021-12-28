#!/bin/bash
docker-compose exec -T postgres pg_restore --data-only --schema=cucb -U postgres -d postgres /backups/data.sql
