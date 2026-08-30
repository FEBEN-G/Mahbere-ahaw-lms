import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { SetUserActiveDto } from './dto/set-user-active.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('students')
  @RequirePermissions(Permission.USER_CREATE)
  createStudent(@Body() dto: CreateStudentDto) {
    return this.usersService.createStudent(dto);
  }

  @Post('instructors')
  @RequirePermissions(Permission.USER_CREATE)
  createInstructor(@Body() dto: CreateInstructorDto) {
    return this.usersService.createInstructor(dto);
  }

  @Get()
  @RequirePermissions(Permission.USER_READ)
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query);
  }

  @Get(':id')
  @RequirePermissions(Permission.USER_READ)
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getById(id);
  }

  @Patch(':id/active')
  @RequirePermissions(Permission.USER_UPDATE)
  setActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetUserActiveDto,
  ) {
    return this.usersService.setActive(id, dto.isActive);
  }

  @Delete(':id')
  @RequirePermissions(Permission.USER_DELETE)
  softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.softDelete(id);
  }
}
