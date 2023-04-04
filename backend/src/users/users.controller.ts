import { Get, Body, Controller, UseGuards, Request, ForbiddenException} from '@nestjs/common';
import { Post } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthentificatedGuard } from './authenticated.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginUserDto } from './dtos/login-user.dto';

@Controller('users')
export class UsersController {

	constructor(private usersService : UsersService, private authService : AuthService){}

	//@UseGuards(LocalAuthGuard)
	@Post('/register')
	async createUser(@Body() body: CreateUserDto){
		const user =  await this.authService.register(body);
		return user;
	}

	@Post('/login')
	async login(@Body() body: LoginUserDto, @Request() req){
		return await this.authService.login(body);
	};

	@UseGuards(JwtAuthGuard)
	@Get('/all')
	async findAll()
	{
		const allUser = await this.usersService.getAll();
		return allUser;
	}

	@UseGuards(JwtAuthGuard)
	@Get('/me')
	getMe(@Request() req) {
		console.log(req.headers)
		const token = req.headers.authorization.replace('Bearer ', '');
		return this.authService.validateToken(token);
	}
}
