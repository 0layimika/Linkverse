import { Resend } from "resend";
import { FRONTEND_URL, RESEND_API_KEY, FROM_EMAIL } from "../config/env";

const resend = new Resend(RESEND_API_KEY);

type OrderEmailItem = {
    title: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
};

export type OrderReceiptEmailData = {
    buyerEmail: string;
    buyerName: string | null;
    reference: string;
    currency: string;
    subtotal: number;
    platformFee: number;
    total: number;
    items: OrderEmailItem[];
    deliveryAddress?: Record<string, any> | null;
    createdAt?: string | null;
};

export type BuyerOrderStage = "confirmed" | "processing" | "delivered";

const palette = {
    canvas: "#F7F4EC",
    card: "#FFFFFF",
    ink: "#101010",
    muted: "#625F58",
    line: "#D7D1C5",
    blue: "#2F5BFF",
    lime: "#B7FF32",
    softBlue: "#EAF0FF",
    softLime: "#EEFFD0",
};

const escapeHtml = (value: unknown): string => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatMoney = (amount: number, currency = "NGN"): string => {
    const normalizedCurrency = String(currency || "NGN").toUpperCase();
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: normalizedCurrency,
        minimumFractionDigits: normalizedCurrency === "USD" ? 2 : 0,
        maximumFractionDigits: normalizedCurrency === "USD" ? 2 : 0,
    }).format(Number(amount) || 0);
};

const formatAddress = (address?: Record<string, any> | null): string => {
    if (!address) return "";
    const preferred = [address.address, address.line1, address.line2, address.city, address.state, address.country]
        .filter(Boolean)
        .map((value) => String(value).trim());
    if (preferred.length) return preferred.join(", ");
    return Object.values(address).filter((value) => typeof value === "string" || typeof value === "number").join(", ");
};

const button = (label: string, href: string): string => `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:28px 0 8px">
  <tr><td align="left">
    <a href="${escapeHtml(href)}" style="display:inline-block;background:${palette.blue};border:1px solid ${palette.ink};border-radius:12px;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:800;line-height:20px;padding:14px 22px;text-decoration:none;box-shadow:3px 3px 0 ${palette.ink}">${escapeHtml(label)}</a>
  </td></tr>
</table>`;

const emailLayout = ({
    preheader,
    eyebrow,
    title,
    content,
    accent = palette.lime,
}: {
    preheader: string;
    eyebrow: string;
    title: string;
    content: string;
    accent?: string;
}): string => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)}</title>
  <style>@media only screen and (max-width:620px){.email-wrap{padding:16px!important}.email-card{border-radius:18px!important}.email-pad{padding:26px 20px!important}.email-title{font-size:31px!important;line-height:34px!important}.receipt-pad{padding:18px!important}}</style>
</head>
<body style="margin:0;padding:0;background:${palette.canvas};color:${palette.ink};font-family:Arial,Helvetica,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:${palette.canvas}">
    <tr><td class="email-wrap" align="center" style="padding:36px 16px">
      <table class="email-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;max-width:620px;background:${palette.card};border:1px solid ${palette.ink};border-radius:24px;box-shadow:7px 7px 0 ${palette.ink};overflow:hidden">
        <tr><td style="background:${accent};border-bottom:1px solid ${palette.ink};padding:18px 28px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
            <td><span style="display:inline-block;background:${palette.ink};border-radius:9px;color:#FFFFFF;font-size:16px;font-weight:900;letter-spacing:-.3px;padding:8px 10px">L</span><span style="font-size:19px;font-weight:900;letter-spacing:-.7px;margin-left:9px;vertical-align:middle">LinkVerse</span></td>
            <td align="right"><span style="font-size:10px;font-weight:900;letter-spacing:1.6px;text-transform:uppercase">${escapeHtml(eyebrow)}</span></td>
          </tr></table>
        </td></tr>
        <tr><td class="email-pad" style="padding:38px 36px 34px">
          <h1 class="email-title" style="font-family:Arial Black,Arial,Helvetica,sans-serif;font-size:38px;line-height:41px;letter-spacing:-1.8px;margin:0 0 20px">${escapeHtml(title)}</h1>
          ${content}
        </td></tr>
        <tr><td style="border-top:1px solid ${palette.line};padding:20px 28px">
          <p style="color:${palette.muted};font-size:12px;line-height:18px;margin:0">LinkVerse · Your whole creator world, one link.</p>
          <p style="color:${palette.muted};font-size:11px;line-height:18px;margin:5px 0 0">© ${new Date().getFullYear()} LinkVerse</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const paragraph = (copy: string): string => `<p style="color:${palette.muted};font-size:16px;line-height:25px;margin:0 0 18px">${copy}</p>`;

const receiptBlock = (receipt: OrderReceiptEmailData): string => {
    const items = receipt.items.length ? receipt.items : [{ title: "Order", quantity: 1, unitPrice: receipt.subtotal, lineTotal: receipt.subtotal }];
    const itemRows = items.map((item) => `
      <tr>
        <td style="border-bottom:1px solid ${palette.line};padding:13px 0">
          <div style="font-size:14px;font-weight:800;line-height:20px">${escapeHtml(item.title)}</div>
          <div style="color:${palette.muted};font-size:12px;line-height:18px">${escapeHtml(item.quantity)} × ${escapeHtml(formatMoney(item.unitPrice, receipt.currency))}</div>
        </td>
        <td align="right" style="border-bottom:1px solid ${palette.line};font-size:14px;font-weight:800;padding:13px 0 13px 12px;white-space:nowrap">${escapeHtml(formatMoney(item.lineTotal, receipt.currency))}</td>
      </tr>`).join("");
    const address = formatAddress(receipt.deliveryAddress);
    const date = receipt.createdAt ? new Date(receipt.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "";

    return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;background:${palette.canvas};border:1px solid ${palette.ink};border-radius:18px;margin:26px 0;overflow:hidden">
  <tr><td class="receipt-pad" style="padding:22px 24px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
      <tr><td colspan="2" style="padding:0 0 13px"><span style="font-size:11px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase">Order receipt</span></td></tr>
      ${itemRows}
      <tr><td style="color:${palette.muted};font-size:13px;padding:14px 0 5px">Subtotal</td><td align="right" style="font-size:13px;padding:14px 0 5px">${escapeHtml(formatMoney(receipt.subtotal, receipt.currency))}</td></tr>
      <tr><td style="color:${palette.muted};font-size:13px;padding:5px 0">Platform fee</td><td align="right" style="font-size:13px;padding:5px 0">${escapeHtml(formatMoney(receipt.platformFee, receipt.currency))}</td></tr>
      <tr><td style="border-top:1px solid ${palette.ink};font-size:16px;font-weight:900;padding:14px 0 0">Total paid</td><td align="right" style="border-top:1px solid ${palette.ink};font-size:18px;font-weight:900;padding:14px 0 0">${escapeHtml(formatMoney(receipt.total, receipt.currency))}</td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#FFFFFF;border-top:1px solid ${palette.line};padding:17px 24px">
    <p style="color:${palette.muted};font-size:11px;font-weight:800;letter-spacing:1px;margin:0 0 5px;text-transform:uppercase">Reference</p>
    <p style="font-family:Courier New,monospace;font-size:12px;font-weight:700;line-height:18px;margin:0;overflow-wrap:anywhere">${escapeHtml(receipt.reference)}</p>
    ${date ? `<p style="color:${palette.muted};font-size:12px;line-height:18px;margin:9px 0 0">${escapeHtml(date)}</p>` : ""}
    ${address ? `<p style="color:${palette.muted};font-size:12px;line-height:18px;margin:9px 0 0"><strong style="color:${palette.ink}">Delivery:</strong> ${escapeHtml(address)}</p>` : ""}
  </td></tr>
</table>`;
};

export class MailService {
    private static async sendEmail(to: string | string[], subject: string, html: string): Promise<boolean> {
        try {
            const { error } = await resend.emails.send({ from: FROM_EMAIL, to: Array.isArray(to) ? to : [to], subject, html });
            if (error) {
                console.error("Failed to send email:", error);
                return false;
            }
            return true;
        } catch (error) {
            console.error("Error sending email:", error);
            return false;
        }
    }

    static async sendVerificationEmail(email: string, verificationLink: string): Promise<boolean> {
        const html = emailLayout({
            preheader: "Verify your email and finish setting up your LinkVerse.",
            eyebrow: "One tiny step",
            title: "Make it officially yours.",
            content: `${paragraph("Welcome to LinkVerse. Verify your email and you’ll be ready to shape your page, share your work and start building your corner of the internet.")}${button("Verify my email", verificationLink)}${paragraph("This link expires in 10 minutes. If you didn’t create this account, you can ignore this email.")}`,
        });
        return this.sendEmail(email, "Verify your LinkVerse email", html);
    }

    static async sendForgotPasswordEmail(email: string, resetLink: string): Promise<boolean> {
        const html = emailLayout({
            preheader: "Use this secure link to choose a new LinkVerse password.",
            eyebrow: "Password reset",
            title: "Let’s get you back in.",
            accent: palette.softBlue,
            content: `${paragraph("Someone asked to reset the password for this LinkVerse account. If that was you, choose a fresh password below.")}${button("Choose a new password", resetLink)}${paragraph("This link expires in 10 minutes. If you didn’t ask for it, nothing changes and you can safely ignore this email.")}`,
        });
        return this.sendEmail(email, "Reset your LinkVerse password", html);
    }

    static async sendTipNotificationEmail(
        creatorEmail: string,
        creatorName: string,
        amount: number,
        senderName: string,
        message?: string,
        currency = "NGN"
    ): Promise<boolean> {
        const money = formatMoney(amount, currency);
        const messageCard = message ? `<div style="background:${palette.softBlue};border:1px solid ${palette.ink};border-radius:14px;margin:20px 0;padding:18px"><p style="color:${palette.muted};font-size:11px;font-weight:900;letter-spacing:1.2px;margin:0 0 8px;text-transform:uppercase">A note from ${escapeHtml(senderName)}</p><p style="font-size:15px;font-style:italic;line-height:23px;margin:0">“${escapeHtml(message)}”</p></div>` : "";
        const html = emailLayout({
            preheader: `${senderName} sent you ${money}.`,
            eyebrow: "New support",
            title: `${money} just landed.`,
            content: `${paragraph(`Hey ${escapeHtml(creatorName)}, ${escapeHtml(senderName)} just supported what you make. That deserves a tiny happy dance.`)}${messageCard}${button("See my wallet", `${FRONTEND_URL}/dashboard/wallet`)}${paragraph("Keep going. Someone out there is paying attention.")}`,
        });
        return this.sendEmail(creatorEmail, `${money} from ${senderName} on LinkVerse`, html);
    }

    static async sendOrderConfirmationEmail(receipt: OrderReceiptEmailData): Promise<boolean> {
        const firstName = receipt.buyerName?.trim() || "there";
        const html = emailLayout({
            preheader: `Payment received for order ${receipt.reference}.`,
            eyebrow: "Payment received",
            title: "Your order is in.",
            content: `${paragraph(`Hi ${escapeHtml(firstName)}, payment went through and the creator now has your order. Here’s the exact receipt for your records.`)}${receiptBlock(receipt)}${button("View order", `${FRONTEND_URL}/order?reference=${encodeURIComponent(receipt.reference)}`)}${paragraph("We’ll email you as the creator confirms and fulfils your order.")}`,
        });
        return this.sendEmail(receipt.buyerEmail, `Payment received · ${receipt.reference}`, html);
    }

    static async sendCreatorOrderEmail(
        creatorEmail: string,
        creatorName: string,
        receipt: OrderReceiptEmailData,
        bookingSlot?: { start: string; end: string } | null
    ): Promise<boolean> {
        const booking = bookingSlot ? `<div style="background:${palette.softLime};border:1px solid ${palette.ink};border-radius:14px;margin:20px 0;padding:18px"><p style="font-size:11px;font-weight:900;letter-spacing:1.2px;margin:0 0 7px;text-transform:uppercase">Booking time</p><p style="font-size:14px;font-weight:800;line-height:22px;margin:0">${escapeHtml(bookingSlot.start)} — ${escapeHtml(bookingSlot.end)}</p></div>` : "";
        const html = emailLayout({
            preheader: `${receipt.buyerName || "A customer"} placed a new order.`,
            eyebrow: "New sale",
            title: "You made a sale.",
            content: `${paragraph(`Hey ${escapeHtml(creatorName)}, ${escapeHtml(receipt.buyerName || "a customer")} placed an order. Review the details, then confirm it when you’re ready to fulfil.`)}${receiptBlock(receipt)}${booking}${button("Open orders", `${FRONTEND_URL}/dashboard/store`)}${paragraph(`Buyer contact: ${escapeHtml(receipt.buyerEmail)}`)}`,
        });
        return this.sendEmail(creatorEmail, `New order · ${receipt.reference}`, html);
    }

    static async sendOrderStatusEmail(receipt: OrderReceiptEmailData, stage: BuyerOrderStage): Promise<boolean> {
        const copy: Record<BuyerOrderStage, { eyebrow: string; title: string; message: string; subject: string; accent: string }> = {
            confirmed: {
                eyebrow: "Order confirmed",
                title: "The creator said yes.",
                message: "Your order has been reviewed and confirmed. It’s now lined up for fulfilment.",
                subject: `Order confirmed · ${receipt.reference}`,
                accent: palette.lime,
            },
            processing: {
                eyebrow: "In progress",
                title: "Your order is being prepared.",
                message: "The creator is now working on your order. We’ll let you know when it reaches the final stage.",
                subject: `Order in progress · ${receipt.reference}`,
                accent: palette.softBlue,
            },
            delivered: {
                eyebrow: "Delivered",
                title: "It made it to you.",
                message: "Your order has been marked as delivered. Keep this receipt handy in case you need to reference the order later.",
                subject: `Order delivered · ${receipt.reference}`,
                accent: palette.lime,
            },
        };
        const stageCopy = copy[stage];
        const html = emailLayout({
            preheader: stageCopy.message,
            eyebrow: stageCopy.eyebrow,
            title: stageCopy.title,
            accent: stageCopy.accent,
            content: `${paragraph(`Hi ${escapeHtml(receipt.buyerName?.trim() || "there")}, ${stageCopy.message}`)}${receiptBlock(receipt)}${button("View order", `${FRONTEND_URL}/order?reference=${encodeURIComponent(receipt.reference)}`)}`,
        });
        return this.sendEmail(receipt.buyerEmail, stageCopy.subject, html);
    }

    static previewGallery(): string {
        const receipt: OrderReceiptEmailData = {
            buyerEmail: "amara@example.com",
            buyerName: "Amara Okafor",
            reference: "store_demo_20260809_001",
            currency: "USD",
            subtotal: 42,
            platformFee: 1.05,
            total: 43.05,
            items: [
                { title: "The soft life guide", quantity: 1, unitPrice: 25, lineTotal: 25 },
                { title: "LinkVerse creator tee", quantity: 1, unitPrice: 17, lineTotal: 17 },
            ],
            deliveryAddress: { address: "14 Palm Street", city: "Lagos", country: "Nigeria" },
            createdAt: new Date().toISOString(),
        };
        const templates = [
            ["Verify email", emailLayout({ preheader: "Verify your email and finish setting up your LinkVerse.", eyebrow: "One tiny step", title: "Make it officially yours.", content: `${paragraph("Welcome to LinkVerse. Verify your email and you’ll be ready to shape your page, share your work and start building your corner of the internet.")}${button("Verify my email", "https://example.com/verify/demo")}${paragraph("This link expires in 10 minutes. If you didn’t create this account, you can ignore this email.")}` })],
            ["Reset password", emailLayout({ preheader: "Use this secure link to choose a new LinkVerse password.", eyebrow: "Password reset", title: "Let’s get you back in.", accent: palette.softBlue, content: `${paragraph("Someone asked to reset the password for this LinkVerse account. If that was you, choose a fresh password below.")}${button("Choose a new password", "https://example.com/reset/demo")}${paragraph("This link expires in 10 minutes. If you didn’t ask for it, nothing changes and you can safely ignore this email.")}` })],
            ["Support received", emailLayout({ preheader: "Ola sent you $5.00.", eyebrow: "New support", title: "$5.00 just landed.", content: `${paragraph("Hey Ola, Amara just supported what you make. That deserves a tiny happy dance.")}${`<div style="background:${palette.softBlue};border:1px solid ${palette.ink};border-radius:14px;margin:20px 0;padding:18px"><p style="color:${palette.muted};font-size:11px;font-weight:900;letter-spacing:1.2px;margin:0 0 8px;text-transform:uppercase">A note from Amara</p><p style="font-size:15px;font-style:italic;line-height:23px;margin:0">“Keep making the good stuff.”</p></div>`}${button("See my wallet", `${FRONTEND_URL}/dashboard/wallet`)}${paragraph("Keep going. Someone out there is paying attention.")}` })],
            ["Buyer · payment received", emailLayout({ preheader: "Payment received for your order.", eyebrow: "Payment received", title: "Your order is in.", content: `${paragraph("Hi Amara, payment went through and the creator now has your order. Here’s the exact receipt for your records.")}${receiptBlock(receipt)}${button("View order", `${FRONTEND_URL}/order?reference=${receipt.reference}`)}${paragraph("We’ll email you as the creator confirms and fulfils your order.")}` })],
            ["Creator · new sale", emailLayout({ preheader: "A customer placed a new order.", eyebrow: "New sale", title: "You made a sale.", content: `${paragraph("Hey Ola, Amara placed an order. Review the details, then confirm it when you’re ready to fulfil.")}${receiptBlock(receipt)}${button("Open orders", `${FRONTEND_URL}/dashboard/store`)}${paragraph(`Buyer contact: ${receipt.buyerEmail}`)}` })],
            ...(["confirmed", "processing", "delivered"] as const).map((stage) => {
                const copy = {
                    confirmed: { eyebrow: "Order confirmed", title: "The creator said yes.", message: "Your order has been reviewed and confirmed. It’s now lined up for fulfilment.", accent: palette.lime },
                    processing: { eyebrow: "In progress", title: "Your order is being prepared.", message: "The creator is now working on your order. We’ll let you know when it reaches the final stage.", accent: palette.softBlue },
                    delivered: { eyebrow: "Delivered", title: "It made it to you.", message: "Your order has been marked as delivered. Keep this receipt handy in case you need to reference the order later.", accent: palette.lime },
                }[stage];
                return [`Buyer · ${stage}`, emailLayout({ preheader: copy.message, eyebrow: copy.eyebrow, title: copy.title, accent: copy.accent, content: `${paragraph(`Hi Amara, ${copy.message}`)}${receiptBlock(receipt)}${button("View order", `${FRONTEND_URL}/order?reference=${receipt.reference}`)}` })];
            }),
        ];
        const cards = templates.map(([label, html]) => `<section><h2>${escapeHtml(label)}</h2><iframe title="${escapeHtml(label)}" srcdoc="${escapeHtml(html)}"></iframe></section>`).join("");
        return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LinkVerse email previews</title><style>body{margin:0;background:#e9e4d9;color:#101010;font-family:Arial,Helvetica,sans-serif}header{padding:32px max(20px,calc((100% - 1320px)/2));background:#b7ff32;border-bottom:1px solid #101010}header h1{font:900 36px/1 Arial Black,Arial;margin:0;letter-spacing:-1.8px}header p{margin:9px 0 0;color:#625f58;font-weight:700}main{max-width:1320px;margin:0 auto;padding:26px 20px 60px;display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:26px}section{background:#fff;border:1px solid #101010;border-radius:20px;box-shadow:6px 6px 0 #101010;overflow:hidden}h2{font-size:15px;margin:0;padding:16px 18px;border-bottom:1px solid #d7d1c5}iframe{display:block;width:100%;height:790px;border:0;background:#f7f4ec}@media(max-width:520px){main{display:block;padding:16px 12px 36px}section{margin-bottom:22px}iframe{height:760px}}</style></head><body><header><h1>LinkVerse email previews</h1><p>Live-rendered from the same templates used by Resend. Nothing was sent.</p></header><main>${cards}</main></body></html>`;
    }
}
