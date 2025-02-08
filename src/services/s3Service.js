// src/services/s3Service.js
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Debug log to check environment variables
console.log("S3 Configuration:", {
  bucketName: process.env.AWS_S3_BUCKET_NAME,
  region: process.env.AWS_REGION,
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (file, userId) => {
  try {
    const fileExtension = file.originalname.split(".").pop();
    const key = `profile-pictures/${userId}-${Date.now()}.${fileExtension}`;

    const params = {
      Bucket: "schedular-profile-pics",
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    // Return the same URL format that you see working
    const imageUrl = `https://schedular-profile-pics.s3.us-east-1.amazonaws.com/${key}`;
    console.log("Successfully uploaded. URL:", imageUrl);
    return imageUrl;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw error;
  }
};

module.exports = { uploadToS3 };
