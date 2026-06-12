import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { FlexibleJwtAuthGuard } from 'src/common/guards/flexible-jwt-auth.guard';
import { SuscripcionService } from './suscripcion.service';
import { PlanCatalogoDto } from './dto/plan-catalogo.dto';
import { CheckoutSuscripcionDto } from './dto/checkout-suscripcion.dto';
import { CheckoutSuscripcionResponseDto } from './dto/checkout-suscripcion-response.dto';
import { PagoSuscripcionResumenDto } from './dto/pago-suscripcion-resumen.dto';
import { BackupUsuarioResumenDto } from './dto/backup-usuario-resumen.dto';
import { BackupUsuarioDetalleDto } from './dto/backup-usuario-detalle.dto';
import { SincronizarBackupDto } from './dto/sincronizar-backup.dto';

@ApiTags('Suscripción')
@Controller('suscripcion')
export class SuscripcionController {
  constructor(private readonly suscripcionService: SuscripcionService) {}

  @Get('planes')
  @ApiOperation({ summary: 'Catálogo de planes activos' })
  @ApiOkResponse({ type: [PlanCatalogoDto] })
  async listPlanes(): Promise<PlanCatalogoDto[]> {
    return this.suscripcionService.listPlanesCatalogo();
  }

  @Get('pagos')
  @UseGuards(FlexibleJwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Historial de pagos de suscripción del usuario autenticado',
  })
  @ApiOkResponse({ type: [PagoSuscripcionResumenDto] })
  async listPagos(@Req() req: Request): Promise<PagoSuscripcionResumenDto[]> {
    const user = req.user as { id: number };
    return this.suscripcionService.listPagosUsuario(user.id);
  }

  @Get('backups')
  @UseGuards(FlexibleJwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'Lista de backups registrados del usuario' })
  @ApiOkResponse({ type: [BackupUsuarioResumenDto] })
  async listBackups(@Req() req: Request): Promise<BackupUsuarioResumenDto[]> {
    const user = req.user as { id: number };
    return this.suscripcionService.listBackupsUsuario(user.id);
  }

  @Post('backup/sync')
  @UseGuards(FlexibleJwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary:
      'Sincronizar respaldo: guarda el JSON en base de datos (sin archivo en disco)',
  })
  async sincronizarBackup(
    @Req() req: Request,
    @Body() body: SincronizarBackupDto,
  ) {
    const user = req.user as { id: number };
    return this.suscripcionService.sincronizarBackupDesdeApp(
      user.id,
      body.payload,
    );
  }

  @Get('backup/:id')
  @UseGuards(FlexibleJwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Descargar JSON del backup guardado en DB (solo el dueño)',
  })
  @ApiOkResponse({ type: BackupUsuarioDetalleDto })
  async obtenerBackup(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BackupUsuarioDetalleDto> {
    const user = req.user as { id: number };
    return this.suscripcionService.obtenerBackupJsonParaUsuario(user.id, id);
  }

  @Post('checkout')
  @UseGuards(FlexibleJwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Iniciar pago (Mercado Pago) o simulación si está habilitada',
  })
  @ApiOkResponse({ type: CheckoutSuscripcionResponseDto })
  async checkout(
    @Req() req: Request,
    @Body() body: CheckoutSuscripcionDto,
  ): Promise<CheckoutSuscripcionResponseDto> {
    const user = req.user as { id: number };
    return this.suscripcionService.crearCheckout(user.id, body);
  }

  @Post('webhook')
  @SkipThrottle()
  @ApiOperation({ summary: 'Webhook Mercado Pago (notificaciones de pago)' })
  async webhook(
    @Headers('x-signature') xSignature: string | undefined,
    @Headers('x-request-id') xRequestId: string | undefined,
    @Query() query: Record<string, string>,
    @Body() body: Record<string, unknown>,
  ): Promise<{ ok: boolean }> {
    this.suscripcionService.assertValidMercadoPagoWebhook(
      body ?? {},
      { xSignature, xRequestId },
      query,
    );
    await this.suscripcionService.procesarWebhookMercadoPago(body ?? {});
    return { ok: true };
  }
}
