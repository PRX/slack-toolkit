import { handler as reqHandler } from "./slack_request.mjs";

export const handler = async (event) => {
  return reqHandler(event);
};
