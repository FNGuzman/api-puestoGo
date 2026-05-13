import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBadRequestResponse, ApiOkResponse } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { SearchAuditLogDto } from './dto/search-audit-log.dto';
import { AuditoriaDTO } from './dto/auditoria.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { plainToInstance } from 'class-transformer';
import { AdminAuthGuard } from 'src/common/guards/admin-auth.guard';

@ApiTags('Auditoría')
@Controller('audit')
@ApiBearerAuth('authorization')
@UseGuards(AdminAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) { }

  @Get()
  @ApiOperation({ 
    summary: 'Buscar logs de auditoría con filtros', 
    description: 'Busca logs de auditoría con filtros opcionales'
  })
  @ApiOkResponse({
    type: () => PageDto<AuditoriaDTO>,
    description: 'Lista paginada de logs de auditoría encontrados.',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta.' })
  async searchAuditoria(
    @Query() searchDto: SearchAuditLogDto)
    : Promise<PageDto<AuditoriaDTO>> {
    const request = plainToInstance(SearchAuditLogDto, searchDto);
    return this.auditService.searchAuditoria(request);
  }
}