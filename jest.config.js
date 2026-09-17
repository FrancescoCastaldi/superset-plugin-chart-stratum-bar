module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/setupTests.ts'],
  testMatch: ['**/test/**/*.test.ts', '**/test/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.[tj]sx?$': [
      require.resolve('ts-jest'),
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@superset-ui/core$': '<rootDir>/test/__mocks__/supersetCoreMock.js',
    '^@superset-ui/chart-controls$': '<rootDir>/test/__mocks__/supersetCoreMock.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/test/__mocks__/styleMock.js',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/test/__mocks__/fileMock.js',
  },
};
