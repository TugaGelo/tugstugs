import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSecret } from "astro:env/server";

export async function getLibrary(): Promise<{ title: string; path: string }[]> {
  const accountId = getSecret("R2_ACCOUNT_ID") as string;
  const accessKey = getSecret("R2_ACCESS_KEY_ID") as string;
  const secretKey = getSecret("R2_SECRET_ACCESS_KEY") as string;
  const bucketName = getSecret("R2_BUCKET_NAME") as string;

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKey, 
      secretAccessKey: secretKey,
    },
  });

  const command = new ListObjectsV2Command({
    Bucket: bucketName,
  });

  try {
    const { Contents } = await s3.send(command);
    if (!Contents) return [];

    return Contents
      .filter(item => {
        const lowerKey = item.Key?.toLowerCase() || "";
        return lowerKey.endsWith('.mp3') || lowerKey.endsWith('.m4a');
      })
      .map(item => {
        const fullPath = item.Key || "";
        const cleanTitle = fullPath.split('/').pop()?.replace(/\.(mp3|m4a)$/i, "") || fullPath;
        
        return {
          title: cleanTitle,
          path: fullPath
        };
      });
  } catch (err) {
    console.error("R2 Connection Error:", err);
    return [];
  }
}
