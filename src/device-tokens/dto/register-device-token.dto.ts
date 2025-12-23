import { IsEnum, IsString, MaxLength } from 'class-validator';
import { DevicePlatform } from '../device-platform.enum';

export class RegisterDeviceTokenDto {
  @IsString()
  @MaxLength(512)
  token: string;

  @IsEnum(DevicePlatform)
  platform: DevicePlatform;
}


