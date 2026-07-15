import { WebClient } from "@slack/web-api";

const noAccess = [
  {
    type: "header",
    text: { type: "plain_text", text: `PRX DevOps Dashboard` },
  },
  {
    type: "section",
    text: {
      type: "plain_text",
      text: ":lock: You don't have access to this app.",
    },
  },
];

const div = [{ type: "divider" }];

const feedCert = [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: "AWS Certificate Manager",
      emoji: true,
    },
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "For feeds hosted with a custom domain, we provide a set of validation DNS records to the end user, which they must install in their DNS.",
    },
    accessory: {
      type: "button",
      style: "primary",
      text: {
        type: "plain_text",
        text: "Generate custom feed validation records",
        emoji: true,
      },
      action_id: "acm-feed-validation-generator_open-model",
    },
  },
];

const codepipeline = [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: "AWS CodePipeline",
      emoji: true,
    },
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "When a pipeline execution starts, it runs a revision through every stage and action in the pipeline. You can manually rerun the most recent revision through the pipeline.",
    },
    accessory: {
      type: "button",
      style: "primary",
      text: {
        type: "plain_text",
        text: "Start pipeline execution",
        emoji: true,
      },
      action_id: "codepipeline-execution_open-model",
    },
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "Transitions are links between pipeline stages that can be disabled or enabled. They are enabled by default. When you re-enable a disabled transition, the latest revision runs through the remaining stages of the pipeline unless more than 30 days have passed. Pipeline execution won’t resume for a transition that has been disabled more than 30 days unless a new change is detected or you manually rerun the pipeline. ",
    },
    accessory: {
      type: "button",
      style: "primary",
      text: {
        type: "plain_text",
        text: "Toggle pipeline transitions",
        emoji: true,
      },
      action_id: "codepipeline-transitions_open-model",
    },
  },
];

const cloudfront = [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: "AWS CloudFront",
      emoji: true,
    },
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "If you need to remove a file from CloudFront edge caches before it expires, you can manually <https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html|invalidate> the file from edge caches.",
    },
    accessory: {
      type: "button",
      style: "primary",
      text: {
        type: "plain_text",
        text: "Create invalidation",
        emoji: true,
      },
      action_id: "cloudformation-invalidation_open-model",
    },
  },
];

async function publishBlocks(userId, hash, blocks) {
  const web = new WebClient(process.env.SLACK_ACCESS_TOKEN);
  await web.views.publish({
    user_id: userId,
    view: {
      type: "home",
      blocks: blocks,
    },
    hash,
  });
}

export async function handler(payload) {
  const userId = payload.event.user;
  const { tab } = payload.event;

  console.log("App Home opened");

  // No-op on messages
  if (tab === "messages") {
    console.log("Ignore messages tab");
    return;
  }

  if (tab === "home") {
    let hash;
    if (payload.event.view?.hash) {
      hash = payload.event.view.hash;
    }

    if (process.env.DEVOPS_SLACK_USER_IDS.split(",").includes(userId)) {
      await publishBlocks(userId, hash, [
        ...cloudfront,
        ...div,
        ...codepipeline,
        ...div,
        ...feedCert,
      ]);
    } else if (
      ["U024TS1F2AX", "U0Q4JJ4EB", "U01TJVAV97T", "UC6T53CA1"].includes(userId)
    ) {
      await publishBlocks(userId, hash, [...feedCert]);
    } else {
      await publishBlocks(userId, hash, [...noAccess]);
    }
  }
}
