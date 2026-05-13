import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { SearchUsuarioRequestDto } from '../dto/search-usuario-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { applySearchQueryOptions, applyTextSearch } from 'src/common/utils/search-query.util';

@Injectable()
export class UsuarioRepository extends Repository<Usuario> {
  constructor(private dataSource: DataSource) {
    super(Usuario, dataSource.createEntityManager());
  }

  async search(request: SearchUsuarioRequestDto): Promise<PageDto<Usuario>> {
    const queryBuilder: SelectQueryBuilder<Usuario> = this.createQueryBuilder(
      'usuario',
    )
      .leftJoinAndSelect('usuario.persona', 'persona');

    if (request.id) {
      queryBuilder.andWhere('usuario.id = :id', { id: request.id });
    }

    if (request.email) {
      queryBuilder.andWhere(
        'LOWER(usuario.email) LIKE LOWER(:email)',
        {
          email: `%${request.email}%`,
        },
      );
    }

    if (request.activo !== undefined) {
      queryBuilder.andWhere('usuario.activo = :activo', { activo: request.activo });
    }

    if (request.nombrePersona) {
      queryBuilder.andWhere(
        'LOWER(persona.nombre) LIKE LOWER(:nombrePersona)',
        {
          nombrePersona: `%${request.nombrePersona}%`,
        },
      );
    }
    if (request.apellidoPersona) {
      queryBuilder.andWhere(
        'LOWER(persona.apellido) LIKE LOWER(:apellidoPersona)',
        {
          apellidoPersona: `%${request.apellidoPersona}%`,
        },
      );
    }

    applyTextSearch(queryBuilder, request.q, [
      'usuario.email',
      'persona.nombre',
      'persona.apellido',
    ]);

    applySearchQueryOptions(queryBuilder, request, 'id');

    const [list, count] = await queryBuilder.getManyAndCount();

    return new PageDto<Usuario>(list, count);
  }
}
