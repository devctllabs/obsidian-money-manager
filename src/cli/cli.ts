import { parseArgs } from 'node:util';
import { v7 } from 'uuid';
import pkg from '../../package.json';
import { buildSnapshot } from '../application/indexing/read-model';
import type { Diagnostic } from '../domain/entry';
import { validDate } from '../domain/validation';
import { readWorkspace } from './filesystem';

export interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

const usage = `Money Manager

  money-manager validate <workspace-root> [--json] [--today YYYY-MM-DD]
  money-manager new-id
  money-manager --help
  money-manager --version

validate reads the three catalogs and every Markdown file under Ledger.
--today defaults to the local system date. Paths may be absolute or relative.
new-id prints one UUIDv7. Neither command writes files.
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

function validationArgs(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: { json: { type: 'boolean' }, today: { type: 'string' } },
  });
  if (positionals.length !== 1 || !positionals[0]) throw new Error(usage);
  const today = values.today ?? localToday();
  if (!validDate(today, today)) throw new Error('--today must be a valid YYYY-MM-DD date');
  return { root: positionals[0], today, json: values.json === true };
}

function diagnosticKey(issue: Diagnostic): string {
  return [issue.path, issue.record ?? '', issue.field, issue.message].join('\0');
}

function report(diagnostics: Diagnostic[], json: boolean): CliResult {
  const status = diagnostics.length ? 'invalid' : 'valid';
  const lines = diagnostics.map(
    (issue) =>
      `${issue.path}${issue.record ? ` [${issue.record}]` : ''}: ${issue.field}: ${issue.message}`,
  );
  const stdout = json
    ? JSON.stringify({ status, diagnostics })
    : lines.join('\n') || 'Money Workspace is valid.';
  return { code: diagnostics.length ? 1 : 0, stdout: `${stdout}\n`, stderr: '' };
}

export async function runCli(args: string[]): Promise<CliResult> {
  try {
    if (args.length === 1) {
      if (args[0] === '--help') return success(usage);
      if (args[0] === '--version') return success(`${pkg.version}\n`);
      if (args[0] === 'new-id') return success(`${v7()}\n`);
    }
    if (args[0] !== 'validate') throw new Error(usage);
    const options = validationArgs(args.slice(1));
    const { sources, root } = await readWorkspace(options.root);
    const diagnostics = buildSnapshot(sources, root, options.today).diagnostics;
    diagnostics.sort((a, b) => {
      const left = diagnosticKey(a);
      const right = diagnosticKey(b);
      return left < right ? -1 : Number(left > right);
    });
    return report(diagnostics, options.json);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (args[0] === 'validate' && args.includes('--json'))
      return {
        code: 2,
        stdout: `${JSON.stringify({ status: 'error', diagnostics: [], error: message })}\n`,
        stderr: '',
      };
    return { code: 2, stdout: '', stderr: `${message}\n` };
  }
}
