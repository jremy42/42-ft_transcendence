import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification, NotificationContent, NotificationType } from '../model/notification.entity';
import { User } from '../model/user.entity';
import { Repository } from 'typeorm';
import { Server } from 'socket.io';
import { UsersService } from '../users/users.service';
import { FriendRequest } from 'src/model/friend-request.entity';
import { Message } from '../model/message.entity';
import { ChatService } from '../chat/chat.service';
import { Member } from 'src/model/member.entity';

@Injectable()
export class NotificationService {

	private wsServer: Server;
	constructor(@InjectRepository(Notification)
	private repo: Repository<Notification>,
		private usersService: UsersService,
		@Inject(forwardRef(() => ChatService)) private chatService: ChatService,

	) {

	}

	setWsServer(server: Server) {
		this.wsServer = server;
	}


	async generateFriendRequestNotification(receiver: User, data: FriendRequest): Promise<Notification | null> {

		const notification: Notification = await this.repo.save({
			user: receiver,
			type: "friendRequest",
			contentId: data.sender.id,
			name: data.sender.username,
		});
		return notification;
	}


	async generateInvitationRequest(receiver: User, data: Member): Promise<Notification | null> {

		const notification: Notification = await this.repo.save({
			user: receiver,
			type: "channelInvitation",
			contentId: data.channel.id,
			name: data.channel.name,
		});
		return notification;
	}


	async generateDirectMessageNotification(receiver: User, data: Message): Promise<Notification | null> {
		const notification: Notification | null = (await this.repo.findOne({
			where: {
				type: "directMessage",
				contentId: data.channel.id,
				user: { id: receiver.id },
				read: false
			},
			select: {
				id: true, contentId: true, createdAt: true, deletedAt: true, name: true, read: true, type: true,
				user: { id: true, username: true }
			}
		}))

		if (notification) {
			return null;
		}
		else {
			const notification: Notification = await this.repo.save({
				user: receiver,
				type: "directMessage",
				contentId: data.channel.id,
				name: data.owner.user.username,
			});
			return await this.repo.save(notification);
		}
	}

	async generateNotification(type: NotificationType, data: any, receiverId?: number): Promise<void> {
		let receiver = null;
		if (!receiverId && type === "directMessage") {
			receiver = (await this.chatService.getChannelMembers(data.channel.id)).find(member => member.id !== data.owner.id)?.user;
		}
		else if (receiverId) {
			receiver = await this.usersService.restrictFindOne(receiverId);
		}
		let notification: Notification | null = null;
		if (!receiver) {
			return;
		}
		if (type === "friendRequest") {
			notification = await this.generateFriendRequestNotification(receiver, data);
		}
		else if (type === "directMessage") {
			notification = await this.generateDirectMessageNotification(receiver, data);
		}
		else if (type === "channelInvitation") {
			notification = await this.generateInvitationRequest(receiver, data);
		}
		if (notification)
			this.wsServer.to(`/notification/${receiver.id}`).emit('notification.new', notification);
	}

	async deleteNotification(data: any, type: NotificationType) {

		if (type === "friendRequest") {
			const notification = await this.repo.findOne({
				where: {
					type: "friendRequest",
					contentId: data.sender.id,
					user: { id: data.receiver.id }
				}
			});
			if (!notification) {
				return;
			}
			const notificationId = notification.id;
			await this.repo.remove(notification);
			this.wsServer.to(`/notification/${data.receiver.id}`).emit('notification.delete', notificationId);
		}
	}

	//
	async getNotifications(user: User): Promise<Notification[]> {
		const notifications = await this.repo.find({
			where: {
				user: { id: user.id }
			},
			relations: { user: true },
			select: {
				id: true, contentId: true, createdAt: true, deletedAt: true, name: true, read: true, type: true,
				user: { id: true, username: true }
			}
		});

		notifications.forEach(notification => {
			notification.read = true;
			this.repo.save(notification);
		});
		return notifications;
	}

	async getNoReadNotifications(user: User): Promise<Number> {

		return await this.repo.count({
			where: {
				user: { id: user.id },
				read: false
			},
			relations: { user: true },
		});
	}

	async ackNotification(user: User, notificationId: number) {
		const notification = await this.repo.findOne(
			{
				relations: { user: true },
				where: {
					id: notificationId,
					user: { id: user.id }
				}
			});
		if (!notification) {
			return;
		}
		notification.read = true;
		await this.repo.save(notification);
		this.wsServer.to(`/notification/${user.id}`).emit('notification.ack', notificationId);
	}
}
