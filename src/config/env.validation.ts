import { plainToClass } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  validateSync,
  Min,
  Max,
} from 'class-validator';

enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
  Verbose = 'verbose',
}

/**
 * Environment variables validation schema
 * All required environment variables must be defined
 */
export class EnvironmentVariables {
  // Server Configuration
  @IsEnum(NodeEnvironment)
  @IsOptional()
  NODE_ENV: NodeEnvironment = NodeEnvironment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  // Database Configuration
  @IsString()
  DB_HOST: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  DB_PORT: number;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_DATABASE: string;

  @IsBoolean()
  @IsOptional()
  DB_SYNCHRONIZE: boolean = false;

  // JWT Configuration
  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  ACCESS_TOKEN_LIFETIME: string = '30m';

  @IsString()
  @IsOptional()
  REFRESH_TOKEN_LIFETIME: string = '240h';

  // Logging Configuration
  @IsEnum(LogLevel)
  @IsOptional()
  LOG_LEVEL: LogLevel = LogLevel.Info;

  // External Services (Optional)
  @IsString()
  @IsOptional()
  AUTH_SERVICE_URL?: string;

  @IsString()
  @IsOptional()
  EXTERNAL_HALL_API_URL?: string;

  @IsString()
  @IsOptional()
  EXTERNAL_HALL_API_TOKEN?: string;

  // 2FA Configuration
  @IsString()
  @IsOptional()
  APP_NAME: string = 'Exam Supervision System';

  // File Upload Configuration
  @IsNumber()
  @IsOptional()
  MAX_FILE_SIZE: number = 10485760; // 10MB

  @IsString()
  @IsOptional()
  UPLOAD_DIR: string = './uploads';

  // Email Configuration (Optional)
  @IsString()
  @IsOptional()
  SMTP_HOST?: string;

  @IsNumber()
  @IsOptional()
  SMTP_PORT?: number;

  @IsString()
  @IsOptional()
  SMTP_USER?: string;

  @IsString()
  @IsOptional()
  SMTP_PASSWORD?: string;

  @IsString()
  @IsOptional()
  SMTP_FROM?: string;

  // CORS Configuration
  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:8080';
}

/**
 * Validate environment variables
 * @param config - Raw environment configuration
 * @returns Validated environment variables
 * @throws Error if validation fails
 */
export function validate(config: Record<string, unknown>) {
  // Convert string values to appropriate types
  const validatedConfig = plainToClass(EnvironmentVariables, {
    ...config,
    PORT: config.PORT ? parseInt(config.PORT as string, 10) : 3000,
    DB_PORT: config.DB_PORT ? parseInt(config.DB_PORT as string, 10) : 5432,
    DB_SYNCHRONIZE: config.DB_SYNCHRONIZE === 'true',
    MAX_FILE_SIZE: config.MAX_FILE_SIZE
      ? parseInt(config.MAX_FILE_SIZE as string, 10)
      : 10485760,
    SMTP_PORT: config.SMTP_PORT ? parseInt(config.SMTP_PORT as string, 10) : undefined,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => {
        const constraints = Object.values(error.constraints || {});
        return `${error.property}: ${constraints.join(', ')}`;
      })
      .join('\n');

    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  return validatedConfig;
}
