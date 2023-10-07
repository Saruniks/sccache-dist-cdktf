#!/bin/bash

set -e

./packer-build-memcached-aws-eu-north-1.sh
./packer-build-sccache-aws-eu-north-1.sh
./packer-build-sccache-dist-aws-eu-north-1.sh
