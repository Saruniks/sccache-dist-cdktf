#!/bin/bash

set -e

cd $PACKER_TEMPLATE_DIR

cmd="packer build -force -var region=$REGION -var instance_type=$INSTANCE_TYPE -var image_id=$IMAGE_ID $PACKER_TEMPLATE_FILENAME"

echo "$cmd"

$cmd
