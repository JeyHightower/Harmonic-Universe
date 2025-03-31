# Modal System Curl Tests

This directory contains curl tests for testing the modal system functionality. The tests cover various aspects of the modal system including opening different types of modals, updating modal properties, and testing modal transitions.

## Prerequisites

- The application should be running locally on port 5001
- curl should be installed on your system
- The modal system should be properly configured

## Test Structure

The tests are organized in a shell script (`modal_tests.sh`) that contains 15 different test cases:

1. Open Alert Modal
2. Open Confirmation Modal
3. Open Form Modal
4. Open Network Error Modal
5. Update Modal Props
6. Close Modal
7. Get Modal State
8. Invalid Modal Type
9. Modal Transition State
10. Multiple Modal Stack
11. Modal with Custom Animation
12. Modal with Custom Position
13. Modal with Custom Size
14. Modal with Prevent Auto Close
15. Modal with Custom Footer

## Running the Tests

1. Make sure your application is running locally
2. Navigate to the tests directory:
   ```bash
   cd frontend/tests/curl
   ```
3. Run the test script:
   ```bash
   ./modal_tests.sh
   ```

## Test Output

The tests will output results in the following format:

- ✓ Test Name (Green) - Test passed
- ✗ Test Name (Red) - Test failed

## API Endpoints Tested

The tests cover the following endpoints:

- `POST /api/modal/open` - Open a new modal
- `PUT /api/modal/props` - Update modal properties
- `POST /api/modal/close` - Close the current modal
- `GET /api/modal/state` - Get current modal state
- `GET /api/modal/transition` - Get modal transition state

## Expected Response Format

Each API endpoint should return a JSON response with the following structure:

```json
{
  "success": true,
  "data": {
    // Response data specific to each endpoint
  },
  "error": null
}
```

## Error Handling

The tests include error cases such as:

- Invalid modal types
- Missing required properties
- Invalid property values

## Notes

- The tests assume the application is running on `http://localhost:5001`
- If your application is running on a different port or host, update the `BASE_URL` in the test script
- Some tests may require specific modal configurations to be present in your application
- The tests are designed to be run in sequence and may depend on the state from previous tests
