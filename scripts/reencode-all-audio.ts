import { readdir } from 'fs/promises';
import path from 'path';
import { replaceWithCbrMp3 } from '../src/lib/audioReencode';

async function main() {
  const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
  const files = await readdir(uploadsDir);
  const mp3Files = files.filter(f => f.endsWith('.mp3'));

  if (mp3Files.length === 0) {
    console.log('No MP3 files found in uploads directory.');
    return;
  }

  for (const file of mp3Files) {
    const filePath = path.join(uploadsDir, file);
    try {
      console.log(`Re-encoding: ${file}`);
      await replaceWithCbrMp3(filePath);
      console.log(`Done: ${file}`);
    } catch (err) {
      console.error(`Failed to re-encode ${file}:`, err);
    }
  }
  console.log('All files processed.');
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
