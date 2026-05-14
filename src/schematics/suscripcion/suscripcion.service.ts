import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomUUID } from 'crypto';
import { PlanFuncion } from './entities/plan-funcion.entity';
import { Plan } from './entities/plan.entity';
import { UsuarioSuscripcion } from './entities/usuario-suscripcion.entity';
import { Usuario } from '../usuario/entities/usuario.entity';
import { PLAN_CODIGO } from './constants/plan-codigos';
import { MENSAJE_FUNCION_PLAN_PRO, PLAN_FUNCION_CODIGO } from './constants/plan-funcion-codigo';
import { PLAN_FUNCIONES_POR_PLAN } from './constants/plan-funciones-por-plan';
import { SuscripcionCiclo } from './enums/suscripcion-ciclo.enum';
import { SuscripcionEstado } from './enums/suscripcion-estado.enum';
import { SuscripcionResumenDto } from './dto/suscripcion-resumen.dto';
import { PlanCatalogoDto } from './dto/plan-catalogo.dto';
import { CheckoutSuscripcionDto } from './dto/checkout-suscripcion.dto';
import { CheckoutSuscripcionResponseDto } from './dto/checkout-suscripcion-response.dto';
import { PagoSuscripcionResumenDto } from './dto/pago-suscripcion-resumen.dto';
import { BackupUsuarioResumenDto } from './dto/backup-usuario-resumen.dto';
import { SuscripcionPago } from './entities/suscripcion-pago.entity';
import { UsuarioBackup } from './entities/usuario-backup.entity';
import { PagoSuscripcionEstado } from './enums/pago-suscripcion-estado.enum';
import { MercadoPagoCheckoutService } from './mercadopago-checkout.service';

/** Meses de tarifa mensual facturados en un pago anual (2 meses de regalo). */
const MESES_FACTURACION_ANUAL = 10;

@Injectable()
export class SuscripcionService implements OnModuleInit {
  private readonly logger = new Logger(SuscripcionService.name);

  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(UsuarioSuscripcion)
    private readonly usuarioSuscripcionRepository: Repository<UsuarioSuscripcion>,
    @InjectRepository(SuscripcionPago)
    private readonly suscripcionPagoRepository: Repository<SuscripcionPago>,
    @InjectRepository(UsuarioBackup)
    private readonly usuarioBackupRepository: Repository<UsuarioBackup>,
    @InjectRepository(PlanFuncion)
    private readonly planFuncionRepository: Repository<PlanFuncion>,
    private readonly mercadoPagoCheckout: MercadoPagoCheckoutService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedPlanesIfEmpty();
    await this.seedPlanFuncionesFromCatalog();
  }

  async seedPlanesIfEmpty(): Promise<void> {
    const count = await this.planRepository.count();
    if (count > 0) return;

    const basico = new Plan();
    basico.codigo = PLAN_CODIGO.BASICO;
    basico.nombre = 'Básico';
    basico.descripcion = 'Por defecto al crear cuenta. Funciones core; sin ajustes masivos.';
    basico.precio = '0.00';
    basico.moneda = 'ARS';
    basico.limiteProductos = 100;
    basico.permiteAjusteMasivoPrecio = false;
    basico.permiteAjusteMasivoStock = false;
    basico.periodoEvaluacionDias = 30;
    basico.diasGraciaOffline = 5;
    basico.activo = true;

    const pro = new Plan();
    pro.codigo = PLAN_CODIGO.PRO;
    pro.nombre = 'Pro';
    pro.descripcion = 'Todas las funciones desbloqueadas (ajustes masivos, catálogo amplio).';
    pro.precio = '7000.00';
    pro.moneda = 'ARS';
    pro.limiteProductos = null;
    pro.permiteAjusteMasivoPrecio = true;
    pro.permiteAjusteMasivoStock = true;
    pro.periodoEvaluacionDias = 30;
    pro.diasGraciaOffline = 5;
    pro.activo = true;

    const equipo = new Plan();
    equipo.codigo = PLAN_CODIGO.EQUIPO;
    equipo.nombre = 'Equipo';
    equipo.descripcion =
      'Próximamente: multi-usuario con sincronización y multi-stock (varias sucursales / dispositivos).';
    equipo.precio = '19000.00';
    equipo.moneda = 'ARS';
    equipo.limiteProductos = null;
    equipo.permiteAjusteMasivoPrecio = true;
    equipo.permiteAjusteMasivoStock = true;
    equipo.periodoEvaluacionDias = 30;
    equipo.diasGraciaOffline = 7;
    equipo.activo = true;

    await this.planRepository.save([basico, pro, equipo]);
    this.logger.log('Planes de suscripción iniciales creados (BASICO, PRO, EQUIPO).');
  }

  /**
   * Asegura en `sub_05_rel_plan_funcion` todas las funciones del catálogo por plan (agrega faltantes, idempotente).
   */
  async seedPlanFuncionesFromCatalog(): Promise<void> {
    const plans = await this.planRepository.find();
    for (const plan of plans) {
      const esperados = PLAN_FUNCIONES_POR_PLAN[plan.codigo];
      if (!esperados?.length) {
        continue;
      }
      const existing = await this.planFuncionRepository.find({ where: { plan: { id: plan.id } } });
      const have = new Set(existing.map((e) => e.funcionCodigo));
      const missing = esperados.filter((c) => !have.has(c));
      if (missing.length === 0) {
        continue;
      }
      await this.planFuncionRepository.save(
        missing.map((funcionCodigo) => {
          const row = new PlanFuncion();
          row.plan = plan;
          row.funcionCodigo = funcionCodigo;
          return row;
        }),
      );
      this.logger.log(`Plan ${plan.codigo}: funciones agregadas (${missing.join(', ')}).`);
    }
  }

  private funcionesHabilitadasParaPlan(plan: Plan): string[] {
    const rel = plan.funcionesPlan?.map((f) => f.funcionCodigo).filter(Boolean) ?? [];
    if (rel.length > 0) {
      return [...new Set(rel)].sort();
    }
    const catalogo = PLAN_FUNCIONES_POR_PLAN[plan.codigo];
    if (catalogo?.length) {
      return [...new Set(catalogo)].sort();
    }
    return [
      ...(plan.permiteAjusteMasivoPrecio ? [PLAN_FUNCION_CODIGO.AJUSTE_MASIVO_PRECIO] : []),
      ...(plan.permiteAjusteMasivoStock ? [PLAN_FUNCION_CODIGO.AJUSTE_MASIVO_STOCK] : []),
    ];
  }

  /** Comprueba que la suscripción vigente del usuario incluya el código de función. */
  private async assertUsuarioTieneFuncion(usuarioId: number, codigo: string): Promise<void> {
    const sub = await this.findByUsuarioId(usuarioId);
    if (!sub?.plan) {
      throw new ForbiddenException('No hay plan asignado.');
    }
    const fns = this.funcionesHabilitadasParaPlan(sub.plan);
    if (!fns.includes(codigo)) {
      throw new ForbiddenException(MENSAJE_FUNCION_PLAN_PRO);
    }
  }

  async findByUsuarioId(usuarioId: number): Promise<UsuarioSuscripcion | null> {
    return this.usuarioSuscripcionRepository.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['plan', 'plan.funcionesPlan'],
    });
  }

  async toResumenDto(usuarioId: number): Promise<SuscripcionResumenDto | null> {
    let row = await this.findByUsuarioId(usuarioId);
    if (!row) {
      await this.crearSuscripcionPorDefecto(usuarioId);
      row = await this.findByUsuarioId(usuarioId);
    }
    if (!row?.plan) return null;
    const p = row.plan;
    const funciones = this.funcionesHabilitadasParaPlan(p);
    return {
      planCodigo: p.codigo,
      planNombre: p.nombre,
      estado: row.estado,
      validoHasta: row.validoHasta,
      graciaHasta: row.graciaHasta,
      ultimaValidacionEn: row.ultimaValidacionEn,
      ciclo: row.ciclo,
      renovacionAutomatica: row.renovacionAutomatica,
      limiteProductos: p.limiteProductos,
      funcionesHabilitadas: funciones,
      permiteAjusteMasivoPrecio: funciones.includes(PLAN_FUNCION_CODIGO.AJUSTE_MASIVO_PRECIO),
      permiteAjusteMasivoStock: funciones.includes(PLAN_FUNCION_CODIGO.AJUSTE_MASIVO_STOCK),
      precioPlan: p.precio,
      monedaPlan: p.moneda,
    };
  }

  /**
   * Asigna plan BASICO con ventana de vigencia + gracia (como sesión mock en app-venta-flash).
   */
  async crearSuscripcionPorDefecto(usuarioId: number): Promise<void> {
    const existing = await this.findByUsuarioId(usuarioId);
    if (existing) return;

    const plan = await this.planRepository.findOne({
      where: { codigo: PLAN_CODIGO.BASICO, activo: true },
    });
    if (!plan) {
      this.logger.error('No existe plan BASICO; ejecutá seed o revisá la base.');
      return;
    }

    const now = new Date();
    const validoHasta = new Date(now);
    validoHasta.setUTCDate(validoHasta.getUTCDate() + plan.periodoEvaluacionDias);

    const graciaHasta = new Date(validoHasta);
    graciaHasta.setUTCDate(graciaHasta.getUTCDate() + plan.diasGraciaOffline);

    const row = new UsuarioSuscripcion();
    row.usuario = { id: usuarioId } as Usuario;
    row.plan = plan;
    row.estado = SuscripcionEstado.ACTIVA;
    row.validoHasta = validoHasta;
    row.graciaHasta = graciaHasta;
    row.ultimaValidacionEn = now;
    row.ciclo = SuscripcionCiclo.MENSUAL;
    row.renovacionAutomatica = true;

    await this.usuarioSuscripcionRepository.save(row);
  }

  async listPlanesCatalogo(): Promise<PlanCatalogoDto[]> {
    const rows = await this.planRepository.find({
      where: { activo: true },
      order: { precio: 'ASC' },
      relations: ['funcionesPlan'],
    });
    return rows.map((p) => {
      const mensual = Number(p.precio);
      const anual = Number.isFinite(mensual) ? (mensual * MESES_FACTURACION_ANUAL).toFixed(2) : p.precio;
      const funciones = this.funcionesHabilitadasParaPlan(p);
      return {
        codigo: p.codigo,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
        moneda: p.moneda,
        limiteProductos: p.limiteProductos,
        funcionesHabilitadas: funciones,
        permiteAjusteMasivoPrecio: funciones.includes(PLAN_FUNCION_CODIGO.AJUSTE_MASIVO_PRECIO),
        permiteAjusteMasivoStock: funciones.includes(PLAN_FUNCION_CODIGO.AJUSTE_MASIVO_STOCK),
        precioAnual: anual,
      };
    });
  }

  private montoPorCiclo(plan: Plan, ciclo: SuscripcionCiclo): string {
    const base = Number(plan.precio);
    if (!Number.isFinite(base)) return plan.precio;
    if (ciclo === SuscripcionCiclo.ANUAL) {
      return (base * MESES_FACTURACION_ANUAL).toFixed(2);
    }
    return base.toFixed(2);
  }

  private diasPorCiclo(ciclo: SuscripcionCiclo): number {
    return ciclo === SuscripcionCiclo.ANUAL ? 365 : 30;
  }

  /**
   * Extiende vigencia desde hoy o desde el fin del período actual (lo que sea mayor) y actualiza plan.
   */
  async aplicarPlanTrasPago(usuarioId: number, planCodigo: string, ciclo: SuscripcionCiclo): Promise<void> {
    const plan = await this.planRepository.findOne({ where: { codigo: planCodigo, activo: true } });
    if (!plan) {
      throw new BadRequestException(`Plan ${planCodigo} no disponible`);
    }
    let row = await this.findByUsuarioId(usuarioId);
    if (!row) {
      await this.crearSuscripcionPorDefecto(usuarioId);
      row = await this.findByUsuarioId(usuarioId);
    }
    if (!row) {
      throw new BadRequestException('No se pudo crear la suscripción del usuario');
    }

    const ahora = new Date();
    const base = row.validoHasta > ahora ? row.validoHasta : ahora;
    const validoHasta = new Date(base);
    validoHasta.setUTCDate(validoHasta.getUTCDate() + this.diasPorCiclo(ciclo));

    const graciaHasta = new Date(validoHasta);
    graciaHasta.setUTCDate(graciaHasta.getUTCDate() + plan.diasGraciaOffline);

    row.plan = plan;
    row.ciclo = ciclo;
    row.estado = SuscripcionEstado.ACTIVA;
    row.validoHasta = validoHasta;
    row.graciaHasta = graciaHasta;
    row.ultimaValidacionEn = ahora;
    await this.usuarioSuscripcionRepository.save(row);
  }

  async listPagosUsuario(usuarioId: number): Promise<PagoSuscripcionResumenDto[]> {
    const rows = await this.suscripcionPagoRepository.find({
      where: { usuario: { id: usuarioId } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return rows.map((r) => ({
      id: r.id,
      planCodigo: r.planCodigo,
      planNombre: r.planNombre,
      ciclo: r.ciclo,
      monto: r.monto,
      moneda: r.moneda,
      estado: r.estado,
      mpPaymentId: r.mpPaymentId,
      creadoEn: r.createdAt?.toISOString?.() ?? '',
      pagadoEn: r.paidAt ? r.paidAt.toISOString() : null,
    }));
  }

  async listBackupsUsuario(usuarioId: number): Promise<BackupUsuarioResumenDto[]> {
    await this.assertUsuarioTieneFuncion(usuarioId, PLAN_FUNCION_CODIGO.BACKUP_NUBE);
    const rows = await this.usuarioBackupRepository.find({
      where: { usuario: { id: usuarioId } },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return rows.map((b) => ({
      id: b.id,
      nombreOriginal: b.nombreOriginal,
      tamanoBytes: b.tamanoBytes,
      origen: b.origen,
      creadoEn: b.createdAt?.toISOString?.() ?? '',
      checksumSha256: b.checksumSha256,
      tienePayloadEnDb: b.payloadJson != null,
    }));
  }

  private assertBackupPayloadShape(payload: Record<string, unknown>): void {
    const v = payload.v;
    if (v !== 1 && v !== 2) {
      throw new BadRequestException('El respaldo debe tener v: 1 o v: 2.');
    }
    if (typeof payload.exportedAt !== 'string' || !payload.exportedAt) {
      throw new BadRequestException('El respaldo debe incluir exportedAt (ISO).');
    }
    if (!payload.tables || typeof payload.tables !== 'object' || Array.isArray(payload.tables)) {
      throw new BadRequestException('El respaldo debe incluir tables (objeto).');
    }
  }

  /**
   * Guarda el JSON del backup en MySQL (sin archivo en disco ni R2).
   * Cada llamada crea un registro nuevo (historial).
   */
  async sincronizarBackupDesdeApp(
    usuarioId: number,
    payload: Record<string, unknown>,
  ): Promise<{ id: number; exportedAt: string; tamanoBytes: string; checksumSha256: string }> {
    await this.assertUsuarioTieneFuncion(usuarioId, PLAN_FUNCION_CODIGO.BACKUP_NUBE);
    this.assertBackupPayloadShape(payload);
    const jsonStr = JSON.stringify(payload);
    const tamanoBytes = Buffer.byteLength(jsonStr, 'utf8');
    const checksumSha256 = createHash('sha256').update(jsonStr, 'utf8').digest('hex');

    const safeStamp = String(payload.exportedAt).replace(/[:.]/g, '-');
    const nombreOriginal = `puntoferia-sync-${safeStamp}.json`;

    const row = new UsuarioBackup();
    row.usuario = { id: usuarioId } as Usuario;
    row.nombreOriginal = nombreOriginal.slice(0, 500);
    row.claveAlmacenamiento = null;
    row.tamanoBytes = String(tamanoBytes);
    row.checksumSha256 = checksumSha256;
    row.origen = 'sync_db';
    row.payloadJson = payload;

    await this.usuarioBackupRepository.save(row);

    return {
      id: row.id,
      exportedAt: payload.exportedAt as string,
      tamanoBytes: row.tamanoBytes,
      checksumSha256,
    };
  }

  async obtenerBackupJsonParaUsuario(usuarioId: number, backupId: number): Promise<{
    id: number;
    nombreOriginal: string;
    creadoEn: string;
    payload: Record<string, unknown>;
  }> {
    await this.assertUsuarioTieneFuncion(usuarioId, PLAN_FUNCION_CODIGO.BACKUP_NUBE);
    const b = await this.usuarioBackupRepository.findOne({
      where: { id: backupId, usuario: { id: usuarioId } },
    });
    if (!b?.payloadJson) {
      throw new NotFoundException('Backup no encontrado o sin JSON en base de datos.');
    }
    return {
      id: b.id,
      nombreOriginal: b.nombreOriginal,
      creadoEn: b.createdAt?.toISOString?.() ?? '',
      payload: b.payloadJson,
    };
  }

  async crearCheckout(usuarioId: number, dto: CheckoutSuscripcionDto): Promise<CheckoutSuscripcionResponseDto> {
    const plan = await this.planRepository.findOne({ where: { codigo: dto.planCodigo, activo: true } });
    if (!plan) {
      throw new BadRequestException('Plan no encontrado');
    }
    const montoStr = this.montoPorCiclo(plan, dto.ciclo);
    const unitPrice = Number(montoStr);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new BadRequestException('Precio de plan inválido');
    }

    const externalRef = `pg-${randomUUID()}`;
    const pago = new SuscripcionPago();
    pago.usuario = { id: usuarioId } as Usuario;
    pago.planCodigo = plan.codigo;
    pago.planNombre = plan.nombre;
    pago.ciclo = dto.ciclo;
    pago.monto = montoStr;
    pago.moneda = plan.moneda;
    pago.estado = PagoSuscripcionEstado.PENDIENTE;
    pago.externalRef = externalRef;
    pago.mpPreferenceId = null;
    pago.mpPaymentId = null;
    pago.paidAt = null;
    await this.suscripcionPagoRepository.save(pago);

    const mockAllowed =
      (process.env.ALLOW_SUBSCRIPTION_MOCK_CHECKOUT || '').toLowerCase() === 'true' ||
      (process.env.ALLOW_SUBSCRIPTION_MOCK_CHECKOUT || '') === '1';

    if (!this.mercadoPagoCheckout.isConfigured()) {
      if (mockAllowed) {
        pago.estado = PagoSuscripcionEstado.APROBADO;
        pago.paidAt = new Date();
        pago.mpPaymentId = 'mock';
        await this.suscripcionPagoRepository.save(pago);
        await this.aplicarPlanTrasPago(usuarioId, dto.planCodigo, dto.ciclo);
        return {
          init_point: `${(process.env.LANDING_BASE_URL || 'http://localhost:3001').replace(/\/+$/, '')}/admin?suscripcion=mock_ok`,
          mock: true,
          mensaje: 'Pago simulado: plan activado (ALLOW_SUBSCRIPTION_MOCK_CHECKOUT).',
        };
      }
      throw new BadRequestException(
        'Mercado Pago no está configurado (MERCADOPAGO_ACCESS_TOKEN). En desarrollo podés usar ALLOW_SUBSCRIPTION_MOCK_CHECKOUT=true.',
      );
    }

    const landing = (process.env.LANDING_BASE_URL || 'http://localhost:3001').replace(/\/+$/, '');
    const apiPublic = (process.env.PUBLIC_API_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000').replace(
      /\/+$/,
      '',
    );

    const pref = await this.mercadoPagoCheckout.createPreference({
      title: `PuestoGo — ${plan.nombre} (${dto.ciclo})`,
      unitPrice,
      currencyId: plan.moneda,
      externalReference: externalRef,
      successUrl: `${landing}/admin?pago=ok`,
      failureUrl: `${landing}/admin?pago=error`,
      pendingUrl: `${landing}/admin?pago=pending`,
      notificationUrl: `${apiPublic}/suscripcion/webhook`,
    });

    pago.mpPreferenceId = pref.id;
    await this.suscripcionPagoRepository.save(pago);

    return { init_point: pref.init_point, preference_id: pref.id };
  }

  extractPaymentIdFromWebhook(body: Record<string, unknown>): string | null {
    const data = body?.data as Record<string, unknown> | undefined;
    if (data?.id != null) return String(data.id);
    if (typeof body?.resource === 'string' && /^\d+$/.test(body.resource)) return body.resource;
    if (typeof body?.resource === 'number') return String(body.resource);
    return null;
  }

  async procesarWebhookMercadoPago(body: Record<string, unknown>): Promise<void> {
    const paymentId = this.extractPaymentIdFromWebhook(body);
    if (!paymentId) return;
    if (!this.mercadoPagoCheckout.isConfigured()) return;

    const payment = await this.mercadoPagoCheckout.getPayment(paymentId);
    if (!payment?.external_reference) return;

    const row = await this.suscripcionPagoRepository.findOne({
      where: { externalRef: payment.external_reference },
      relations: { usuario: true },
    });
    if (!row) {
      this.logger.warn(`Pago local no encontrado para external_reference=${payment.external_reference}`);
      return;
    }
    if (row.estado === PagoSuscripcionEstado.APROBADO) return;

    if (payment.status === 'approved') {
      row.estado = PagoSuscripcionEstado.APROBADO;
      row.mpPaymentId = String(payment.id);
      row.paidAt = new Date();
      await this.suscripcionPagoRepository.save(row);
      await this.aplicarPlanTrasPago(row.usuario.id, row.planCodigo, row.ciclo);
      return;
    }

    if (payment.status === 'rejected' || payment.status === 'cancelled' || payment.status === 'refunded') {
      row.estado = PagoSuscripcionEstado.RECHAZADO;
      row.mpPaymentId = String(payment.id);
      await this.suscripcionPagoRepository.save(row);
    }
  }
}
