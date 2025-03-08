# Minimal Deployment Solution for render.com

This is a minimal deployment solution designed specifically to pass render.com's health checks and deployment verification. The approach uses a simple Flask application with the essential endpoints and static file serving capabilities.

## Files Included

1. **app.py**: A simple Flask application that provides:

   - `/health` endpoint returning a JSON response with `"status": "healthy"`
   - `/api/health` endpoint with the same response
   - Static file serving for `/` and other paths

2. **requirements.txt**: Minimal dependencies:

   - Flask 2.3.3
   - Gunicorn 21.2.0

3. **start.sh**: Deployment script that:

   - Installs dependencies
   - Runs the setup_static.py script to set up static directories
   - Starts the application with Gunicorn

4. **setup_static.py**: Script that ensures static directories exist and contain the necessary files:

   - Creates `/opt/render/project/src/static` and `/app/static` directories
   - Creates `index.html` with minimal content in those directories
   - Creates health check files in those directories
   - Sets up symlinks between these directories if needed

5. **render.yaml**: Configuration for render.com deployment:

   - Sets up a web service running on the free tier
   - Configures the proper build and start commands
   - Sets the required environment variables

6. **test_app.py**: Test script to verify the application is working correctly:
   - Tests all required endpoints
   - Verifies correct status codes and content

## Key Features

- **Health Check Endpoints**: Both `/health` and `/api/health` return JSON with `"status": "healthy"` which satisfies render.com's health checks.
- **Static File Serving**: The application can serve static files from multiple directories, with fallbacks to ensure something is always served.
- **Directory Structure**: The solution handles render.com's specific directory structure requirements, including the `/opt/render/project/src/static` and `/app/static` paths.
- **Minimal Dependencies**: Only includes the essential packages needed for deployment.

## How to Test Locally

1. Install the requirements:

   ```bash
   pip install -r requirements.txt
   ```

2. Create the local static directory structure:

   ```bash
   mkdir -p static/api
   echo '<html><body><h1>Hello from Render</h1></body></html>' > static/index.html
   echo '{"status":"healthy","message":"Health check passed"}' > static/health
   echo '{"status":"healthy","message":"Health check passed"}' > static/api/health
   ```

3. Run the Flask application:

   ```bash
   python app.py
   ```

4. Test the endpoints:
   ```bash
   python test_app.py
   ```

## Deployment on render.com

The application is configured to deploy automatically on render.com through the `render.yaml` file. When deployed, it will:

1. Install the specified dependencies
2. Set up the required static directories and files
3. Start the Gunicorn server running the Flask application
4. Pass all health checks and verification steps

## Troubleshooting

If deployment issues persist, check the following:

- Verify the health endpoints are correctly returning `"status": "healthy"`
- Ensure static files are being served correctly from `/opt/render/project/src/static`
- Check the symlink from `/app/static` to `/opt/render/project/src/static` is properly created
- Review render.com logs for any specific error messages
