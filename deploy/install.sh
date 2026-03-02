#!/bin/bash

# Install the YT Transcript service with Nginx Reverse Proxy
# Includes security headers for production deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="$SCRIPT_DIR/yt-transcript.service"
NGINX_CONF="$SCRIPT_DIR/nginx.conf"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root or with sudo"
    exit 1
fi

echo "=========================================="
echo "YT Transcript - Production Setup"
echo "=========================================="
echo ""

# ===================================================================
# Install Nginx
# ===================================================================
echo "[1/6] Installing Nginx..."

if command -v apt-get &> /dev/null; then
    apt-get update
    apt-get install -y nginx certbot python3-certbot-nginx
elif command -v yum &> /dev/null; then
    yum install -y nginx
elif command -v apk &> /dev/null; then
    apk add nginx
else
    echo "Error: Unsupported package manager"
    exit 1
fi

echo "Nginx installed successfully."

# ===================================================================
# Configure Nginx
# ===================================================================
echo "[2/6] Configuring Nginx with security headers..."

# Backup existing nginx config if it exists
if [ -f /etc/nginx/nginx.conf ]; then
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d%H%M%S)
fi

# Copy our nginx configuration
cp "$NGINX_CONF" /etc/nginx/nginx.conf

# Create necessary directories
mkdir -p /var/www/yt-web

echo "Nginx configured with security headers:"
echo "  - Strict-Transport-Security (HSTS)"
echo "  - X-Content-Type-Options"
echo "  - X-Frame-Options"
echo "  - Content-Security-Policy"
echo "  - Referrer-Policy"
echo "  - X-XSS-Protection"

# ===================================================================
# Install SSL Certificates (Let's Encrypt)
# ===================================================================
echo "[3/6] Setting up SSL/TLS..."

# Check if domain is provided
DOMAIN=${1:-""}

if [ -n "$DOMAIN" ]; then
    echo "Setting up Let's Encrypt for domain: $DOMAIN"
    
    # Stop nginx temporarily for certbot
    systemctl stop nginx
    
    # Obtain certificate
    certbot --nginx -d "$DOMAIN" --agree-tos --non-interactive --email admin@"$DOMAIN"
    
    # Update nginx config with proper SSL paths
    sed -i "s|/etc/ssl/certs/ssl-cert-snakeoil.pem|/etc/letsencrypt/live/$DOMAIN/fullchain.pem|g" /etc/nginx/nginx.conf
    sed -i "s|/etc/ssl/private/ssl-cert-snakeoil.key|/etc/letsencrypt/live/$DOMAIN/privkey.pem|g" /etc/nginx/nginx.conf
    
    # Set up automatic renewal
    echo "0 */12 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'" >> /etc/cron.d/certbot-renewal
    
    echo "SSL certificates configured for $DOMAIN"
else
    echo "No domain provided - using self-signed certificates"
    echo "For production, run: $0 yourdomain.com"
fi

# ===================================================================
# Test Nginx Configuration
# ===================================================================
echo "[4/6] Testing Nginx configuration..."

nginx -t

# ===================================================================
# Install and Configure Backend Service
# ===================================================================
echo "[5/6] Installing Backend service..."

if [ ! -f "$SERVICE_FILE" ]; then
    echo "Warning: Service file not found at $SERVICE_FILE"
    echo "Skipping systemd service installation."
else
    # Copy service file to systemd directory
    cp "$SERVICE_FILE" /etc/systemd/system/yt-transcript.service
    
    # Reload systemd daemon
    systemctl daemon-reload
    
    # Enable service to start on boot
    systemctl enable yt-transcript.service
    
    # Start the service
    systemctl start yt-transcript.service
    
    echo "Backend service installed and started."
fi

# ===================================================================
# Start Nginx
# ===================================================================
echo "[6/6] Starting Nginx..."

# Ensure nginx has proper permissions
chown -R www-data:www-data /var/www/yt-web
chmod -R 755 /var/www/yt-web

# Start and enable nginx
systemctl enable nginx
systemctl restart nginx

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "Services running:"
echo "  - Nginx (reverse proxy): http://localhost (port 80/443)"
echo "  - Backend (FastAPI):     http://localhost:8001"
echo ""
echo "Security headers enabled:"
echo "  ✓ Strict-Transport-Security"
echo "  ✓ X-Content-Type-Options"
echo "  ✓ X-Frame-Options"
echo "  ✓ Content-Security-Policy"
echo "  ✓ Referrer-Policy"
echo "  ✓ X-XSS-Protection"
echo ""
echo "Commands:"
echo "  Check nginx status:  systemctl status nginx"
echo "  Check backend:      systemctl status yt-transcript"
echo "  View nginx logs:    tail -f /var/log/nginx/access.log"
echo "  View backend logs:  journalctl -u yt-transcript -f"
echo ""
echo "For SSL with Let's Encrypt:"
echo "  $0 yourdomain.com"
echo ""
