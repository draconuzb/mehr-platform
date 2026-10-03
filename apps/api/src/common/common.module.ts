import { Global, Module } from "@nestjs/common";
import { FieldCipher } from "./field-cipher";
import { SettingsService } from "./settings.service";

@Global()
@Module({ providers: [FieldCipher, SettingsService], exports: [FieldCipher, SettingsService] })
export class CommonModule {}
