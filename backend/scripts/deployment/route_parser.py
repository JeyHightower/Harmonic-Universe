import ast
import re
from typing import List, Dict, Optional

class RouteVisitor(ast.NodeVisitor):
    """AST visitor for finding Flask route definitions."""

    def __init__(self):
        self.routes = []
        self.current_blueprint = None

    def visit_Assign(self, node):
        """Visit assignment nodes to find blueprint definitions."""
        try:
            if isinstance(node.value, ast.Call):
                call = node.value
                if isinstance(call.func, ast.Name) and call.func.id == 'Blueprint':
                    # Found a Blueprint definition
                    if len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
                        self.current_blueprint = {
                            'name': node.targets[0].id,
                            'url_prefix': None
                        }
                        # Look for url_prefix in the arguments
                        for keyword in call.keywords:
                            if keyword.arg == 'url_prefix':
                                if isinstance(keyword.value, ast.Constant):
                                    self.current_blueprint['url_prefix'] = keyword.value.value
        except Exception:
            pass
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        """Visit function definitions to find route handlers."""
        route_info = None
        for decorator in node.decorator_list:
            route_info = self._parse_route_decorator(decorator)
            if route_info:
                route_info.update({
                    'handler': node.name,
                    'blueprint': self.current_blueprint['name'] if self.current_blueprint else None,
                    'url_prefix': self.current_blueprint['url_prefix'] if self.current_blueprint else None
                })
                self.routes.append(route_info)
        self.generic_visit(node)

    def _parse_route_decorator(self, decorator) -> Optional[Dict]:
        """Parse route decorator to extract method and path."""
        try:
            if isinstance(decorator, ast.Call):
                if isinstance(decorator.func, ast.Attribute):
                    # Handle route decorators like @bp.route()
                    if decorator.func.attr in ['route', 'get', 'post', 'put', 'delete', 'patch']:
                        method = decorator.func.attr.upper() if decorator.func.attr != 'route' else None
                        if len(decorator.args) > 0 and isinstance(decorator.args[0], ast.Constant):
                            path = decorator.args[0].value
                            # Look for methods in keywords if not already determined
                            if not method:
                                for keyword in decorator.keywords:
                                    if keyword.arg == 'methods' and isinstance(keyword.value, (ast.List, ast.Tuple)):
                                        method = [m.value for m in keyword.value.elts if isinstance(m, ast.Constant)]
                            return {
                                'path': path,
                                'methods': method if isinstance(method, list) else [method] if method else ['GET']
                            }
        except Exception:
            pass
        return None

def parse_route_definitions(content: str) -> List[Dict]:
    """Parse route definitions from file content."""
    try:
        tree = ast.parse(content)
        visitor = RouteVisitor()
        visitor.visit(tree)

        # Process routes to create full paths
        processed_routes = []
        for route in visitor.routes:
            if route['url_prefix']:
                # Combine url_prefix with route path
                full_path = route['url_prefix'].rstrip('/') + '/' + route['path'].lstrip('/')
            else:
                full_path = route['path']

            processed_routes.append({
                'path': full_path,
                'methods': route['methods'],
                'handler': route['handler'],
                'blueprint': route['blueprint']
            })

        return processed_routes
    except Exception as e:
        print(f"Error parsing routes: {str(e)}")
        return []

def parse_component_definitions(content: str) -> List[Dict]:
    """Parse React component definitions from file content."""
    components = []

    # Regular expressions for finding React components
    component_patterns = [
        # Function components
        r'(?:export\s+)?(?:default\s+)?function\s+([A-Z][a-zA-Z0-9]*)\s*\([^)]*\)',
        # Arrow function components
        r'(?:export\s+)?(?:default\s+)?const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*(?:\([^)]*\)|[^=]*)\s*=>\s*',
        # Class components
        r'class\s+([A-Z][a-zA-Z0-9]*)\s+extends\s+(?:React\.)?Component'
    ]

    try:
        for pattern in component_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                component_name = match.group(1)

                # Try to extract props by looking for TypeScript interfaces or PropTypes
                props = extract_component_props(content, component_name)

                components.append({
                    'name': component_name,
                    'type': 'class' if 'extends' in match.group(0) else 'function',
                    'props': props
                })
    except Exception as e:
        print(f"Error parsing components: {str(e)}")

    return components

def extract_component_props(content: str, component_name: str) -> List[str]:
    """Extract component props from TypeScript interfaces or PropTypes."""
    props = []

    # Look for TypeScript interface
    interface_pattern = rf'interface\s+{component_name}Props\s*{{([^}}]+)}}'
    interface_match = re.search(interface_pattern, content)
    if interface_match:
        # Extract prop names from interface
        prop_content = interface_match.group(1)
        prop_pattern = r'(\w+)\s*[?:]'
        props.extend(re.findall(prop_pattern, prop_content))

    # Look for PropTypes
    proptypes_pattern = rf'{component_name}\.propTypes\s*=\s*{{([^}}]+)}}'
    proptypes_match = re.search(proptypes_pattern, content)
    if proptypes_match:
        # Extract prop names from PropTypes
        prop_content = proptypes_match.group(1)
        prop_pattern = r'(\w+)\s*:'
        props.extend(re.findall(prop_pattern, prop_content))

    return list(set(props))  # Remove duplicates

if __name__ == '__main__':
    # Test the parsers
    test_route_content = '''
from flask import Blueprint

bp = Blueprint('test', __name__, url_prefix='/api')

@bp.route('/users', methods=['GET'])
def get_users():
    pass

@bp.post('/users')
def create_user():
    pass
'''

    test_component_content = '''
interface UserProps {
    name: string;
    age?: number;
}

function UserComponent({ name, age }: UserProps) {
    return <div>{name} ({age})</div>
}

UserComponent.propTypes = {
    name: PropTypes.string.required,
    age: PropTypes.number
}
'''

    print("Route definitions:")
    print(parse_route_definitions(test_route_content))
    print("\nComponent definitions:")
    print(parse_component_definitions(test_component_content))
