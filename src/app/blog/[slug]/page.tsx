import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import BlogPostContent from './BlogPostContent';
import CoverImage from './CoverImage';

interface PostMeta {
  title: string;
  description: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  tags?: string[];
  coverImage?: string;
  ogImage?: string;
}

function getPost(slug: string): { meta: PostMeta; content: string } | null {
  const postsDir = path.join(process.cwd(), 'src/app/blog/posts');
  const filePath = path.join(postsDir, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);

  return {
    meta: data as PostMeta,
    content,
  };
}

function getAllPostSlugs(): string[] {
  const postsDir = path.join(process.cwd(), 'src/app/blog/posts');
  
  if (!fs.existsSync(postsDir)) {
    return [];
  }

  const files = fs.readdirSync(postsDir);
  return files
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace('.md', ''));
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({
    slug: slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getPost(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found | Hoodie Academy Blog',
    };
  }

  return {
    title: `${post.meta.title} | Hoodie Academy Blog`,
    description: post.meta.description,
    keywords: post.meta.tags || [],
    authors: [{ name: post.meta.author }],
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      type: 'article',
      publishedTime: post.meta.date,
      authors: [post.meta.author],
      images: post.meta.ogImage ? [post.meta.ogImage] : post.meta.coverImage ? [post.meta.coverImage] : [],
      url: `https://hoodieacademy.com/blog/${params.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta.title,
      description: post.meta.description,
      images: post.meta.ogImage ? [post.meta.ogImage] : post.meta.coverImage ? [post.meta.coverImage] : [],
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `https://hoodieacademy.com/blog/${params.slug}`,
    },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);

  if (!post) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    try {
      // Handle YYYY-MM-DD format explicitly
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

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

      <article className="relative z-20 max-w-4xl mx-auto px-6 py-16">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
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

        {/* Cover Image */}
        {post.meta.coverImage && (
          <CoverImage src={post.meta.coverImage} alt={post.meta.title} />
        )}

        {/* Post Header */}
        <header className="mb-8">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-indigo-600/20 text-indigo-300 rounded-full text-sm font-medium">
              {post.meta.category}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.meta.title}</h1>
          <p className="text-xl text-gray-300 mb-6">{post.meta.description}</p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span>By {post.meta.author}</span>
            <span>•</span>
            <time dateTime={post.meta.date}>{formatDate(post.meta.date)}</time>
            <span>•</span>
            <span>{post.meta.readTime} read</span>
          </div>

          {/* Tags */}
          {post.meta.tags && post.meta.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-800/50 text-gray-300 rounded text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Post Content */}
        <BlogPostContent content={post.content} />

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-wrap justify-center gap-6 text-sm mb-4">
            <Link href="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Home
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
      </article>
    </div>
  );
}

