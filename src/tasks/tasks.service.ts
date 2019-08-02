import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Task } from './task.entity';

import { TaskStatus } from './task-status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTaskFilterDto } from './dto/get-task-filter.dto';
import { TaskRepository } from './task.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/user.entity';

@Injectable()
export class TasksService {
    private logger = new Logger("TasksService");
    constructor(
        @InjectRepository(TaskRepository)
        private taskRepository: TaskRepository,
    ) {

    }

    getTasks(filterDto: GetTaskFilterDto, user: User): Promise<Task[]> {
        return this.taskRepository.getTasks(filterDto, user);
    }

    async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
        return this.taskRepository.createTask(createTaskDto, user);
    }

    async getTaskById(id: number, user: User): Promise<Task> {

        const task = await this.taskRepository.findOne({ where: { id, userId: user.id } });

        if (!task) {
            this.logger.error("No task found with ID " + id);
            throw new NotFoundException("No task found with ID " + id);
        }

        this.logger.verbose(`User "${user.username}" retrieved task with ID: ${id} successfully`);
        return task;
    }

    async deleteTask(id: number, user: User): Promise<void> {
        const result = await this.taskRepository.delete({ id, userId: user.id });
        if (!result.affected) {
            this.logger.error("No task found with ID " + id);
            throw new NotFoundException("No task found with ID " + id);
        }
        this.logger.verbose(`User "${user.username}" deleted task with ID: ${id} successfully`)
    }

    async updateTaskStatus(id: number, status: TaskStatus, user: User): Promise<Task> {
        const task = await this.getTaskById(id, user);
        task.status = status;
        await task.save();
        this.logger.verbose(`User "${user.username}" updated task successfully. Data: ${JSON.stringify(status)}`)
        return task;
    }
} 
