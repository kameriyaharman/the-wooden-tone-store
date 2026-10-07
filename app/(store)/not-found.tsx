import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container-site py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="h-display mt-3 text-5xl">Page not found</h1>
      <p className="mt-3 text-muted">The page you&apos;re looking for has moved or doesn&apos;t exist.</p>
      <div className="mt-6 flex justify-center gap-3"><Link href="/" className="btn-outline">Go home</Link><Link href="/shop" className="btn-gold">Shop furniture</Link></div>
    </div>
  );
}
