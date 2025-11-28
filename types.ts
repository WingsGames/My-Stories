
export enum Language {
  HEBREW = 'he',
  ENGLISH = 'en'
}

export interface StoryPage {
  text: string;
  imagePrompt?: string; // Optional now
  imageData?: string; // Optional now
  audioData?: ArrayBuffer;
}

export interface Story {
  id: string;
  title: string;
  topic: string;
  age: number;
  language: Language;
  createdAt: number;
  pages: StoryPage[];
  coverImageData?: string;
  styleGuide?: string;
}

export interface StorySettings {
  topic: string;
  age: number;
  numPages: number;
  numIllustrations: number;
  language: Language;
}