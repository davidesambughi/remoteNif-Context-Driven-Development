// Root layout — pass-through only.
// <html> and <body> are rendered in app/[locale]/layout.tsx so lang={locale} is set correctly.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
