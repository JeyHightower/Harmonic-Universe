import os
import re

def fix_imports(directory):
    print(f"Scanning directory: {directory}")
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()
                
                # Fix "from app import X" to "from backend.app import X"
                modified_content = re.sub(r'from\s+app\s+import', 'from backend.app import', content)
                
                # Fix "import app" to "import backend.app as app"
                modified_content = re.sub(r'import\s+app\b(?!\s+as)', 'import backend.app as app', modified_content)
                
                # Fix package-style imports like "from app.extensions import X" to "from backend.app.extensions import X"
                modified_content = re.sub(r'from\s+app\.([a-zA-Z0-9_\.]+)\s+import', r'from backend.app.\1 import', modified_content)
                
                # Fix imports of app as a package like "import app.config" to "import backend.app.config"
                modified_content = re.sub(r'import\s+app\.([a-zA-Z0-9_\.]+)', r'import backend.app.\1', modified_content)
                
                if content != modified_content:
                    print(f"Fixing imports in {filepath}")
                    with open(filepath, 'w') as f:
                        f.write(modified_content)

if __name__ == "__main__":
    fix_imports('/opt/render/project/src/backend')
    print("Import fixing complete!") 