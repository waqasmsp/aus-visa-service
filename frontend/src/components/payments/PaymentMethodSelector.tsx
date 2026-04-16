import { CheckoutMethod } from '../../types/payments';

type PaymentMethodSelectorProps = {
  value: CheckoutMethod;
  onChange: (method: CheckoutMethod) => void;
  disabled?: boolean;
};

const options: { value: CheckoutMethod; label: string; details: string }[] = [
  { value: 'card', label: 'Card (Stripe Elements)', details: 'Card input with 3DS/SCA authentication support.' },
  { value: 'paypal', label: 'PayPal Smart Buttons', details: 'Pay with PayPal wallet and return for verification.' },
  { value: 'google_pay', label: 'Google Pay', details: 'Processor-supported wallet flow via Stripe/Google Pay tokenization.' }
];

export function PaymentMethodSelector({ value, onChange, disabled = false }: PaymentMethodSelectorProps) {
  return (
    <fieldset className="payments-method-selector" aria-label="Select payment method" disabled={disabled}>
      <legend>Payment Method</legend>
      <div className="payments-method-selector__options" role="radiogroup" aria-label="Payment options">
        {options.map((option) => (
          <label className="payments-method-selector__option" key={option.value}>
            <input
              type="radio"
              name="payment-method"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>
              <strong>{option.label}</strong>
              <small>{option.details}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
