import { Exclude, Expose } from "class-transformer";

export class UserDto {

	@Exclude()
	password: string;

	@Exclude()
	dfaSecret: string;
}
