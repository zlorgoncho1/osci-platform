import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsNotEmpty, IsString } from 'class-validator';
import { TaskComment } from './entities/task-comment.entity';

/** DTO for request body - only content; author is inferred from JWT */
export class CreateTaskCommentDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export interface CreateTaskCommentInput {
  content: string;
  authorId: string;
  authorName: string;
}

@Injectable()
export class TaskCommentsService {
  constructor(
    @InjectRepository(TaskComment)
    private readonly commentRepo: Repository<TaskComment>,
  ) {}

  async findByTask(taskId: string): Promise<TaskComment[]> {
    return this.commentRepo.find({
      where: { taskId },
      order: { createdAt: 'ASC' },
    });
  }

  async create(taskId: string, input: CreateTaskCommentInput): Promise<TaskComment> {
    const comment = this.commentRepo.create({
      taskId,
      authorId: input.authorId,
      authorName: input.authorName,
      content: input.content,
    });
    return this.commentRepo.save(comment);
  }

  async remove(commentId: string): Promise<void> {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException(`Comment with id ${commentId} not found`);
    }
    await this.commentRepo.remove(comment);
  }
}
