import { WorkspacePicker } from './WorkspacePicker';
import { useState } from 'react';
import { Form } from '../ui/Form';
import { CurrencyField } from '../ui/CurrencyField';
export function WorkspaceSetup({
  root: initial,
  setup,
  connect,
  folders = [],
}: {
  root: string;
  folders?: string[];
  setup: (root: string, reference: string) => Promise<void>;
  connect: (root: string) => Promise<void>;
}) {
  const [root, setRoot] = useState(initial);
  const [reference, setReference] = useState('USD');
  const [review, setReview] = useState(false);
  const [adopt, setAdopt] = useState(false);
  return (
    <section className="mm-setup">
      <h2>Set up Money Manager</h2>
      <p>
        Your financial record lives in ordinary Markdown. Start with empty catalogs or connect an
        existing Money Workspace.
      </p>
      <Form
        label={review ? 'Use this workspace' : 'Review setup'}
        submit={async () => {
          if (!review) {
            setReview(true);
            return;
          }
          if (adopt) await connect(root);
          else await setup(root, reference);
        }}
      >
        <WorkspacePicker
          value={root}
          folders={folders}
          create={!adopt}
          change={(path) => {
            setRoot(path);
            setReview(false);
          }}
        />
        <label className="mm-check">
          <input
            type="checkbox"
            checked={adopt}
            onChange={(event) => {
              setAdopt(event.target.checked);
              setReview(false);
            }}
          />
          Connect existing workspace
        </label>
        {!adopt && (
          <CurrencyField
            label="Reference currency"
            value={reference}
            onChange={(value) => {
              setReference(value);
              setReview(false);
            }}
          />
        )}
        {review && (
          <div role="status">
            <h3>{adopt ? 'Validate and connect' : 'Create empty catalogs'}</h3>
            <ul>
              {['ACCOUNTS.md', 'CATEGORIES.md', 'RATES.md'].map((name) => (
                <li key={name}>
                  {root}/{name}
                </li>
              ))}
            </ul>
            <p>
              {adopt
                ? 'Existing documents stay in place. The previous workspace is left untouched.'
                : `No sample data. Reference currency: ${reference}. ` +
                  'The first entry creates its Month document.'}
            </p>
          </div>
        )}
      </Form>
    </section>
  );
}
