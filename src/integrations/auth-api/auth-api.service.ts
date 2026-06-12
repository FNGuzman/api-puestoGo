import { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import { Injectable, Inject } from '@nestjs/common';
import { CreateUsuarioAuthRequestDto } from './dto/create-usuario-request.dto';
import { UpdateUsuarioAuthRequestDto } from './dto/update-usuario-request.dto';

@Injectable()
export class ExternalAuthApiService {
  constructor(
    @Inject('AXIOS_INSTANCE') private readonly axios: AxiosInstance,
    private readonly configService: ConfigService,
  ) {}

  private getAuthApiUrl(): string {
    return (
      this.configService.get('AUTH_API_URL') ||
      'https://auth.pushsoftware.com.ar'
    );
  }

  public async getUsuarioData(userId: number): Promise<any> {
    try {
      const usuarioResponse = await this.axios.get(
        `${this.getAuthApiUrl()}/usuario/search?id=${userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Datos obtenidos de API Usuario:', usuarioResponse.data);
      return usuarioResponse.data;
    } catch (error) {
      console.warn(
        `No se pudieron obtener datos de usuario para userId ${userId}:`,
        (error as Error).message,
      );
      return null;
    }
  }

  public async getAuthData(userId: number): Promise<any> {
    try {
      const personaResponse = await this.axios.get(
        `${this.getAuthApiUrl()}/PersonaOut/user/${userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const personaData = personaResponse.data;
      const usuarioData = await this.getUsuarioData(userId);

      let rol: { id: any; nombre: any; descripcion: any } | null = null;
      if (usuarioData?.data && usuarioData.data.length > 0) {
        const usuario = usuarioData.data[0];
        if (usuario.permiso && usuario.permiso.length > 0) {
          const primerPermiso = usuario.permiso[0];
          if (primerPermiso.rol) {
            rol = {
              id: primerPermiso.rol.id,
              nombre: primerPermiso.rol.nombre,
              descripcion: primerPermiso.rol.descripcion,
            };
          }
        }
      }

      const combinedData = {
        ...personaData,
        rol,
      };

      console.log('Datos combinados de API Auth:', combinedData);
      return combinedData;
    } catch (error) {
      console.warn(
        `No se pudieron obtener datos de auth para userId ${userId}:`,
        (error as Error).message,
      );
      return null;
    }
  }

  public async createAuthUser(request: CreateUsuarioAuthRequestDto) {
    const authPayload = {
      nombre: request.nombre,
      apellido: request.apellido,
      cuil: request.cuil,
      genero: request.genero,
      email: request.email,
      password: request.password,
      repeatPassword: request.repeatPassword,
      sistema: request.sistema,
      organizacion: request.organizacion,
      rol: request.rol,
    };

    try {
      const authResponse = await this.axios.post(
        `${this.getAuthApiUrl()}/PersonaOut/create`,
        authPayload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Usuario creado en API Auth:', authResponse.data);
      return authResponse.data;
    } catch (error: any) {
      console.error('Error al crear usuario en API Auth:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        payload: authPayload,
      });
      throw error;
    }
  }

  public async updateAuthUser(
    userId: number,
    request: UpdateUsuarioAuthRequestDto,
  ) {
    const { rol, ...otrosCampos } = request;
    const authPayload = {
      nombre: otrosCampos.nombre,
      apellido: otrosCampos.apellido,
      cuil: otrosCampos.cuil,
      genero: otrosCampos.genero,
      email: otrosCampos.email,
    };

    const filteredPayload = Object.fromEntries(
      Object.entries(authPayload).filter(([_, value]) => value !== undefined),
    );

    let personaResponse: { data: any } | null = null;
    if (Object.keys(filteredPayload).length > 0) {
      personaResponse = await this.axios.patch(
        `${this.getAuthApiUrl()}/PersonaOut/${userId}`,
        filteredPayload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      console.log(
        'Usuario actualizado en API Auth (PersonaOut):',
        personaResponse?.data,
      );
    }

    if (rol !== undefined) {
      try {
        const usuarioData = await this.getUsuarioData(userId);

        if (usuarioData?.data && usuarioData.data.length > 0) {
          const usuario = usuarioData.data[0];
          if (usuario.permiso && usuario.permiso.length > 0) {
            const primerPermiso = usuario.permiso[0];
            const permisoId = primerPermiso.id;

            const permisoResponse = await this.axios.patch(
              `${this.getAuthApiUrl()}/permiso/${permisoId}`,
              { rol: rol },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );
            console.log(
              'Rol actualizado en API Auth (Permiso):',
              permisoResponse.data,
            );
          } else {
            console.warn(`No se encontro permiso para el usuario ${userId}`);
          }
        } else {
          console.warn(`No se encontraron datos de usuario para ${userId}`);
        }
      } catch (error: any) {
        console.error('Error al actualizar el rol:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      }
    }

    return personaResponse ? personaResponse.data : null;
  }

  public hasAuthData(request: UpdateUsuarioAuthRequestDto): boolean {
    return !!(
      request.nombre ||
      request.apellido ||
      request.cuil ||
      request.genero ||
      request.email ||
      request.rol
    );
  }
}
