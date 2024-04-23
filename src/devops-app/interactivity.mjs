import { parse } from "node:querystring";
import {
  handleBlockActionPayload as cfInvalidateHandleBlockActionPayload,
  handleViewSubmissionPayload as cfInvalidateHandleViewSubmissionPayload,
} from "./things/cloudfront-invalidations/index.mjs";
import {
  handleBlockActionPayload as pipelineExecHandleBlockActionPayload,
  handleViewSubmissionPayload as pipelineExecHandleViewSubmissionPayload,
} from "./things/codepipeline-executions/index.mjs";
import {
  handleBlockActionPayload as pipelineTransitionsHandleBlockActionPayload,
  handleViewSubmissionPayload as pipelineTransitionsHandleViewSubmissionPayload,
} from "./things/codepipeline-transitions/index.mjs";
import {
  handleBlockActionPayload as pipelineApprovalHandleBlockActionPayload,
  handleViewSubmissionPayload as pipelineApprovalHandleViewSubmissionPayload,
} from "./things/codepipeline-approval/index.mjs";

const SLACK_PAYLOAD_TYPE_BLOCK_ACTIONS = "block_actions";
const SLACK_PAYLOAD_TYPE_VIEW_SUBMISSION = "view_submission";
const SLACK_PAYLOAD_TYPE_VIEW_CLOSED = "view_closed";

/**
 * Block action payloads are always disambiguated by action_id`.
 *
 * Payloads should be forwarded to the appropriate module based on the
 * action_id prefix. Each module should implement a handleBlockActionPayload
 * method.
 * @param {*} payload
 */
async function handleBlockActionPayload(payload) {
  const actionId = payload.actions[0].action_id;

  if (actionId.startsWith("cloudformation-invalidation_")) {
    await cfInvalidateHandleBlockActionPayload(payload);
  } else if (actionId.startsWith("codepipeline-execution_")) {
    await pipelineExecHandleBlockActionPayload(payload);
  } else if (actionId.startsWith("codepipeline-transitions_")) {
    await pipelineTransitionsHandleBlockActionPayload(payload);
  } else if (actionId.startsWith("codepipeline-approval_")) {
    await pipelineApprovalHandleBlockActionPayload(payload);
  }
}

/**
 * View submission payloads are always disambiguated by callback_id
 *
 * Payloads should be forwarded to the appropriate module based on the
 * callback_id prefix. Each module should implement a handleViewSubmissionPayload
 * method.
 * @param {*} payload
 */
async function handleViewSubmissionPayload(payload) {
  const callbackId = payload.view.callback_id;

  if (callbackId.startsWith("cloudformation-invalidation_")) {
    await cfInvalidateHandleViewSubmissionPayload(payload);
  } else if (callbackId.startsWith("codepipeline-execution_")) {
    await pipelineExecHandleViewSubmissionPayload(payload);
  } else if (callbackId.startsWith("codepipeline-transitions_")) {
    await pipelineTransitionsHandleViewSubmissionPayload(payload);
  } else if (callbackId.startsWith("codepipeline-approval_")) {
    await pipelineApprovalHandleViewSubmissionPayload(payload);
  }
}

// https://api.slack.com/reference/interaction-payloads/views
// https://api.slack.com/reference/interaction-payloads/block-actions
export async function handler(event, body) {
  const formdata = parse(body);
  // TODO
  // @ts-ignore
  const payload = JSON.parse(formdata.payload);

  switch (payload.type) {
    case SLACK_PAYLOAD_TYPE_BLOCK_ACTIONS:
      await handleBlockActionPayload(payload);
      return { statusCode: 200, headers: {}, body: "" };
    case SLACK_PAYLOAD_TYPE_VIEW_SUBMISSION:
      await handleViewSubmissionPayload(payload);
      return { statusCode: 200, headers: {}, body: "" };
    case SLACK_PAYLOAD_TYPE_VIEW_CLOSED:
      console.log("SLACK_PAYLOAD_TYPE_VIEW_CLOSED");
      return { statusCode: 200, headers: {}, body: "" };
    default:
      return { statusCode: 200, headers: {}, body: "" };
  }
}
