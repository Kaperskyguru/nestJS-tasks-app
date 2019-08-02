import { Injectable, UnauthorizedException, Logger, InternalServerErrorException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
    private logger = new Logger('AuthService');
    constructor(
        @InjectRepository(UserRepository)
        private userRepository: UserRepository,
        private jwtService: JwtService,
    ) { }

    async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
        return this.userRepository.signUp(authCredentialsDto);
    }

    async signIn(authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string }> {
        const user = await this.userRepository.validateUserPassword(authCredentialsDto)

        if (!user) {
            this.logger.error(`Invalid login credentials`);
            throw new UnauthorizedException('invalid credentials');
        }

        const payload: JwtPayload = {
            id: user.id,
            username: user.username
        };

        try {
            const accessToken = await this.jwtService.sign(payload);
            this.logger.log(`Generated JWT Token with payload: ${JSON.stringify(payload)}`)
            return { accessToken };

        } catch (error) {
            this.logger.error(`Generating JWT Token with payload: ${JSON.stringify(payload)} failed`, error.stack)
            throw new InternalServerErrorException('Could not generate JWT Token');
        }

    }
}
