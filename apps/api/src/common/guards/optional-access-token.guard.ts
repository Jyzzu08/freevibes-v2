import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAccessTokenGuard extends AuthGuard('jwt') {
  override canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<{ headers?: { authorization?: string } }>();

    if (!request.headers?.authorization) {
      return true;
    }

    return super.canActivate(context);
  }

  override handleRequest<TUser = unknown>(_err: unknown, user: TUser) {
    return user;
  }
}
