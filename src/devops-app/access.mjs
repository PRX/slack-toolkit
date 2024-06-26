/** @typedef {import('@aws-sdk/client-organizations').ListAccountsResponse} ListAccountsResponse */
/** @typedef {import('@aws-sdk/client-sts').AssumeRoleResponse} AssumeRoleResponse */

import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import {
  OrganizationsClient,
  ListAccountsCommand,
} from "@aws-sdk/client-organizations";

const sts = new STSClient({ apiVersion: "2011-06-15" });

export function regions() {
  return ["us-east-1", "us-east-2", "us-west-2"];
}

/**
 * Returns an assumed DevOps role from the given account
 * @param {string} awsAccountId
 * @returns {Promise<AssumeRoleResponse>}
 */
export async function devopsRole(awsAccountId) {
  const roleArn = `arn:aws:iam::${awsAccountId}:role/${process.env.DEVOPS_CROSS_ACCOUNT_ACCESS_ROLE_NAME}`;

  return sts.send(
    new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: "devops_slack_app",
    }),
  );
}

/**
 * Returns an assumed Organization data sharing role from the given account
 * @returns {Promise<AssumeRoleResponse>}
 */
export async function orgSharingRole() {
  return sts.send(
    new AssumeRoleCommand({
      RoleArn: process.env.AWS_ORGANIZATION_CROSS_ACCOUNT_SHARING_ROLE_ARN,
      RoleSessionName: "devops_slack_app",
    }),
  );
}

/**
 * Returns a list of all AWS accounts that exist in an organization
 * @returns {Promise<ListAccountsResponse>}
 */
export async function orgAccounts() {
  // Assume a role within the Organization's management account that has
  // permission to `listAccounts`
  // This is NOT the DevOps shared access account, which exists in each account.
  // It's a different role that only exists in the management account.
  const role = await orgSharingRole();

  // The organizations endpoint only exists in us-east-1
  const organizations = new OrganizationsClient({
    apiVersion: "2016-11-28",
    region: "us-east-1",
    credentials: {
      accessKeyId: role.Credentials.AccessKeyId,
      secretAccessKey: role.Credentials.SecretAccessKey,
      sessionToken: role.Credentials.SessionToken,
    },
  });

  const accounts = await organizations.send(new ListAccountsCommand({}));

  return accounts;
}
