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
	description: string;

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

	@ManyToMany(() => User, (user) => user.following, { onDelete: "CASCADE" })
	@JoinTable()
	followers: User[];

	@ManyToMany(() => User, (user) => user.followers, { onDelete: "CASCADE" })
	following: User[];

	@Column({ select: false, nullable: true, insert: false, update: false })
	followingCount?: number;

	@Column({ select: false, nullable: true, insert: false, update: false })
	followersCount?: number;

	@Column({ select: false, nullable: true, insert: false, update: false })
	isFollowed?: boolean;
}
