// ============================================================
// KHEPRIX 2K26 — Story Scenes Data
// ============================================================

export interface StoryScene {
  id: number;
  chapter: string;
  title: string;
  caption: string;
  image: string;
  alt: string;
}

export const STORY_SCENES: StoryScene[] = [
  {
    id: 1,
    chapter: "CHAPTER I",
    title: "THE JOURNEY",
    caption: "Four brave explorers set forth into the unknown, chasing legends whispered by the sands of time.",
    image: "/assets/story/01_explorers.jpg",
    alt: "Four explorers beginning their desert expedition toward an ancient Egyptian mystery",
  },
  {
    id: 2,
    chapter: "CHAPTER II",
    title: "THE FORBIDDEN ENTRANCE",
    caption: "They stood before the great pyramid — its sealed entrance unmarked on any map. A warning carved in stone.",
    image: "/assets/story/02_pyramid_entrance.jpg",
    alt: "Explorers discovering the ancient pyramid entrance at twilight",
  },
  {
    id: 3,
    chapter: "CHAPTER III",
    title: "THE SEALED COFFIN",
    caption: "Deep within the burial chamber, the sarcophagus lay untouched for three thousand years. They should have left it sealed.",
    image: "/assets/story/03_coffin.jpg",
    alt: "The ancient sealed coffin discovered inside the pyramid burial chamber",
  },
  {
    id: 4,
    chapter: "CHAPTER IV",
    title: "THE TREASURE",
    caption: "Gold beyond measure. Artifacts beyond comprehension. The treasure of the lost pharaoh — finally revealed.",
    image: "/assets/story/04_treasure.jpg",
    alt: "Magnificent ancient Egyptian treasure revealed inside the pyramid",
  },
  {
    id: 5,
    chapter: "CHAPTER V",
    title: "THE AWAKENING",
    caption: "The curse was real. The guardian stirred from its eternal sleep. Ancient eyes opened in the darkness.",
    image: "/assets/story/05_mummy_awakes.jpg",
    alt: "The ancient mummy awakening to protect the forbidden treasure",
  },
  {
    id: 6,
    chapter: "CHAPTER VI",
    title: "THE SLEEPING GUARDIAN",
    caption: "The guardian retreated. The treasure remains. The expedition was never truly over.",
    image: "/assets/story/06_mummy_sleeps.jpg",
    alt: "The mummy guardian returning to its eternal slumber, protecting the treasure",
  },
];
