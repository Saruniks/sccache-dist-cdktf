import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";
import { EbsVolume } from "@cdktf/provider-aws/lib/ebs-volume";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { VolumeAttachment } from "@cdktf/provider-aws/lib/volume-attachment";
import { TerraformProvider, TerraformStack } from "cdktf";
import { Construct } from "constructs";

interface SccacheClientConfig {
    provider: TerraformProvider
    clientToken: string,
    schedulerIp: string,
    schedulerPort?: number,
    memcachedIp: string,
}

export class SccacheClient extends TerraformStack {
    public publicIp: string;

    constructor(scope: Construct, name: string, config: SccacheClientConfig) {
        super(scope, name);

        new AwsProvider(this, "aws-sccache-client-provider", {
            region: "eu-north-1",
        });

        const schedulerPort = config.schedulerPort ?? 10600;

        const ami = new DataAwsAmi(this, 'memcached-ami', {
            mostRecent: true,
            owners: ['self'],
            filter: [
                {
                    name: 'name',
                    values: ['sccache-ubuntu-aws'] 
                }
            ]
        })

        const instance = new Instance(this, "client", {
            provider: config.provider,
            ami: ami.id,
            instanceType: "t3.micro",
            tags: {
                Name: "sccache-client",
            },
            userData: `#!/bin/bash

mkdir -p /etc/sccache

cat <<EOT >> /etc/sccache/config
[dist]
# The URL used to connect to the scheduler (should use https, given an ideal
# setup of a HTTPS server in front of the scheduler)
scheduler_url = "http://${config.schedulerIp}:${schedulerPort}"
# Used for mapping local toolchains to remote cross-compile toolchains. Empty in
# this example where the client and build server are both Linux.
toolchains = []
# Size of the local toolchain cache, in bytes (5GB here, 10GB if unspecified).
toolchain_cache_size = 5368709120

[dist.auth]
type = "token"
token = "${config.clientToken}"

[cache.memcached]
url = "tcp://${config.memcachedIp}:11211"
expiration = 86400

EOT`,
        })

        const ebsVolume = new EbsVolume(this, 'CustomEbsVolume', {
            availabilityZone: instance.availabilityZone,
            size: 16, 
            type: 'gp2',
            tags: {
              Name: 'cdktf-ebs-volume'
            }
          });
        
        new VolumeAttachment(this, 'EbsVolumeAttachment', {
            deviceName: '/dev/sdh',
            instanceId: instance.id,
            volumeId: ebsVolume.id
        });

        this.publicIp = instance.publicIp
    }
}