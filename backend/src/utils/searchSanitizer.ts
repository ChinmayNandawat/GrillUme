export type SanitizedSearchQuery = {
  value: string;
  hadNonEmptyOriginal: boolean;
  becameEmptyAfterSanitization: boolean;
};

const DEFAULT_MAX_LENGTH = 100;

export const sanitizeSearchQuery = (
  input: string | undefined,
  maxLength: number = DEFAULT_MAX_LENGTH
): SanitizedSearchQuery => {
  const rawValue = input || '';
  const hadNonEmptyOriginal = rawValue.trim().length > 0;

  const stripped = rawValue.replace(/[^a-zA-Z0-9 -]+/g, '');
  const trimmed = stripped.trim();
  const safeMaxLength = Number.isFinite(maxLength) && maxLength > 0 ? Math.floor(maxLength) : DEFAULT_MAX_LENGTH;
  const value = trimmed.slice(0, safeMaxLength).trim();

  return {
    value,
    hadNonEmptyOriginal,
    becameEmptyAfterSanitization: hadNonEmptyOriginal && value.length === 0,
  };
};
