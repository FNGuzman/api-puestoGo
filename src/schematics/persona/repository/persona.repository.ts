import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Persona } from '../entities/persona.entity';
import { SearchPersonaRequestDto } from '../dto/search-persona-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { applySearchQueryOptions, applyTextSearch } from 'src/common/utils/search-query.util';

@Injectable()
export class PersonaRepository extends Repository<Persona> {
  constructor(private dataSource: DataSource) {
    super(Persona, dataSource.createEntityManager());
  }

  async search(request: SearchPersonaRequestDto): Promise<PageDto<Persona>> {
    const queryBuilder: SelectQueryBuilder<Persona> = this.createQueryBuilder(
      'persona',
    )
      .leftJoinAndSelect('persona.usuario', 'usuario');

    if (request.id) {
      queryBuilder.andWhere('persona.id = :id', { id: request.id });
    }

    if (request.nombre) {
      queryBuilder.andWhere(
        'LOWER(persona.nombre) LIKE LOWER(:nombre)',
        {
          nombre: `%${request.nombre}%`,
        },
      );
    }

    if (request.apellido) {
      queryBuilder.andWhere(
        'LOWER(persona.apellido) LIKE LOWER(:apellido)',
        {
          apellido: `%${request.apellido}%`,
        },
      );
    }

    if (request.email) {
      queryBuilder.andWhere(
        'LOWER(usuario.email) LIKE LOWER(:email)',
        {
          email: `%${request.email}%`,
        },
      );
    }

    if (request.idUsuario) {
      queryBuilder.andWhere('usuario.id = :idUsuario', { idUsuario: request.idUsuario });
    }

    applyTextSearch(queryBuilder, request.q, [
      'persona.nombre',
      'persona.apellido',
      'usuario.email',
    ]);

    applySearchQueryOptions(queryBuilder, request, 'id');

    const [list, count] = await queryBuilder.getManyAndCount();

    return new PageDto<Persona>(list, count);
  }
}
