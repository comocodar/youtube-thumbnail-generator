import { writeFileSync, existsSync, readFileSync } from 'fs';

export function saveJson(jsonObject, filePath) {
  const jsonString = JSON.stringify(jsonObject);
  return writeFileSync(filePath, jsonString);
}

export function loadJson(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`The file path "${filePath}" does not exist!`);
  }

  const fileBuffer = readFileSync(filePath, 'utf-8');
  const jsonContent = JSON.parse(fileBuffer);
  return jsonContent;
}
