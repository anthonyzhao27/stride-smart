# AWS EC2 Deployment Guide for Workout Tracker

This guide will walk you through deploying your Next.js workout tracker application to AWS EC2 using CloudFormation.

## 🏗️ Architecture Overview

The infrastructure includes:
- **EC2 Instance**: Amazon Linux 2023 with Node.js 18.x
- **VPC**: Custom VPC with public subnet
- **Security Groups**: Configured for HTTP, HTTPS, SSH, and Next.js app access
- **Load Balancer**: Nginx reverse proxy
- **Process Manager**: PM2 for Node.js application management
- **IAM Role**: For EC2 instance permissions

## 📋 Prerequisites

1. **AWS Account**: Active AWS account with appropriate permissions
2. **AWS CLI**: Installed and configured with your credentials
3. **EC2 Key Pair**: For SSH access to your instance
4. **Domain Name**: (Optional) For production use

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

1. **Navigate to infrastructure directory**:
   ```bash
   cd infrastructure
   ```

2. **Make deployment script executable**:
   ```bash
   chmod +x deploy.sh
   ```

3. **Run the deployment script**:
   ```bash
   ./deploy.sh
   ```

The script will:
- Check AWS CLI installation and credentials
- Create or use existing EC2 key pair
- Deploy CloudFormation stack
- Provide next steps for application deployment

### Option 2: Manual CloudFormation Deployment

1. **Deploy the CloudFormation stack**:
   ```bash
   aws cloudformation deploy \
     --template-file cloudformation-template.yaml \
     --stack-name workout-tracker-stack \
     --parameter-overrides KeyPairName=your-key-pair-name \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

2. **Wait for stack completion**:
   ```bash
   aws cloudformation wait stack-create-complete \
     --stack-name workout-tracker-stack \
     --region us-east-1
   ```

## 🔧 Post-Deployment Setup

### 1. SSH into Your EC2 Instance

```bash
ssh -i your-key-pair.pem ec2-user@YOUR_PUBLIC_IP
```

### 2. Clone Your Repository

```bash
git clone https://github.com/yourusername/workout-tracker.git /var/www/workout-tracker
cd /var/www/workout-tracker
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

Fill in your environment variables:
```env
# Firebase Configuration
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
```

### 4. Install Dependencies and Build

```bash
npm ci --only=production
npm run build
```

### 5. Start the Application

```bash
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### 6. Verify Deployment

```bash
pm2 status
pm2 logs workout-tracker
```

## 🌐 Accessing Your Application

- **HTTP**: `http://YOUR_PUBLIC_IP`
- **SSH**: `ssh -i your-key-pair.pem ec2-user@YOUR_PUBLIC_IP`

## 📊 Monitoring and Management

### PM2 Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs workout-tracker

# Restart application
pm2 restart workout-tracker

# Stop application
pm2 stop workout-tracker

# Monitor resources
pm2 monit
```

### Nginx Commands

```bash
# Check nginx status
sudo systemctl status nginx

# Reload nginx configuration
sudo systemctl reload nginx

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔄 Updating Your Application

### Option 1: Using the Deploy Script

```bash
cd /var/www/workout-tracker
./deploy.sh
```

### Option 2: Manual Update

```bash
cd /var/www/workout-tracker
git pull origin main
npm ci --only=production
npm run build
pm2 restart workout-tracker
```

## 🔒 Security Considerations

1. **Key Pair Security**: Keep your `.pem` file secure and never commit it to version control
2. **Firewall**: Security groups are configured to allow only necessary ports
3. **IAM Roles**: EC2 instance uses minimal required permissions
4. **HTTPS**: Consider setting up SSL certificates for production use

## 🚨 Troubleshooting

### Common Issues

1. **Application not starting**:
   ```bash
   pm2 logs workout-tracker
   cd /var/www/workout-tracker && npm start
   ```

2. **Nginx not serving content**:
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   sudo systemctl reload nginx
   ```

3. **Port conflicts**:
   ```bash
   sudo netstat -tlnp | grep :3000
   sudo netstat -tlnp | grep :80
   ```

4. **Permission issues**:
   ```bash
   sudo chown -R ec2-user:ec2-user /var/www/workout-tracker
   ```

### Log Locations

- **PM2 logs**: `pm2 logs workout-tracker`
- **Nginx access logs**: `/var/log/nginx/access.log`
- **Nginx error logs**: `/var/log/nginx/error.log`
- **System logs**: `sudo journalctl -u nginx`

## 💰 Cost Optimization

- **Instance Type**: Start with `t3.micro` (free tier eligible)
- **Auto Scaling**: Consider setting up auto-scaling for production workloads
- **Reserved Instances**: For predictable workloads, consider reserved instances
- **Spot Instances**: For non-critical workloads, consider spot instances

## 🔄 Scaling Considerations

For production scaling, consider:
- **Load Balancer**: Application Load Balancer for multiple instances
- **Auto Scaling Group**: Automatically scale based on demand
- **RDS**: Move to managed database service
- **S3**: Use S3 for static file storage
- **CloudFront**: CDN for global content delivery

## 📚 Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. Check PM2 and Nginx logs
4. Verify security group configurations
5. Ensure all environment variables are set correctly
