# SquadFilter & getCoursePaths Utilities

## Overview

This document covers the implementation of two key utilities for the Hoodie Academy course system:

1. **SquadFilter Component** - A clean, mobile-friendly squad switcher for filtering course views
2. **getCoursePaths Utility** - A reusable utility to auto-generate dynamic routes from course JSON files

## SquadFilter Component

### Location
`src/components/SquadFilter.tsx`

### Purpose
Provides a clean, mobile-friendly interface for filtering courses by squad (All, Decoders, Raiders, Speakers, Creators).

### Features
- **Mobile-friendly design** with responsive button layout
- **Active state management** with visual feedback
- **Clean UI** with rounded buttons and smooth transitions
- **Flexible integration** via onChange callback

### Usage

```tsx
import SquadFilter from '@/components/SquadFilter';

function CoursePage() {
  const handleSquadChange = (squad: string) => {
    // Handle squad selection
    console.log('Selected squad:', squad);
  };

  return (
    <SquadFilter onChange={handleSquadChange} />
  );
}
```

### Props
- `onChange: (squad: string) => void` - Callback function called when squad selection changes

### Available Squads
- **All** - Shows all courses regardless of squad
- **Decoders** - Analytical and technical courses
- **Raiders** - Meta hunting and trend timing courses
- **Speakers** - Communication and community building courses
- **Creators** - Content creation and brand building courses

### Styling
- Uses Tailwind CSS for styling
- Responsive design with flex-wrap for mobile
- Active state uses black background with white text
- Inactive state uses white background with black text
- Smooth transitions for state changes

## getCoursePaths Utility

### Location
`src/lib/getCoursePaths.ts`

### Purpose
Auto-generates dynamic routes from `/public/courses/*.json` files for use in Next.js static generation.

### Features
- **Automatic route generation** from JSON files
- **Course data retrieval** by slug
- **Squad filtering** capabilities
- **Error handling** for missing files/directories
- **TypeScript support** with proper typing

### Functions

#### `getCoursePaths(): string[]`
Returns an array of course slugs (filenames without .json extension).

```tsx
import { getCoursePaths } from '@/lib/getCoursePaths';

// In getStaticPaths
export async function getStaticPaths() {
  const slugs = getCoursePaths();
  
  return {
    paths: slugs.map(slug => ({ params: { slug } })),
    fallback: false
  };
}
```

#### `getCourseData(slug: string): any`
Retrieves course data by slug.

```tsx
import { getCourseData } from '@/lib/getCoursePaths';

// In getStaticProps
export async function getStaticProps({ params }: { params: { slug: string } }) {
  const courseData = getCourseData(params.slug);
  
  return {
    props: {
      course: courseData
    }
  };
}
```

#### `getAllCourseData(): any[]`
Retrieves all course data with slugs included.

```tsx
import { getAllCourseData } from '@/lib/getCoursePaths';

const allCourses = getAllCourseData();
// Returns: [{ slug: 'course-1', title: '...', ... }, ...]
```

#### `filterCoursesBySquad(courses: any[], squad: string): any[]`
Filters courses by squad name.

```tsx
import { getAllCourseData, filterCoursesBySquad } from '@/lib/getCoursePaths';

const allCourses = getAllCourseData();
const decoderCourses = filterCoursesBySquad(allCourses, 'Decoders');
```

#### `getUniqueSquads(courses: any[]): string[]`
Extracts unique squad names from course data.

```tsx
import { getAllCourseData, getUniqueSquads } from '@/lib/getCoursePaths';

const allCourses = getAllCourseData();
const squads = getUniqueSquads(allCourses);
// Returns: ['Decoders', 'Raiders', 'Speakers', 'Creators']
```

### Course JSON Structure

Courses should be stored in `/public/courses/` as JSON files with the following structure:

```json
{
  "id": "course-slug",
  "title": "Course Title",
  "description": "Course description",
  "badge": "Badge Name",
  "emoji": "🎯",
  "pathType": "tech",
  "href": "/course-slug",
  "localStorageKey": "courseSlugProgress",
  "totalLessons": 5,
  "squad": "Decoders",
  "category": "technical",
  "level": "intermediate",
  "access": "hoodie-gated",
  "modules": [
    {
      "id": "module-1",
      "title": "Module Title",
      "lessons": [
        {
          "id": "lesson-1",
          "title": "Lesson Title",
          "content": "Lesson content"
        }
      ]
    }
  ]
}
```

### Required Fields
- `id` - Unique course identifier
- `title` - Course title
- `description` - Course description
- `squad` - Squad assignment (Decoders, Raiders, Speakers, Creators, or All)

### Optional Fields
- `badge` - Badge earned upon completion
- `emoji` - Emoji icon for the course
- `pathType` - Course type (tech, social, converged)
- `href` - Course URL path
- `localStorageKey` - Key for progress tracking
- `totalLessons` - Number of lessons in the course
- `category` - Course category
- `level` - Difficulty level
- `access` - Access requirements
- `modules` - Course content structure

## Integration with Courses Page

### Squad Tags Added
The courses page has been updated with squad tags for all existing courses:

- **Technical Analysis** → Decoders
- **Cybersecurity & Wallet Practices** → Decoders  
- **AI + Automation Curriculum** → Decoders
- **NFT Trading Psychology** → Raiders
- **Lore & Narrative Crafting** → Speakers
- **Hoodie Squad Track** → All

### Filtering Implementation
The courses page now includes:

1. **SquadFilter component** for visual squad selection
2. **Squad-based filtering** in the getFilteredCourses function
3. **Squad tags** in course data structure
4. **Integration** with existing filter system

### Usage in Courses Page

```tsx
// State management
const [selectedSquad, setSelectedSquad] = useState('All');

// Filtering logic
const getFilteredCourses = () => {
  let filteredCourses = allCourses;

  // Apply squad filter first
  if (selectedSquad && selectedSquad !== 'All') {
    filteredCourses = filteredCourses.filter(course => course.squad === selectedSquad);
  }

  // Apply other filters...
  return filteredCourses;
};

// UI integration
<SquadFilter onChange={(squad) => setSelectedSquad(squad)} />
```

## Error Handling

### getCoursePaths Error Handling
- **Missing directory**: Returns empty array with warning
- **File read errors**: Returns empty array with error logging
- **JSON parse errors**: Returns null for individual courses with error logging

### SquadFilter Error Handling
- **Invalid squad selection**: Handled gracefully with default "All" state
- **Missing onChange prop**: TypeScript will catch this at compile time

## Testing

### SquadFilter Testing
```tsx
// Test squad selection
const handleSquadChange = (squad: string) => {
  expect(squad).toBeOneOf(['All', 'Decoders', 'Raiders', 'Speakers', 'Creators']);
};

// Test active state
const activeButton = screen.getByText('Decoders');
expect(activeButton).toHaveClass('bg-black text-white');
```

### getCoursePaths Testing
```tsx
// Test path generation
const paths = getCoursePaths();
expect(paths).toContain('sample-course');

// Test course data retrieval
const courseData = getCourseData('sample-course');
expect(courseData.title).toBe('Sample Course');

// Test squad filtering
const allCourses = getAllCourseData();
const decoderCourses = filterCoursesBySquad(allCourses, 'Decoders');
expect(decoderCourses.every(course => course.squad === 'Decoders')).toBe(true);
```

## Future Enhancements

### SquadFilter Enhancements
- **Squad icons** for visual identification
- **Progress indicators** showing completion status
- **Squad-specific colors** for better visual distinction
- **Keyboard navigation** support

### getCoursePaths Enhancements
- **Caching** for better performance
- **Validation** of course JSON structure
- **Search functionality** across course content
- **Category filtering** in addition to squad filtering
- **Sorting options** by various criteria

### Integration Enhancements
- **URL parameters** for squad filtering
- **Breadcrumb navigation** with squad context
- **Squad-specific course recommendations**
- **Progress tracking** across squad courses

## Best Practices

### Course JSON Files
- Use kebab-case for filenames (e.g., `nft-trading-psychology.json`)
- Include all required fields
- Validate JSON structure before deployment
- Keep file sizes reasonable for performance

### Squad Assignment
- Assign courses to specific squads based on content focus
- Use "All" sparingly for truly general courses
- Consider cross-squad courses for advanced topics
- Maintain balance across squads

### Performance
- Use getCoursePaths in getStaticPaths for static generation
- Cache course data when possible
- Minimize file system operations
- Consider lazy loading for large course catalogs

---

*These utilities provide a robust foundation for squad-based course filtering and dynamic route generation in the Hoodie Academy platform.* 