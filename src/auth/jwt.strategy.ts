import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtPayload } from './jwt-payload.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from './user.repository';
import { User } from './user.entity';
import * as config from 'config';



@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private logger = new Logger("JWTStrategy");
    constructor(
        @InjectRepository(UserRepository)
        private userRepository: UserRepository,
    ) {


        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET || config.get('jwt.secret'),
        });
    }

    async validate(payload: JwtPayload): Promise<User> {
        const { username } = payload;
        const user = await this.userRepository.findOne({ username })


        if (!user) {
            this.logger.error(`Unauthorized request: Payload ${JSON.stringify(payload)}`)
            throw new UnauthorizedException();
        }
        return user;
    }
}
