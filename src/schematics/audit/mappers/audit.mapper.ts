import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PageDto } from 'src/common/dto/page.dto';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditoriaDTO, CreateAuditLogDto, SearchAuditLogDto } from '../dto';

@Injectable()
export class AuditoriaMapper {
  constructor() {}

  async entity2DTO(auditLog: AuditLog): Promise<AuditoriaDTO> {
    const auditLogDTO = plainToInstance(AuditoriaDTO, auditLog, {
      excludeExtraneousValues: true, // filtra propiedades que no tengan el decorador @Expose en el DTO
    });
    return auditLogDTO;
  }

  async page2Dto(
    request: SearchAuditLogDto,
    page: PageDto<AuditLog>,
  ): Promise<PageDto<AuditoriaDTO>> {
    const dtos = await Promise.all(
      page.data.map(async (auditLog) => {
        return this.entity2DTO(auditLog);
      }),
    );
    const pageDto = new PageDto<AuditoriaDTO>(dtos, page.metadata.count);
    pageDto.metadata.setPaginationData(
      request.getPageNumber(),
      request.getTake(),
    );
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  async createDTO2Entity(
    request: CreateAuditLogDto,
  ): Promise<AuditLog> {
    const newAuditLog: AuditLog = new AuditLog();
    newAuditLog.userId = request.userId;
    newAuditLog.action = request.action;
    newAuditLog.entity = request.entity;
    newAuditLog.entityId = request.entityId;
    newAuditLog.beforeJson = request.beforeJson;
    newAuditLog.afterJson = request.afterJson;
    newAuditLog.method = request.method;
    newAuditLog.path = request.path;
    newAuditLog.requestId = request.requestId;
   
    return newAuditLog;
  }
}
