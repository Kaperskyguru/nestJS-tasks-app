import { Test } from "@nestjs/testing";
import { UserRepository } from "./user.repository";
import { AuthCredentialsDto } from "./dto/auth-credentials.dto";
import { ConflictException, InternalServerErrorException } from "@nestjs/common";
import { User } from "./user.entity";
import * as bcrypt from 'bcryptjs';

const mockCredentialsDto: AuthCredentialsDto = { username: "testUsername", password: 'testPassword' };
describe("UserRepository", () => {
    let userRepository;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                UserRepository,
            ],
        }).compile();

        userRepository = module.get<UserRepository>(UserRepository);
    });

    describe("signUp", () => {
        let save;
        beforeEach(() => {
            save = jest.fn();
            userRepository.create = jest.fn().mockReturnValue({ save })
        });

        it('successfully signs up a user', () => {
            save.mockResolvedValue(undefined);
            expect(userRepository.signUp(mockCredentialsDto)).resolves.not.toThrow();
        });

        it("throws a conflict exception as username already exit", () => {
            save.mockRejectedValue({ code: '23505' });
            expect(userRepository.signUp(mockCredentialsDto)).rejects.toThrow(ConflictException);
        });

        it("throws unhandled exception", () => {
            save.mockRejectedValue({ code: '12352' });
            expect(userRepository.signUp(mockCredentialsDto)).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('ValidateUserPassword', () => {

        let user;

        beforeEach(() => {
            userRepository.findOne = jest.fn();

            user = new User();
            user.username = 'testUsername';
            user.validatePassword = jest.fn();

        });

        it('returns a username as the validation is successful', async () => {
            userRepository.findOne.mockResolvedValue(user);
            user.validatePassword.mockResolvedValue(true);

            const result = await userRepository.validateUserPassword(mockCredentialsDto);
            expect(result).toEqual(user)
        });

        it('return null as user cannot be found', async () => {
            userRepository.findOne.mockResolvedValue(null);

            const result = await userRepository.validateUserPassword(mockCredentialsDto);
            expect(user.validatePassword).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it('returns null as password is invalid', async () => {
            userRepository.findOne.mockResolvedValue(user);
            user.validatePassword.mockResolvedValue(false);

            const result = await userRepository.validateUserPassword(mockCredentialsDto);
            expect(userRepository.findOne).toHaveBeenCalled();

            expect(result).toBeNull();
        });


    });

    describe('hashPassword', () => {
        it('calls bcrypt.hash to generate a hash', async () => {
            bcrypt.hash = jest.fn().mockResolvedValue("hashcode")
            expect(bcrypt.hash).not.toHaveBeenCalled();
            const result = await userRepository.hashPassword("testPassword", 'testSalt');
            expect(bcrypt.hash).toHaveBeenCalledWith('testPassword', 'testSalt');
            expect(result).toEqual('hashcode')
        });
    });
});

