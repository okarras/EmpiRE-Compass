import { getTeamMembers as getTeamMembersApi } from '../services/backendApi';

/**
 * Team member structure:
 *
 * Team (collection)
 *   └─ member (document)
 *       ├─ name: string
 *       ├─ role: string
 *       ├─ description: string
 *       ├─ image: string (URL)
 *       ├─ email: string
 *       ├─ link: string (URL)
 *       └─ priority: number (lower number = higher priority)
 */

export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  description: string;
  image: string;
  email: string;
  link?: string;
  priority?: number;
}

/**
 * Get all team members from backend API
 */
const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const teamMembers = await getTeamMembersApi();
    // Ensure the response is an array and has the correct structure
    return Array.isArray(teamMembers) ? teamMembers : [];
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
};

const CRUDTeam = {
  getTeamMembers,
};

export default CRUDTeam;
