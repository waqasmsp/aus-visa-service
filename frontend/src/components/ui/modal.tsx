import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../../lib/cn';

const Modal = Dialog.Root;
const ModalTrigger = Dialog.Trigger;
const ModalClose = Dialog.Close;

const ModalContent = React.forwardRef<React.ElementRef<typeof Dialog.Content>, React.ComponentPropsWithoutRef<typeof Dialog.Content>>(
  ({ className, ...props }, ref) => (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/50" />
      <Dialog.Content
        ref={ref}
        className={cn('fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 shadow-xl', className)}
        {...props}
      />
    </Dialog.Portal>
  )
);

ModalContent.displayName = Dialog.Content.displayName;

const ModalHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-4 space-y-1', className)} {...props} />
);

const ModalTitle = React.forwardRef<React.ElementRef<typeof Dialog.Title>, React.ComponentPropsWithoutRef<typeof Dialog.Title>>(({ className, ...props }, ref) => (
  <Dialog.Title ref={ref} className={cn('text-lg font-semibold text-foreground', className)} {...props} />
));

ModalTitle.displayName = Dialog.Title.displayName;

const ModalDescription = React.forwardRef<React.ElementRef<typeof Dialog.Description>, React.ComponentPropsWithoutRef<typeof Dialog.Description>>(({ className, ...props }, ref) => (
  <Dialog.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));

ModalDescription.displayName = Dialog.Description.displayName;

export { Modal, ModalTrigger, ModalClose, ModalContent, ModalHeader, ModalTitle, ModalDescription };
