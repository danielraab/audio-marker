import { readdir } from 'fs/promises';
import path from 'path';
import { generateAndSavePeaks } from '../src/lib/peaks';

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
    const peaksPath = path.join(uploadsDir, `${path.parse(file).name}.json`);
    try {
      console.log(`Generating peaks for: ${file}`);
      await generateAndSavePeaks(filePath);
      console.log(`Done: ${peaksPath}`);
    } catch (err) {
      console.error(`Failed to generate peaks for ${file}:`, err);
    }
  }
  console.log('All files processed.');
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
