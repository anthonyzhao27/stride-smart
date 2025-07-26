import presets from 'ts-jest/presets/index.js';

export default {
    ...presets.defaults, // includes `transform`
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
};
