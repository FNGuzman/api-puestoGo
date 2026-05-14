import { Injectable } from '@nestjs/common';
import { R2StorageService } from 'src/common/services/r2-storage.service';
import { Usuario } from '../entities/usuario.entity';

@Injectable()
export class UsuarioProfileImageService {
  constructor(private readonly storage: R2StorageService) {}

  /**
   * Multer puede devolver un objeto aunque el input file esté vacío (p. ej. size 0 en multipart).
   */
  hasFotoUpload(file?: Express.Multer.File): boolean {
    if (!file) return false;
    if (typeof file.size === 'number' && file.size > 0) return true;
    return (file.buffer?.length ?? 0) > 0;
  }

  async uploadFotoPerfil(file: Express.Multer.File): Promise<string> {
    const timestamp = Date.now();
    const nombreArchivoLimpio = file.originalname?.replace(/[^a-zA-Z0-9.-]/g, '_') ?? 'foto-perfil';
    const claveArchivo = `fotos-perfiles/${nombreArchivoLimpio}_${timestamp}`;
    const result = await this.storage.subirImagenOptimizada(
      file.buffer,
      claveArchivo,
      file.mimetype,
    );
    return result.url;
  }

  async resolveFotoPerfil(
    usuario: Usuario,
    urlFotoPerfil?: string | null,
    file?: Express.Multer.File,
  ): Promise<string | null> {
    if (this.hasFotoUpload(file)) {
      if (usuario.fotoPerfil) {
        await this.deleteFotoFromUrl(usuario.fotoPerfil);
      }
      return this.uploadFotoPerfil(file!);
    }

    if (urlFotoPerfil !== undefined) {
      const nuevaUrl = urlFotoPerfil?.trim() || null;
      if (nuevaUrl === null && usuario.fotoPerfil) {
        await this.deleteFotoFromUrl(usuario.fotoPerfil);
      }
      return nuevaUrl;
    }

    if (usuario.fotoPerfil) {
      await this.deleteFotoFromUrl(usuario.fotoPerfil);
    }

    return null;
  }

  private async deleteFotoFromUrl(url: string): Promise<void> {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const clave = pathname.startsWith('/') ? pathname.slice(1) : pathname;
      if (clave) await this.storage.eliminarArchivo(clave);
    } catch (e) {
      console.warn('No se pudo eliminar la imagen anterior:', (e as Error).message);
    }
  }
}
