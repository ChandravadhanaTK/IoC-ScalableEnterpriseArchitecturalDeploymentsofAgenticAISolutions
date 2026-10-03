import assert from "node:assert/strict";
import test from "node:test";
import { processRegistrationConfirmation } from "../src/agent/registrationApproval.js";

function createPendingRegistration(stage = "confirmation") {
  return {
    event: { _id: { toString: () => "507f1f77bcf86cd799439011" } },
    studentName: "Alex Student",
    studentEmail: "alex@example.com",
    stage,
  };
}

test('"yes" executes the stored pending registration details', async () => {
  const pending = createPendingRegistration();
  let submittedDetails;

  const result = await processRegistrationConfirmation("yes", pending, async (details) => {
    submittedDetails = details;
    return { message: "Registration successful" };
  });

  assert.equal(result.action, "registered");
  assert.deepEqual(submittedDetails, {
    eventId: "507f1f77bcf86cd799439011",
    studentName: "Alex Student",
    studentEmail: "alex@example.com",
  });
  assert.equal(pending.stage, "processing");
});

test('"no" cancels a pending registration without registering', async () => {
  let registerCalled = false;

  const result = await processRegistrationConfirmation(
    "no",
    createPendingRegistration(),
    async () => {
      registerCalled = true;
    },
  );

  assert.equal(result.action, "cancelled");
  assert.equal(registerCalled, false);
});

test('"yes" with no pending registration reports no action is awaiting confirmation', async () => {
  const result = await processRegistrationConfirmation("yes", undefined);

  assert.equal(result.action, "not-confirmation");
  assert.equal(result.reply, "There is no registration awaiting confirmation.");
});

test('"no" with no pending registration reports no action is awaiting confirmation', async () => {
  const result = await processRegistrationConfirmation("no", undefined);

  assert.equal(result.action, "not-confirmation");
  assert.equal(result.reply, "There is no registration awaiting confirmation.");
});
