import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ResetPasswordDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private async generateUserCode(role: Role): Promise<string> {
    const prefix = role === Role.ADMIN ? 'AD' : role === Role.TEACHER ? 'TC' : 'ST';
    
    // Count existing users with this prefix to get next sequence
    const latestUser = await this.prisma.user.findFirst({
      where: {
        userCode: {
          startsWith: prefix,
        },
      },
      orderBy: {
        userCode: 'desc',
      },
    });

    if (!latestUser) {
      return `${prefix}001`;
    }

    const numericPart = parseInt(latestUser.userCode.replace(prefix, ''), 10);
    const nextNum = isNaN(numericPart) ? 1 : numericPart + 1;
    return `${prefix}${nextNum.toString().padStart(3, '0')}`;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
    facultyId?: number;
  }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.max(Number(params.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.role) {
      where.role = params.role;
    }

    if (params.facultyId) {
      where.facultyId = Number(params.facultyId);
    }

    if (params.search) {
      const s = params.search.trim();
      where.OR = [
        { userCode: { contains: s, mode: 'insensitive' } },
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userCode: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          facultyId: true,
          departmentId: true,
          faculty: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true } },
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        faculty: true,
        department: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { password, ...safeUser } = user;
    return safeUser;
  }

  async create(dto: CreateUserDto) {
    const role = dto.role || Role.STUDENT;
    let userCode = dto.userCode ? dto.userCode.trim().toUpperCase() : await this.generateUserCode(role);

    const existingCode = await this.prisma.user.findUnique({
      where: { userCode },
    });

    if (existingCode) {
      // If code was auto-generated and collided, bump it
      if (!dto.userCode) {
        userCode = `${userCode}_${Date.now().toString().slice(-4)}`;
      } else {
        throw new ConflictException(`User code ${userCode} is already in use`);
      }
    }

    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email.trim() },
      });
      if (existingEmail) {
        throw new ConflictException(`Email ${dto.email} is already registered`);
      }
    }

    const rawPassword = dto.password || 'Nuol@1234';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        userCode,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: dto.email ? dto.email.trim() : null,
        password: hashedPassword,
        role,
        facultyId: dto.facultyId ? Number(dto.facultyId) : null,
        departmentId: dto.departmentId ? Number(dto.departmentId) : null,
      },
      include: {
        faculty: true,
        department: true,
      },
    });

    const { password, ...safeUser } = user;
    return {
      ...safeUser,
      defaultPasswordUsed: !dto.password ? 'Nuol@1234' : undefined,
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email: dto.email.trim(),
          NOT: { id },
        },
      });
      if (existingEmail) {
        throw new ConflictException(`Email ${dto.email} is already in use by another account`);
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName ? dto.firstName.trim() : undefined,
        lastName: dto.lastName ? dto.lastName.trim() : undefined,
        email: dto.email !== undefined ? (dto.email ? dto.email.trim() : null) : undefined,
        role: dto.role,
        facultyId: dto.facultyId !== undefined ? (dto.facultyId ? Number(dto.facultyId) : null) : undefined,
        departmentId: dto.departmentId !== undefined ? (dto.departmentId ? Number(dto.departmentId) : null) : undefined,
      },
      include: {
        faculty: true,
        department: true,
      },
    });

    const { password, ...safeUser } = updated;
    return safeUser;
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    await this.findOne(id);
    const newPass = dto.newPassword || 'Nuol@1234';
    const hashedPassword = await bcrypt.hash(newPass, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return {
      message: `Password reset successfully`,
      newPassword: newPass,
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }
}
