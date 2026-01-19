# Export/Import Feature Guide

## What's New

Your PWA now has export/import functionality to sync books between devices!

## How It Works

### Exporting Books (Backup)

1. Tap the **hamburger menu** (☰) in the top-left corner
2. Tap **"Export Books"**
3. A JSON file downloads: `bookshelf-backup-YYYY-MM-DD.json`
4. Save this file to:
   - iCloud Drive
   - Email to yourself
   - AirDrop to another device
   - Any cloud storage

### Importing Books (Restore/Sync)

1. Tap the **hamburger menu** (☰)
2. Tap **"Import Books"**
3. Select your backup JSON file
4. Choose import mode:

   **Replace All Books** 🔄
   - Deletes all current books
   - Replaces with imported books
   - Use this to make devices identical

   **Merge with Current Books** ➕
   - Keeps existing books
   - Adds imported books
   - Use this to combine libraries from multiple devices

## Use Cases

### Sync Between iPhone and iPad

**On iPhone:**
1. Export books → `bookshelf-backup-2026-01-18.json`
2. Save to iCloud Drive

**On iPad:**
1. Open app in Safari
2. Import → Select file from iCloud Drive
3. Choose "Replace All" to match iPhone exactly

### Backup Before Clearing Browser

Before clearing Safari data:
1. Export books
2. Save file somewhere safe
3. After clearing, import to restore

### Share Library with Friend

1. Export your books
2. Send JSON file to friend
3. They import → "Merge" to add to their collection

### Switch Browsers

Moving from Safari to Chrome:
1. Export in Safari
2. Open app in Chrome
3. Import → "Replace All"

## File Format

The JSON file contains:
```json
{
  "books": [...],
  "exportDate": "2026-01-18T...",
  "totalBooks": 50,
  "version": "1.0"
}
```

All book data is included:
- Title, Author, ISBN
- Year Read, Publication Year
- Genre, Notes
- Cover image URLs
- Everything you entered

## Important Notes

- **Export is instant** - no server upload
- **Import is instant** - no server download
- **Files are small** - ~10KB per 100 books
- **Works offline** - both export and import
- **Data stays private** - files never leave your control

## Tips

1. **Regular Backups**: Export weekly if you add books often
2. **Naming**: The file auto-names with today's date
3. **Multiple Backups**: Keep multiple backup files (different dates)
4. **Test First**: Try import with "Merge" before "Replace All"
5. **Cloud Storage**: Save exports to iCloud/Dropbox for safety

## Troubleshooting

### "Invalid backup file" Error

- Make sure file is `.json` format
- Don't edit the file manually
- Re-export if file is corrupted

### Import Doesn't Work

- Check file isn't empty
- Try re-downloading the file
- Make sure you selected the correct file

### Books Duplicated

- Happened because you chose "Merge" when you meant "Replace All"
- Solution: Export again, then import with "Replace All"

## What Changed in Your App

- ☰ menu button replaced sort button in top-left
- Menu has 3 options: Sort Books, Export Books, Import Books
- New import confirmation modal with two merge options
- All your existing features still work exactly the same

## Deploy This Update

To push this feature to your live app:

1. Upload the updated files to GitHub:
   - `js/storage.js`
   - `js/app.js`
   - `index.html`
   - `css/styles.css`

2. Wait 1-2 minutes for GitHub Pages to rebuild

3. Force-refresh your app:
   - iPhone: Settings → Safari → Clear History
   - Or just close and reopen the app

The feature will be live!

---

**Total implementation time: 15 minutes** ✅

Enjoy seamless syncing between all your devices!
