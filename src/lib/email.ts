import nodemailer, { type Transporter } from 'nodemailer';
import { SITE_URL } from './site';

/**
 * Transactional emails — ported as-is from the old backend (same templates,
 * same subjects) so customers see no difference.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Transporter ──────────────────────────────────────────────────────────────
let transporter: Transporter | undefined;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
};

// ── Design tokens (light mode only) ─────────────────────────────────────────
const C = {
  bg:          "#f9f9fb",
  card:        "#ffffff",
  purple:      "#7c3aff",
  purpleLight: "#ede9fe",
  text:        "#111827",
  textSub:     "#374151",
  textMuted:   "#6b7280",
  border:      "#e5e7eb",
  borderLight: "#f3f4f6",
  green:       "#16a34a",
  greenBg:     "#dcfce7",
  amber:       "#d97706",
  amberBg:     "#fef3c7",
  blue:        "#2563eb",
  blueBg:      "#dbeafe",
  violet:      "#7c3aed",
  violetBg:    "#ede9fe",
  red:         "#dc2626",
  redBg:       "#fee2e2",
};

const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  pending:    { text: C.amber,  bg: C.amberBg  },
  processing: { text: C.blue,   bg: C.blueBg   },
  shipped:    { text: C.violet, bg: C.violetBg },
  delivered:  { text: C.green,  bg: C.greenBg  },
  cancelled:  { text: C.red,    bg: C.redBg    },
};

const STATUS_ICONS: Record<string, string> = {
  pending:    "⏳",
  processing: "⚙️",
  shipped:    "🚚",
  delivered:  "✅",
  cancelled:  "❌",
};

// ── Core send helper ─────────────────────────────────────────────────────────
const sendMail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    // No SMTP configured (local development): print instead of sending so OTP codes are still usable.
    console.log(`[EMAIL:not-configured] "${subject}" → ${to}`);
    return;
  }
  try {
    const info = await getTransporter().sendMail({
      from: `"Level Up TN" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL] ✓ "${subject}" → ${to} (${info.messageId})`);
    return info;
  } catch (err) {
    console.error(`[EMAIL] ✗ Failed "${subject}" → ${to}:`, (err as Error).message);
  }
};

// ── Shared wrapper ───────────────────────────────────────────────────────────
const wrap = ({ preheader = "", body }: { preheader?: string; body: string }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <title>Level Up TN</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-font-smoothing:antialiased;">

  <!-- Preheader (invisible preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${C.bg};">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:40px 16px 60px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;">

        <!-- ── Header bar ── -->
        <tr><td style="padding-bottom:28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <!-- Logo mark -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;vertical-align:middle;">
                  <tr>
                    <td style="width:10px;height:10px;background:${C.purple};transform:rotate(45deg);"></td>
                    <td style="width:6px;"></td>
                    <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:800;letter-spacing:5px;color:${C.text};">
                      LEVEL<span style="color:${C.purple};">UP</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td align="right" style="font-family:monospace;font-size:10px;letter-spacing:2px;color:${C.textMuted};vertical-align:middle;">
                PRECISION AUDIO
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- ── Card ── -->
        <tr><td style="background:${C.card};border:1px solid ${C.border};border-radius:8px;overflow:hidden;">

          <!-- Purple top accent -->
          <div style="height:4px;background:linear-gradient(90deg,${C.purple},#a78bfa);"></div>

          <!-- Card body -->
          <div style="padding:40px 40px 36px;">
            ${body}
          </div>

        </td></tr>

        <!-- ── Footer ── -->
        <tr><td style="padding-top:28px;text-align:center;">
          <p style="margin:0 0 6px;font-family:monospace;font-size:11px;letter-spacing:2px;color:${C.textMuted};">
            © ${new Date().getFullYear()} LEVELUP · Precision Audio. Elevated.
          </p>
          <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:${C.textMuted};line-height:1.5;">
            You received this email because of activity on your Level Up TN account.<br/>
            If you didn't expect it, you can safely ignore this message.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const h1 = (text: string) =>
  `<h1 style="margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:26px;font-weight:800;letter-spacing:-0.5px;color:${C.text};">${text}</h1>`;

const subtitle = (text: string) =>
  `<p style="margin:0 0 32px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:${C.textMuted};line-height:1.6;">${text}</p>`;

const divider = () =>
  `<hr style="border:none;border-top:1px solid ${C.border};margin:24px 0;"/>`;

const ctaButton = (label: string, href: string) =>
  `<a href="${href}" style="display:inline-block;background:${C.purple};color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-decoration:none;padding:14px 32px;border-radius:6px;margin-top:4px;">${label} →</a>`;

const infoRow = (label: string, value: unknown) =>
  `<tr>
    <td style="padding:10px 0;font-family:monospace;font-size:11px;letter-spacing:1px;color:${C.textMuted};border-bottom:1px solid ${C.borderLight};white-space:nowrap;padding-right:20px;">${label}</td>
    <td style="padding:10px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.textSub};border-bottom:1px solid ${C.borderLight};text-align:right;">${value}</td>
  </tr>`;

const statusPill = (status: string) => {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return `<span style="display:inline-block;background:${s.bg};color:${s.text};font-family:monospace;font-size:11px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:100px;">${STATUS_ICONS[status] || ""} ${status.toUpperCase()}</span>`;
};

const itemRows = (items: any[]) =>
  items.map((item) => {
    const imgCell = item.variantImage
      ? `<td style="padding:10px 12px 10px 0;border-bottom:1px solid ${C.borderLight};width:52px;vertical-align:middle;">
           <img src="${item.variantImage}" alt="${item.productName}" width="44" height="44"
             style="width:44px;height:44px;object-fit:cover;border-radius:4px;border:1px solid ${C.border};display:block;" />
         </td>`
      : `<td style="padding:10px 12px 10px 0;border-bottom:1px solid ${C.borderLight};width:52px;vertical-align:middle;">
           <div style="width:44px;height:44px;border-radius:4px;border:1px solid ${C.border};background:${C.borderLight};display:flex;align-items:center;justify-content:center;font-size:18px;">🎧</div>
         </td>`;
    return `<tr>
      ${imgCell}
      <td style="padding:10px 0;border-bottom:1px solid ${C.borderLight};vertical-align:middle;">
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:${C.text};">${item.productName}</div>
        <div style="font-family:monospace;font-size:11px;color:${C.textMuted};margin-top:2px;">${item.variantName}</div>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid ${C.borderLight};text-align:right;font-family:monospace;font-size:12px;color:${C.textMuted};white-space:nowrap;vertical-align:middle;">× ${item.quantity}</td>
    </tr>`;
  }).join("");

const noteBox = (icon: string, text: string, bg = C.purpleLight, color = C.purple) =>
  `<div style="background:${bg};border-radius:6px;padding:14px 18px;margin:24px 0;">
    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${color};line-height:1.6;">${icon} ${text}</p>
  </div>`;


// ════════════════════════════════════════════════════════════════════════════
// 1. OTP — email verification
// ════════════════════════════════════════════════════════════════════════════
export const sendOtpEmail = async ({ to, name, otp }: any) => {
  const html = wrap({
    preheader: `Your Level Up TN verification code is ${otp}`,
    body: `
      ${h1("Verify your email")}
      ${subtitle(`Hey ${name || "there"} — enter this code to finish creating your account.`)}

      <!-- OTP box -->
      <div style="background:${C.purpleLight};border:2px dashed #c4b5fd;border-radius:8px;padding:32px 20px;text-align:center;margin-bottom:28px;">
        <div style="font-family:monospace;font-size:48px;font-weight:800;letter-spacing:16px;color:${C.purple};line-height:1;">${otp}</div>
        <p style="margin:12px 0 0;font-family:monospace;font-size:11px;letter-spacing:3px;color:#7c3aed;">EXPIRES IN 10 MINUTES</p>
      </div>

      ${noteBox("🔒", "Never share this code with anyone. Level Up TN will never ask for it.")}

      <p style="margin:16px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:${C.textMuted};">
        If you didn't request this, you can safely ignore this email. No account will be created.
      </p>
    `,
  });

  return sendMail({ to, subject: `${otp} is your Level Up TN verification code`, html });
};


// ════════════════════════════════════════════════════════════════════════════
// 2. Welcome — after account creation
// ════════════════════════════════════════════════════════════════════════════
export const sendWelcomeEmail = async ({ to, name, isGoogle = false }: any) => {
  const CLIENT_URL = SITE_URL;

  const html = wrap({
    preheader: `Welcome to Level Up TN, ${name || "audiophile"}! Your account is ready.`,
    body: `
      <!-- Hero -->
      <div style="background:${C.purpleLight};border-radius:8px;padding:28px 24px;margin-bottom:32px;text-align:center;">
        <div style="font-size:40px;margin-bottom:12px;">🎧</div>
        <h2 style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:22px;font-weight:800;color:${C.purple};">Welcome aboard, ${name || "audiophile"}!</h2>
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#6d28d9;">Your account is live and ready.</p>
      </div>

      ${h1("You're all set")}
      ${subtitle(`Your Level Up TN account was created${isGoogle ? " via Google" : ""} successfully. Here's what you can do next.`)}

      <!-- What's next checklist -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${[
          ["🛍️", "Browse our lineup of studio-grade IEMs"],
          ["🛒", "Add items to your cart and checkout securely"],
          ["📦", "Track every order from your account dashboard"],
          ["🔔", "Get notified when out-of-stock items return"],
        ].map(([icon, text]) =>
          `<tr><td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.textSub};">
            <span style="margin-right:10px;">${icon}</span>${text}
          </td></tr>`
        ).join("")}
      </table>

      ${divider()}

      <!-- Account info -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${infoRow("EMAIL", to)}
        ${infoRow("PROVIDER", isGoogle ? "Google" : "Email / Password")}
      </table>

      ${ctaButton("BROWSE THE SHOP", `${CLIENT_URL}/shop`)}
    `,
  });

  return sendMail({ to, subject: `Welcome to Level Up TN, ${name || "audiophile"}! 🎧`, html });
};


// ════════════════════════════════════════════════════════════════════════════
// 3. Order confirmation
// ════════════════════════════════════════════════════════════════════════════
export const sendOrderConfirmationEmail = async ({ to, name, order }: any) => {
  const orderId    = order.id.toString().slice(0, 8).toUpperCase();
  const CLIENT_URL = SITE_URL;

  const html = wrap({
    preheader: `Order #${orderId} confirmed! We've received your order and are getting it ready.`,
    body: `
      <!-- Status hero -->
      <div style="background:${C.amberBg};border-radius:8px;padding:20px 24px;margin-bottom:28px;display:flex;align-items:center;">
        <div style="font-size:32px;margin-right:16px;">📬</div>
        <div>
          <div style="font-family:monospace;font-size:11px;letter-spacing:2px;color:${C.amber};margin-bottom:4px;">ORDER CONFIRMED</div>
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.textSub};">
            Order <strong>#${orderId}</strong> has been received and is pending processing.
          </div>
        </div>
      </div>

      ${h1("Thank you for your order!")}
      ${subtitle(`Hi ${name || order.customer?.fullname || "there"}, we've got your order and will have it packed soon.`)}

      <!-- Status pill -->
      <div style="margin-bottom:24px;">${statusPill("pending")}</div>

      <!-- Items table -->
      <p style="margin:0 0 8px;font-family:monospace;font-size:10px;letter-spacing:3px;color:${C.textMuted};">ORDER ITEMS</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
        ${itemRows(order.items)}
      </table>

      <!-- Total -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="padding-top:14px;font-family:monospace;font-size:11px;letter-spacing:2px;color:${C.textMuted};">TOTAL</td>
          <td style="padding-top:14px;text-align:right;font-family:'Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:800;color:${C.purple};">
            ${order.totalAmount} TND
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Delivery info -->
      <p style="margin:0 0 10px;font-family:monospace;font-size:10px;letter-spacing:3px;color:${C.textMuted};">DELIVERY INFO</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${infoRow("NAME", order.customer?.fullname)}
        ${infoRow("ADDRESS", order.customer?.address)}
        ${infoRow("PHONE", order.customer?.phone)}
      </table>

      ${ctaButton("TRACK YOUR ORDER", `${CLIENT_URL}/orders/${order.id}`)}
    `,
  });

  return sendMail({ to, subject: `Order #${orderId} confirmed ✓ — Level Up TN`, html });
};


// ════════════════════════════════════════════════════════════════════════════
// 4. Order status update
// ════════════════════════════════════════════════════════════════════════════
export const sendOrderStatusEmail = async ({ to, name, order, oldStatus }: any) => {
  const orderId    = order.id.toString().slice(0, 8).toUpperCase();
  const CLIENT_URL = SITE_URL;
  const sc         = STATUS_COLORS[order.status] || STATUS_COLORS.pending;

  const statusMessages: Record<string, string> = {
    processing: "Great news! We've started processing your order and will have it packed and ready to ship soon.",
    shipped:    "Your order is on its way! Our courier has picked it up and it should arrive within a few days.",
    delivered:  "Your order has been delivered. We hope you love it — enjoy the sound! 🎧",
    cancelled:  "Your order has been cancelled. If you have any questions, please reach out to our support team.",
  };

  const html = wrap({
    preheader: `Your order #${orderId} status updated: ${oldStatus} → ${order.status}`,
    body: `
      <!-- Status hero -->
      <div style="background:${sc.bg};border-radius:8px;padding:20px 24px;margin-bottom:28px;">
        <div style="font-size:32px;margin-bottom:8px;">${STATUS_ICONS[order.status] || "📦"}</div>
        <div style="font-family:monospace;font-size:11px;letter-spacing:2px;color:${sc.text};margin-bottom:4px;">ORDER UPDATE</div>
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.textSub};">
          Your order <strong>#${orderId}</strong> status has changed.
        </div>
      </div>

      ${h1("Your order was updated")}
      ${subtitle(`Hi ${name || order.customer?.fullname || "there"}, here's what changed on your order.`)}

      <!-- Status change visual -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="font-family:monospace;font-size:12px;letter-spacing:1px;color:${C.textMuted};text-decoration:line-through;padding-right:12px;">
            ${oldStatus?.toUpperCase()}
          </td>
          <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:18px;color:${C.textMuted};padding-right:12px;">→</td>
          <td>${statusPill(order.status)}</td>
        </tr>
      </table>

      <!-- Status message -->
      ${noteBox(STATUS_ICONS[order.status] || "📦", statusMessages[order.status] || `Your order status is now: ${order.status}.`, sc.bg, sc.text)}

      <!-- Items summary -->
      <p style="margin:0 0 8px;font-family:monospace;font-size:10px;letter-spacing:3px;color:${C.textMuted};">YOUR ORDER</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
        ${itemRows(order.items)}
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="padding-top:14px;font-family:monospace;font-size:11px;letter-spacing:2px;color:${C.textMuted};">TOTAL</td>
          <td style="padding-top:14px;text-align:right;font-family:'Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:800;color:${C.purple};">
            ${order.totalAmount} TND
          </td>
        </tr>
      </table>

      ${ctaButton("VIEW ORDER", `${CLIENT_URL}/orders/${order.id}`)}
    `,
  });

  return sendMail({ to, subject: `Your order #${orderId} is now ${order.status} ${STATUS_ICONS[order.status] || ""} — Level Up TN`, html });
};


// ════════════════════════════════════════════════════════════════════════════
// 5. Back-in-stock notification
// ════════════════════════════════════════════════════════════════════════════
export const sendRestockEmail = async ({ to, name, productName, variantTitle, productPath }: any) => {
  const CLIENT_URL = SITE_URL;
  const pathSeg = productPath || "";

  const html = wrap({
    preheader: `${productName} is back in stock — grab it before it sells out again!`,
    body: `
      <!-- Hero -->
      <div style="background:${C.greenBg};border-radius:8px;padding:24px;text-align:center;margin-bottom:28px;">
        <div style="font-size:36px;margin-bottom:8px;">🟢</div>
        <div style="font-family:monospace;font-size:11px;letter-spacing:3px;color:${C.green};margin-bottom:6px;">BACK IN STOCK</div>
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:800;color:${C.text};">${productName}</div>
        ${variantTitle ? `<div style="font-family:monospace;font-size:12px;color:${C.textMuted};margin-top:4px;">${variantTitle}</div>` : ""}
      </div>

      ${h1("Good news!")}
      ${subtitle(`Hi ${name || "there"} — something you were watching just came back in stock.`)}

      <!-- Product card -->
      <div style="background:${C.borderLight};border:1px solid ${C.border};border-radius:8px;padding:20px 24px;margin-bottom:24px;">
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:${C.text};margin-bottom:4px;">${productName}</div>
        ${variantTitle ? `<div style="font-family:monospace;font-size:12px;color:${C.textMuted};">${variantTitle}</div>` : ""}
      </div>

      ${noteBox("⚡", "Stock is limited — we can't guarantee how long it'll last.", C.amberBg, C.amber)}

      ${ctaButton("SHOP NOW", `${CLIENT_URL}/product/${pathSeg}`)}
    `,
  });

  return sendMail({ to, subject: `${productName} is back in stock! 🟢 — Level Up TN`, html });
};


// ════════════════════════════════════════════════════════════════════════════
// 6. Guest order OTP — verify email ownership before confirming order
// ════════════════════════════════════════════════════════════════════════════
export const sendOrderOtpEmail = async ({ to, name, otp, orderItems, totalAmount }: any) => {
  const itemsHtml = itemRows(orderItems || []);

  const html = wrap({
    preheader: `Your verification code is ${otp} — confirm your Level Up TN order`,
    body: `
      ${h1("Confirm your order")}
      ${subtitle(`Hi ${name || "there"} — enter this code on the checkout page to confirm your order.`)}

      <!-- OTP box -->
      <div style="background:${C.purpleLight};border:2px dashed #c4b5fd;border-radius:8px;padding:28px 20px;text-align:center;margin-bottom:28px;">
        <div style="font-family:monospace;font-size:48px;font-weight:800;letter-spacing:16px;color:${C.purple};line-height:1;">${otp}</div>
        <p style="margin:12px 0 0;font-family:monospace;font-size:11px;letter-spacing:3px;color:#7c3aed;">EXPIRES IN 10 MINUTES</p>
      </div>

      <!-- Order preview -->
      <p style="margin:0 0 8px;font-family:monospace;font-size:10px;letter-spacing:3px;color:${C.textMuted};">YOUR ORDER</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
        ${itemsHtml}
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="padding-top:12px;font-family:monospace;font-size:11px;letter-spacing:2px;color:${C.textMuted};">TOTAL</td>
          <td style="padding-top:12px;text-align:right;font-family:'Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:800;color:${C.purple};">${totalAmount} TND</td>
        </tr>
      </table>

      ${noteBox("🔒", "Never share this code with anyone. If you didn't place this order, you can safely ignore this email.")}
    `,
  });

  return sendMail({ to, subject: `${otp} — Confirm your Level Up TN order`, html });
};


// ════════════════════════════════════════════════════════════════════════════
// 7. Review request — sent when order status → shipped
// ════════════════════════════════════════════════════════════════════════════
export const sendReviewRequestEmail = async ({ to, name, productName, reviewUrl, isLoggedIn = false }: any) => {
  const heroText   = isLoggedIn
    ? "Your order has been delivered!"
    : "Your order is on its way!";
  const bodyText   = isLoggedIn
    ? `Hi ${name || "there"} — your ${productName || "order"} has been delivered. We'd love to hear what you think!`
    : `Hi ${name || "there"} — your order is on its way! Once your ${productName || "gear"} arrives, we'd love to hear what you think.`;
  const ctaLabel   = isLoggedIn ? "GO TO MY ORDERS" : "LEAVE A REVIEW";
  const footerNote = isLoggedIn
    ? `You'll find a "Leave Review" button next to your order on the My Orders page.`
    : "Your review link is unique to this item and can only be used once.";

  const html = wrap({
    preheader: `How was your ${productName} experience? Leave a quick review — it only takes a minute.`,
    body: `
      <div style="background:${C.purpleLight};border-radius:8px;padding:24px;text-align:center;margin-bottom:28px;">
        <div style="font-size:36px;margin-bottom:10px;">⭐</div>
        <h2 style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:800;color:${C.purple};">${heroText}</h2>
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#6d28d9;">Your feedback helps other audiophiles choose the right gear.</p>
      </div>

      ${h1("Share your thoughts")}
      ${subtitle(bodyText)}

      ${productName ? `<div style="background:${C.borderLight};border:1px solid ${C.border};border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-family:monospace;font-size:10px;letter-spacing:2px;color:${C.textMuted};margin-bottom:6px;">PRODUCT</p>
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:${C.text};">${productName}</p>
      </div>` : ""}

      <div style="text-align:center;margin:24px 0;font-size:28px;letter-spacing:6px;">⭐⭐⭐⭐⭐</div>

      ${noteBox("💡", footerNote, C.purpleLight, C.purple)}

      ${ctaButton(ctaLabel, reviewUrl)}

      <p style="margin:16px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:${C.textMuted};">
        If you didn't receive this order, please ignore this email.
      </p>
    `,
  });

  return sendMail({ to, subject: `How was your ${productName || "Level Up TN"} experience? ⭐`, html });
};


// ════════════════════════════════════════════════════════════════════════════
// 8. Admin — new order placed notification
// ════════════════════════════════════════════════════════════════════════════
export const sendAdminNewOrderEmail = async ({ to, order }: any) => {
  const orderId = order.id.toString().slice(0, 8).toUpperCase();
  const CLIENT_URL = SITE_URL;

  const html = wrap({
    preheader: `New order #${orderId} — ${order.customer?.fullname} just placed an order`,
    body: `
      <div style="background:${C.purpleLight};border-radius:8px;padding:16px 20px;margin-bottom:28px;display:flex;align-items:center;gap:14px;">
        <div style="font-size:28px;">🛍️</div>
        <div>
          <div style="font-family:monospace;font-size:10px;letter-spacing:3px;color:${C.purple};margin-bottom:4px;">NEW ORDER</div>
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:${C.text};">Order #${orderId} just came in</div>
        </div>
      </div>

      ${h1("New order received")}
      ${subtitle(`A customer just placed an order on Level Up TN.`)}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        ${infoRow("ORDER ID",  `#${orderId}`)}
        ${infoRow("CUSTOMER",  order.customer?.fullname || "—")}
        ${infoRow("EMAIL",     order.customer?.email    || "—")}
        ${infoRow("PHONE",     order.customer?.phone    || "—")}
        ${infoRow("TOTAL",     `${order.totalAmount} TND`)}
        ${infoRow("ITEMS",     `${order.items?.length || 0} item(s)`)}
      </table>

      <p style="margin:0 0 8px;font-family:monospace;font-size:10px;letter-spacing:3px;color:${C.textMuted};">ORDER ITEMS</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${itemRows(order.items || [])}
      </table>

      ${ctaButton("VIEW IN ADMIN", `${CLIENT_URL}/admin`)}
    `,
  });

  return sendMail({ to, subject: `🛍️ New Order #${orderId} — ${order.customer?.fullname}`, html });
};

// ════════════════════════════════════════════════════════════════════════════
// 9. Admin — new review submitted notification
// ════════════════════════════════════════════════════════════════════════════
export const sendAdminNewReviewEmail = async ({ to, review }: any) => {
  const CLIENT_URL = SITE_URL;
  const stars = "★".repeat(review.rating || 0) + "☆".repeat(5 - (review.rating || 0));
  const displayName = review.showName !== false && review.name ? review.name : "Anonymous";

  const html = wrap({
    preheader: `New ${review.rating}★ review from ${displayName} — needs moderation`,
    body: `
      <div style="background:${C.purpleLight};border-radius:8px;padding:16px 20px;margin-bottom:28px;display:flex;align-items:center;gap:14px;">
        <div style="font-size:28px;">⭐</div>
        <div>
          <div style="font-family:monospace;font-size:10px;letter-spacing:3px;color:${C.purple};margin-bottom:4px;">NEW REVIEW</div>
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:${C.text};">
            ${stars} from ${displayName}
          </div>
        </div>
      </div>

      ${h1("A review needs approval")}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        ${infoRow("REVIEWER",    displayName)}
        ${infoRow("RATING",      `${review.rating}/5 ${stars}`)}
        ${infoRow("PRODUCT",     review.productName || "—")}
        ${infoRow("SOURCE",      review.source || "website")}
      </table>

      <p style="margin:0 0 8px;font-family:monospace;font-size:10px;letter-spacing:3px;color:${C.textMuted};">REVIEW COMMENT</p>
      <div style="background:${C.borderLight};border:1px solid ${C.border};border-radius:8px;padding:16px 20px;margin-bottom:28px;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.textSub};line-height:1.7;font-style:italic;">
          "${review.comment}"
        </p>
      </div>

      ${ctaButton("MODERATE IN ADMIN", `${CLIENT_URL}/admin`)}
    `,
  });

  return sendMail({ to, subject: `⭐ New ${review.rating}★ review from ${displayName} — awaiting approval`, html });
};


// ════════════════════════════════════════════════════════════════════════════
// 10. Marketing / New Drop email
// ════════════════════════════════════════════════════════════════════════════
export const sendMarketingEmail = async ({ to, name, subject, headline, body, ctaLabel, ctaUrl, productImageUrl }: any) => {
  const CLIENT_URL = SITE_URL;

  const html = wrap({
    preheader: headline || subject,
    body: `
      ${productImageUrl ? `
        <div style="border-radius:8px;overflow:hidden;margin-bottom:28px;text-align:center;background:${C.borderLight};">
          <img src="${productImageUrl}" alt="${headline}" width="100%"
            style="max-height:280px;object-fit:cover;display:block;width:100%;" />
        </div>` : ''}

      ${h1(headline || subject)}
      ${subtitle(`Hi ${name || 'there'} — here's what's new at Level Up TN.`)}

      <div style="background:${C.borderLight};border-left:4px solid ${C.purple};border-radius:0 6px 6px 0;padding:16px 20px;margin-bottom:28px;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:${C.textSub};line-height:1.7;white-space:pre-line;">${body || ''}</p>
      </div>

      ${ctaButton(ctaLabel || 'SHOP NOW', ctaUrl || `${CLIENT_URL}/shop`)}

      <p style="margin:20px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:${C.textMuted};">
        You're receiving this because you've shopped with us or have an account at Level Up TN.
      </p>
    `,
  });

  return sendMail({ to, subject, html });
};


// ════════════════════════════════════════════════════════════════════════════
// 11. Password changed — security alert
// ════════════════════════════════════════════════════════════════════════════
export const sendPasswordChangedEmail = async ({ to, name }: any) => {
  const html = wrap({
    preheader: "Your Level Up TN password was just changed. If this wasn't you, act now.",
    body: `
      <div style="background:${C.amberBg};border-radius:8px;padding:20px 24px;margin-bottom:28px;display:flex;align-items:center;gap:14px;">
        <div style="font-size:28px;">🔐</div>
        <div>
          <div style="font-family:monospace;font-size:10px;letter-spacing:3px;color:${C.amber};margin-bottom:4px;">SECURITY ALERT</div>
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:${C.text};">Your password was changed</div>
        </div>
      </div>

      ${h1("Password updated")}
      ${subtitle(`Hi ${name || "there"} — your Level Up TN account password was just changed successfully.`)}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        ${infoRow("ACCOUNT", to)}
        ${infoRow("TIME", new Date().toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Tunis" }))}
      </table>

      <div style="background:${C.redBg};border-radius:6px;padding:14px 18px;margin-bottom:28px;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.red};line-height:1.6;">
          ⚠️ <strong>Wasn't you?</strong> Your account may be compromised. Contact us immediately and change your password.
        </p>
      </div>

      ${ctaButton("GO TO MY ACCOUNT", `${SITE_URL}/profile`)}
    `,
  });

  return sendMail({ to, subject: "Your Level Up TN password was changed 🔐", html });
};

// ════════════════════════════════════════════════════════════════════════════
// 12. Forgot password — reset link
// ════════════════════════════════════════════════════════════════════════════
export const sendPasswordResetEmail = async ({ to, name, resetUrl }: any) => {
  const html = wrap({
    preheader: "Reset your Level Up TN password — this link expires in 30 minutes.",
    body: `
      ${h1("Reset your password")}
      ${subtitle(`Hi ${name || "there"} — we received a request to reset your Level Up TN account password.`)}

      <div style="background:${C.purpleLight};border:2px dashed #c4b5fd;border-radius:8px;padding:28px 20px;text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 16px;font-family:monospace;font-size:11px;letter-spacing:3px;color:${C.purple};">PASSWORD RESET LINK</p>
        ${ctaButton("RESET MY PASSWORD", resetUrl)}
        <p style="margin:14px 0 0;font-family:monospace;font-size:10px;letter-spacing:2px;color:#7c3aed;">EXPIRES IN 30 MINUTES</p>
      </div>

      ${noteBox("🔒", "If you didn't request this, you can safely ignore this email. Your password won't change.")}

      <p style="margin:16px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:${C.textMuted};">
        For security, this link can only be used once.
      </p>
    `,
  });

  // No SMTP (local development): the link is the whole point of this email, so print it.
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) console.log(`[EMAIL:not-configured] reset link → ${resetUrl}`);
  return sendMail({ to, subject: "Reset your Level Up TN password", html });
};


// ════════════════════════════════════════════════════════════════════════════
// 13. Admin — new contact message notification
// ════════════════════════════════════════════════════════════════════════════
export const sendAdminContactEmail = async ({ to, contact }: any) => {
  const CLIENT_URL = SITE_URL;
  const html = wrap({
    preheader: `New contact message from ${contact.name} — ${contact.message.substring(0, 60)}…`,
    body: `
      <div style="background:${C.purpleLight};border-radius:8px;padding:16px 20px;margin-bottom:28px;display:flex;align-items:center;gap:14px;">
        <div style="font-size:28px;">✉️</div>
        <div>
          <div style="font-family:monospace;font-size:10px;letter-spacing:3px;color:${C.purple};margin-bottom:4px;">NEW CONTACT MESSAGE</div>
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:${C.text};">From ${contact.name}</div>
        </div>
      </div>

      ${h1("New message received")}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        ${infoRow("FROM",  contact.name)}
        ${infoRow("EMAIL", contact.email)}
        ${infoRow("DATE",  new Date(contact.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Tunis" }))}
      </table>

      <p style="margin:0 0 8px;font-family:monospace;font-size:10px;letter-spacing:3px;color:${C.textMuted};">MESSAGE</p>
      <div style="background:${C.borderLight};border-left:4px solid ${C.purple};border-radius:0 6px 6px 0;padding:16px 20px;margin-bottom:28px;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.textSub};line-height:1.7;white-space:pre-line;">${contact.message}</p>
      </div>

      <a href="mailto:${contact.email}" style="display:inline-block;background:${C.purple};color:#ffffff;font-family:monospace;font-size:11px;letter-spacing:3px;padding:14px 28px;text-decoration:none;border-radius:3px;margin-bottom:20px;">
        REPLY TO ${contact.name.toUpperCase()}
      </a>
    `,
  });
  return sendMail({ to, subject: `✉️ New message from ${contact.name} — Level Up TN`, html });
};


// ════════════════════════════════════════════════════════════════════════════
// 14. Newsletter subscriber OTP verification
// ════════════════════════════════════════════════════════════════════════════
export const sendSubscriberOtpEmail = async ({ to, otp }: any) => {
  const html = wrap({
    preheader: `Your Level Up TN newsletter verification code is ${otp}`,
    body: `
      ${h1("Confirm your subscription")}
      ${subtitle("Enter this code in the footer to start receiving our exclusive drops and deals.")}

      <!-- OTP box -->
      <div style="background:${C.purpleLight};border:2px dashed #c4b5fd;border-radius:8px;padding:32px 20px;text-align:center;margin-bottom:28px;">
        <div style="font-family:monospace;font-size:48px;font-weight:800;letter-spacing:16px;color:${C.purple};line-height:1;">${otp}</div>
        <p style="margin:12px 0 0;font-family:monospace;font-size:11px;letter-spacing:3px;color:#7c3aed;">EXPIRES IN 5 MINUTES</p>
      </div>

      ${noteBox("🎧", "Stay ahead of every drop — new IEMs, exclusive deals, and audiophile news delivered straight to your inbox.")}

      <p style="margin:16px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:${C.textMuted};">
        If you didn't request this, you can safely ignore this email. You won't be subscribed.
      </p>
    `,
  });

  return sendMail({ to, subject: `${otp} — Confirm your Level Up TN newsletter subscription`, html });
};
