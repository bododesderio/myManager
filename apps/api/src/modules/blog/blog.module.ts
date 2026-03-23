import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlogPublicController, BlogAdminController } from './blog.controller';
import { BlogService } from './blog.service';

@Module({
  imports: [ConfigModule],
  controllers: [BlogPublicController, BlogAdminController],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}
