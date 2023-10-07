import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { TerraformProvider, TerraformStack } from "cdktf";
import { Construct } from "constructs";

interface MemcachedConfig {
    provider: TerraformProvider
}

export class Memcached extends TerraformStack {
    public publicIp: string;

    constructor(scope: Construct, name: string, config: MemcachedConfig) {
        super(scope, name);

        new AwsProvider(this, "aws-memcached-provider", {
            region: "eu-north-1",
        });

        const ami = new DataAwsAmi(this, 'memcached-ami', {
            mostRecent: true,
            owners: ['self'],
            filter: [
                {
                    name: 'name',
                    values: ['memcached-ubuntu-aws'] 
                }
            ]
        })

        const instance = new Instance(this, "memcached-instance", {
            provider: config.provider,
            ami: ami.id,
            instanceType: "t3.micro",
            tags: {
                Name: "memcached",
            },
        })

        this.publicIp = instance.publicIp;
    }
}
