import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseSearchDto } from 'src/common/dto/base-search.dto';

export class SearchNotificacionRequestDto extends BaseSearchDto {
  @ApiPropertyOptional({
    description: 'Si es true, solo devuelve notificaciones no leídas',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  soloNoLeidas?: boolean;
}
