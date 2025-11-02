import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Team member structure in Firebase:
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
 * Get all team members from the Team collection
 */
const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const teamCollection = collection(db, 'Team');
    const querySnapshot = await getDocs(teamCollection);

    const teamMembers: TeamMember[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      teamMembers.push({
        id: doc.id,
        name: data.name || '',
        role: data.role || '',
        description: data.description || '',
        image: data.image || '',
        email: data.email || '',
        link: data.link || '',
        priority: typeof data.priority === 'number' ? data.priority : 999,
      } as TeamMember);
    });

    return teamMembers;
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
};

const CRUDTeam = {
  getTeamMembers,
};

export default CRUDTeam;
