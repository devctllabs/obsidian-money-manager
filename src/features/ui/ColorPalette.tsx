import { CheckIcon } from './Icons';
const SWATCHES = [
  ['Indigo', '#5B5BD6'],
  ['Blue', '#2563EB'],
  ['Teal', '#0F766E'],
  ['Green', '#4D7C0F'],
  ['Amber', '#B45309'],
  ['Rose', '#BE185D'],
] as const;
export function ColorPalette({
  value,
  change,
  automatic = 'Automatic',
  disabled = false,
}: {
  value: string;
  change: (color: string) => void;
  automatic?: string;
  disabled?: boolean;
}) {
  return (
    <div className="mm-color-swatches" role="group" aria-label="Color palette">
      <button type="button" disabled={disabled} aria-pressed={!value} onClick={() => change('')}>
        {automatic}
      </button>
      {SWATCHES.map(([name, color]) => (
        <button
          type="button"
          key={color}
          disabled={disabled}
          className="mm-color-swatch"
          aria-label={name}
          title={name}
          aria-pressed={value.toUpperCase() === color}
          onClick={() => change(color)}
        >
          <span style={{ backgroundColor: color }} />
          {value.toUpperCase() === color && <CheckIcon />}
        </button>
      ))}
    </div>
  );
}
