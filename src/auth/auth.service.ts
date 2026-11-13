import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';
import {JwtService} from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly usuariosService: UsuariosService, private readonly jwtService: JwtService
  ) {}
  async registro(createUsuarioDto: CreateUsuarioDto){
    const {correo, password_hash, ...resto} = createUsuarioDto;
    const usuarioExiste = await this.usuariosService.findByEmail(correo);
    if(usuarioExiste){
      throw new BadRequestException('El orreo ya está registrado en el sistema');
    }
    const saltRounds = 10;
    const passwHash = await bcrypt.hash(password_hash, saltRounds);

    return await this.usuariosService.create({...resto, correo, password_hash: passwHash});
  }

  async login(correo:string, password: string){
    const usuario = await this.usuariosService.findByEmail(correo);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const esValida = await bcrypt.compare(password, usuario.password_hash);
    if (!esValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const payload = {sub:usuario.id, correo:usuario.correo, rol: usuario.rol};
    return {message:'Login exitoso',
      token: await this.jwtService.signAsync(payload)};
  }
  

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }
}
