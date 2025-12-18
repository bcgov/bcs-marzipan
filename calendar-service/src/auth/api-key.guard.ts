import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const url = request.url;

    // Skip API key check for health and readiness endpoints
    if (url === '/health' || url === '/ready') {
      return true;
    }

    const apiKey = request.headers['x-api-key'];

    const validApiKey = this.configService.get<string>('API_KEY');

    // If API_KEY is not configured, allow all requests (for development)
    if (!validApiKey) {
      return true;
    }

    if (!apiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
