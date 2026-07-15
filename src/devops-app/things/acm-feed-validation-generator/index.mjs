import {
  ACMClient,
  DeleteCertificateCommand,
  DescribeCertificateCommand,
  RequestCertificateCommand,
} from "@aws-sdk/client-acm";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { WebClient } from "@slack/web-api";
import { devopsRole } from "../../access.mjs";

const lambda = new LambdaClient({});
const web = new WebClient(process.env.SLACK_ACCESS_TOKEN);

async function openModal(payload) {
  await web.views.open({
    trigger_id: payload.trigger_id,
    view: {
      type: "modal",
      callback_id: "acm-feed-validation-generator_generate-record",
      clear_on_close: true,
      title: {
        type: "plain_text",
        text: "Feed Validation Record",
      },
      submit: {
        type: "plain_text",
        text: "Generate",
      },
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "You will receive a Slack message with the generated records.",
          },
        },
        {
          type: "input",
          block_id: "acm-feed-validation-generator_generate-record",
          element: {
            type: "plain_text_input",
            action_id: "acm-feed-validation-generator_generate-record",
            focus_on_load: true,
            placeholder: {
              type: "plain_text",
              text: "e.g., feed.mypodcast.example.com",
            },
          },
          label: {
            type: "plain_text",
            text: "Public feed domain name",
            emoji: false,
          },
          optional: false,
        },
      ],
    },
  });
}

async function generateRecordAsync(payload) {
  console.log(JSON.stringify(payload));
  const { values } = payload.view.state;
  const block = values["acm-feed-validation-generator_generate-record"];
  const action = block["acm-feed-validation-generator_generate-record"];
  const { value } = action;

  await lambda.send(
    new InvokeCommand({
      FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      InvocationType: "Event",
      Payload: JSON.stringify({
        action: "acm-generate-feed-validation-record",
        domain: value,
        userId: payload.user.id,
      }),
    }),
  );

  await web.chat.postMessage({
    icon_emoji: ":ops-acm:",
    username: "AWS Certificate Manager via DevOps",
    channel: payload.user.id,
    text: `Requesting feed validation record for \`${value}\`. This can take about 10 seconds…`,
  });
}

export async function generateRecord(DomainName, userId) {
  const role = await devopsRole("838846856186");

  const acm = new ACMClient({
    apiVersion: "2015-12-08",
    region: "us-east-1",
    credentials: {
      accessKeyId: role.Credentials.AccessKeyId,
      secretAccessKey: role.Credentials.SecretAccessKey,
      sessionToken: role.Credentials.SessionToken,
    },
  });

  const certRequest = await acm.send(
    new RequestCertificateCommand({
      DomainName,
      ValidationMethod: "DNS",
      Tags: [
        {
          Key: "prx:lifetime",
          Value: "temporary",
        },
      ],
    }),
  );

  await new Promise((resolve) => setTimeout(resolve, 15000));

  const certData = await acm.send(
    new DescribeCertificateCommand({
      CertificateArn: certRequest.CertificateArn,
    }),
  );

  const record = certData.Certificate.DomainValidationOptions[0].ResourceRecord;

  await web.chat.postMessage({
    icon_emoji: ":ops-acm:",
    username: "AWS Certificate Manager via DevOps",
    channel: userId,
    text: [
      `Validation record for \`${DomainName}\`:`,
      `> \`${record.Name}\``,
      `> \`${record.Type}\``,
      `> \`${record.Value}\``,
    ].join("\n"),
  });

  await acm.send(
    new DeleteCertificateCommand({
      CertificateArn: certRequest.CertificateArn,
    }),
  );
}

export async function handleBlockActionPayload(payload) {
  const actionId = payload.actions[0].action_id;

  switch (actionId) {
    case "acm-feed-validation-generator_open-model":
      await openModal(payload);
      break;
    default:
      break;
  }
}

export async function handleViewSubmissionPayload(payload) {
  const callbackId = payload.view.callback_id;

  switch (callbackId) {
    case "acm-feed-validation-generator_generate-record":
      await generateRecordAsync(payload);
      break;
    default:
      break;
  }
}
