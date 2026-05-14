import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { Expose, Type } from 'class-transformer';
import { PersonaDTO } from 'src/schematics/persona/dto/persona.dto';
import { SuscripcionResumenDto } from 'src/schematics/suscripcion/dto/suscripcion-resumen.dto';

export class UsuarioDTO extends CommonDTO {
  @ApiProperty({ description: 'Email del usuario', example: 'usuario@ejemplo.com' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Si el correo electrónico fue verificado con el código', example: false })
  @Expose()
  emailVerificado: boolean;

  @ApiProperty({ description: 'Estado activo del usuario', example: true })
  @Expose()
  activo: boolean;

  @ApiProperty({ description: 'Último acceso del usuario', example: '2024-01-01T00:00:00.000Z', required: false })
  @Expose()
  ultimoAcceso?: Date;

  @ApiProperty({ description: 'Foto de perfil del usuario', type: String, required: false, example: 'https://example.com/foto-perfil.jpg' })
  @Expose()
  fotoPerfil?: string;

  @ApiProperty({ description: 'Persona del usuario', type: () => PersonaDTO })
  @Expose()
  @Type(() => PersonaDTO)
  persona: PersonaDTO;

  @ApiPropertyOptional({ description: 'Suscripción y plan (PuestoGo)', type: () => SuscripcionResumenDto })
  @Expose()
  @Type(() => SuscripcionResumenDto)
  suscripcion?: SuscripcionResumenDto | null;

}

export class UsuarioSimpleDTO {

  @ApiProperty({ description: 'ID del usuario', type: Number })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Email del usuario', type: String })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Estado activo del usuario', type: Boolean })
  @Expose()
  activo: boolean;

  @ApiProperty({ description: 'Último acceso del usuario', type: Date })
  @Expose()
  ultimoAcceso?: Date;

}