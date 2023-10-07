#!/bin/bash

set -e

export REGION=us-east-2

# image_id - Ubuntu Server Pro 22.04 LTS
# Image owner 'Canonical' is hardcoded in .pkr.hcl
export IMAGE_ID=ami-0dbe8f888bb358007
export INSTANCE_TYPE=t2.micro
export PACKER_TEMPLATE_DIR=aws/sccache
export PACKER_TEMPLATE_FILENAME=aws-sccache-ubuntu.pkr.hcl

./packer-build.sh
