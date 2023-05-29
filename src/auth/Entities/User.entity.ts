import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: string;

	@Column()
	name: string;

	@Column({ unique: true, nullable: false })
	email: string;

	@Column({ unique: true, nullable: false })
	cognitoSub: string;

	@Column({ default: false })
	userConfirmed: boolean;
}
