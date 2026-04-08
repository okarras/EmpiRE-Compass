import {
  getTeamMembers as getTeamMembersApi,
  createTeamMember as createTeamMemberApi,
  updateTeamMember as updateTeamMemberApi,
  deleteTeamMember as deleteTeamMemberApi,
} from '../services/backendApi';
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

export interface TeamMemberInput {
  name: string;
  role?: string;
  description: string;
  image: string;
  email: string;
  link?: string;
  priority?: number;
}

/**
 * Get all team members from backend API with backup fallback
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

/**
 * Create a new team member
 */
const createTeamMember = async (
  memberData: TeamMemberInput,
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<TeamMember> => {
  try {
    if (!userId || !userEmail) {
      throw new Error(
        'UserId and userEmail are required for creating team members'
      );
    }

    const newMember = await createTeamMemberApi(
      memberData,
      userId,
      userEmail,
      keycloakToken
    );
    return newMember;
  } catch (error) {
    console.error('Error creating team member:', error);
    throw error;
  }
};

/**
 * Update an existing team member
 */
const updateTeamMember = async (
  memberId: string,
  memberData: TeamMemberInput,
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<TeamMember> => {
  try {
    if (!userId || !userEmail) {
      throw new Error(
        'UserId and userEmail are required for updating team members'
      );
    }

    const updatedMember = await updateTeamMemberApi(
      memberId,
      memberData,
      userId,
      userEmail,
      keycloakToken
    );
    return updatedMember;
  } catch (error) {
    console.error('Error updating team member:', error);
    throw error;
  }
};

/**
 * Delete a team member
 */
const deleteTeamMember = async (
  memberId: string,
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<void> => {
  try {
    if (!userId || !userEmail) {
      throw new Error(
        'UserId and userEmail are required for deleting team members'
      );
    }

    await deleteTeamMemberApi(memberId, userId, userEmail, keycloakToken);
  } catch (error) {
    console.error('Error deleting team member:', error);
    throw error;
  }
};

const CRUDTeam = {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
};

export default CRUDTeam;
