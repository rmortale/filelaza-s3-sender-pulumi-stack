import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

let config = new pulumi.Config();
let prefix = config.require("prefix");
let adapterBucket = config.require("adapterBucket");

const uploadStack = new pulumi.StackReference(adapterBucket);
const s3BucketName = uploadStack.getOutput("s3bucket");

const s3objCreated = new aws.cloudwatch.EventRule(`${prefix}-s3ObjectCreated`, {
    description: "Capture each S3 object created event",
    eventPattern: s3BucketName.apply(name =>
        JSON.stringify({
            "source": ["aws.s3"],
            "detail-type": ["Object Created"],
            "detail": {
                "bucket": {
                    "name": [name]
                }
            }
        })
    )
});

export const eventrule = s3objCreated;
