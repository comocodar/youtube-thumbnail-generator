import path from 'path';
import { readdirSync } from 'fs';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import getCurrentDirectory from './lib/getCurrentDirectory.mjs';

async function setFonts() {
  const __dirname = getCurrentDirectory(import.meta.url);
  const fontsPath = path.join(__dirname, 'fonts');
  const fonts = readdirSync(fontsPath);

  return await Promise.allSettled(fonts.map(font => {
    const fontPath = path.join(fontsPath, font);
    return chromium.font(fontPath);
  }));
}

export async function takeScreenshotFromHtmlContent(
  htmlContent,
  outputFilePath
) {
  let browser = null;

  try {
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;

    await setFonts();

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  
    const page = await browser.newPage();
    
    await page.setViewport({
      width: 1280,
      height: 720,
    });
  
    await page.setContent(htmlContent, {
      waitUntil: 'load',
    });
  
    await page.screenshot({
      path: outputFilePath,
      type: 'png',
    });
  } catch (error) {
    throw new Error(error.message);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
