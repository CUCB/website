#!/usr/bin/env bash
set -e
BLOCK=$(find /mnt -name "website_*")

# Dropbox configuration variables
DROPBOX_FOLDER="other_backup"
BLOCK=$(find /mnt -name "website_*")
source /root/.env/dropbox_access_token
export DPBX_ACCESS_TOKEN=$DROPBOX_ACCESS_TOKEN

# Remove files older than 60 days from Dropbox
duplicity remove-older-than 60D --force dpbx://${DROPBOX_FOLDER}
# Sync everything to Dropbox (full backup once a month)
duplicity --full-if-older-than 1M --no-encryption "$BLOCK/" dpbx://${DROPBOX_FOLDER}
# Cleanup failures
duplicity --no-encryption cleanup --force dpbx://${DROPBOX_FOLDER}

unset DPBX_ACCESS_TOKEN
