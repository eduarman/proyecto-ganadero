import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AppConfigService } from '../../config/app-config.service';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RecuperarPasswordDto } from './dto/recuperar-password.dto';
import { ReenviarVerificacionDto } from './dto/reenviar-verificacion.dto';
import { RegistroDto } from './dto/registro.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SwitchTenantDto } from './dto/switch-tenant.dto';
import { VerificarEmailDto } from './dto/verificar-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from './jwt-payload.interface';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/auth';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfigService,
  ) {}

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      // 'none' (no 'strict') porque frontend (Cloudflare Pages) y backend
      // viven en dominios distintos — un cookie SameSite=Strict/Lax nunca
      // se envía en un fetch() cross-site, aunque withCredentials sea true.
      sameSite: 'none',
      path: REFRESH_COOKIE_PATH,
      maxAge: this.config.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
    });
  }

  private readRefreshCookie(req: Request): string {
    const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException('Sesión inválida');
    }
    return token;
  }

  @Post('registro')
  @Throttle({ default: { limit: 20, ttl: 900_000 } })
  async registro(@Body() dto: RegistroDto) {
    return this.authService.registro(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 900_000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto.email, dto.password, req.ip ?? 'unknown');
    this.setRefreshCookie(res, result.refreshToken);
    const { refreshToken: _refreshToken, ...body } = result;
    return body;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = this.readRefreshCookie(req);
    const result = await this.authService.refresh(rawToken);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = this.readRefreshCookie(req);
    await this.authService.logout(rawToken);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
    return { ok: true };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.sub);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
    return { ok: true };
  }

  @Post('switch-tenant')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async switchTenant(@CurrentUser() user: JwtPayload, @Body() dto: SwitchTenantDto) {
    return this.authService.switchTenant(user.sub, dto.negocioId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.me(user.sub, user.tenantId);
  }

  @Post('recuperar-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 900_000 } })
  async recuperarPassword(@Body() dto: RecuperarPasswordDto) {
    await this.authService.recuperarPassword(dto.email);
    return { mensaje: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { ok: true };
  }

  @Post('verificar-email')
  @HttpCode(HttpStatus.OK)
  async verificarEmail(@Body() dto: VerificarEmailDto) {
    await this.authService.verificarEmail(dto.token);
    return { ok: true };
  }

  @Post('reenviar-verificacion')
  @HttpCode(HttpStatus.OK)
  async reenviarVerificacion(@Body() dto: ReenviarVerificacionDto) {
    await this.authService.reenviarVerificacion(dto.email);
    return { mensaje: 'Si el email existe y no está verificado, recibirás un nuevo enlace.' };
  }
}
