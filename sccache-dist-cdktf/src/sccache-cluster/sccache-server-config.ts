export interface SccacheServerConfig {
    configPath: string, 
    serverPort: number, 
    schedulerIp: string, 
    schedulerPort: number, 
    secretKey: string
} 

export function sccacheServerConfig(config: SccacheServerConfig) {
return `#!/bin/bash

hostname=$(hostname -I | sed 's/ //g')

token=$(sccache-dist auth generate-jwt-hs256-server-token \
        --secret-key ${config.secretKey} \
        --server $hostname:${config.serverPort})

mkdir -p ${config.configPath}

cat <<EOT >> ${config.configPath}/server.conf
cache_dir = "/tmp/toolchains"
public_addr = "$hostname:${config.serverPort}"
scheduler_url = "http://${config.schedulerIp}:${config.schedulerPort}"

[builder]
type = "overlay"
# The directory under which a sandboxed filesystem will be created for builds.
build_dir = "/tmp/build"
# The path to the bubblewrap version 0.3.0+ 'bwrap' binary.
bwrap_path = "/usr/bin/bwrap"

[scheduler_auth]
type = "jwt_token"
token = "$token"
EOT

cat <<EOT >> /etc/systemd/system/sccache-server.service
[Unit]
Description=sccache-dist server
Wants=network-online.target
After=network-online.target

[Service]
StandardOutput=file:/var/log/sccache-server.log
StandardError=file:/var/log/sccache-server.log
Environment=SCCACHE_ERROR_LOG=/tmp/sccache_log.txt
Environment=SCCACHE_LOG=debug
ExecStart=sccache-dist server --config ${config.configPath}/server.conf

[Install]
WantedBy=multi-user.target
EOT

systemctl daemon-reload
systemctl start sccache-server
systemctl status
systemctl enable sccache-server

cat <<EOT >> /tmp/cloudwatch-config.json
{
    "agent": {
            "metrics_collection_interval": 5,
            "logfile": "/opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log"
    },
    "logs": {
            "logs_collected": {
                    "files": {
                            "collect_list": [
                                    {
                                            "file_path": "/var/log/sccache-server.log",
                                            "log_group_name": "/sccache-server/",
                                            "log_stream_name": "logs",
                                            "timezone": "UTC"
                                    }
                            ]
                    }
            },
            "log_stream_name": "logs",
            "force_flush_interval" : 5
    }
}
EOT

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/tmp/cloudwatch-config.json -s
`
}