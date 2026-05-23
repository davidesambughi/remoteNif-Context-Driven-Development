// JsonLd — Server Component that injects a JSON-LD structured data script tag.
// Must remain a Server Component (no "use client") to avoid the hydration
// duplication bug where Client Components render JSON-LD twice (server + client).

interface Props {
  data: Record<string, unknown>
}

export function JsonLd({ data }: Props) {
  // JSON.stringify then replace '<' with the unicode escape '<'.
  // This prevents </script> injection if any string value contains an angle bracket,
  // which would prematurely close the script tag and create an XSS vector.
  const safeJson = JSON.stringify(data).replace(/</g, '\\u003c')

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  )
}
