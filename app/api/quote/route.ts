import { NextResponse } from "next/server";
import { quote, CheckoutError, type CartLineInput } from "@/lib/orders";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { items?: CartLineInput[]; coupon?: string; method?: string };
  const session = await getSession();
  try {
    const q = await quote(body.items || [], { coupon: body.coupon, method: body.method, loggedIn: !!session });
    return NextResponse.json({
      ok: true,
      lines: q.lines.map((l) => ({ productId: l.productId, price: l.price, mrp: l.mrp, stock: l.stock, finish: l.finish, size: l.size })),
      subtotal: q.subtotal, mrpTotal: q.mrpTotal, couponCode: q.couponCode, couponDiscount: q.couponDiscount,
      shipping: q.shipping, codFee: q.codFee, total: q.total,
    });
  } catch (e) {
    const msg = e instanceof CheckoutError ? e.message : "Something went wrong. Please try again.";
    if (!(e instanceof CheckoutError)) console.error(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
