import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsuarioRepository } from '../../infrastructure/repositories/usuario.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async createUser(createUserDto: CreateUserDto) {
    return await this.usuarioRepository.create(createUserDto);
  }

  async findAllUsers() {
    return await this.usuarioRepository.findAll();
  }

  async findUserById(id: number) {
    const user = await this.usuarioRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateUser(id: number, updateUserDto: Partial<CreateUserDto>) {
    const updated = await this.usuarioRepository.update(id, updateUserDto);
    if (!updated) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updated;
  }

  async deleteUser(id: number) {
    const result = await this.usuarioRepository.delete(id);
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return { message: 'User deleted successfully' };
  }
}
