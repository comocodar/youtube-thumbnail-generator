import path from 'path';
import getCurrentDirectory from "./lib/getCurrentDirectory.mjs";
import { loadJson } from './lib/jsonSaveAndLoader.mjs';

function loadCredentials() {
  const __dirname = getCurrentDirectory(import.meta.url);
  const credentialsPath= path.join(__dirname, 'credentials', 'telegram.json');

  try {
    const credentials = loadJson(credentialsPath);
    return credentials;
  } catch (error) {
    console.error(error.message);
    return null;
  }
}

export async function sendTextMessage(textMessage) {
  const credentials = loadCredentials();

  if (credentials) {
    const {
      telegram_bot_token,
      telegram_chat_id,
    } = credentials;
    const apiBaseUrl = 'https://api.telegram.org';
    const apiPath = `bot${telegram_bot_token}/sendMessage`;
    const apiQueryString = `chat_id=${telegram_chat_id}&text=${textMessage}`;
    const apiUrl = `${apiBaseUrl}/${apiPath}?${apiQueryString}`;

    const response = await fetch(apiUrl)
    const jsonResponse = response.json();
    return jsonResponse;
  }
}
