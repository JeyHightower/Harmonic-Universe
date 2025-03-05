"""
Script to copy React polyfill to Flask static directory
"""
import os
import shutil
from pathlib import Path

def copy_polyfill():
    """Copy React polyfill to Flask static directory"""
    print("Copying React polyfill to Flask static directory...")

    # Get the base directory
    base_dir = Path(__file__).parent.parent

    # Source paths
    frontend_public_dir = base_dir.parent / 'frontend' / 'public'
    polyfill_path = frontend_public_dir / 'react-polyfill.js'
    context_provider_path = frontend_public_dir / 'react-context-provider.js'

    # Target directory
    static_dir = base_dir / 'app' / 'static'
    os.makedirs(static_dir, exist_ok=True)

    # Copy files
    if polyfill_path.exists():
        shutil.copy(polyfill_path, static_dir / 'react-polyfill.js')
        print(f"✅ Copied {polyfill_path} to {static_dir}")
    else:
        print(f"❌ Could not find {polyfill_path}")

    if context_provider_path.exists():
        shutil.copy(context_provider_path, static_dir / 'react-context-provider.js')
        print(f"✅ Copied {context_provider_path} to {static_dir}")
    else:
        print(f"ℹ️ Could not find {context_provider_path} (not critical)")

    print("Done copying React polyfill files.")

if __name__ == "__main__":
    copy_polyfill()
