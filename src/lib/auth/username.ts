const INTERNAL_EMAIL_DOMAIN = "lexos.internal";

export function usernameToEmail(username: string): string {
  return `${username}@${INTERNAL_EMAIL_DOMAIN}`;
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(username);
}
