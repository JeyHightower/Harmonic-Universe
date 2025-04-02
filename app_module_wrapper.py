"""
This file creates a package structure to make app.extensions accessible
by redirecting imports to backend.app
"""
import os
import sys
import importlib.util
import importlib.machinery
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AppFinder:
    """
    Meta path finder that redirects 'app' imports to 'backend.app'
    """
    @classmethod
    def find_spec(cls, fullname, path=None, target=None):
        # Only handle 'app' and its submodules
        if not fullname.startswith('app'):
            return None
        
        logger.info(f"AppFinder: Finding spec for {fullname}")
        
        # Convert 'app.xyz' to 'backend.app.xyz'
        backend_name = 'backend.' + fullname
        
        try:
            # Try to find the spec for the backend module
            spec = importlib.util.find_spec(backend_name)
            if spec:
                logger.info(f"AppFinder: Found spec for {backend_name}")
                return spec
        except (ImportError, AttributeError) as e:
            logger.warning(f"AppFinder: Error finding spec for {backend_name}: {e}")
        
        logger.warning(f"AppFinder: Could not find spec for {fullname} -> {backend_name}")
        return None

class AppLoader:
    """
    Loader that redirects 'app' imports to 'backend.app'
    """
    @classmethod
    def create_module(cls, spec):
        # Use the default module creation
        return None
    
    @classmethod
    def exec_module(cls, module):
        # Get the module name without 'app.'
        if module.__name__ == 'app':
            backend_name = 'backend.app'
        else:
            backend_name = 'backend.' + module.__name__
        
        logger.info(f"AppLoader: Executing module {module.__name__} -> {backend_name}")
        
        try:
            # Import the backend module
            backend_module = importlib.import_module(backend_name)
            
            # Copy all attributes from the backend module to this module
            for attr_name in dir(backend_module):
                if not attr_name.startswith('__'):
                    setattr(module, attr_name, getattr(backend_module, attr_name))
            
            logger.info(f"AppLoader: Successfully loaded {backend_name} into {module.__name__}")
        except (ImportError, AttributeError) as e:
            logger.error(f"AppLoader: Failed to load {backend_name}: {e}")
            raise ImportError(f"Cannot load {module.__name__} from {backend_name}: {e}")

# Create a package structure
def setup_app_package():
    """Set up the app package structure with appropriate __init__.py files"""
    app_dir = os.path.join(os.path.dirname(__file__), 'app')
    
    # Create app directory if it doesn't exist
    if not os.path.exists(app_dir):
        os.makedirs(app_dir)
        logger.info(f"Created app directory: {app_dir}")
    
    # Create app/__init__.py
    init_path = os.path.join(app_dir, '__init__.py')
    if not os.path.exists(init_path):
        with open(init_path, 'w') as f:
            f.write("""# This file redirects imports to backend.app
import sys
from importlib import import_module

# Import everything from backend.app
try:
    backend_app = import_module('backend.app')
    for attr_name in dir(backend_app):
        if not attr_name.startswith('__'):
            globals()[attr_name] = getattr(backend_app, attr_name)
except ImportError as e:
    print(f"Error importing backend.app: {e}")
""")
        logger.info(f"Created app/__init__.py: {init_path}")
    
    # Create app/extensions directory and __init__.py
    extensions_dir = os.path.join(app_dir, 'extensions')
    if not os.path.exists(extensions_dir):
        os.makedirs(extensions_dir)
        logger.info(f"Created extensions directory: {extensions_dir}")
    
    # Create app/extensions/__init__.py
    ext_init_path = os.path.join(extensions_dir, '__init__.py')
    if not os.path.exists(ext_init_path):
        with open(ext_init_path, 'w') as f:
            f.write("""# This file redirects imports to backend.app.extensions
import sys
from importlib import import_module

# Import everything from backend.app.extensions
try:
    backend_extensions = import_module('backend.app.extensions')
    for attr_name in dir(backend_extensions):
        if not attr_name.startswith('__'):
            globals()[attr_name] = getattr(backend_extensions, attr_name)
except ImportError as e:
    print(f"Error importing backend.app.extensions: {e}")
""")
        logger.info(f"Created app/extensions/__init__.py: {ext_init_path}")

# Register our custom import finder
def install_import_hook():
    """Install the import hook to redirect app.* imports to backend.app.*"""
    sys.meta_path.insert(0, AppFinder)
    logger.info("Installed app import hook")

# Only run this when executed directly
if __name__ == "__main__":
    setup_app_package()
    install_import_hook()
    logger.info("App module wrapper setup complete") 