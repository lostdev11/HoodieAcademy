// src/lib/courseData.ts
export type Lesson = {
  id: string;
  title: string;
  content?: string;
  video?: string;
  duration_min?: number;
  order_index?: number;
  is_published?: boolean;
};

export type Module = {
  id: string;
  title: string;
  description?: string;
  order_index?: number;
  is_published?: boolean;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  cover_image_url?: string | null;
  badge?: string;
  emoji?: string;
  pathType?: string;
  href?: string;
  localStorageKey?: string;
  totalLessons?: number;
  squad?: string;
  category?: string;
  level?: string;
  access?: string;
  modules: Module[];
};

export const COURSES: Course[] = [
  {
    "id": "hl240-faceless-lore",
    "slug": "hl240-faceless-lore",
    "title": "Faceless/No Eyes Lore Symbolism",
    "description": "Master the deep symbolism and cultural significance of faceless and no-eyes traits in NFT communities. Learn to interpret, communicate, and amplify the powerful narratives behind these visual elements.",
    "badge": "Lore Interpreter",
    "emoji": "👁️",
    "pathType": "symbolism",
    "href": "/courses/hl240-faceless-lore",
    "localStorageKey": "hl240FacelessLoreProgress",
    "totalLessons": 3,
    "squad": "Speakers",
    "category": "trait-interpretation",
    "level": "advanced",
    "access": "squad-gated",
    "modules": [
      {
        "id": "module-1",
        "title": "Symbolism Fundamentals",
        "description": "Understand the deep cultural and psychological significance of faceless traits",
        "lessons": [
          {
            "id": "lesson-1-1",
            "title": "The Power of the Faceless",
            "content": "Faceless and no-eyes traits carry profound symbolic meaning in NFT communities. Understanding this symbolism is crucial for effective communication and community building.\n\n**Symbolic Meanings:**\n• Anonymity and mystery\n• Universal representation\n• Hidden identity\n• Collective consciousness\n• Digital transformation\n\n**Cultural Significance:**\n• Internet anonymity\n• Digital identity\n• Community unity\n• Individual expression\n• Cultural evolution\n\n**Psychological Impact:**\n• Projection of self\n• Universal connection\n• Mystery and intrigue\n• Identity exploration\n• Community bonding",
            "video": "/videos/faceless-power.mp4"
          },
          {
            "id": "lesson-1-2",
            "title": "No Eyes Symbolism",
            "content": "**No Eyes Meanings:**\n• Inner vision\n• Spiritual sight\n• Blind faith\n• Intuitive knowing\n• Transcendent awareness\n\n**Cultural Context:**\n• Eastern philosophy\n• Spiritual traditions\n• Modern minimalism\n• Digital aesthetics\n• Community identity\n\n**Communication Impact:**\n• Mysterious allure\n• Universal appeal\n• Identity projection\n• Community connection\n• Cultural resonance",
            "video": "/videos/no-eyes-symbolism.mp4"
          }
        ]
      },
      {
        "id": "module-2",
        "title": "Lore Interpretation",
        "description": "Learn to interpret and communicate the lore behind faceless traits",
        "lessons": [
          {
            "id": "lesson-2-1",
            "title": "Lore Communication",
            "content": "**Storytelling Techniques:**\n• Myth creation\n• Cultural connection\n• Community resonance\n• Identity exploration\n• Symbolic interpretation\n\n**Communication Strategies:**\n• Universal themes\n• Personal connection\n• Community identity\n• Cultural relevance\n• Emotional resonance\n\n**Amplification Methods:**\n• Story sharing\n• Community discussion\n• Cultural exploration\n• Identity expression\n• Symbolic meaning",
            "video": "/videos/lore-communication.mp4"
          }
        ]
      },
      {
        "id": "module-3",
        "title": "Cultural Amplification",
        "description": "Master techniques for amplifying the cultural significance of faceless traits",
        "lessons": [
          {
            "id": "lesson-3-1",
            "title": "Cultural Impact",
            "content": "**Community Building:**\n• Shared symbolism\n• Cultural identity\n• Community bonding\n• Identity expression\n• Cultural evolution\n\n**Communication Amplification:**\n• Story development\n• Cultural resonance\n• Community engagement\n• Identity exploration\n• Symbolic meaning\n\n**Impact Measurement:**\n• Community engagement\n• Cultural retention\n• Identity expression\n• Symbolic resonance\n• Cultural evolution",
            "video": "/videos/cultural-impact.mp4"
          }
        ]
      }
    ]
  }
];

export function getCourseBySlug(slug: string): Course | null {
  return COURSES.find((c) => c.slug === slug) ?? null;
}
