import { Repository, EntityRepository } from "typeorm";
import { User } from "./user.entity";
import { AuthCredentialsDto } from "./dto/auth-credentials.dto";
import { ConflictException, InternalServerErrorException, Logger } from "@nestjs/common";
import * as bcrypt from 'bcryptjs';

@EntityRepository(User)
export class UserRepository extends Repository<User>{
    private logger = new Logger("UserRepository");

    async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
        const { username, password } = authCredentialsDto;

        const salt = await bcrypt.genSalt();

        const user = this.create();
        user.username = username;
        user.salt = salt;
        user.password = await this.hashPassword(password, salt);

        try {
            await user.save();

            delete authCredentialsDto.password;
            this.logger.verbose(`New user {username: ${user.username}} created successfully: Data ${JSON.stringify(authCredentialsDto)}`)
        } catch (error) {
            if (error.code === '23505') {
                this.logger.error("Username already exists", error.stack);
                throw new ConflictException("Username already exists");
            } else {
                this.logger.error("Unknown exception", error.stack);
                throw new InternalServerErrorException();
            }

        }

    }

    async validateUserPassword(authCredentialsDto: AuthCredentialsDto): Promise<User> {
        const { username, password } = authCredentialsDto;

        const user = await this.findOne({ username });

        if (user && await user.validatePassword(password)) {
            return user;
        }
        return null;
    }

    private async hashPassword(password: string, salt: string): Promise<string> {
        return await bcrypt.hash(password, salt);
    }
}

