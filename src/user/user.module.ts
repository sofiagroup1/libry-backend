import { Module } from "@nestjs/common";
import { UserController } from "./Controllers/user.controller";
import { AuthModule } from "src/auth/auth.module";

@Module({
	controllers: [UserController],
	imports: [AuthModule],
})
export class UserModule {}
