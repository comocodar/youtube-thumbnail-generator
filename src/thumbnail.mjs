import os from 'os';
import path from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { takeScreenshotFromHtmlContent } from './browser.mjs';
import getCurrentDirectory from './lib/getCurrentDirectory.mjs';

const __dirname = getCurrentDirectory(import.meta.url);
const outputFilePath = path.join(os.tmpdir(), 'thumbnail.png');

function loadHtmlTemplate() {
  const filePath = path.join(__dirname, 'thumb-template.html');

  if (!existsSync(filePath)) {
    throw new Error(`Thumb template "${filePath}" does not exist!`);
  }

  const template = readFileSync(filePath, 'utf-8');

  return template;
}

function addAllVideoCommentsInHtmlTemplate(htmlTemplate, videoComments = []) {
  const allComments = videoComments.reduce((allComments, videoComment) => {
    const {
      channelHandle,
      authorProfileImageUrl,
      textDisplay,
    } = videoComment;

    /*const videoCommentTemplateYouTubeStyle = `
      <div class="comment-container">
        <div class="comment-row">
          <img
            class="author-thumbnail"
            src="${authorProfileImageUrl}"
          >
          <div class="comment">
            <h3 class="author-nick">${channelHandle}</h3>
            <span class="comment-text">
              ${textDisplay}
            </span>
          </div>
        </div>
      </div>
    `;*/

    const videoCommentTemplate = `
      <div class="comment-container">
        <div class="author">
          <img
            class="author-thumbnail"
            src="${authorProfileImageUrl}"
          >
          <h3 class="author-nick">${channelHandle}</h3>
        </div>
        <span class="comment-text">
          ${textDisplay}
        </span>
      </div>
    `;

    return allComments + videoCommentTemplate;
  }, '');

  const htmlTemplateWithComments = htmlTemplate.replace(
    '<all-comments></all-comments>',
    allComments
  );

  return htmlTemplateWithComments;
}

export async function generateThumbnail(videoComments, saveHtml=false) {
  const htmlTemplate = loadHtmlTemplate();
  const htmlTemplateWithVideoComments = addAllVideoCommentsInHtmlTemplate(
    htmlTemplate,
    videoComments
  );

  if (saveHtml) {
    writeFileSync('thumbnail.html', htmlTemplateWithVideoComments);
  }
  
  await takeScreenshotFromHtmlContent(
    htmlTemplateWithVideoComments,
    outputFilePath
  );
  return outputFilePath;
}
