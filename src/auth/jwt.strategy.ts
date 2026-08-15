import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'nuol_super_secret_jwt_key_academic_prestige_2026',
    });
  }

  async validate(payload: { sub: string; userCode: string; role: string; facultyId?: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        faculty: true,
        department: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists or session expired');
    }

    const { password, ...result } = user;
    return result;
  }
}
