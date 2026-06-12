import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserDataDto {
  @ApiProperty({ description: 'CUIL del usuario', type: String })
  @Expose()
  cuil: string;

  @ApiProperty({ description: 'Nombre del usuario', type: String })
  @Expose()
  nombre: string;

  @ApiProperty({ description: 'Apellido del usuario', type: String })
  @Expose()
  apellido: string;

  @ApiProperty({ description: 'Género del usuario', type: String })
  @Expose()
  genero: string;

  @ApiProperty({
    description: 'Datos del usuario en el sistema',
    type: 'object',
    properties: {
      id: { type: 'number', description: 'ID del usuario' },
      nombre: { type: 'string', description: 'Nombre de usuario' },
      email: { type: 'string', description: 'Email del usuario' },
      password: {
        type: 'string',
        description: 'Password del usuario (opcional)',
      },
    },
  })
  @Expose()
  usuarios: {
    id: number;
    nombre: string;
    email: string;
    password?: string;
  };
}
