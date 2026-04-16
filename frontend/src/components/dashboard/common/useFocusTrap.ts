import { RefObject, useEffect } from 'react';

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type Params = {
  active: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onClose?: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
};

export function useFocusTrap({ active, containerRef, onClose, initialFocusRef }: Params) {
  useEffect(() => {
    if (!active) {
      return;
    }

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTarget = initialFocusRef?.current;
    const timer = window.setTimeout(() => {
      if (focusTarget) {
        focusTarget.focus();
        return;
      }

      const firstFocusable = containerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      firstFocusable?.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current) {
        return;
      }

      if (event.key === 'Escape') {
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true'
      );

      if (focusableElements.length === 0) {
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [active, containerRef, initialFocusRef, onClose]);
}
