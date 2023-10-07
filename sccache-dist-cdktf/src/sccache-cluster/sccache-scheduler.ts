import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";
import { IamInstanceProfile } from "@cdktf/provider-aws/lib/iam-instance-profile";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { TerraformProvider } from "cdktf";
import { Construct } from "constructs";
import { sccacheSchedulerConfig } from "./sccache-scheduler-config";

interface SccacheSchedulerConfig {
    provider: TerraformProvider
    secretKey: string,
    clientToken: string,
    // Path to the config file for sccache-dist
    configPath?: string,
    schedulerPort?: number,
}

export class SccacheScheduler extends Construct {
    public privateIp: string;

    constructor(scope: Construct, name: string, config: SccacheSchedulerConfig) {
        super(scope, name);

        new CloudwatchLogGroup(this, 'sccache-scheduler-log-group', {
            name: "/sccache-scheduler/"
          });      


        // IAM Role
        const role = new IamRole(this, 'sccache-scheduler-cloudwatch-agent-role', {
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
        new IamRolePolicyAttachment(this, 'cloudwatch-role-policy-attachment', {
            policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
            role: role.name
        });
    
        // Create an instance profile for the EC2 instance
        const instanceProfile = new IamInstanceProfile(this, 'ec2-instance-profile', {
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

        const scheduler = new Instance(this, "scheduler", {
            provider: config.provider,
            ami: ami.id,
            instanceType: "t3.micro",
            iamInstanceProfile: instanceProfile.name,
            tags: {
                Name: "sccache-scheduler",
            },
            userData: sccacheSchedulerConfig({
                configPath: config.configPath ?? '/etc/sccache',
                schedulerPort: config.schedulerPort ?? 10600,
                clientToken: config.clientToken,
                secretKey: config.secretKey,
            }),
        })
        
        this.privateIp = scheduler.privateIp
    }
}