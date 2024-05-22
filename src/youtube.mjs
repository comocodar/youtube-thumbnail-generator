import { google } from 'googleapis';
import fs from 'fs';

const youtube = google.youtube({ version: 'v3' });

function selectCommentsFromUniquePeople(comments) {
  return comments.reduce(
    (commentsFromUniquePeople, currentComment) => {
      const isThereAnotherCommentFromThisPerson = commentsFromUniquePeople
        .some(singleComment => {
          const singleCommentChannelId = singleComment
            .snippet
            .topLevelComment
            .snippet
            .authorChannelId
            .value;
          const currentCommentChannelId = currentComment
            .snippet
            .topLevelComment
            .snippet
            .authorChannelId
            .value;
          return singleCommentChannelId === currentCommentChannelId;
        });

      return isThereAnotherCommentFromThisPerson
        ? commentsFromUniquePeople
        : [...commentsFromUniquePeople, currentComment];
    },
    []
  );
}

async function getChannelsCustomUrlAndProfilePicture(channelsId = []) {
  const response = await youtube.channels.list({
    part: 'snippet',
    id: channelsId,
  });

  const channels = response.data.items;

  const channelsCustomUrlAndProfilePicture = channels.reduce((channelsObj, channel) => {
    channelsObj[channel.id] = {
      channelHandle: channel.snippet.customUrl,
      profilePictureUrl: channel.snippet.thumbnails.default.url,
    };
    return channelsObj;
  }, {});

  return channelsCustomUrlAndProfilePicture;
}

function getRecentComments(comments, thumbnailUpdateIntervalInSeconds) {
  const deadlineForCommentToBeUsed = new Date();

  deadlineForCommentToBeUsed.setSeconds(
    deadlineForCommentToBeUsed.getSeconds()
    - (thumbnailUpdateIntervalInSeconds + 1)
  );

  const thereAreNewComments = comments.some((comment) => {
    const commentDate = new Date(
      comment.snippet.topLevelComment.snippet.updatedAt
    );
    return commentDate > deadlineForCommentToBeUsed;
  });

  return thereAreNewComments ? comments : [];
}

export async function listNewComments(
  videoId,
  thumbnailUpdateIntervalInSeconds = 60 * 5,
  channelIdsToIgnoreComments = []
) {
  let mapedComments = [];

  try {
    const response = await youtube.commentThreads.list({
      part: 'snippet',
      videoId: videoId,
      maxResults: 10,
    });

    const commentsNotIgnored = response.data.items.filter(
      comment => !channelIdsToIgnoreComments.includes(comment.snippet.topLevelComment.snippet.authorChannelId.value)
    );

    const comments = getRecentComments(
      commentsNotIgnored, thumbnailUpdateIntervalInSeconds
    );

    if (comments.length === 0) {
      console.log('No comments found.');
    } else {
      const commentsFromUniquePeople = selectCommentsFromUniquePeople(comments);

      const channelsId = commentsFromUniquePeople.map(
        comment => comment.snippet.topLevelComment.snippet.authorChannelId.value
      );

      const channelsCustomUrlAndProfilePicture =
        await getChannelsCustomUrlAndProfilePicture(channelsId);

      mapedComments = commentsFromUniquePeople.map(comment => {
        const snippet = comment.snippet.topLevelComment.snippet;
        const authorChannelId = snippet.authorChannelId.value;
        const channelHandle = snippet.authorDisplayName;

        const {
          profilePictureUrl,
        } = channelsCustomUrlAndProfilePicture[authorChannelId];

        return {
          channelHandle,
          authorDisplayName: snippet.authorDisplayName,
          authorProfileImageUrl: profilePictureUrl,
          textDisplay: snippet.textDisplay,
        }
      });
    }
  } catch (error) {
    const errorMessage = 'An error occurred while trying to get the comments: '
      + error.message;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  return mapedComments;
}

export async function uploadThumbnail(imageFilePath, videoId) {
  const imageData = fs.readFileSync(imageFilePath);

  try {
    await youtube.thumbnails.set({
      videoId: videoId,
      media: {
        mimeType: 'image/png',
        body: imageData,
      },
    });

    console.log('Thumbnail updated successfully.');
  } catch (error) {
    const errorMessage = 'An error occurred while updating the video thumbnail: '
      + error.message;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }  
}

export async function updateTitle(title, videoId) {
  try {
    const scienceAndTechnologyCategoryId = 28;

    await youtube.videos.update({
      part: 'snippet',
      resource: {
        id: videoId,
        snippet: {
          title: title,
          categoryId: scienceAndTechnologyCategoryId,
        }
      }
    });

    console.log('Title updated successfully.');
  } catch (error) {
    const errorMessage = 'An error occurred while updating the video title: '
      + error.message;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}
