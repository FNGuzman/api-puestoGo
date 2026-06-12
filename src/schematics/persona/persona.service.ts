import { Injectable } from '@nestjs/common';

import { CreatePersonaRequestDto } from './dto/create-persona-request.dto';
import { UpdatePersonaRequestDto } from './dto/update-persona-request.dto';
import { SearchPersonaRequestDto } from './dto/search-persona-request.dto';
import { PersonaDTO, PersonaEnrichedDTO } from './dto/persona.dto';

import { PersonaMapper } from './mappers/persona.mapper';
import { PersonaRepository } from './repository/persona.repository';
import { PageDto } from 'src/common/dto/page.dto';
import { Persona } from './entities/persona.entity';
import { GetEntityService } from 'src/common/services/get-entity.service';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';
import { ERRORS } from 'src/common/errors/errors-codes';
import { FindOptionsRelations } from 'typeorm';

@Injectable()
export class PersonaService {
  private readonly PERSONA_RELATIONS: FindOptionsRelations<Persona> = {
    usuario: true,
  };

  constructor(
    private personaMapper: PersonaMapper,
    private personaRepository: PersonaRepository,
    private getEntity: GetEntityService,
    private errorHandler: ErrorHandlerService,
  ) {}

  async find(criteria: {
    where: Record<string, unknown>;
    relations?: FindOptionsRelations<Persona>;
  }): Promise<Persona> {
    const persona = await this.personaRepository.findOne({
      where: criteria.where,
      relations: criteria.relations ?? this.PERSONA_RELATIONS,
    });
    if (!persona) {
      this.errorHandler.throwNotFound(
        ERRORS.DATABASE.RECORD_NOT_FOUND,
        criteria.where,
      );
    }
    return persona;
  }

  async findOne(id: number): Promise<PersonaEnrichedDTO> {
    const persona = await this.getEntity.findById(
      Persona,
      id,
      this.PERSONA_RELATIONS,
    );
    return this.personaMapper.entity2EnrichedDTO(persona);
  }

  async search(
    request: SearchPersonaRequestDto,
  ): Promise<PageDto<PersonaEnrichedDTO>> {
    const personaPage = await this.personaRepository.search(request);
    return this.personaMapper.page2Dto(request, personaPage);
  }

  async create(request: CreatePersonaRequestDto): Promise<PersonaDTO> {
    try {
      const newPersona = await this.personaMapper.createDTO2Entity(request);
      const personaSaved = await this.personaRepository.save(newPersona);
      const searchPersona = await this.getEntity.findById(
        Persona,
        personaSaved.id,
      );
      return this.personaMapper.entity2DTO(searchPersona);
    } catch (error) {
      if (this.errorHandler.isHttpException(error)) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async update(
    id: number,
    request: UpdatePersonaRequestDto,
  ): Promise<PersonaDTO> {
    try {
      const persona = await this.getEntity.findOneByOrFail(
        Persona,
        { id },
        this.PERSONA_RELATIONS,
      );
      const updatePersona = await this.personaMapper.updateDTO2Entity(
        persona,
        request,
      );
      await this.personaRepository.save(updatePersona);
      const searchPersona = await this.getEntity.findById(Persona, id);
      return this.personaMapper.entity2DTO(searchPersona);
    } catch (error) {
      if (this.errorHandler.isHttpException(error)) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async remove(id: number): Promise<string> {
    const persona = await this.getEntity.findOneByOrFail(
      Persona,
      { id },
      this.PERSONA_RELATIONS,
    );
    await this.personaRepository.softRemove(persona);
    return 'Persona eliminada correctamente';
  }
}
