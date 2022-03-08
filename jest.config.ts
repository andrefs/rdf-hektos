import type {Config} from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  testEnvironment: "jest-environment-node",
  transform: {
    //'^.+\\.tsx?$': 'ts-jest',
  },
};
export default config;
