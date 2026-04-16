import { useEffect, useId, useRef, useState } from 'react';
import { DashboardButton } from './DashboardButton';

type ConfirmActionVariant = 'danger' | 'warning' | 'info';
type ConfirmActionStatus = 'idle' | 'pending' | 'success' | 'error';

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function ConfirmActionModal({
  open,
  variant,
  title,
  description,
  entityName,
  irreversibleWarning,
  confirmLabel,
  onCancel,
  onConfirm,
  preventCloseWhilePending = false
}: {
  open: boolean;
  variant: ConfirmActionVariant;
  title: string;
  description: string;
  entityName: string;
  irreversibleWarning?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  preventCloseWhilePending?: boolean;
}) {
  const [status, setStatus] = useState<ConfirmActionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const dialogRef = useRef<HTMLElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const closeDisabled = preventCloseWhilePending && status === 'pending';

  useEffect(() => {
    if (!open) return;
    setStatus('idle');
    setErrorMessage('');
    const timer = window.setTimeout(() => cancelRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!closeDisabled) {
          onCancel();
        }
        return;
      }

      if (event.key !== 'Tab') return;
      const container = dialogRef.current;
      if (!container) return;

      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => !element.hasAttribute('disabled')
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      }

      if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeDisabled, onCancel, open]);

  if (!open) return null;

  const submitConfirm = async () => {
    setStatus('pending');
    setErrorMessage('');

    try {
      await onConfirm();
      setStatus('success');
      window.setTimeout(() => onCancel(), 120);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong while processing this request.');
    }
  };

  return (
    <div className="dashboard-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <article ref={dialogRef} className={`dashboard-modal-card dashboard-confirm-action dashboard-confirm-action--${variant}`}>
        <h3 id={titleId}>{title}</h3>
        <p id={descriptionId}>{description}</p>
        <p>
          <strong>Entity:</strong> {entityName}
        </p>
        {irreversibleWarning ? <p className="dashboard-confirm-action__warning">{irreversibleWarning}</p> : null}
        {status === 'success' ? <p className="dashboard-auth__message is-success">Request completed successfully.</p> : null}
        {status === 'error' ? <p className="dashboard-auth__message is-error">{errorMessage}</p> : null}

        <div className="dashboard-actions-inline">
          <DashboardButton
            ref={cancelRef}
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={closeDisabled}
          >
            Cancel
          </DashboardButton>
          <DashboardButton
            ref={confirmRef}
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            loading={status === 'pending'}
            loadingLabel="Processing…"
            onClick={() => void submitConfirm()}
          >
            {confirmLabel}
          </DashboardButton>
        </div>
      </article>
    </div>
  );
}
