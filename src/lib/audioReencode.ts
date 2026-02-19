import { execFile } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

/**
 * Re-encode an MP3 file to CBR (constant bitrate) with fixed sample rate.
 * This ensures consistent interpretation across browsers.
 *
 * @param inputPath Absolute path to the original MP3 file
 * @param outputPath Absolute path for the re-encoded file
 * @param bitrate Bitrate in kbps (default: 128)
 * @param sampleRate Sample rate in Hz (default: 44100)
 */
export async function reencodeMp3ToCbr(
  inputPath: string,
  outputPath: string,
  bitrate = 128,
  sampleRate = 44100
): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      'ffmpeg',
      [
        '-y', // overwrite output
        '-i', inputPath,
        '-ar', String(sampleRate),
        '-b:a', `${bitrate}k`,
        '-codec:a', 'libmp3lame',
        outputPath,
      ],
      { maxBuffer: 10 * 1024 * 1024 },
      (error) => {
        if (error) {
          reject(new Error(`ffmpeg re-encode failed: ${error.message}`));
          return;
        }
        resolve();
      }
    );
  });
}

/**
 * Replace the original MP3 file with a CBR version.
 * @param filePath Absolute path to the original MP3 file
 * @param bitrate Bitrate in kbps (default: 128)
 * @param sampleRate Sample rate in Hz (default: 44100)
 */
export async function replaceWithCbrMp3(
  filePath: string,
  bitrate = 128,
  sampleRate = 44100
): Promise<void> {
  const parsed = path.parse(filePath);
  const tempPath = path.join(parsed.dir, `${parsed.name}-cbr${parsed.ext}`);
  await reencodeMp3ToCbr(filePath, tempPath, bitrate, sampleRate);
  // Replace original file
  await unlink(filePath);
  await writeFile(filePath, await (await import('fs/promises')).readFile(tempPath));
  await unlink(tempPath);
}
