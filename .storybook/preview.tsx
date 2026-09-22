import type { Preview } from '@storybook/react-vite';
import './obsidian-theme.css';
import '../styles.css';
const preview: Preview = {
  globalTypes: {
    theme: { toolbar: { icon: 'paintbrush', items: ['light', 'dark'] } },
    frame: { toolbar: { icon: 'browser', items: ['leaf', 'narrow', 'mobile'] } },
  },
  initialGlobals: { theme: 'light', frame: 'leaf' },
  decorators: [
    (Story, context) => (
      <div
        className={`mm-host theme-${String(context.globals.theme)}`}
        style={{ width: context.globals.frame === 'leaf' ? '100%' : '390px', maxWidth: '100%' }}
      >
        <div className="money-manager">
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: { a11y: { test: 'error' }, layout: 'fullscreen' },
};
export default preview;
