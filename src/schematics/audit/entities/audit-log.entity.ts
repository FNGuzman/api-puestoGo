import { Entity, Column, Index } from 'typeorm';
import { AuditActionEnum } from 'src/common/enums/audit-action-enum';
import { BaseEntity } from 'src/common/models/baseentity';
import { AuditExcludeEntity } from '../config/audit.constants';

/** No auditar la propia tabla de auditoría (evita recursión al insertar logs). */
@AuditExcludeEntity()
@Entity({ name: 'audit_log' })
@Index(['entity', 'entityId'])
@Index(['userId', 'createdAt'])
export class AuditLog extends BaseEntity {
  @Column({
    name: 'user_id',
    type: 'int',
    nullable: false,
  })
  userId: number;

  @Column({
    name: 'action',
    type: 'enum',
    enum: AuditActionEnum,
  })
  action: AuditActionEnum;

  @Column({
    name: 'entity',
    type: 'varchar',
    length: 128,
  })
  entity: string;

  @Column({
    name: 'entity_id',
    type: 'int',
    nullable: false,
  })
  entityId: number;

  @Column({
    name: 'before_json',
    type: 'json',
    nullable: true,
  })
  beforeJson?: Record<string, any>;

  @Column({
    name: 'after_json',
    type: 'json',
    nullable: true,
  })
  afterJson?: Record<string, any>;

  @Column({
    name: 'method',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  method?: string;

  @Column({
    name: 'path',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  path?: string;

  @Column({
    name: 'request_id',
    type: 'char',
    length: 36,
    nullable: true,
  })
  requestId?: string;
}
