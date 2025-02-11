import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Scene } from './Scene';
import { User } from './User';

export interface Universe {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  isPublic: boolean;
  collaborators?: string[];
  settings?: Record<string, any>;
}

export interface CreateUniverseDto {
  name: string;
  description?: string;
  isPublic?: boolean;
  settings?: Record<string, any>;
}

export interface UpdateUniverseDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
  settings?: Record<string, any>;
}

@Entity('universes')
export class UniverseEntity {
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

  @Column({ default: false })
  @IsBoolean()
  isPublic: boolean;

  @Column()
  ownerId: string;

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

  @ManyToOne(() => User, user => user.universes)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => Scene, scene => scene.universe)
  scenes: Scene[];
}
