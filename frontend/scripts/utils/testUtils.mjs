/**
 * Test utilities for mocking API calls and other behaviors in test mode
 */

// Mock API responses for test mode
export const mockApiResponse = (data = {}, delay = 500) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                data,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
            });
        }, delay);
    });
};

// Mock API error for test mode
export const mockApiError = (message = 'An error occurred', status = 500, delay = 500) => {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject({
                response: {
                    data: { message },
                    status,
                    statusText: 'Error',
                },
                message,
            });
        }, delay);
    });
};

// Helper to generate a UUID for test mode
export const generateTestId = () => {
    return 'test-' + Math.random().toString(36).substring(2, 15);
};
