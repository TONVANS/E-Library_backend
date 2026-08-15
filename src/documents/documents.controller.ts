import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto, UpdateDocumentStatusDto } from './dto/create-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';

const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // Public/Student/Teacher catalog query
  @Get()
  async findAll(@Query() query: QueryDocumentDto, @Req() req: any) {
    // Optional auth check (e.g. from token if present in headers)
    const currentUser = req.user;
    return this.documentsService.findAll(query, currentUser);
  }

  // Backoffice document table for Admin and Teachers
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Get('backoffice')
  async findBackoffice(@Query() query: QueryDocumentDto, @CurrentUser() currentUser: any) {
    return this.documentsService.findBackoffice(query, currentUser);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.findOne(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
      ],
      {
        storage: multerStorage,
        limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
      },
    ),
  )
  async create(
    @Body() dto: CreateDocumentDto,
    @UploadedFiles()
    files: { file?: Express.Multer.File[]; cover?: Express.Multer.File[] },
    @CurrentUser() currentUser: any,
  ) {
    const fileUrl = files?.file?.[0] ? `/uploads/${files.file[0].filename}` : dto.fileUrl;
    const coverUrl = files?.cover?.[0] ? `/uploads/${files.cover[0].filename}` : dto.coverUrl;

    if (!fileUrl) {
      throw new BadRequestException('A document file or valid fileUrl is required');
    }

    return this.documentsService.create(dto, currentUser, fileUrl, coverUrl);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
      ],
      {
        storage: multerStorage,
        limits: { fileSize: 50 * 1024 * 1024 },
      },
    ),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @UploadedFiles()
    files: { file?: Express.Multer.File[]; cover?: Express.Multer.File[] },
    @CurrentUser() currentUser: any,
  ) {
    const fileUrl = files?.file?.[0] ? `/uploads/${files.file[0].filename}` : undefined;
    const coverUrl = files?.cover?.[0] ? `/uploads/${files.cover[0].filename}` : undefined;

    return this.documentsService.update(id, dto, currentUser, fileUrl, coverUrl);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentStatusDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.documentsService.updateStatus(id, dto.status, currentUser);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.documentsService.remove(id, currentUser);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const docInfo = await this.documentsService.recordDownload(id, req.user);
    if (docInfo.fileUrl.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), docInfo.fileUrl);
      if (existsSync(filePath)) {
        return res.download(filePath, `${docInfo.title}.pdf`);
      }
    }
    // Fallback or external link redirect
    return res.redirect(docInfo.fileUrl);
  }
}
