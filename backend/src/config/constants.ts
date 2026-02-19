/**
 * Admin user emails (only these users can edit data)
 * Using email is more reliable than user IDs
 * FIXME: this should not be hardcoded, it should be fetched from the database
 */
export const ADMIN_USER_EMAILS = [
  'amirrezaalasti@gmail.com', // Amirreza Alasti
  'oliver.karras@tib.eu', // Oliver Karras
  'sushant.aggarwal@stud.uni-hannover.de', // Sushant Aggarwal
  'yucelclkk@gmail.com', // Yucel Celik
];

/**
 * Check if a user email is an admin
 */
export const isAdminEmail = (email: string): boolean => {
  return ADMIN_USER_EMAILS.includes(email.toLowerCase());
};
