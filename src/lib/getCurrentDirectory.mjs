import path from 'path';
import { fileURLToPath } from 'url';

export default function getCurrentDirectory(importMetaUrl) {
  const filename = fileURLToPath(importMetaUrl);
  const dirname = path.dirname(filename);
  return dirname;
}
