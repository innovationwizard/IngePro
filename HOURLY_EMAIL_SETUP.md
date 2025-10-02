# Hourly Email Notification System Setup

## Overview
This system sends hourly email notifications to track user activity for adoption monitoring. The system is designed to be temporary and will be dialed down gradually as management determines the optimal frequency.

## Components

### 1. Email Service (`src/lib/emailService.ts`)
- SMTP configuration using nodemailer
- Formats usage logs as simple text lines
- Sends to: jorgeluiscontrerasherrera@gmail.com
- Time zone: Guatemala City (UTC-6)

### 2. API Endpoint (`src/app/api/cron/usage-logs-email/route.ts`)
- Processes audit logs from the last 99 days
- Converts audit logs to user-friendly action descriptions
- Sends formatted email with usage data

### 3. Cron Job Configuration
- **Vercel Cron**: Runs every hour (`0 * * * *`)
- **GitHub Actions**: Backup cron job (same schedule)
- Both configured in `vercel.json` and `.github/workflows/hourly-cron.yml`

### 4. Activity Tracking
Added audit logging to key endpoints:
- **Authentication**: Login/logout events
- **Worklogs**: Creation and updates
- **Projects**: Creation
- **Tasks**: Creation and progress updates
- **Materials**: Creation and updates (existing)

## Environment Variables Required

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

## Email Format

```
IngePro Usage Logs - 2025-01-27 10:00:00

2025-01-27 09:45:00 | John Doe | log in
2025-01-27 09:50:00 | John Doe | added new project
2025-01-27 09:55:00 | Jane Smith | submitted worklog entry
2025-01-27 10:00:00 | Bob Wilson | updated task progress

---
This is an automated hourly report for adoption monitoring.
comment-for-human: This high frequency will be dialed down gradually as management determines optimal frequency.
```

## Action Mapping

The system maps technical audit log actions to user-friendly descriptions:

- `LOGIN` → "log in"
- `LOGOUT` → "log out"
- `WORKLOG_CREATE` → "submitted worklog entry"
- `WORKLOG_UPDATE` → "updated worklog entry"
- `TASK_PROGRESS` → "updated task progress"
- `PROJECT_CREATE` → "added new project"
- `TASK_CREATE` → "added new task"
- `MATERIAL_CREATE` → "added new material"
- `MATERIAL_UPDATE` → "updated material"
- `LOCATION_UPDATE` → "location update"
- `PASSWORD_SET` → "set password"
- `PASSWORD_RESET` → "reset password"

## Testing

### Manual Test (Development)
```bash
curl -X GET http://localhost:3000/api/cron/usage-logs-email
```

### Production Test
```bash
curl -X POST https://ingepro.app/api/cron/usage-logs-email
```

## Monitoring

- Check Vercel dashboard for cron execution logs
- Monitor GitHub Actions for backup cron runs
- Email delivery status logged to console

## Future Adjustments

As requested, this high-frequency monitoring is temporary. The system can be easily adjusted by:

1. **Changing cron schedule** in `vercel.json`:
   - Every 2 hours: `0 */2 * * *`
   - Every 6 hours: `0 */6 * * *`
   - Daily: `0 9 * * *` (9 AM daily)

2. **Updating GitHub Actions** schedule in `.github/workflows/hourly-cron.yml`

3. **Modifying time range** in the API endpoint (currently 99 days)

## Security Notes

- Email service uses SMTP with authentication
- Cron jobs are called by Vercel/GitHub infrastructure
- No external access to cron endpoints
- Audit logs are read-only for email generation

## Dependencies Added

- `nodemailer`: ^6.9.8
- `@types/nodemailer`: ^6.4.14
