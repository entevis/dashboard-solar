import { toast as sonnerToast } from "sonner";
import type { ExternalToast } from "sonner";

export const toast = {
  success: (message: string, options?: ExternalToast) =>
    sonnerToast.success(message, { duration: 4000, ...options }),
  error: (message: string, options?: ExternalToast) =>
    sonnerToast.error(message, { duration: 7000, ...options }),
  loading: sonnerToast.loading.bind(sonnerToast),
  promise: sonnerToast.promise.bind(sonnerToast),
  dismiss: sonnerToast.dismiss.bind(sonnerToast),
};
