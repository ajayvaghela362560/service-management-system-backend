import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import mime from "mime-types";
import { environmentVariablesConfig } from "../config/appConfig.js";

// Configure AWS S3 Client (v3 SDK)
const s3Client = new S3Client({
  region: environmentVariablesConfig.aws_region,
  credentials: {
    accessKeyId: environmentVariablesConfig.aws_access_key_id,
    secretAccessKey: environmentVariablesConfig.aws_secret_access_key,
  },
});

// Upload file to S3
const uploadFileToS3 = async (file) => {
  const { buffer, mimetype } = await file;
  const uuid = uuidv4();
  const extension = mime.extension(mimetype);

  const fileKey = `${uuid}.${extension}`;

  const params = {
    Bucket: environmentVariablesConfig.aws_bucket_name,
    Key: fileKey,
    Body: buffer,
    // ACL: "public-read",
  };

  await s3Client.send(new PutObjectCommand(params));

  return {
    url: `https://${environmentVariablesConfig.aws_bucket_name}.s3.${environmentVariablesConfig.aws_region}.amazonaws.com/${fileKey}`
  };
};

export { uploadFileToS3 };