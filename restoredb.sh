#!/bin/bash
docker-compose exec -T postgres pg_restore --data-only -U postgres -d postgres /backups/data.sql
