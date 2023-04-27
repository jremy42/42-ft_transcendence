
import { AfterInsert, AfterRemove, AfterUpdate, Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { SavedGame } from './saved-game.entity';
import { FriendRequest } from './friend-request.entity';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: true })
	username: string | null;
	@Column()
	email: string;
	@Column()
	password: string;

	@Column("int", { array: true, default: [] })
	blockedId: number[];

	@Column({default : false})
	stud : boolean;

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


/* 	@AfterInsert()
	logInsert() {
		console.log(`insert User with id ${this.id}`);
	}

	@AfterUpdate()
	logUpdate() {
		console.log(`update User with id ${this.id}`);
	}

	@AfterRemove()
	logRemove() {
		console.log(`remove User with id ${this.id}`);
	} */

}
