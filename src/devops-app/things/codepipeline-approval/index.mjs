import {
  handleBlockActionPayload as rejectBlock,
  handleViewSubmissionPayload as rejectView,
} from "./reject.mjs";
import { handleBlockActionPayload as approveBlock } from "./approve.mjs";
import {
  handleBlockActionPayload as annotateBlock,
  handleViewSubmissionPayload as annotateView,
} from "./annotate.mjs";

export async function handleBlockActionPayload(payload) {
  const actionId = payload.actions[0].action_id;

  switch (actionId) {
    case "codepipeline-approval_reject-deploy":
      await rejectBlock(payload);
      break;
    case "codepipeline-approval_approve-deploy":
      await approveBlock(payload);
      break;
    case "codepipeline-approval_annotate-deploy":
      await annotateBlock(payload);
      break;
    default:
      break;
  }
}

export async function handleViewSubmissionPayload(payload) {
  const callbackId = payload.view.callback_id;

  switch (callbackId) {
    case "codepipeline-approval_reject-deploy":
      await rejectView(payload);
      break;
    case "codepipeline-approval_annotate-deploy":
      await annotateView(payload);
      break;
    default:
      break;
  }
}
