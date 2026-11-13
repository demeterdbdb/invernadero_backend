import { Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto, EliminarUsuarioDto } from './dto/update-usuario.dto.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}
  async create(createUsuarioDto: CreateUsuarioDto){
    const usuarioNuevo = this.usuarioRepository.create(createUsuarioDto);
    return await this.usuarioRepository.save(usuarioNuevo);
  }
  async findAll() {
    return await this.usuarioRepository.find();
  }

  async findOne(id: number) {
    const usuario = await this.usuarioRepository.findOneBy({id});
    if(!usuario){
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }
  async findByEmail (correo:string){
    return await this.usuarioRepository.findOneBy({correo});
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    await this.usuarioRepository.update(id, updateUsuarioDto);
    return this.findOne(id);
  }

  async eliminar(id: number) {
    const usuario = await this.findOne(id);
    if (usuario){
      return await this.usuarioRepository.update(id, {eliminado:true});
    } else {
      throw new NotFoundException('Usuario no encontrado');
    }
  }
}
