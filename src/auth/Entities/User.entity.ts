import {
	Column,
	Entity,
	JoinTable,
	ManyToMany,
	PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class User {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ nullable: true })
	name: string;

	@Column({ nullable: true })
	birth_date: Date;

	@Column({ unique: true, nullable: false })
	email: string;

	@Column({ default: false })
	email_verified: boolean;

	@Column({ unique: true, nullable: false })
	phone_number: string;

	@Column({ default: false })
	phone_number_verified: boolean;

	@Column({ unique: true, nullable: false })
	cognitoSub: string;

	@Column({ default: false })
	userConfirmed: boolean;

	@ManyToMany(() => User, (user) => user.following)
	@JoinTable()
	followers: User[];

	@ManyToMany(() => User, (user) => user.followers)
	following: User[];
}
