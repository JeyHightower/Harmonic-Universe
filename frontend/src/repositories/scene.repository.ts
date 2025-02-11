import axios from 'axios';
import { CreateSceneDto, Scene, UpdateSceneDto } from '../models/Scene';
import { BaseRepository } from './base.repository';

export class SceneRepository extends BaseRepository<
  Scene,
  CreateSceneDto,
  UpdateSceneDto
> {
  constructor() {
    super('/api/scenes');
  }

  async findByUniverse(universeId: string): Promise<Scene[]> {
    return this.findBy({ universeId });
  }

  async findByCreator(creatorId: string): Promise<Scene[]> {
    return this.findBy({ creatorId });
  }

  async reorder(universeId: string, sceneIds: string[]): Promise<Scene[]> {
    const response = await axios.post(`${this.baseUrl}/reorder`, {
      universeId,
      sceneIds,
    });
    return response.data;
  }
}
