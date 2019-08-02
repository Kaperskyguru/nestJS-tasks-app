import * as bcrypt from 'bcryptjs';
import { Test } from '@nestjs/testing';
import { User } from './user.entity';

describe('validatePassword', () => {

    let UserEntity;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                User,
            ],
        }).compile();

        UserEntity = module.get<User>(User);
    });

    it('validates a user password', async () => {
        UserEntity.salt = 'testSalt';
        UserEntity.password = "hashedpassword";

        bcrypt.hash = jest.fn().mockResolvedValue('hashedpassword');
        expect(bcrypt.hash).not.toHaveBeenCalled();

        const result = await UserEntity.validatePassword("testPassword");

        expect(bcrypt.hash).toHaveBeenCalledWith('testPassword', 'testSalt');
        expect(result).toBeTruthy();

    });

});