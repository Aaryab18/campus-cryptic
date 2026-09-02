export type Mission = {
  id: number;
  experience: "freshman" | "tech" | "campus";
  title: string;
  location: string;
  puzzle: string;
  answer: string;
  hint1: string;
  hint2: string;
  description: string;
  trivia: string;
  difficulty: "Easy" | "Medium" | "Hard";
  xp: number;
};

export const missions: Mission[] = [
  {
    id: 1,
    experience: "freshman",
    title: "The House of Knowledge",
    location: "RVCE Central Library",
    puzzle: `I hold thousands of worlds,
but I never leave my place.
Students come to find answers,
but I ask no questions.
What am I?`,
    answer: "library",
    hint1: "It is filled with books and knowledge.",
    hint2: "Students often study here before exams.",
    description:
      "A place where students explore books, research, ideas, and knowledge.",
    trivia:
      "Libraries are one of the most important knowledge hubs in a college campus.",
    difficulty: "Easy",
    xp: 50,
  },

  {
    id: 2,
    experience: "freshman",
    title: "The Gathering Place",
    location: "RVCE Auditorium",
    puzzle: `I come alive when hundreds gather.
I host voices, celebrations, and performances.
But I am quiet when the curtains close.
What am I?`,
    answer: "auditorium",
    hint1: "Large groups of students gather here.",
    hint2: "Events and performances happen here.",
    description:
      "A campus space where events, celebrations, performances, and announcements take place.",
    trivia:
      "Auditoriums bring together different communities and events across a campus.",
    difficulty: "Easy",
    xp: 60,
  },

  {
    id: 3,
    experience: "tech",
    title: "The Debug Zone",
    location: "Innovation & Computer Labs",
    puzzle: `Ideas become code within these walls.
Errors appear, bugs are hunted,
and solutions are born.
Where am I?`,
    answer: "lab",
    hint1: "Computers are an important part of this place.",
    hint2: "Students often write, test, and debug code here.",
    description:
      "A space where students experiment, build projects, debug code, and transform ideas into technology.",
    trivia:
      "Hands-on labs turn theoretical knowledge into practical experimentation.",
    difficulty: "Medium",
    xp: 75,
  },

  {
    id: 4,
    experience: "tech",
    title: "The Logic Gate",
    location: "Engineering Block",
    puzzle: `Equations, circuits, algorithms,
and ideas all meet here.
Students enter to learn how
the world around them works.
Where am I?`,
    answer: "engineering block",
    hint1: "This location is strongly connected to technical education.",
    hint2: "Many engineering classes and departments can be found here.",
    description:
      "A core academic space where engineering students learn, collaborate, and build their foundations.",
    trivia:
      "Engineering education combines theory, experimentation, and problem-solving.",
    difficulty: "Medium",
    xp: 80,
  },

  {
    id: 5,
    experience: "campus",
    title: "The Energy Hub",
    location: "Sports Ground",
    puzzle: `I have no books and no lectures,
yet I teach teamwork and discipline.
Cheers can be heard when I come alive.
What am I?`,
    answer: "sports ground",
    hint1: "Physical activity is central to this place.",
    hint2: "Students come here to play and compete.",
    description:
      "A campus space where students participate in sports, competitions, and recreational activities.",
    trivia:
      "Sports spaces help build teamwork, discipline, leadership, and campus spirit.",
    difficulty: "Easy",
    xp: 65,
  },

  {
    id: 6,
    experience: "campus",
    title: "The Student Hub",
    location: "Food Court",
    puzzle: `Between lectures and deadlines,
students gather here to recharge.
Conversations are served alongside meals.
Where am I?`,
    answer: "food court",
    hint1: "Food is an important clue.",
    hint2: "Students often meet friends here between classes.",
    description:
      "A social campus space where students eat, relax, and connect with friends.",
    trivia:
      "Informal spaces often play an important role in building campus communities.",
    difficulty: "Easy",
    xp: 60,
  },
];