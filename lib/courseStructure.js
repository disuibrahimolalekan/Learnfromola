export const MODULES = [
  {
    number: 1,
    title: "Understanding the Modern AI Development Stack",
    chapterCount: 10,
  },
  {
    number: 2,
    title: "AI Vibe Coding: Thinking Before You Build",
    chapterCount: 11,
  },
  {
    number: 3,
    title: "Choosing the Right Technologies",
    chapterCount: 18,
  },
  {
    number: 4,
    title: "Building Real Projects with AI",
    chapterCount: 10,
  },
  {
    number: 5,
    title: "Security, Deployment & Professional Best Practices",
    chapterCount: 8,
  },
  {
    number: 6,
    title: "Building a Career and Business with AI Software Development",
    chapterCount: 6,
  },
];

export const TOTAL_CHAPTERS = MODULES.reduce((sum, m) => sum + m.chapterCount, 0);
