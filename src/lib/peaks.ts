import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);

/**
 * Number of peaks per second of audio.
 * Higher values = more detail but larger file.
 * 100 peaks/sec provides good waveform detail at typical zoom levels.
 */
const PEAKS_PER_SECOND = 50;

export interface PeaksData {
  /** Array of peak values, normalized to [-1, 1] */
  peaks: number[];
  /** Duration of the audio in seconds */
  duration: number;
  /** Number of samples per peak bucket */
  sampleRate: number;
  /** Length of peaks array */
  length: number;
}

/**
 * Generate a peak list from an audio file using audiowaveform.
 *
 * Uses audiowaveform to generate waveform data at a fixed number of peaks per second.
 * The output is normalized to [-1, 1] range.
 *
 * @param audioFilePath - Absolute path to the audio file (MP3, FLAC, WAV, etc.)
 * @returns The peaks data object
 */
export async function generatePeaks(audioFilePath: string): Promise<PeaksData> {
  const waveformData = await generateWaveformData(audioFilePath, PEAKS_PER_SECOND);

  // audiowaveform returns data array with alternating min/max values
  // We take the absolute max of each min/max pair for our peaks
  const peaks: number[] = [];
  for (let i = 0; i < waveformData.data.length; i += 2) {
    const min = Math.abs(waveformData.data[i]!);
    const max = Math.abs(waveformData.data[i + 1]!);
    const peak = Math.max(min, max);
    // Normalize from 8-bit range (0-255, with 128 as center) to [0, 1]
    const normalized = peak / 128.0;
    // Round to 4 decimal places to reduce JSON size
    peaks.push(Math.round(normalized * 10000) / 10000);
  }

  const duration = waveformData.length / waveformData.sample_rate;

  return {
    peaks,
    duration,
    sampleRate: PEAKS_PER_SECOND,
    length: peaks.length,
  };
}

/**
 * Generate peaks and save them as a JSON file alongside the audio file.
 * The JSON file has the same base name with a .json extension.
 *
 * @param audioFilePath - Absolute path to the audio file
 * @returns The path to the generated JSON file
 */
export async function generateAndSavePeaks(audioFilePath: string): Promise<string> {
  const peaksData = await generatePeaks(audioFilePath);

  // Same filename with .json extension
  const parsed = path.parse(audioFilePath);
  const jsonPath = path.join(parsed.dir, `${parsed.name}.json`);

  await writeFile(jsonPath, JSON.stringify(peaksData));

  return jsonPath;
}

/**
 * Interface for audiowaveform JSON output.
 */
interface AudiowaveformData {
  version: number;
  channels: number;
  sample_rate: number;
  samples_per_pixel: number;
  bits: number;
  length: number;
  data: number[];
}

/**
 * Generate waveform data using audiowaveform.
 * 
 * @param filePath - Path to the audio file
 * @param pixelsPerSecond - Number of data points per second
 * @returns Parsed audiowaveform JSON output
 */
async function generateWaveformData(filePath: string, pixelsPerSecond: number): Promise<AudiowaveformData> {
  try {
    const { stdout } = await execFileAsync(
      'audiowaveform',
      [
        '-i', filePath,
        '--pixels-per-second', String(pixelsPerSecond),
        '-b', '8',              // 8-bit output (smaller, sufficient detail)
        '--output-format', 'json',
        '-o', '-',              // output to stdout
      ],
      { maxBuffer: 10 * 1024 * 1024 }, // 10MB buffer for large files
    );

    const data = JSON.parse(stdout) as AudiowaveformData;
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('audiowaveform returned invalid data');
    }

    return data;
  } catch (error) {
    const err = error as { message: string; stderr?: string };
    const stderrMsg = err.stderr ? '\n' + err.stderr : '';
    throw new Error(`audiowaveform failed: ${err.message}${stderrMsg}`);
  }
}
