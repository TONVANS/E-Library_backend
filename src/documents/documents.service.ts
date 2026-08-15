import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto, UpdateDocumentDto, UpdateDocumentStatusDto } from './dto/create-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { Role, DocStatus } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  private parseTags(tags: any): string[] {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags.map(t => String(t).trim()).filter(Boolean);
    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) return parsed.map(t => String(t).trim()).filter(Boolean);
      } catch {
        return tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }
    return [];
  }

  async findAll(query: QueryDocumentDto, currentUser?: any) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 12, 1);
    const skip = (page - 1) * limit;

    const where: any = {};

    // 🔴 RBAC & Faculty Isolation Logic:
    // If not Admin, user MUST only see AVAILABLE documents from their own faculty.
    if (!currentUser || currentUser.role !== Role.ADMIN) {
      where.status = DocStatus.AVAILABLE;
      if (currentUser?.facultyId) {
        where.facultyId = currentUser.facultyId;
      }
    } else {
      // Admin can filter by status and faculty freely
      if (query.status) {
        where.status = query.status;
      }
      if (query.facultyId) {
        where.facultyId = Number(query.facultyId);
      }
    }

    if (query.categoryId) {
      where.categoryId = Number(query.categoryId);
    }

    if (query.departmentId) {
      where.departmentId = Number(query.departmentId);
    }

    if (query.publishedYear) {
      where.publishedYear = Number(query.publishedYear);
    }

    if (query.tag) {
      where.tags = { has: query.tag.trim() };
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { author: { contains: s, mode: 'insensitive' } },
        { abstract: { contains: s, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    orderBy[sortField] = sortOrder;

    const [total, documents] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          faculty: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true } },
          _count: {
            select: { userActivities: true },
          },
        },
      }),
    ]);

    return {
      data: documents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Backoffice listing for Admin / Teacher
  async findBackoffice(query: QueryDocumentDto, currentUser: any) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (currentUser.role === Role.TEACHER) {
      // Teachers manage their own faculty's documents
      if (!currentUser.facultyId) {
        throw new ForbiddenException('Teacher is not assigned to any faculty');
      }
      where.facultyId = currentUser.facultyId;
    } else if (currentUser.role === Role.ADMIN) {
      if (query.facultyId) {
        where.facultyId = Number(query.facultyId);
      }
    } else {
      throw new ForbiddenException('Students do not have backoffice access');
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.categoryId) {
      where.categoryId = Number(query.categoryId);
    }

    if (query.departmentId) {
      where.departmentId = Number(query.departmentId);
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { author: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, documents] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: true,
          faculty: true,
          department: true,
          _count: {
            select: { userActivities: true },
          },
        },
      }),
    ]);

    return {
      data: documents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser?: any) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        category: true,
        faculty: true,
        department: true,
        _count: {
          select: { userActivities: true },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Role check & Faculty isolation check
    if (currentUser && currentUser.role !== Role.ADMIN) {
      if (currentUser.facultyId && document.facultyId !== currentUser.facultyId) {
        throw new ForbiddenException('You do not have permission to view documents outside your faculty');
      }
      if (document.status === DocStatus.UNAVAILABLE && currentUser.role === Role.STUDENT) {
        throw new NotFoundException('This document is currently unavailable');
      }
    }

    // Auto-record VIEW activity if user is authenticated
    if (currentUser?.id) {
      await this.prisma.userActivity.create({
        data: {
          userId: currentUser.id,
          documentId: document.id,
          actionType: 'VIEW',
        },
      }).catch(() => {}); // non-blocking activity log
    }

    return document;
  }

  async create(dto: CreateDocumentDto, currentUser: any, fileUrl: string, coverUrl?: string) {
    let facultyId: number;

    if (currentUser.role === Role.TEACHER) {
      if (!currentUser.facultyId) {
        throw new ForbiddenException('Teacher must belong to a faculty to create documents');
      }
      facultyId = currentUser.facultyId;
    } else if (currentUser.role === Role.ADMIN) {
      if (!dto.facultyId) {
        throw new BadRequestException('Faculty ID is required for document creation');
      }
      facultyId = Number(dto.facultyId);
    } else {
      throw new ForbiddenException('Students cannot create documents');
    }

    const tags = this.parseTags(dto.tags);

    return this.prisma.document.create({
      data: {
        title: dto.title.trim(),
        abstract: dto.abstract ? dto.abstract.trim() : null,
        author: dto.author.trim(),
        publishedYear: dto.publishedYear ? Number(dto.publishedYear) : new Date().getFullYear(),
        status: dto.status || DocStatus.AVAILABLE,
        fileUrl: fileUrl || dto.fileUrl || '/uploads/default-sample.pdf',
        coverUrl: coverUrl || dto.coverUrl || null,
        tags,
        categoryId: Number(dto.categoryId),
        facultyId,
        departmentId: dto.departmentId ? Number(dto.departmentId) : null,
      },
      include: {
        category: true,
        faculty: true,
        department: true,
      },
    });
  }

  async update(id: string, dto: UpdateDocumentDto, currentUser: any, fileUrl?: string, coverUrl?: string) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Check ownership/permissions
    if (currentUser.role === Role.TEACHER) {
      if (document.facultyId !== currentUser.facultyId) {
        throw new ForbiddenException('Teachers can only update documents within their own faculty');
      }
    } else if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Permission denied');
    }

    const tags = dto.tags !== undefined ? this.parseTags(dto.tags) : undefined;

    return this.prisma.document.update({
      where: { id },
      data: {
        title: dto.title ? dto.title.trim() : undefined,
        abstract: dto.abstract !== undefined ? (dto.abstract ? dto.abstract.trim() : null) : undefined,
        author: dto.author ? dto.author.trim() : undefined,
        publishedYear: dto.publishedYear ? Number(dto.publishedYear) : undefined,
        status: dto.status,
        fileUrl: fileUrl || dto.fileUrl || undefined,
        coverUrl: coverUrl || dto.coverUrl || undefined,
        tags,
        categoryId: dto.categoryId ? Number(dto.categoryId) : undefined,
        facultyId: currentUser.role === Role.ADMIN && dto.facultyId ? Number(dto.facultyId) : undefined,
        departmentId: dto.departmentId !== undefined ? (dto.departmentId ? Number(dto.departmentId) : null) : undefined,
      },
      include: {
        category: true,
        faculty: true,
        department: true,
      },
    });
  }

  async updateStatus(id: string, status: DocStatus, currentUser: any) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (currentUser.role === Role.TEACHER && document.facultyId !== currentUser.facultyId) {
      throw new ForbiddenException('Teachers can only modify documents from their own faculty');
    } else if (currentUser.role !== Role.ADMIN && currentUser.role !== Role.TEACHER) {
      throw new ForbiddenException('Permission denied');
    }

    return this.prisma.document.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string, currentUser: any) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (currentUser.role === Role.TEACHER && document.facultyId !== currentUser.facultyId) {
      throw new ForbiddenException('Teachers can only delete documents from their own faculty');
    } else if (currentUser.role !== Role.ADMIN && currentUser.role !== Role.TEACHER) {
      throw new ForbiddenException('Permission denied');
    }

    await this.prisma.document.delete({ where: { id } });
    return { message: 'Document deleted successfully' };
  }

  async recordDownload(id: string, currentUser: any) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (currentUser?.id) {
      await this.prisma.userActivity.create({
        data: {
          userId: currentUser.id,
          documentId: document.id,
          actionType: 'DOWNLOAD',
        },
      });
    }

    return { fileUrl: document.fileUrl, title: document.title };
  }
}
