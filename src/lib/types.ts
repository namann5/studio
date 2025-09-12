export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export type MoodEntry = {
  date: string;
  mood: number;
};
