#!/bin/bash

set -e 

# bubblewrap is needed for build server and not needed for scheduler
sudo apt-get install -y bubblewrap

# Cloudwatch agent for logging
wget https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

# Download and verify sccache-dist
wget https://github.com/mozilla/sccache/releases/download/v0.5.4/sccache-dist-v0.5.4-x86_64-unknown-linux-musl.tar.gz

calculated_hash=$(sha256sum sccache-dist-v0.5.4-x86_64-unknown-linux-musl.tar.gz | awk '{print $1}')

if [ "$calculated_hash" == "db02e89998fe92df521a813ac1ea30d244a80038f323f4d31e5415202f45cbad" ]; then
    echo "SHA256 verification passed!"
else
    echo "SHA256 verification failed!"
fi

tar -zxvf sccache-dist-v0.5.4-x86_64-unknown-linux-musl.tar.gz
cd sccache-dist-v0.5.4-x86_64-unknown-linux-musl
sudo mv sccache-dist /usr/bin/sccache-dist
