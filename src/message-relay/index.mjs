/**
 * This Lambda function is subscribed to SNS topics, EventBridge buses, and
 * other message services. It expects that any message data it receives from
 * those sources is a fully-formed Slack message payload, and relays that
 * payload to Slack via the chat.postMessage Web API method [1].
 *
 * 1. https://api.slack.com/methods/chat.postMessage
 */

/** @typedef { import('aws-lambda').SNSEvent } SNSEvent */
/** @typedef { import('@slack/web-api').ChatPostMessageArguments } ChatPostMessageArguments */

import { WebClient } from "@slack/web-api";

const web = new WebClient(process.env.SLACK_ACCESS_TOKEN);

// TODO event param should be type SNSEvent|ChatPostMessageArguments
/**
 * @param {*} event
 * @returns {Promise<void>}
 */
export const handler = async (event) => {
  // If the Slack message comes in via an SNS message, the Slack message
  // payload will be a JSON string in the SNS message's `Message` property.
  // Parse the JSON and send the resulting object using the Slack SDK.
  if (event?.Records?.[0]?.EventSource === "aws:sns") {
    /** @type {ChatPostMessageArguments} */
    const msg = JSON.parse(event.Records[0].Sns.Message);
    console.log(event.Records[0].Sns.Message);
    await web.chat.postMessage(msg);

    // Watch for any messages coming through a non-canonical topic, and
    // forward them to a different channel for identification
    if (
      event.Records[0].Sns.TopicArn !== process.env.CANONICAL_RELAY_TOPIC_ARN
    ) {
      msg.channel = "#sandbox2";
      await web.chat.postMessage(msg);
    }

    return;
  }

  //
  // If there are any other special cases where the Slack message payload needs
  // to be extracted or altered, add them here
  //

  // The default case assumes that the Lambda event is a raw Slack message
  // payload. This should be the case when messages are sent via EventBridge
  // using the `Slack Message Relay Message Payload` detail type, since the
  // event rule that triggers this function for those events uses sets
  // `InputPath = $.detail`, and the event detail is expected to be a raw Slack
  // message payload.
  console.log(JSON.stringify(event));
  /** @type {ChatPostMessageArguments} */
  const msg = event;
  await web.chat.postMessage(msg);
};
