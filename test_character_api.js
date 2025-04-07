// Test script for character CRUD operations
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5001/api';
let token = null;
let testUniverseId = null;
let testSceneId = null;
let testCharacterId = null;

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
      description: 'A universe for testing character API'
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

// Helper function to create a test scene
async function createTestScene() {
  try {
    console.log('🎬 Creating test scene...');
    const response = await axios.post(`${API_BASE_URL}/scenes`, {
      name: `Test Scene ${Date.now()}`,
      description: 'A scene for testing character API',
      universe_id: testUniverseId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    testSceneId = response.data.scene.id;
    console.log(`✅ Test scene created with ID: ${testSceneId}`);
    return testSceneId;
  } catch (error) {
    console.error('❌ Failed to create test scene:', error.response?.data || error.message);
    return null;
  }
}

// Test creation of a character
async function testCreateCharacter() {
  try {
    console.log('\n📝 Creating a new character');

    const newCharacter = {
      name: `Test Character ${Date.now()}`,
      description: 'This is a test character created via API',
      scene_id: testSceneId
    };

    const response = await axios.post(`${API_BASE_URL}/characters`, newCharacter, {
      headers: { Authorization: `Bearer ${token}` }
    });

    testCharacterId = response.data.character.id;
    console.log('✅ Character created successfully:', response.data.character);
    return response.data.character;
  } catch (error) {
    console.error('❌ Character creation failed:', error.response?.data || error.message);
    return null;
  }
}

// Test getting a single character
async function testGetCharacter() {
  try {
    console.log(`\n🔍 Getting character with ID: ${testCharacterId}`);

    const response = await axios.get(`${API_BASE_URL}/characters/${testCharacterId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Character retrieved successfully:', response.data.character);
    return response.data.character;
  } catch (error) {
    console.error('❌ Failed to get character:', error.response?.data || error.message);
    return null;
  }
}

// Test getting all characters for a scene
async function testGetSceneCharacters() {
  try {
    console.log(`\n📋 Getting all characters for scene ID: ${testSceneId}`);

    const response = await axios.get(`${API_BASE_URL}/characters/scene/${testSceneId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Retrieved ${response.data.characters.length} characters`);
    response.data.characters.forEach(character => {
      console.log(`- ${character.name} (ID: ${character.id})`);
    });

    return response.data.characters;
  } catch (error) {
    console.error('❌ Failed to get scene characters:', error.response?.data || error.message);
    return null;
  }
}

// Test updating a character
async function testUpdateCharacter() {
  try {
    console.log(`\n🔄 Updating character with ID: ${testCharacterId}`);

    const updatedCharacter = {
      name: `Updated Character ${Date.now()}`,
      description: 'This character was updated via API'
    };

    const response = await axios.put(`${API_BASE_URL}/characters/${testCharacterId}`, updatedCharacter, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Character updated successfully:', response.data.character);
    return response.data.character;
  } catch (error) {
    console.error('❌ Character update failed:', error.response?.data || error.message);
    return null;
  }
}

// Test deleting a character
async function testDeleteCharacter() {
  try {
    console.log(`\n❌ Deleting character with ID: ${testCharacterId}`);

    const response = await axios.delete(`${API_BASE_URL}/characters/${testCharacterId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Character deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Character deletion failed:', error.response?.data || error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('====== CHARACTER API TESTS ======');

  // Authenticate first
  const authenticated = await authenticate();
  if (!authenticated) {
    console.log('⚠️ Skipping tests that require authentication');
    return;
  }

  // Create test universe and scene
  const universeId = await createTestUniverse();
  if (!universeId) {
    console.log('⚠️ Cannot continue tests without a test universe');
    return;
  }

  const sceneId = await createTestScene();
  if (!sceneId) {
    console.log('⚠️ Cannot continue tests without a test scene');
    return;
  }

  // Run the character tests
  const createdCharacter = await testCreateCharacter();
  if (!createdCharacter) {
    console.log('⚠️ Cannot continue tests without a test character');
    return;
  }

  await testGetCharacter();
  await testGetSceneCharacters();
  await testUpdateCharacter();
  await testDeleteCharacter();

  console.log('\n✅ All character API tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('Unexpected error during tests:', error);
}); 