import autenticate from './oauth2.mjs';
import { listNewComments, uploadThumbnail } from './youtube.mjs';
import { generateThumbnail } from './thumbnail.mjs';
import { sendTextMessage } from './telegram.mjs';

const thumbnailUpdateIntervalInSeconds = 60 * 8;
const comocodarChannelId = 'UCE5SutNgGUu3LYQNZMYnI1Q';

export const handler = async (event) => {
  let statusCode = 200;
  let message = 'Thumbnail successfully updated!';

  try {
    if (!event.videoId) throw new Error('You must enter a videoId!');

    const videoId = event.videoId;
    await autenticate();
    const videoComments = await listNewComments(
      videoId, thumbnailUpdateIntervalInSeconds, [comocodarChannelId]
    );

    if (videoComments.length > 0) {
      const imageFilePath = await generateThumbnail(videoComments);
      await uploadThumbnail(imageFilePath, videoId);
    }
  } catch (error) {
    statusCode = 500;
    message = error.message;
    sendTextMessage(message);
  }

  const response = {
      statusCode,
      body: JSON.stringify({ message }),
  };

  return response;
};

const test = false;

if (test) {
  handler({
    videoId: '1gcjhZel6zk'
  }).then(console.log);
}
