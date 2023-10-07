#!/bin/bash

set -e

PWD=$(pwd)

# Pull actix-web
git clone https://github.com/actix/actix-web.git
cd actix-web
git checkout 215a52f
cd $PWD

# Download and verify sccache-dist
wget https://github.com/mozilla/sccache/releases/download/v0.5.4/sccache-v0.5.4-x86_64-unknown-linux-musl.tar.gz

calculated_hash=$(sha256sum sccache-v0.5.4-x86_64-unknown-linux-musl.tar.gz | awk '{print $1}')

if [ "$calculated_hash" == "4bf3ce366aa02599019093584a5cbad4df783f8d6e3610548c2044daa595d40b" ]; then
    echo "SHA256 verification passed!"
else
    echo "SHA256 verification failed!"
fi

tar -zxvf sccache-v0.5.4-x86_64-unknown-linux-musl.tar.gz
cd sccache-v0.5.4-x86_64-unknown-linux-musl
sudo mv sccache /usr/bin/sccache
cd $PWD

# Install build dependencies
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
sudo apt install build-essential pkg-config libssl-dev libpq-dev postgresql-client -y
