import pytest
from reports.analysis import analyze_data  # adjust import based on your actual module structure

def test_analyze_data():
    # Basic test case
    test_data = {
        "data": [
            {"value": 1},
            {"value": 2},
            {"value": 3}
        ]
    }
    result = analyze_data(test_data)
    assert isinstance(result, dict)
    assert "analysis" in result
