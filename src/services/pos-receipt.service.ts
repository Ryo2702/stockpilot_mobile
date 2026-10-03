import { Platform } from "react-native";
import * as Print from "expo-print";
import { Directory, File, Paths } from "expo-file-system";

import { formatCurrency } from "@/domain/currency";
import type { PosTransaction } from "@/domain/pos";
import { colors } from "@/theme/tokens";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export function buildPosReceiptHtml(transaction: PosTransaction) {
  const date = new Date(transaction.createdAt).toLocaleString();
  const rows = transaction.items.map((item) => `
    <tr>
      <td>${escapeHtml(item.productName)}${item.sku ? `<small>${escapeHtml(item.sku)}</small>` : ""}</td>
      <td>${item.quantity}</td>
      <td>${escapeHtml(formatCurrency(item.lineTotal, transaction.currency))}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        @page { margin: 24px; }
        body { font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: ${colors.text.primary}; }
        h1, h2, p { margin: 0 0 8px; }
        h1 { font-size: 22px; }
        h2 { font-size: 16px; font-weight: 600; }
        p, td, th { font-size: 12px; }
        .muted { color: ${colors.text.secondary}; }
        .rule { border-top: 1px solid ${colors.border.subtle}; margin: 16px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 7px 0; text-align: left; border-bottom: 1px solid ${colors.border.subtle}; }
        th:nth-child(2), td:nth-child(2), th:last-child, td:last-child { text-align: right; }
        small { display: block; color: ${colors.text.secondary}; }
        .total { font-size: 16px; font-weight: 700; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(transaction.businessName)}</h1>
      <h2>${escapeHtml(transaction.storeName)}</h2>
      ${transaction.storeAddress ? `<p class="muted">${escapeHtml(transaction.storeAddress)}</p>` : ""}
      <div class="rule"></div>
      <p><strong>Receipt:</strong> ${escapeHtml(transaction.receiptNumber)}</p>
      <p class="muted">${escapeHtml(date)}</p>
      <div class="rule"></div>
      <table>
        <thead><tr><th>Product</th><th>Qty</th><th>Amount</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="rule"></div>
      <p><strong>Subtotal</strong><span style="float:right">${escapeHtml(formatCurrency(transaction.subtotal, transaction.currency))}</span></p>
      <p class="total">Total<span style="float:right">${escapeHtml(formatCurrency(transaction.total, transaction.currency))}</span></p>
      <div class="rule"></div>
      <p style="text-align:center">Thank you for shopping with us.</p>
    </body>
  </html>`;
}

function printPosReceiptOnWeb(html: string) {
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) throw new Error("The receipt print window was blocked.");

  const print = () => {
    printWindow.focus();
    printWindow.print();
  };
  printWindow.addEventListener("load", print, { once: true });
  printWindow.onafterprint = () => printWindow.close();
  printWindow.document.write(html);
  printWindow.document.close();
}

export async function createPosReceiptPdf(transaction: PosTransaction) {
  const html = buildPosReceiptHtml(transaction);
  if (Platform.OS === "web") {
    printPosReceiptOnWeb(html);
    return null;
  }

  const { uri: temporaryUri } = await Print.printToFileAsync({ html });
  const safeReceiptNumber = transaction.receiptNumber.replace(/[^a-z0-9_-]/gi, "-");
  const fileName = `receipt-${safeReceiptNumber}.pdf`;

  const directory = new Directory(Paths.document, "StockPilot");
  directory.create({ intermediates: true, idempotent: true });
  const target = new File(directory, fileName);
  await new File(temporaryUri).copy(target, { overwrite: true });
  return target.uri;
}
