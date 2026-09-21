import { code128, drawingSVG } from "@bwip-js/react-native";
import * as Print from "expo-print";
import { Platform } from "react-native";

const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

export async function printProductBarcode(name: string, barcode: string) {
  const svg = code128({
    bcid: "code128",
    text: barcode,
    scale: 3,
    height: 16,
    includetext: false,
  }, drawingSVG());

  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
      @page { margin: 18mm; }
      body { font-family: Arial, sans-serif; text-align: center; }
      svg { display: block; width: 100%; height: auto; }
      p { font-size: 16px; overflow-wrap: anywhere; }
    </style></head><body><h2>${escapeHtml(name)}</h2>${svg}<p>${escapeHtml(barcode)}</p></body></html>`;

  if (Platform.OS === "web") {
    const printWindow = window.open("", "_blank");
    if (!printWindow) throw new Error("The browser blocked the print window.");
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    return;
  }

  await Print.printAsync({ html });
}
