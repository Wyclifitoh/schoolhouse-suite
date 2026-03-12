# CHUO Deployment Guide — VPS (Ubuntu/Debian)

## Architecture

```
[Browser] → [Nginx] → [Frontend (static files)]
                    → [Backend API (Node.js + PM2)] → [MySQL]
```

---

## 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL 8
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Install Nginx & PM2
sudo apt install -y nginx
sudo npm install -g pm2
```

## 2. MySQL Database Setup

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE chuo_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chuo_user'@'localhost' IDENTIFIED BY '@!Chuo.WikiTeq024';
GRANT ALL PRIVILEGES ON chuo.* TO 'chuo_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u chuo_user -p chuo < /path/to/backend/schema.sql
```

## 3. Backend Deployment

```bash
# Clone your repo
cd /var/www
git clone YOUR_REPO_URL chuo
cd chuo/backend

# Install dependencies
npm install --production

# Create .env file
cp .env.example .env
nano .env
```

### Edit `/var/www/chuo/backend/.env`:

```env
PORT=4000
NODE_ENV=production
DATABASE_URL=mysql://chuo_user:YOUR_STRONG_PASSWORD@localhost:3306/chuo
JWT_SECRET=GENERATE_A_64_CHAR_RANDOM_STRING
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=https://yourdomain.com
```

Generate a secure JWT secret:

```bash
openssl rand -hex 32
```

### Start with PM2:

```bash
pm2 start server.js --name chuo-api
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

## 4. Frontend Build & Deploy

```bash
cd /var/www/chuo

# Create frontend .env
echo "VITE_API_URL=https://yourdomain.com/api/v1" > .env.production

# Install & build
npm install
npm run build

# The built files are in /var/www/chuo/dist
```

## 5. Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/chuo
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend — serve static files
    root /var/www/chuo/dist;
    index index.html;

    # SPA routing — all frontend routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API — proxy to Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:4000;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/chuo /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## 6. SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# Follow prompts — auto-renews via cron
```

## 7. Create First Admin User

```bash
# Connect to MySQL
mysql -u chuo_user -p chuo

# Insert school
INSERT INTO schools (id, name, code, curriculum_type)
VALUES (UUID(), 'WIKITEQ CHUO', 'wikiteq-chuo', 'CBC');

# Note the school ID
SELECT id FROM schools LIMIT 1;
-- e.g., 'abc-123-...'
```

Then use the API to register:

```bash
curl -X POST https://chuoapi.wikiteq.co.ke/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@chuo.ac.ke",
    "password": "Admin123!",
    "full_name": "System Admin",
    "school_id": "825514d8-1d6a-11f1-9d54-9600044660aa",
    "role": "super_admin"
  }'
```

## 8. Monitoring & Maintenance

```bash
# View logs
pm2 logs chuo-api

# Monitor
pm2 monit

# Restart
pm2 restart chuo-api

# Update code
cd /var/www/chuo
git pull
cd backend && npm install --production
pm2 restart chuo-api
npm run build  # Rebuild frontend
```

## 9. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 10. MySQL Backups (Cron)

```bash
sudo mkdir -p /var/backups/mysql
sudo nano /etc/cron.d/chuo-backup
```

```cron
0 2 * * * root mysqldump -u chuo_user -pYOUR_PASSWORD chuo | gzip > /var/backups/mysql/chuo_$(date +\%Y\%m\%d).sql.gz
0 3 * * 0 root find /var/backups/mysql -mtime +30 -delete
```

---

## Quick Reference

| Service       | Command                        |
| ------------- | ------------------------------ |
| Start API     | `pm2 start chuo-api`           |
| Stop API      | `pm2 stop chuo-api`            |
| Restart API   | `pm2 restart chuo-api`         |
| View logs     | `pm2 logs chuo-api`            |
| Nginx restart | `sudo systemctl restart nginx` |
| MySQL console | `mysql -u chuo_user -p chuo`   |
| SSL renew     | `sudo certbot renew`           |

## Environment Variables

| Variable       | Description                 | Example                                 |
| -------------- | --------------------------- | --------------------------------------- |
| `PORT`         | API server port             | `4000`                                  |
| `DATABASE_URL` | MySQL connection string     | `mysql://user:pass@localhost:3306/chuo` |
| `JWT_SECRET`   | Token signing key           | `64-char random hex`                    |
| `CORS_ORIGIN`  | Allowed frontend origin     | `https://yourdomain.com`                |
| `VITE_API_URL` | Frontend → Backend API base | `https://yourdomain.com/api/v1`         |
