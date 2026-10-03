function isConfirmation(message) {
  return /^(yes|yeah|yep|confirm|confirmed|yes\s+please|yes\s*,?\s*register\s+me|go\s+ahead|proceed)[!.,\s]*$/i.test(message);
}

function isCancellation(message) {
  return /^(no|nope|cancel|stop|don't|do\s+not)[!.,\s]*$/i.test(message);
}

export async function processRegistrationConfirmation(
  message,
  pendingRegistration,
  registerForEvent,
) {
  const confirmation = isConfirmation(message);
  const cancellation = isCancellation(message);

  if (!pendingRegistration) {
    if (confirmation || cancellation) {
      return {
        action: "not-confirmation",
        reply: "There is no registration awaiting confirmation.",
      };
    }
    return null;
  }

  if (pendingRegistration.stage === "processing") {
    return {
      action: "processing",
      reply: "Your registration is being processed. Please wait.",
    };
  }

  if (cancellation) {
    return { action: "cancelled", reply: "Registration cancelled." };
  }

  if (pendingRegistration.stage !== "confirmation" || !confirmation) {
    return null;
  }

  pendingRegistration.stage = "processing";
  const result = await registerForEvent({
    eventId: pendingRegistration.event._id.toString(),
    studentName: pendingRegistration.studentName,
    studentEmail: pendingRegistration.studentEmail,
  });

  return { action: "registered", result };
}
