import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { JoinChannelDto } from './dto/join-channel.dto';
import { NewMessageDto } from './dto/new-message.dto';
import { ChatService } from './chat.service';
import { ATGuard } from '../users/guard/access-token.guard';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { User } from '../model/user.entity';
import { UsersService } from '../users/users.service';
import { Member } from '../model/member.entity';
import { Channel } from '../model/channel.entity';
import { Message } from 'src/model/message.entity';

@Controller('chat')
export class ChatController {

	constructor(
		private chatService: ChatService, private userService: UsersService
	) { }

	// NOTE: DEBUG PURPOSES ONLY !
	@Get('/channels/all')
	getAll() : Promise<Channel[]> {
		return this.chatService.getAllChannels()
	}
	// Return all channels public and protected
	@Get('/channels/public')
	getAllPublic() : Promise<Channel[]> {
		return this.chatService.getAllPublicChannels()
	}

	@UseGuards(ATGuard)
	@Post('channels/create')
	async createChannel(@CurrentUser() user: User, @Body() body: CreateChannelDto): Promise<void> {
		const channelId: number = await this.chatService.createChannel(body)
		await this.chatService.joinChannel(user, channelId, { owner: true, password: body.password })
	}

	@UseGuards(ATGuard)
	@Post('channels/:id/join')
	async joinChannel(@CurrentUser() user: User, @Param('id') id : string, @Body() body: JoinChannelDto): Promise<void> {
		const channelId = parseInt(id);
		if (isNaN(channelId))
			throw new BadRequestException('Invalid channel id');
		await this.chatService.joinChannel(user, channelId, { password: body.password, targetUser: body.username })
	}

	// TODO: Limit the number of messages to 50
	// NOTE: Offset is message id or number?
	@UseGuards(ATGuard)
	@Get('channels/:id/messages')
	getMessages(@CurrentUser() user: User, @Param('id') id: string, @Query('offset') offset: string): Promise<Message[]> {
		const channelId = parseInt(id);
		if (isNaN(channelId))
			throw new BadRequestException('Invalid channel id');
		return this.chatService.getMessages(user, channelId, parseInt(offset) || 0);
	}

	@Post('channels/:id/messages')
	@UseGuards(ATGuard)
	async createMessage(@CurrentUser() user: User, @Param('id') id: string, @Body() body: NewMessageDto): Promise<void> {
		const channelId = parseInt(id);
		if (isNaN(channelId))
			throw new BadRequestException('Invalid channel id');
		await this.chatService.newMessage(user, channelId, body);
	}
	// NOTE: Return password if user is owner and return all members
	@Get('channels/:id/info')
	getChannelInfo(@Param('id') id: string) {
		const channelId = parseInt(id);
		if (isNaN(channelId))
			throw new BadRequestException('Invalid channel id');
		return this.chatService.getChannelInfo(channelId)
	}

	@Get('channels/:id/members')
	async getChannelMembers(@Param('id') id: string) {
		let members = await this.chatService.getChannelMembers(parseInt(id));
		return members.map((member: Member) =>
		({
			...member,
			isConnected: this.userService.isConnected(member.user.id)
		}));
	}

}