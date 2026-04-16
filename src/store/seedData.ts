import { addOption, createPoll } from "../services/pollService";
import {
  type MarginalityProfileFieldDefinition,
  type MarginalityTest,
  type MarginalityTestResponse,
} from "../domain/MarginalityTest";
import { createMarginalityResponse, createMarginalityTest } from "../services/marginalityTestService";
import { getAgeGroupFromAge } from "../services/marginalityTestService";
import type { Poll } from "../domain/Poll";
import type { User } from "../domain/User";

export const getSeededUser = (): User => ({
  id: "demo-user",
  username: "demo-user",
  email: "demo@goatalking.com",
  passwordHash: "local-demo-password",
  avatarUrl: "",
});

const buildPollWithVotes = (
  title: string,
  category: string,
  description: string,
  imageUrl: string,
  optionsWithVotes: Record<string, number>,
  ownerId: string
): Poll => {
  let poll = createPoll(title, category, description, imageUrl);
  
  for (const optionText of Object.keys(optionsWithVotes)) {
    poll = addOption(poll, optionText);
  }

  const totalVotes = Object.values(optionsWithVotes).reduce((sum, votes) => sum + votes, 0);

  return {
    ...poll,
    ownerId,
    options: poll.options.map(option => ({
      ...option,
      votes: optionsWithVotes[option.text] || 0
    })),
    interactionCount: totalVotes,
  };
};

export const getSeededPolls = (): Poll[] => {
  return [
    buildPollWithVotes(
      "Who is the greatest football player of all time?",
      "Sports",
      "Use this page to shape the final poll details view and interactions.",
      "https://www.livemint.com/lm-img/img/2025/06/20/optimize/lionel_messi_Cristiano_ronaldo_1750427785706_1750427788080.jpg",
      {
        "Lionel Messi": 120,
        "Cristiano Ronaldo": 95,
        "Pelé": 40,
        "Diego Maradona": 25,
        "Johan Cruyff": 15,
        "Zinedine Zidane": 5,
      },
      "other-user"
    ),
    buildPollWithVotes(
      "What is the best programming language for beginners?",
      "Technology",
      "Cast your vote on the best language to start a software engineering journey.",
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=1000",
      {
        "Python": 55,
        "JavaScript": 30,
        "TypeScript": 20,
        "Java": 10,
        "C++": 3,
        "Ruby": 2,
      },
      "other-user"
    ),
    buildPollWithVotes(
      "Which sci-fi franchise is the absolute best?",
      "Entertainment",
      "From lightsabers to the spice melange, which universe reigns supreme?",
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1000",
      {
        "Star Wars": 200,
        "Star Trek": 195,
        "The Matrix": 190,
        "Dune": 150,
        "Alien": 65,
      },
      "other-user"
    ),
    buildPollWithVotes(
      "What is the ultimate fast food burger?",
      "Food",
      "The debate that tears friendships apart. Vote for your favorite tier-1 burger.",
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1000",
      {
        "Five Guys": 420,
        "In-N-Out": 150,
        "Shake Shack": 100,
        "McDonald's Quarter Pounder": 50,
        "Burger King Whopper": 30,
      },
      "other-user"
    ),
    buildPollWithVotes(
      "Where is your dream travel destination?",
      "Travel",
      "If money and time were no object, where are you booking your next flight?",
      "https://images.unsplash.com/photo-1488646953014-c8bf21d49246?auto=format&fit=crop&q=80&w=1000",
      {
        "Japan": 28,
        "Italy": 5,
        "New Zealand": 4,
        "Iceland": 2,
        "Peru (Machu Picchu)": 1,
      },
      "other-user"
    ),

    buildPollWithVotes(
      "What is your go-to morning beverage?",
      "Lifestyle",
      "How do you start your day?",
      "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=1000",
      {
        "Coffee": 2,
        "Tea": 2,
        "Water": 2,
        "Juice": 2,
      },
      "demo-user"
    ),

    buildPollWithVotes(
      "What is the best season of the year?",
      "General",
      "Which season has the best vibes, weather, and holidays?",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=1000",
      {
        "Autumn": 24,
        "Summer": 4,
        "Spring": 3,
        "Winter": 1,
      },
      "demo-user"
    ),

    buildPollWithVotes(
      "Are you a dog person or a cat person?",
      "Pets",
      "The classic debate. Pick your side.",
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1000",
      {
        "Dogs": 75,
        "Cats": 5,
        "Neither": 5,
      },
      "demo-user"
    ),

    buildPollWithVotes(
      "Which superpower would you choose?",
      "Entertainment",
      "If you could only pick one superpower to have for the rest of your life.",
      "https://images.unsplash.com/photo-1612450371728-6617594fa7a0?auto=format&fit=crop&q=80&w=1000",
      {
        "Teleportation": 80,
        "Flight": 60,
        "Time Travel": 40,
        "Invisibility": 20,
      },
      "demo-user"
    ),

    buildPollWithVotes(
      "What is the best streaming service right now?",
      "Entertainment",
      "Considering price, original content, and UI, who is winning the streaming wars?",
      "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=1000",
      {
        "Netflix": 330,
        "HBO Max": 150,
        "Hulu": 70,
        "Disney+": 50,
      },
      "demo-user"
    ),
  ];
};

const footballMarginalityQuestionTexts = [
  "Modern football is too tactical and less creative than it used to be.",
  "International trophies should matter more than club trophies in legacy debates.",
  "A player can be world-class even without elite pace.",
  "Financial power has damaged competitive balance in football.",
  "VAR has improved football more than it has harmed it.",
  "Managers matter more than star players in winning major trophies.",
  "The Ballon d'Or overvalues attacking statistics.",
  "Local fans understand a club's identity better than global fans.",
  "A player should stay loyal to one club if they want legendary status.",
  "Football debates online are more tribal than analytical.",
];

const footballProfileFields: MarginalityProfileFieldDefinition[] = [
  {
    key: "age",
    label: "Age",
    inputType: "number",
    required: true,
    min: 13,
    max: 100,
    placeholder: "e.g. 27",
  },
  {
    key: "country",
    label: "Country",
    inputType: "text",
    required: true,
    placeholder: "e.g. Romania",
  },
  {
    key: "footballWatchingLevel",
    label: "Football Watching Level",
    inputType: "select",
    required: true,
    options: ["Rarely", "Casual", "Weekly", "Obsessed"],
  },
  {
    key: "favoriteClub",
    label: "Favorite Club",
    inputType: "text",
    required: false,
    placeholder: "Optional",
  },
];

export const getSeededMarginalityTests = (): MarginalityTest[] => {
  const footballTest = createMarginalityTest(
    "Football Tribalism and Legacy",
    "Football",
    "Measure how your football opinions compare with supporters from different age groups, countries, and viewing habits.",
    footballMarginalityQuestionTexts,
    footballProfileFields
  );

  return [
    {
      ...footballTest,
      id: "football-tribalism-and-legacy",
      questions: footballTest.questions.map((question, index) => ({
        ...question,
        id: `football-q-${index + 1}`,
      })),
    },
  ];
};

export const getSeededMarginalityResponses = (
  tests: MarginalityTest[]
): MarginalityTestResponse[] => {
  const footballTest = tests[0];

  if (!footballTest) {
    return [];
  }

  const questionIds = footballTest.questions.map((question) => question.id);

  const buildVotes = (agreements: number[]) =>
    agreements.map((agreement, index) => ({
      questionId: questionIds[index],
      agreement,
    }));

  return [
    createMarginalityResponse(
      footballTest.id,
      "demo-user",
      {
        age: 31,
        ageGroup: getAgeGroupFromAge(31),
        country: "Romania",
        footballWatchingLevel: "Weekly",
        favoriteClub: "Barcelona",
      },
      buildVotes([82, 68, 90, 74, 40, 63, 79, 58, 25, 88])
    ),
    createMarginalityResponse(
      footballTest.id,
      "user-spain-1",
      {
        age: 24,
        ageGroup: getAgeGroupFromAge(24),
        country: "Spain",
        footballWatchingLevel: "Obsessed",
        favoriteClub: "Real Madrid",
      },
      buildVotes([51, 44, 67, 58, 35, 49, 72, 36, 19, 84])
    ),
    createMarginalityResponse(
      footballTest.id,
      "user-england-1",
      {
        age: 49,
        ageGroup: getAgeGroupFromAge(49),
        country: "England",
        footballWatchingLevel: "Weekly",
        favoriteClub: "Liverpool",
      },
      buildVotes([76, 83, 63, 71, 48, 55, 61, 64, 47, 67])
    ),
    createMarginalityResponse(
      footballTest.id,
      "user-germany-1",
      {
        age: 66,
        ageGroup: getAgeGroupFromAge(66),
        country: "Germany",
        footballWatchingLevel: "Casual",
      },
      buildVotes([69, 72, 52, 65, 54, 60, 57, 71, 59, 46])
    ),
    createMarginalityResponse(
      footballTest.id,
      "user-argentina-1",
      {
        age: 36,
        ageGroup: getAgeGroupFromAge(36),
        country: "Argentina",
        footballWatchingLevel: "Obsessed",
        favoriteClub: "River Plate",
      },
      buildVotes([61, 79, 86, 62, 29, 51, 70, 43, 21, 81])
    ),
  ];
};
