import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { User, UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return await this.userService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string): User {
    const user = this.userService.findById(Number(id));
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Post()
  create(@Body() userData: Omit<User, 'id'>): User {
    return this.userService.create(userData);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() userData: Partial<User>): User {
    const user = this.userService.update(Number(id), userData);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Delete(':id')
  delete(@Param('id') id: string): { success: boolean } {
    const deleted = this.userService.delete(Number(id));
    if (!deleted) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return { success: true };
  }
}
