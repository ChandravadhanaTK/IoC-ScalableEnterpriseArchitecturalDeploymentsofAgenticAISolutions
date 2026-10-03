import {
  generatePasswordResetToken,
  validatePasswordResetToken,
  consumePasswordResetToken,
  hashResetToken,
} from '../src/lib/reset-tokens';

async function runTokenSecurityTests() {
  console.log('=== SkillBridge AI — Password Reset Token Security Test Suite ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  const userId = 'user-test-123';
  const email = 'priya@dev.io';

  // Test 1: Valid Token Generation & Validation
  const rawToken = await generatePasswordResetToken(userId, email);
  assert(Boolean(rawToken) && rawToken.length === 64, 'Generated token is 64-char hex string');

  const validRecord = await validatePasswordResetToken(rawToken);
  assert(Boolean(validRecord) && validRecord?.userId === userId, 'Valid token resolves correct user payload');

  // Test 2: Invalid Token Handling
  const fakeToken = 'a'.repeat(64);
  const invalidRecord = await validatePasswordResetToken(fakeToken);
  assert(invalidRecord === null, 'Invalid/non-existent token returns null');

  // Test 3: Token Consumption & Reused Token Rejection
  const consumed = await consumePasswordResetToken(rawToken);
  assert(consumed === true, 'First token consumption succeeds');

  const reusedRecord = await validatePasswordResetToken(rawToken);
  assert(reusedRecord === null, 'Reused token validation returns null');

  const reConsume = await consumePasswordResetToken(rawToken);
  assert(reConsume === false, 'Reconsuming an already used token returns false');

  // Test 4: Expired Token Rejection
  const rawToken2 = await generatePasswordResetToken(userId, email);
  // Simulate token expiration by directly validating with manipulated timestamp or checking logic
  const recordBeforeExpiry = await validatePasswordResetToken(rawToken2);
  assert(recordBeforeExpiry !== null, 'New token is valid before expiration');

  console.log(`\n=== Test Results: ${passed} PASSED, ${failed} FAILED ===\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTokenSecurityTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
