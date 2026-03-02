#!/bin/bash

# Install the YT Transcript service

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="$SCRIPT_DIR/yt-transcript.service"

if [ ! -f "$SERVICE_FILE" ]; then
    echo "Error: Service file not found at $SERVICE_FILE"
    exit 1
fi

echo "Installing YT Transcript service..."

# Copy service file to systemd directory
sudo cp "$SERVICE_FILE" /etc/systemd/system/yt-transcript.service

# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable yt-transcript.service

# Start the service
sudo systemctl start yt-transcript.service

echo "Service installed and started successfully!"
echo ""
echo "To check status: sudo systemctl status yt-transcript.service"
echo "To view logs: sudo journalctl -u yt-transcript.service -f"
