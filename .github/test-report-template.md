# Test Report

## Summary

- **Date**: {{ date }}
- **Commit**: {{ commit }}
- **Branch**: {{ branch }}

## Coverage

### Backend

- Lines: {{ backend.coverage.lines }}%
- Functions: {{ backend.coverage.functions }}%
- Branches: {{ backend.coverage.branches }}%
- Statements: {{ backend.coverage.statements }}%

### Frontend

- Lines: {{ frontend.coverage.lines }}%
- Functions: {{ frontend.coverage.functions }}%
- Branches: {{ frontend.coverage.branches }}%
- Statements: {{ frontend.coverage.statements }}%

## Test Results

### Backend Tests

- Total: {{ backend.tests.total }}
- Passed: {{ backend.tests.passed }}
- Failed: {{ backend.tests.failed }}
- Skipped: {{ backend.tests.skipped }}
- Duration: {{ backend.tests.duration }}s

### Frontend Unit Tests

- Total: {{ frontend.unit.total }}
- Passed: {{ frontend.unit.passed }}
- Failed: {{ frontend.unit.failed }}
- Skipped: {{ frontend.unit.skipped }}
- Duration: {{ frontend.unit.duration }}s

### End-to-End Tests

- Total: {{ e2e.total }}
- Passed: {{ e2e.passed }}
- Failed: {{ e2e.failed }}
- Skipped: {{ e2e.skipped }}
- Duration: {{ e2e.duration }}s

## Performance Metrics

### Backend

- Average Response Time: {{ backend.performance.avg_response_time }}ms
- Peak Memory Usage: {{ backend.performance.peak_memory }}MB
- Database Query Time: {{ backend.performance.db_query_time }}ms

### Frontend

- Initial Load Time: {{ frontend.performance.initial_load }}s
- Time to Interactive: {{ frontend.performance.time_to_interactive }}s
- Memory Usage: {{ frontend.performance.memory_usage }}MB

## Security Scan Results

- Vulnerabilities Found: {{ security.vulnerabilities }}
- Critical: {{ security.critical }}
- High: {{ security.high }}
- Medium: {{ security.medium }}
- Low: {{ security.low }}

## Failed Tests

{% if failed_tests %}
{% for test in failed_tests %}

### {{ test.name }}

- File: {{ test.file }}
- Error: {{ test.error }}
- Stack Trace: {{ test.stack_trace }}
  {% endfor %}
  {% else %}
  No failed tests! 🎉
  {% endif %}

## Skipped Tests

{% if skipped_tests %}
{% for test in skipped_tests %}

- {{ test.name }}: {{ test.reason }}
  {% endfor %}
  {% else %}
  No skipped tests.
  {% endif %}

## Notes

{% if notes %}
{{ notes }}
{% else %}
No additional notes.
{% endif %}

## Next Steps

{% if next_steps %}
{{ next_steps }}
{% else %}
No action items identified.
{% endif %}
