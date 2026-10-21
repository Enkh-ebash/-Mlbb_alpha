import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false,          // тестүүд нэг дараалан явна: нэг өгөгдлийн сан, нэг очередь
    sequence: { concurrent: false },
    reporters: ['default', 'junit'],
    outputFile: { junit: './reports/junit.xml' },
  },
});
