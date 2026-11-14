import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import  {CreateUsuarioDto, LoginDto}  from '../usuarios/dto/create-usuario.dto.js';
import { Public } from './decorators/public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Get('me')
  getPerfil(@Req() req:any){
    return {message:'Token válido y activo', usuarioAutenticado: req.user};
  }

  @Public()
  @Post('registro')
  registro(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.authService.registro(createUsuarioDto);
  }

  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.correo, loginDto.password);
  }
}
