/**
 * Admin user emails (only these users can edit data)
 * Using email is more reliable than user IDs
 */
export const ADMIN_USER_EMAILS = [
  'amirrezaalasti@gmail.com', // Amirreza Alasti
  'oliver.karras@tib.eu', // Oliver Karras
  'sushant.aggarwal@stud.uni-hannover.de', // Sushant Aggarwal
];

/**
 * Check if a user email is an admin
 */
export const isAdminEmail = (email: string): boolean => {
  return ADMIN_USER_EMAILS.includes(email.toLowerCase());
};
