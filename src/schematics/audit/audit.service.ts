import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { SearchAuditLogDto } from './dto/search-audit-log.dto';
import { AuditoriaRepository } from './repository/audit.repository';
import { PageDto } from 'src/common/dto/page.dto';
import { AuditoriaDTO } from './dto/auditoria.dto';
import { UserDataDto } from './dto/user-data.dto';
import { AuditoriaMapper } from './mappers/audit.mapper';

@Injectable()
export class AuditService {
  constructor(
    private readonly auditoriaMapper: AuditoriaMapper,
    private readonly auditoriaRepository: AuditoriaRepository,
  ) {}

  private async getAuthData(userId: number): Promise<UserDataDto | null> {
    const url = `https://auth.pushsoftware.com.ar/PersonaOut/user/${userId}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) {
        return null;
      }
      const data = (await response.json()) as UserDataDto;
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`No se pudieron obtener datos de auth para userId ${userId}:`, message);
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private cleanUserData(userData: UserDataDto | null): UserDataDto | null {
    if (!userData) return null;

    // Crear una copia del objeto para no modificar el original
    const cleanedUserData = { ...userData };
    
    // Eliminar el password del objeto usuarios si existe
    if (cleanedUserData.usuarios?.password) {
      const { password, ...usuariosWithoutPassword } = cleanedUserData.usuarios;
      cleanedUserData.usuarios = usuariosWithoutPassword;
    }

    return cleanedUserData;
  }

  async createAuditLog(auditData: CreateAuditLogDto): Promise<AuditoriaDTO> {
    try {
      const newAuditLog = await this.auditoriaMapper.createDTO2Entity(auditData);
      await this.auditoriaRepository.save(newAuditLog);
      const auditLogSaved = await this.auditoriaMapper.entity2DTO(newAuditLog);
      return auditLogSaved;
    } catch (error) {
      throw new BadRequestException({
        error: error.message,
      });
    }
  }

  async searchAuditoria(searchDto: SearchAuditLogDto): Promise<PageDto<AuditoriaDTO>> {
    const pageResult = await this.auditoriaRepository.search(searchDto);
    
    const pageDto = await this.auditoriaMapper.page2Dto(searchDto, pageResult);
    
    const enrichedLogs = await Promise.all(
      pageDto.data.map(async (log) => {
        const userData = await this.getAuthData(log.userId);
        const cleanedUserData = this.cleanUserData(userData);

        return {
          ...log,
          userData: cleanedUserData || undefined,
        } as AuditoriaDTO;
      })
    );

    // Crear nueva página con datos enriquecidos
    const enrichedPageDto = new PageDto<AuditoriaDTO>(enrichedLogs, pageDto.metadata.count);
    enrichedPageDto.metadata = pageDto.metadata;
    
    return enrichedPageDto;
  }
}
