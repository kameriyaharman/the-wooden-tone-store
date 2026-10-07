import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { PageHero } from "@/components/ui";
import { ContactForm } from "@/components/forms";
import { WhatsappIcon } from "@/components/icons";

export const metadata = { title: "Contact Us" };

export default async function Contact() {
  const st = await getSettings();
  const cards = [
    { Icon: Phone, t: "Call us", d: `${st.phone} · ${st.hours}`, href: `tel:${st.phone.replace(/\s/g, "")}` },
    { Icon: WhatsappIcon, t: "WhatsApp", d: "Quick replies on product & order queries", href: `https://wa.me/${st.whatsapp}` },
    { Icon: Mail, t: "Email", d: st.email, href: `mailto:${st.email}` },
    { Icon: MapPin, t: "Showroom / Workshop", d: st.address, href: st.mapLink || undefined },
  ];
  return (
    <>
      <PageHero eyebrow="We're here to help" title="Get in Touch" sub="Questions about a product, delivery or a custom order? Send us a message and our team will reply within 24 hours." crumbs={[{ href: "/", label: "Home" }, { label: "Contact" }]} />
      <div className="container-site grid items-start gap-6 py-10 md:py-14 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-3">
          {cards.map(({ Icon, t, d, href }) => {
            const inner = (
              <>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-tint text-teak-dark"><Icon className="h-4 w-4" /></span>
                <span><b className="block text-[15px]">{t}</b><span className="text-[13px] text-muted">{d}</span></span>
              </>
            );
            return href ? <a key={t} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="card flex items-center gap-4 p-4 hover:border-teak">{inner}</a> : <div key={t} className="card flex items-center gap-4 p-4">{inner}</div>;
          })}
          <div className="rounded-2xl border border-[#EADFCB] bg-cream p-5">
            <p className="font-serif text-2xl font-semibold">Looking for a custom size?</p>
            <p className="mt-1 text-sm text-muted">Share your design and we&apos;ll craft it for you.</p>
            <Link href="/custom-order" className="btn-gold btn-sm mt-4">Start Custom Order <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
        <div className="card p-5 md:p-7">
          <h2 className="font-serif text-3xl font-semibold">Send us a message</h2>
          <div className="mt-5"><ContactForm /></div>
        </div>
      </div>
      {st.mapEmbedUrl && (
        <div className="container-site pb-14">
          <iframe src={st.mapEmbedUrl} className="h-80 w-full rounded-2xl border border-line" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Map" />
        </div>
      )}
    </>
  );
}
