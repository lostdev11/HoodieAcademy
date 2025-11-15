import { Metadata } from 'next';
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import Image from "next/image";
import BlogCardImage from './BlogCardImage';

export const metadata: Metadata = {
  title: 'Blog | Hoodie Academy',
  description: 'Lessons, stories, and honest takes from the Web3 trenches. Explore Web3 education, NFT communities, and trending topics.',
  keywords: [
    'Web3 blog',
    'crypto education',
    'NFT communities',
    'blockchain learning',
    'Solana',
    'Web3 tutorials',
    'crypto trading',
    'Hoodie Academy blog'
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Blog | Hoodie Academy',
    description: 'Lessons, stories, and honest takes from the Web3 trenches.',
    type: 'website',
    url: 'https://hoodieacademy.com/blog',
    images: [{
      url: '/images/hoodie-academy-pixel-art-logo.png',
      width: 1200,
      height: 630,
      alt: 'Hoodie Academy Blog - Web3 Education',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Hoodie Academy',
    description: 'Lessons, stories, and honest takes from the Web3 trenches.',
    images: ['/images/hoodie-academy-pixel-art-logo.png'],
  },
  alternates: {
    canonical: 'https://hoodieacademy.com/blog',
  },
};

interface PostMeta {
  title: string;
  description: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  tags?: string[];
  coverImage?: string;
}

function getPosts(): { meta: PostMeta; slug: string }[] {
  const postsDir = path.join(process.cwd(), "src/app/blog/posts");
  
  // Check if posts directory exists
  if (!fs.existsSync(postsDir)) {
    return [];
  }

  const files = fs.readdirSync(postsDir);

  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const content = fs.readFileSync(path.join(postsDir, file), "utf8");
      const { data } = matter(content);
      return { meta: data as PostMeta, slug: file.replace(".md", "") };
    })
    .sort(
      (a, b) =>
        new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime()
    );
}

export default function BlogPage() {
  const posts = getPosts();

  const categories = [
    "Web3 for Normies",
    "NFT Communities",
    "Trending Web3 Topics",
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/Hoodie Dashbaord.png"
          alt="Hoodie Dashboard Background"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>

      <main className="relative z-20 max-w-5xl mx-auto px-6 py-16 text-gray-100">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">🧠 Hoodie Academy Blog</h1>
            <p className="text-gray-400">
              Lessons, stories, and honest takes from the Web3 trenches.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 font-semibold text-sm"
            >
              🏛️ Login to Academy
            </Link>
            <Link
              href="/preview"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-300 rounded-full hover:bg-gray-800 transition-all duration-200 text-sm"
            >
              🎓 Preview
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-300 rounded-full hover:bg-gray-800 transition-all duration-200 text-sm"
            >
              ❓ FAQ
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-10">
          {categories.map((cat) => (
            <a
              key={cat}
              href={`#${cat.replace(/\s+/g, "-").toLowerCase()}`}
              className="border border-gray-700 rounded-full px-4 py-2 text-sm hover:bg-gray-800 transition"
            >
              {cat}
            </a>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">No blog posts yet.</p>
            <p className="text-gray-500 text-sm">Check back soon for Web3 insights and tutorials!</p>
          </div>
        ) : (
          categories.map((cat) => {
            const filtered = posts.filter((p) => p.meta.category === cat);
            if (!filtered.length) return null;
            return (
              <section key={cat} id={cat.replace(/\s+/g, "-").toLowerCase()} className="mb-16">
                <h2 className="text-2xl font-semibold mb-6">{cat}</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {filtered.map(({ meta, slug }) => (
                    <Link
                      key={slug}
                      href={`/blog/${slug}`}
                      className="block border border-gray-800 hover:border-gray-600 rounded-xl overflow-hidden transition bg-gray-900/30"
                    >
                      {meta.coverImage && (
                        <BlogCardImage src={meta.coverImage} alt={meta.title} />
                      )}
                      <div className="p-5">
                        <h3 className="text-xl font-semibold mb-2">{meta.title}</h3>
                        <p className="text-gray-400 text-sm mb-4">
                          {meta.description}
                        </p>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{meta.date}</span>
                          <span>{meta.readTime} read</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })
        )}

        {/* Footer Navigation */}
        <footer className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-wrap justify-center gap-6 text-sm mb-4">
            <Link href="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Home
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/about" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              About
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/preview" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Preview
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/faq" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              FAQ
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/blog" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Blog
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/courses" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Courses
            </Link>
          </div>
          <div className="text-center text-gray-500 text-xs">
            © {new Date().getFullYear()} Hoodie Academy. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}

