import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { PageDto } from 'src/common/dto/page.dto';
import { AuditLog } from '../entities/audit-log.entity';
import { SearchAuditLogDto } from '../dto/search-audit-log.dto';
import { applySearchQueryOptions, applyTextSearch } from 'src/common/utils/search-query.util';

@Injectable()
export class AuditoriaRepository extends Repository<AuditLog> {
  constructor(private readonly dataSource: DataSource) {
    super(AuditLog, dataSource.createEntityManager());
  }

  async search(request: SearchAuditLogDto): Promise<PageDto<AuditLog>> {
    const queryBuilder: SelectQueryBuilder<AuditLog> = this.createQueryBuilder(
      'audit_log',
    );

    if (request.id) {
      queryBuilder.andWhere('audit_log.id = :id', { id: request.id });
    }

    if (request.userId) {
      queryBuilder.andWhere('audit_log.user_id = :userId', { userId: request.userId });
    }

    if (request.action) {
      queryBuilder.andWhere('audit_log.action = :action', { action: request.action });
    }

    if (request.entity) {
      queryBuilder.andWhere('audit_log.entity = :entity', { entity: request.entity });
    }

    if (request.entityId) {
      queryBuilder.andWhere('audit_log.entity_id = :entityId', { entityId: request.entityId });
    }

    if (request.method) {
      queryBuilder.andWhere('audit_log.method = :method', { method: request.method });
    }

    if (request.path) {
      queryBuilder.andWhere('audit_log.path LIKE :path', { path: `%${request.path}%` });
    }

    if (request.requestId) {
      queryBuilder.andWhere('audit_log.request_id = :requestId', { requestId: request.requestId });
    }

    applyTextSearch(queryBuilder, request.q, [
      'audit_log.entity',
      'audit_log.path',
      'audit_log.method',
    ]);

    applySearchQueryOptions(queryBuilder, request, 'id');

    const [list, count] = await queryBuilder.getManyAndCount();

    return new PageDto<AuditLog>(list, count);
  }

}
