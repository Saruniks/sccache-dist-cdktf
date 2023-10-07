interface SccacheSchedulerConfig {
        configPath: string, 
        schedulerPort: number, 
        clientToken: string, 
        secretKey: string
} 

export function sccacheSchedulerConfig(config: SccacheSchedulerConfig) {
    return `#!/bin/bash

mkdir -p ${config.configPath}

cat <<EOT >> ${config.configPath}/scheduler.conf
public_addr = "0.0.0.0:${config.schedulerPort}"

[client_auth]
type = "token"
token = "${config.clientToken}"

[server_auth]
type = "jwt_hs256"
secret_key = "${config.secretKey}"

EOT

cat <<EOT >> /etc/systemd/system/sccache-scheduler.service
[Unit]
Description=sccache-dist scheduler
Wacdnts=network-online.target
After=network-online.target

[Service]
Type=forking
StandardOutput=file:/var/log/sccache-scheduler.log
StandardError=file:/var/log/sccache-scheduler.log
Environment=SCCACHE_ERROR_LOG=/tmp/sccache_log.txt
Environment=SCCACHE_LOG=debug
ExecStart=sccache-dist scheduler --config ${config.configPath}/scheduler.conf

[Install]
WantedBy=multi-user.target
EOT

systemctl daemon-reload
systemctl start sccache-scheduler
systemctl status
systemctl enable sccache-scheduler


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
                                            "file_path": "/var/log/sccache-scheduler.log",
                                            "log_group_name": "/sccache-scheduler/",
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