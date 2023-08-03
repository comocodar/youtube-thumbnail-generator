function extractChannelsHandleFromVideoComments(videoComments) {
  const channelsHandle = videoComments.map(comment => comment.channelHandle);
  const channelHandleString = channelsHandle.join(', ');
  return channelHandleString;
}

export function generateTitle(videoComments) {
  const channelHandleString =
    extractChannelsHandleFromVideoComments(videoComments);

  const title = 'Seu COMENTÁRIO vai aparecer na CAPA deste vídeo!!!'
    + ` Últimas pessoas que comentaram: ${channelHandleString}.`;

  return title;
}