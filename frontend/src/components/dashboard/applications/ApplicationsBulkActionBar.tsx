import { ApplicationStatus } from '../../../types/dashboard/applications';

type Props = {
  selectedCount: number;
  canMutate: boolean;
  onAssignOwner: (owner: string) => void;
  onUpdateStatus: (status: ApplicationStatus) => void;
  onExport: () => void;
};

export function ApplicationsBulkActionBar({ selectedCount, canMutate, onAssignOwner, onUpdateStatus, onExport }: Props) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="dashboard-panel" style={{ marginBottom: 12 }}>
      <div className="dashboard-panel__header">
        <h3>{selectedCount} selected</h3>
        {canMutate ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => onAssignOwner('Nadia R.')}>Assign owner</button>
            <button type="button" onClick={() => onUpdateStatus('In Review')}>Status update</button>
            <button type="button" onClick={onExport}>Export selected</button>
          </div>
        ) : (
          <small>Bulk actions require manager or admin role.</small>
        )}
      </div>
    </div>
  );
}
