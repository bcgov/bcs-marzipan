# Logger Service

The Logger service provides a consistent logging interface across the application. It wraps the NestJS Logger and extends it with environment-aware behavior.

## Overview

`AppLogger` is a global service that extends NestJS's built-in Logger. It provides structured logging with context support and automatically disables verbose logging in production environments.

## Features

- Consistent logging interface across the application
- Context-aware logging for better traceability
- Production-safe: debug and verbose logs are automatically disabled in production
- Global module: available throughout the application without explicit imports

## Setup

The `LoggerModule` is already registered as a global module in `AppModule`, so it's available throughout your application without needing to import it in individual modules.

## Usage

### Dependency Injection (Recommended)

Inject `AppLogger` into your service or controller constructor:

```typescript
import { Injectable } from '@nestjs/common';
import { AppLogger } from '../common/logger/logger.service';

@Injectable()
export class MyService {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(MyService.name);
  }

  someMethod() {
    this.logger.log('Processing request', 'MyService');
    this.logger.debug('Debug information');
    this.logger.warn('Warning message');
    this.logger.error('Error occurred', 'stack trace');
  }
}
```

### Direct Instantiation

You can also create a logger instance directly with a context:

```typescript
import { AppLogger } from '../common/logger/logger.service';

export class MyController {
  private readonly logger = new AppLogger(MyController.name);

  someMethod() {
    this.logger.log('Request received');
  }
}
```

## Log Levels

### `log(message: string, context?: string)`

Logs an informational message. Always enabled in all environments.

```typescript
this.logger.log('User authenticated successfully', 'AuthService');
```

### `debug(message: string, context?: string)`

Logs a debug message. Only enabled in non-production environments.

```typescript
this.logger.debug('Request payload received', 'MyController');
```

### `warn(message: string, context?: string)`

Logs a warning message. Always enabled in all environments.

```typescript
this.logger.warn('Rate limit approaching', 'RateLimitService');
```

### `error(message: string, trace?: string, context?: string)`

Logs an error message with optional stack trace. Always enabled in all environments.

```typescript
this.logger.error('Database connection failed', error.stack, 'DatabaseService');
```

### `verbose(message: string, context?: string)`

Logs a verbose message. Only enabled in non-production environments.

```typescript
this.logger.verbose('Detailed execution trace', 'MyService');
```

## Best Practices

1. **Set Context**: Always set a context when using dependency injection to identify the source of log messages:

   ```typescript
   this.logger.setContext(MyService.name);
   ```

2. **Use Appropriate Log Levels**:
   - Use `log()` for general informational messages
   - Use `debug()` for detailed debugging information (development only)
   - Use `warn()` for warnings that don't stop execution
   - Use `error()` for errors and exceptions
   - Use `verbose()` for very detailed tracing (development only)

3. **Include Context in Logs**: When logging, include relevant context information:

   ```typescript
   this.logger.log(`Processing user ${userId}`, 'UserService');
   ```

4. **Error Logging**: Always include stack traces when logging errors:

   ```typescript
   try {
     // some operation
   } catch (error) {
     this.logger.error('Operation failed', error.stack, 'MyService');
   }
   ```

5. **Avoid Sensitive Data**: Never log passwords, API keys, or other sensitive information.

## Environment Behavior

- **Development/Staging**: All log levels are enabled
- **Production**: Only `log()`, `warn()`, and `error()` are enabled. `debug()` and `verbose()` are automatically disabled.

The environment is determined by the `NODE_ENV` environment variable.
