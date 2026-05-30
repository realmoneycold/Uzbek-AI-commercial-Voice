export interface AdScript {
  title: string;
  text: string;
  duration: string;
  styleNotes: string;
}

export interface GeneratedVoice {
  id: string;
  title: string;
  text: string;
  voiceName: string;
  tone: string;
  audioUrl: string;
  durationEst: number;
  createdAt: string;
}

export interface VoiceSpeaker {
  id: string;
  name: string;
  gender: "Ayol" | "Erkak" | "Female" | "Male";
  description: string;
  enDescription: string;
  bestSuited: string;
  accent: string;
}
