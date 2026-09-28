# StockPilot User Guide

StockPilot helps you keep track of the items in each of your stores. This guide uses plain language and the same names you see in the app.

## Start here

The first time you open StockPilot:

1. Enter the name you want StockPilot to use for you on this device.
2. Read and accept the Terms and Privacy notice, then select **Get Started**.
3. Create your first store. Enter its name, choose its type and currency, then fill in any other details you need. Address fields are optional.
4. Create a 4–6 digit PIN when prompted. You will use it to unlock the app later.

Remember the PIN. StockPilot cannot show it back to you.

## The basic idea

- **Store** — a separate place or branch. Each store has its own catalog, quantities, and stock history.
- **Catalog** — the list of items you sell, use, or keep in the selected store.
- **Inventory** — the current quantity of those items and the record of every stock change.
- **Stock In** — items came in, such as a supplier delivery or return.
- **Stock Out** — items left, such as a sale, damage, expiry, or internal use.
- **Set Current Stock** — corrects the quantity after a physical count.
- **SKU** — an optional short code you use to identify an item.

Always check the store name near the top of the screen before adding items or changing stock.

## Your daily routine

1. Open **Home** to see the total items in the selected store, low-stock items, critical items, and recent activity.
2. Open **Catalog** to add or update item details.
3. Open **Inventory** to record deliveries, sales, counts, and other stock changes.
4. Open **Insights** to review trends and items that need attention.

StockPilot marks an item as:

- **Critical** when its quantity is zero.
- **Low** when its quantity is at or below its reorder level.
- **Healthy** when it is above its reorder level.

## Add an item

1. Open **Catalog**.
2. Select **Add Item**.
3. Enter the **Item Name**, choose a **Category**, and enter the **Initial Quantity**.
4. Add a barcode, SKU, price, reorder level, critical level, or notes if useful.
5. Select **Save Item**.

The initial quantity is added to the item's stock history. Later quantity changes belong in **Inventory**, not in the item form.

### Scan a barcode or QR code

You can select the round **Camera** button in the bottom navigation, or select **Scan** while adding an item. Allow camera access when asked, then place the code inside the frame.

If StockPilot finds one active item with that code, it opens that item's details. If it cannot find a match, it opens a new item form with the scanned code filled in.

## Change stock

1. Open **Inventory** and select an item.
2. Select **Adjust Stock**.
3. Choose one of these options:
   - **Stock In** for incoming items.
   - **Stock Out** for items that left the store.
   - **Set Current Stock** after a physical count.
4. Enter the quantity, choose a reason, and add a reference or note if needed.
5. Check the preview, then select the confirmation button.

StockPilot will not let stock go below zero. Every successful change is saved in the item's stock history. If a past movement was wrong, make a correcting adjustment instead of trying to edit the old record.

## Find items and review history

In **Catalog** or **Inventory**, use search to find an item by name, SKU, or barcode. Use filters to show healthy, low, critical, category-specific, or zero-stock items. Sort when you need a different order.

To see a full record of changes:

1. Open **Inventory**.
2. Select the three-dot **Inventory Actions** menu.
3. Select **Stock Movement History**.

You can search that list and filter it by Stock In, Stock Out, Adjustments, and time period. Select a movement to see its quantity before and after, reason, reference, and notes.

## Archive or restore an item

Use archive for an item you no longer need in the active catalog.

1. In **Catalog**, open the item.
2. Select **Archive Item** and confirm.

Archiving keeps the item's stock history, but you cannot adjust its stock while it is archived. To bring it back, open **Archived Items** in Catalog and select **Restore**.

## Work with more than one store

Select the store name near the top of Home, Catalog, Inventory, or Insights to switch stores. Select **Add store** from that selector to create another one.

Stores are separate. Adding an item or changing a quantity in one store does not change another store.

For store details, open **More** > **Settings**. There you can change the current store, edit its name, type, currency, and address, or manage stock defaults.

> **Warning:** **Delete Store** permanently deletes that store and its inventory. Create and save a backup first if you might need the data again.

## Import or export inventory

Use **More** > **Import Inventory** or **Export Inventory**. The same options are also available from **Inventory Actions**.

### Export

Choose **Export Inventory** to save the selected store's inventory as a CSV file. Use an exported file as the easiest template for a later import.

### Import

1. Choose a `.csv` file.
2. Review the import preview carefully.
3. Select **Import to Store** only when the destination store and quantities are correct.

The CSV must include at least `name` and `quantity` columns. StockPilot matches existing items by SKU, barcode, or item name when neither code is supplied. Matching items receive the imported quantity; missing items are added to the selected store's Catalog. Existing item details are kept, and every quantity change is recorded in stock history.

Make a backup before a large import.

## Use Insights

Open **Insights** and choose a reporting period. The screen has three sections:

- **Overview** shows current inventory health, stock movement, items to review, and category activity.
- **Trends** shows recent movement and stock-health history.
- **Reports** lets you generate a report, save it on this device, or export the selected period as CSV.

Restock suggestions are estimates based on the Stock Out movements you recorded. Use them as a prompt to review your real stock and supplier needs.

## Back up and restore your data

StockPilot stores its data locally on this device. Create regular backups, especially before changing devices, removing the app, clearing app or browser data, restoring a backup, or importing a large file.

To create a backup:

1. Open **More** > **Settings** > **Backup & Restore**.
2. Select **Create Backup**.
3. Select **Save to Device**. You can also use **Share File** when it is available.
4. Keep the saved `.spbackup` file somewhere safe, such as secure cloud storage or another device.

To restore:

1. Open **Backup & Restore**.
2. Select **Choose Backup File**.
3. Review the backup's date, store count, product count, and movement count.
4. Select **Restore Backup** only if it is the correct file.

> **Warning:** Restoring a backup may replace your current StockPilot data. Make and save a new backup before restoring.

## Change settings and protect the app

Open **More** > **Settings** to:

- Change your displayed name.
- Edit store details, currency, and address.
- Set the default reorder level and unit for new items. These defaults do not change existing items.
- Choose Light, Dark, or System appearance.
- Create or change your 4–6 digit PIN.
- Check storage use and open help, privacy, and terms pages.

Your PIN is required when reopening StockPilot or after selecting **Exit**.

## If something does not look right

- Check that you are in the correct store.
- Search the Catalog and **Archived Items** before adding a duplicate item.
- Open the item's **Stock History** or **Stock Movement History** to see what changed.
- Use **Set Current Stock** after a count if the displayed quantity is incorrect.
- Create a backup before making a large correction.
- If using StockPilot in a web browser, keep it open in one tab at a time.

For day-to-day help, the safest habit is simple: select the right store, record each stock change when it happens, and save regular backups.
