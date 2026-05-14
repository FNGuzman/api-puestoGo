import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Usuario } from '../entities/usuario.entity';
import { UsuarioDTO } from '../dto/usuario.dto';
import { CreateUsuarioRequestDto } from '../dto/create-usuario-request.dto';
import { UpdateUsuarioRequestDto } from '../dto/update-usuario-request.dto';
import { SearchUsuarioRequestDto } from '../dto/search-usuario-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import * as bcrypt from 'bcrypt';
import { PersonaMapper } from 'src/schematics/persona/mappers/persona.mapper';
import { Persona } from 'src/schematics/persona/entities/persona.entity';
import { SuscripcionService } from 'src/schematics/suscripcion/suscripcion.service';

@Injectable()
export class UsuarioMapper {
  constructor(
    private personaMapper: PersonaMapper,
    private suscripcionService: SuscripcionService,
  ) { }
  async entity2DTO(usuario: Usuario): Promise<UsuarioDTO> {
    const dto = plainToInstance(UsuarioDTO, usuario, {
      excludeExtraneousValues: true,
    });
    if (usuario.persona) {
      dto.persona = await this.personaMapper.entity2DTO(usuario.persona);
    }
    dto.suscripcion = await this.suscripcionService.toResumenDto(usuario.id);
    return dto;
  }

  async page2Dto(
    request: SearchUsuarioRequestDto,
    page: PageDto<Usuario>,
  ): Promise<PageDto<UsuarioDTO>> {
    const dtos = await Promise.all(
      page.data.map(async (usuario) => {
        return this.entity2DTO(usuario);
      }),
    );
    const pageDto = new PageDto<UsuarioDTO>(dtos, page.metadata.count);
    pageDto.metadata.setPaginationData(1, 10);
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  async createDTO2Entity(request: CreateUsuarioRequestDto, persona: Persona): Promise<Usuario> {
    const newUsuario: Usuario = new Usuario();
    newUsuario.contrasena = await bcrypt.hash(request.contrasena, 10);
    newUsuario.email = request.email;
    newUsuario.activo = true; // Siempre se crea como activo
    newUsuario.persona = persona;
    return newUsuario;
  }

  async updateDTO2Entity(
    editUsuario: Usuario,
    request: UpdateUsuarioRequestDto,
  ): Promise<Usuario> {
    if (request.contrasena) {
      editUsuario.contrasena = await bcrypt.hash(request.contrasena, 10);
    }
    if (request.email !== undefined) {
      editUsuario.email = request.email;
    }
    if (request.activo !== undefined) {
      editUsuario.activo = request.activo !== undefined ? request.activo : true;
    }
    return editUsuario;
  }
}
