#!/bin/bash

# Deployment script for Workout Tracker EC2 infrastructure
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="workout-tracker-stack"
REGION="us-east-1"
TEMPLATE_FILE="cloudformation-template.yaml"

echo -e "${BLUE}🚀 Deploying Workout Tracker Infrastructure to AWS${NC}"
echo "=================================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials are not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Check if template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo -e "${RED}❌ CloudFormation template file not found: $TEMPLATE_FILE${NC}"
    exit 1
fi

# Check if key pair exists
echo -e "${YELLOW}🔑 Checking for existing EC2 key pairs...${NC}"
KEY_PAIRS=$(aws ec2 describe-key-pairs --region $REGION --query 'KeyPairs[*].KeyName' --output text)

if [ -z "$KEY_PAIRS" ]; then
    echo -e "${YELLOW}⚠️  No key pairs found. Creating a new key pair...${NC}"
    KEY_PAIR_NAME="workout-tracker-key"
    aws ec2 create-key-pair \
        --key-name $KEY_PAIR_NAME \
        --region $REGION \
        --query 'KeyMaterial' \
        --output text > "${KEY_PAIR_NAME}.pem"
    
    chmod 400 "${KEY_PAIR_NAME}.pem"
    echo -e "${GREEN}✅ Key pair created: $KEY_PAIR_NAME${NC}"
    echo -e "${YELLOW}⚠️  Private key saved to: ${KEY_PAIR_NAME}.pem${NC}"
    echo -e "${YELLOW}⚠️  Keep this file secure and don't commit it to version control!${NC}"
else
    echo -e "${GREEN}✅ Found existing key pairs:${NC}"
    echo "$KEY_PAIRS"
    echo ""
    read -p "Enter the name of the key pair to use: " KEY_PAIR_NAME
    
    if [ -z "$KEY_PAIR_NAME" ]; then
        echo -e "${RED}❌ No key pair name provided. Exiting.${NC}"
        exit 1
    fi
fi

# Deploy CloudFormation stack
echo -e "${BLUE}📦 Deploying CloudFormation stack...${NC}"
aws cloudformation deploy \
    --template-file $TEMPLATE_FILE \
    --stack-name $STACK_NAME \
    --parameter-overrides KeyPairName=$KEY_PAIR_NAME \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION

# Wait for stack to complete
echo -e "${YELLOW}⏳ Waiting for stack deployment to complete...${NC}"
aws cloudformation wait stack-create-complete \
    --stack-name $STACK_NAME \
    --region $REGION

# Get stack outputs
echo -e "${GREEN}✅ Stack deployment completed!${NC}"
echo ""
echo -e "${BLUE}📋 Stack Outputs:${NC}"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

# Get the public IP
PUBLIC_IP=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue' \
    --output text)

echo ""
echo -e "${GREEN}🎉 Infrastructure deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. SSH into your EC2 instance:"
echo "   ssh -i ${KEY_PAIR_NAME}.pem ec2-user@$PUBLIC_IP"
echo ""
echo "2. Clone your repository:"
echo "   git clone <your-repo-url> /var/www/workout-tracker"
echo ""
echo "3. Set up environment variables:"
echo "   cp /var/www/workout-tracker/.env.example /var/www/workout-tracker/.env"
echo "   nano /var/www/workout-tracker/.env"
echo ""
echo "4. Install dependencies and build:"
echo "   cd /var/www/workout-tracker"
echo "   npm ci"
echo "   npm run build"
echo ""
echo "5. Start the application:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 startup"
echo "   pm2 save"
echo ""
echo -e "${GREEN}🌐 Your application will be available at: http://$PUBLIC_IP${NC}"
echo ""
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "• Keep your private key file secure"
echo "• Configure your domain name to point to $PUBLIC_IP"
echo "• Set up SSL certificates for HTTPS"
echo "• Configure your Firebase and OpenAI API keys in the .env file"
