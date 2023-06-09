
import { AfterInsert, AfterRemove, AfterUpdate, Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, OneToMany, EventSubscriber, EntitySubscriberInterface, InsertEvent } from 'typeorm';
import { SavedGame } from './saved-game.entity';
import { FriendRequest } from './friend-request.entity';
import { Member } from './member.entity';
import { Notification } from './notification.entity';

@Entity()
export class User{

	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: true })
	username?: string

	@Column()
	email: string;

	@Column()
	password: string;

	@Column("int", { array: true, default: [] })
	blockedId: number[];

	@Column("int", { array: true, default: [] })
	friendId: number[];

	@Column({default : -1})
	rank: number

	@Column({default : false})
	stud : boolean;

	@Column("text", { array: true, default: [] })
	achievements : string[];

	@Column({default : 0})
	totalPlayedGames: number;

	@Column({default : 0})
	totalWonGames: number;

	@Column({default : 0})
	points: number;

	@Column({default : false})
	dfa: boolean;

	@Column()
	dfaSecret: string;

	@ManyToMany(() => SavedGame, (savedGame) => savedGame.players)
	@JoinTable({})
	savedGames: SavedGame[];

	@OneToMany(() => SavedGame, (savedGame) => savedGame.winner)
	//@JoinTable()
	wonGames: SavedGame[];

	@OneToMany(() => FriendRequest , (friendRequest) => friendRequest.sender)
	@JoinTable({})
	sentRequests: FriendRequest[];

	@OneToMany(() => FriendRequest , (friendRequest) => friendRequest.receiver)
	@JoinTable({})
	receivedRequests: FriendRequest[];

	@OneToMany(() => Member, (member) => member.user)
	members: Member[];

	@OneToMany(() => Notification , (notification) => notification.user)
	@JoinTable({})
	notifications: Notification[];

}
