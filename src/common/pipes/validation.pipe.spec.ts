import { ValidationPipe } from './validation.pipe';
import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, IsString, IsNotEmpty, IsEmail } from 'class-validator';

class TestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;
}

describe('ValidationPipe', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe();
  });

  describe('transform', () => {
    it('should validate and transform valid data', async () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = await pipe.transform(validData, {
        type: 'body',
        metatype: TestDto,
      });

      expect(result).toBeInstanceOf(TestDto);
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
    });

    it('should throw BadRequestException for invalid data', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
      };

      await expect(
        pipe.transform(invalidData, {
          type: 'body',
          metatype: TestDto,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException with validation errors', async () => {
      const invalidData = {
        name: '',
        email: 'not-an-email',
      };

      try {
        await pipe.transform(invalidData, {
          type: 'body',
          metatype: TestDto,
        });
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('Validation failed');
      }
    });

    it('should pass through when no metatype is provided', async () => {
      const data = { name: 'Test' };

      const result = await pipe.transform(data, {
        type: 'body',
        metatype: undefined,
      });

      expect(result).toEqual(data);
    });

    it('should pass through primitive types', async () => {
      const stringValue = 'test';

      const result = await pipe.transform(stringValue, {
        type: 'param',
        metatype: String,
      });

      expect(result).toBe(stringValue);
    });

    it('should transform data to DTO instance', async () => {
      const validData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      const result = await pipe.transform(validData, {
        type: 'body',
        metatype: TestDto,
      });

      expect(result).toBeInstanceOf(TestDto);
      expect(result.name).toBe('Jane Doe');
      expect(result.email).toBe('jane@example.com');
    });
  });
});
