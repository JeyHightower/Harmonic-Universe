#!/usr/bin/env python3
from backend.utils.test_suite import TestSuite

def main():
    """
    Legacy wrapper for the TestSuite functionality.
    Maintained for backward compatibility.
    """
    suite = TestSuite()
    print("Starting test analysis using combined test suite...")

    output, return_code = suite.run_tests()
    suite.analyze_output(output)

    report = suite.generate_report()
    suite.print_report(report)
    suite.save_report(report)

    return return_code

if __name__ == '__main__':
    exit(main())
