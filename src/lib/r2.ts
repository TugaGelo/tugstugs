import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID, R2_BUCKET_NAME } from 'astro:env/server';

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID, 
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function getLibrary(): Promise<{ title: string; path: string }[]> {
  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME,
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
