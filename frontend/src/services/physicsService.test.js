import api from './api';
import physicsService from './physicsService';

jest.mock('./api');

describe('physicsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPhysicsObject', () => {
    const mockData = {
      name: 'Test Object',
      object_type: 'circle',
      scene_id: 1
    };

    it('should create a physics object successfully', async () => {
      const mockResponse = { data: { id: 1, ...mockData } };
      api.post.mockResolvedValue(mockResponse);

      const result = await physicsService.createPhysicsObject(mockData);

      expect(api.post).toHaveBeenCalledWith('/api/physics/objects', mockData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when creating a physics object', async () => {
      const mockError = { response: { data: 'Creation failed' } };
      api.post.mockRejectedValue(mockError);

      await expect(physicsService.createPhysicsObject(mockData))
        .rejects.toEqual('Creation failed');
    });
  });

  describe('getPhysicsObject', () => {
    const objectId = 1;

    it('should get a physics object successfully', async () => {
      const mockResponse = { data: { id: objectId, name: 'Test Object' } };
      api.get.mockResolvedValue(mockResponse);

      const result = await physicsService.getPhysicsObject(objectId);

      expect(api.get).toHaveBeenCalledWith(`/api/physics/objects/${objectId}`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when getting a physics object', async () => {
      const mockError = { response: { data: 'Not found' } };
      api.get.mockRejectedValue(mockError);

      await expect(physicsService.getPhysicsObject(objectId))
        .rejects.toEqual('Not found');
    });
  });

  describe('updatePhysicsObject', () => {
    const objectId = 1;
    const mockData = {
      name: 'Updated Object',
      position: { x: 100, y: 100 }
    };

    it('should update a physics object successfully', async () => {
      const mockResponse = { data: { id: objectId, ...mockData } };
      api.put.mockResolvedValue(mockResponse);

      const result = await physicsService.updatePhysicsObject(objectId, mockData);

      expect(api.put).toHaveBeenCalledWith(`/api/physics/objects/${objectId}`, mockData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when updating a physics object', async () => {
      const mockError = { response: { data: 'Update failed' } };
      api.put.mockRejectedValue(mockError);

      await expect(physicsService.updatePhysicsObject(objectId, mockData))
        .rejects.toEqual('Update failed');
    });
  });

  describe('deletePhysicsObject', () => {
    const objectId = 1;

    it('should delete a physics object successfully', async () => {
      api.delete.mockResolvedValue({});

      await physicsService.deletePhysicsObject(objectId);

      expect(api.delete).toHaveBeenCalledWith(`/api/physics/objects/${objectId}`);
    });

    it('should handle errors when deleting a physics object', async () => {
      const mockError = { response: { data: 'Delete failed' } };
      api.delete.mockRejectedValue(mockError);

      await expect(physicsService.deletePhysicsObject(objectId))
        .rejects.toEqual('Delete failed');
    });
  });

  describe('createPhysicsConstraint', () => {
    const mockData = {
      object_a_id: 1,
      object_b_id: 2,
      constraint_type: 'distance'
    };

    it('should create a physics constraint successfully', async () => {
      const mockResponse = { data: { id: 1, ...mockData } };
      api.post.mockResolvedValue(mockResponse);

      const result = await physicsService.createPhysicsConstraint(mockData);

      expect(api.post).toHaveBeenCalledWith('/api/physics/constraints', mockData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when creating a physics constraint', async () => {
      const mockError = { response: { data: 'Creation failed' } };
      api.post.mockRejectedValue(mockError);

      await expect(physicsService.createPhysicsConstraint(mockData))
        .rejects.toEqual('Creation failed');
    });
  });

  describe('getPhysicsConstraint', () => {
    const constraintId = 1;

    it('should get a physics constraint successfully', async () => {
      const mockResponse = { data: { id: constraintId, type: 'distance' } };
      api.get.mockResolvedValue(mockResponse);

      const result = await physicsService.getPhysicsConstraint(constraintId);

      expect(api.get).toHaveBeenCalledWith(`/api/physics/constraints/${constraintId}`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when getting a physics constraint', async () => {
      const mockError = { response: { data: 'Not found' } };
      api.get.mockRejectedValue(mockError);

      await expect(physicsService.getPhysicsConstraint(constraintId))
        .rejects.toEqual('Not found');
    });
  });

  describe('updatePhysicsConstraint', () => {
    const constraintId = 1;
    const mockData = {
      stiffness: 2.0,
      damping: 0.5
    };

    it('should update a physics constraint successfully', async () => {
      const mockResponse = { data: { id: constraintId, ...mockData } };
      api.put.mockResolvedValue(mockResponse);

      const result = await physicsService.updatePhysicsConstraint(constraintId, mockData);

      expect(api.put).toHaveBeenCalledWith(`/api/physics/constraints/${constraintId}`, mockData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when updating a physics constraint', async () => {
      const mockError = { response: { data: 'Update failed' } };
      api.put.mockRejectedValue(mockError);

      await expect(physicsService.updatePhysicsConstraint(constraintId, mockData))
        .rejects.toEqual('Update failed');
    });
  });

  describe('deletePhysicsConstraint', () => {
    const constraintId = 1;

    it('should delete a physics constraint successfully', async () => {
      api.delete.mockResolvedValue({});

      await physicsService.deletePhysicsConstraint(constraintId);

      expect(api.delete).toHaveBeenCalledWith(`/api/physics/constraints/${constraintId}`);
    });

    it('should handle errors when deleting a physics constraint', async () => {
      const mockError = { response: { data: 'Delete failed' } };
      api.delete.mockRejectedValue(mockError);

      await expect(physicsService.deletePhysicsConstraint(constraintId))
        .rejects.toEqual('Delete failed');
    });
  });

  describe('simulateScene', () => {
    const sceneId = 1;

    it('should simulate a scene successfully', async () => {
      const mockResponse = {
        data: [
          { id: 1, position: { x: 100, y: 100 } },
          { id: 2, position: { x: 200, y: 200 } }
        ]
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await physicsService.simulateScene(sceneId);

      expect(api.post).toHaveBeenCalledWith(`/api/physics/scenes/${sceneId}/simulate`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when simulating a scene', async () => {
      const mockError = { response: { data: 'Simulation failed' } };
      api.post.mockRejectedValue(mockError);

      await expect(physicsService.simulateScene(sceneId))
        .rejects.toEqual('Simulation failed');
    });
  });
});
