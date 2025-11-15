import {
  getHomeContent as getHomeContentApi,
  updateHomeContent as updateHomeContentApi,
} from '../services/backendApi';

/**
 * Home content structure:
 *
 * HomeContent (collection)
 *   └─ sections (document)
 *       ├─ header: { title: string, subtitle: string }
 *       ├─ aboutProject: { title: string, content: string, themes: string[] }
 *       ├─ keyFeatures: { title: string, features: Array<{title: string, description: string}> }
 *       ├─ futureDevelopment: { title: string, intro: string, phases: Array<{phase: string, goal: string}> }
 *       ├─ contact: { title: string, name: string, position: string, organization: string, address: string[], email: string }
 *       └─ partners: { title: string, partners: Array<{label: string, link: string, logoUrl: string}> }
 */

export interface HeaderContent {
  title: string;
  subtitle: string;
}

export interface AboutProjectContent {
  title: string;
  content: string;
  themes: string[];
}

export interface Feature {
  title: string;
  description: string;
}

export interface KeyFeaturesContent {
  title: string;
  features: Feature[];
}

export interface Phase {
  phase: string;
  goal: string;
}

export interface FutureDevelopmentContent {
  title: string;
  intro: string;
  phases: Phase[];
}

export interface ContactContent {
  title: string;
  name: string;
  position: string;
  organization: string;
  address: string[];
  email: string;
}

export interface Partner {
  label: string;
  link: string;
  logoUrl: string;
}

export interface PartnersContent {
  title: string;
  partners: Partner[];
}

export interface TemplateInfoBox {
  title: string;
  description: string;
}

export interface TemplateInfoBoxes {
  [templateId: string]: TemplateInfoBox;
}

export interface Template {
  id: string;
  title: string;
}

export interface HomeContentData {
  header: HeaderContent;
  aboutProject: AboutProjectContent;
  keyFeatures: KeyFeaturesContent;
  futureDevelopment: FutureDevelopmentContent;
  contact: ContactContent;
  partners: PartnersContent;
  templateInfoBoxes: TemplateInfoBoxes;
  templates: Template[];
  updatedAt?: string;
}

/**
 * Default home content (fallback if backend data is not available)
 */
export const defaultHomeContent: HomeContentData = {
  header: {
    title: 'EmpiRE-Compass',
    subtitle:
      'A Community-Maintainable Knowledge Graph Dashboard for Empirical Research in Requirements Engineering',
  },
  aboutProject: {
    title: 'About the Project',
    content:
      'EmpiRE-Compass is a dashboard for visualizing and analyzing data from KG-EmpiRE, a community-maintainable knowledge graph of empirical research in requirements engineering. The project currently contains data from over 680 papers published in the research track of the IEEE International Conference on Requirements Engineering from 1994 to 2022.\n\nThe knowledge graph organizes scientific data using a defined template across six key themes:',
    themes: [
      'Research Paradigm',
      'Research Design',
      'Research Method',
      'Data Collection',
      'Data Analysis',
      'Bibliographic Metadata',
    ],
  },
  keyFeatures: {
    title: 'Key Features',
    features: [
      {
        title: 'Community Maintainable',
        description:
          'Built on the Open Research Knowledge Graph (ORKG) infrastructure, allowing collaborative maintenance and updates.',
      },
      {
        title: 'FAIR Principles',
        description:
          'Implements Findable, Accessible, Interoperable, and Reusable data principles.',
      },
      {
        title: 'Comprehensive Analysis',
        description:
          'Provides detailed insights into the evolution of empirical research in RE.',
      },
      {
        title: 'Long-term Sustainability',
        description:
          'Supported by TIB - Leibniz Information Centre for Science and Technology.',
      },
    ],
  },
  futureDevelopment: {
    title: 'Future Development',
    intro:
      'The project has a comprehensive development plan with short-, mid-, and long-term goals:',
    phases: [
      {
        phase: 'Short-term',
        goal: 'Expand coverage to include the entire research track of RE conference (1993-2023).',
      },
      {
        phase: 'Mid-term',
        goal: 'Include papers from other important venues and publish comprehensive ORKG reviews.',
      },
      {
        phase: 'Long-term',
        goal: 'Extend the template to organize more extensive scientific data and address open competency questions.',
      },
    ],
  },
  contact: {
    title: 'Contact',
    name: 'Dr. rer. nat. Oliver Karras',
    position: 'Researcher and Data Scientist - Open Research Knowledge Graph',
    organization: 'TIB - Leibniz Information Centre for Science and Technology',
    address: ['Welfengarten 1B', '30167 Hannover'],
    email: 'oliver.karras@tib.eu',
  },
  partners: {
    title: 'Project Partners & Resources',
    partners: [
      {
        label: 'TIB',
        link: 'https://www.tib.eu/de/forschung-entwicklung/open-research-knowledge-graph',
        logoUrl: '/src/assets/TIB.png',
      },
      {
        label: 'ORKG',
        link: 'https://orkg.org/class/C27001',
        logoUrl: '/src/assets/ORKG.png',
      },
      {
        label: 'ORKG Ask',
        link: 'https://ask.orkg.org/search?query=what%20is%20empirical%20research',
        logoUrl: '/src/assets/ORKGask.png',
      },
      {
        label: 'KG-EmpiRE',
        link: 'https://github.com/okarras/EmpiRE-Analysis',
        logoUrl: '/src/assets/KGEmpire.png',
      },
    ],
  },
  templateInfoBoxes: {
    R186491: {
      title: 'Empirical Research Practice',
      description:
        'This template contains research questions designed to help you explore and analyze data related to empirical research practices. Each question is carefully crafted to provide insights into different aspects of your research domain.',
    },
    C121001: {
      title: 'NLP for Requirements Engineering (NLP4RE)',
      description:
        'This template contains research questions designed to help you explore and analyze data related to NLP for requirements engineering. Each question is carefully crafted to provide insights into different aspects of your research domain.',
    },
  },
  templates: [
    {
      id: 'R186491',
      title: 'Empirical Research Practice',
    },
    {
      id: 'R1544125',
      title: 'NLP4RE ID Card',
    },
  ],
};

/**
 * Get home content from backend API
 */
export const getHomeContent = async (): Promise<HomeContentData> => {
  try {
    const content = await getHomeContentApi();
    // If backend returns data, use it; otherwise fall back to default
    if (content && typeof content === 'object') {
      return content as HomeContentData;
    } else {
      return defaultHomeContent;
    }
  } catch (error) {
    console.error('Error fetching home content:', error);
    // Return default content on error
    return defaultHomeContent;
  }
};

/**
 * Set/update home content via backend API
 * Note: This function requires userId and userEmail parameters
 */
export const setHomeContent = async (
  content: HomeContentData,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
): Promise<void> => {
  try {
    if (!userId || !userEmail) {
      throw new Error(
        'UserId and userEmail are required for updating home content'
      );
    }

    await updateHomeContentApi(content, userId, userEmail, keycloakToken);
  } catch (error) {
    console.error('Error updating home content:', error);
    throw error;
  }
};

/**
 * Initialize home content with default values (for first-time setup)
 * Note: This function requires userId and userEmail parameters
 * Checks if content exists by fetching it, and creates it if it doesn't exist
 */
export const initializeHomeContent = async (
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
): Promise<void> => {
  try {
    if (!userId || !userEmail) {
      throw new Error(
        'UserId and userEmail are required for initializing home content'
      );
    }

    // Try to get existing content
    try {
      const existingContent = await getHomeContentApi();
      // If we get content back and it's not the default, it exists
      if (existingContent && typeof existingContent === 'object') {
        console.log('Home content already exists');
        return;
      }
    } catch (fetchError: unknown) {
      // If fetch fails with 404 or similar, content doesn't exist
      const error = fetchError as Error;
      if (
        error?.message?.includes('404') ||
        error?.message?.includes('not found')
      ) {
        // Content doesn't exist, proceed to create it
      } else {
        // Some other error occurred
        throw fetchError;
      }
    }

    // Content doesn't exist, create it with defaults
    await setHomeContent(defaultHomeContent, userId, userEmail, keycloakToken);
    console.log('Home content initialized with defaults');
  } catch (error) {
    console.error('Error initializing home content:', error);
    throw error;
  }
};

/**
 * Get all documents in HomeContent collection (for backup purposes)
 * Note: This now returns a single document array since home content is a single document
 */
export const getAllHomeContent = async (): Promise<
  Array<{ id: string } & HomeContentData>
> => {
  try {
    const content = await getHomeContentApi();
    // Return as array format for backward compatibility
    if (content && typeof content === 'object') {
      return [{ id: 'sections', ...content }];
    }
    return [];
  } catch (error) {
    console.error('Error fetching all home content:', error);
    throw error;
  }
};

const CRUDHomeContent = {
  getHomeContent,
  setHomeContent,
  initializeHomeContent,
  getAllHomeContent,
  defaultHomeContent,
};

export default CRUDHomeContent;
