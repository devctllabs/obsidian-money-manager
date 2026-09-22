import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { CalendarPicker, type PickerMode } from './CalendarPicker';

function Preview({
  mode = 'date',
  pickerMode = 'desktop',
}: {
  mode?: 'date' | 'month' | 'year';
  pickerMode?: PickerMode;
}) {
  const [value, setValue] = useState(
    mode === 'date' ? '2026-09-13' : mode === 'month' ? '2026-09' : '2026',
  );
  return (
    <div style={{ padding: 24, width: 320 }}>
      <CalendarPicker
        label={mode === 'date' ? 'Date' : mode === 'month' ? 'Month period' : 'Year period'}
        mode={mode}
        pickerMode={pickerMode}
        value={value}
        max={mode === 'date' ? '2026-09-13' : undefined}
        change={setValue}
      />
    </div>
  );
}

const meta = { title: 'Features/UI/CalendarPicker', component: Preview } satisfies Meta<
  typeof Preview
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const DesktopDate: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }));
    await expect(page.getByRole('dialog', { name: 'Choose date' })).toBeVisible();
  },
};
export const DesktopMonth: Story = {
  args: { mode: 'month' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Month period' }));
    await userEvent.click(page.getByRole('button', { name: 'March' }));
    await expect(canvas.getByRole('button', { name: 'Month period' })).toHaveTextContent('03.2026');
    await userEvent.click(canvas.getByRole('button', { name: 'Month period' }));
    await expect(page.getByRole('dialog', { name: 'Choose month' })).toBeVisible();
  },
};
export const MonthYearChange: Story = {
  args: { mode: 'month' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Month period' }));
    await userEvent.click(page.getByRole('button', { name: 'Choose year' }));
    await userEvent.click(page.getByRole('button', { name: '2024' }));
    await expect(canvas.getByRole('button', { name: 'Month period' })).toHaveTextContent('09.2024');
    await expect(page.getByRole('dialog', { name: 'Choose month' })).toBeVisible();
  },
};
export const MonthYearArrow: Story = {
  args: { mode: 'month' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Month period' }));
    await userEvent.click(page.getByRole('button', { name: 'Previous year' }));
    await expect(canvas.getByRole('button', { name: 'Month period' })).toHaveTextContent('09.2025');
    await expect(page.getByRole('dialog', { name: 'Choose month' })).toBeVisible();
  },
};
export const DesktopYear: Story = {
  args: { mode: 'year' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Year period' }));
  },
};
export const DirectYearInput: Story = {
  args: { mode: 'year' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Year period' }));
    await userEvent.clear(page.getByRole('spinbutton', { name: 'Year' }));
    await userEvent.type(page.getByRole('spinbutton', { name: 'Year' }), '20');
    await expect(canvas.getByRole('button', { name: 'Year period' })).toHaveTextContent('2026');
    await userEvent.type(page.getByRole('spinbutton', { name: 'Year' }), '24');
    await expect(canvas.getByRole('button', { name: 'Year period' })).toHaveTextContent('2024');
    await expect(page.getByRole('dialog', { name: 'Choose year' })).toBeVisible();
    await userEvent.keyboard('{Enter}');
    await expect(page.queryByRole('dialog', { name: 'Choose year' })).not.toBeInTheDocument();
  },
};
export const MobileNative: Story = { args: { pickerMode: 'native' }, globals: { frame: 'mobile' } };
