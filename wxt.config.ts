import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Glance',
    description:
      'Find in page, reimagined — every match with context, in a sleek slide-in panel. Fast on long documents.',
    permissions: ['storage', 'activeTab'],
    browser_specific_settings: {
      gecko: {
        id: 'glance@vokac.dev',
        strict_min_version: '115.0',
        // Glance sends no data anywhere; declare that for AMO (required for new
        // Firefox extensions since Nov 2025).
        data_collection_permissions: { required: ['none'] },
      },
    },
    action: {
      default_title: 'Glance — Find in page (Ctrl+Shift+F)',
    },
    commands: {
      'toggle-glance': {
        suggested_key: {
          default: 'Ctrl+Shift+F',
          mac: 'Command+Shift+F',
        },
        description: 'Toggle the Glance find panel',
      },
    },
  },
});
