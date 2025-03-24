#!/usr/bin/env python3

import os
import json
import re
from typing import Dict, List, Set
import ast
from pathlib import Path

class CodebaseAnalyzer:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.technologies = {
            'languages': set(),
            'frameworks': set(),
            'databases': set(),
            'frontend': set(),
            'backend': set(),
            'testing': set(),
            'deployment': set()
        }
        self.features = {
            'backend': {
                'models': set(),
                'routes': set(),
                'crud_operations': set(),
                'auth': set(),
                'middleware': set()
            },
            'frontend': {
                'components': set(),
                'pages': set(),
                'store': set(),
                'api_calls': set(),
                'auth': set()
            }
        }
        self.dependencies = {
            'backend': set(),
            'frontend': set()
        }

    def analyze_python_file(self, file_path: Path) -> None:
        """Analyze Python files for imports, classes, and functions."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                tree = ast.parse(content)
                
                # Analyze imports
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for name in node.names:
                            self._analyze_python_import(name.name)
                    elif isinstance(node, ast.ImportFrom):
                        if node.module:
                            self._analyze_python_import(node.module)
                    
                    # Look for class definitions
                    if isinstance(node, ast.ClassDef):
                        self._analyze_class_definition(node)
                    
                    # Look for function definitions
                    if isinstance(node, ast.FunctionDef):
                        self._analyze_function_definition(node)
        except Exception as e:
            print(f"Error analyzing {file_path}: {str(e)}")

    def analyze_jsx_file(self, file_path: Path) -> None:
        """Analyze JSX files for components, imports, and hooks."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Look for React components
                component_pattern = r'function\s+(\w+)\s*\([^)]*\)\s*{|const\s+(\w+)\s*=\s*\([^)]*\)\s*=>'
                components = re.findall(component_pattern, content)
                for component in components:
                    name = component[0] or component[1]
                    self.features['frontend']['components'].add(name)
                
                # Look for imports
                import_pattern = r'import\s+.*?from\s+[\'"]([^\'"]+)[\'"]'
                imports = re.findall(import_pattern, content)
                for imp in imports:
                    self._analyze_jsx_import(imp)
                
                # Look for Redux hooks
                if 'useSelector' in content or 'useDispatch' in content:
                    self.technologies['frontend'].add('Redux')
                
                # Look for React hooks
                if 'useState' in content or 'useEffect' in content:
                    self.technologies['frontend'].add('React Hooks')
        except Exception as e:
            print(f"Error analyzing {file_path}: {str(e)}")

    def analyze_package_json(self, file_path: Path) -> None:
        """Analyze package.json for frontend dependencies."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                dependencies = data.get('dependencies', {})
                dev_dependencies = data.get('devDependencies', {})
                
                for dep in {**dependencies, **dev_dependencies}:
                    self.dependencies['frontend'].add(dep)
                    self._analyze_frontend_dependency(dep)
        except Exception as e:
            print(f"Error analyzing {file_path}: {str(e)}")

    def analyze_requirements_txt(self, file_path: Path) -> None:
        """Analyze requirements.txt for backend dependencies."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        package = line.split('==')[0]
                        self.dependencies['backend'].add(package)
                        self._analyze_backend_dependency(package)
        except Exception as e:
            print(f"Error analyzing {file_path}: {str(e)}")

    def _analyze_python_import(self, import_name: str) -> None:
        """Analyze Python imports to identify technologies."""
        if import_name.startswith('flask'):
            self.technologies['frameworks'].add('Flask')
            self.technologies['backend'].add('Flask')
        elif import_name.startswith('sqlalchemy'):
            self.technologies['databases'].add('SQLAlchemy')
        elif import_name.startswith('pytest'):
            self.technologies['testing'].add('pytest')
        elif import_name.startswith('alembic'):
            self.technologies['databases'].add('Alembic')

    def _analyze_jsx_import(self, import_name: str) -> None:
        """Analyze JSX imports to identify technologies."""
        if 'react' in import_name.lower():
            self.technologies['frontend'].add('React')
        elif 'redux' in import_name.lower():
            self.technologies['frontend'].add('Redux')
        elif 'axios' in import_name.lower():
            self.technologies['frontend'].add('Axios')

    def _analyze_class_definition(self, node: ast.ClassDef) -> None:
        """Analyze Python class definitions."""
        if 'Model' in [base.id for base in node.bases]:
            self.features['backend']['models'].add(node.name)
        elif 'View' in [base.id for base in node.bases]:
            self.features['backend']['routes'].add(node.name)

    def _analyze_function_definition(self, node: ast.FunctionDef) -> None:
        """Analyze Python function definitions."""
        if node.name.startswith(('get_', 'post_', 'put_', 'delete_')):
            self.features['backend']['crud_operations'].add(node.name)

    def _analyze_frontend_dependency(self, dep: str) -> None:
        """Analyze frontend dependencies."""
        if 'react' in dep.lower():
            self.technologies['frontend'].add('React')
        elif 'redux' in dep.lower():
            self.technologies['frontend'].add('Redux')
        elif 'vite' in dep.lower():
            self.technologies['frontend'].add('Vite')
        elif 'jest' in dep.lower():
            self.technologies['testing'].add('Jest')

    def _analyze_backend_dependency(self, dep: str) -> None:
        """Analyze backend dependencies."""
        if 'flask' in dep.lower():
            self.technologies['frameworks'].add('Flask')
            self.technologies['backend'].add('Flask')
        elif 'sqlalchemy' in dep.lower():
            self.technologies['databases'].add('SQLAlchemy')
        elif 'alembic' in dep.lower():
            self.technologies['databases'].add('Alembic')
        elif 'pytest' in dep.lower():
            self.technologies['testing'].add('pytest')

    def analyze_codebase(self) -> None:
        """Analyze the entire codebase."""
        for root, _, files in os.walk(self.root_dir):
            for file in files:
                file_path = Path(root) / file
                
                if file.endswith('.py'):
                    self.analyze_python_file(file_path)
                elif file.endswith(('.jsx', '.js')):
                    self.analyze_jsx_file(file_path)
                elif file == 'package.json':
                    self.analyze_package_json(file_path)
                elif file == 'requirements.txt':
                    self.analyze_requirements_txt(file_path)

    def generate_report(self) -> Dict:
        """Generate a comprehensive report of the analysis."""
        return {
            'technologies': {
                category: list(items) for category, items in self.technologies.items()
            },
            'features': {
                category: {
                    subcategory: list(items) for subcategory, items in subitems.items()
                } for category, subitems in self.features.items()
            },
            'dependencies': {
                category: list(items) for category, items in self.dependencies.items()
            }
        }

def main():
    # Get the project root directory
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Create analyzer instance
    analyzer = CodebaseAnalyzer(root_dir)
    
    # Analyze the codebase
    analyzer.analyze_codebase()
    
    # Generate and print report
    report = analyzer.generate_report()
    print("\n=== Codebase Analysis Report ===\n")
    
    print("Technologies Used:")
    for category, items in report['technologies'].items():
        print(f"\n{category.title()}:")
        for item in sorted(items):
            print(f"  - {item}")
    
    print("\nFeatures Implemented:")
    for category, subitems in report['features'].items():
        print(f"\n{category.title()}:")
        for subcategory, items in subitems.items():
            print(f"  {subcategory.title()}:")
            for item in sorted(items):
                print(f"    - {item}")
    
    print("\nDependencies:")
    for category, items in report['dependencies'].items():
        print(f"\n{category.title()}:")
        for item in sorted(items):
            print(f"  - {item}")

if __name__ == "__main__":
    main() 