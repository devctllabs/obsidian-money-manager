import { Form } from './Form';
export function Confirm({
  message,
  action,
  close,
  detail,
  label = 'Delete',
}: {
  message: string;
  detail?: string;
  action: () => Promise<void>;
  close: () => void;
  label?: string;
}) {
  return (
    <Form
      destructive
      label={label}
      close={close}
      submit={async () => {
        await action();
        close();
      }}
    >
      <div className="mm-confirm">
        {detail && <p className="mm-delete-context">{detail}</p>}
        <p>{message}</p>
      </div>
    </Form>
  );
}
