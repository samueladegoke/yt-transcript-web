#!/bin/bash

# Check status of YT Transcript service

SERVICE_NAME="yt-transcript.service"

echo "=== Service Status ==="
sudo systemctl status "$SERVICE_NAME" --no-pager

echo ""
echo "=== Recent Logs (last 20 lines) ==="
sudo journalctl -u "$SERVICE_NAME" -n 20 --no-pager

echo ""
echo "=== Active Connections ==="
sudo ss -tlnp | grep :8001 || echo "No connections on port 8001"
