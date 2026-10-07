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
  const col = "font-serif text-xl font-semibold text-white";
  const lnk = "block py-1.5 text-[13px] text-white/70 transition-all duration-300 hover:translate-x-1 hover:text-teak-light";
  return (
    <footer className="pb-16 lg:pb-0">
      <Newsletter />
      <div className="bg-walnut text-white">
        <div className="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.3fr]">
          <div>
            <img src="/seed/logo.png" alt={st.storeName} className="h-14 rounded-xl bg-white p-2" />
            <p className="mt-4 max-w-[260px] text-[13px] leading-relaxed text-white/70">{st.footerAbout}</p>
            <div className="mt-5 flex gap-2.5">
              {social.map(({ href, Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 md:col-span-1 lg:contents">
            <div>
              <p className={col}>Shop</p>
              <div className="mt-3">
                <Link className={lnk} href="/shop?room=living-room">Living Room</Link>
                <Link className={lnk} href="/shop?room=bedroom">Bedroom</Link>
                <Link className={lnk} href="/shop?room=dining">Dining</Link>
                <Link className={lnk} href="/shop?room=kitchen">Kitchen &amp; Dining</Link>
                <Link className={lnk} href="/shop?room=decor-pooja">Home Decor</Link>
              </div>
            </div>
            <div>
              <p className={col}>Support</p>
              <div className="mt-3">
                <Link className={lnk} href="/contact">Contact Us</Link>
                <Link className={lnk} href="/custom-order">Custom Order</Link>
                <Link className={lnk} href="/track-order">Track Order</Link>
                <Link className={lnk} href="/#faq">FAQ</Link>
                <Link className={lnk} href="/pages/shipping-and-returns">Shipping &amp; Returns</Link>
              </div>
            </div>
          </div>
          <div>
            <p className={col}>Legal</p>
            <div className="mt-3">
              <Link className={lnk} href="/pages/privacy-policy">Privacy Policy</Link>
              <Link className={lnk} href="/pages/terms-of-service">Terms of Service</Link>
              <Link className={lnk} href="/pages/refund-and-cancellation">Refund &amp; Cancellation</Link>
              <Link className={lnk} href="/pages/cookie-policy">Cookie Policy</Link>
            </div>
          </div>
          <div>
            <p className={col}>Contact</p>
            <ul className="mt-4 space-y-3 text-[13px] text-white/75">
              <li>{st.mapLink ? <a href={st.mapLink} target="_blank" rel="noreferrer" className="flex gap-2.5 hover:text-white"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teak" />{st.address}</a> : <span className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teak" />{st.address}</span>}</li>
              <li><a href={`tel:${st.phone.replace(/\s/g, "")}`} className="flex gap-2.5 hover:text-white"><Phone className="h-4 w-4 shrink-0 text-teak" />{st.phone}</a></li>
              <li><a href={`mailto:${st.email}`} className="flex gap-2.5 hover:text-white"><Mail className="h-4 w-4 shrink-0 text-teak" />{st.email}</a></li>
              <li className="flex gap-2.5"><Clock className="h-4 w-4 shrink-0 text-teak" />{st.hours}</li>
            </ul>
          </div>
        </div>
        <div className="container-site flex flex-col items-center gap-4 border-t border-white/10 py-6 text-xs text-white/60 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} {st.storeName}. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {["VISA", "MASTERCARD", "UPI", "PAYTM", "PHONEPE", "COD"].map((m) => (
              <span key={m} className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-bold tracking-wide text-white/80">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
