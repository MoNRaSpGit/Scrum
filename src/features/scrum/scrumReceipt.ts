import type { ClientBilling } from "./scrum.types";
import { formatCurrency, formatDate } from "./scrum.utils";

// Recibo de pago por WhatsApp (11/11/2026, pedido explicito): una imagen con
// el logo de Logic Lab, el nombre del cliente, lo que pago y la fecha. Se
// dibuja en un canvas y se manda con "Compartir" del celular (WhatsApp);
// si el dispositivo no puede compartir archivos, se descarga la imagen y se
// abre WhatsApp con el texto.

const WIDTH = 1080;
const HEIGHT = 1500;
const GOLD = "#e0b422";
const INK = "#0f172a";
const MUTED = "#64748b";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar el logo."));
    image.src = src;
  });
}

function todayLabel() {
  return new Intl.DateTimeFormat("es-UY", { timeZone: "America/Montevideo", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
}

function conceptLabel(client: ClientBilling) {
  return client.frequency === "semiannual" ? "Servicio (pago semestral)" : "Servicio mensual";
}

export function receiptText(client: ClientBilling) {
  return `Recibo de pago · Logic Lab\nCliente: ${client.name}\nImporte pagado: ${formatCurrency(client.amount)}\nFecha: ${todayLabel()}\nGracias por confiar en Logic Lab.`;
}

export async function drawReceipt(client: ClientBilling): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Este navegador no puede dibujar el recibo.");

  // Fondo y cabecera negra con el logo (se recorta el simbolo y el nombre
  // de la imagen vertical del logo).
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, WIDTH, 430);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 430, WIDTH, 10);
  const logo = await loadImage(`${import.meta.env.BASE_URL}logiclab-logo.png`);
  const sx = 170;
  const sy = 570;
  const sw = 740;
  const sh = 770;
  const drawHeight = 380;
  const drawWidth = (sw / sh) * drawHeight;
  ctx.drawImage(logo, sx, sy, sw, sh, (WIDTH - drawWidth) / 2, 25, drawWidth, drawHeight);

  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  ctx.font = "800 64px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText("Recibo de pago", WIDTH / 2, 560);

  // Sello "pago recibido"
  ctx.strokeStyle = "#15803d";
  ctx.lineWidth = 6;
  ctx.fillStyle = "#15803d";
  const stampWidth = 380;
  const stampX = (WIDTH - stampWidth) / 2;
  ctx.beginPath();
  ctx.roundRect(stampX, 600, stampWidth, 70, 35);
  ctx.stroke();
  ctx.font = "800 36px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText("PAGO RECIBIDO", WIDTH / 2, 648);

  // Datos
  const rows: [string, string][] = [
    ["Cliente", client.name],
    ["Concepto", conceptLabel(client)],
    ["Fecha de pago", todayLabel()],
    ["Próximo vencimiento", formatDate(client.nextPaymentAt)]
  ];
  ctx.textAlign = "left";
  let y = 780;
  for (const [label, value] of rows) {
    ctx.fillStyle = MUTED;
    ctx.font = "600 32px system-ui, -apple-system, 'Segoe UI', sans-serif";
    ctx.fillText(label, 90, y);
    ctx.fillStyle = INK;
    ctx.font = "700 40px system-ui, -apple-system, 'Segoe UI', sans-serif";
    ctx.fillText(value.length > 28 ? `${value.slice(0, 27)}…` : value, 90, y + 52);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, y + 82);
    ctx.lineTo(WIDTH - 90, y + 82);
    ctx.stroke();
    y += 130;
  }

  // Importe
  ctx.textAlign = "center";
  ctx.fillStyle = MUTED;
  ctx.font = "600 32px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText("Importe pagado", WIDTH / 2, 1350);
  ctx.fillStyle = INK;
  ctx.font = "800 84px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText(formatCurrency(client.amount), WIDTH / 2, 1440);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, HEIGHT - 14, WIDTH, 14);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo armar la imagen."))), "image/png");
  });
}

export type ReceiptResult = "shared" | "downloaded";

export async function shareReceipt(client: ClientBilling): Promise<ReceiptResult> {
  const blob = await drawReceipt(client);
  const fileName = `recibo-${client.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cliente"}.png`;
  const file = new File([blob], fileName, { type: "image/png" });
  const text = receiptText(client);

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return "shared";
    } catch (error) {
      // Cerrar el menu de compartir no es un error.
      if (error instanceof DOMException && error.name === "AbortError") return "shared";
    }
  }

  // Sin compartir archivos (PC): se baja la imagen y se abre WhatsApp con
  // el texto; la imagen se adjunta a mano.
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  window.open(`https://wa.me/${client.whatsapp ?? ""}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  return "downloaded";
}
