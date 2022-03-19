import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { s3adapterFunction } from "./lambda";
import { eventrule } from "./eventbridge";

let config = new pulumi.Config();
let prefix = config.require("prefix");

const s3eventTarget = new aws.cloudwatch.EventTarget(`${prefix}-s3-event-target`, {
    rule: eventrule.name,
    targetId: "SendToS3Lambda",
    arn: s3adapterFunction.arn,
});

export const lambda = s3adapterFunction.arn;

