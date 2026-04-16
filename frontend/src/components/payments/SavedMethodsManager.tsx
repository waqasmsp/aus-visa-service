import { PaymentMethod } from '../../types/payments';

type SavedMethodsManagerProps = {
  methods: PaymentMethod[];
  selectedMethodId?: string;
  onSelect: (methodId: string | undefined) => void;
};

export function SavedMethodsManager({ methods, selectedMethodId, onSelect }: SavedMethodsManagerProps) {
  return (
    <section className="payments-saved-methods" aria-label="Saved payment methods">
      <div className="payments-saved-methods__header">
        <h3>Saved Methods</h3>
        <button type="button" onClick={() => onSelect(undefined)}>
          Use new method
        </button>
      </div>
      {methods.length === 0 ? (
        <p>No saved methods. Add one below.</p>
      ) : (
        <ul>
          {methods.map((method) => (
            <li key={method.id}>
              <label>
                <input
                  type="radio"
                  name="saved-method"
                  checked={selectedMethodId === method.id}
                  onChange={() => onSelect(method.id)}
                />
                <span>
                  {method.brand?.toUpperCase() ?? method.type} •••• {method.last4 ?? '0000'}
                  {method.expMonth && method.expYear ? ` · ${method.expMonth}/${method.expYear}` : ''}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
