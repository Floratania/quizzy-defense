import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GoogleOAuthService } from './google-oauth.service';

@Module({
  imports: [HttpModule],
  providers: [GoogleOAuthService],
  exports: [GoogleOAuthService],
})
export class GoogleOAuthModule {}
