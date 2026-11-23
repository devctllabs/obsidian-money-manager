import { useId, useRef, useState } from 'react';
import type { PickerMode } from './CalendarPicker';
import { DialogSurface } from './DialogSurface';
import { Form, field } from './Form';
import { ClockIcon, CloseIcon } from './Icons';

export function TimeField({ mode, initial }: { mode: PickerMode; initial?: string }) {
  const id = useId();
  const control = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(initial ?? '');
  const [origin, setOrigin] = useState<HTMLButtonElement | null>(null);
  const [hour = '00', minute = '00'] = value ? value.split(':') : [];
  const choose = (next: string) => {
    setValue(next);
    setOrigin(null);
  };
  return (
    <div className="mm-calendar-field">
      <span id={id}>Time (optional)</span>
      <div className="mm-time-control" ref={control}>
        {mode === 'native' ? (
          <input
            type="time"
            name="time"
            aria-labelledby={id}
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
          />
        ) : (
          <>
            <input type="hidden" name="time" value={value} />
            <button
              type="button"
              className="mm-calendar-trigger"
              aria-labelledby={id}
              aria-haspopup="dialog"
              aria-expanded={origin !== null}
              onClick={(event) => setOrigin(event.currentTarget)}
            >
              <span>{value || 'HH:mm'}</span>
              {!value && <ClockIcon />}
            </button>
          </>
        )}
        {value && (
          <button
            type="button"
            className="mm-icon-button mm-time-clear"
            aria-label="Clear time"
            title="Clear time"
            onClick={() => {
              setValue('');
              control.current?.querySelector<HTMLElement>('[aria-labelledby]')?.focus();
            }}
          >
            <CloseIcon />
          </button>
        )}
      </div>
      {origin && (
        <DialogSurface title="Choose time" origin={origin} close={() => setOrigin(null)}>
          <div onSubmit={(event) => event.stopPropagation()}>
            <Form
              label="Set time"
              submit={(data) => {
                const nextHour = field(data, 'hour').padStart(2, '0');
                const nextMinute = field(data, 'minute').padStart(2, '0');
                if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(`${nextHour}:${nextMinute}`))
                  return Promise.reject(new Error('Enter a valid 24-hour time.'));
                choose(`${nextHour}:${nextMinute}`);
                return Promise.resolve();
              }}
            >
              <div className="mm-date-time">
                <label>
                  Hour
                  <input name="hour" type="number" min="0" max="23" required defaultValue={hour} />
                </label>
                <label>
                  Minute
                  <input
                    name="minute"
                    type="number"
                    min="0"
                    max="59"
                    required
                    defaultValue={minute}
                  />
                </label>
              </div>
            </Form>
          </div>
        </DialogSurface>
      )}
    </div>
  );
}
