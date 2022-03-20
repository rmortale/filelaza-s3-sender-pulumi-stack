import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { eventrule } from "./eventbridge";

let config = new pulumi.Config();
let prefix = config.require("prefix");
let bucket = config.require("s3senderFunctionBucket");
let key = config.require("s3senderFunctionKey");

// Configure IAM so that the AWS Lambda can be run.
const role = new aws.iam.Role(`${prefix}-functionRole`, {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "lambda.amazonaws.com"
    })
});
new aws.iam.RolePolicyAttachment(`${prefix}-funcBasicRoleAttach`, {
    role: role,
    policyArn: aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole,
});
new aws.iam.RolePolicyAttachment(`${prefix}-funcS3RoleAttach`, {
    role: role,
    policyArn: aws.iam.ManagedPolicies.AmazonS3FullAccess,
});

// Next, create the Lambda function itself:
const lambda = new aws.lambda.Function(`${prefix}-s3-adapter-function`, {
    s3Bucket: bucket,
    s3Key: key,
    runtime: aws.lambda.Java11Runtime,
    architectures: ["arm64"],
    memorySize: 512,
    timeout: 10,
    role: role.arn,
    handler: "io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest",
    environment: {
        variables: {
            URL_EXPIRATION_SECONDS: "300"
        },
    },
});

const eventBridgePermission = new aws.lambda.Permission(`${prefix}-eventBridgePermission`, {
    action: "lambda:InvokeFunction",
    function: lambda.name,
    principal: "events.amazonaws.com",
    sourceArn: pulumi.interpolate`${eventrule.arn}:*`,
});

export const s3adapterFunction = lambda;
