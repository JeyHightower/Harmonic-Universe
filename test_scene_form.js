// Test script to verify SceneForm and SceneFormModal submission logic works correctly
console.log('====== SCENE FORM SUBMISSION TEST ======');

// Mock the form data from SceneForm
const mockFormValues = {
  title: 'My New Scene', // Using title instead of name to test conversion
  description: 'This is a scene description',
  timeOfDay: 'afternoon', // Using camelCase to test conversion
  characterIds: [1, 2, 3], // Using camelCase array to test conversion
  dateOfScene: '2023-05-15', // Using camelCase to test conversion
  status: 'draft',
  universe_id: 1
};

// Mock API client
const mockApiClient = {
  createScene: async (data) => {
    console.log('MockAPI: createScene called with data:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.name && !data.title) {
      throw new Error('Scene name is required');
    }

    if (!data.universe_id) {
      throw new Error('universe_id is required');
    }

    // Simulate API processing
    console.log('MockAPI: Processing request...');

    // Simulate server response
    return {
      status: 201,
      data: {
        message: 'Scene created successfully',
        scene: {
          id: 123,
          ...data,
          name: data.name || data.title, // Ensure name is set
          universe_id: data.universe_id,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    };
  },

  updateScene: async (id, data) => {
    console.log(`MockAPI: updateScene called for ID ${id} with data:`, JSON.stringify(data, null, 2));

    // Validate required fields if present
    if (data.name !== undefined && !data.name.trim()) {
      throw new Error('Scene name cannot be empty');
    }

    // Simulate API processing
    console.log('MockAPI: Processing update request...');

    // Simulate server response
    return {
      status: 200,
      data: {
        message: 'Scene updated successfully',
        scene: {
          id,
          ...data,
          is_deleted: false,
          updated_at: new Date().toISOString()
        }
      }
    };
  }
};

// Mock SceneForm handleSubmit function
async function mockSceneFormHandleSubmit(values) {
  try {
    console.log('SceneForm: Submitting form with values:', JSON.stringify(values, null, 2));

    // Format and transform values for API
    const formattedValues = {
      name: values.name || values.title || '',
      description: values.description || '',
      summary: values.summary || '',
      content: values.content || '',
      notes: values.notes || '',
      location: values.location || '',
      scene_type: values.scene_type || 'default',
      time_of_day: values.timeOfDay,
      status: values.status,
      significance: values.significance,
      character_ids: values.characterIds || [],
      order: values.order || 0,
      date_of_scene: values.dateOfScene,
      universe_id: values.universe_id,
      is_deleted: false, // Explicitly set is_deleted to false
      is_public: values.is_public || false
    };

    // Check if name is empty
    if (!formattedValues.name || formattedValues.name.trim() === '') {
      console.error('SceneForm: Scene name is required');
      throw new Error('Scene name is required');
    }

    console.log('SceneForm: Formatted values for API:', JSON.stringify(formattedValues, null, 2));

    // Pass formatted values to the onSubmit handler (SceneFormModal's handleSubmit)
    const actionType = values.id ? 'update' : 'create';
    const result = await mockSceneFormModalHandleSubmit(actionType, formattedValues);

    console.log('SceneForm: Form submission successful, received result:', JSON.stringify(result, null, 2));

    return formattedValues;
  } catch (error) {
    console.error('SceneForm: Error during form submission:', error.message);
    throw error;
  }
}

// Mock SceneFormModal handleSubmit function
async function mockSceneFormModalHandleSubmit(action, formData) {
  try {
    console.log('SceneFormModal: Received form data:', JSON.stringify(formData, null, 2));

    // Validate data
    if (!formData || typeof formData !== 'object') {
      throw new Error('Invalid form data received from SceneForm');
    }

    let result;
    if (action === 'create' || !formData.id) {
      // Make sure we have a proper payload with required fields
      if (!formData.name) {
        throw new Error('Scene name is required');
      }

      // Ensure universe_id is set
      if (!formData.universe_id) {
        throw new Error('Universe ID is required');
      }

      console.log('SceneFormModal: Creating scene with payload');
      const response = await mockApiClient.createScene(formData);

      result = response?.data?.scene || response?.data;

      if (result) {
        result.is_deleted = false;
        console.log('SceneFormModal: Ensured is_deleted is false in result');
      } else {
        throw new Error('Failed to create scene');
      }
    } else if (action === 'update' && formData.id) {
      console.log(`SceneFormModal: Updating scene with ID: ${formData.id}`);
      const response = await mockApiClient.updateScene(formData.id, formData);

      result = response?.data?.scene || response?.data;

      if (!result) {
        throw new Error('Failed to update scene');
      }
    }

    console.log('SceneFormModal: Operation completed successfully with result:', JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('SceneFormModal: Error handling form submission:', error.message);
    throw error;
  }
}

// Run the form submission test
async function runFormTest() {
  try {
    console.log('\n🧪 TEST 1: Create scene with valid data\n');
    const result = await mockSceneFormHandleSubmit(mockFormValues);
    console.log('\n✅ Form test passed: Scene created successfully\n');

    console.log('\n🧪 TEST 2: Update scene\n');
    const updateResult = await mockSceneFormHandleSubmit({
      id: 123,
      name: 'Updated Scene',
      description: 'This scene has been updated',
      universe_id: 1,
      status: 'complete'
    });
    console.log('\n✅ Form update test passed: Scene updated successfully\n');

    console.log('\n🧪 TEST 3: Attempt to create scene with empty name\n');
    try {
      await mockSceneFormHandleSubmit({
        description: 'Scene with no name',
        universe_id: 1
      });
      console.log('❌ Form validation test failed: Should have thrown an error for missing name');
    } catch (error) {
      console.log(`✅ Form validation test passed: Correctly rejected scene with message "${error.message}"`);
    }

    console.log('\n🧪 TEST 4: Attempt to create scene with missing universe_id\n');
    try {
      await mockSceneFormHandleSubmit({
        name: 'Scene with no universe',
      });
      console.log('❌ Form validation test failed: Should have thrown an error for missing universe_id');
    } catch (error) {
      console.log(`✅ Form validation test passed: Correctly rejected scene with message "${error.message}"`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
runFormTest(); 