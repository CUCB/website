#!/usr/bin/env bash
set -e

source /root/.env/dropbox_access_token

# Dropbox configuration variables
RESTORE_FOLDER=~/backup_restore
DROPBOX_FOLDER="other_backup"
export DPBX_ACCESS_TOKEN=$DROPBOX_ACCESS_TOKEN

echo "Restoring to $RESTORE_FOLDER"

# Restore
duplicity --no-encryption dpbx://${DROPBOX_FOLDER} ${RESTORE_FOLDER} && echo "Restore complete"

unset DPBX_ACCESS_TOKEN