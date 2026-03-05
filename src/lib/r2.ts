import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

export async function getLibrary(env?: any): Promise<{ title: string; path: string }[]> {
  const bucket = env?.LIBRARY_BUCKET;

  if (bucket) {
    try {
      const listed = await bucket.list();
      const contents = listed.objects;

      if (!contents || contents.length === 0) return [];

      return contents
        .filter((item: any) => {
          const lowerKey = item.key?.toLowerCase() || "";
          return lowerKey.endsWith('.mp3') || lowerKey.endsWith('.m4a');
        })
        .map((item: any) => {
          const fullPath = item.key || "";
          const cleanTitle = fullPath.split('/').pop()?.replace(/\.(mp3|m4a)$/i, "") || fullPath;
          
          return { title: cleanTitle, path: fullPath };
        });
    } catch (err) {
      console.error("Native R2 Connection Error:", err);
      return [];
    }
  }

  console.log("No Cloudflare Binding found. Falling back to AWS SDK for local dev...");
  
  const accountId = import.meta.env.R2_ACCOUNT_ID;
  const accessKey = import.meta.env.R2_ACCESS_KEY_ID;
  const secretKey = import.meta.env.R2_SECRET_ACCESS_KEY;
  const bucketName = import.meta.env.R2_BUCKET_NAME;

  if (!accountId || !accessKey) {
     console.error("Missing local R2 credentials in .env!");
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

  try {
    const command = new ListObjectsV2Command({ Bucket: bucketName });
    const { Contents } = await s3.send(command);
    
    if (!Contents) return [];

    return Contents
      .filter((item: any) => {
        const lowerKey = item.Key?.toLowerCase() || "";
        return lowerKey.endsWith('.mp3') || lowerKey.endsWith('.m4a');
      })
      .map((item: any) => {
        const fullPath = item.Key || "";
        const cleanTitle = fullPath.split('/').pop()?.replace(/\.(mp3|m4a)$/i, "") || fullPath;
        return { title: cleanTitle, path: fullPath };
      });
  } catch (err) {
    console.error("Local AWS SDK Connection Error:", err);
    return [];
  }
}
