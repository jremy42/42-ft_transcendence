import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards, UsePipes } from '@nestjs/common';
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
import { ChangeChannelDto } from './dto/change-channel.dto';
import { ModifyMemberDto } from './dto/modify-member.dto';
import { ValideIdPipe } from 'src/pipe/validateID.pipe';
import { GameService } from 'src/game/game.service';
import { ChannelInfo, Friend } from '../type';
import { FriendsService } from 'src/friends/friends.service';

@Controller('chat')
@UseGuards(ATGuard)
export class ChatController {

	constructor(
		private chatService: ChatService,
		private userService: UsersService,
		private gameService: GameService,
		private friendsService: FriendsService
	) { }

	@Get('/channels/public')
	getAllPublic() {
		return this.chatService.getAllPublicChannels()
	}


	@Get('/channels/my')
	async getMyChannels(@CurrentUser() user: User) {
		const channels = await this.chatService.getMyChannels(user);
		const listChannels = [];
		for (const channel of channels) {
			const unreadMessages = await this.chatService.getUnreadMessages(user, channel.id);
			listChannels.push({
				...channel,
				password: undefined,
				hasPassword: channel.password.length !== 0,
				unreadMessages,
				members: channel.members.map((member: Member) => ({
					...member,
					isConnected: this.userService.isConnected(member.user.id)
				}))
			})
		}
		return listChannels
	}

	@Get('/channels/dm')
	async getMyDirectMessage(@CurrentUser() user: User) {
		const channels = await this.chatService.getMyDirectMessage(user);
		const listChannels = [];
		for (const channel of channels) {
			const unreadMessages = await this.chatService.getUnreadMessages(user, channel.id);
			listChannels.push({
				...channel,
				password: undefined,
				hasPassword: channel.password.length !== 0,
				unreadMessages,
				members: channel.members.map((member: Member) => ({
					...member,
					isConnected: this.userService.isConnected(member.user.id)
				}))
			})
		}
		return listChannels
	};

	// /api/chat/dm/${userId}/join

	@Post('/dm/:id/join')
	async joinDirectMessage(@CurrentUser() user: User, @Param('id', ValideIdPipe) targetId: number): Promise<number> {

		return await this.chatService.joinDirectMessage(user, targetId);
	}


	// to: /chat emit :chat.new.channel
	@Post('channels/create')
	async createChannel(@CurrentUser() user: User, @Body() body: CreateChannelDto): Promise<number> {
		const channelId: number = await this.chatService.createChannel(body)
		await this.chatService.joinChannel(user, channelId, { owner: true, password: body.password })
		return channelId;
	}

	// to: /chat/${channelId} emit :chat.join.channel
	@Post('channels/:id/join')
	async joinChannel(@CurrentUser() user: User, @Param('id', ValideIdPipe) channelId: number, @Body() body: JoinChannelDto): Promise<void> {
		await this.chatService.joinChannel(user, channelId, { password: body.password, targetUsername: body.username })
	}

	@Post('channels/:id/ack')
	async ackChannel(@CurrentUser() user: User, @Param('id', ValideIdPipe) channelId: number) {
		await this.chatService.ackChannel(user, channelId);
	}

	@Get('channels/:id/messages')
	getMessages(@CurrentUser() user: User, @Param('id', ValideIdPipe) channelId: number): Promise<Message[]> {
		return this.chatService.getMessages(user, channelId);
	}

	// to: /chat/${channelId} emit :chat.new.message
	@Post('channels/:id/messages')
	async createMessage(@CurrentUser() user: User, @Param('id', ValideIdPipe) channelId: number, @Body() body: NewMessageDto): Promise<void> {
		await this.chatService.newMessage(user, channelId, body);
	}

	@Get('channels/:id/info')
	getChannelName(@CurrentUser() user: User, @Param('id', ValideIdPipe) channelId: number): Promise<ChannelInfo | undefined> {
		return this.chatService.getChannelInfo(user, channelId);
	}
	@Get('channels/:id/members')
	async getChannelMembers(@Param('id', ValideIdPipe) channelId: number): Promise<Partial<Member>[]> {
		let members = await this.chatService.getChannelMembers(channelId);
		return Promise.all(members.map(async (member: Member) => {

			//member.user = {...member.user, friendId : (await this.friendsService.getFriendsList(member.user)).map((friend: Friend) => friend.id)}
			return {
				...member,
				isConnected: this.userService.isConnected(member.user.id),
				...this.gameService.userState(member.user.id),
			}
		}));
	}

	// IF KICK
	// to: /chat/${channelId} emit :chat.leave.members -> leaver.id
	// ELSE
	// to: /chat/${channelId} emit :chat.modify.members -> { playerId, username, role, isMuted, isBanned }
	// john
	@Post('channels/:id/members/:playerId')
	async modifyMembers(@CurrentUser() user: User, @Param('id', ValideIdPipe) channelId: number, @Param('playerId', ValideIdPipe) targetId: number, @Body() body: ModifyMemberDto): Promise<void> {

		await this.chatService.modifyMembers(user, channelId, targetId, body);
		return
	}

	// to: /chat/${channelId} emit :chat.leave.members -> leaver.id
	// john
	@Post('channels/:id/leave')
	async leaveChannel(@CurrentUser() user: User, @Param('id', ValideIdPipe) channelId: number): Promise<void> {
		this.chatService.leaveChannel(user, channelId);
	}

	//to: /chat/${channelId} emit :chat.modify.channel -> { name, hasPassword }
	// john
	@Post('channels/:id/info')
	async modifyChannel(@CurrentUser() user: User, @Param('id', ValideIdPipe) channelId: number, @Body() body: ChangeChannelDto): Promise<void> {
		await this.chatService.modifyChannel(user, channelId, body);
	}

	@Get('/channels/:id/me')
	async getMyMembership(@CurrentUser() user: User, @Param('id', ValideIdPipe) channelId: number) : Promise<Member | null> {
		const me : Member | null = await this.chatService.getMemberOfChannel(user, channelId)
		return me
	}

}
