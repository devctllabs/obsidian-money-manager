import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within } from 'storybook/test';
import { WorkspaceSetup } from './WorkspaceSetup';
const meta = {
  title: 'Features/Settings/Views/WorkspaceSetup',
  component: WorkspaceSetup,
  args: {
    root: 'Money Manager',
    setup: fn(async () => undefined),
    connect: fn(async () => undefined),
  },
} satisfies Meta<typeof WorkspaceSetup>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Preview: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Review setup' }));
  },
};
