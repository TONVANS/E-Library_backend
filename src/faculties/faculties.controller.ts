import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { FacultiesService } from './faculties.service';
import { CreateFacultyDto, UpdateFacultyDto } from './dto/create-faculty.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/create-department.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('faculties')
export class FacultiesController {
  constructor(private readonly facultiesService: FacultiesService) {}

  // List all faculties (Available to all users)
  @Get()
  async findAll() {
    return this.facultiesService.findAllFaculties();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.facultiesService.findOneFaculty(id);
  }

  // Admin restricted mutations
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async createFaculty(@Body() dto: CreateFacultyDto) {
    return this.facultiesService.createFaculty(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async updateFaculty(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFacultyDto) {
    return this.facultiesService.updateFaculty(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async removeFaculty(@Param('id', ParseIntPipe) id: number) {
    return this.facultiesService.removeFaculty(id);
  }

  // Departments
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/departments')
  async createDepartment(
    @Param('id', ParseIntPipe) facultyId: number,
    @Body() dto: CreateDepartmentDto,
  ) {
    dto.facultyId = facultyId;
    return this.facultiesService.createDepartment(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('departments/:deptId')
  async updateDepartment(
    @Param('deptId', ParseIntPipe) deptId: number,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.facultiesService.updateDepartment(deptId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('departments/:deptId')
  async removeDepartment(@Param('deptId', ParseIntPipe) deptId: number) {
    return this.facultiesService.removeDepartment(deptId);
  }
}
