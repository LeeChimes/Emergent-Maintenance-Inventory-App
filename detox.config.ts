import type { DetoxConfig } from 'detox';

const config: DetoxConfig = {
  testRunner: 'jest',
  runnerConfig: 'frontend/e2e/jest.config.js',
  logger: { level: 'info' },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'frontend/android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd frontend/android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug'
    }
  },
  devices: {
    emulator: {
      type: 'android.emulator',
      avdName: 'Pixel_7_API_34'
    }
  },
  configurations: {
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    }
  }
};

export default config;