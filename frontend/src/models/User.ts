import bcrypt from 'bcryptjs';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Scene } from './Scene';
import { Universe } from './Universe';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
  settings?: Record<string, any>;
  isActive: boolean;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  settings?: Record<string, any>;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  settings?: Record<string, any>;
  isActive?: boolean;
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column()
  @IsString()
  @MinLength(6)
  password: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  firstName?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  lastName?: string;

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  lastLogin?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Universe, universe => universe.owner)
  universes: Universe[];

  @OneToMany(() => Scene, scene => scene.creator)
  createdScenes: Scene[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}
