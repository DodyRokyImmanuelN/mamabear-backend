import { JwtAuthGuard } from './guard/jwt-auth.guard';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtPayload } from '@/types/JwtPayload';
import { RefreshGuard } from './guard/refresh.guard';
import { Request, Response } from 'express';

@UseGuards(ThrottlerGuard)
@ApiTags('auth')
@ApiBearerAuth('JwtAuthGuard')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Get user public info' })
  @ApiResponse({
      status: 201,
      description: 'Success',
      schema: {
        example: {
          "success": true,
          "statusCode": 200,
          "message": [
              "No message specified"
          ],
          "data": {
              "sub": "a61bd098-9125-4d52-8eac-88386fe0944e",
              "name": "Dewi Lestari",
              "email": "dewi.lestari@email.com",
              "role": "USER"
          },
          "timestamp": "2026-10-14T13:32:50.419Z"
      }
      }
  })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JwtAuthGuard')
  me(@Req() req: any) {
      return req.user;
  }

  @ApiOperation({ summary: 'Logs in user' })
  @ApiResponse({
      status: 201,
      description: 'Success',
      schema: {
        example: {
          "success": true,
          "statusCode": 201,
          "message": [
              "Login successful"
          ],
          "data": {
              "accessToken": "some.access.token",
              "refreshToken": "some.refresh.token"
          },
          "timestamp": "2026-10-14T13:31:23.796Z"
        }
      }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email/password, or email is not verified, or account is blocked'
  })
  @Throttle({
    default: {
      limit: 50,
      ttl: 300_000,
    },
  })
  @Post('/login')
  login(@Body() dto: LoginUserDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, res);
  }

  @ApiOperation({ summary: 'Registers user' })
  @ApiResponse({
      status: 201,
      description: 'Success',
      schema: {
        example: {
          success: true,
          message: `Register success, check your email to verify`,
          data: null
        }
      }
  })
  @ApiResponse({
    status: 400,
    description: 'Email already exists.'
  })
  @Throttle({
    default: {
      limit: 50,
      ttl: 300_000,
    },
  })
  @Post('/register')
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Logs out user' })
  @ApiResponse({
      status: 201,
      description: 'Success',
      schema: {
        example: {
          success: true,
          message: `Logout success`,
          data: null,
        }
      }
  })
  @ApiResponse({
    status: 400,
    description: 'User not found.'
  })
  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  @ApiBearerAuth('JwtAuthGuard')
  logout(@Req() req: JwtPayload, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req.sub, res);
  }

  @ApiOperation({ summary: 'Reissue auth token' })
  @ApiResponse({
      status: 201,
      description: 'Success',
      schema: {
        example: {
          success: true,
          message: `Token refreshed successfully`,
          data: { accessToken: 'newAccessToken', refreshToken: 'newRefreshToken' },
        }
      }
  })
  @ApiResponse({
    status: 401,
    description: 'User not found or Refresh token not found or Invalid old refresh token or Refresh token expired.'
  })
  @Throttle({
    default: {
      limit: 50,
      ttl: 300_000,
    },
  })
  @Post('/refresh')
  @UseGuards(RefreshGuard)
  async refresh(@Req() req: Request) {
    const refreshToken =
      req.headers.authorization?.replace('Bearer ', '') ?? '';
    return this.authService.refreshToken(refreshToken);
  }

  @ApiOperation({ summary: 'Issue forgot password' })
  @ApiResponse({
      status: 201,
      description: 'Success',
      schema: {
        example: {
          success: true,
          message: `Check your email to reset password`,
          data: null,
        }
      }
  })
  @ApiResponse({
    status: 400,
    description: 'User not found.'
  })
  @Throttle({
    default: {
      limit: 50,
      ttl: 300_000,
    },
  })
  @Post('/forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Reset user\'s password' })
  @ApiResponse({
      status: 201,
      description: 'Success',
      schema: {
        example: {
          success: true,
          message: `Password reset success`,
          data: null,
        }
      }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid token or reset token expired.'
  })
  @Throttle({
    default: {
      limit: 50,
      ttl: 300_000,
    },
  })
  @Post('/reset-password/:token')
  resetPassword(@Param('token') token: string, @Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(token, dto);
  }

  @ApiOperation({ summary: 'Verify account' })
  @ApiResponse({
      status: 201,
      description: 'Success',
      schema: {
        example: {
          success: true,
          message: `Email verified successfully`,
          data: null,
        }
      }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid token or reset token expired.'
  })
  @Throttle({
    default: {
      limit: 50,
      ttl: 300_000,
    },
  })
  @Get('/verify-email/:token')
  verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token);
  }
}
