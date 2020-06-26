#!/bin/bash

# exit if a command returns a non-zero exit code and also print the commands and their args as they are executed
set -e -x
# Download and install required tools.
# pulumi
curl -fsSL https://get.pulumi.com/ | bash
export PATH=$PATH:$HOME/.pulumi/bin
# Login into pulumi. This will require the PULUMI_ACCESS_TOKEN environment variable
pulumi login
# update the GitLab Runner's packages
apt-get update -y
apt-get install sudo -y
# nodejs
apt-get install -y nodejs npm
