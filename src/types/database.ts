export type DBAnnouncement = {
  id: string;
  title: string;
  content: string;
  starts_at: string | null;
  ends_at: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type DBEvent = {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string | null; // 'YYYY-MM-DD' or null
  time: string | null;
  created_at: string;
  updated_at: string;
};

export type DBBounty = {
  id: string;
  title: string;
  short_desc: string;
  reward: string;
  reward_type: 'XP' | 'SOL';
  start_date: string | null; // 'YYYY-MM-DD'
  deadline: string | null; // 'YYYY-MM-DD'
  link_to: string | null;
  image: string | null;
  squad_tag: string | null;
  status: "active" | "completed" | "expired";
  hidden: boolean;
  submissions: number;
  created_at: string;
  updated_at: string;
};
