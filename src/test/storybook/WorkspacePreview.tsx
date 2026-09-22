import { DialogFrame } from '../../features/ui/DialogFrame';
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ShellController } from '../../features/shell/controller';
import { MoneySurface } from '../../features/shell/MoneySurface';
import { SettingsContent } from '../../features/settings/SettingsContent';
import { WorkspaceSetup } from '../../features/settings/WorkspaceSetup';
import { Accent } from '../../features/ui/Accent';
import { SettingsWorkflow, normalizeSettings } from '../../application/workspace/settings';
import { WorkspaceConnection } from '../../application/workspace/connection';
import { normalizeViewState } from '../../application/reports/view-state';
import { MemoryDocuments } from '../memory-documents';
import { reportDocuments } from './report-fixtures';
import type { SettingsSection } from '../../features/settings/sections';

interface DialogContent {
  title: string;
  render: (close: () => void) => ReactNode;
}
export function WorkspacePreview({
  empty = false,
  initialMode = 'overview',
  pickerMode = 'desktop',
}: {
  empty?: boolean;
  initialMode?: 'overview' | 'accounts' | 'settings';
  pickerMode?: 'desktop' | 'native';
}) {
  const [dialog, setDialog] = useState<DialogContent | null>(null);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>();
  const [query, setQuery] = useState(() =>
    normalizeViewState({ mode: initialMode, currency: 'GEL' }, '2026-09-13', {}, false),
  );
  const [controller] = useState(() => {
    const documents = new MemoryDocuments();
    if (!empty) documents.files = reportDocuments();
    const settings = new SettingsWorkflow(normalizeSettings(null), async () => undefined);
    const connection = new WorkspaceConnection(documents, settings, () => '2026-09-13');
    const instance = new ShellController(
      {
        pickerMode,
        folders: () => [
          ...new Set(
            [...documents.files.keys()].map((path) => path.split('/').slice(0, -1).join('/')),
          ),
        ],
        today: () => '2026-09-13',
        dialog: (title, render) => setDialog({ title, render }),
        openDocument: (path) =>
          setDialog({
            title: path,
            render: () => (
              <pre className="mm-preview-document">
                {documents.files.get(path) ?? 'Document does not exist.'}
              </pre>
            ),
          }),
      },
      documents,
      connection,
      settings,
    );
    instance.configured = !empty;
    instance.goAccounts = () => {
      setSettingsSection(undefined);
      setQuery((current) => ({ ...current, mode: 'accounts' }));
    };
    return instance;
  });
  useEffect(() => {
    if (controller.configured) void controller.connection.index.refresh();
  }, [controller]);
  const snapshot = useSyncExternalStore(
    controller.connection.subscribe,
    controller.connection.getSnapshot,
  );
  const state = normalizeViewState(
    query,
    '2026-09-13',
    snapshot.accounts,
    snapshot.phase === 'ready',
  );
  return (
    <Accent appearance={controller.settings.current.appearance}>
      {!controller.configured ? (
        <WorkspaceSetup
          folders={controller.host.folders?.()}
          root={controller.settings.current.workspaceRoot}
          setup={(root, reference) => controller.setup(root, reference)}
          connect={(root) => controller.connect(root)}
        />
      ) : (
        <MoneySurface
          pickerMode={pickerMode}
          snapshot={snapshot}
          mode={state.mode}
          setMode={(mode) => {
            if (mode !== 'settings') setSettingsSection(undefined);
            setQuery({ ...state, mode });
          }}
          settings={(section) => {
            setSettingsSection(section);
            setQuery({ ...state, mode: 'settings' });
          }}
          settingsSurface={
            <SettingsContent controller={controller} initialSection={settingsSection} />
          }
          refresh={() => controller.connection.index.refresh()}
          openDocument={controller.openDocument}
          addEntry={() => controller.addEntry()}
          overview={{
            query: state,
            change: (next) => setQuery({ ...next, mode: state.mode }),
            edit: controller.addEntry,
            remove: controller.deleteEntry,
          }}
          accounts={{
            create: controller.createAccount,
            edit: controller.editAccount,
            remove: controller.deleteAccount,
            reconcile: (key) => controller.reconcile(key),
            editCheckpoint: (row) => controller.reconcile(row.entry.account, row),
            deleteCheckpoint: controller.deleteCheckpoint,
          }}
        />
      )}
      {dialog && <PreviewDialog content={dialog} close={() => setDialog(null)} />}
    </Accent>
  );
}
function PreviewDialog({ content, close }: { content: DialogContent; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = dialog.ownerDocument.activeElement;
    dialog.showModal();
    // EntryForm establishes amount focus before the native dialog opens.
    dialog.querySelector<HTMLInputElement>('[name="amount"]')?.focus();
    return () => {
      dialog.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="money-manager mm-dialog"
      aria-labelledby="preview-dialog-title"
      onCancel={close}
    >
      <DialogFrame id="preview-dialog-title" title={content.title} close={close}>
        {content.render(close)}
      </DialogFrame>
    </dialog>
  );
}
