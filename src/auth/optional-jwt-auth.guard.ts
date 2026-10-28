import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Attaches req.user when a valid Bearer token is sent, but lets guests through.
// Used on public endpoints that still need to apply role/faculty rules.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) return null;
    return user;
  }
}
