import path from 'path';
import { google } from 'googleapis';
import express from 'express';
import getCurrentDirectory from './lib/getCurrentDirectory.mjs';
import { loadJson, saveJson } from './lib/jsonSaveAndLoader.mjs';

const OAuth2 = google.auth.OAuth2;

const __dirname = getCurrentDirectory(import.meta.url);
const credentialsDirPath = path.join(__dirname, 'credentials');
const accessTokensFilename = 'acess_tokens.json';
const accessTokensPath = path.join(credentialsDirPath, accessTokensFilename);

function getOAuth2Client() {
  function loadCredentials() {
    const credentialsPath = path.join(credentialsDirPath, 'client_secret.json');

    try {
      const credentials = loadJson(credentialsPath);
      return credentials.web;
    } catch (error) {
      console.error(error.message);
      return { redirect_uris: [''] };
    }
  }

  const credentials = loadCredentials();

  const OAuth2Client = new OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris[0]
  );

  return OAuth2Client;
}

function getAcessTokensFromStorage() {
  const accessTokens = loadJson(accessTokensPath);
  return accessTokens;
}

function saveAcessTokensInStorage(accessTokens) {
  saveJson(accessTokens, accessTokensPath);
}

async function getAcessTokensFromOAuth2(OAuth2Client) {
  function requestUserConsent(OAuth2Client) {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/youtube.upload',
      // 'https://www.googleapis.com/auth/youtubepartner',
    ];
  
    const authorizeUrl = OAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' '),
    });
  
    console.log(`URL for consent page landing: ${authorizeUrl}`)
  }

  async function waitForOAuth2Credentials(OAuth2Client) {
    const port = 3000;
    const app = express();
  
    const server = app.listen(port, () => {
      console.log(`Express server is listening on http://localhost:${port}`);
      requestUserConsent(OAuth2Client);
    });
  
    return new Promise((resolve, reject) => {
      app.get('/oauth2callback', async (req, res) => {
        const authCode = req.query.code;
        console.log(`Consent given: ${authCode}`);
    
        res.send(
          '<h1>Authentication successful!</h1><p>Now close this tab.</p>'
        );
  
        OAuth2Client.getToken(authCode, (error, tokens) => {
          if (error) {
            return reject(error);
          }
  
          console.log('Acess tokens received!');
  
          resolve(tokens);
  
          server.close(() => {
            console.log('The server has been stopped');
          });
        });
      });
    });
  }

  let accessTokens = {};

  try {
    accessTokens = await waitForOAuth2Credentials(OAuth2Client);
  } catch (error) {
    console.error(error.message);
  } finally {
    return accessTokens;
  }
}

async function autenticate() {
  const OAuth2Client = getOAuth2Client();
  
  OAuth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      saveAcessTokensInStorage(tokens);
    }
  });
  
  let accessTokens = {};
  try {
    accessTokens = getAcessTokensFromStorage();
  } catch (error) {
    console.error(error.message)
    accessTokens = await getAcessTokensFromOAuth2(OAuth2Client);
  } finally {
    OAuth2Client.setCredentials(accessTokens);
    google.options({
      auth: OAuth2Client
    });
  }
}

export default autenticate;
