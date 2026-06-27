import { useEffect } from 'react';

interface UseSEOProps {
  title?: string;
  description?: string;
  schema?: object;
}

export function useSEO({ title, description, schema }: UseSEOProps = {}) {
  useEffect(() => {
    // 1. Update Title
    if (title) {
      document.title = title;
      // Update OpenGraph Title
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', title);
      }
    }

    // 2. Update Description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      }
      // Update OpenGraph Description
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute('content', description);
      }
    }

    // 3. Inject AEO/GEO JSON-LD Schema
    let scriptTag: HTMLScriptElement | null = null;
    if (schema) {
      // Create a new script tag for the schema
      scriptTag = document.createElement('script');
      scriptTag.type = 'application/ld+json';
      scriptTag.text = JSON.stringify(schema);
      document.head.appendChild(scriptTag);
    }

    // Cleanup function to remove schema when component unmounts
    // (Prevents duplicate schemas when navigating between pages)
    return () => {
      if (scriptTag) {
        document.head.removeChild(scriptTag);
      }
    };
  }, [title, description, schema]);
}
