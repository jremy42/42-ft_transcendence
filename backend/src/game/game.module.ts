import { Module, forwardRef } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedGame } from '../model/saved-game.entity';
import { GameCluster } from './game-cluster';
import { JwtModule } from '@nestjs/jwt';
@Module({
	exports: [GameService],
	providers: [GameService, GameCluster],
	controllers: [GameController],
	imports: [
		forwardRef(() => UsersModule),
		TypeOrmModule.forFeature([SavedGame]),
		JwtModule.register({
			secret: process.env.SECRET_ACCESS,
			signOptions: { expiresIn: '600s' },
		})	
	]
})
export class GameModule {}
