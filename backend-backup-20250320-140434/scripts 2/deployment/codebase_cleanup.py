#!/usr/bin/env python3
import os
import sys
import shutil
import hashlib
from pathlib import Path
import subprocess
import json
from typing import Dict, List, Set, Tuple
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CodebaseCleanup:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.file_hashes: Dict[str, List[Path]] = {}
        self.implemented_features: List[Dict] = []

    def calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA-256 hash of file contents."""
        hasher = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                hasher.update(chunk)
        return hasher.hexdigest()

    def traverse_breadth_first(self) -> None:
        """Perform breadth-first traversal of the codebase."""
        logger.info("Starting breadth-first traversal...")

        queue = [self.root_dir]
        while queue:
            current_dir = queue.pop(0)
            logger.info(f"Traversing directory: {current_dir}")

            try:
                for item in current_dir.iterdir():
                    if item.is_dir() and not item.name.startswith('.'):
                        queue.append(item)
                    elif item.is_file():
                        file_hash = self.calculate_file_hash(item)
                        if file_hash not in self.file_hashes:
                            self.file_hashes[file_hash] = []
                        self.file_hashes[file_hash].append(item)
            except PermissionError:
                logger.warning(f"Permission denied: {current_dir}")
                continue

    def combine_duplicate_files(self) -> None:
        """Combine duplicate files based on content."""
        logger.info("Combining duplicate files...")

        for file_hash, file_paths in self.file_hashes.items():
            if len(file_paths) > 1:
                logger.info(f"Found duplicates: {file_paths}")
                # Keep the file in the most logical location
                primary_file = self.choose_primary_file(file_paths)
                for duplicate in file_paths:
                    if duplicate != primary_file:
                        self.handle_duplicate_file(primary_file, duplicate)

    def choose_primary_file(self, file_paths: List[Path]) -> Path:
        """Choose which file to keep as primary."""
        # Prioritize files in standard locations
        priority_dirs = ['src', 'app', 'tests', 'scripts']
        for priority_dir in priority_dirs:
            for file_path in file_paths:
                if priority_dir in str(file_path):
                    return file_path
        return file_paths[0]

    def handle_duplicate_file(self, primary: Path, duplicate: Path) -> None:
        """Handle a duplicate file by updating references and removing it."""
        logger.info(f"Handling duplicate: {duplicate} -> {primary}")
        try:
            # Update any references to the duplicate file
            self.update_file_references(duplicate, primary)
            # Remove the duplicate file
            duplicate.unlink()
            logger.info(f"Removed duplicate file: {duplicate}")
        except Exception as e:
            logger.error(f"Error handling duplicate {duplicate}: {str(e)}")

    def update_file_references(self, old_path: Path, new_path: Path) -> None:
        """Update references to the old file path in the codebase."""
        old_rel_path = old_path.relative_to(self.root_dir)
        new_rel_path = new_path.relative_to(self.root_dir)

        for root, _, files in os.walk(self.root_dir):
            for file in files:
                if file.endswith(('.py', '.js', '.jsx', '.ts', '.tsx', '.json', '.md')):
                    file_path = Path(root) / file
                    try:
                        with open(file_path, 'r') as f:
                            content = f.read()

                        # Update references
                        updated_content = content.replace(str(old_rel_path), str(new_rel_path))
                        if updated_content != content:
                            with open(file_path, 'w') as f:
                                f.write(updated_content)
                            logger.info(f"Updated references in {file_path}")
                    except Exception as e:
                        logger.error(f"Error updating references in {file_path}: {str(e)}")

    def audit_features(self) -> None:
        """Audit implemented features in the codebase."""
        logger.info("Auditing implemented features...")

        # Check backend routes
        backend_routes = self.find_implemented_routes()

        # Check frontend components
        frontend_components = self.find_implemented_components()

        # Combine and save results
        self.implemented_features = {
            'backend_routes': backend_routes,
            'frontend_components': frontend_components
        }

        with open(self.root_dir / 'IMPLEMENTATION_STATUS.md', 'w') as f:
            json.dump(self.implemented_features, f, indent=2)

    def find_implemented_routes(self) -> List[Dict]:
        """Find implemented backend routes."""
        routes = []
        backend_dir = self.root_dir / 'backend' / 'app' / 'routes'

        if backend_dir.exists():
            for route_file in backend_dir.glob('*.py'):
                try:
                    with open(route_file, 'r') as f:
                        content = f.read()
                    # Parse route definitions
                    routes.extend(self.parse_route_definitions(content))
                except Exception as e:
                    logger.error(f"Error parsing routes in {route_file}: {str(e)}")

        return routes

    def find_implemented_components(self) -> List[Dict]:
        """Find implemented frontend components."""
        components = []
        frontend_dir = self.root_dir / 'frontend' / 'src' / 'components'

        if frontend_dir.exists():
            for component_file in frontend_dir.glob('**/*.{jsx,tsx}'):
                try:
                    with open(component_file, 'r') as f:
                        content = f.read()
                    # Parse component definitions
                    components.extend(self.parse_component_definitions(content))
                except Exception as e:
                    logger.error(f"Error parsing component in {component_file}: {str(e)}")

        return components

    def parse_route_definitions(self, content: str) -> List[Dict]:
        """Parse route definitions from file content."""
        # Implementation depends on your route definition format
        # This is a placeholder
        return []

    def parse_component_definitions(self, content: str) -> List[Dict]:
        """Parse component definitions from file content."""
        # Implementation depends on your component definition format
        # This is a placeholder
        return []

    def combine_test_files(self) -> None:
        """Combine test files by functionality."""
        logger.info("Combining test files...")

        # Create new test directories
        new_test_dir = self.root_dir / 'tests'
        new_test_dir.mkdir(exist_ok=True)

        # Combine backend tests
        self.combine_backend_tests(new_test_dir)

        # Combine frontend tests
        self.combine_frontend_tests(new_test_dir)

        # Update test configuration
        self.update_test_config()

    def combine_backend_tests(self, new_test_dir: Path) -> None:
        """Combine backend test files."""
        backend_test_dir = self.root_dir / 'backend' / 'tests'
        if backend_test_dir.exists():
            # Group tests by functionality
            test_groups = self.group_tests_by_functionality(backend_test_dir)

            # Create combined test files
            for group, tests in test_groups.items():
                self.create_combined_test_file(new_test_dir / f"test_{group}.py", tests)

    def combine_frontend_tests(self, new_test_dir: Path) -> None:
        """Combine frontend test files."""
        frontend_test_dir = self.root_dir / 'frontend' / 'tests'
        if frontend_test_dir.exists():
            # Group tests by functionality
            test_groups = self.group_tests_by_functionality(frontend_test_dir)

            # Create combined test files
            for group, tests in test_groups.items():
                self.create_combined_test_file(new_test_dir / f"test_{group}.spec.js", tests)

    def group_tests_by_functionality(self, test_dir: Path) -> Dict[str, List[Path]]:
        """Group test files by functionality."""
        groups: Dict[str, List[Path]] = {}

        for test_file in test_dir.glob('**/*test*.{py,js,jsx,ts,tsx}'):
            # Determine functionality group based on file name/content
            group = self.determine_test_group(test_file)
            if group not in groups:
                groups[group] = []
            groups[group].append(test_file)

        return groups

    def determine_test_group(self, test_file: Path) -> str:
        """Determine which functionality group a test file belongs to."""
        # Implementation depends on your test file naming/organization
        # This is a placeholder
        return "misc"

    def create_combined_test_file(self, output_file: Path, input_files: List[Path]) -> None:
        """Create a combined test file from multiple input files."""
        with open(output_file, 'w') as out_f:
            for input_file in input_files:
                try:
                    with open(input_file, 'r') as in_f:
                        content = in_f.read()
                    out_f.write(f"\n# From {input_file.name}\n")
                    out_f.write(content)
                    out_f.write("\n")
                except Exception as e:
                    logger.error(f"Error combining test file {input_file}: {str(e)}")

    def update_test_config(self) -> None:
        """Update test configuration files for the new test structure."""
        # Update pytest.ini
        pytest_config = self.root_dir / 'pytest.ini'
        if pytest_config.exists():
            with open(pytest_config, 'w') as f:
                f.write("[pytest]\n")
                f.write("testpaths = tests\n")
                f.write("python_files = test_*.py\n")

        # Update package.json for frontend tests
        package_json = self.root_dir / 'package.json'
        if package_json.exists():
            try:
                with open(package_json, 'r') as f:
                    config = json.load(f)
                config['scripts']['test'] = 'jest tests'
                with open(package_json, 'w') as f:
                    json.dump(config, f, indent=2)
            except Exception as e:
                logger.error(f"Error updating package.json: {str(e)}")

    def update_schema_and_docs(self) -> None:
        """Update schema, models, and documentation."""
        logger.info("Updating schema, models, and documentation...")

        # Update database schema
        self.update_database_schema()

        # Update API documentation
        self.update_api_docs()

        # Run migrations
        self.run_migrations()

        # Run seeders
        self.run_seeders()

    def update_database_schema(self) -> None:
        """Update database schema based on current models."""
        try:
            subprocess.run(['flask', 'db', 'migrate'], check=True)
            logger.info("Database schema updated successfully")
        except subprocess.CalledProcessError as e:
            logger.error(f"Error updating database schema: {str(e)}")

    def update_api_docs(self) -> None:
        """Update API documentation."""
        # Implementation depends on your documentation tool
        pass

    def run_migrations(self) -> None:
        """Run database migrations."""
        try:
            subprocess.run(['flask', 'db', 'upgrade'], check=True)
            logger.info("Database migrations completed successfully")
        except subprocess.CalledProcessError as e:
            logger.error(f"Error running migrations: {str(e)}")

    def run_seeders(self) -> None:
        """Run database seeders."""
        try:
            subprocess.run(['python', 'scripts/seed.py'], check=True)
            logger.info("Database seeding completed successfully")
        except subprocess.CalledProcessError as e:
            logger.error(f"Error running seeders: {str(e)}")

    def consolidate_scripts(self) -> None:
        """Consolidate scripts into root directory."""
        logger.info("Consolidating scripts...")

        # Create scripts directory in root if it doesn't exist
        scripts_dir = self.root_dir / 'scripts'
        scripts_dir.mkdir(exist_ok=True)

        # Move and combine scripts from different directories
        script_locations = [
            self.root_dir / 'backend' / 'scripts',
            self.root_dir / 'frontend' / 'scripts'
        ]

        for script_location in script_locations:
            if script_location.exists():
                for script_file in script_location.glob('**/*'):
                    if script_file.is_file():
                        # Determine new script name and location
                        new_name = self.get_unique_script_name(scripts_dir, script_file)
                        new_path = scripts_dir / new_name

                        # Update script content with new paths
                        self.update_script_paths(script_file, new_path)

                        # Move script to new location
                        shutil.move(str(script_file), str(new_path))
                        logger.info(f"Moved script: {script_file} -> {new_path}")

    def get_unique_script_name(self, target_dir: Path, script_file: Path) -> str:
        """Get a unique name for the script in the target directory."""
        base_name = script_file.name
        counter = 1
        new_name = base_name

        while (target_dir / new_name).exists():
            name_parts = base_name.rsplit('.', 1)
            new_name = f"{name_parts[0]}_{counter}.{name_parts[1]}"
            counter += 1

        return new_name

    def update_script_paths(self, script_file: Path, new_path: Path) -> None:
        """Update paths within the script to reflect new location."""
        try:
            with open(script_file, 'r') as f:
                content = f.read()

            # Update relative imports and paths
            updated_content = self.update_relative_paths(content, script_file, new_path)

            with open(script_file, 'w') as f:
                f.write(updated_content)
        except Exception as e:
            logger.error(f"Error updating paths in {script_file}: {str(e)}")

    def update_relative_paths(self, content: str, old_path: Path, new_path: Path) -> str:
        """Update relative paths in script content."""
        # Implementation depends on your import and path patterns
        # This is a placeholder
        return content

    def run(self) -> None:
        """Run all cleanup tasks."""
        try:
            # 1. Traverse and analyze codebase
            self.traverse_breadth_first()

            # 2. Combine duplicate files
            self.combine_duplicate_files()

            # 3. Audit features
            self.audit_features()

            # 4. Combine test files
            self.combine_test_files()

            # 5. Update schema and docs
            self.update_schema_and_docs()

            # 6. Consolidate scripts
            self.consolidate_scripts()

            logger.info("Codebase cleanup completed successfully!")
        except Exception as e:
            logger.error(f"Error during codebase cleanup: {str(e)}")
            raise

def main():
    """Main entry point."""
    if len(sys.argv) != 2:
        print("Usage: python codebase_cleanup.py <root_directory>")
        sys.exit(1)

    root_dir = sys.argv[1]
    if not os.path.isdir(root_dir):
        print(f"Error: {root_dir} is not a directory")
        sys.exit(1)

    cleanup = CodebaseCleanup(root_dir)
    cleanup.run()

if __name__ == '__main__':
    main()
