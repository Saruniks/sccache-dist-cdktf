import { TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { SccacheServer } from "./sccache-server";
import { SccacheScheduler } from "./sccache-scheduler";

export class SccacheCluster extends TerraformStack {
    public secretKey: string;
    public clientToken: string;
    public schedulerPort: number;
    public schedulerPrivateIp: string;

    constructor(scope: Construct, name: string) {
        super(scope, name);

        const provider = new AwsProvider(this, "AWS", {
            region: "eu-north-1",
          })

        this.secretKey = "kN_EyHW0RCPTRFBUiiOGutzG2G2Q__kTYJwJIgJR-ho";
        this.clientToken = "AAAABBBBCCCC";
        this.schedulerPort = 10600;

        const scheduler = new SccacheScheduler(this, "sccache-scheduler", {
            provider,
            secretKey: this.secretKey,
            clientToken: this.clientToken,
            schedulerPort: this.schedulerPort,
        })

        this.schedulerPrivateIp = scheduler.privateIp;

        new SccacheServer(this, "sccache-server", {
            provider,
            schedulerIp: scheduler.privateIp,
            secretKey: this.secretKey,
            schedulerPort: this.schedulerPort,
        })
    }
}
