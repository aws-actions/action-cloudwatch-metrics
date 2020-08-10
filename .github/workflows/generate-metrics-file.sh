#!/usr/bin/env bash
set -euxo pipefail

now=$(date +%s)

cat << EOF > metrics.json
[
    {
        "MetricName": "test-bytes-metric",
        "Timestamp": ${now},
        "Unit": "Bytes",
        "Value": 20
    },
    {
        "MetricName": "test-seconds-metric",
        "Timestamp": ${now},
        "Unit": "Seconds",
        "Value": 11
    }
]
EOF
