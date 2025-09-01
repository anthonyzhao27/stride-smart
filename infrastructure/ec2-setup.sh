#!/bin/bash

# EC2 Setup Script for Workout Tracker
# This script sets up an EC2 instance with all necessary dependencies

set -e

echo "🚀 Setting up EC2 instance for Workout Tracker..."

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y

# Install Node.js 18.x
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git
echo "📦 Installing Git..."
sudo yum install -y git

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install nginx
echo "📦 Installing nginx..."
sudo yum install -y nginx

# Start and enable nginx
echo "🚀 Starting nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure firewall
echo "🔥 Configuring firewall..."
sudo yum install -y firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/workout-tracker
sudo chown ec2-user:ec2-user /var/www/workout-tracker

# Create nginx configuration
echo "⚙️ Creating nginx configuration..."
sudo tee /etc/nginx/conf.d/workout-tracker.conf > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    root /var/www/workout-tracker/.next;
    
    location / {
        try_files \$uri \$uri/ @nextjs;
    }
    
    location @nextjs {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /_next/static {
        alias /var/www/workout-tracker/.next/static;
        expires 365d;
        access_log off;
    }
}
EOF

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

# Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

# Create PM2 ecosystem file
echo "⚙️ Creating PM2 ecosystem file..."
cat > /var/www/workout-tracker/ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'workout-tracker',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/workout-tracker',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Create deployment script
echo "⚙️ Creating deployment script..."
cat > /var/www/workout-tracker/deploy.sh <<EOF
#!/bin/bash
set -e

echo "🚀 Deploying Workout Tracker..."

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --only=production

# Build the application
npm run build

# Restart the application
pm2 restart workout-tracker

echo "✅ Deployment completed successfully!"
EOF

chmod +x /var/www/workout-tracker/deploy.sh

# Create environment file template
echo "⚙️ Creating environment file template..."
cat > /var/www/workout-tracker/.env.example <<EOF
# Database Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Next.js Configuration
NODE_ENV=production
PORT=3000
EOF

echo "✅ EC2 setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Clone your repository: git clone <your-repo-url> /var/www/workout-tracker"
echo "2. Copy .env.example to .env and fill in your environment variables"
echo "3. Run: cd /var/www/workout-tracker && npm ci && npm run build"
echo "4. Start the application: pm2 start ecosystem.config.js"
echo "5. Set up PM2 to start on boot: pm2 startup && pm2 save"
echo ""
echo "🌐 Your application will be available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
