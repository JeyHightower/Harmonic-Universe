// Test script for scene CRUD operations using Axios to simulate curl requests
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5001/api';
let token = null;
let testUniverseId = null;
let testSceneId = null;

// Helper function to set up authentication
async function authenticate() {
  try {
    console.log('🔑 Authenticating using demo login...');
    const response = await axios.post(`${API_BASE_URL}/auth/demo-login`);

    token = response.data.token;
    console.log('✅ Authentication successful');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    console.log('⚠️ Continuing tests without authentication (some tests may fail)');
    return false;
  }
}

// Helper function to create a test universe
async function createTestUniverse() {
  try {
    console.log('🌍 Creating test universe...');
    const response = await axios.post(`${API_BASE_URL}/universes`, {
      name: `Test Universe ${Date.now()}`,
      description: 'A universe for testing scene API'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    testUniverseId = response.data.universe.id;
    console.log(`✅ Test universe created with ID: ${testUniverseId}`);
    return testUniverseId;
  } catch (error) {
    console.error('❌ Failed to create test universe:', error.response?.data || error.message);
    return null;
  }
}

// Test creation of a scene
async function testCreateScene() {
  try {
    console.log('\n📝 Creating a new scene');

    const newScene = {
      name: `Test Scene ${Date.now()}`,
      description: 'This is a test scene created via API',
      universe_id: testUniverseId
    };

    const response = await axios.post(`${API_BASE_URL}/scenes`, newScene, {
      headers: { Authorization: `Bearer ${token}` }
    });

    testSceneId = response.data.scene.id;
    console.log('✅ Scene created successfully:', response.data.scene);
    return response.data.scene;
  } catch (error) {
    console.error('❌ Scene creation failed:', error.response?.data || error.message);
    return null;
  }
}

// Test getting a single scene
async function testGetScene() {
  try {
    console.log(`\n🔍 Getting scene with ID: ${testSceneId}`);

    const response = await axios.get(`${API_BASE_URL}/scenes/${testSceneId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Scene retrieved successfully:', response.data.scene);
    return response.data.scene;
  } catch (error) {
    console.error('❌ Failed to get scene:', error.response?.data || error.message);
    return null;
  }
}

// Test getting all scenes for a universe
async function testGetUniverseScenes() {
  try {
    console.log(`\n📋 Getting all scenes for universe ID: ${testUniverseId}`);

    const response = await axios.get(`${API_BASE_URL}/scenes/universe/${testUniverseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Retrieved ${response.data.scenes.length} scenes`);
    response.data.scenes.forEach(scene => {
      console.log(`- ${scene.name} (ID: ${scene.id})`);
    });

    return response.data.scenes;
  } catch (error) {
    console.error('❌ Failed to get universe scenes:', error.response?.data || error.message);
    return null;
  }
}

// Test updating a scene
async function testUpdateScene() {
  try {
    console.log(`\n🔄 Updating scene with ID: ${testSceneId}`);

    const updatedScene = {
      name: `Updated Scene ${Date.now()}`,
      description: 'This scene was updated via API'
    };

    const response = await axios.put(`${API_BASE_URL}/scenes/${testSceneId}`, updatedScene, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Scene updated successfully:', response.data.scene);
    return response.data.scene;
  } catch (error) {
    console.error('❌ Scene update failed:', error.response?.data || error.message);
    return null;
  }
}

// Test deleting a scene
async function testDeleteScene() {
  try {
    console.log(`\n❌ Deleting scene with ID: ${testSceneId}`);

    const response = await axios.delete(`${API_BASE_URL}/scenes/${testSceneId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Scene deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Scene deletion failed:', error.response?.data || error.message);
    return false;
  }
}

// Print the equivalent curl commands for each operation
function printCurlCommands() {
  console.log('\n====== EQUIVALENT CURL COMMANDS ======');

  console.log(`\n# Authenticate using demo login`);
  console.log(`curl -X POST "${API_BASE_URL}/auth/demo-login"`);

  console.log(`\n# Create a new universe`);
  console.log(`curl -X POST "${API_BASE_URL}/universes" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Test Universe","description":"A universe for testing"}'`);

  console.log(`\n# Create a new scene`);
  console.log(`curl -X POST "${API_BASE_URL}/scenes" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Test Scene","description":"This is a test scene","universe_id":UNIVERSE_ID_HERE}'`);

  console.log(`\n# Get a specific scene`);
  console.log(`curl -X GET "${API_BASE_URL}/scenes/SCENE_ID_HERE" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"`);

  console.log(`\n# Get all scenes for a universe`);
  console.log(`curl -X GET "${API_BASE_URL}/scenes/universe/UNIVERSE_ID_HERE" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"`);

  console.log(`\n# Update a scene`);
  console.log(`curl -X PUT "${API_BASE_URL}/scenes/SCENE_ID_HERE" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Updated Scene","description":"This scene was updated"}'`);

  console.log(`\n# Delete a scene`);
  console.log(`curl -X DELETE "${API_BASE_URL}/scenes/SCENE_ID_HERE" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"`);
}

// Main test function
async function runTests() {
  console.log('====== SCENE API TESTS ======');

  // Authenticate first
  const authenticated = await authenticate();
  if (!authenticated) {
    console.log('⚠️ Skipping tests that require authentication');
    return;
  }

  // Create test universe
  const universeId = await createTestUniverse();
  if (!universeId) {
    console.log('⚠️ Cannot continue tests without a test universe');
    return;
  }

  // Run the scene tests
  const createdScene = await testCreateScene();
  if (!createdScene) {
    console.log('⚠️ Cannot continue tests without a test scene');
    return;
  }

  await testGetScene();
  await testGetUniverseScenes();
  await testUpdateScene();
  await testDeleteScene();

  // Print curl commands for reference
  printCurlCommands();

  console.log('\n✅ All scene API tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('Unexpected error during tests:', error);
}); 