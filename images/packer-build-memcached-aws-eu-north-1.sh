#!/bin/bash

set -e

export REGION=eu-north-1

# image_id - Ubuntu Server Pro 22.04 LTS
# Image owner 'Canonical' is hardcoded in .pkr.hcl
export IMAGE_ID=ami-02fd0c9fa584f3ec9
export INSTANCE_TYPE=c5.large
export PACKER_TEMPLATE_DIR=aws/memcached
export PACKER_TEMPLATE_FILENAME=aws-memcached-ubuntu.pkr.hcl

./packer-build.sh
