/**
 * fix_icons_and_notification.js
 * 
 * Fixes:
 *  1. App launcher icon layout - regenerates proper adaptive icon foreground/background
 *     for all mipmap densities so the logo is fully visible and nicely padded.
 *  2. Notification icon - generates a properly sized white-on-transparent monochrome
 *     icon for each drawable density bucket.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const RES = 'c:/Metysara-proud/android/app/src/main/res';

// ─── 1. LAUNCHER ICON SIZES ──────────────────────────────────────────────────
//   foreground canvas size for each density (standard mipmap sizes)
const mipmapSizes = {
  'mipmap-ldpi':    36,
  'mipmap-mdpi':    48,
  'mipmap-hdpi':    72,
  'mipmap-xhdpi':   96,
  'mipmap-xxhdpi':  144,
  'mipmap-xxxhdpi': 192,
};

// ─── 2. NOTIFICATION ICON SIZES ──────────────────────────────────────────────
//   Android status-bar icon sizes
const drawableSizes = {
  'drawable-ldpi':    18,
  'drawable-mdpi':    24,
  'drawable-hdpi':    36,
  'drawable-xhdpi':   48,
  'drawable-xxhdpi':  72,
  'drawable-xxxhdpi': 96,
  'drawable':         24,   // fallback bucket
};

// Source images
const LOGO_PNG        = 'c:/Metysara-proud/assets/icon.png';          // full logo (white bg)
const NOTIF_ICON_PNG  = 'c:/Metysara-proud/android/app/src/main/res/drawable/ic_stat_notification.png'; // existing white-on-transparent icon

(async () => {
  try {
    // ─── PART 1: LAUNCHER ICONS ───────────────────────────────────────────────
    console.log('\n=== Regenerating Launcher Icons ===');

    for (const [density, iconSize] of Object.entries(mipmapSizes)) {
      const dir = path.join(RES, density);
      if (!fs.existsSync(dir)) {
        console.log(`  Skipping ${density} (directory not found)`);
        continue;
      }

      // ── Foreground: logo centred with 12% padding inside the icon canvas ──
      // Android adaptive icon safe zone = 66.7% of the 108dp canvas
      // We use padding=16% on each side so logo occupies 68% of the canvas → safe zone friendly
      const padding = Math.round(iconSize * 0.16);
      const logoSize = iconSize - padding * 2;

      const logoResized = await sharp(LOGO_PNG)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .toBuffer();

      const foreground = await sharp({
        create: {
          width: iconSize,
          height: iconSize,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 0 }, // transparent
        },
      })
        .composite([{ input: logoResized, gravity: 'center' }])
        .png()
        .toBuffer();

      // ── Background: solid white ──
      const background = await sharp({
        create: {
          width: iconSize,
          height: iconSize,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 255 },
        },
      })
        .png()
        .toBuffer();

      // ── Legacy flat icon (foreground composited on white) ──
      const legacy = await sharp({
        create: {
          width: iconSize,
          height: iconSize,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 255 },
        },
      })
        .composite([{ input: logoResized, gravity: 'center' }])
        .png()
        .toBuffer();

      await sharp(foreground).toFile(path.join(dir, 'ic_launcher_foreground.png'));
      await sharp(background).toFile(path.join(dir, 'ic_launcher_background.png'));
      await sharp(legacy).toFile(path.join(dir, 'ic_launcher.png'));
      await sharp(legacy).toFile(path.join(dir, 'ic_launcher_round.png'));

      console.log(`  ✓ ${density} (${iconSize}px)`);
    }

    // ─── Fix the adaptive icon XML – remove double inset on foreground ────────
    // The foreground image already has padding baked in; only the background
    // needs the 0% inset. We'll keep it simple: no inset at all on either layer.
    const ADAPTIVE_XML = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;

    const ADAPTIVE_XML_ROUND = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;

    const xmlDir = path.join(RES, 'mipmap-anydpi-v26');
    fs.writeFileSync(path.join(xmlDir, 'ic_launcher.xml'), ADAPTIVE_XML);
    fs.writeFileSync(path.join(xmlDir, 'ic_launcher_round.xml'), ADAPTIVE_XML_ROUND);
    console.log('\n  ✓ Updated mipmap-anydpi-v26/ic_launcher.xml (removed double inset)');

    // ─── PART 2: NOTIFICATION ICONS ──────────────────────────────────────────
    console.log('\n=== Regenerating Notification Icons ===');

    // Check if the source notification icon exists
    if (!fs.existsSync(NOTIF_ICON_PNG)) {
      console.error('  ✗ Source notification icon not found:', NOTIF_ICON_PNG);
      process.exit(1);
    }

    for (const [density, size] of Object.entries(drawableSizes)) {
      const dir = path.join(RES, density);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Resize the white-on-transparent icon, maintain transparency
      await sharp(NOTIF_ICON_PNG)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(path.join(dir, 'ic_stat_notification.png'));

      console.log(`  ✓ ${density} (${size}px)`);
    }

    console.log('\n✅ All icons regenerated successfully!');
    console.log('\nNext steps:');
    console.log('  1. Run: npx cap sync android');
    console.log('  2. Rebuild the APK: cd android && .\\gradlew assembleDebug');
  } catch (err) {
    console.error('\n✗ Error:', err.message);
    console.error(err.stack);
  }
})();
