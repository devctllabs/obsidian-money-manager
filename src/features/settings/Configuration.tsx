import { AccentSetting } from './AccentSetting';
import { WorkspacePicker } from './WorkspacePicker';
import type { Settings } from '../../application/workspace/settings';
export function Configuration({
  settings,
  reconnect,
  save,
  folders = [],
  createWorkspace,
  reference,
}: {
  settings: Settings;
  reconnect: (root: string) => Promise<void>;
  save: (settings: Settings) => Promise<void>;
  folders?: string[];
  createWorkspace?: (path: string, reference: string) => Promise<void>;
  reference?: string;
}) {
  return (
    <section className="mm-configuration">
      <WorkspacePicker
        value={settings.workspaceRoot}
        folders={folders}
        change={reconnect}
        createWorkspace={createWorkspace}
        reference={reference}
      />
      <AccentSetting
        appearance={settings.appearance}
        save={(appearance) => save({ ...settings, appearance })}
      />
    </section>
  );
}
