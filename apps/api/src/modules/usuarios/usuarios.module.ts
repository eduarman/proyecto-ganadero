import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InvitacionesPublicasController } from './invitaciones-publicas.controller';
import { PerfilController } from './perfil.controller';
import { PerfilService } from './perfil.service';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [AuthModule],
  controllers: [UsuariosController, InvitacionesPublicasController, PerfilController],
  providers: [UsuariosService, PerfilService],
})
export class UsuariosModule {}
