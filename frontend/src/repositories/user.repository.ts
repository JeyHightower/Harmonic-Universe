import { CreateUserDto, UpdateUserDto, User } from '../models/User';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  constructor() {
    super('/api/users');
  }

  async findByUsername(username: string): Promise<User | null> {
    const users = await this.findBy({ username });
    return users[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.findBy({ email });
    return users[0] || null;
  }
}
