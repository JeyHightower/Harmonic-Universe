"""Parse routes and components from the codebase."""

import re
import os
from typing import List, Dict, Any
from pathlib import Path
from flask import Blueprint


def extract_component_props(content: str, component_name: str) -> List[str]:
    """Extract component props from PropTypes."""
    props = []

    # Look for PropTypes
    proptypes_pattern = rf"{component_name}\.propTypes\s*=\s*{{([^}}]+)}}"
    proptypes_match = re.search(proptypes_pattern, content)
    if proptypes_match:
        # Extract prop names from PropTypes
        prop_content = proptypes_match.group(1)
        prop_pattern = r"(\w+)\s*:"
        props.extend(re.findall(prop_pattern, prop_content))

    return list(set(props))  # Remove duplicates


def parse_component_file(file_path: Path) -> Dict[str, Any]:
    """Parse a React component file."""
    with open(file_path, "r") as f:
        content = f.read()

    # Extract component name
    component_name = file_path.stem
    if component_name.endswith(".test"):
        return None

    # Extract props
    props = extract_component_props(content, component_name)

    # Extract route if component is used in routing
    route_pattern = r'<Route[^>]*path=["\'](.*?)["\'][^>]*>'
    routes = re.findall(route_pattern, content)

    return {
        "name": component_name,
        "props": props,
        "routes": routes,
        "file_path": str(file_path),
    }


def parse_flask_routes(app_dir: Path) -> List[Dict[str, Any]]:
    """Parse Flask routes from the backend."""
    routes = []

    for file_path in app_dir.rglob("*.py"):
        with open(file_path, "r") as f:
            content = f.read()

        # Look for route decorators
        route_pattern = r'@.*?route\(["\']([^"\']+)["\'](.*?)\)'
        matches = re.finditer(route_pattern, content, re.DOTALL)

        for match in matches:
            route_path = match.group(1)
            route_options = match.group(2)

            # Extract HTTP methods
            methods_match = (
                re.search(r"methods=\[(.*?)\]", route_options)
                if route_options
                else None
            )
            methods = (
                [m.strip(" '\"") for m in methods_match.group(1).split(",")]
                if methods_match
                else ["GET"]
            )

            routes.append(
                {"path": route_path, "methods": methods, "file": str(file_path)}
            )

    return routes


def parse_react_routes(frontend_dir: Path) -> List[Dict[str, Any]]:
    """Parse React routes from the frontend."""
    routes = []

    for file_path in frontend_dir.rglob("*.jsx"):
        component_info = parse_component_file(file_path)
        if component_info and component_info["routes"]:
            routes.extend(
                [
                    {
                        "path": route,
                        "component": component_info["name"],
                        "file": component_info["file_path"],
                    }
                    for route in component_info["routes"]
                ]
            )

    return routes


def generate_route_documentation(
    backend_dir: Path, frontend_dir: Path
) -> Dict[str, Any]:
    """Generate comprehensive route documentation."""
    return {
        "backend_routes": parse_flask_routes(backend_dir / "app"),
        "frontend_routes": parse_react_routes(frontend_dir / "src"),
    }


if __name__ == "__main__":
    # Test the parsers
    test_route_content = """
from flask import Blueprint

bp = Blueprint('test', __name__, url_prefix='/api')

@bp.route('/users', methods=['GET'])
def get_users():
    pass

@bp.post('/users')
def create_user():
    pass
"""

    test_component_content = """
function UserComponent({ name, age }) {
    return <div>{name} ({age})</div>
}

UserComponent.propTypes = {
    name: PropTypes.string.isRequired,
    age: PropTypes.number
}
"""

    print("Route definitions:")
    print(parse_flask_routes(Path("backend/app")))
    print("\nComponent definitions:")
    print(parse_component_file(Path("frontend/src/components/UserComponent.jsx")))
