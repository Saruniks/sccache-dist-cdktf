import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";
import { IamInstanceProfile } from "@cdktf/provider-aws/lib/iam-instance-profile";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { TerraformProvider } from "cdktf";
import { Construct } from "constructs";
import { sccacheServerConfig } from "./sccache-server-config";

interface SccacheServerConfig {
    provider: TerraformProvider,
    secretKey: string,
    schedulerIp: string,
    schedulerPort: number,
    // Path to the config file for sccache-dist
    configPath?: string,
    serverPort?: number,
}

export class SccacheServer extends Construct {
    constructor(scope: Construct, name: string, config: SccacheServerConfig) {
        super(scope, name);

        new CloudwatchLogGroup(this, 'LogGroup2', {
            name: "/sccache-server/"
          });

        // IAM Role
        const role = new IamRole(this, 'CloudWatchAgentRole', {
            assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Principal: {
                Service: "ec2.amazonaws.com"
                },
                Effect: "Allow",
            }]
            })
        });
    
        // Attach the CloudWatchAgentServerPolicy to the role
        new IamRolePolicyAttachment(this, 'RolePolicyAttachment', {
            policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
            role: role.name
        });
    
        // Create an instance profile for the EC2 instance
        const instanceProfile = new IamInstanceProfile(this, 'InstanceProfile', {
            role: role.name
        });
    
        const ami = new DataAwsAmi(this, 'memcached-ami', {
            mostRecent: true,
            owners: ['self'],
            filter: [
                {
                    name: 'name',
                    values: ['sccache-dist-ubuntu-aws'] 
                }
            ]
        })

        new Instance(this, "server-0", {
            ami: ami.id,
            instanceType: "t3.micro",
            iamInstanceProfile: instanceProfile.name,
            tags: {
                Name: "sccache-server",
            },
            userData: sccacheServerConfig({
                configPath: config.configPath ?? '/etc/sccache',
                serverPort: config.serverPort ?? 10600, 
                schedulerIp: config.schedulerIp, 
                schedulerPort: config.schedulerPort, 
                secretKey: config.secretKey
            }),
      })
    }
}
