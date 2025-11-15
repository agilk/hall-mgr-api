/**
 * Type for mocked objects/services in tests
 */
export type MockType<T> = {
  [P in keyof T]?: jest.Mock<any>;
};
