// Browser-friendly course import script for Hoodie Academy Admin Dashboard
// Run this in your browser console on the admin dashboard page

(function() {
  'use strict';
  
  console.log('🚀 Starting browser-based course import...');
  
  // Fetch course data from API instead of hardcoded data
  const fetchCoursesFromAPI = async () => {
    try {
      const response = await fetch('/api/courses');
      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }
      const courses = await response.json();
      console.log('📚 Fetched courses from API:', courses.length);
      return courses;
    } catch (error) {
      console.error('❌ Error fetching courses from API:', error);
      // Fallback to hardcoded data if API fails
      console.log('🔄 Falling back to hardcoded course data...');
      return [
    {
      id: 'nft-mastery',
      title: 'NFT Mastery',
      description: 'Learn the ins and outs of NFTs, from creation to trading and community building, with interactive quizzes and mock minting.',
      emoji: '👾',
      badge: 'NFT Ninja',
      squad: 'creators',
      level: 'beginner',
      access: 'free',
      category: 'nft',
      totalLessons: 4,
      sort_order: 1
    },
    {
      id: 'wallet-wizardry',
      title: 'Wallet Wizardry',
      description: 'Master wallet setup with interactive quizzes and MetaMask integration.',
      emoji: '🔒',
      badge: 'Vault Keeper',
      squad: 'decoders',
      level: 'beginner',
      access: 'free',
      category: 'wallet',
      totalLessons: 4,
      sort_order: 2
    },
    {
      id: 'meme-coin-mania',
      title: 'Meme Coin Mania',
      description: 'Navigate the wild world of meme coins with strategic insights and risk management.',
      emoji: '🚀',
      badge: 'Meme Lord',
      squad: 'raiders',
      level: 'intermediate',
      access: 'free',
      category: 'trading',
      totalLessons: 3,
      sort_order: 3
    },
    {
      id: 'c120-browser-hygiene',
      title: 'Browser Hygiene',
      description: 'Learn essential browser security practices to protect your digital assets.',
      emoji: '🛡️',
      badge: 'Security Guardian',
      squad: 'decoders',
      level: 'beginner',
      access: 'free',
      category: 'security',
      totalLessons: 5,
      sort_order: 4
    },
    {
      id: 's120-cold-truths-self-custody',
      title: 'Cold Truths: Self Custody',
      description: 'Master the fundamentals of self-custody and cold storage for your digital assets.',
      emoji: '❄️',
      badge: 'Cold Storage Master',
      squad: 'decoders',
      level: 'intermediate',
      access: 'hoodie',
      category: 'security',
      totalLessons: 6,
      sort_order: 5
    },
    {
      id: 'a120-ai-vocab',
      title: 'AI Vocabulary',
      description: 'Build your AI literacy with essential terminology and concepts.',
      emoji: '🤖',
      badge: 'AI Linguist',
      squad: 'creators',
      level: 'beginner',
      access: 'free',
      category: 'ai',
      totalLessons: 4,
      sort_order: 6
    },
    {
      id: 'a150-prompt-engineering',
      title: 'Prompt Engineering',
      description: 'Master the art of crafting effective prompts for AI systems.',
      emoji: '🎯',
      badge: 'Prompt Master',
      squad: 'creators',
      level: 'intermediate',
      access: 'free',
      category: 'ai',
      totalLessons: 5,
      sort_order: 7
    },
    {
      id: 'n100-nft-marketplaces',
      title: 'NFT Marketplaces',
      description: 'Explore the ecosystem of NFT marketplaces and trading platforms.',
      emoji: '🏪',
      badge: 'Marketplace Explorer',
      squad: 'creators',
      level: 'beginner',
      access: 'free',
      category: 'nft',
      totalLessons: 4,
      sort_order: 8
    },
    {
      id: 'n150-bid-games',
      title: 'Bid Games',
      description: 'Master the psychology and strategy of NFT bidding games.',
      emoji: '🎲',
      badge: 'Bid Master',
      squad: 'raiders',
      level: 'intermediate',
      access: 'free',
      category: 'nft',
      totalLessons: 4,
      sort_order: 9
    },
    {
      id: 'n150-floor-games',
      title: 'Floor Games',
      description: 'Navigate the complex world of floor price dynamics and strategies.',
      emoji: '📊',
      badge: 'Floor Strategist',
      squad: 'raiders',
      level: 'intermediate',
      access: 'hoodie',
      category: 'nft',
      totalLessons: 5,
      sort_order: 10
    },
    {
      id: 'n200-trait-meta',
      title: 'Trait Meta',
      description: 'Understand the meta-game of NFT traits and rarity.',
      emoji: '🎭',
      badge: 'Trait Analyst',
      squad: 'creators',
      level: 'intermediate',
      access: 'free',
      category: 'nft',
      totalLessons: 4,
      sort_order: 11
    },
    {
      id: 'n300-collector-archetypes',
      title: 'Collector Archetypes',
      description: 'Learn about different types of NFT collectors and their motivations.',
      emoji: '👥',
      badge: 'Collector Psychologist',
      squad: 'creators',
      level: 'advanced',
      access: 'hoodie',
      category: 'nft',
      totalLessons: 5,
      sort_order: 12
    },
    {
      id: 't100-chart-literacy',
      title: 'Chart Literacy',
      description: 'Develop essential skills for reading and interpreting trading charts.',
      emoji: '📈',
      badge: 'Chart Reader',
      squad: 'raiders',
      level: 'beginner',
      access: 'free',
      category: 'trading',
      totalLessons: 4,
      sort_order: 13
    },
    {
      id: 't120-support-resistance',
      title: 'Support & Resistance',
      description: 'Master the fundamentals of support and resistance levels in trading.',
      emoji: '⚖️',
      badge: 'Level Trader',
      squad: 'raiders',
      level: 'intermediate',
      access: 'free',
      category: 'trading',
      totalLessons: 4,
      sort_order: 14
    },
    {
      id: 't200-confluence-strategy',
      title: 'Confluence Strategy',
      description: 'Learn to identify and trade confluence zones for higher probability setups.',
      emoji: '🎯',
      badge: 'Confluence Hunter',
      squad: 'raiders',
      level: 'intermediate',
      access: 'hoodie',
      category: 'trading',
      totalLessons: 5,
      sort_order: 15
    },
    {
      id: 't250-emotional-traps',
      title: 'Emotional Traps',
      description: 'Recognize and avoid common emotional pitfalls in trading.',
      emoji: '🧠',
      badge: 'Emotional Master',
      squad: 'raiders',
      level: 'advanced',
      access: 'hoodie',
      category: 'trading',
      totalLessons: 4,
      sort_order: 16
    },
    {
      id: 'v100-pixel-art-basics',
      title: 'Pixel Art Basics',
      description: 'Learn the fundamentals of creating pixel art for NFTs.',
      emoji: '🎨',
      badge: 'Pixel Artist',
      squad: 'creators',
      level: 'beginner',
      access: 'free',
      category: 'art',
      totalLessons: 4,
      sort_order: 17
    },
    {
      id: 'v120-meme-creation',
      title: 'Meme Creation',
      description: 'Master the art of creating viral memes and internet culture.',
      emoji: '😂',
      badge: 'Meme Creator',
      squad: 'creators',
      level: 'beginner',
      access: 'free',
      category: 'art',
      totalLessons: 4,
      sort_order: 18
    },
    {
      id: 'v120-meme-copywriting',
      title: 'Meme Copywriting',
      description: 'Learn to write compelling copy that makes memes go viral.',
      emoji: '✍️',
      badge: 'Copy Master',
      squad: 'creators',
      level: 'intermediate',
      access: 'free',
      category: 'art',
      totalLessons: 3,
      sort_order: 19
    },
    {
      id: 'v150-visual-composition',
      title: 'Visual Composition',
      description: 'Master the principles of visual design and composition.',
      emoji: '🎭',
      badge: 'Visual Designer',
      squad: 'creators',
      level: 'intermediate',
      access: 'free',
      category: 'art',
      totalLessons: 5,
      sort_order: 20
    },
    {
      id: 'v200-custom-trait-creation',
      title: 'Custom Trait Creation',
      description: 'Learn to create unique traits and attributes for NFT collections.',
      emoji: '🔧',
      badge: 'Trait Creator',
      squad: 'creators',
      level: 'intermediate',
      access: 'hoodie',
      category: 'art',
      totalLessons: 4,
      sort_order: 21
    },
    {
      id: 'v220-comics-sequential',
      title: 'Comics & Sequential Art',
      description: 'Master the art of storytelling through sequential visual narratives.',
      emoji: '📚',
      badge: 'Comic Creator',
      squad: 'creators',
      level: 'intermediate',
      access: 'hoodie',
      category: 'art',
      totalLessons: 4,
      sort_order: 22
    },
    {
      id: 'v250-micro-animation',
      title: 'Micro Animation',
      description: 'Learn to create engaging micro-animations for digital content.',
      emoji: '✨',
      badge: 'Animation Master',
      squad: 'creators',
      level: 'advanced',
      access: 'hoodie',
      category: 'art',
      totalLessons: 4,
      sort_order: 23
    },
    {
      id: 'wc300-trait-masterclass',
      title: 'Trait Masterclass',
      description: 'Advanced techniques for creating and managing NFT traits.',
      emoji: '🎓',
      badge: 'Trait Master',
      squad: 'creators',
      level: 'advanced',
      access: 'dao',
      category: 'nft',
      totalLessons: 6,
      sort_order: 24
    },
    {
      id: 'o120-raid-psychology',
      title: 'Raid Psychology',
      description: 'Understand the psychology behind successful community raids.',
      emoji: '⚔️',
      badge: 'Raid Leader',
      squad: 'raiders',
      level: 'intermediate',
      access: 'free',
      category: 'community',
      totalLessons: 4,
      sort_order: 25
    },
    {
      id: 'o200-space-hosting',
      title: 'Space Hosting',
      description: 'Master the art of hosting engaging Twitter Spaces and community events.',
      emoji: '🎤',
      badge: 'Space Host',
      squad: 'rangers',
      level: 'intermediate',
      access: 'free',
      category: 'community',
      totalLessons: 4,
      sort_order: 26
    },
    {
      id: 'o220-squad-ritual',
      title: 'Squad Ritual',
      description: 'Build strong squad bonds through meaningful rituals and traditions.',
      emoji: '🔥',
      badge: 'Squad Leader',
      squad: 'rangers',
      level: 'intermediate',
      access: 'hoodie',
      category: 'community',
      totalLessons: 3,
      sort_order: 27
    },
    {
      id: 'o250-onboarding-wizard',
      title: 'Onboarding Wizard',
      description: 'Master the art of welcoming and integrating new community members.',
      emoji: '🧙‍♂️',
      badge: 'Onboarding Master',
      squad: 'rangers',
      level: 'advanced',
      access: 'hoodie',
      category: 'community',
      totalLessons: 5,
      sort_order: 28
    },
    {
      id: 'o300-scaling-vibes',
      title: 'Scaling Vibes',
      description: 'Learn to scale community energy and maintain vibes at scale.',
      emoji: '🚀',
      badge: 'Vibe Master',
      squad: 'rangers',
      level: 'advanced',
      access: 'dao',
      category: 'community',
      totalLessons: 5,
      sort_order: 29
    },
    {
      id: 'l100-lore-identity',
      title: 'Lore & Identity',
      description: 'Build compelling lore and identity for your projects and communities.',
      emoji: '📖',
      badge: 'Lore Master',
      squad: 'creators',
      level: 'beginner',
      access: 'free',
      category: 'lore',
      totalLessons: 3,
      sort_order: 30
    },
    {
      id: 'l150-personal-lore',
      title: 'Personal Lore',
      description: 'Develop your personal brand and narrative in the digital space.',
      emoji: '👤',
      badge: 'Personal Brand',
      squad: 'creators',
      level: 'intermediate',
      access: 'free',
      category: 'lore',
      totalLessons: 4,
      sort_order: 31
    },
    {
      id: 'l220-conflict-portal',
      title: 'Conflict Portal',
      description: 'Navigate and resolve conflicts in online communities effectively.',
      emoji: '⚔️',
      badge: 'Conflict Resolver',
      squad: 'rangers',
      level: 'intermediate',
      access: 'hoodie',
      category: 'community',
      totalLessons: 4,
      sort_order: 32
    },
    {
      id: 'l250-threadweaving',
      title: 'Threadweaving',
      description: 'Master the art of creating engaging Twitter threads and narratives.',
      emoji: '🧵',
      badge: 'Thread Master',
      squad: 'creators',
      level: 'advanced',
      access: 'hoodie',
      category: 'lore',
      totalLessons: 3,
      sort_order: 33
    },
    {
      id: 'c150-scam-detection',
      title: 'Scam Detection',
      description: 'Learn to identify and avoid common scams in the crypto space.',
      emoji: '🚨',
      badge: 'Scam Hunter',
      squad: 'decoders',
      level: 'intermediate',
      access: 'free',
      category: 'security',
      totalLessons: 4,
      sort_order: 34
    },
    {
      id: 'hl140-randomizer-power',
      title: 'Randomizer Power',
      description: 'Understand the power and applications of randomization in NFTs.',
      emoji: '🎲',
      badge: 'Randomizer Master',
      squad: 'creators',
      level: 'intermediate',
      access: 'free',
      category: 'nft',
      totalLessons: 3,
      sort_order: 35
    },
    {
      id: 'hl240-faceless-lore',
      title: 'Faceless Lore',
      description: 'Create compelling lore for faceless NFT projects.',
      emoji: '👻',
      badge: 'Faceless Creator',
      squad: 'creators',
      level: 'advanced',
      access: 'hoodie',
      category: 'lore',
      totalLessons: 4,
      sort_order: 36
    },
    {
      id: 'solana-ecosystem-mastery',
      title: 'Solana Ecosystem Mastery',
      description: 'Master the Solana blockchain ecosystem and its unique features.',
      emoji: '☀️',
      badge: 'Solana Master',
      squad: 'decoders',
      level: 'advanced',
      access: 'dao',
      category: 'blockchain',
      totalLessons: 6,
      sort_order: 37
    }
      ];
    }
  };
  
  // Function to add a course via the admin dashboard
  async function addCourseToDatabase(courseData) {
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...courseData,
          is_visible: true,
          is_published: false
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Added: ${courseData.title} (ID: ${result.id})`);
        return result;
      } else {
        const error = await response.text();
        console.error(`❌ Failed to add ${courseData.title}:`, error);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error adding ${courseData.title}:`, error);
      return null;
    }
  }
  
  // Function to import all courses
  async function importAllCourses() {
    // Fetch courses from API first
    const coursesToImport = await fetchCoursesFromAPI();
    console.log(`📚 Starting import of ${coursesToImport.length} courses...\n`);
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < coursesToImport.length; i++) {
      const course = coursesToImport[i];
      console.log(`🔄 Processing ${i + 1}/${coursesToImport.length}: ${course.title}`);
      
      try {
        const result = await addCourseToDatabase(course);
        if (result) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(course.title);
        }
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing ${course.title}:`, error);
        results.failed++;
        results.errors.push(course.title);
      }
    }
    
    // Print summary
    console.log(`\n📊 IMPORT SUMMARY:`);
    console.log(`   ✅ Successfully imported: ${results.success}`);
    console.log(`   ❌ Failed to import: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log(`\n❌ FAILED COURSES:`);
      results.errors.forEach(title => console.log(`   - ${title}`));
    }
    
    console.log(`\n🎯 Next steps:`);
    console.log(`   1. Refresh your admin dashboard`);
    console.log(`   2. Check the Courses tab to see imported courses`);
    console.log(`   3. Adjust visibility and publish status as needed`);
    console.log(`   4. Set appropriate sort orders for better organization`);
    
    return results;
  }
  
  // Function to check current courses in database
  async function checkCurrentCourses() {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const courses = await response.json();
        console.log(`📊 Current courses in database: ${courses.length}`);
        return courses;
      }
    } catch (error) {
      console.error('❌ Error checking current courses:', error);
    }
    return [];
  }
  
  // Function to show import options
  function showImportOptions() {
    console.log(`
🚀 HOODIE ACADEMY COURSE IMPORT TOOL
=====================================

Available functions:
- importAllCourses()     - Import all 37 courses
- checkCurrentCourses()  - Check what's already in the database
- COURSES_TO_IMPORT     - View the course data to be imported

To start the import, run: importAllCourses()

Note: This will add courses as visible but unpublished by default.
You can then use the admin dashboard to adjust visibility and publish status.
    `);
  }
  
  // Show options when script loads
  showImportOptions();
  
  // Make functions globally available
  window.importAllCourses = importAllCourses;
  window.checkCurrentCourses = checkCurrentCourses;
  window.COURSES_TO_IMPORT = COURSES_TO_IMPORT;
  
})();
