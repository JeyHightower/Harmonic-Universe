import {
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Universe } from './Universe';
import { User } from './User';

export interface Scene {
  id: string;
  name: string;
  description?: string;
  content: string;
  universeId: string;
  createdAt: Date;
  updatedAt: Date;
  position: number;
  settings?: Record<string, any>;
}

export interface CreateSceneDto {
  name: string;
  description?: string;
  content: string;
  universeId: string;
  position?: number;
  settings?: Record<string, any>;
}

export interface UpdateSceneDto {
  name?: string;
  description?: string;
  content?: string;
  position?: number;
  settings?: Record<string, any>;
}

@Entity('scenes')
export class Scene {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @Column('text')
  @IsString()
  description: string;

  @Column()
  @IsUUID()
  universeId: string;

  @Column()
  @IsUUID()
  creatorId: string;

  @Column('jsonb')
  @IsObject()
  content: object;

  @Column('jsonb', { default: { x: 0, y: 0, z: 0 } })
  @IsObject()
  @IsOptional()
  position?: object;

  @Column('jsonb', { default: {} })
  @IsObject()
  @IsOptional()
  settings?: object;

  @Column('jsonb', { default: {} })
  @IsObject()
  @IsOptional()
  metadata?: object;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Universe, universe => universe.scenes)
  @JoinColumn({ name: 'universeId' })
  universe: Universe;

  @ManyToOne(() => User, user => user.createdScenes)
  @JoinColumn({ name: 'creatorId' })
  creator: User;
}
