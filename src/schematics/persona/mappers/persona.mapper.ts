import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Persona } from '../entities/persona.entity';
import { PersonaDTO, PersonaEnrichedDTO } from '../dto/persona.dto';
import { CreatePersonaRequestDto } from '../dto/create-persona-request.dto';
import { UpdatePersonaRequestDto } from '../dto/update-persona-request.dto';
import { SearchPersonaRequestDto } from '../dto/search-persona-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { UsuarioSimpleDTO } from 'src/schematics/usuario/dto/usuario.dto';
import { Usuario } from 'src/schematics/usuario/entities/usuario.entity';

@Injectable()
export class PersonaMapper {
  async entity2DTO(persona: Persona): Promise<PersonaDTO> {
    return plainToInstance(PersonaDTO, persona, {
      excludeExtraneousValues: true,
    });
  }

  async entity2EnrichedDTO(persona: Persona): Promise<PersonaEnrichedDTO> {
    const personaDTO = plainToInstance(PersonaDTO, persona, {
      excludeExtraneousValues: true,
    });
    
    const usuarioDTO: UsuarioSimpleDTO | undefined = persona.usuario
      ? this.usuarioToSimpleDTO(persona.usuario)
      : undefined;
    
    return {
      ...personaDTO,
      usuario: usuarioDTO,
    } as PersonaEnrichedDTO;
  }

  async page2Dto(
    request: SearchPersonaRequestDto,
    page: PageDto<Persona>,
  ): Promise<PageDto<PersonaEnrichedDTO>> {
    const enrichedDtos: PersonaEnrichedDTO[] = page.data.map((persona) => {
      const personaDTO = plainToInstance(PersonaDTO, persona, {
        excludeExtraneousValues: true,
      });
      
      const usuarioDTO: UsuarioSimpleDTO | undefined = persona.usuario
        ? this.usuarioToSimpleDTO(persona.usuario)
        : undefined;
      
      return {
        ...personaDTO,
        usuario: usuarioDTO,
      } as PersonaEnrichedDTO;
    });
    
    const pageDto = new PageDto<PersonaEnrichedDTO>(enrichedDtos, page.metadata.count);
    pageDto.metadata.setPaginationData(request.getPageNumber(), request.getTake());
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  private usuarioToSimpleDTO(usuario: Usuario): UsuarioSimpleDTO {
    return plainToInstance(UsuarioSimpleDTO, {
      id: usuario.id,
      email: usuario.email,
      activo: usuario.activo,
      ultimoAcceso: usuario.ultimoAcceso,
    }, {
      excludeExtraneousValues: true,
    });
  }

  async createDTO2Entity(request: CreatePersonaRequestDto): Promise<Persona> {
    const newPersona: Persona = new Persona();
    newPersona.nombre = request.nombre;
    newPersona.apellido = request.apellido;
    return newPersona;
  }

  async updateDTO2Entity(
    editPersona: Persona,
    request: UpdatePersonaRequestDto,
  ): Promise<Persona> {
    if (request.nombre !== undefined) {
      editPersona.nombre = request.nombre;
    }
    if (request.apellido !== undefined) {
      editPersona.apellido = request.apellido;
    }
    return editPersona;
  }
}
