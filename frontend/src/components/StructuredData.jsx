/**
 * Structured Data (JSON-LD) component for SEO.
 * Renders invisible schema.org markup in the document head.
 * 
 * Usage: <StructuredData data={{ "@type": "Organization", ... }} />
 */
export default function StructuredData({ data }) {
  if (!data) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    ...data
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * Pre-built schema for the Medhashree organization.
 * Add to the Landing page.
 */
export function OrganizationSchema() {
  return (
    <StructuredData
      data={{
        "@type": "EducationalOrganization",
        "name": "Medhashree",
        "description": "The ultimate competitive quiz platform for engineering and medical entrance exams.",
        "url": "https://medhashree.com",
        "sameAs": []
      }}
    />
  );
}

/**
 * WebSite schema with search action.
 * Add to the Landing page.
 */
export function WebSiteSchema() {
  return (
    <StructuredData
      data={{
        "@type": "WebSite",
        "name": "Medhashree",
        "url": "https://medhashree.com"
      }}
    />
  );
}

/**
 * FAQ schema from an array of { question, answer } objects.
 */
export function FAQSchema({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <StructuredData
      data={{
        "@type": "FAQPage",
        "mainEntity": items.map(({ question, answer }) => ({
          "@type": "Question",
          "name": question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": answer
          }
        }))
      }}
    />
  );
}
