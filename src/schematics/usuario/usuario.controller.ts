import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { UsuarioService } from './usuario.service';
import { SearchUsuarioRequestDto } from './dto/search-usuario-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { UsuarioDTO } from './dto/usuario.dto';
import { plainToInstance } from 'class-transformer';
import { FlexibleJwtAuthGuard } from 'src/common/guards/flexible-jwt-auth.guard';
import { AdminAuthGuard } from 'src/common/guards/admin-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { SwaggerUpdateUsuarioRequestDto } from './dto/swagger-usuario-request.dto';

@ApiTags('Usuario')
@Controller('usuario')
export class UsuarioController {
  constructor(private usuarioService: UsuarioService) {}

  @Get('search')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Buscar usuarios',
    description:
      'Busca usuarios con filtros opcionales (solo administradores AUTH externa)',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiOkResponse({
    type: PageDto<UsuarioDTO>,
    description: 'Lista paginada de Usuarios',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  async search(
    @Query() request: SearchUsuarioRequestDto,
  ): Promise<PageDto<UsuarioDTO>> {
    const req = plainToInstance(SearchUsuarioRequestDto, request);
    return await this.usuarioService.search(req);
  }

  @Patch(':id')
  @UseGuards(FlexibleJwtAuthGuard)
  @ApiBearerAuth('authorization')
  @UseInterceptors(FileInterceptor('fotoPerfil'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Actualizar un Usuario',
    description:
      'Permite actualizar los datos del usuario, incluyendo foto de perfil opcional.',
  })
  @ApiParam({ name: 'id', required: true, description: 'ID del Usuario' })
  @ApiBody({
    type: SwaggerUpdateUsuarioRequestDto,
    description: 'Datos nuevos del Usuario',
  })
  @ApiOkResponse({
    type: UsuarioDTO,
    description: 'Usuario actualizado correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el usuario' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioRequestDto: SwaggerUpdateUsuarioRequestDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UsuarioDTO> {
    return await this.usuarioService.update(
      id,
      updateUsuarioRequestDto,
      req.user,
      file,
    );
  }

  @Get(':id')
  @UseGuards(FlexibleJwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Obtener una entidad Usuario',
    description:
      'Obtiene un usuario por su ID (solo el propio usuario o un administrador)',
  })
  @ApiParam({ name: 'id', required: true, description: 'ID de Usuario' })
  @ApiOkResponse({
    type: UsuarioDTO,
    description: 'Usuario obtenido correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el usuario' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findOne(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UsuarioDTO> {
    return await this.usuarioService.findOne(id, req.user);
  }

  @Delete(':id')
  @UseGuards(FlexibleJwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Eliminar Usuario',
    description:
      'Elimina un usuario por su ID, solo se puede eliminar si es admin o el usuario es el mismo',
  })
  @ApiParam({ name: 'id', required: true, description: 'ID del Usuario' })
  @ApiOkResponse({ description: 'Usuario eliminado correctamente' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el usuario' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async delete(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<string> {
    return await this.usuarioService.remove(id, req.user);
  }
}
