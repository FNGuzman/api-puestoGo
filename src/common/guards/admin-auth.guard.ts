import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AUTH_CONSTANTS } from '../constants/constants';

/**
 * Guard que SOLO acepta tokens de AUTH externa (admins).
 * Rechaza tokens de nuestra API (usuarios comunes).
 * 
 * Valida que el token sea válido usando JWT_SECRET y que tenga la estructura
 * de un token de AUTH externa (con campo 'id').
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Token de autorización no encontrado o formato inválido');
        }

        const token = authHeader.substring(7); // Remover 'Bearer '
        const authSecret = process.env.JWT_SECRET;

        if (!authSecret) {
            throw new UnauthorizedException('JWT_SECRET no configurado. No se pueden validar tokens de admin.');
        }

        try {
            const decoded = jwt.verify(token, authSecret);

            if (typeof decoded === 'string') {
                throw new UnauthorizedException('Formato de token inválido');
            }

            const payload = decoded as any;

            // Validar que sea un token de AUTH externa (debe tener 'id')
            if (!payload.id) {
                throw new ForbiddenException('Este endpoint solo es accesible para administradores con token de AUTH externa');
            }

            // Poblar request.user con la estructura de AUTH externa
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
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            if (error instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedException('Token expirado');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                // Si el error es de firma inválida, probablemente es un token de nuestra API
                if (error.message === 'invalid signature') {
                    throw new ForbiddenException('Este endpoint solo es accesible para administradores con token de AUTH externa');
                }
                throw new UnauthorizedException(`Token inválido: ${error.message}`);
            }
            throw new UnauthorizedException(`Error al procesar el token: ${error.message}`);
        }
    }
}

/**
 * Guard que SOLO acepta tokens de AUTH externa con rol de admin.
 * Valida que el token sea de AUTH externa Y que el rolId sea el id especifico de administrador del sistema auth
 */
@Injectable()
export class AdminRoleAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Token de autorización no encontrado o formato inválido');
        }

        const token = authHeader.substring(7); // Remover 'Bearer '
        const authSecret = process.env.JWT_SECRET;

        if (!authSecret) {
            throw new UnauthorizedException('JWT_SECRET no configurado. No se pueden validar tokens de admin.');
        }

        try {
            const decoded = jwt.verify(token, authSecret);

            if (typeof decoded === 'string') {
                throw new UnauthorizedException('Formato de token inválido');
            }

            const payload = decoded as any;

            // Validar que sea un token de AUTH externa (debe tener 'id')
            if (!payload.id) {
                throw new ForbiddenException('Este endpoint solo es accesible para administradores con token de AUTH externa');
            }

            // Validar que el rolId sea 56 (Administrador de Oficios)
            const rolId = Number(payload.rolId);
            if (!rolId || rolId !== AUTH_CONSTANTS.ADMIN_ROLE_ID) {
                throw new ForbiddenException(`Este endpoint requiere permisos de administrador (rolId: ${AUTH_CONSTANTS.ADMIN_ROLE_ID})`);
            }

            // Poblar request.user con la estructura de AUTH externa
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
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            if (error instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedException('Token expirado');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                // Si el error es de firma inválida, probablemente es un token de nuestra API
                if (error.message === 'invalid signature') {
                    throw new ForbiddenException('Este endpoint solo es accesible para administradores con token de AUTH externa');
                }
                throw new UnauthorizedException(`Token inválido: ${error.message}`);
            }
            throw new UnauthorizedException(`Error al procesar el token: ${error.message}`);
        }
    }
}
