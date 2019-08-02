import { Controller, Get, Post, Body, Param, Delete, Patch, Query, UsePipes, ValidationPipe, ParseIntPipe, UseGuards, Logger } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';

import { TaskStatus } from './task-status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTaskFilterDto } from './dto/get-task-filter.dto';
import { TaskStatusValidationPipes } from './pipes/task-status-validation.pipe';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../auth/user.entity';
import { GetUser } from '../auth/get-user.decorator';

@Controller('tasks')
@UseGuards(AuthGuard())
export class TasksController {
    private logger = new Logger('TasksController');
    constructor(private taskService: TasksService) { }

    @Get()
    getTasks(
        @Query(ValidationPipe) filterDto: GetTaskFilterDto,
        @GetUser() user: User,
    ): Promise<Task[]> {
        this.logger.verbose(`User "${user.username}" retrieving all tasks. Filters: ${JSON.stringify(filterDto)}`)
        return this.taskService.getTasks(filterDto, user);
    }

    @Get('/:id')
    getTaskById(@Param('id', ParseIntPipe) id: number, @GetUser() user: User, ): Promise<Task> {
        return this.taskService.getTaskById(id, user);
    }

    @Post()
    @UsePipes(ValidationPipe)
    createTask(
        @Body() createTaskDto: CreateTaskDto,
        @GetUser() user: User,
    ): Promise<Task> {
        this.logger.verbose(`User "${user.username}" creating a new task. Data: ${JSON.stringify(createTaskDto)}`)
        return this.taskService.createTask(createTaskDto, user);
    }

    @Delete('/:id')
    deleteTask(@Param('id', ParseIntPipe) id: number, @GetUser() user: User, ): Promise<void> {
        this.logger.verbose(`User "${user.username}" deleting a task with ID: ${id}`)
        return this.taskService.deleteTask(id, user);
    }

    @Patch('/:id/status')
    updateTaskStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body('status', TaskStatusValidationPipes) status: TaskStatus,
        @GetUser() user: User,
    ): Promise<Task> {
        this.logger.verbose(`User "${user.username}" updating a task. Data: ${JSON.stringify(status)}`)
        return this.taskService.updateTaskStatus(id, status, user);
    }
}
