import {Injectable, UnauthorizedException} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async googleLogin(req: any) {
    if (!req.user) {
      return null;
    }

    const { email, firstName, lastName, picture } = req.user;

    let user = await this.usersService.findByEmail(email);

    if (!user) {
      // throw new UnauthorizedException();
      user = await this.usersService.create({
        email,
        name: `${firstName} ${lastName}`,
      }) as any;
    }

    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async validateUser(payload: any) {
    return this.usersService.findOne(payload.sub);
  }
}
