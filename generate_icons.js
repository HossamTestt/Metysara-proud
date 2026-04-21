const sharp = require('sharp');
const fs = require('fs');

(async () => {
    try {
        const inputPath = 'C:\\Users\\DELL G15\\.gemini\\antigravity\\brain\\4d98fbfa-4f1c-4ec0-81e0-5518ba68a6a9\\media__1774720718961.png';
        const iconPath = 'c:\\Metysara-proud\\assets\\icon.png';
        const splashPath = 'c:\\Metysara-proud\\assets\\splash.png';
        
        if (!fs.existsSync('c:\\Metysara-proud\\assets')) {
            fs.mkdirSync('c:\\Metysara-proud\\assets');
        }

        console.log('Generating Icon...');
        const logoIcon = await sharp(inputPath)
            // Make it large within the 1024 box, e.g., 900x900
            .resize(900, 900, {fit: 'contain', background: {r:255,g:255,b:255,alpha:0}})
            // Slightly darken or thicken the text if possible (optional)
            .toBuffer();

        await sharp({
            create: {
                width: 1024,
                height: 1024,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
        .composite([{ input: logoIcon, gravity: 'center' }])
        .png()
        .toFile(iconPath);

        console.log('Generating Splash...');
        const logoSplash = await sharp(inputPath)
            .resize(1600, 1600, {fit: 'contain', background: {r:255,g:255,b:255,alpha:0}})
            .toBuffer();

        await sharp({
            create: {
                width: 2732,
                height: 2732,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
        .composite([{ input: logoSplash, gravity: 'center' }])
        .png()
        .toFile(splashPath);

        console.log('Images generated successfully on white background.');
    } catch (e) {
        console.error('Error generating images:', e);
    }
})();
