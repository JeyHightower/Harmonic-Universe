import {
  CreateUniverseDto,
  Universe,
  UpdateUniverseDto,
} from '../models/Universe';
import { BaseRepository } from './base.repository';

export class UniverseRepository extends BaseRepository<
  Universe,
  CreateUniverseDto,
  UpdateUniverseDto
> {
  constructor() {
    super('/api/universes');
  }

  async findByOwner(ownerId: string): Promise<Universe[]> {
    return this.findBy({ ownerId });
  }

  async findPublic(): Promise<Universe[]> {
    return this.findBy({ isPublic: true });
  }

  async search(query: string): Promise<Universe[]> {
    return this.findBy({ name: query });
  }
}
