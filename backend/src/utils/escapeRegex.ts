export const escapeRegex = (input: string): string => {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
