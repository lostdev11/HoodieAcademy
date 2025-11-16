import { redirect } from 'next/navigation';

export const dynamic = 'force-static';

export default function ChooseYourSquadPage() {
  redirect('https://hoodieacademy.com/choose-your-squad');
}

