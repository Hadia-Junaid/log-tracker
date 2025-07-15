export function isMongoDuplicateKeyError(error: unknown): error is { code: number; keyPattern?: any; keyValue?: any } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as any).code === 11000
  );
}

