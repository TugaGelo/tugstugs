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
      PUBLIC_BUCKET_URL: envField.string({ 
        context: 'client', 
        access: 'public' 
      }),
    }
  }
});
