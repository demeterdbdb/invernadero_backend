import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import  {CreateUsuarioDto, LoginDto}  from '../usuarios/dto/create-usuario.dto.js';
import {AuthGuard} from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getPerfil(@Req() req:any){
    return {message:'Token válido y activo', usuarioAutenticado: req.user};
  }

  @Post('registro')
  registro(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.authService.registro(createUsuarioDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.correo, loginDto.password);
  }
}
