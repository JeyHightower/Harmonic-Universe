# Harmonic Universe Deployment Guide

This guide provides instructions for deploying the Harmonic Universe application on Render.com.

## Prerequisites

- Git repository with your application code
- Render.com account
- PostgreSQL database set up on Render

## Standard Deployment Process

1. **Prepare Your Repository**

   Ensure your repository contains:

   - `render.yaml` - For Blueprint deployment
   - `wsgi_wrapper.py` - To handle database state before app initialization
   - `requirements.txt` - All dependencies with specific versions

2. **Set Up Environment Variables**

   Required environment variables:

   - `DATABASE_URL`: PostgreSQL connection string
   - `SECRET_KEY`: App security key
   - `FLASK_APP`: Main application module
   - `FLASK_ENV`: Set to 'production' for deployment

3. **Deploy Using Render Blueprint**

   - Go to your Render dashboard
   - Click "New" → "Blueprint"
   - Connect your repository
   - Configure as needed (can use defaults if render.yaml is properly set up)
   - Click "Apply Blueprint"

4. **Monitor the Deployment**

   - Watch the build logs for errors
   - If you see "relation already exists" errors, use the solutions in QUICK_REFERENCE.md
   - Verify deployment by accessing your app's URL

## Troubleshooting Common Issues

### Issue: "relation already exists" Error

If you encounter "relation already exists" errors during migration:

1. **Use Quick Fix (Option 1 in QUICK_REFERENCE.md)**

   - Access your database via Render shell
   - Run the SQL commands to fix the alembic_version table

2. **Verify Fix**

   - Run `psql $DATABASE_URL -c "SELECT * FROM alembic_version;"`
   - Should show version_num = '60ebacf5d282'

3. **Redeploy**
   - Trigger a manual deploy in the Render dashboard

### Issue: Database Connection Errors

If your app can't connect to the database:

1. **Check Environment Variables**

   - Verify DATABASE_URL is correctly set
   - Ensure format is: `postgresql://username:password@host:port/database`

2. **Check Network Rules**

   - Ensure your web service has access to your database service

3. **Run Verification Script**
   - Upload and run `render_verify.py`
   - Follow the recommendations in the report

## Ongoing Maintenance

### Database Migrations

For future migrations:

1. Generate migration locally: `flask db migrate -m "Description"`
2. Review migration file to ensure it's correct
3. Apply locally first: `flask db upgrade`
4. Commit and push changes
5. Deploy to Render

### Monitoring

- Set up Render alerts for:
  - Failed deployments
  - High error rates
  - Excessive resource usage

## Support

If you encounter issues not covered by this guide:

1. Check Render logs for specific error messages
2. Run the verification script for diagnostics
3. Refer to EMERGENCY_FIX.md for advanced troubleshooting
