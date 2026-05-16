// Comprehensive schema.org types for better SEO

export const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Klovers Academy",
  "url": "https://kloversegy.com",
  "logo": "https://kloversegy.com/logo.png",
  "description": "Learn Korean for K-drama lovers and Arabic speakers",
  "sameAs": [
    "https://www.facebook.com/kloversegy",
    "https://www.instagram.com/kloversegy",
    "https://www.youtube.com/@kloversegy",
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+20-1-1277-7560",
    "contactType": "Customer Service",
    "email": "hello@kloversegy.com",
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "EG",
    "addressLocality": "Cairo",
  },
  "knowsAbout": [
    "Korean language",
    "K-dramas",
    "Online education",
    "Language learning",
  ],
});

export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url,
  })),
});

export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
});

export const generateProductSchema = (product: {
  name: string;
  description: string;
  price: number;
  currency: string;
  rating?: number;
  reviewCount?: number;
}) => ({
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": product.name,
  "description": product.description,
  "offers": {
    "@type": "Offer",
    "price": product.price,
    "priceCurrency": product.currency,
    "availability": "https://schema.org/InStock",
  },
  ...(product.rating && {
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewCount,
    },
  }),
});

export const generateLocalBusinessSchema = (business: {
  name: string;
  image: string;
  address: string;
  phone: string;
  priceRange: string;
  rating?: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": business.name,
  "image": business.image,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": business.address,
    "addressCountry": "EG",
  },
  "telephone": business.phone,
  "priceRange": business.priceRange,
  ...(business.rating && {
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": business.rating,
    },
  }),
});

export const generateArticleSchema = (article: {
  headline: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  description: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": article.headline,
  "image": article.image,
  "datePublished": article.datePublished,
  "dateModified": article.dateModified || article.datePublished,
  "author": {
    "@type": "Person",
    "name": article.author,
  },
  "description": article.description,
});

export const generateEventSchema = (event: {
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  image?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Event",
  "name": event.name,
  "startDate": event.startDate,
  "endDate": event.endDate,
  "location": {
    "@type": "Place",
    "name": event.location,
  },
  "description": event.description,
  ...(event.image && { "image": event.image }),
});
