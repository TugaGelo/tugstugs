// @ts-check
import { defineConfig, envField } from 'astro/config';

import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  output: 'server',
  adapter: cloudflare(),

  env: {
    schema: {
      PUBLIC_BUCKET_URL: envField.string({ context: 'client', access: 'public' }),
      R2_ACCESS_KEY_ID: envField.string({ context: 'server', access: 'secret' }),
      R2_SECRET_ACCESS_KEY: envField.string({ context: 'server', access: 'secret' }),
      R2_ACCOUNT_ID: envField.string({ context: 'server', access: 'secret' }),
      R2_BUCKET_NAME: envField.string({ context: 'server', access: 'secret' }),
    }
  }
});
