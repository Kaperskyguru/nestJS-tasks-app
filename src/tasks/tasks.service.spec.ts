import { Test } from "@nestjs/testing";
import { TasksService } from "./tasks.service";
import { TaskRepository } from "./task.repository";
import { GetTaskFilterDto } from "./dto/get-task-filter.dto";
import { TaskStatus } from "./task-status.enum";
import { NotFoundException } from "@nestjs/common";
import { CreateTaskDto } from "./dto/create-task.dto";

const mockTaskRepository = () => ({
    getTasks: jest.fn(),
    findOne: jest.fn(),
    createTask: jest.fn(),
    delete: jest.fn(),
    getTaskById: jest.fn(),
    save: jest.fn(),
});

const mockUser = { id: 3, username: "testUsername" }

describe('TasksService', () => {
    let tasksService;
    let taskRepository;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                TasksService,
                { provide: TaskRepository, useFactory: mockTaskRepository },
            ]
        }).compile();

        tasksService = await module.get<TasksService>(TasksService);
        taskRepository = await module.get<TaskRepository>(TaskRepository);
    });

    describe('getTasks', () => {

        it('gets all tasks from the repository', async () => {
            taskRepository.getTasks.mockResolvedValue('someValue');

            expect(taskRepository.getTasks).not.toHaveBeenCalled();

            const filters: GetTaskFilterDto = { status: TaskStatus.IN_PROGRESS, search: "some search" };

            const result = await tasksService.getTasks(filters, mockUser);

            expect(taskRepository.getTasks).toHaveBeenCalledWith(filters, mockUser)

            expect(result).toEqual('someValue');
        });
    });

    describe('getTaskById', () => {
        it('calls taskRepository.findOne() and successfully retrieve and return the task', async () => {
            const mockTask = { title: 'Test task', description: 'Test desc' };
            taskRepository.findOne.mockResolvedValue(mockTask);

            const result = await tasksService.getTaskById(2, mockUser);

            expect(result).toEqual(mockTask);

            expect(taskRepository.findOne).toHaveBeenCalledWith({ where: { id: 2, userId: mockUser.id } })
        });

        it('throws an error as task is not found', () => {
            taskRepository.findOne.mockResolvedValue(null);
            expect(tasksService.getTaskById(1, mockUser)).rejects.toThrow(NotFoundException);
        });
    });

    describe('createTask', () => {
        it('creates a new task', async () => {
            taskRepository.createTask.mockResolvedValue('someValue');
            expect(taskRepository.createTask).not.toHaveBeenCalled();

            const filters: CreateTaskDto = { title: "testTitle", description: "testDescription" };
            const result = await tasksService.createTask(filters, mockUser)

            expect(taskRepository.createTask).toHaveBeenCalledWith(filters, mockUser);

            expect(result).toEqual('someValue');

        });
    });

    describe('deleteTask', () => {
        it('call task repository.deleteTask() to delete task', async () => {
            taskRepository.delete.mockResolvedValue({ affected: 1 });
            expect(taskRepository.delete).not.toHaveBeenCalled();

            await tasksService.deleteTask(1, mockUser);
            expect(taskRepository.delete).toHaveBeenCalledWith({ id: 1, userId: mockUser.id });

        });

        it('throws an error as task could not be found', () => {
            taskRepository.delete.mockResolvedValue({ affected: 0 });
            expect(tasksService.deleteTask(1, mockUser)).rejects.toThrow(NotFoundException);
        });

    });

    describe('updateTask', () => {
        it('calls getTaskById() and update a task status', async () => {

            const save = jest.fn().mockResolvedValue(true);

            tasksService.getTaskById = jest.fn().mockResolvedValue({
                status: TaskStatus.OPEN,
                save
            });

            expect(tasksService.getTaskById).not.toHaveBeenCalled();

            const result = await tasksService.updateTaskStatus(1, TaskStatus.DONE, mockUser);
            expect(tasksService.getTaskById).toHaveBeenCalled();
            expect(save).toHaveBeenCalled();

            expect(result.status).toEqual(TaskStatus.DONE);

        });
    });

});