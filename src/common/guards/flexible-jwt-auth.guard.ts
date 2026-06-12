import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

/**
 * Guard que acepta tokens de dos orígenes:
 *
 * - JWT_SECRET: tokens del sistema de AUTH externo (payload.id).
 *
 * - ACCESS_TOKEN_SECRET: tokens de esta API (login/signup), payload con 'sub'.
 *
 * Siempre se normaliza request.user.id para que los controllers puedan usar req.user.id.
 */
@Injectable()
export class FlexibleJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Token de autorización no encontrado o formato inválido',
      );
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Intentar primero con JWT_SECRET (token de AUTH externa)
    const authSecret = process.env.JWT_SECRET;
    if (authSecret) {
      try {
        const decoded = jwt.verify(token, authSecret);

        if (typeof decoded === 'string') {
          throw new UnauthorizedException('Formato de token inválido');
        }

        const payload = decoded as any;

        // Solo AUTH externa: payload con 'id'
        if (payload.id != null) {
          request.user = {
            id: Number(payload.id),
            email: payload.email,
            nombre: payload.nombre,
            apellido: payload.apellido,
            cuil: payload.cuil,
            sistemaId: payload.sistemaId,
            sistema: payload.sistema,
            rol: payload.rol,
            rolId: payload.rolId,
            iat: payload.iat,
            exp: payload.exp,
          };
          return true;
        }
      } catch (error) {
        // Si es error de firma inválida, continuar al siguiente intento
        // Si es otro error (expirado, etc), lo relanzamos
        if (error instanceof jwt.TokenExpiredError) {
          throw new UnauthorizedException('Token expirado');
        }
        // Si no es error de firma, continuar al siguiente intento
        if (
          !(
            error instanceof jwt.JsonWebTokenError &&
            error.message === 'invalid signature'
          )
        ) {
          // Si es otro error de JWT, continuar al siguiente intento
        }
      }
    }

    // Intentar con ACCESS_TOKEN_SECRET (tokens de esta API: login/signup)
    const apiSecret = process.env.ACCESS_TOKEN_SECRET;
    if (apiSecret) {
      try {
        const decoded = jwt.verify(token, apiSecret);

        if (typeof decoded === 'string') {
          throw new UnauthorizedException('Formato de token inválido');
        }

        const payload = decoded as any;

        // Token de nuestra API: payload con 'sub'
        if (payload.sub != null) {
          request.user = {
            id: Number(payload.sub),
            sub: Number(payload.sub),
            email: payload.email,
            iat: payload.iat,
            exp: payload.exp,
          };
          return true;
        }
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          throw new UnauthorizedException('Token expirado');
        }
        if (error instanceof jwt.JsonWebTokenError) {
          throw new UnauthorizedException(`Token inválido: ${error.message}`);
        }
        throw new UnauthorizedException(
          `Error al procesar el token: ${error.message}`,
        );
      }
    }

    // Si llegamos aquí, ningún token fue válido
    throw new UnauthorizedException(
      'Token inválido: no se pudo validar con ningún secret configurado',
    );
  }
}
