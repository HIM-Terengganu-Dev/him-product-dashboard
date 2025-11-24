// Authentication and authorization utilities for the ticketing system

const DEVELOPER_EMAILS = [
    'himclinicdata@gmail.com',
    'amirsyahmi.jamsari@gmail.com'
];

/**
 * Check if the given email belongs to a developer
 */
export function isDeveloper(email: string): boolean {
    return DEVELOPER_EMAILS.includes(email.toLowerCase());
}

/**
 * Get the role of the user based on their email
 */
export function getUserRole(email: string): 'dev' | 'user' {
    return isDeveloper(email) ? 'dev' : 'user';
}

/**
 * Get all developer emails
 */
export function getDeveloperEmails(): string[] {
    return [...DEVELOPER_EMAILS];
}
