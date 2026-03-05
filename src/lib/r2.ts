import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

export async function getLibrary(credentials?: any): Promise<{ title: string; path: string }[]> {
  const accountId = credentials?.accountId || import.meta.env.R2_ACCOUNT_ID;
  const accessKey = credentials?.accessKey || import.meta.env.R2_ACCESS_KEY_ID;
  const secretKey = credentials?.secretKey || import.meta.env.R2_SECRET_ACCESS_KEY;
  const bucketName = credentials?.bucketName || import.meta.env.R2_BUCKET_NAME;

  if (!accountId || !accessKey) {
     console.error("Missing R2 credentials! Check local .env or Cloudflare settings.");
     return [];
  }

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
