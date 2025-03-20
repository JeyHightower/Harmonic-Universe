from flask import Blueprint, jsonify, current_app, send_from_directory, abort, make_response
import os
import logging
import psycopg2
import sys
import platform
from datetime import datetime

# Configure logger
logger = logging.getLogger(__name__)

# Create a main routes blueprint
main_bp = Blueprint('main', __name__)

@main_bp.route('/api')
def api_index():
    """API root endpoint"""
    return jsonify({'message': 'Welcome to Harmonic Universe API'})

@main_bp.route('/api/health')
def health():
    """Health check endpoint"""
    from app import db
    # Check database connection
    db_health = "healthy"
    db_error = None
    try:
        db.engine.execute("SELECT 1")
    except Exception as e:
        db_health = "unhealthy"
        db_error = str(e)

    return jsonify({
        'status': 'healthy',
        'database': db_health,
        'database_error': db_error
    })

@main_bp.route('/api/troubleshoot')
def troubleshoot():
    """API endpoint that provides troubleshooting information and system status"""

    # Collect system information
    system_info = {
        'timestamp': datetime.now().isoformat(),
        'os': platform.platform(),
        'python_version': platform.python_version(),
        'python_path': sys.executable,
        'app_path': os.path.abspath(os.getcwd()),
        'static_folder': current_app.static_folder,
        'env': os.environ.get('FLASK_ENV', 'unknown')
    }

    # Database connection check
    db_status = {
        'connection': 'unknown',
        'error': None,
        'tables': []
    }

    try:
        from app import db
        db.engine.execute("SELECT 1")
        db_status['connection'] = 'connected'

        # Get table names
        result = db.engine.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
        """)
        db_status['tables'] = [row[0] for row in result]

    except Exception as e:
        db_status['connection'] = 'error'
        db_status['error'] = str(e)

    # Static files check
    static_status = {
        'exists': os.path.exists(current_app.static_folder),
        'index_exists': os.path.exists(os.path.join(current_app.static_folder, 'index.html')),
        'files': []
    }

    if static_status['exists']:
        static_status['files'] = os.listdir(current_app.static_folder)[:10]  # List first 10 files

    # Migration status
    migration_status = {
        'alembic_exists': False,
        'version': None
    }

    try:
        # Try to get the current migration version
        result = db.engine.execute("SELECT version_num FROM alembic_version")
        row = result.fetchone()
        if row:
            migration_status['alembic_exists'] = True
            migration_status['version'] = row[0]
    except Exception as e:
        migration_status['error'] = str(e)

    # Common issues & solutions
    troubleshooting_help = {
        '404_errors': [
            'Check route definitions in app/routes.py',
            'Ensure URL patterns match your frontend requests',
            'Verify static files exist in the correct directory'
        ],
        'database_issues': [
            'Verify DATABASE_URL environment variable',
            'Check that migrations have been applied',
            'Ensure tables are created correctly'
        ],
        'static_file_problems': [
            'Check file permissions on static directory',
            'Verify file paths in HTML/CSS references',
            'Make sure favicon.ico exists'
        ],
        '500_errors': [
            'Check application logs for specific error messages',
            'Verify all required environment variables are set',
            'Check database connection and permissions'
        ]
    }

    return jsonify({
        'status': 'ok',
        'system': system_info,
        'database': db_status,
        'static': static_status,
        'migrations': migration_status,
        'troubleshooting_help': troubleshooting_help
    })

@main_bp.route('/troubleshoot')
def troubleshoot_page():
    """HTML page for troubleshooting the application"""

    html = """<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe - Troubleshooting</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
        h1, h2, h3 { color: #444; }
        .container { max-width: 900px; margin: 0 auto; }
        .card { background: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        pre { background: #f1f1f1; padding: 10px; border-radius: 4px; overflow: auto; }
        .section { margin-bottom: 30px; }
        button { background: #4a90e2; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #3a80d2; }
        .hidden { display: none; }
        table { width: 100%; border-collapse: collapse; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }

        /* Command block styling */
        .command-block {
            background-color: #f8f8f8;
            border: 1px solid #ddd;
            border-radius: 5px;
            margin: 15px 0;
            padding: 10px;
        }
        .command {
            font-family: monospace;
            background-color: #f1f1f1;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 10px;
            white-space: pre;
            overflow-x: auto;
        }
        .command-actions {
            display: flex;
            gap: 10px;
        }
        .copy-btn, .execute-btn {
            padding: 5px 15px;
            font-size: 14px;
            cursor: pointer;
            border: none;
            border-radius: 4px;
        }
        .copy-btn {
            background-color: #6c757d;
            color: white;
        }
        .execute-btn {
            background-color: #28a745;
            color: white;
        }
        .status-block {
            margin-top: 20px;
            padding: 10px;
            border-radius: 4px;
        }
        #detailed-status {
            margin-top: 30px;
        }
        .highlight {
            border-left: 4px solid #4a90e2;
            padding-left: 15px;
            background-color: #f0f7ff;
        }
        .code-block {
            max-height: 300px;
            overflow-y: auto;
            font-size: 14px;
        }
        .apply-btn {
            background-color: #28a745;
            color: white;
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .apply-btn:hover {
            background-color: #218838;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Troubleshooting Flask Application Errors</h1>

        <div class="card status-block">
            <h2>Application Status</h2>
            <div id="app-status">Loading status information...</div>

            <button onclick="toggleSection('detailed-status')" style="margin-top: 15px;">Show/Hide Detailed Status</button>
            <div id="detailed-status" class="hidden">
                <div class="card">
                    <h3>System Information</h3>
                    <div id="system-info"></div>
                </div>

                <div class="card">
                    <h3>Database Status</h3>
                    <div id="db-info"></div>
                </div>

                <div class="card">
                    <h3>Static Files</h3>
                    <div id="static-info"></div>
                </div>

                <div class="card">
                    <h3>Migration Status</h3>
                    <div id="migration-info"></div>
                </div>
            </div>
        </div>

        <div class="card" id="migration-problem" style="display: none;">
            <h2>The Problem</h2>
            <p>Your database connection is working, but Alembic migrations haven't been initialized. The alembic_version table is missing, which is needed to track your database schema versions.</p>

            <h3>Solution: Initialize Migrations</h3>
            <p>As suggested in your status report, you need to initialize the migration tracking:</p>

            <div class="command-block">
                <div class="command">python fix_migrations.py</div>
                <div class="command-actions">
                    <button class="copy-btn" onclick="copyCommand(this)">Copy</button>
                    <button class="execute-btn" onclick="executeCommand('python fix_migrations.py')">Execute</button>
                </div>
            </div>

            <p>If that script doesn't exist or doesn't work, you can manually initialize migrations with:</p>

            <div class="command-block">
                <div class="command">flask db init
flask db migrate -m "Initial migration"
flask db upgrade</div>
                <div class="command-actions">
                    <button class="copy-btn" onclick="copyCommand(this)">Copy</button>
                    <button class="execute-btn" onclick="executeCommand('flask db init && flask db migrate -m \"Initial migration\" && flask db upgrade')">Execute</button>
                </div>
            </div>

            <h3>Create an initialize_migrations.py Script</h3>
            <p>For a more robust solution, you can use our initialize_migrations.py script:</p>

            <div class="command-block">
                <div class="command">python initialize_migrations.py</div>
                <div class="command-actions">
                    <button class="copy-btn" onclick="copyCommand(this)">Copy</button>
                    <button class="execute-btn" onclick="executeCommand('python initialize_migrations.py')">Execute</button>
                </div>
            </div>

            <h3>Production Deployment Steps</h3>
            <p>After fixing the migrations locally, you'll need to:</p>

            <div class="command-block">
                <div class="command">git add .
git commit -m "Fix database migrations"
git push</div>
                <div class="command-actions">
                    <button class="copy-btn" onclick="copyCommand(this)">Copy</button>
                    <button class="execute-btn" onclick="executeCommand('git add . && git commit -m \"Fix database migrations\" && git push')">Execute</button>
                </div>
            </div>

            <p>On Render, you may need to run the migration commands in the Shell tab:</p>

            <div class="command-block">
                <div class="command">python initialize_migrations.py</div>
                <div class="command-actions">
                    <button class="copy-btn" onclick="copyCommand(this)">Copy</button>
                    <button class="execute-btn" onclick="executeCommand('python initialize_migrations.py')">Execute</button>
                </div>
            </div>

            <p>Your application should function properly once the migrations are initialized. This will create the necessary alembic_version table to track your schema changes going forward.</p>
        </div>

        <div class="card">
            <p>I don't see a specific error mentioned in your latest message. Your application is successfully serving:</p>
            <ul>
                <li>Root route (/) returning HTTP 200</li>
                <li>/api/health endpoint functioning properly</li>
            </ul>
        </div>

        <h2>Common Issues & Solutions</h2>
        <p>If you're experiencing a new error, here are some general troubleshooting steps:</p>

        <div class="card">
            <h3>1. 404 Not Found Errors</h3>
            <div class="command-block">
                <div class="command"># Check your route definitions in app/routes.py
# Make sure all URL patterns are correctly defined</div>
                <div class="command-actions">
                    <button class="copy-btn" onclick="copyCommand(this)">Copy</button>
                    <button class="execute-btn" onclick="executeCommand('nano app/routes.py')">Execute</button>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>2. Database Connection Issues</h3>
            <div class="command-block">
                <div class="command"># Verify your DATABASE_URL environment variable on Render
# Test database connection with a simple query</div>
                <div class="command-actions">
                    <button class="copy-btn" onclick="copyCommand(this)">Copy</button>
                    <button class="execute-btn" onclick="executeCommand('python -c \"import os; print(os.environ.get(\\'DATABASE_URL\\'))\"')">Execute</button>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>3. Static File Serving Problems</h3>
            <div class="command-block">
                <div class="command"># Ensure static files are in the correct directory
# Check permissions on static files</div>
                <div class="command-actions">
                    <button class="copy-btn" onclick="copyCommand(this)">Copy</button>
                    <button class="execute-btn" onclick="executeCommand('ls -la static/')">Execute</button>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>4. 500 Internal Server Errors</h3>
            <div class="command-block">
                <div class="command"># Add more detailed error logging
# Check application logs on Render</div>
                <div class="command-actions">
                    <button class="copy-btn" onclick="copyCommand(this)">Copy</button>
                    <button class="execute-btn" onclick="executeCommand('python check_app.py')">Execute</button>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Specific Troubleshooting</h2>
            <p>For more targeted help, please provide:</p>
            <ul>
                <li>The specific error message you're seeing</li>
                <li>The endpoint or functionality that's failing</li>
                <li>Any relevant code that might be related to the issue</li>
                <li>Recent changes you've made to the application</li>
            </ul>
            <p>If you're experiencing an error in a specific part of your application, please share those details for more tailored assistance.</p>
        </div>
    </div>

    <script>
        // Function to copy command to clipboard
        function copyCommand(button) {
            const commandBlock = button.parentElement.previousElementSibling;
            const commandText = commandBlock.innerText;

            navigator.clipboard.writeText(commandText).then(function() {
                const originalText = button.innerText;
                button.innerText = 'Copied!';
                button.style.backgroundColor = '#28a745';

                setTimeout(function() {
                    button.innerText = originalText;
                    button.style.backgroundColor = '#6c757d';
                }, 2000);
            }, function(err) {
                console.error('Could not copy text: ', err);
                button.innerText = 'Error!';
                button.style.backgroundColor = '#dc3545';

                setTimeout(function() {
                    button.innerText = 'Copy';
                    button.style.backgroundColor = '#6c757d';
                }, 2000);
            });
        }

        // Function for "Execute" button - opens a new window with instructions
        function executeCommand(command) {
            // In a real web app, we can't directly execute system commands
            // So we'll show instructions on how to run the command
            alert('To execute this command, run the following in your terminal:\\n\\n' + command);
        }

        // Function to toggle visibility of sections
        function toggleSection(id) {
            const element = document.getElementById(id);
            if (element.classList.contains('hidden')) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        }

        // Fetch troubleshooting data
        fetch('/api/troubleshoot')
            .then(response => response.json())
            .then(data => {
                // Update app status
                const statusElement = document.getElementById('app-status');
                statusElement.innerHTML = `
                    <p>API Status: <span class="success">Running</span></p>
                    <p>Environment: ${data.system.env}</p>
                    <p>Python Version: ${data.system.python_version}</p>
                    <p>Database: <span class="${data.database.connection === 'connected' ? 'success' : 'error'}">
                        ${data.database.connection === 'connected' ? 'Connected' : 'Connection Error'}
                    </span></p>
                    <p>Migrations: <span class="${data.migrations.alembic_exists ? 'success' : 'warning'}">
                        ${data.migrations.alembic_exists ? 'Initialized' : 'Not Initialized'}
                    </span></p>
                    <p>Static Files: <span class="${data.static.exists ? 'success' : 'error'}">
                        ${data.static.exists ? 'Available' : 'Missing'}
                    </span></p>
                `;

                // Show migration problem section if migrations are not initialized but database is connected
                if (!data.migrations.alembic_exists && data.database.connection === 'connected') {
                    document.getElementById('migration-problem').style.display = 'block';
                }

                // Populate system info
                document.getElementById('system-info').innerHTML = `
                    <pre>${JSON.stringify(data.system, null, 2)}</pre>
                `;

                // Populate database info
                const dbInfo = document.getElementById('db-info');
                if (data.database.connection === 'connected') {
                    let tableList = '<p>No tables found</p>';
                    if (data.database.tables.length > 0) {
                        tableList = '<h4>Tables</h4><ul>' +
                            data.database.tables.map(table => `<li>${table}</li>`).join('') +
                            '</ul>';
                    }
                    dbInfo.innerHTML = `
                        <p class="success">Database connection successful</p>
                        ${tableList}
                    `;
                } else {
                    dbInfo.innerHTML = `
                        <p class="error">Database connection error</p>
                        <p>Error: ${data.database.error || 'Unknown error'}</p>
                        <h4>Troubleshooting</h4>
                        <ul>
                            <li>Check DATABASE_URL environment variable</li>
                            <li>Verify database server is running</li>
                            <li>Check network connectivity to database</li>
                        </ul>
                    `;
                }

                // Populate static files info
                const staticInfo = document.getElementById('static-info');
                if (data.static.exists) {
                    let fileList = '<p>No files found</p>';
                    if (data.static.files.length > 0) {
                        fileList = '<h4>Files (first 10)</h4><ul>' +
                            data.static.files.map(file => `<li>${file}</li>`).join('') +
                            '</ul>';
                    }
                    staticInfo.innerHTML = `
                        <p>Static directory: ${data.system.static_folder}</p>
                        <p>Index.html: <span class="${data.static.index_exists ? 'success' : 'warning'}">
                            ${data.static.index_exists ? 'Found' : 'Missing'}
                        </span></p>
                        ${fileList}
                    `;
                } else {
                    staticInfo.innerHTML = `
                        <p class="error">Static directory not found</p>
                        <p>Expected location: ${data.system.static_folder}</p>
                    `;
                }

                // Populate migration info
                const migrationInfo = document.getElementById('migration-info');
                if (data.migrations.alembic_exists) {
                    migrationInfo.innerHTML = `
                        <p class="success">Alembic version table found</p>
                        <p>Current version: ${data.migrations.version}</p>
                    `;
                } else {
                    migrationInfo.innerHTML = `
                        <p class="warning">Alembic version table not found</p>
                        <p>Error: ${data.migrations.error || 'Unknown error'}</p>
                        <h4>Troubleshooting</h4>
                        <ul>
                            <li>Run 'python fix_migrations.py' to initialize migration tracking</li>
                            <li>Check if database migrations have been applied</li>
                        </ul>
                    `;
                }
            })
            .catch(error => {
                console.error('Error fetching troubleshooting data:', error);
                document.getElementById('app-status').innerHTML = `
                    <p class="error">Error fetching troubleshooting data</p>
                    <p>This could indicate a server-side issue or that the API is not responding.</p>
                `;
            });
    </script>
</body>
</html>
"""
    response = make_response(html)
    response.headers['Content-Type'] = 'text/html'
    return response

# Static file routes
@main_bp.route('/')
def index():
    """Serve the main index.html file"""
    current_app.logger.info("Serving root index.html")
    static_folder = current_app.static_folder
    current_app.logger.info(f"Static folder path: {static_folder}")

    # Check if index.html exists and log its presence
    index_path = os.path.join(static_folder, 'index.html')
    if os.path.exists(index_path):
        current_app.logger.info(f"index.html found at {index_path}")

        # Read the file content and return it directly
        try:
            with open(index_path, 'r') as f:
                content = f.read()
                response = make_response(content)
                response.headers['Content-Type'] = 'text/html'
                current_app.logger.info(f"Returning index.html with {len(content)} bytes")
                return response
        except Exception as e:
            current_app.logger.error(f"Error reading index.html: {str(e)}")
    else:
        current_app.logger.warning(f"index.html NOT found at {index_path}")
        # List files in static folder for debugging
        if os.path.exists(static_folder):
            current_app.logger.info(f"Files in static folder: {os.listdir(static_folder)}")
        else:
            current_app.logger.error(f"Static folder not found at: {static_folder}")

    # Fallback - create a simple HTML page
    html = """<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; }
        .container { max-width: 800px; margin: 0 auto; }
        .error { color: red; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Application is running, but there was an issue serving the index.html file.</p>
        <p>This is a dynamically generated fallback page.</p>
        <div id="api-status">Checking API status...</div>
    </div>
    <script>
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('api-status').innerHTML =
                    'API Status: <span style="color:' + (data.status === 'healthy' ? 'green' : 'red') + '">' + data.status + '</span>';
            })
            .catch(error => {
                document.getElementById('api-status').innerHTML =
                    'API Status: <span style="color:red">Connection Failed</span>';
            });
    </script>
</body>
</html>
"""
    response = make_response(html)
    response.headers['Content-Type'] = 'text/html'
    current_app.logger.info("Returning fallback HTML with 200 status")
    return response

@main_bp.route('/favicon.ico')
def favicon():
    """Serve the favicon file"""
    static_folder = current_app.static_folder
    # Try both favicon.ico and favicon.svg
    if os.path.exists(os.path.join(static_folder, 'favicon.ico')):
        return send_from_directory(static_folder, 'favicon.ico')
    elif os.path.exists(os.path.join(static_folder, 'favicon.svg')):
        return send_from_directory(static_folder, 'favicon.svg')
    else:
        current_app.logger.warning("Favicon not found")
        abort(404)

@main_bp.route('/<path:path>')
def serve_static(path):
    """Serve any static files"""
    current_app.logger.info(f"Requested static file: {path}")
    static_folder = current_app.static_folder

    # Handle the common case of assets/ path
    if path.startswith('assets/'):
        assets_path = os.path.join(static_folder, 'assets')
        file_path = os.path.join(assets_path, path[7:])
        if os.path.exists(file_path):
            current_app.logger.info(f"Serving asset from: {file_path}")
            return send_from_directory(assets_path, path[7:])
        else:
            current_app.logger.warning(f"Asset not found: {file_path}")

    # For all other paths, try to serve directly from static folder
    file_path = os.path.join(static_folder, path)
    if os.path.exists(file_path):
        current_app.logger.info(f"Serving file from: {file_path}")

        # For JavaScript and CSS files, read and return directly
        if path.endswith('.js') or path.endswith('.css'):
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    response = make_response(content)
                    if path.endswith('.js'):
                        response.headers['Content-Type'] = 'application/javascript'
                    else:
                        response.headers['Content-Type'] = 'text/css'
                    current_app.logger.info(f"Returning {path} with {len(content)} bytes")
                    return response
            except Exception as e:
                current_app.logger.error(f"Error reading {path}: {str(e)}")

        # For other files, use send_from_directory
        return send_from_directory(static_folder, path)
    else:
        current_app.logger.warning(f"File not found: {file_path}")

    # If we get here, file wasn't found
    abort(404)

@main_bp.route('/debug/static-info')
def static_info():
    """Debug endpoint to check static files"""
    import os
    from flask import jsonify

    static_dir = current_app.static_folder
    files = []

    for root, dirs, filenames in os.walk(static_dir):
        rel_dir = os.path.relpath(root, static_dir)
        for filename in filenames:
            path = os.path.join(rel_dir, filename)
            if rel_dir == '.':
                path = filename
            size = os.path.getsize(os.path.join(root, filename))
            files.append({"path": path, "size": size})

    return jsonify({
        "static_folder": static_dir,
        "file_count": len(files),
        "files": files
    })
