import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';

@WebSocketGateway({
  cors: {
    origin: [
      process.env.WEB_URL ?? 'http://localhost:3000',
      process.env.MOBILE_ORIGIN ?? 'mymanager://app',
    ],
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.data.is_superadmin = payload.is_superadmin;

      // Join user's workspace rooms
      const memberships = await this.prisma.workspaceMember.findMany({
        where: { user_id: payload.sub },
        select: { workspace_id: true },
      });
      memberships.forEach((m) => client.join(`workspace:${m.workspace_id}`));

      // Superadmins join the superadmin room
      if (payload.is_superadmin) {
        client.join('superadmin');
      }

      this.logger.log(`Client connected: ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.data?.userId ?? 'unknown'}`);
  }

  emitPostUpdate(workspaceId: string, event: string, data: unknown) {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }

  emitApprovalRequired(workspaceId: string, post: unknown) {
    this.server.to(`workspace:${workspaceId}`).emit('approval:required', post);
  }

  emitPlatformHealth(status: unknown) {
    this.server.to('superadmin').emit('platform:health', status);
  }

  emitToWorkspace(workspaceId: string, event: string, data: unknown) {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }

  emitToSuperadmin(event: string, data: unknown) {
    this.server.to('superadmin').emit(event, data);
  }
}
