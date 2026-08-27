/**
 * Safely extracts a displayable error string from an unknown error value.
 */
export function getDisplayErrorMessage(error: unknown, defaultMessage = "An unexpected error occurred."): string {
  if (!error) {
    return defaultMessage;
  }
  if (typeof error === "string") {
    return error.trim() || defaultMessage;
  }
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  if (typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return (error as { message: string }).message || defaultMessage;
  }
  return String(error);
}
