import { useRef, useState } from 'react';
import { DialogSurface } from '../ui/DialogSurface';
import { VaultPathPicker } from './VaultPathPicker';
import { normalizeRoot } from '../../domain/workspace-document';
import { formatErrorMessage } from '../ui/error-message';
import { InlineNotice } from '../ui/InlineNotice';

type Props = {
  value: string;
  folders?: string[];
  change: (path: string) => Promise<void> | void;
  create?: boolean;
  createWorkspace?: (path: string, reference: string) => Promise<void>;
  reference?: string;
};
export function WorkspacePicker(props: Props) {
  const [origin, setOrigin] = useState<HTMLButtonElement | null>(null);
  return (
    <>
      <div className="mm-storage-setting">
        <div>
          <h2>Workspace folder</h2>
          <code>{props.value}</code>
        </div>
        <button
          type="button"
          className="mm-quiet"
          aria-label="Choose workspace folder"
          aria-haspopup="dialog"
          onClick={(event) => setOrigin(event.currentTarget)}
        >
          Change…
        </button>
      </div>
      {origin && <WorkspaceDialog {...props} origin={origin} close={() => setOrigin(null)} />}
    </>
  );
}
function WorkspaceDialog({
  value,
  folders = [],
  change,
  create = false,
  createWorkspace,
  reference = 'USD',
  origin,
  close,
}: Props & { origin: HTMLElement; close: () => void }) {
  const [mode, setMode] = useState<'create' | 'existing' | 'confirm'>(
    createWorkspace || create ? 'create' : 'existing',
  );
  const [name, setName] = useState(value.split('/').at(-1) ?? 'Money Manager');
  const [target, setTarget] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const apply = async (path: string) => {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError(null);
    try {
      const root = normalizeRoot(path);
      if (mode === 'create' && createWorkspace) await createWorkspace(root, reference);
      else await change(root);
      close();
    } catch (cause) {
      setError(formatErrorMessage(cause, 'Could not update the workspace folder.'));
    } finally {
      lock.current = false;
      setPending(false);
    }
  };
  const onClose = () => {
    if (!lock.current) close();
  };
  if (mode === 'confirm')
    return (
      <DialogSurface title="Switch workspace?" origin={origin} close={onClose}>
        <p className="mm-muted">Your current files stay where they are.</p>
        <p>
          <code>{target}</code>
        </p>
        {error && <InlineNotice tone="error">{error}</InlineNotice>}
        <button
          type="button"
          className="mod-cta"
          disabled={pending}
          onClick={() => void apply(target)}
        >
          Use this workspace
        </button>
      </DialogSurface>
    );
  return (
    <WorkspaceFolderBrowser
      value={value}
      folders={folders}
      name={name}
      setName={setName}
      creating={mode === 'create'}
      canCreate={!!createWorkspace}
      reference={reference}
      origin={origin}
      pending={pending}
      error={error}
      close={onClose}
      openExisting={() => {
        setMode('existing');
        setError(null);
      }}
      choose={(folder) => {
        if (mode === 'create') void apply([folder, name.trim()].filter(Boolean).join('/'));
        else if (createWorkspace) {
          setTarget(folder);
          setMode('confirm');
        } else void apply(folder);
      }}
    />
  );
}
function WorkspaceFolderBrowser({
  value,
  folders,
  name,
  setName,
  creating,
  canCreate,
  reference,
  origin,
  pending,
  error,
  close,
  openExisting,
  choose,
}: {
  value: string;
  folders: string[];
  name: string;
  setName: (name: string) => void;
  creating: boolean;
  canCreate: boolean;
  reference: string;
  origin: HTMLElement;
  pending: boolean;
  error: string | null;
  close: () => void;
  openExisting: () => void;
  choose: (folder: string) => void;
}) {
  const model = pickerModel(creating, canCreate, reference);
  return (
    <VaultPathPicker
      key={String(creating)}
      origin={origin}
      {...model}
      folders={folders}
      initialFolder={value.split('/').slice(0, -1).join('/')}
      workspaceName={creating ? name : undefined}
      onNameChange={creating ? setName : undefined}
      disabled={pending}
      error={error}
      validateSelection={(path) =>
        validateDestination({ path, name, creating, folders, actualCreate: canCreate })
      }
      onClose={close}
      secondaryAction={
        creating && canCreate
          ? { label: 'Open an existing workspace instead…', onClick: openExisting }
          : undefined
      }
      onChoose={choose}
    />
  );
}
function pickerModel(creating: boolean, canCreate: boolean, reference: string) {
  if (!creating)
    return {
      title: 'Open existing workspace',
      description: 'Choose a Money Manager folder to open. No files will be moved.',
      action: 'Use this folder',
    };
  return {
    title: 'Create workspace folder',
    description: 'Choose the parent folder below. Your workspace folder will be created inside it.',
    action: canCreate ? 'Create workspace' : 'Use this location',
    confirmation: canCreate
      ? `Creates empty catalogs using ${reference} as the reference currency.`
      : undefined,
  };
}

function validateDestination({
  path,
  name,
  creating,
  folders,
  actualCreate,
}: {
  path: string;
  name: string;
  creating: boolean;
  folders: string[];
  actualCreate: boolean;
}): string | null {
  if (creating && (!name.trim() || /[/\\]/.test(name) || ['.', '..'].includes(name.trim())))
    return 'Enter a folder name without slashes.';
  if (!path) return 'Choose a folder below the vault root.';
  if (creating && actualCreate && folders.includes(path))
    return 'A folder already exists here. Choose another name.';
  return null;
}
