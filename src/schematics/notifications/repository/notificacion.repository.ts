import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Notificacion } from '../entities/notificacion.entity';
import { SearchNotificacionRequestDto } from '../dto/search-notificacion-request.dto';
import { PageDto } from 'src/common/dto/page.dto';

@Injectable()
export class NotificacionRepository extends Repository<Notificacion> {
  constructor(private dataSource: DataSource) {
    super(Notificacion, dataSource.createEntityManager());
  }

  /**
   * Lista paginada de notificaciones de un usuario, más recientes primero.
   */
  async findPageByUsuarioId(
    usuarioId: number,
    request: SearchNotificacionRequestDto,
  ): Promise<PageDto<Notificacion>> {
    const qb = this.createQueryBuilder('n')
      .innerJoin('n.usuario', 'u')
      .where('u.id = :usuarioId', { usuarioId })
      .orderBy('n.createdAt', 'DESC');

    if (request.soloNoLeidas === true) {
      qb.andWhere('n.leido = :leido', { leido: false });
    }

    const [list, count] = await qb
      .skip(request.getOffset())
      .take(request.getTake())
      .getManyAndCount();

    return new PageDto<Notificacion>(list, count);
  }

  /**
   * Busca una notificación por id asegurando que pertenece al usuario (para PATCH /read).
   */
  async findOneByIdAndUsuarioId(id: number, usuarioId: number): Promise<Notificacion | null> {
    return this.findOne({
      where: { id, usuario: { id: usuarioId } },
    });
  }

  /**
   * Marca una notificación como leída (noti02_leido = true, noti02_leido_en = NOW()).
   * Solo si la notificación pertenece al usuario. Retorna true si existía y se actualizó.
   */
  async markAsRead(id: number, usuarioId: number): Promise<boolean> {
    const result = await this.update(
      { id, usuario: { id: usuarioId } },
      { leido: true, leidoEn: new Date() },
    );
    return (result.affected ?? 0) > 0;
  }
}