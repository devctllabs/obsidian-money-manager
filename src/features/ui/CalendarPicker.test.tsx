import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import { CalendarPicker } from './CalendarPicker';

it('chooses a desktop date through direct year, month, and day navigation', async () => {
  const change = vi.fn();
  render(
    <CalendarPicker
      label="Date"
      mode="date"
      pickerMode="desktop"
      value="2026-09-13"
      max="2026-09-13"
      name="date"
      change={change}
    />,
  );
  const user = userEvent.setup();

  await user.click(screen.getByRole('button', { name: 'Date' }));
  await user.clear(screen.getByRole('spinbutton', { name: 'Year' }));
  await user.type(screen.getByRole('spinbutton', { name: 'Year' }), '2024');
  await user.click(screen.getByRole('button', { name: 'Choose month' }));
  await user.click(screen.getByRole('button', { name: 'February' }));
  await user.click(screen.getByRole('button', { name: '29 February 2024' }));

  expect(change).toHaveBeenCalledWith('2024-02-29');
  expect(screen.queryByRole('dialog', { name: 'Choose date' })).not.toBeInTheDocument();
});

it('offers a twelve-year grid and keeps future entry dates unavailable', async () => {
  render(
    <CalendarPicker
      label="Date"
      mode="date"
      pickerMode="desktop"
      value="2026-09-13"
      max="2026-09-13"
      change={vi.fn()}
    />,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Date' }));
  await user.click(screen.getByRole('button', { name: 'Choose year' }));
  expect(screen.getAllByRole('button', { name: /^20\d{2}$/u })).toHaveLength(12);
  await user.click(screen.getByRole('button', { name: '2026' }));
  await user.click(screen.getByRole('button', { name: 'Choose month' }));
  await user.click(screen.getByRole('button', { name: 'September' }));
  expect(screen.getByRole('button', { name: '14 September 2026' })).toBeDisabled();
});

it('uses native controls in mobile mode', () => {
  render(
    <CalendarPicker
      label="Date"
      mode="date"
      pickerMode="native"
      value="2026-09-13"
      max="2026-09-13"
      name="date"
      change={vi.fn()}
    />,
  );
  expect(screen.getByLabelText('Date')).toHaveAttribute('type', 'date');
});

it('commits a typed report year only after all four digits are present', async () => {
  const change = vi.fn();
  function Harness() {
    const [year, setYear] = useState('2026');
    return (
      <CalendarPicker
        label="Year period"
        mode="year"
        pickerMode="desktop"
        value={year}
        change={(next) => {
          change(next);
          setYear(next);
        }}
      />
    );
  }
  render(<Harness />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Year period' }));
  const input = screen.getByRole('spinbutton', { name: 'Year' });
  await user.clear(input);
  await user.type(input, '20');
  expect(change).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Year period' })).toHaveTextContent('2026');
  await user.tab();
  expect(input).toHaveValue(2026);

  await user.clear(input);
  await user.type(input, '2024');
  expect(change).toHaveBeenCalledTimes(1);
  expect(change).toHaveBeenCalledWith('2024');
  expect(screen.getByRole('button', { name: 'Year period' })).toHaveTextContent('2024');
  await user.keyboard('{Enter}');
  expect(screen.queryByRole('dialog', { name: 'Choose year' })).not.toBeInTheDocument();
});

it('applies a selected year to a month period before the picker closes', async () => {
  const change = vi.fn();
  function Harness() {
    const [period, setPeriod] = useState('2026-09');
    return (
      <CalendarPicker
        label="Month period"
        mode="month"
        pickerMode="desktop"
        value={period}
        change={(next) => {
          change(next);
          setPeriod(next);
        }}
      />
    );
  }
  render(<Harness />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Month period' }));
  await user.click(screen.getByRole('button', { name: 'Choose year' }));
  await user.click(screen.getByRole('button', { name: '2024' }));

  expect(change).toHaveBeenCalledOnce();
  expect(change).toHaveBeenLastCalledWith('2024-09');
  expect(screen.getByRole('button', { name: 'Month period' })).toHaveTextContent('09.2024');
  expect(screen.getByRole('dialog', { name: 'Choose month' })).toBeVisible();

  const input = screen.getByRole('spinbutton', { name: 'Year' });
  await user.clear(input);
  await user.type(input, '2025');
  expect(change).toHaveBeenCalledTimes(2);
  expect(change).toHaveBeenLastCalledWith('2025-09');
  await user.keyboard('{Enter}');
  expect(change).toHaveBeenCalledTimes(2);
  await user.click(screen.getByRole('button', { name: 'Previous year' }));
  expect(change).toHaveBeenCalledTimes(3);
  expect(change).toHaveBeenLastCalledWith('2024-09');
  expect(screen.getByRole('button', { name: 'Month period' })).toHaveTextContent('09.2024');
});

it('commits month and year report periods from the shared picker', async () => {
  function Harness() {
    const [month, setMonth] = useState('2026-09');
    const [year, setYear] = useState('2026');
    return (
      <>
        <CalendarPicker
          label="Month"
          mode="month"
          pickerMode="desktop"
          value={month}
          change={setMonth}
        />
        <output>{month}</output>
        <CalendarPicker
          label="Year period"
          mode="year"
          pickerMode="desktop"
          value={year}
          change={setYear}
        />
        <output>{year}</output>
      </>
    );
  }
  render(<Harness />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Month' }));
  await user.click(screen.getByRole('button', { name: 'March' }));
  expect(screen.getByText('2026-03')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Month' }));
  expect(screen.getByRole('dialog', { name: 'Choose month' })).toBeVisible();
  await user.clear(screen.getByRole('spinbutton', { name: 'Year' }));
  await user.type(screen.getByRole('spinbutton', { name: 'Year' }), '2024');
  await user.click(screen.getByRole('button', { name: 'March' }));
  expect(screen.getByText('2024-03')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Year period' }));
  await user.clear(screen.getByRole('spinbutton', { name: 'Year' }));
  await user.type(screen.getByRole('spinbutton', { name: 'Year' }), '2024{Enter}');
  expect(screen.getByRole('button', { name: 'Year period' })).toHaveTextContent('2024');
});
