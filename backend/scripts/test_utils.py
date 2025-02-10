#!/usr/bin/env python3
"""Test script for utility functions."""

import os
import sys
import logging
from pathlib import Path
from datetime import datetime, timedelta
import json

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils import (
    # Security utilities
    generate_token, generate_api_key, create_jwt_token, verify_jwt_token,
    encrypt_data, decrypt_data, generate_encryption_key,

    # Logging utilities
    setup_logger,

    # Validation utilities
    is_valid_email, is_valid_password, validate_date_range,

    # File handling utilities
    get_file_mime_type, ensure_directory, safe_filename,

    # Caching utilities
    Cache,

    # Rate limiting utilities
    RateLimit, RateLimiter,

    # Monitoring utilities
    RequestMetrics, ResourceMetrics, PerformanceMonitor
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

class UtilityTester:
    """Tests utility functions."""

    def __init__(self):
        """Initialize tester."""
        self.test_dir = Path("tests/temp")
        self.test_dir.mkdir(parents=True, exist_ok=True)
        self.results = []

    def run_test(self, name: str, test_func: callable) -> bool:
        """Run a test and record result."""
        try:
            test_func()
            self.results.append({"name": name, "status": "passed"})
            logger.info(f"✅ {name}: Passed")
            return True
        except Exception as e:
            self.results.append({
                "name": name,
                "status": "failed",
                "error": str(e)
            })
            logger.error(f"❌ {name}: Failed - {str(e)}")
            return False

    def test_security(self):
        """Test security utilities."""
        # Test token generation
        token = generate_token()
        assert len(token) == 43  # Base64 encoded 32 bytes

        # Test API key generation
        api_key = generate_api_key()
        assert len(api_key) > 0

        # Test JWT
        data = {"user_id": 1}
        secret = "test-secret"
        token = create_jwt_token(data, secret)
        decoded = verify_jwt_token(token, secret)
        assert decoded["user_id"] == 1

        # Test encryption
        key = generate_encryption_key()
        data = "sensitive data"
        encrypted, _ = encrypt_data(data, key)
        decrypted = decrypt_data(encrypted, key)
        assert decrypted == data

    def test_validation(self):
        """Test validation utilities."""
        assert is_valid_email("test@example.com")
        assert not is_valid_email("invalid-email")

        assert is_valid_password("StrongPass123!")[0]
        assert not is_valid_password("weak")[0]

        now = datetime.utcnow()
        assert validate_date_range(now, now + timedelta(days=1))[0]
        assert not validate_date_range(now, now - timedelta(days=1))[0]

    def test_file_handling(self):
        """Test file handling utilities."""
        test_file = self.test_dir / "test.txt"
        with open(test_file, "w") as f:
            f.write("test content")

        mime_type = get_file_mime_type(str(test_file))
        assert mime_type == "text/plain"

        ensure_directory(str(self.test_dir / "subdir"))
        assert (self.test_dir / "subdir").exists()

        safe_name = safe_filename("test file!.txt")
        assert all(c in string.ascii_letters + string.digits + "._- " for c in safe_name)

    def test_caching(self):
        """Test caching utilities."""
        cache = Cache()
        cache.set("test_key", "test_value", 60)
        assert cache.get("test_key") == "test_value"
        cache.delete("test_key")
        assert cache.get("test_key") is None

    def test_rate_limiting(self):
        """Test rate limiting utilities."""
        limiter = RateLimiter()
        limit = RateLimit(requests=2, period=1)

        # First request should be allowed
        allowed, _ = limiter.is_allowed("test_key", limit)
        assert allowed

        # Second request should be allowed
        allowed, _ = limiter.is_allowed("test_key", limit)
        assert allowed

        # Third request should be blocked
        allowed, _ = limiter.is_allowed("test_key", limit)
        assert not allowed

    def test_monitoring(self):
        """Test monitoring utilities."""
        monitor = PerformanceMonitor()

        # Test request metrics
        metrics = monitor.start_request_tracking("/test", "GET")
        monitor.end_request_tracking(metrics, 200)
        assert metrics.duration is not None

        # Test system metrics
        sys_metrics = monitor.get_system_metrics()
        assert sys_metrics.cpu_percent >= 0
        assert sys_metrics.memory_percent >= 0

    def run_all_tests(self) -> bool:
        """Run all tests."""
        tests = [
            ("Security Utilities", self.test_security),
            ("Validation Utilities", self.test_validation),
            ("File Handling Utilities", self.test_file_handling),
            ("Caching Utilities", self.test_caching),
            ("Rate Limiting Utilities", self.test_rate_limiting),
            ("Monitoring Utilities", self.test_monitoring)
        ]

        all_passed = True
        for name, test_func in tests:
            if not self.run_test(name, test_func):
                all_passed = False

        # Save test results
        results_file = self.test_dir / f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(results_file, "w") as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "results": self.results,
                "all_passed": all_passed
            }, f, indent=2)

        return all_passed

    def cleanup(self):
        """Clean up test artifacts."""
        if self.test_dir.exists():
            for file in self.test_dir.glob("*"):
                try:
                    if file.is_file():
                        file.unlink()
                    elif file.is_dir():
                        shutil.rmtree(file)
                except Exception as e:
                    logger.warning(f"Failed to clean up {file}: {str(e)}")

def main():
    """Main entry point."""
    tester = UtilityTester()
    try:
        success = tester.run_all_tests()
        sys.exit(0 if success else 1)
    finally:
        tester.cleanup()

if __name__ == "__main__":
    main()
