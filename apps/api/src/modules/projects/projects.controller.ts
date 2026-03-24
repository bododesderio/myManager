import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects in workspace' })
  async listProjects(
    @Query('workspaceId') workspaceId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    return this.projectsService.listByWorkspace(workspaceId, safePage, safeLimit);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  async createProject(
    @Req() req: Request,
    @Body() body: {
      workspaceId: string;
      name: string;
      clientName?: string;
      clientEmail?: string;
      description?: string;
    },
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.projectsService.create(userId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project details' })
  async getProject(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.getById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project details' })
  async updateProject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { name?: string; clientName?: string; clientEmail?: string; description?: string; status?: string },
  ) {
    return this.projectsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  async deleteProject(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.delete(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List project members' })
  async listMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.listMembers(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to project' })
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { userId: string; role: string },
  ) {
    return this.projectsService.addMember(id, body.userId, body.role);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from project' })
  async removeMember(@Param('id', ParseUUIDPipe) id: string, @Param('userId') userId: string) {
    return this.projectsService.removeMember(id, userId);
  }

  @Post(':id/portal-token')
  @ApiOperation({ summary: 'Generate client portal access token' })
  async generatePortalToken(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.generatePortalToken(id);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get project-level analytics' })
  async getAnalytics(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.projectsService.getAnalytics(id, startDate, endDate);
  }
}
