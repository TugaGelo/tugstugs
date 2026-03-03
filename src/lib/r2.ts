import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { PUBLIC_BUCKET_URL } from 'astro:env/client'; 
import { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID, R2_BUCKET_NAME } from 'astro:env/server';

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID, 
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function getLibrary(): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME,
  });

  try {
    const { Contents } = await s3.send(command);
    
    if (!Contents) return [];

    return Contents
      .map(item => item.Key)
      .filter((key): key is string => {
        if (!key) return false;
        const lowerKey = key.toLowerCase();
        return lowerKey.endsWith('.m4a');
      });
      
  } catch (err) {
    console.error("R2 Connection Error:", err);
    return [];
  }
}
