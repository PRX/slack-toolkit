import { handler as reqHandler } from "./slack_request.mjs";
import { generateRecord } from "./things/acm-feed-validation-generator/index.mjs";

export const handler = async (event) => {
  if (event.action === "acm-generate-feed-validation-record") {
    await generateRecord(event.domain, event.userId);
    return;
  }

  return reqHandler(event);
};
