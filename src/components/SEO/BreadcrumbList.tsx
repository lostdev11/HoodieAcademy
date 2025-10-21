interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbListProps {
  items: BreadcrumbItem[];
}

export default function BreadcrumbList({ items }: BreadcrumbListProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://hoodieacademy.com${item.url}`
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  );
}
