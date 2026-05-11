import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import * as fs from 'fs';

let testEnv: any;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'loll-rules-test',
    firestore: {
      rules: fs.readFileSync('DRAFT_firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Wild Rift Companion Rules', () => {
  it('Denies Match creation with ghost fields (Shadow Update)', async () => {
    const context = testEnv.authenticatedContext('user-1', { email_verified: true, email: 'user@test.com' });
    await assertFails(context.firestore().collection('matches').add({
      timestamp: 1234,
      date: '2026-05-11',
      result: 'Victory',
      players: [{ name: 'A', champion: 'B' }],
      savedBy: 'user@test.com',
      appVersion: '3.0',
      screenshot: null,
      duration: null,
      ghostField: true // Should fail!
    }));
  });

  it('Denies Match creation without verified email (Email Spoofing test)', async () => {
    const unverifiedContext = testEnv.authenticatedContext('user-2', { email_verified: false, email: 'user@test.com' });
    await assertFails(unverifiedContext.firestore().collection('matches').add({
      timestamp: 1234,
      date: '2026-05-11',
      result: 'Victory',
      players: [{ name: 'A', champion: 'B' }],
      savedBy: 'user@test.com',
      appVersion: '3.0',
      screenshot: null,
      duration: null
    }));
  });

  it('Denies list query without resource.data constraint (Query Trust Test)', async () => {
    const context = testEnv.authenticatedContext('user-1', { email_verified: true });
    // This query lacks where('appVersion', '==', '3.0') so it SHOULD fail
    await assertFails(context.firestore().collection('matches').get());
  });

  it('Denies value poisoning', async () => {
    const context = testEnv.authenticatedContext('user-1', { email_verified: true, email: 'test@test.com' });
    await assertFails(context.firestore().collection('matches').add({
      timestamp: 1234,
      date: '2026-05-11',
      result: 'InvalidResultString', // SHOULD FAIL
      players: [{ name: 'A', champion: 'B' }],
      savedBy: 'test@test.com',
      appVersion: '3.0',
      screenshot: null,
      duration: null
    }));
  });
});
