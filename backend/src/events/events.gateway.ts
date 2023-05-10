import {
	ConnectedSocket,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	MessageBody,
	OnGatewayInit,
	OnGatewayConnection,
	OnGatewayDisconnect
} from '@nestjs/websockets';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Server, Socket } from 'socket.io'
import { EventGuard } from './guards/event.guard'
import { WebSocketUserInterceptor } from './interceptors/WebSocketUser.interceptor'
import { EventUserDecorator } from './decorators/EventUser.decorator'
import { User } from '../model/user.entity'
import { GameJoinDto } from './dtos/game-join.dto'
import { PlayerInputDto } from './dtos/player-input.dto'
import { GameService } from '../game/game.service'
import { GameCreateDto } from './dtos/game-create.dto';
import { AuthService } from '../users/auth/auth.service';
import { IgameInfo } from '../game/game';
import { UsersService } from '../users/users.service'
import { instrument } from '@socket.io/admin-ui';
import { FriendsService } from '../friends/friends.service';
import { ChatService } from '../chat/chat.service';
import { ChannelSubscriber } from '../events-subscriber/event-subsriber.listener';

type SocketInfo = {
	id: string,
	username: string,
	userId: number,
	actions: string[]
}

@WebSocketGateway({
	path: '/socket.io/',
	cors: {
		origin: '*',
	},
})

@UseGuards(EventGuard)
// Adds client info into data of message -> Needed for EventUserDecorator
@UseInterceptors(WebSocketUserInterceptor)
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

	@WebSocketServer() server: Server
	private connectedSockets: SocketInfo[] = []

	constructor(
		private gameService: GameService,
		private authService: AuthService,
		private usersServices: UsersService,
		private friendsService: FriendsService,
		private chatService: ChatService,
		private ChannelSubscriber : ChannelSubscriber
	) {
		setInterval(() => {
			const info = this.connectedSockets.map((e) => {
				return e.username
			})
			console.log("\x1b[33mSockets info are : \x1b[0m", info.join('-'))
		}, 5000)
	}

	updateSocket(socket: Socket, action: string): void {
		const toUpdate = this.connectedSockets.find((e: SocketInfo) => e.id == socket.id)
		if (toUpdate) {
			toUpdate.actions.push(action)
		}
	}

	afterInit(server: Server) {
		this.gameService.setWsServer(server)
		this.usersServices.setWsServer(server)
		this.friendsService.setWsServer(server)
		this.chatService.setWsServer(server)
		this.ChannelSubscriber.setWsServer(server)

		instrument(this.server, {
			auth: false
		})
	}

	async handleConnection(socket: Socket) {
		const bearerToken = socket.handshake.auth?.token
		// console.log("event gateway handleConnection", bearerToken);
		const foundUser = await this.authService.validateAccessToken(bearerToken)

		if (!foundUser)
			return
		console.log("New Connection User:", foundUser.username)
		this.connectedSockets.push({ id: socket.id, username: foundUser.username || "<UnamedUser>", userId: foundUser.id, actions: ["connection"] })
		this.usersServices.addConnectedUser(foundUser.id)
		this.server.to(`/player/${foundUser.id}`).emit('page.player', {
			userId: foundUser.id, event: "connected",
			connected: true
		})
	}

	async handleDisconnect(socket: Socket) {
		const bearerToken = socket.handshake.auth?.token
		console.log("event gateway handleDisconnect")
		const foundUser = await this.authService.decodeToken(bearerToken)

		if (foundUser) {
			console.log("Disconnect User:", foundUser.username)
			this.usersServices.disconnect(foundUser.id)

			this.server.to(`/player/${foundUser.id}`).emit('page.player', {
				userId: foundUser.id, event: "disconnected",
				connected: false
			})
		}
		const currentGame = this.gameService.findByClient(socket)
		if (currentGame && foundUser)
			this.gameService.quitGame(foundUser.id, currentGame.id)

		const toRemove = this.connectedSockets.findIndex((e) => e.id == socket.id)
		if (toRemove != -1) {
			console.log("Removing Disconnected socket:", socket.id)
			this.connectedSockets.splice(toRemove, 1)
		}
	}

	@SubscribeMessage('ping')
	handleMessage(@ConnectedSocket() client: Socket, @EventUserDecorator() user: User, @MessageBody() data: any): void {
		client.broadcast.emit('message', `Server : new challenger`)
		this.updateSocket(client, "ping")
	}

	@SubscribeMessage('game.create')
	create(@ConnectedSocket() client: Socket, @EventUserDecorator() user: User, @MessageBody() data: GameCreateDto): string {
		console.log("New create event")
		this.updateSocket(client, "gamecreate")
		try {
			const gameId = this.gameService.create(data.options)
			//const gameId = this.gameService.create(data[0].map)
			//console.log("Game id is : ", gameId);
			return gameId
		}
		catch (e) {
			return e.message
		}
	}

	@SubscribeMessage('game.findOrCreate')
	findOrCreate(@ConnectedSocket() client: Socket, @EventUserDecorator() user: User, @MessageBody() data: GameCreateDto): string {
		console.log("New findOrCreate event")
		this.updateSocket(client, "findOrCreate")
		try {
			console.log('trying to find or create game', data)
			//const gameId = this.gameService.findOrCreate(data[0].map)
			const gameId = this.gameService.findOrCreate(data.options)
			console.log('After log', gameId)
			//console.log("Game id is : ", gameId);
			return gameId
		}

		catch (e) {
			return e.message
		}
	}

	@SubscribeMessage('game.join')
	handleJoin(@ConnectedSocket() client: Socket, @EventUserDecorator() user: User, @MessageBody() data: GameJoinDto): string {
		console.log("New join event")
		this.updateSocket(client, "join")

		try {
			const { gameId, gameInfo } = this.gameService.join(client, user, data.gameId)
			//console.log("Game id is : ", gameId);
			console.log("join event ok so far")
			return JSON.stringify({ gameId, gameInfo });
		}
		catch (e) {
			return JSON.stringify({ error: e.message });
		}
	}

	@SubscribeMessage('game.play.move')
	handlePlayerInput(@ConnectedSocket() client: Socket, @EventUserDecorator() user: User, @MessageBody() data: PlayerInputDto): void {
		this.updateSocket(client, "playerInput")
		this.gameService.handlePlayerInput(client, user, data)
	}


	@SubscribeMessage('client.nav')
	handleClientNav(@ConnectedSocket() client: Socket, @EventUserDecorator() user: User, @MessageBody() data: { to: string, from: string }): void {
		this.updateSocket(client, "clientNav");
		client.join(data.to);
		client.leave(data.from);
	}

	@SubscribeMessage('client.component.join')
	async handleClientComponentJoin(@ConnectedSocket() client: Socket, @EventUserDecorator() user: User, @MessageBody() data: { subscription: string }) {
		this.updateSocket(client, "client.component.join");
		console.log("client.component.join", user.username, data.subscription)
		await client.join(data.subscription);
	}

	@SubscribeMessage('client.component.leave')
	handleClientComponentLeave(@ConnectedSocket() client: Socket, @EventUserDecorator() user: User, @MessageBody() data: { unsubscription: string }): void {
		console.log("client.component.leave", user.username, data.unsubscription)
		client.leave(data.unsubscription);
	}
}
