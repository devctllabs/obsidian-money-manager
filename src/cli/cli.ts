import { parseArgs } from 'node:util';
import { v7 } from 'uuid';
import pkg from '../../package.json';
import { buildSnapshot } from '../application/indexing/read-model';
import type { Diagnostic } from '../domain/entry';
import { validDate } from '../domain/validation';
import { readWorkspace } from './filesystem';
import { describeDiagnostic, describeImport, runImport } from './import';

export interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

const usage = `Money Manager

  money-manager validate <workspace-root> [--json] [--today YYYY-MM-DD]
  money-manager import <workspace-root> <yaml-file>
    [--apply] [--allow-duplicates] [--json] [--today YYYY-MM-DD]
  money-manager new-id
  money-manager --help
  money-manager --version

validate reads the three catalogs and every Markdown file under Ledger.
import previews an Expense/Income YAML batch for one Account. --apply writes it.
--allow-duplicates permits matching existing Ledger Entries only.
--today overrides the local date used for validation. Paths may be absolute or relative.
new-id prints one UUIDv7.
Exit codes: 0 success; 1 data diagnostics; 2 invalid arguments or execution error.
`;

function success(stdout: string): CliResult {
  return { code: 0, stdout, stderr: '' };
}

function localToday(): string {
  const now = new Date();
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, '0'))
    .join('-');
}

function workspaceArgs(args: string[], importing: boolean) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      json: { type: 'boolean' },
      today: { type: 'string' },
      ...(importing && { apply: { type: 'boolean' }, 'allow-duplicates': { type: 'boolean' } }),
    },
  });
  if (positionals.length !== (importing ? 2 : 1) || positionals.some((path) => !path))
    throw new Error(usage);
  const today = values.today ?? localToday();
  if (!validDate(today, today)) throw new Error('--today must be a valid YYYY-MM-DD date');
  return {
    root: positionals[0]!,
    file: positionals[1],
    today,
    json: values.json === true,
    apply: values.apply === true,
    allowDuplicates: values['allow-duplicates'] === true,
  };
}

function diagnosticKey(issue: Diagnostic): string {
  return [issue.path, issue.record ?? '', issue.field, issue.message].join('\0');
}

function report(diagnostics: Diagnostic[], json: boolean): CliResult {
  const status = diagnostics.length ? 'invalid' : 'valid';
  const lines = diagnostics.map(describeDiagnostic);
  const stdout = json
    ? JSON.stringify({ status, diagnostics })
    : lines.join('\n') || 'Money Workspace is valid.';
  return { code: diagnostics.length ? 1 : 0, stdout: `${stdout}\n`, stderr: '' };
}

async function runWorkspaceCommand(command: 'validate' | 'import', args: string[]) {
  const options = workspaceArgs(args, command === 'import');
  if (command === 'import') {
    const result = await runImport({ ...options, file: options.file! });
    const codes = { invalid: 1, error: 2, partial: 2, preview: 0, applied: 0 };
    const output = options.json ? JSON.stringify(result) : describeImport(result);
    return { code: codes[result.status], stdout: `${output}\n`, stderr: '' };
  }
  const { sources, root } = await readWorkspace(options.root);
  const diagnostics = buildSnapshot(sources, root, options.today).diagnostics;
  diagnostics.sort((a, b) => {
    const left = diagnosticKey(a);
    const right = diagnosticKey(b);
    return left < right ? -1 : Number(left > right);
  });
  return report(diagnostics, options.json);
}

export async function runCli([command, ...args]: string[]): Promise<CliResult> {
  const workspaceCommand = command === 'validate' || command === 'import';
  try {
    if (workspaceCommand) return await runWorkspaceCommand(command, args);
    if (!args.length) {
      if (command === '--help') return success(usage);
      if (command === '--version') return success(`${pkg.version}\n`);
      if (command === 'new-id') return success(`${v7()}\n`);
    }
    throw new Error(usage);
  } catch (error) {
    return invocationError(error, workspaceCommand && args.includes('--json'));
  }
}

function invocationError(error: unknown, json: boolean): CliResult {
  const message = error instanceof Error ? error.message : String(error);
  if (json)
    return {
      code: 2,
      stdout: `${JSON.stringify({ status: 'error', diagnostics: [], error: message })}\n`,
      stderr: '',
    };
  return { code: 2, stdout: '', stderr: `${message}\n` };
}
