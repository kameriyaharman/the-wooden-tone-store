import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon, LinkedinIcon, XIcon, YoutubeIcon } from "./icons";
import { Newsletter } from "./newsletter";
import type { PublicSettings } from "@/lib/settings";

export function Footer({ st }: { st: PublicSettings }) {
  const social = [
    { href: st.social?.facebook, Icon: FacebookIcon, label: "Facebook" },
    { href: st.social?.instagram, Icon: InstagramIcon, label: "Instagram" },
    { href: st.social?.x, Icon: XIcon, label: "X" },
    { href: st.social?.linkedin, Icon: LinkedinIcon, label: "LinkedIn" },
    { href: (st.social as { youtube?: string })?.youtube, Icon: YoutubeIcon, label: "YouTube" },
  ].filter((x) => x.href);
  const col = "text-[13px] font-semibold uppercase tracking-[0.16em] text-ink";
  const lnk = "block py-1.5 text-[14px] text-muted transition-colors duration-200 hover:text-teak-dark";
  return (
    <footer className="pb-16 lg:pb-0">
      <Newsletter />
      <div className="border-t border-line bg-ivory">
        <div className="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.4fr] lg:gap-8">
          <div>
            <Link href="/" className="inline-flex flex-col items-start">
              <img src="/seed/logo.png" alt={st.storeName} className="h-12 w-auto" />
              <span className="mt-2 font-serif text-[22px] font-semibold uppercase tracking-[0.18em]">{st.storeName}</span>
            </Link>
            <p className="mt-4 max-w-[280px] text-[14px] leading-relaxed text-muted">{st.footerAbout}</p>
            {social.length > 0 && (
              <div className="mt-5 flex gap-2">
                {social.map(({ href, Icon, label }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid h-9 w-9 place-items-center border border-line text-ink transition hover:border-teak hover:text-teak-dark">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-8 md:col-span-1 lg:contents">
            <div>
              <p className={col}>Shop</p>
              <div className="mt-4">
                <Link className={lnk} href="/shop?room=living-room">Living Room</Link>
                <Link className={lnk} href="/shop?room=bedroom">Bedroom</Link>
                <Link className={lnk} href="/shop?room=dining">Dining</Link>
                <Link className={lnk} href="/shop?room=kitchen">Kitchen &amp; Dining</Link>
                <Link className={lnk} href="/shop?room=decor-pooja">Home Décor</Link>
                <Link className={lnk} href="/shop?sort=new">New In</Link>
              </div>
            </div>
            <div>
              <p className={col}>Company</p>
              <div className="mt-4">
                <Link className={lnk} href="/about">Our Story</Link>
                <Link className={lnk} href="/contact">Contact Us</Link>
                <Link className={lnk} href="/custom-order">Custom Order</Link>
                <Link className={lnk} href="/track-order">Track Order</Link>
                <Link className={lnk} href="/#faq">FAQ</Link>
              </div>
            </div>
          </div>
          <div>
            <p className={col}>Policies</p>
            <div className="mt-4">
              <Link className={lnk} href="/pages/shipping-and-returns">Shipping &amp; Returns</Link>
              <Link className={lnk} href="/pages/refund-and-cancellation">Refund &amp; Cancellation</Link>
              <Link className={lnk} href="/pages/privacy-policy">Privacy Policy</Link>
              <Link className={lnk} href="/pages/terms-of-service">Terms of Service</Link>
              <Link className={lnk} href="/pages/cookie-policy">Cookie Policy</Link>
            </div>
          </div>
          <div>
            <p className={col}>Visit Us</p>
            <ul className="mt-4 space-y-3 text-[14px] text-muted">
              <li>{st.mapLink ? <a href={st.mapLink} target="_blank" rel="noreferrer" className="flex gap-2.5 hover:text-ink"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teak" />{st.address}</a> : <span className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teak" />{st.address}</span>}</li>
              <li><a href={`tel:${st.phone.replace(/\s/g, "")}`} className="flex gap-2.5 hover:text-ink"><Phone className="h-4 w-4 shrink-0 text-teak" />{st.phone}</a></li>
              <li><a href={`mailto:${st.email}`} className="flex gap-2.5 break-all hover:text-ink"><Mail className="h-4 w-4 shrink-0 text-teak" />{st.email}</a></li>
              <li className="flex gap-2.5"><Clock className="h-4 w-4 shrink-0 text-teak" />{st.hours}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="container-site flex flex-col items-center gap-4 py-6 text-xs text-muted md:flex-row md:justify-between">
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 md:justify-start"><span>© {new Date().getFullYear()} {st.storeName}. All rights reserved.</span><span aria-hidden className="text-line">·</span><span>Developed by <a href="http://customesolution.com/" target="_blank" rel="noopener" className="font-semibold text-teak-dark underline-offset-4 hover:underline">Custom E Solution</a></span></p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {["VISA", "MASTERCARD", "UPI", "PAYTM", "PHONEPE", "COD"].map((m) => (
                <span key={m} className="border border-line bg-white px-2 py-1 text-[10px] font-medium tracking-wide text-ink/70">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
