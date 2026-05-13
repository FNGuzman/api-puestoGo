import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse, ApiBody } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceTokenRequestDto } from './dto/register-device-token.dto';
import { SearchNotificacionRequestDto } from './dto/search-notificacion-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { NotificacionDTO } from './dto/notificacion.dto';
import { plainToInstance } from 'class-transformer';
import { FlexibleJwtAuthGuard } from 'src/common/guards/flexible-jwt-auth.guard';

@ApiTags('Notificaciones')
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) { }

  @Post('device-token')
  @ApiBearerAuth('authorization')
  @UseGuards(FlexibleJwtAuthGuard)
  @ApiOperation({
    summary: 'Registrar token FCM',
    description:
      'Registra o actualiza el token de Firebase Cloud Messaging del dispositivo actual. ' +
      'La app debe llamar a este endpoint al iniciar sesión o cuando obtenga un nuevo token FCM.',
  })
  @ApiBody({
    type: RegisterDeviceTokenRequestDto,
    description: 'Token FCM y datos opcionales del dispositivo',
  })
  @ApiOkResponse({ description: 'Token registrado correctamente' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async registerDeviceToken(
    @Request() req: { user: { id: number } },
    @Body() dto: RegisterDeviceTokenRequestDto,
  ): Promise<{ message: string }> {
    await this.notificationsService.registerDeviceToken(
      req.user.id,
      dto.fcmToken,
      dto.platform ?? 'android',
      dto.deviceId,
      dto.deviceName,
    );
    return { message: 'Token registrado correctamente' };
  }

  @Get()
  @ApiBearerAuth('authorization')
  @UseGuards(FlexibleJwtAuthGuard)
  @ApiOperation({
    summary: 'Listar mis notificaciones',
    description: 'Lista paginada de notificaciones del usuario. Opcional: solo no leídas.',
  })
  @ApiOkResponse({
    type: PageDto<NotificacionDTO>,
    description: 'Lista paginada de notificaciones del usuario'
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findMyNotifications(
    @Request() req: { user: { id: number } },
    @Query() request: SearchNotificacionRequestDto,
  ): Promise<PageDto<NotificacionDTO>> {
    const reqDto = plainToInstance(SearchNotificacionRequestDto, request);
    return this.notificationsService.findPageByUsuarioId(req.user.id, reqDto);
  }

  @Patch(':id/read')
  @UseGuards(FlexibleJwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Marcar notificación como leída',
    description:
      'Marca una notificación como leída (actualiza noti02_leido y noti02_leido_en). ' +
      'Solo aplica a notificaciones del usuario. Llamar cuando el usuario abre la notificación o la ve en el historial.',
  })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @ApiOkResponse({ description: 'Notificación marcada como leída', schema: { properties: { leido: { type: 'boolean', example: true } } } })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async markAsRead(
    @Request() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ leido: boolean }> {
    return this.notificationsService.markAsRead(id, req.user.id);
  }
}