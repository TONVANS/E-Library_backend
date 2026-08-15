import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacultyDto, UpdateFacultyDto } from './dto/create-faculty.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class FacultiesService {
  constructor(private prisma: PrismaService) {}

  async findAllFaculties() {
    return this.prisma.faculty.findMany({
      include: {
        departments: {
          include: {
            _count: {
              select: { users: true, documents: true },
            },
          },
        },
        _count: {
          select: { users: true, documents: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneFaculty(id: number) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      include: {
        departments: true,
        _count: {
          select: { users: true, documents: true },
        },
      },
    });

    if (!faculty) {
      throw new NotFoundException(`Faculty with ID ${id} not found`);
    }

    return faculty;
  }

  async createFaculty(dto: CreateFacultyDto) {
    const existing = await this.prisma.faculty.findUnique({
      where: { name: dto.name.trim() },
    });

    if (existing) {
      throw new ConflictException(`Faculty '${dto.name}' already exists`);
    }

    return this.prisma.faculty.create({
      data: {
        name: dto.name.trim(),
        code: dto.code ? dto.code.trim().toUpperCase() : null,
      },
      include: {
        departments: true,
      },
    });
  }

  async updateFaculty(id: number, dto: UpdateFacultyDto) {
    await this.findOneFaculty(id);

    return this.prisma.faculty.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : undefined,
        code: dto.code !== undefined ? (dto.code ? dto.code.trim().toUpperCase() : null) : undefined,
      },
      include: {
        departments: true,
      },
    });
  }

  async removeFaculty(id: number) {
    await this.findOneFaculty(id);
    await this.prisma.faculty.delete({ where: { id } });
    return { message: 'Faculty and associated departments deleted successfully' };
  }

  // ----------------------------------------------------
  // Department Actions
  // ----------------------------------------------------

  async createDepartment(dto: CreateDepartmentDto) {
    await this.findOneFaculty(Number(dto.facultyId));

    const existing = await this.prisma.department.findUnique({
      where: {
        name_facultyId: {
          name: dto.name.trim(),
          facultyId: Number(dto.facultyId),
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Department '${dto.name}' already exists in this faculty`);
    }

    return this.prisma.department.create({
      data: {
        name: dto.name.trim(),
        facultyId: Number(dto.facultyId),
      },
    });
  }

  async updateDepartment(id: number, dto: UpdateDepartmentDto) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return this.prisma.department.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : undefined,
        facultyId: dto.facultyId ? Number(dto.facultyId) : undefined,
      },
    });
  }

  async removeDepartment(id: number) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    await this.prisma.department.delete({ where: { id } });
    return { message: 'Department deleted successfully' };
  }
}
