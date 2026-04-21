import sharp from 'sharp';
import fs from 'fs';

(async () => {
    try {
        const inputPath = 'C:\\Users\\DELL G15\\.gemini\\antigravity\\brain\\4d98fbfa-4f1c-4ec0-81e0-5518ba68a6a9\\media__1774720718961.png';
        const iconPath = 'c:\\Metysara-proud\\assets\\icon.png';
        const iconOnlyPath = 'c:\\Metysara-proud\\assets\\icon-only.png';
        const iconBgPath = 'c:\\Metysara-proud\\assets\\icon-background.png';
        
        // 1. Trim empty transparent space around the logo so we get its raw maximum size
        const trimmedLogoBuffer = await sharp(inputPath).trim().toBuffer();
        
        // 2. Create the standard icon.png (white background, logo takes 400px out of 1024px to ensure safe padding)
        const standardForeground = await sharp(trimmedLogoBuffer)
            .resize(400, 400, {fit: 'contain', background: {r:255,g:255,b:255,alpha:0}})
            .toBuffer();

        await sharp({
            create: { width: 1024, height: 1024, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
        })
        .composite([{ input: standardForeground, gravity: 'center' }])
        .png()
        .toFile(iconPath);

        // 3. Create icon-only.png (TRANSPARENT background) for Android Adaptive Icons
        // 400px is the safe zone for 1024px canvas so it won't be clipped by circle crop
        const adaptiveForeground = await sharp(trimmedLogoBuffer)
            .resize(400, 400, {fit: 'contain', background: {r:0,g:0,b:0,alpha:0}})
            .toBuffer();


        await sharp({
            create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
        })
        .composite([{ input: adaptiveForeground, gravity: 'center' }])
        .png()
        .toFile(iconOnlyPath);

        // 4. Create icon-background.png (SOLID WHITE) for Android Adaptive Icons
        await sharp({
            create: { width: 1024, height: 1024, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
        })
        .png()
        .toFile(iconBgPath);

        console.log('Fixed edge-to-edge assets generated successfully.');
    } catch (e) {
        console.error('Error:', e);
    }
})();
