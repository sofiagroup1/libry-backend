import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

// Temporary entity for sign up session, record should be deleted
// once sign up completes.
@Entity({ name: "signup_auth_session" })
export class SignUpAuthSession {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	token: string;

	@Column()
	device_id: string;

	@Column()
	phone_number: string;

	@Column()
	phone_number_verified: "NOT_VERIFIED" | "VERIFIED";

	@Column({ nullable: true })
	is_phone_number_taken: boolean;

	@Column({ nullable: true })
	email: string;

	@Column()
	status:
		| "INIT"
		| "OTP_SENT"
		| "OTP_VERIFIED"
		| "OTP_FAILED"
		| "EMAIL_ADDED"
		| "ACCOUNT_CREATED";

	@Column()
	otp_try_count: number;

	@CreateDateColumn()
	created_at: Date;

	@UpdateDateColumn()
	updated_at: Date;

	@Column()
	expires_in: Date;
}
