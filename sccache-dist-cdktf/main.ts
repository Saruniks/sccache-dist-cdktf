import { App } from "cdktf";
import { SccacheCluster } from "./src/sccache-cluster/sccache-cluster";
import { Memcached } from "./src/memcached";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { SccacheClient } from "./src/sccache-client";

const app = new App();

const provider = new AwsProvider(app, "AWS", {
  region: "eu-north-1",
})

const sccacheCluster = new SccacheCluster(app, "sccache-cluster");

const memcached = new Memcached(app, "memcached-server", {
    provider,
})

new SccacheClient(app, "sccache-client-0", {
    provider,
    clientToken: sccacheCluster.clientToken,
    schedulerIp: sccacheCluster.schedulerPrivateIp,
    schedulerPort: sccacheCluster.schedulerPort,
    memcachedIp: memcached.publicIp,
})

app.synth();
