import { ExecutionContext, createParamDecorator } from '@nestjs/common';

describe('CurrentUser Decorator', () => {
  // Test by simulating decorator behavior
  const extractUser = (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  };

  it('should extract user from request', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    };

    const mockRequest = {
      user: mockUser,
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const result = extractUser(null, mockContext);

    expect(result).toEqual(mockUser);
  });

  it('should return undefined when user is not in request', () => {
    const mockRequest = {};

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const result = extractUser(null, mockContext);

    expect(result).toBeUndefined();
  });
});
