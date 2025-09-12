import { DetoxConfig } from 'detox';

const config: DetoxConfig = {
  testRunner: 'jest',
  runnerConfig: 'e2e/jest.config.js',
  specs: 'e2e',
  artifacts: {
    rootDir: 'artifacts',
    plugins: {
      log: { enabled: true },
      screenshot: { shouldTakeAutomaticSnapshots: true, keepOnlyFailedTestsArtifacts: false },
      video: { enabled: false },
      instruments: { enabled: false },
      timeline: { enabled: false },
    },
  },
  configurations: {
    'android.emu.debug': {
      device: {
        type: 'android.emulator',
        avdName: 'Pixel_7_API_34'
      },
      app: {
        type: 'android.apk',
        binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
        testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
        build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      },
    },
  },
};

export default config;