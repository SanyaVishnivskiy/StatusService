import { createParamDecorator } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (data: any, ctx: any) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);