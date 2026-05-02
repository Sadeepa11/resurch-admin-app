const sharp = require("sharp");
const path = require("path");

const src = path.join(__dirname, "assets/logo-source.png");
const assetsDir = path.join(__dirname, "assets");

// White background + centered logo for app icon (1024x1024)
async function generateIcon() {
  const iconSize = 1024;
  const logoSize = 600; // logo padded inside

  // Resize logo keeping aspect ratio, fit inside 600x600
  const logoBuffer = await sharp(src)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  // Place on white 1024x1024 canvas
  await sharp({
    create: {
      width: iconSize,
      height: iconSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: logoBuffer, gravity: "center" }])
    .png()
    .toFile(path.join(assetsDir, "icon.png"));

  console.log("icon.png generated (1024x1024)");

  // Adaptive icon foreground (1024x1024, logo centered on white)
  await sharp({
    create: {
      width: iconSize,
      height: iconSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: logoBuffer, gravity: "center" }])
    .png()
    .toFile(path.join(assetsDir, "adaptive-icon.png"));

  console.log("adaptive-icon.png generated (1024x1024)");

  // Splash screen (1284x2778 portrait)
  const splashLogoBuffer = await sharp(src)
    .resize(500, 200, { fit: "contain", background: { r: 70, g: 95, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1284,
      height: 2778,
      channels: 4,
      background: { r: 70, g: 95, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: splashLogoBuffer, gravity: "center" }])
    .png()
    .toFile(path.join(assetsDir, "splash.png"));

  console.log("splash.png generated (1284x2778)");

  // Favicon (48x48)
  await sharp(src)
    .resize(48, 48, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(assetsDir, "favicon.png"));

  console.log("favicon.png generated (48x48)");
}

generateIcon().catch(console.error);
