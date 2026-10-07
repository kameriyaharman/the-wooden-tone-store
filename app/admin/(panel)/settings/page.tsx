import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { AdminHeader, Check, Field, Flash, Panel } from "@/components/admin/ui";
import { HomeSectionsEditor, ImageList, Submit } from "@/components/admin/inputs";
import { addAdmin, changePassword, saveSettingsAction } from "@/lib/admin-actions";
import { siteUrl } from "@/lib/order-token";

export const metadata = { title: "Settings" };

const TABS = [
  ["store", "Store & contact"],
  ["payments", "Payments"],
  ["shipping", "Shipping & COD"],
  ["home", "Homepage"],
  ["about", "About & images"],
  ["seo", "SEO"],
  ["account", "Admin account"],
] as const;

export default async function Settings({ searchParams }: { searchParams: Promise<{ tab?: string; saved?: string; err?: string }> }) {
  const sp = await searchParams;
  const tab = (TABS.find(([k]) => k === sp.tab)?.[0] || "store") as (typeof TABS)[number][0];
  const st = await getSettings();
  const mask = (v: string) => (v ? "••••••••" : "");
  const Form = ({ children, bools = "" }: { children: React.ReactNode; bools?: string }) => (
    <form action={saveSettingsAction} className="space-y-5">
      <input type="hidden" name="_section" value={tab} />
      <input type="hidden" name="_bools" value={bools} />
      {children}
      <Submit className="btn-gold">Save settings</Submit>
    </form>
  );
  const cats = tab === "home" ? await db.select({ slug: s.categories.slug, name: s.categories.name }).from(s.categories).orderBy(asc(s.categories.name)) : [];
  return (
    <>
      <AdminHeader title="Settings" />
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {TABS.map(([k, l]) => <Link key={k} href={`/admin/settings?tab=${k}`} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${tab === k ? "bg-ink text-white" : "bg-white ring-1 ring-line"}`}>{l}</Link>)}
      </div>
      <Flash show={sp.saved} error={sp.err} />
      <div className="max-w-3xl">
        {tab === "store" && (
          <Form>
            <Panel title="Store details">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Store name"><input name="storeName" defaultValue={st.storeName} className="input" /></Field>
                <Field label="Tagline (under logo)"><input name="tagline" defaultValue={st.tagline} className="input" /></Field>
                <Field label="Phone (shown on site)"><input name="phone" defaultValue={st.phone} className="input" /></Field>
                <Field label="WhatsApp number" hint="With country code, e.g. 919876543210"><input name="whatsapp" defaultValue={st.whatsapp} className="input" /></Field>
                <Field label="Email"><input name="email" type="email" defaultValue={st.email} className="input" /></Field>
                <Field label="Opening hours"><input name="hours" defaultValue={st.hours} className="input" /></Field>
                <Field label="Showroom / workshop address" className="md:col-span-2"><textarea name="address" rows={2} defaultValue={st.address} className="input" /></Field>
                <Field label="Google Maps link (for “Get directions”)" className="md:col-span-2"><input name="mapLink" defaultValue={st.mapLink} className="input" placeholder="https://maps.app.goo.gl/…" /></Field>
                <Field label="Google Maps embed URL (optional)" className="md:col-span-2" hint="Google Maps → Share → Embed a map → copy only the src=&quot;…&quot; URL"><input name="mapEmbedUrl" defaultValue={st.mapEmbedUrl} className="input" /></Field>
                <Field label="Footer about text" className="md:col-span-2"><textarea name="footerAbout" rows={2} defaultValue={st.footerAbout} className="input" /></Field>
              </div>
            </Panel>
            <Panel title="Social links">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Instagram"><input name="social_instagram" defaultValue={st.social?.instagram} className="input" /></Field>
                <Field label="Facebook"><input name="social_facebook" defaultValue={st.social?.facebook} className="input" /></Field>
                <Field label="X / Twitter"><input name="social_x" defaultValue={st.social?.x} className="input" /></Field>
                <Field label="LinkedIn"><input name="social_linkedin" defaultValue={st.social?.linkedin} className="input" /></Field>
                <Field label="Instagram handle (shown on home)"><input name="instagramHandle" defaultValue={st.instagramHandle} className="input" /></Field>
              </div>
            </Panel>
            <Panel title="Top announcement bar">
              <Field label="One message per line"><textarea name="announcements" rows={5} defaultValue={st.announcements.join("\n")} className="input" /></Field>
            </Panel>
          </Form>
        )}
        {tab === "payments" && (
          <Form bools="razorpayEnabled,phonepeEnabled,codEnabled">
            <Panel title="Razorpay — UPI, cards, netbanking, wallets (Paytm, PhonePe, GPay)">
              <p className="mb-4 text-sm text-muted">Get keys from Razorpay Dashboard → Account &amp; Settings → API Keys. Use <b>rzp_test_</b> keys to test, then switch to live keys.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2"><Check name="razorpayEnabled" label="Enable Razorpay at checkout" defaultChecked={st.razorpayEnabled} /></div>
                <Field label="Key ID"><input name="razorpayKeyId" defaultValue={st.razorpayKeyId} className="input font-mono" placeholder="rzp_live_…" /></Field>
                <Field label="Key Secret" hint="Leave as •••• to keep the saved secret"><input name="razorpayKeySecret" defaultValue={mask(st.razorpayKeySecret)} className="input font-mono" autoComplete="off" /></Field>
                <Field label="Webhook secret (recommended)" hint="Set the same secret when you add the webhook below"><input name="razorpayWebhookSecret" defaultValue={mask(st.razorpayWebhookSecret)} className="input font-mono" autoComplete="off" /></Field>
                <Field label="Webhook URL (add in Razorpay → Webhooks)" hint="Events: payment.captured, order.paid, payment.failed"><input readOnly value={`${siteUrl()}/api/payment/razorpay/webhook`} className="input bg-cream font-mono text-xs" /></Field>
              </div>
            </Panel>
            <Panel title="PhonePe Payment Gateway">
              <p className="mb-4 text-sm text-muted">From PhonePe Business Dashboard → Developer settings (Standard Checkout v2). Test with SANDBOX credentials first.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2"><Check name="phonepeEnabled" label="Enable PhonePe at checkout" defaultChecked={st.phonepeEnabled} /></div>
                <Field label="Client ID"><input name="phonepeClientId" defaultValue={st.phonepeClientId} className="input font-mono" /></Field>
                <Field label="Client Secret"><input name="phonepeClientSecret" defaultValue={mask(st.phonepeClientSecret)} className="input font-mono" autoComplete="off" /></Field>
                <Field label="Client Version"><input name="phonepeClientVersion" defaultValue={st.phonepeClientVersion} className="input" /></Field>
                <Field label="Environment"><select name="phonepeEnv" defaultValue={st.phonepeEnv} className="input"><option value="SANDBOX">Sandbox (testing)</option><option value="PRODUCTION">Production (live)</option></select></Field>
              </div>
            </Panel>
            <Panel title="Cash on Delivery">
              <Check name="codEnabled" label="Enable Cash on Delivery" defaultChecked={st.codEnabled} />
              <p className="mt-2 text-xs text-muted">COD fee and maximum order value are in “Shipping &amp; COD”.</p>
            </Panel>
          </Form>
        )}
        {tab === "shipping" && (
          <Form>
            <Panel title="Shipping">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Shipping fee (₹)" hint="0 = free shipping on every order"><input name="shippingFee" type="number" min={0} defaultValue={st.shippingFee} className="input" /></Field>
                <Field label="Free shipping above (₹)" hint="0 = not used"><input name="freeShippingAbove" type="number" min={0} defaultValue={st.freeShippingAbove} className="input" /></Field>
              </div>
            </Panel>
            <Panel title="Cash on Delivery limits">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="COD fee (₹)"><input name="codFee" type="number" min={0} defaultValue={st.codFee} className="input" /></Field>
                <Field label="Max order value for COD (₹)" hint="0 = no limit"><input name="codMaxOrder" type="number" min={0} defaultValue={st.codMaxOrder} className="input" /></Field>
              </div>
            </Panel>
          </Form>
        )}
        {tab === "home" && (
          <Form>
            <Panel title="Scrolling words under hero"><Field label="One per line"><textarea name="marquee" rows={5} defaultValue={st.marquee.join("\n")} className="input" /></Field></Panel>
            <Panel title="“Our story” section">
              <Field label="Heading"><input name="storyHeading" defaultValue={st.storyHeading} className="input" /></Field>
              <Field label="Text" className="mt-3"><textarea name="storyText" rows={4} defaultValue={st.storyText} className="input" /></Field>
            </Panel>
            <Panel title="Product rows on homepage" actions={<span className="text-xs text-muted">Pick which categories feed each row</span>}>
              <HomeSectionsEditor initial={st.homeSections} categories={cats} />
            </Panel>
            <Panel title="Instagram grid images" actions={<span className="text-xs text-muted">Up to 6. Empty = uses product photos</span>}>
              <ImageList name="instagramImages" initial={st.instagramImages} />
            </Panel>
            <p className="text-sm text-muted">Hero slides and promo tiles are managed in <Link href="/admin/banners" className="link-gold">Banners</Link>; categories on the homepage in <Link href="/admin/categories" className="link-gold">Categories</Link>; trending &amp; featured products from each product&apos;s Visibility settings; FAQ in <Link href="/admin/content" className="link-gold">FAQ &amp; Pages</Link>.</p>
          </Form>
        )}
        {tab === "about" && (
          <Form>
            <Panel title="About page">
              <Field label="Heading"><input name="aboutHeading" defaultValue={st.aboutHeading} className="input" /></Field>
              <Field label="Text" className="mt-3"><textarea name="aboutText" rows={6} defaultValue={st.aboutText} className="input" /></Field>
              <p className="label mt-4">About / Our story image</p>
              <ImageList name="aboutImage" single initial={[st.aboutImage]} />
            </Panel>
            <Panel title="Custom order page image"><ImageList name="customOrderImage" single initial={[st.customOrderImage]} /></Panel>
          </Form>
        )}
        {tab === "seo" && (
          <Form>
            <Panel title="Search engine listing">
              <Field label="Site title"><input name="seoTitle" defaultValue={st.seoTitle} className="input" /></Field>
              <Field label="Meta description" className="mt-3"><textarea name="seoDescription" rows={3} defaultValue={st.seoDescription} className="input" /></Field>
            </Panel>
          </Form>
        )}
        {tab === "account" && (
          <div className="space-y-5">
            <Panel title="Change your password">
              <form action={changePassword} className="grid gap-3 md:grid-cols-3 md:items-end">
                <Field label="Current password"><input name="current" type="password" required className="input" /></Field>
                <Field label="New password (8+ chars)"><input name="next" type="password" required minLength={8} className="input" /></Field>
                <Submit className="btn-gold">Update password</Submit>
              </form>
            </Panel>
            <Panel title="Add another admin">
              <form action={addAdmin} className="grid gap-3 md:grid-cols-4 md:items-end">
                <Field label="Name"><input name="name" className="input" /></Field>
                <Field label="Email"><input name="email" type="email" required className="input" /></Field>
                <Field label="Password (8+ chars)"><input name="password" type="password" required minLength={8} className="input" /></Field>
                <Submit className="btn-dark">Add admin</Submit>
              </form>
            </Panel>
          </div>
        )}
      </div>
    </>
  );
}
