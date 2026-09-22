import { createPortal } from 'react-dom';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from 'react';
import { ChevronIcon } from './Icons';
import { portalTheme } from './portal-theme';

export type PickerMode = 'desktop' | 'native';
type CalendarMode = 'date' | 'month' | 'year';
type CalendarView = 'days' | 'months' | 'years';

interface CalendarPickerProps {
  label: string;
  mode: CalendarMode;
  pickerMode: PickerMode;
  value: string;
  change: (value: string) => void;
  max?: string;
  name?: string;
  required?: boolean;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function CalendarPicker(props: CalendarPickerProps) {
  if (props.pickerMode === 'native') return <NativeCalendarPicker {...props} />;
  return <DesktopCalendarPicker {...props} />;
}

function NativeCalendarPicker({
  label,
  mode,
  value,
  change,
  max,
  name,
  required,
}: CalendarPickerProps) {
  const type = mode === 'year' ? 'number' : mode;
  return (
    <label className="mm-calendar-field">
      {label}
      <input
        name={name}
        type={type}
        min={mode === 'year' ? 1 : undefined}
        max={mode === 'year' ? 9999 : max}
        required={required}
        value={value}
        onChange={(event) => {
          const next = event.currentTarget.value;
          if (next) change(next);
        }}
      />
    </label>
  );
}

function DesktopCalendarPicker(props: CalendarPickerProps) {
  const [anchor, setAnchor] = useState<{
    origin: HTMLButtonElement;
    position: CSSProperties;
  } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  return (
    <div className="mm-calendar-field">
      <span id={`${id}-label`}>{props.label}</span>
      {props.name && <input type="hidden" name={props.name} value={props.value} />}
      <button
        ref={trigger}
        type="button"
        className="mm-calendar-trigger"
        aria-labelledby={`${id}-label`}
        aria-haspopup="dialog"
        aria-expanded={anchor !== null}
        aria-controls={anchor ? id : undefined}
        onClick={() => {
          const origin = trigger.current;
          if (!origin) return;
          const position = popoverPosition(origin);
          setAnchor((current) => (current ? null : { origin, position }));
        }}
      >
        <span>{formatPickerValue(props.mode, props.value)}</span>
        <CalendarGlyph />
      </button>
      {anchor && (
        <CalendarPopover
          {...props}
          id={id}
          origin={anchor.origin}
          position={anchor.position}
          close={() => setAnchor(null)}
        />
      )}
    </div>
  );
}

function CalendarPopover({
  id,
  origin,
  position,
  close,
  ...props
}: CalendarPickerProps & {
  id: string;
  origin: HTMLButtonElement;
  position: CSSProperties;
  close: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const view = origin.ownerDocument.defaultView;
  useDismissPopover(origin, panel, close);
  useEffect(() => {
    const handle = view?.setTimeout(
      () => panel.current?.querySelector<HTMLElement>('.is-selected, input, button')?.focus(),
      0,
    );
    return () => {
      if (handle !== undefined) view?.clearTimeout(handle);
    };
  }, [view]);
  return createPortal(
    <div
      ref={panel}
      id={id}
      className="money-manager mm-calendar-popover"
      role="dialog"
      aria-label={`Choose ${props.mode}`}
      style={position}
    >
      <CalendarPanel
        {...props}
        close={() => {
          close();
          origin.focus();
        }}
      />
    </div>,
    origin.ownerDocument.body,
  );
}

function CalendarPanel({
  mode,
  value,
  change,
  max,
  close,
}: CalendarPickerProps & { close: () => void }) {
  const initial = pickerParts(mode, value);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [view, setView] = useState<CalendarView>(
    mode === 'date' ? 'days' : mode === 'month' ? 'months' : 'years',
  );
  const [yearInput, setYearInput] = useState(String(initial.year));
  const maxYear = max ? Number(max.slice(0, 4)) : 9999;
  const applyReportYear = (next: number) => {
    const formatted = String(next).padStart(4, '0');
    const nextValue = mode === 'month' ? `${formatted}-${pad(month + 1)}` : formatted;
    if (mode !== 'date' && nextValue !== value) change(nextValue);
  };
  const chooseYear = (next: number) => {
    setYear(next);
    setYearInput(String(next));
    applyReportYear(next);
    if (mode === 'year') {
      close();
      return;
    }
    setView('months');
  };
  const chooseMonth = (next: number) => {
    setMonth(next);
    if (mode === 'month') {
      change(`${String(year).padStart(4, '0')}-${pad(next + 1)}`);
      close();
      return;
    }
    setView('days');
  };
  const updateYear = (next: string) => {
    setYearInput(next);
    const parsed = completeYear(next, maxYear);
    if (parsed === null) return;
    setYear(parsed);
    applyReportYear(parsed);
  };
  const navigation = { view, year, month, max };
  const navigate = (direction: number) => {
    const next = movedDisplay(direction, navigation);
    setYear(next.year);
    setYearInput(String(next.year));
    setMonth(next.month);
    if (mode === 'month' && view === 'months') applyReportYear(next.year);
  };
  return (
    <>
      <CalendarHeader
        mode={mode}
        view={view}
        year={year}
        month={month}
        yearInput={yearInput}
        maxYear={maxYear}
        navigation={navigation}
        navigate={navigate}
        updateYear={updateYear}
        resetYear={() => setYearInput(String(year))}
        chooseYear={chooseYear}
        showMonths={() => setView('months')}
        showYears={() => setView('years')}
        close={close}
      />
      {view === 'years' ? (
        <YearGrid year={year} maxYear={maxYear} choose={chooseYear} />
      ) : view === 'months' ? (
        <MonthGrid year={year} month={month} max={max} mode={mode} choose={chooseMonth} />
      ) : (
        <DayGrid
          year={year}
          month={month}
          value={value}
          max={max}
          choose={(date) => {
            change(date);
            close();
          }}
          setDisplay={(nextYear, nextMonth) => {
            setYear(nextYear);
            setYearInput(String(nextYear));
            setMonth(nextMonth);
          }}
        />
      )}
    </>
  );
}

function CalendarHeader({
  mode,
  view,
  year,
  month,
  yearInput,
  maxYear,
  navigation,
  navigate,
  updateYear,
  resetYear,
  chooseYear,
  showMonths,
  showYears,
  close,
}: {
  mode: CalendarMode;
  view: CalendarView;
  year: number;
  month: number;
  yearInput: string;
  maxYear: number;
  navigation: CalendarDisplay;
  navigate: (direction: number) => void;
  updateYear: (year: string) => void;
  resetYear: () => void;
  chooseYear: (year: number) => void;
  showMonths: () => void;
  showYears: () => void;
  close: () => void;
}) {
  return (
    <div className="mm-calendar-header">
      <button
        type="button"
        className="mm-icon-button"
        aria-label={previousLabel(view)}
        disabled={!canMove(-1, navigation)}
        onClick={() => navigate(-1)}
      >
        <ChevronIcon direction="left" />
      </button>
      {mode === 'year' ? (
        <span className="mm-calendar-period-label">Year</span>
      ) : (
        <button
          type="button"
          className="mm-calendar-month"
          aria-label="Choose month"
          onClick={showMonths}
        >
          {MONTHS[month]}
        </button>
      )}
      <input
        aria-label="Year"
        inputMode="numeric"
        type="number"
        min="1"
        max={maxYear}
        value={yearInput}
        onChange={(event) => updateYear(event.currentTarget.value)}
        onBlur={resetYear}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          const next = completeYear(event.currentTarget.value, maxYear);
          if (next === null) return;
          if (mode === 'year') close();
          else chooseYear(next);
        }}
      />
      <button
        type="button"
        className="mm-icon-button mm-calendar-year-toggle"
        aria-label="Choose year"
        aria-pressed={view === 'years'}
        onClick={showYears}
      >
        <ChevronIcon />
      </button>
      <button
        type="button"
        className="mm-icon-button"
        aria-label={nextLabel(view)}
        disabled={!canMove(1, navigation)}
        onClick={() => navigate(1)}
      >
        <ChevronIcon direction="right" />
      </button>
    </div>
  );
}

function YearGrid({
  year,
  maxYear,
  choose,
}: {
  year: number;
  maxYear: number;
  choose: (year: number) => void;
}) {
  const start = Math.floor(year / 12) * 12;
  return (
    <div className="mm-calendar-grid mm-year-grid" aria-label={`${start}–${start + 11}`}>
      {Array.from({ length: 12 }, (_, index) => start + index).map((value) => (
        <button
          type="button"
          key={value}
          className={value === year ? 'is-selected' : undefined}
          aria-pressed={value === year}
          disabled={value < 1 || value > maxYear}
          onClick={() => choose(value)}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

function MonthGrid({
  year,
  month,
  max,
  mode,
  choose,
}: {
  year: number;
  month: number;
  max?: string;
  mode: CalendarMode;
  choose: (month: number) => void;
}) {
  const selected = pickerParts(
    mode,
    mode === 'year' ? String(year) : `${String(year).padStart(4, '0')}-${pad(month + 1)}`,
  );
  return (
    <div className="mm-calendar-grid mm-month-grid" aria-label={`Months in ${year}`}>
      {MONTHS.map((label, index) => {
        const unavailable = Boolean(
          max && `${String(year).padStart(4, '0')}-${pad(index + 1)}` > max.slice(0, 7),
        );
        return (
          <button
            type="button"
            key={label}
            className={
              selected.year === year && selected.month === index ? 'is-selected' : undefined
            }
            aria-pressed={selected.year === year && selected.month === index}
            disabled={unavailable}
            onClick={() => choose(index)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function DayGrid({
  year,
  month,
  value,
  max,
  choose,
  setDisplay,
}: {
  year: number;
  month: number;
  value: string;
  max?: string;
  choose: (date: string) => void;
  setDisplay: (year: number, month: number) => void;
}) {
  const leading = (weekday(year, month, 1) + 6) % 7;
  const days = daysInMonth(year, month);
  const selectedInMonth = value.startsWith(`${String(year).padStart(4, '0')}-${pad(month + 1)}-`);
  return (
    <div className="mm-day-grid" role="group" aria-label={`${MONTHS[month]} ${year}`}>
      {WEEKDAYS.map((day) => (
        <span aria-hidden="true" key={day}>
          {day}
        </span>
      ))}
      {Array.from({ length: leading }, (_, index) => (
        <i aria-hidden="true" key={`empty-${index}`} />
      ))}
      {Array.from({ length: days }, (_, index) => {
        const day = index + 1;
        const date = isoDate(year, month, day);
        return (
          <button
            type="button"
            key={date}
            data-date={date}
            className={date === value ? 'is-selected' : undefined}
            aria-label={`${day} ${MONTHS[month]} ${year}`}
            aria-pressed={date === value}
            disabled={Boolean(max && date > max)}
            tabIndex={date === value || (!selectedInMonth && day === 1) ? 0 : -1}
            onClick={() => choose(date)}
            onKeyDown={(event) => moveDayFocus(event, date, max, setDisplay)}
          >
            {day}
          </button>
        );
      })}
    </div>
  );
}

function moveDayFocus(
  event: ReactKeyboardEvent<HTMLButtonElement>,
  date: string,
  max: string | undefined,
  setDisplay: (year: number, month: number) => void,
) {
  const offsets: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7,
  };
  let next = offsets[event.key] ? shiftDate(date, offsets[event.key]!) : null;
  if (event.key === 'Home') next = shiftDate(date, -((weekday(...dateParts(date)) + 6) % 7));
  if (event.key === 'End') next = shiftDate(date, 6 - ((weekday(...dateParts(date)) + 6) % 7));
  if (event.key === 'PageUp') next = shiftDateMonth(date, -1);
  if (event.key === 'PageDown') next = shiftDateMonth(date, 1);
  if (!next || (max && next > max)) return;
  event.preventDefault();
  const ownerDocument = event.currentTarget.ownerDocument;
  const [nextYear, nextMonth] = dateParts(next);
  setDisplay(nextYear, nextMonth);
  ownerDocument.defaultView?.setTimeout(
    () => ownerDocument.querySelector<HTMLElement>(`[data-date="${next}"]`)?.focus(),
    0,
  );
}

function popoverPosition(origin: HTMLElement): CSSProperties {
  const rect = origin.getBoundingClientRect();
  const view = origin.ownerDocument.defaultView!;
  const width = Math.min(304, view.innerWidth - 16);
  const height = 340;
  const below = rect.bottom + 6;
  return {
    ...portalTheme(origin),
    left: Math.max(8, Math.min(rect.left, view.innerWidth - width - 8)),
    top: below + height <= view.innerHeight - 8 ? below : Math.max(8, rect.top - height - 6),
  };
}

function useDismissPopover(
  origin: HTMLElement,
  panel: RefObject<HTMLDivElement | null>,
  close: () => void,
) {
  useEffect(() => {
    const ownerDocument = origin.ownerDocument;
    const pointer = (event: PointerEvent) => {
      if (!panel.current?.contains(event.target as Node) && !origin.contains(event.target as Node))
        close();
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        origin.focus();
      }
    };
    const resize = () => close();
    ownerDocument.addEventListener('pointerdown', pointer);
    ownerDocument.addEventListener('keydown', keyboard);
    ownerDocument.defaultView?.addEventListener('resize', resize);
    return () => {
      ownerDocument.removeEventListener('pointerdown', pointer);
      ownerDocument.removeEventListener('keydown', keyboard);
      ownerDocument.defaultView?.removeEventListener('resize', resize);
    };
  }, [close, origin, panel]);
}

function pickerParts(mode: CalendarMode, value: string) {
  const parts = value.split('-').map(Number);
  return {
    year: parts[0] || 1,
    month: mode === 'year' ? 0 : Math.max(0, Math.min(11, (parts[1] || 1) - 1)),
  };
}
function completeYear(value: string, maxYear: number) {
  if (!/^\d{4}$/u.test(value)) return null;
  const year = Number(value);
  return year >= 1 && year <= maxYear ? year : null;
}
function formatPickerValue(mode: CalendarMode, value: string) {
  if (mode === 'year') return value.slice(0, 4);
  if (mode === 'month') return `${value.slice(5, 7)}.${value.slice(0, 4)}`;
  return `${value.slice(8, 10)}.${value.slice(5, 7)}.${value.slice(0, 4)}`;
}
interface CalendarDisplay {
  view: CalendarView;
  year: number;
  month: number;
  max?: string;
}
function movedDisplay(direction: number, display: CalendarDisplay) {
  if (display.view !== 'days')
    return { ...display, year: display.year + direction * (display.view === 'years' ? 12 : 1) };
  const total = display.year * 12 + display.month + direction;
  return { ...display, year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}
function canMove(direction: number, display: CalendarDisplay) {
  if (direction < 0) return canMoveBack(display);
  if (!display.max) return canMoveForward(display);
  return canMoveBeforeMaximum(display);
}
function canMoveBack({ view, year, month }: CalendarDisplay) {
  return view === 'days' ? year > 1 || month > 0 : year > (view === 'years' ? 12 : 1);
}
function canMoveForward({ view, year, month }: CalendarDisplay) {
  return view === 'days' ? year < 9999 || month < 11 : year < (view === 'years' ? 9988 : 9999);
}
function canMoveBeforeMaximum({ view, year, month, max = '' }: CalendarDisplay) {
  const maxYear = Number(max.slice(0, 4));
  const maxMonth = Number(max.slice(5, 7)) - 1;
  return view === 'days'
    ? year < maxYear || (year === maxYear && month < maxMonth)
    : year < maxYear;
}
function previousLabel(view: 'days' | 'months' | 'years') {
  return view === 'days'
    ? 'Previous month'
    : view === 'months'
      ? 'Previous year'
      : 'Previous years';
}
function nextLabel(view: 'days' | 'months' | 'years') {
  return view === 'days' ? 'Next month' : view === 'months' ? 'Next year' : 'Next years';
}
function CalendarGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none">
      <rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8 3v6M16 3v6M4 11h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
function pad(value: number) {
  return String(value).padStart(2, '0');
}
function isoDate(year: number, month: number, day: number) {
  return `${String(year).padStart(4, '0')}-${pad(month + 1)}-${pad(day)}`;
}
function dateParts(value: string): [number, number, number] {
  const [year, month, day] = value.split('-').map(Number);
  return [year!, month! - 1, day!];
}
function calendarDate(year: number, month: number, day: number) {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month, day);
  return date;
}
function weekday(year: number, month: number, day: number) {
  return calendarDate(year, month, day).getUTCDay();
}
function daysInMonth(year: number, month: number) {
  return calendarDate(year, month + 1, 0).getUTCDate();
}
function shiftDate(value: string, days: number) {
  const parts = dateParts(value);
  const date = calendarDate(...parts);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
function shiftDateMonth(value: string, months: number) {
  const [year, month, day] = dateParts(value);
  const target = calendarDate(year, month + months, 1);
  return isoDate(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    Math.min(day, daysInMonth(target.getUTCFullYear(), target.getUTCMonth())),
  );
}
