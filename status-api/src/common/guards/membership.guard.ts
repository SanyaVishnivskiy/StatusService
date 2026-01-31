import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class MembershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const groupId = request.params.groupId;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!groupId) {
      throw new ForbiddenException('Group ID not provided');
    }

    const groupObjectId = new Types.ObjectId(groupId);
    const isMember = user.groups.some((g: any) => g.groupId.equals(groupObjectId));

    if (!isMember) {
      throw new ForbiddenException('User is not a member of this group');
    }

    return true;
  }
}
