'use client';

import CouncilNoticeDisplay from './CouncilNoticeDisplay';
import AnnouncementsDisplay from './AnnouncementsDisplay';
import SpotlightDisplay from './SpotlightDisplay';

export default function AcademyInfo() {
  return (
    <div className="space-y-8">
      {/* Council Notice */}
      <CouncilNoticeDisplay />
      
      {/* Academy Announcements */}
      <AnnouncementsDisplay />
      
      {/* Academy Spotlight */}
      <SpotlightDisplay />
    </div>
  );
}
