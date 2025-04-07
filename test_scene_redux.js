// Test script to simulate Redux store operations for scenes
console.log('====== SCENE REDUX OPERATIONS TEST ======');

// Mock Redux store
const mockStore = {
  scenes: {
    scenes: [],
    currentScene: null,
    universeScenes: {},
    locallyCreatedScenes: [],
    loading: false,
    error: null
  }
};

// Mock reducer functions similar to our actual Redux code
function addScene(state, scene) {
  // Check if the scene already exists
  const exists = state.scenes.some(s => s.id === scene.id);
  if (!exists) {
    // Ensure is_deleted is explicitly set to false
    const newScene = { ...scene, is_deleted: false };
    state.scenes.push(newScene);
    console.log(`Added scene ${newScene.id} to scenes array`);
  } else {
    console.log(`Scene ${scene.id} already exists in scenes array`);
  }
  return state;
}

function addLocallyCreatedScene(state, scene) {
  // Add to locallyCreatedScenes if it doesn't exist
  const exists = state.locallyCreatedScenes.some(s => s.id === scene.id);
  if (!exists) {
    // Ensure is_deleted is explicitly set to false
    const newScene = { ...scene, is_deleted: false };
    state.locallyCreatedScenes.push(newScene);
    console.log(`Added scene ${newScene.id} to locallyCreatedScenes array`);

    // Also add to universeScenes if not already there
    if (newScene.universe_id) {
      if (!state.universeScenes[newScene.universe_id]) {
        state.universeScenes[newScene.universe_id] = [];
      }

      const existsInUniverse = state.universeScenes[newScene.universe_id].some(
        s => s.id === newScene.id
      );

      if (!existsInUniverse) {
        state.universeScenes[newScene.universe_id].push(newScene);
        console.log(`Added scene ${newScene.id} to universe ${newScene.universe_id} scenes array`);
      }
    }
  } else {
    console.log(`Scene ${scene.id} already exists in locallyCreatedScenes array`);
  }
  return state;
}

function fetchScenesFulfilled(state, { scenes, universe_id }) {
  console.log(`Fetched ${scenes.length} scenes for universe ${universe_id}`);

  // Update the universe scenes array
  state.universeScenes[universe_id] = scenes.map(scene => ({
    ...scene,
    is_deleted: false // Ensure is_deleted is explicitly false
  }));

  // Update the main scenes array with all unique scenes
  const scenesMap = new Map();

  // First add existing scenes
  state.scenes.forEach(scene => {
    if (scene && scene.id) {
      scenesMap.set(scene.id, scene);
    }
  });

  // Then add/update with universe scenes
  scenes.forEach(scene => {
    if (scene && scene.id) {
      scenesMap.set(scene.id, { ...scene, is_deleted: false });
    }
  });

  state.scenes = Array.from(scenesMap.values());
  console.log(`Updated scenes array, now contains ${state.scenes.length} scenes`);

  return state;
}

function updateScene(state, scene) {
  const index = state.scenes.findIndex(s => s.id === scene.id);
  if (index !== -1) {
    // Ensure is_deleted is explicitly false
    const updatedScene = { ...scene, is_deleted: false };
    state.scenes[index] = updatedScene;
    console.log(`Updated scene ${scene.id} in scenes array`);

    // Update in universeScenes
    if (updatedScene.universe_id && state.universeScenes[updatedScene.universe_id]) {
      const universeIndex = state.universeScenes[updatedScene.universe_id].findIndex(
        s => s.id === updatedScene.id
      );
      if (universeIndex !== -1) {
        state.universeScenes[updatedScene.universe_id][universeIndex] = updatedScene;
        console.log(`Updated scene ${scene.id} in universe ${updatedScene.universe_id} scenes array`);
      }
    }

    // Update in locallyCreatedScenes
    const localIndex = state.locallyCreatedScenes.findIndex(s => s.id === scene.id);
    if (localIndex !== -1) {
      state.locallyCreatedScenes[localIndex] = updatedScene;
      console.log(`Updated scene ${scene.id} in locallyCreatedScenes array`);
    }

    // Update currentScene if it's the same one
    if (state.currentScene && state.currentScene.id === scene.id) {
      state.currentScene = updatedScene;
      console.log(`Updated currentScene to scene ${scene.id}`);
    }
  } else {
    console.log(`Scene ${scene.id} not found in scenes array`);
  }
  return state;
}

function deleteScene(state, sceneId) {
  // Get the universe ID of the scene before removing it
  let universeId = null;
  const deletedScene = state.scenes.find(scene => scene.id === sceneId);
  if (deletedScene) {
    universeId = deletedScene.universe_id;
  }

  // Remove from main scenes array
  state.scenes = state.scenes.filter(scene => scene.id !== sceneId);
  console.log(`Removed scene ${sceneId} from scenes array`);

  // Remove from locallyCreatedScenes
  state.locallyCreatedScenes = state.locallyCreatedScenes.filter(
    scene => scene.id !== sceneId
  );
  console.log(`Removed scene ${sceneId} from locallyCreatedScenes array`);

  // Remove from universeScenes if the universe ID is known
  if (universeId && state.universeScenes[universeId]) {
    state.universeScenes[universeId] = state.universeScenes[universeId].filter(
      scene => scene.id !== sceneId
    );
    console.log(`Removed scene ${sceneId} from universe ${universeId} scenes array`);
  }

  // Clear currentScene if it's the deleted one
  if (state.currentScene && state.currentScene.id === sceneId) {
    state.currentScene = null;
    console.log(`Cleared currentScene (was scene ${sceneId})`);
  }

  return state;
}

// Helper function to normalize scene data
function normalizeSceneData(scene) {
  if (!scene) return null;

  // Create a copy to avoid mutating the original
  const normalized = { ...scene };

  // Convert title to name if needed
  if (normalized.title && !normalized.name) {
    normalized.name = normalized.title;
    delete normalized.title;
  }

  // Convert camelCase to snake_case for API
  if (normalized.timeOfDay && !normalized.time_of_day) {
    normalized.time_of_day = normalized.timeOfDay;
    delete normalized.timeOfDay;
  }

  if (normalized.characterIds && !normalized.character_ids) {
    normalized.character_ids = normalized.characterIds;
    delete normalized.characterIds;
  }

  if (normalized.dateOfScene && !normalized.date_of_scene) {
    normalized.date_of_scene = normalized.dateOfScene;
    delete normalized.dateOfScene;
  }

  // Ensure dates are strings and is_deleted is explicitly set
  normalized.created_at = normalized.created_at ? normalized.created_at.toString() : new Date().toISOString();
  normalized.updated_at = normalized.updated_at ? normalized.updated_at.toString() : new Date().toISOString();
  normalized.is_deleted = normalized.is_deleted === true;

  return normalized;
}

// Run tests
function runReduxTests() {
  console.log('\n📋 Test 1: Initial state');
  console.log('Initial state:', JSON.stringify(mockStore.scenes, null, 2));

  // Create a scene
  console.log('\n📝 Test 2: Create scene');
  const newScene = {
    id: 1,
    name: 'Test Scene',
    description: 'This is a test scene',
    universe_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // First add to main scenes array
  mockStore.scenes = addScene(mockStore.scenes, newScene);

  // Then add to locally created scenes
  mockStore.scenes = addLocallyCreatedScene(mockStore.scenes, newScene);

  console.log('\nStore after scene creation:', JSON.stringify(mockStore.scenes, null, 2));

  // Test with a scene that has title instead of name and other camelCase fields
  console.log('\n🔄 Test 3: Create scene with non-standard field names');
  const nonStandardScene = {
    id: 2,
    title: 'Scene with Title',
    description: 'This scene uses title instead of name',
    universe_id: 1,
    timeOfDay: 'evening',
    characterIds: [1, 2, 3]
  };

  // Normalize the scene data
  const normalizedScene = normalizeSceneData(nonStandardScene);
  console.log('Normalized scene:', normalizedScene);

  // Add normalized scene to store
  mockStore.scenes = addScene(mockStore.scenes, normalizedScene);
  mockStore.scenes = addLocallyCreatedScene(mockStore.scenes, normalizedScene);

  // Fetch scenes for universe
  console.log('\n🔍 Test 4: Fetch scenes for universe');
  const universeScenesFromAPI = [
    {
      id: 1,
      name: 'Test Scene (Updated from API)',
      description: 'This scene was updated from the API',
      universe_id: 1
    },
    {
      id: 3,
      name: 'Another Scene from API',
      description: 'This scene came from the API',
      universe_id: 1
    }
  ];

  mockStore.scenes = fetchScenesFulfilled(mockStore.scenes, {
    scenes: universeScenesFromAPI,
    universe_id: 1
  });

  // Update a scene
  console.log('\n🔄 Test 5: Update scene');
  const updatedScene = {
    id: 1,
    name: 'Updated Test Scene',
    description: 'This scene has been updated locally',
    universe_id: 1,
    scene_type: 'major',
    updated_at: new Date().toISOString()
  };

  mockStore.scenes = updateScene(mockStore.scenes, updatedScene);

  // Delete a scene
  console.log('\n❌ Test 6: Delete scene');
  mockStore.scenes = deleteScene(mockStore.scenes, 2);

  // Check final state
  console.log('\n📊 Final store state:', JSON.stringify(mockStore.scenes, null, 2));

  // Verify scene presence in various collections
  console.log('\n✅ Verification results:');
  console.log(`Total scenes in store: ${mockStore.scenes.scenes.length}`);
  console.log(`Locally created scenes: ${mockStore.scenes.locallyCreatedScenes.length}`);
  console.log(`Universe 1 scenes: ${mockStore.scenes.universeScenes[1]?.length || 0}`);

  const scene1 = mockStore.scenes.scenes.find(s => s.id === 1);
  console.log(`Scene 1 is present in store: ${!!scene1}`);
  if (scene1) {
    console.log(`Scene 1 name: ${scene1.name}`);
    console.log(`Scene 1 is_deleted: ${scene1.is_deleted}`);
  }

  const scene2 = mockStore.scenes.scenes.find(s => s.id === 2);
  console.log(`Scene 2 is present in store: ${!!scene2}`);

  const scene3 = mockStore.scenes.scenes.find(s => s.id === 3);
  console.log(`Scene 3 is present in store: ${!!scene3}`);
  if (scene3) {
    console.log(`Scene 3 name: ${scene3.name}`);
    console.log(`Scene 3 is_deleted: ${scene3.is_deleted}`);
  }
}

// Run the tests
runReduxTests(); 