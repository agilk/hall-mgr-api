# Deployment Guide - Exam Supervision Management System

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Production Checklist](#production-checklist)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: v18.x or higher
- **PostgreSQL**: v15.x or higher
- **npm**: v9.x or higher
- **Docker** (optional): v24.x or higher
- **Docker Compose** (optional): v2.x or higher

### Minimum Server Specifications

- **CPU**: 2 cores
- **RAM**: 4GB
- **Disk**: 20GB SSD
- **Network**: Stable internet connection

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hall-mgr-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your production values:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=your-db-user
DB_PASSWORD=your-secure-password
DB_DATABASE=exam_supervision
DB_SYNCHRONIZE=false  # NEVER set to true in production!

# JWT Configuration
JWT_SECRET=your-very-secure-secret-key-change-this
ACCESS_TOKEN_LIFETIME=30m
REFRESH_TOKEN_LIFETIME=240h

# Logging Configuration
LOG_LEVEL=info

# External Services
EXTERNAL_HALL_API_URL=https://your-exam-system.example.com
EXTERNAL_HALL_API_TOKEN=your-jwt-token-here

# 2FA Configuration
APP_NAME=Exam Supervision System

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=Exam Supervision <noreply@example.com>

# CORS Configuration
CORS_ORIGIN=https://your-frontend.example.com
```

### 4. Security Recommendations

**Important security measures:**

1. **Change JWT_SECRET** to a strong, random 256-bit key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Use strong database passwords** (minimum 16 characters, mixed case, numbers, symbols)

3. **Restrict CORS_ORIGIN** to your actual frontend domain

4. **Enable HTTPS** in production (use nginx/Apache as reverse proxy)

5. **Set up firewall rules** to restrict database access

## Database Setup

### 1. Create Database

Connect to PostgreSQL and create the database:

```sql
CREATE DATABASE exam_supervision;
CREATE USER exam_supervision_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE exam_supervision TO exam_supervision_user;
```

### 2. Run Migrations

```bash
npm run migration:run
```

This will create all necessary tables and indexes.

### 3. Verify Database

Check that all tables were created:

```sql
\c exam_supervision
\dt
```

You should see tables: users, buildings, halls, rooms, exams, assignments, attendance, violations, feedback, notifications, documents, audit_logs, participants, sync_logs.

## Application Deployment

### Option 1: Traditional Deployment (PM2)

#### 1. Install PM2 Globally

```bash
npm install -g pm2
```

#### 2. Build the Application

```bash
npm run build
```

#### 3. Create PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'exam-supervision-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
  }],
};
```

#### 4. Start Application with PM2

```bash
pm2 start ecosystem.config.js
```

#### 5. Setup PM2 Startup

```bash
pm2 startup
pm2 save
```

#### 6. Monitor Application

```bash
pm2 monit
pm2 logs exam-supervision-api
```

### Option 2: Docker Deployment

#### 1. Build Docker Image

```bash
docker build -t exam-supervision-api:latest .
```

#### 2. Run with Docker Compose

```bash
docker-compose up -d
```

This starts both the API and PostgreSQL database.

#### 3. View Logs

```bash
docker-compose logs -f api
```

#### 4. Stop Services

```bash
docker-compose down
```

#### 5. Production Docker Compose

For production, create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: exam-supervision-db-prod
    restart: always
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_DATABASE}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - exam-supervision-network
    # Don't expose port externally in production
    # Use internal network only

  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: exam-supervision-api-prod
    restart: always
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
    env_file:
      - .env
    depends_on:
      - postgres
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    networks:
      - exam-supervision-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: exam-supervision-nginx
    restart: always
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    networks:
      - exam-supervision-network

volumes:
  postgres_data:

networks:
  exam-supervision-network:
    driver: bridge
```

Run with:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Production Checklist

### Before Deployment

- [ ] All environment variables configured
- [ ] JWT_SECRET changed to secure random value
- [ ] Database credentials updated
- [ ] CORS_ORIGIN set to actual frontend domain
- [ ] SMTP credentials configured (if using email)
- [ ] External API credentials configured
- [ ] SSL certificates obtained (for HTTPS)
- [ ] Firewall rules configured
- [ ] Backups configured

### After Deployment

- [ ] Run database migrations
- [ ] Verify health check: `curl http://localhost:3000/api/health`
- [ ] Test authentication endpoints
- [ ] Verify file uploads work
- [ ] Test email notifications
- [ ] Check Swagger docs: `http://localhost:3000/api/docs`
- [ ] Monitor logs for errors
- [ ] Set up monitoring alerts
- [ ] Configure log rotation
- [ ] Test backup restoration

### Security Checklist

- [ ] HTTPS enabled
- [ ] Rate limiting active (100 req/min by default)
- [ ] JWT tokens properly secured
- [ ] Database not publicly accessible
- [ ] Secrets not in version control
- [ ] CORS properly configured
- [ ] Security headers enabled (Helmet)
- [ ] Input validation active
- [ ] SQL injection protection (TypeORM)
- [ ] File upload validation active

## Monitoring and Maintenance

### Health Checks

The API provides several health check endpoints:

- **General Health**: `GET /api/health`
- **Database Health**: `GET /api/health/db`
- **Memory Health**: `GET /api/health/memory`
- **Disk Health**: `GET /api/health/disk`
- **Readiness**: `GET /api/health/ready` (for Kubernetes)
- **Liveness**: `GET /api/health/live` (for Kubernetes)

### Monitoring Endpoints

Access monitoring data (requires EXAM_DIRECTOR role):

- **System Stats**: `GET /api/v1/monitoring/stats`
- **Performance Metrics**: `GET /api/v1/monitoring/metrics`
- **Recent Activity**: `GET /api/v1/monitoring/activity`

### Log Management

Logs are stored in:

- **Application logs**: `./logs/application-YYYY-MM-DD.log`
- **Error logs**: `./logs/error-YYYY-MM-DD.log`
- **PM2 logs**: `./logs/pm2-*.log` (if using PM2)

Logs are automatically rotated:
- Application logs: 14 days retention
- Error logs: 30 days retention

### Database Backups

#### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="exam_supervision"

pg_dump -U exam_supervision_user -d $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

Add to crontab:

```bash
0 2 * * * /path/to/backup.sh
```

#### Manual Backup

```bash
pg_dump -U exam_supervision_user -d exam_supervision > backup_$(date +%Y%m%d).sql
```

#### Restore from Backup

```bash
psql -U exam_supervision_user -d exam_supervision < backup_YYYYMMDD.sql
```

### Performance Monitoring

Monitor application performance:

```bash
# With PM2
pm2 monit

# With Docker
docker stats exam-supervision-api
```

### Update Procedure

1. **Backup database** before updating
2. **Pull latest code**:
   ```bash
   git pull origin main
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Run migrations**:
   ```bash
   npm run migration:run
   ```
5. **Build application**:
   ```bash
   npm run build
   ```
6. **Restart application**:
   ```bash
   # PM2
   pm2 restart exam-supervision-api

   # Docker
   docker-compose restart api
   ```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Symptoms**: Application crashes on startup with database connection error

**Solutions**:
- Verify database is running: `pg_isready -h localhost -p 5432`
- Check credentials in `.env`
- Verify firewall allows connection
- Check PostgreSQL logs

#### 2. Port Already in Use

**Symptoms**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change PORT in .env
```

#### 3. Migration Errors

**Symptoms**: Migrations fail to run

**Solutions**:
- Check database connection
- Verify migrations haven't been manually modified
- Run: `npm run migration:show` to see status
- Revert last migration: `npm run migration:revert`
- Check migration logs

#### 4. File Upload Fails

**Symptoms**: File upload returns 400 or 500 error

**Solutions**:
- Verify `uploads/` directory exists and is writable
- Check `UPLOAD_DIR` in `.env`
- Verify file size is under `MAX_FILE_SIZE` (default 10MB)
- Check file type is allowed (see `multer.config.ts`)

#### 5. Email Not Sending

**Symptoms**: Email notifications not received

**Solutions**:
- Verify SMTP credentials in `.env`
- Check SMTP server is accessible
- Test with: `telnet smtp.example.com 587`
- Check application logs for email errors
- Verify email service is configured: check logs for "Email service configured successfully"

#### 6. High Memory Usage

**Symptoms**: Application consuming too much memory

**Solutions**:
- Check for memory leaks in logs
- Restart application: `pm2 restart exam-supervision-api`
- Increase max_memory_restart in PM2 config
- Review query optimizations
- Check for long-running queries

### Getting Help

- **Logs**: Check `./logs/` directory
- **Health Status**: `GET /api/health`
- **Monitoring**: `GET /api/v1/monitoring/stats`
- **API Documentation**: http://localhost:3000/api/docs

### Useful Commands

```bash
# Check application status
pm2 status
docker ps

# View logs
pm2 logs exam-supervision-api --lines 100
docker logs -f exam-supervision-api

# Restart application
pm2 restart exam-supervision-api
docker-compose restart api

# Check database size
psql -U exam_supervision_user -d exam_supervision -c "SELECT pg_size_pretty(pg_database_size('exam_supervision'));"

# Check table sizes
psql -U exam_supervision_user -d exam_supervision -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

## Performance Optimization

### 1. Database Optimization

- **Indexes**: Already configured on frequently queried columns
- **Connection Pooling**: TypeORM handles this automatically
- **Query Optimization**: Use `repository.update()` for simple updates

### 2. Application Optimization

- **Clustering**: Use PM2 cluster mode for multi-core utilization
- **Caching**: Consider Redis for frequently accessed data
- **Load Balancing**: Use nginx for distributing traffic

### 3. Monitoring Recommendations

- Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
- Configure alerting for errors (e.g., Sentry, DataDog)
- Monitor disk space and set up alerts
- Track API response times

## Support

For issues or questions:
1. Check this deployment guide
2. Review application logs
3. Check API documentation at `/api/docs`
4. Contact system administrator

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0
