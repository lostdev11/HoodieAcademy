export interface Course {
  id: string;
  title: string;
  description: string;
  badge: string;
  emoji: string;
  pathType: "tech" | "social" | "converged";
  href: string;
  totalLessons?: number;
  category?: string;
  level?: string;
  access?: string;
  squad?: string;
  isVisible: boolean;
  isPublished: boolean;
  isGated?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export const allCourses: Course[] = [
  {
    id: 'wallet-wizardry',
    title: "Wallet Wizardry",
    description: "Master wallet setup with interactive quizzes and MetaMask integration.",
    badge: "Vault Keeper",
    emoji: "🔒",
    pathType: "tech",
    href: "/courses/wallet-wizardry",
    totalLessons: 4,
    squad: "Decoders",
    category: "wallet",
    level: "beginner",
    access: "free",
    isVisible: true,
    isPublished: true,
    isGated: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: "admin"
  },
  {
    id: 't100-chart-literacy',
    title: "T100 🎯 Intro to Indicators: RSI, BBands, Fibs + Candle Basics",
    description: "Learn the core tools of technical analysis: RSI, Bollinger Bands, Fibonacci levels, and candlestick theory. Understand how they work, when they lie, and how to combine them for real confluence.",
    badge: "Chart Reader",
    emoji: "📊",
    pathType: "tech",
    href: "/courses/t100-chart-literacy",
    totalLessons: 4,
    squad: "Raiders",
    category: "technical-analysis",
    level: "beginner",
    access: "free",
    isVisible: true,
    isPublished: true,
    isGated: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: "admin"
  },
  {
    id: 'nft-mastery',
    title: "NFT Mastery",
    description: "Master the art of NFT creation, trading, and community building.",
    badge: "NFT Master",
    emoji: "🖼️",
    pathType: "tech",
    href: "/courses/nft-mastery",
    totalLessons: 6,
    squad: "Creators",
    category: "nft",
    level: "intermediate",
    access: "hoodie",
    isVisible: true,
    isPublished: true,
    isGated: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: "admin"
  },
  {
    id: 'ai-automation-curriculum',
    title: "AI + Automation Curriculum",
    description: "Master AI automation tools and workflows for Web3 projects.",
    badge: "AI Automator",
    emoji: "🤖",
    pathType: "tech",
    href: "/courses/ai-automation-curriculum",
    totalLessons: 8,
    squad: "Decoders",
    category: "ai",
    level: "advanced",
    access: "dao",
    isVisible: true,
    isPublished: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: "admin"
  },
  {
    id: 'cybersecurity-wallet-practices',
    title: "Cybersecurity & Wallet Practices",
    description: "Learn essential security practices for protecting your digital assets.",
    badge: "Security Guardian",
    emoji: "🛡️",
    pathType: "tech",
    href: "/courses/cybersecurity-wallet-practices",
    totalLessons: 5,
    squad: "Decoders",
    category: "security",
    level: "beginner",
    access: "free",
    isVisible: true,
    isPublished: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: "admin"
  },
  {
    id: 'community-strategy',
    title: "Community Strategy",
    description: "Build and grow thriving Web3 communities.",
    badge: "Community Builder",
    emoji: "🌱",
    pathType: "social",
    href: "/courses/community-strategy",
    totalLessons: 7,
    squad: "Speakers",
    category: "community",
    level: "intermediate",
    access: "hoodie",
    isVisible: true,
    isPublished: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: "admin"
  },
  {
    id: 'lore-narrative-crafting',
    title: "Lore & Narrative Crafting",
    description: "Create compelling narratives and lore for Web3 projects.",
    badge: "Lore Master",
    emoji: "📚",
    pathType: "social",
    href: "/courses/lore-narrative-crafting",
    totalLessons: 6,
    squad: "Creators",
    category: "narrative",
    level: "intermediate",
    access: "hoodie",
    isVisible: true,
    isPublished: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: "admin"
  },
  {
    id: 'meme-coin-mania',
    title: "Meme Coin Mania",
    description: "Navigate the wild world of meme coins and viral tokens.",
    badge: "Meme Lord",
    emoji: "🚀",
    pathType: "tech",
    href: "/courses/meme-coin-mania",
    totalLessons: 5,
    squad: "Raiders",
    category: "trading",
    level: "intermediate",
    access: "hoodie",
    isVisible: true,
    isPublished: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: "admin"
  },
  {
    id: 'hoodie-squad-track',
    title: "Hoodie Squad Track",
    description: "Master the Hoodie Squad system and progression.",
    badge: "Squad Leader",
    emoji: "🎯",
    pathType: "converged",
    href: "/courses/hoodie-squad-track",
    totalLessons: 4,
    squad: "Rangers",
    category: "squad",
    level: "beginner",
    access: "free",
    isVisible: true,
    isPublished: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: "admin"
  }
];

// Course management functions
export function getVisibleCourses(isAdmin: boolean = false): Course[] {
  // For non-admin users, always filter by visibility
  if (!isAdmin) {
    return allCourses.filter(course => course.isVisible && course.isPublished);
  }
  
  // For admin users, show all courses but respect visibility settings
  // TODO: Load from database instead of localStorage
  return allCourses;
}

export function getHiddenCourses(): Course[] {
  return allCourses.filter(course => !course.isVisible || !course.isPublished);
}

export function getCoursesBySquad(squad: string, isAdmin: boolean = false): Course[] {
  return getVisibleCourses(isAdmin).filter(course => course.squad === squad);
}

export function getCoursesByLevel(level: string, isAdmin: boolean = false): Course[] {
  return getVisibleCourses(isAdmin).filter(course => course.level === level);
}

export function getCoursesByAccess(access: string, isAdmin: boolean = false): Course[] {
  return getVisibleCourses(isAdmin).filter(course => course.access === access);
}

export function toggleCourseVisibility(courseId: string, isAdmin: boolean = false): Course[] {
  if (isAdmin) {
    console.log('Toggling course visibility for:', courseId);
  }
  const courseIndex = allCourses.findIndex(course => course.id === courseId);
  if (courseIndex !== -1) {
    const oldVisibility = allCourses[courseIndex].isVisible;
    allCourses[courseIndex].isVisible = !allCourses[courseIndex].isVisible;
    allCourses[courseIndex].updatedAt = new Date().toISOString();
    
    // Save to database instead of localStorage
    if (typeof window !== 'undefined') {
      saveCoursesToDatabase(isAdmin);
    }
    
    // Dispatch custom event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('coursesVisibilityChanged', {
        detail: { courseId, isVisible: allCourses[courseIndex].isVisible }
      }));
    }
    
    if (isAdmin) {
      console.log(`Course "${allCourses[courseIndex].title}" visibility changed from ${oldVisibility} to ${allCourses[courseIndex].isVisible}`);
    }
  } else {
    if (isAdmin) {
      console.log('Course not found:', courseId);
    }
  }
  return allCourses;
}

export function toggleCoursePublished(courseId: string, isAdmin: boolean = false): Course[] {
  if (isAdmin) {
    console.log('Toggling course published status for:', courseId);
  }
  const courseIndex = allCourses.findIndex(course => course.id === courseId);
  if (courseIndex !== -1) {
    const oldPublished = allCourses[courseIndex].isPublished;
    allCourses[courseIndex].isPublished = !allCourses[courseIndex].isPublished;
    allCourses[courseIndex].updatedAt = new Date().toISOString();
    if (isAdmin) {
      console.log(`Course "${allCourses[courseIndex].title}" published status changed from ${oldPublished} to ${allCourses[courseIndex].isPublished}`);
    }
  } else {
    if (isAdmin) {
      console.log('Course not found:', courseId);
    }
  }
  return allCourses;
}

export function updateCourse(courseId: string, updates: Partial<Course>): Course[] {
  const courseIndex = allCourses.findIndex(course => course.id === courseId);
  if (courseIndex !== -1) {
    allCourses[courseIndex] = {
      ...allCourses[courseIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
  }
  return allCourses;
}

export function addCourse(course: Omit<Course, 'createdAt' | 'updatedAt'>): Course[] {
  const newCourse: Course = {
    ...course,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  allCourses.push(newCourse);
  return allCourses;
}

export function deleteCourse(courseId: string): Course[] {
  const courseIndex = allCourses.findIndex(course => course.id === courseId);
  if (courseIndex !== -1) {
    allCourses.splice(courseIndex, 1);
  }
  return allCourses;
}

// Database persistence
export async function saveCoursesToDatabase(isAdmin: boolean = false): Promise<void> {
  try {
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(allCourses),
    });
    if (!res.ok) throw new Error(await res.text());
    window.dispatchEvent(new CustomEvent('coursesUpdated', { detail: allCourses }));
    if (isAdmin) console.log('Courses saved.');
  } catch (e) {
    console.error('saveCoursesToDatabase error:', e);
  }
}

export async function loadCoursesFromDatabase(isAdmin: boolean = false): Promise<Course[]> {
  try {
    const res = await fetch(`/api/courses?admin=${isAdmin ? "1" : "0"}`, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();

    // Map DB -> TS
    const loaded: Course[] = rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      badge: r.badge,
      emoji: r.emoji,
      pathType: r.path_type,
      href: r.href,
      totalLessons: r.total_lessons ?? undefined,
      category: r.category ?? undefined,
      level: r.level ?? undefined,
      access: r.access ?? undefined,
      squad: r.squad ?? undefined,
      isVisible: r.is_visible,
      isPublished: r.is_published,
      isGated: r.is_gated ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      createdBy: r.created_by ?? undefined,
    }));

    return loaded;
  } catch (e) {
    console.error('loadCoursesFromDatabase error:', e);
    return allCourses; // fallback to in-memory defaults
  }
}

// Initialize courses from database
export async function initializeCourses(isAdmin: boolean = false): Promise<Course[]> {
  try {
    const stored = await loadCoursesFromDatabase(isAdmin);
    // Replace the array contents in-place so references stay valid
    allCourses.length = 0;
    allCourses.push(...stored);
    window.dispatchEvent(new CustomEvent('coursesUpdated', { detail: allCourses }));
    return allCourses;
  } catch {
    return allCourses;
  }
}
