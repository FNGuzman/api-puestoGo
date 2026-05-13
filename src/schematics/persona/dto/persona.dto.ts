import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { Expose, Type } from 'class-transformer';
import { UsuarioSimpleDTO } from 'src/schematics/usuario/dto/usuario.dto';

export class PersonaDTO extends CommonDTO {

  @ApiProperty({ description: 'Nombre de la persona', example: 'Juan' })
  @Expose()
  nombre: string;

  @ApiProperty({ description: 'Apellido de la persona', example: 'Pérez' })
  @Expose()
  apellido: string;

}

export class PersonaEnrichedDTO extends PersonaDTO {

  @ApiProperty({ description: 'Usuario de la persona', type: () => UsuarioSimpleDTO })
  @Expose()
  @Type(() => UsuarioSimpleDTO)
  usuario: UsuarioSimpleDTO;

}