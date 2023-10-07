#!/bin/bash

set -e

./packer-build-memcached-aws-us-east-2.sh
./packer-build-sccache-aws-us-east-2.sh
./packer-build-sccache-dist-aws-us-east-2.sh
