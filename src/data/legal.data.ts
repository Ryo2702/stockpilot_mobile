export type LegalPage = "terms" | "privacy" | "faq" | "rules";

export type LegalSection = {
  heading: string;
  body: string;
};

export const legalPages: Record<LegalPage, {
  title: string;
  intro: string;
  sections: LegalSection[];
}> = {
  terms: {
    title: "Terms & Conditions",
    intro: "By using StockPilot, you agree to use the app responsibly and to keep your store information accurate.",
    sections: [
      {
        heading: "Your account and device",
        body: "StockPilot is designed for local use on your device. Keep your device, PIN, and exported backup files secure.",
      },
      {
        heading: "Your data",
        body: "You are responsible for the accuracy of inventory counts and for keeping backups of information you need to retain.",
      },
      {
        heading: "Acceptable use",
        body: "Do not use StockPilot to misuse another person's data, bypass security, or interfere with the app or its data.",
      },
      {
        heading: "Important records",
        body: "StockPilot is an inventory tool. Review its records before using them for accounting, tax, legal, or business decisions.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: "StockPilot is local-first: your store, catalog, inventory, and settings stay on this device unless you choose to export or share them.",
    sections: [
      {
        heading: "What is stored",
        body: "The app stores your store setup, inventory records, preferences, and local security PIN on the device.",
      },
      {
        heading: "Files and permissions",
        body: "Camera access is used for barcode scanning. File access is used only when you import, export, save, or restore data.",
      },
      {
        heading: "Sharing",
        body: "Backups and exports leave the device only when you explicitly save or share them using your device's tools.",
      },
      {
        heading: "Deleting data",
        body: "Deleting local records, backups, or the app may permanently remove data. Keep a backup before changing devices or deleting data.",
      },
    ],
  },
  faq: {
    title: "FAQ",
    intro: "Quick answers to common StockPilot questions.",
    sections: [
      {
        heading: "Where is my data?",
        body: "Your operational data is stored locally on this device. It is not automatically uploaded to a StockPilot account.",
      },
      {
        heading: "Can I manage more than one store?",
        body: "Yes. Use Manage Stores to create, edit, switch, or archive stores. Each store keeps its inventory separate.",
      },
      {
        heading: "How do I protect the app?",
        body: "Create a 4–6 digit PIN in Security. You will need it after reopening StockPilot or using Exit.",
      },
      {
        heading: "How do I move my data?",
        body: "Use Backup & Restore to create a local backup, then save or share that file and restore it on the other device.",
      },
    ],
  },
  rules: {
    title: "Rules",
    intro: "These are the core rules StockPilot applies to keep inventory records consistent.",
    sections: [
      {
        heading: "Store separation",
        body: "Products, quantities, movements, and insights belong to the selected store and must not cross into another store.",
      },
      {
        heading: "No negative stock",
        body: "Stock cannot be reduced below zero. Stock-out actions are rejected when the selected store does not have enough quantity.",
      },
      {
        heading: "Movement history",
        body: "Stock changes record the change, the quantity before and after, and the reason so the inventory history remains traceable.",
      },
      {
        heading: "Reports are derived",
        body: "Health cards, insights, and summaries are derived from catalog and inventory records. They are not the source of truth for quantities.",
      },
    ],
  },
};

export const onboardingLegalNotice =
  "By continuing, you agree to the Terms & Conditions and Privacy Policy.";
