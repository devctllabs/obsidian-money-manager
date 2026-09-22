import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Configuration } from './Configuration';
import { normalizeSettings } from '../../application/workspace/settings';
const meta = {
  title: 'Features/Settings/Settings/Configuration',
  component: Configuration,
  args: {
    settings: normalizeSettings(null),
    reconnect: fn(async () => undefined),
    save: fn(async () => undefined),
  },
} satisfies Meta<typeof Configuration>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Loaded: Story = {};
export const CustomAccent: Story = {
  args: {
    settings: {
      ...normalizeSettings(null),
      appearance: { accentMode: 'custom', customAccent: '#6655aa' },
    },
  },
};
