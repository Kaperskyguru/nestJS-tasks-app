import { EntityRepository, Repository } from "typeorm";
import { Task } from "./task.entity";
import { CreateTaskDto } from "./dto/create-task.dto";
import { TaskStatus } from "./task-status.enum";
import { GetTaskFilterDto } from "./dto/get-task-filter.dto";
import { User } from "../auth/user.entity";
import { Logger, InternalServerErrorException } from "@nestjs/common";

@EntityRepository(Task)
export class TaskRepository extends Repository<Task>{
    private logger = new Logger('TaskRepository');

    async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
        const { title, description } = createTaskDto
        const task = new Task();

        task.title = title,
            task.description = description,
            task.status = TaskStatus.OPEN,
            task.user = user

        try {
            await task.save();
            delete task.user;
            this.logger.verbose(`User "${user.username}" created new task. Data: ${JSON.stringify(createTaskDto)}`)
            return task;
        } catch (error) {
            this.logger.error(`User "${user.username}" failed to create a new task. Data: ${JSON.stringify(createTaskDto)}`, error.stack);
            throw new InternalServerErrorException("Failed to create a new task");
        }


    }

    async getTasks(filterDto: GetTaskFilterDto, user: User): Promise<Task[]> {
        const { status, search } = filterDto;
        const query = this.createQueryBuilder('task');

        query.where('task.userId = :userId', { userId: user.id });

        if (status) {
            query.andWhere('task.status = :status', { status });
        }
        if (search) {
            query.andWhere('task.title LIKE :search', { search: `%${search}%` });
            query.orWhere('task.description LIKE :search', { search: `%${search}%` })
        }

        try {
            const result = await query.getMany();
            this.logger.verbose(`User "${user.username}" successfully retrieved tasks. Filter: ${JSON.stringify(filterDto)}`);
            return result;
        } catch (error) {
            this.logger.error(`User "${user.username}" failed to retrieve tasks. Filters: ${JSON.stringify(filterDto)}`, error.stack);
            throw new InternalServerErrorException("Failed to retrieve all tasks");
        }

    }
}