import { getTeamMembers as getTeamMembersApi } from '../services/backendApi';
import BackupService from '../services/BackupService';

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
    // If user has explicitly selected a backup/offline mode, use that first
    if (BackupService.isExplicitlyUsingBackup()) {
      console.log('CRUDTeam: Using explicit backup for team members');
      const teamMembers = await BackupService.getTeamMembers();
      return Array.isArray(teamMembers) ? teamMembers : [];
    }

    const teamMembers = await getTeamMembersApi();
    // Ensure the response is an array and has the correct structure
    return Array.isArray(teamMembers) ? teamMembers : [];
  } catch (error) {
    console.warn('Backend API failed, falling back to local backup:', error);
    try {
      const teamMembers = await BackupService.getTeamMembers();
      return Array.isArray(teamMembers) ? teamMembers : [];
    } catch (backupError) {
      console.error('Error fetching team members from backup:', backupError);
      throw error;
    }
  }
};

const CRUDTeam = {
  getTeamMembers,
};

export default CRUDTeam;
