export type ApiErrorPayload = {
  message?: string;
  error?: string;
  details?: string;
};

export const extractApiErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const payload = error as ApiErrorPayload;
    return payload.message ?? payload.error ?? payload.details ?? 'Something went wrong. Please try again.';
  }

  return 'Something went wrong. Please try again.';
};

export const delay = (ms = 180): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export async function runOptimisticMutation<T>(
  applyOptimistic: () => void,
  rollback: () => void,
  commit: () => Promise<T>
): Promise<T> {
  applyOptimistic();

  try {
    return await commit();
  } catch (error) {
    rollback();
    throw error;
  }
}
