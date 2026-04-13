import type { User } from "next-auth";

export interface Playlist {
  id: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  audioCount: number;
  listenCounter?: number;
  lastListenAt?: Date | null;
}

export interface PlaylistForAudio {
  id: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  audioCount: number;
  hasAudio: boolean;
}

export interface PlaylistWithAudios {
  id: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: User;
  audios: PlaylistAudio[];
  listenCounter?: number;
  lastListenAt?: Date | null;
}

export interface PlaylistAudio {
  id: string;
  order: number;
  addedAt: Date;
  audio: {
    id: string;
    name: string;
    description?: string | null;
    originalFileName: string;
    filePath: string;
    createdAt: Date;
    markerCount: number;
    listenCounter?: number;
    lastListenAt?: Date | null;
  };
}

export interface AudioForPlaylist {
  id: string;
  name: string;
  description?: string | null;
  originalFileName: string;
  filePath: string;
  createdAt: Date;
  markerCount: number;
  listenCounter?: number;
  lastListenAt?: Date | null;
}

export interface AudioWithPlaylistInfo {
  id: string;
  name: string;
  description?: string | null;
  originalFileName: string;
  filePath: string;
  createdAt: Date;
  markerCount: number;
  isInPlaylist: boolean;
  listenCounter?: number;
  lastListenAt?: Date | null;
}
