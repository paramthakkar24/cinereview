/* =============================================================================
   CineReview — bundled movie dataset
   -----------------------------------------------------------------------------
   Site name : CineReview
   Type      : Movie Review Website (5 pages)
   Stack     : HTML5 + CSS3 + Vanilla JavaScript (no build step, no framework)
   Data      : This file. Plain JS instead of a database, as specified in the
               brief. Swap for fetch() later — every page reads from CR.data.

   Artwork   : Posters and banners are generated locally by tools/gen-posters.mjs
               into images/movie-posters/ and images/banners/. Nothing is loaded
               from the network, so the site works fully offline.

   Data shape per movie
     id           slug used in URLs (movie-details.html?id=…) and asset filenames
     accent       per-movie theme colour used on the details page
     rating       CineReview score out of 10
     breakdown    5→1 star distribution; values sum to reviewCount
     pros/cons    the "Pros and Cons" block on the details page
     flags        isFeatured (hero) / isTrending / isNew (2023 or later)
   ========================================================================== */

(function () {
  "use strict";

  /* ---------------------------------------------------------------------------
     EDITORIAL VOICES
     --------------------------------------------------------------------------- */
  const CRITICS = [
    { name: "Maya Raghunathan", role: "Senior Critic", initials: "MR" },
    { name: "Daniel Okafor", role: "Staff Writer", initials: "DO" },
    { name: "Sofia Lindqvist", role: "Contributing Editor", initials: "SL" },
    { name: "Kenji Arakawa", role: "Film Programme", initials: "KA" },
    { name: "Priya Raman", role: "Managing Editor", initials: "PR" }
  ];

  /* ---------------------------------------------------------------------------
     MOVIES — 28 titles
     --------------------------------------------------------------------------- */
  const MOVIES = [
    {
      id: "inception",
      posterPath: "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg",
      backdropPath: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
      title: "Inception",
      year: 2010,
      runtime: 148,
      rated: "PG-13",
      director: "Christopher Nolan",
      cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy", "Marion Cotillard"],
      genres: ["Sci-Fi", "Action", "Thriller"],
      tagline: "Your mind is the scene of the crime.",
      accent: "#4f7cff",
      rating: 8.8,
      reviewCount: 4128,
      criticScore: 94,
      isFeatured: true,
      isTrending: true,
      overview:
        "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a chief executive. The plan unravels when the target proves resistant, and the team can no longer tell where the dreams end and the waking world begins.",
      pros: [
        "A heist plot that actually works as a heist plot — every rule of the dream is established before it is exploited.",
        "DiCaprio plays exhaustion as a physical condition rather than a mood.",
        "The zero-gravity corridor is the most credible weightlessness in modern cinema."
      ],
      cons: [
        "The emotional beats of the children are quietly the weakest part of a very strong film.",
        "Two hours and twenty minutes, with a fifteen-minute coda it does not need."
      ],
      review: {
        title: "The most precise puzzle-box you will ever fall into",
        author: 0,
        date: "2024-11-18",
        body: [
          "Nolan builds a film with load-bearing walls and no visible scaffolding. The dream levels are stacked like Russian dolls, each with its own physics, its own stakes and its own quiet dread — and the film treats a lucid dream the way a heist film treats a vault: as somewhere you can get trapped.",
          "What lingers is the emotional inversion. Cobb is not a thief who wants in; he is a man trying to get back out, and the movie understands that those are the same action running in opposite directions.",
          "It is fifteen years old and still three layers ahead of the conversation."
        ],
        quote: "I stopped the projector and sat in the dark for a while. That never happens."
      },
      breakdown: {5: 2559, 4: 991, 3: 330, 2: 165, 1: 83}
    },
    {
      id: "interstellar",
      posterPath: "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg",
      backdropPath: "/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
      title: "Interstellar",
      year: 2014,
      runtime: 169,
      rated: "PG-13",
      director: "Christopher Nolan",
      cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine", "Matt Damon"],
      genres: ["Sci-Fi", "Drama", "Adventure"],
      tagline: "Mankind was born on Earth. It was never meant to die here.",
      accent: "#d98b3f",
      rating: 8.7,
      reviewCount: 3980,
      criticScore: 73,
      isTrending: true,
      overview:
        "With Earth's crops failing, a former test pilot leads a mission through a wormhole to find humanity a new home. Every hour spent on a distant world costs years on Earth, and the people he leaves behind age while he does not.",
      pros: [
        "McConaughey plays a man watching his children age past him, and the film never tells us to feel bad about it.",
        "The sound design puts you inside the Endurance during docking — all breath, scrape and radio static.",
        "Zimmer's organ theme earns its bombast by being used exactly twice."
      ],
      cons: [
        "The exposition arrives in speech, not action, whenever the science has to be explained.",
        "One-loned for a summer and stretched over 169 minutes, the third act is the slowest."
      ],
      review: {
        title: "The loudest film ever made, and the quietest ending",
        author: 3,
        date: "2024-09-27",
        body: [
          "Nolan builds a cathedral of a film and then, in its final movement, makes you whisper. The organ chords are famous and deserved. The sound design is better.",
          "McConaughey does something subtle with time. The film simply hands us the maths and trusts us to do the arithmetic on what we have lost.",
          "The ending is one-sided and people have been arguing about it for a decade. I am on the side of the film."
        ],
        quote: "A sequel in ideas that makes its predecessor feel like a sketch."
      },
      breakdown: {5: 2149, 4: 1075, 3: 438, 2: 199, 1: 119}
    },
    {
      id: "the-dark-knight",
      posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      backdropPath: "/9FE5eD92WfVCiivM9Pq9GVSrlWk.jpg",
      title: "The Dark Knight",
      year: 2008,
      runtime: 152,
      rated: "PG-13",
      director: "Christopher Nolan",
      cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Gary Oldman", "Maggie Gyllenhaal"],
      genres: ["Action", "Crime", "Drama", "Thriller"],
      tagline: "Why so serious?",
      accent: "#f5b52e",
      rating: 9.0,
      reviewCount: 5620,
      criticScore: 94,
      isTrending: true,
      overview:
        "Batman, Gordon and Harvey Dent push Gotham's organised crime to the brink. Their idea of justice is about to be undone by a man who considers chaos not as a means but as the ends itself — and who will hold the city, and its guardian, to a corrupting bargain.",
      pros: [
        "Heath Ledger's Joker has no origin, no plan and no interest in money — he is an argument, not a character.",
        "The hospital detonator scene denies the audience a cut and is the highest-tension three minutes in comic-book cinema.",
        "Nolan shoots Gotham like a real city that has to be maintained, not a studio backlot."
      ],
      cons: [
        "Two-faced gets sidelined for whole stretches, which quietly breaks the plot the first act sets up.",
        "The overlong runtime is only forgivable because the third act earns it."
      ],
      review: {
        title: "The film that made comic books take themselves seriously",
        author: 2,
        date: "2024-10-02",
        body: [
          "Every entry in this series is a procedural. This is the only one that is a tragedy, and the difference is entirely Heath Ledger. His Joker exists to prove that decent people will bargain with him, every single time, for the right price.",
          "Nolan refuses the shortcut. There is a scene, roughly two-thirds in, that simply sits with Dent in a hospital bed while a detonator counts down. Nothing explodes. The tension is entirely moral.",
          "Gotham gets a skyline. Ledger gives it weather."
        ],
        quote: "Ledger plays the Joker like he is auditing the rest of us."
      },
      breakdown: {5: 3990, 4: 1068, 3: 337, 2: 169, 1: 56}
    },
    {
      id: "avengers-endgame",
      posterPath: "/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg",
      backdropPath: "/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
      title: "Avengers: Endgame",
      year: 2019,
      runtime: 181,
      rated: "PG-13",
      director: "Anthony & Joe Russo",
      cast: ["Robert Downey Jr.", "Chris Evans", "Scarlett Johansson", "Chris Hemsworth", "Mark Ruffalo"],
      genres: ["Action", "Adventure", "Sci-Fi", "Drama"],
      tagline: "Avenge the fallen.",
      accent: "#c0392b",
      rating: 7.9,
      reviewCount: 4690,
      criticScore: 71,
      isTrending: true,
      overview:
        "The Avengers, scattered and defeated, discover a way to travel back through time and attempt to undo the loss of half of all life. Success has an unlisted cost, and someone is going to pay it.",
      pros: [
        "The most disciplined act-three structure of any blockbuster of the century.",
        "A genuinely earned ending that resolves a decade of plot without a single twist for the sake of it.",
        "Time travel is treated as a cost with a body count, not a convenience."
      ],
      cons: [
        "Six minutes of credits before the film returns to give the moment its weight.",
        "Several key emotional beats land in scenes that were clearly shot months apart."
      ],
      review: {
        title: "A finale that earns its exhaustion",
        author: 0,
        date: "2024-09-30",
        body: [
          "Twenty-two films in, the Russos solve the problem nobody had solved: how to make a finale that is about paying up rather than winning. The answer is that the victory belongs to the hero who is not there for it.",
          "It is deliberately exhausting. The film returns you to time travel fatigue before it asks you to care one more time, and the exhaustion is the point.",
          "The seams show. That it still works is a testament to how much groundwork the earlier entries did."
        ],
        quote: "It is a finale about debt, not victory. That is why it works."
      },
      breakdown: {5: 1782, 4: 1313, 3: 844, 2: 469, 1: 282}
    },
    {
      id: "dune-part-two",
      posterPath: "/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg",
      backdropPath: "/eZ239CUp1d6OryZEBPnO2n87gMG.jpg",
      title: "Dune: Part Two",
      year: 2024,
      runtime: 167,
      rated: "PG-13",
      director: "Denis Villeneuve",
      cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Javier Bardem", "Austin Butler"],
      genres: ["Sci-Fi", "Adventure", "Drama"],
      tagline: "Long live the fighters.",
      accent: "#c98a2e",
      rating: 8.5,
      reviewCount: 3980,
      criticScore: 88,
      isNew: true,
      isTrending: true,
      overview:
        "Paul Atreides unites with the Fremen and his own house to wage war on the conspirators who destroyed his family, while dreading the future he is the only person alive able to see.",
      pros: [
        "A sequel that respects the fact you may have skipped the original: legible motives, real stakes, no homework.",
        "Greig Fraser holds dunes on screen for seconds and turns a footstep into an event.",
        "The sound design makes the sand a character — a low, moving pressure you feel in the chair."
      ],
      cons: [
        "The second hour is three hours long once you account for the sandworm transit sequences.",
        "It leans on a twist that a careful reader of the first film will have predicted."
      ],
      review: {
        title: "Sand as a clock",
        author: 1,
        date: "2024-09-15",
        body: [
          "The first hour gives you everything the first Dune refused to: characters you can follow, an antagonist whose motives are legible, and a sense of what is actually at stake.",
          "Villeneuve builds dread at geological speed. Chalamet's physical transformation is genuinely unsettling, and the film never once tells you what he is becoming. It just cuts to Paul looking at a horizon.",
          "It made a rewatch of Part One compulsory, which no sequel has managed since 1974."
        ],
        quote: "The best sequel since The Godfather."
      },
      breakdown: {5: 1910, 4: 1154, 3: 518, 2: 239, 1: 159}
    },
    {
      id: "spider-man-no-way-home",
      posterPath: "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
      backdropPath: "/iQFcwSGbZXMkeyKrxbPnwnRo5fl.jpg",
      title: "Spider-Man: No Way Home",
      year: 2021,
      runtime: 148,
      rated: "PG-13",
      director: "Jon Watts",
      cast: ["Tom Holland", "Zendaya", "Benedict Cumberbatch", "Tom Hollander", "Jacob Batalon"],
      genres: ["Action", "Adventure", "Sci-Fi"],
      tagline: "Everyone who knows about Spider-Man is now a threat.",
      accent: "#d94a4a",
      rating: 7.5,
      reviewCount: 4120,
      criticScore: 71,
      overview:
        "With his identity exposed to the world, Peter Parker asks for help from Doctor Strange to make the world forget — and tears open the barrier between universes, summoning the villains who have learned his name.",
      pros: [
        "Tom Holland gives a complete performance across three different actors playing the same hero.",
        "No continuity error: every previous film version is treated as canon, which is audacious and works.",
        "The scene where everyone meets everyone is a thrill-ride novelty that has never been topped."
      ],
      cons: [
        "Three hours of action exhausts the audience and flattens the emotional beats around it.",
        "Strange's motivation for the entire plot is one thin line of dialogue."
      ],
      review: {
        title: "Nostalgia with the brakes off",
        author: 2,
        date: "2024-05-19",
        body: [
          "The film knows exactly what it is doing and that is both the pleasure and the problem. It is a victory lap that assumes you have been to the party for fifty years — and it works right up until the drumming arrives in act three.",
          "Tom Holland is extraordinary and Tom Hollander is funnier than anyone gives him credit for. But the plot is a dare: what if the heroes were just wrong, and nobody says so?",
          "The emotional climax arrives fifteen minutes before the credits, which is a scheduling failure, not a writing one."
        ],
        quote: "The most generous crossover ever built on a hollow premise."
      },
      breakdown: {5: 1277, 4: 1112, 3: 865, 2: 536, 1: 330}
    },
    {
      id: "parasite",
      posterPath: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
      backdropPath: "/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg",
      title: "Parasite",
      year: 2019,
      runtime: 132,
      rated: "R",
      director: "Bong Joon-ho",
      cast: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong", "Choi Woo-shik", "Park So-dam"],
      genres: ["Thriller", "Drama", "Comedy"],
      tagline: "Act like you own the place.",
      accent: "#3fbf7f",
      rating: 8.5,
      reviewCount: 4410,
      criticScore: 99,
      isTrending: true,
      overview:
        "A struggling family cons its way into the employ of a wealthy one, one household role at a time. Then a discovery in the basement rewrites the terms of the arrangement — for everyone.",
      pros: [
        "Comedy, thriller and class drama coexist without the tonal seams showing once.",
        "Every scene is staged on a single axis, so the axis flip lands as structural failure rather than sentiment.",
        "Song Kang-ho's most naturalistic performance of his career, in a role begging for caricature."
      ],
      cons: [
        "The final act escalates past the register the first ninety minutes established.",
        "Some critics found the basement reveal telegraphed by the second act."
      ],
      review: {
        title: "A thriller that keeps changing genre on you",
        author: 4,
        date: "2024-12-05",
        body: [
          "Bong has said he set out to test whether a comedy could hold a class thriller underneath it. The answer is an emphatic yes, and the trick is tonal patience — the film lets you laugh for ninety minutes while quietly assembling a staircase.",
          "The formal control is extraordinary. When the axis flips, the shock is architectural, and the violence that follows lands like a building giving way.",
          "It is the rare film where the basement is the third main character."
        ],
        quote: "Fear and comedy, sharing one set, never touching."
      },
      breakdown: {5: 2161, 4: 1235, 3: 573, 2: 265, 1: 176}
    },
    {
      id: "spirited-away",
      posterPath: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
      backdropPath: "/6oaL4DP75yABrd5EbC4H2zq5ghc.jpg",
      title: "Spirited Away",
      year: 2001,
      runtime: 125,
      rated: "PG",
      director: "Hayao Miyazaki",
      cast: ["Rumi Hiiragi", "Miyu Irino", "Mari Natsuki", "Bunta Sugawara"],
      genres: ["Animation", "Fantasy", "Adventure", "Family"],
      tagline: "The tunnel led Chihiro to a mysterious town.",
      accent: "#7a5cc4",
      rating: 8.6,
      reviewCount: 3240,
      criticScore: 97,
      overview:
        "A sulky ten-year-old wanders into a world of spirits and must work in a bathhouse for the gods to free her parents and find her way home. Growing up, it turns out, is the assignment.",
      pros: [
        "There is a sequence where a child rides a train across a flooded city alone and the film simply cuts away. Total trust in the audience.",
        "The bathhouse is a genuinely unsettling place — beautiful, crowded, and built on vanished gods.",
        "Fantasy as labour rather than decoration, treated with total seriousness."
      ],
      cons: [
        "The pacing assumes a child who is willing to wait for the quiet stretches.",
        "The final montage compresses the third act into something closer to a memory than a resolution."
      ],
      review: {
        title: "The film that remembers what children actually feel",
        author: 3,
        date: "2024-08-14",
        body: [
          "There is a scene where Chihiro rides a train across a flooded city, alone, and the film cuts away. No reaction shot, no score swell to tell you how to feel. Miyazaki trusts the image and the child watching.",
          "Twenty-five years on it has lost none of its strangeness, which is the highest compliment available to a children's film.",
          "It is about a child who gets her parents back and has to decide whether that is the point."
        ],
        quote: "A bathhouse for the gods, staffed by a sulky ten-year-old."
      },
      breakdown: {5: 1815, 4: 810, 3: 356, 2: 162, 1: 97}
    },
    {
      id: "the-shawshank-redemption",
      posterPath: "/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
      backdropPath: "/pNjh59JSxChQktamG3LMp9ZoQzp.jpg",
      title: "The Shawshank Redemption",
      year: 1994,
      runtime: 142,
      rated: "R",
      director: "Frank Darabont",
      cast: ["Tim Robbins", "Morgan Freeman", "Bob Gunton", "William Sadler", "Clancy Brown"],
      genres: ["Drama", "Crime"],
      tagline: "Fear can hold you prisoner. Hope can set you free.",
      accent: "#c4a24a",
      rating: 9.3,
      reviewCount: 6140,
      criticScore: 91,
      isTrending: true,
      overview:
        "Imprisoned for a murder he did not commit, banker Andy Dufresne forms an unlikely friendship with fellow inmate Red while quietly building a life, a library, and an elaborate escape plan inside the walls of Shawshank.",
      pros: [
        "A Stephen King novella adapted into a film that is really about time.",
        "The tax-deduction library scene is a study in institutional softness that still works.",
        "Morgan Freeman's narration is the perfect instrument: unhurried, warm, quietly furious."
      ],
      cons: [
        "The narration explains subtext that the performances have already delivered.",
        "It is sentimental in the last fifteen minutes, and knows it."
      ],
      review: {
        title: "Hope is the load-bearing wall",
        author: 1,
        date: "2024-07-30",
        body: [
          "The rock hammer is the least interesting part of the plot. The film is about a man keeping a bank of small things in his chest so that his soul does not atrophy.",
          "It sits at number one on our list for a reason that has nothing to do with craft and everything to do with nerve.",
          "Get busy living, or get busy dying."
        ],
        quote: "The most patient film ever made about the shortest distance."
      },
      breakdown: {5: 4789, 4: 860, 3: 246, 2: 184, 1: 61}
    },
    {
      id: "pulp-fiction",
      posterPath: "/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg",
      backdropPath: "/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
      title: "Pulp Fiction",
      year: 1994,
      runtime: 154,
      rated: "R",
      director: "Quentin Tarantino",
      cast: ["John Travolta", "Samuel L. Jackson", "Uma Thurman", "Bruce Willis", "Harvey Keitel"],
      genres: ["Crime", "Thriller", "Comedy", "Drama"],
      tagline: "Just because you are a character doesn't mean you have character.",
      accent: "#e2483d",
      rating: 8.9,
      reviewCount: 4890,
      criticScore: 92,
      overview:
        "The lives of two hitmen, a boxer, a gangster's wife and a pair of diner bandits collide across a handful of Los Angeles days told entirely out of order — and each thread is tugged by somebody else.",
      pros: [
        "Every character is interrupted en route somewhere else, and digression is the actual subject.",
        "A structure audacious enough to be a punchline, in chapters, and it never once feels like showing off.",
        "The dialogue is the best in modern cinema, which is why the plot can be non-linear."
      ],
      cons: [
        "Tarantino's fondness for the same word repeated eight times has aged less gracefully than the rest.",
        "The third act rushes to resolve two characters in a way the film earns but does not enjoy."
      ],
      review: {
        title: "Structure as a punchline",
        author: 0,
        date: "2024-06-21",
        body: [
          "Tarantino's real subject here is digression. Every character is on their way somewhere else, and the film is about the interruption — the wrong place at the wrong time, and what a person reveals when their plans dissolve.",
          "It works because the dialogue underneath it is so good that the cleverness never becomes the point.",
          "It remains the most influential film of the last thirty years and also, easily, the most fun to watch at 2am."
        ],
        quote: "He made cool feel like a narrative device, and then retired it."
      },
      breakdown: {5: 3227, 4: 1027, 3: 342, 2: 196, 1: 98}
    },
    {
      id: "the-godfather",
      posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
      backdropPath: "/ejdD20cdHNFAYAN2DlqPToXKyzx.jpg",
      title: "The Godfather",
      year: 1972,
      runtime: 175,
      rated: "R",
      director: "Francis Ford Coppola",
      cast: ["Marlon Brando", "Al Pacino", "James Caan", "Robert Duvall", "Diane Keaton"],
      genres: ["Crime", "Drama"],
      tagline: "An offer you can't refuse.",
      accent: "#8a3b2f",
      rating: 9.2,
      reviewCount: 5890,
      criticScore: 97,
      isTrending: true,
      overview:
        "The ageing patriarch of a New York crime dynasty tries to hold his family together while his youngest son, a man with no taste for the business, is drawn into it anyway.",
      pros: [
        "Organised exactly like a king's story — coronation, consolidation, succession, fall.",
        "Pacino's Vito is the great unfinished performance of the era, and every future declines in real time.",
        "Duvall's entrance is the finest two minutes of character introduction in film history."
      ],
      cons: [
        "Cuts the wedding scenes, so a third of the running time is setup by design.",
        "A godfather to some degree — Michael's decline is over-narrated by the direction."
      ],
      review: {
        title: "A tragedy that thinks it is about the mob",
        author: 1,
        date: "2024-04-22",
        body: [
          "Coppola said he was shooting a story about a king, and the film is organised exactly like one. The wedding in the first act is a promise that the entire family is going to be fine, delivered with a bottle of champagne in frame.",
          "Pacino's Vito is the great unfinished performance of the era. You can see every possible future for him in the first twenty minutes.",
          "It has aged into something almost unnerving. Every door is a metaphor and nobody minds."
        ],
        quote: "The one film where you feel the pull of the thing it is warning you about."
      },
      breakdown: {5: 4418, 4: 942, 3: 294, 2: 177, 1: 59}
    },
    {
      id: "whiplash",
      posterPath: "/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
      backdropPath: "/fRGxZuo7jJUWQsVg9PREb98Aclp.jpg",
      title: "Whiplash",
      year: 2014,
      runtime: 106,
      rated: "R",
      director: "Damien Chazelle",
      cast: ["Miles Teller", "J.K. Simmons", "Melissa Benoist", "Paul Reiser"],
      genres: ["Drama", "Music", "Thriller"],
      tagline: "The road to greatness can take you to the edge.",
      accent: "#c0392b",
      rating: 8.5,
      reviewCount: 3120,
      criticScore: 94,
      overview:
        "A young jazz drummer enrols at a cutthroat conservatory where an instructor's methods are indistinguishable from abuse, and he begins to wonder how much of himself he is willing to spend.",
      pros: [
        "Rehearsal sequences in unbroken takes that are physiological — you sync your breathing to the snare.",
        "Simmons is terrifying because he lowers his voice and the temperature drops with it.",
        "106 minutes, no waste, and a score that never once asks for forgiveness."
      ],
      cons: [
        "Deliberately unresolved about whether the ending is triumph or ruin.",
        "The jazz standards are excellent but the film's relationship with music is entirely functional."
      ],
      review: {
        title: "Two men, one drum, no air in the room",
        author: 0,
        date: "2023-12-19",
        body: [
          "Chazelle shoots rehearsal sequences in unbroken two- and three-minute takes and the effect is physiological. It is not editing that is filming — it is closer to being held.",
          "The ending is deliberately unresolved and has produced thirty seconds of argument ever since.",
          "It is the only film that made me check my own pulse."
        ],
        quote: "Primal, precise, and about two people who should probably stop."
      },
      breakdown: {5: 1622, 4: 874, 3: 374, 2: 156, 1: 94}
    },
    {
      id: "get-out",
      posterPath: "/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg",
      backdropPath: "/bBQHALHRAaaORlPNXv7fNcRXYdx.jpg",
      title: "Get Out",
      year: 2017,
      runtime: 104,
      rated: "R",
      director: "Jordan Peele",
      cast: ["Daniel Kaluuya", "Allison Williams", "Bradley Whitford", "Catherine Keener", "LilRel Howery"],
      genres: ["Horror", "Thriller", "Mystery"],
      tagline: "Just because you're invited, doesn't mean you're welcome.",
      accent: "#e8e4df",
      rating: 7.7,
      reviewCount: 3450,
      criticScore: 98,
      overview:
        "A young Black photographer visits his white girlfriend's family estate for the weekend and slowly realises that the warmth, the interest and the excessive accommodation are all part of a procedure.",
      pros: [
        "The Sunken Place sequence works because you have spent ninety minutes being told, politely, that everything is fine.",
        "Racism as procedural horror: a checklist of small courtesies a reasonable person would accept, because refusing would look rude.",
        "Not one beat is a jump scare."
      ],
      cons: [
        "The second act loses a nerve and the third act overshoots.",
        "Two of the three companions are functions rather than people."
      ],
      review: {
        title: "The rare horror film that is really a social thriller",
        author: 2,
        date: "2024-02-27",
        body: [
          "Peele writes the sunny surface so cheerfully that you accept the house before he makes you regret it.",
          "The horror is procedural — and the final stretch is a Saturday-morning documentary crew spliced into something it should never be near.",
          "The first ninety minutes are a masterclass in social discomfort used as a weapon."
        ],
        quote: "Peele understands that racism is often just politeness with the volume turned down."
      },
      breakdown: {5: 1346, 4: 1035, 3: 586, 2: 276, 1: 207}
    },
    {
      id: "arrival",
      posterPath: "/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg",
      backdropPath: "/8MUZz7oPXQftFTslZpRP3CVMOoq.jpg",
      title: "Arrival",
      year: 2016,
      runtime: 116,
      rated: "PG-13",
      director: "Denis Villeneuve",
      cast: ["Amy Adams", "Jeremy Renner", "Forest Whitaker", "Michael Stuhlbarg"],
      genres: ["Sci-Fi", "Drama", "Mystery"],
      tagline: "Why are they here?",
      accent: "#5c7fa3",
      rating: 7.9,
      reviewCount: 2980,
      criticScore: 94,
      overview:
        "When twelve enormous ships appear over twelve locations on Earth, a linguist is recruited to communicate — and discovers that learning their language restructures the way she experiences her own life.",
      pros: [
        "The aliens stay abstract on purpose; what matters is the light, the sound and Adams's face.",
        "A film about accepting a terrible piece of knowledge and choosing to act anyway.",
        "The eleven minutes after the landings: almost no dialogue, and it entirely works."
      ],
      cons: [
        "The central linguistic puzzle is solved by deduction the film only half-executes.",
        "Arrives soft and slow where the premise promised harder edges."
      ],
      review: {
        title: "A film about the size of a life, not a planet",
        author: 3,
        date: "2024-03-14",
        body: [
          "Villeneuve keeps the aliens abstract on purpose. The whole film is built on the idea that the biggest event in history is only ever experienced privately, one person at a time.",
          "It is a film about accepting a terrible piece of knowledge and choosing to act anyway, and it is far less interested in the world's politics than in one woman's relationship to her own daughter.",
          "The scientist is not studying the language. The language is studying her."
        ],
        quote: "It taught a generation of screenwriters to trust silence."
      },
      breakdown: {5: 1133, 4: 924, 3: 536, 2: 238, 1: 149}
    },
    {
      id: "la-la-land",
      posterPath: "/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
      backdropPath: "/nlPCdZlHtRNcF6C9hzUH4ebmV1w.jpg",
      title: "La La Land",
      year: 2016,
      runtime: 128,
      rated: "PG-13",
      director: "Damien Chazelle",
      cast: ["Ryan Gosling", "Emma Stone", "John Legend", "Rosemarie DeWitt"],
      genres: ["Romance", "Drama", "Music"],
      tagline: "Here's to the fools who dream.",
      accent: "#4a7fb5",
      rating: 8.0,
      reviewCount: 4060,
      criticScore: 88,
      isNew: true,
      overview:
        "An aspiring actress and a jazz pianist meet in Los Angeles and fall in love, discovering that talent and ambition may want different things than they do.",
      pros: [
        "A two-hour approach that pays off with one of the best sequences in modern musicals.",
        "Stone sells exhaustion as a punchline during the traffic-light improvisation.",
        "It treats the love story as real and the ending as a tragedy rather than a twist."
      ],
      cons: [
        "The score is nearly all pastiche of a fifty-year-old style.",
        "Rehearsal footage from production is almost as good as the film."
      ],
      review: {
        title: "A musical about the difference between loving and choosing",
        author: 4,
        date: "2024-08-30",
        body: [
          "People call this the film where the credits number is the twist, and it is — but the number only registers because Chazelle spent two hours teaching you to want the two of them together.",
          "It should not work. It is a high-wire act with a two-hour approach, and the whole thing is engineered by a director who knows exactly how long a shot can be held.",
          "A love story about the routes not taken, sung in full."
        ],
        quote: "Two hours of someone hoping out loud, then a number that says nothing works."
      },
      breakdown: {5: 1827, 4: 1096, 3: 568, 2: 325, 1: 244}
    },
    {
      id: "grand-budapest-hotel",
      posterPath: "/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg",
      backdropPath: "/jK65srQczOKTpW62wPxwwKztGgE.jpg",
      title: "The Grand Budapest Hotel",
      year: 2014,
      runtime: 100,
      rated: "R",
      director: "Wes Anderson",
      cast: ["Ralph Fiennes", "Tony Revolori", "Saoirse Ronan", "Adrien Brody", "Willem Dafoe"],
      genres: ["Comedy", "Drama", "Adventure"],
      tagline: "A perfect holiday without leaving home.",
      accent: "#d1607e",
      rating: 8.1,
      reviewCount: 2740,
      criticScore: 92,
      overview:
        "A legendary concierge and his lobby boy are framed for murder and race across a fictional European republic, while the story of the hotel's founding emerges in three different visual registers.",
      pros: [
        "Aspect ratio used as a moral argument: as the world degrades, so does the image.",
        "Wickedly funny, which people forget because it is so precisely composed.",
        "Dafoe delivers the best lines in the film while looking like a disappointed ferret."
      ],
      cons: [
        "The emotional centre arrives by accident rather than by design.",
        "A film that would fall apart if it were not photographed so exquisitely."
      ],
      review: {
        title: "A comedy with an actual pulse under it",
        author: 2,
        date: "2024-06-04",
        body: [
          "The three-format structure sounds like a gimmick and is in fact a thesis. As the world degrades, so does the image — and you feel it before you can articulate it.",
          "The hidden centre of the story, what Zero and Gustave actually feel, arrives almost by accident and breaks you.",
          "Aspect ratio as a moral argument."
        ],
        quote: "The rare comedy with a real wound underneath it."
      },
      breakdown: {5: 1205, 4: 822, 3: 384, 2: 192, 1: 137}
    },
    {
      id: "oppenheimer",
      posterPath: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      backdropPath: "/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg",
      title: "Oppenheimer",
      year: 2023,
      runtime: 181,
      rated: "R",
      director: "Christopher Nolan",
      cast: ["Cillian Murphy", "Emily Blunt", "Robert Downey Jr.", "Matt Damon", "Florence Pugh"],
      genres: ["Drama", "History", "Thriller"],
      tagline: "The world forever changes.",
      accent: "#e07b39",
      rating: 8.3,
      reviewCount: 4370,
      criticScore: 93,
      isNew: true,
      isTrending: true,
      overview:
        "The physicist who led the Manhattan Project builds the weapon, wins the war, and then spends the rest of his life answering for it — through hearings, headlines, and the threat of a security revocation.",
      pros: [
        "A security hearing rendered with the exact tension of a courtroom thriller, and Nolan never raises his voice.",
        "The Trinity sequence keeps the bomb offscreen and is far more frightening for it.",
        "Cillian Murphy appears to have been assembled from the archival photographs."
      ],
      cons: [
        "Three hours in which the interrogation scenes repeat a similar trick three times.",
        "The patriotic score is loud enough to become the loudest character."
      ],
      review: {
        title: "Three hours, no wasted minute, and a nuclear thriller inside",
        author: 0,
        date: "2024-08-11",
        body: [
          "The Trinity sequence is the set-piece everyone remembers, but the real achievement is the second act: a security hearing where a physicist is grilled about his left-wing reading habits.",
          "Three hours is a long time. The thing that saves it is that the third act is a genuine reckoning rather than a victory lap, which is more than the genre usually promises.",
          "Nolan turns a security hearing into a thriller without once reaching for volume."
        ],
        quote: "A biopic that doubles as a procedural and never cheats on either."
      },
      breakdown: {5: 2185, 4: 1180, 3: 568, 2: 262, 1: 175}
    },
    {
      id: "top-gun-maverick",
      posterPath: "/n0YuM4f5lvGAP6MAW2kBIzugXnc.jpg",
      backdropPath: "/AaV1YIdWKnjAIAOe8UUKBFm327v.jpg",
      title: "Top Gun: Maverick",
      year: 2022,
      runtime: 130,
      rated: "PG-13",
      director: "Joseph Kosinski",
      cast: ["Tom Cruise", "Miles Teller", "Jennifer Connelly", "Jon Hamm", "Glen Powell"],
      genres: ["Action", "Drama"],
      tagline: "This is an authorized training exercise.",
      accent: "#3d7fc1",
      rating: 8.2,
      reviewCount: 3810,
      criticScore: 91,
      isNew: true,
      isTrending: true,
      overview:
        "After thirty years as a test pilot, Maverick returns to train a group of graduates for a mission with almost no margin — including the son of his dead friend, who has to decide whether fearlessness is a gift or a symptom.",
      pros: [
        "Aerial photography shot practically with nose-mounted cameras, and the sound mix puts you in the canopy.",
        "It treats the original as a period piece, and therefore as something to update rather than repeat.",
        "The last twenty minutes make a beach fist-bump feel like the payoff of a career arc."
      ],
      cons: [
        "Blockbuster deference and Tom Cruise's immaculate hair make it occasionally insufferable.",
        "A '90s plot in a '90s film, including a defence lawyer with a conscience."
      ],
      review: {
        title: "A sequel that understands sequels are about time",
        author: 2,
        date: "2024-07-05",
        body: [
          "Kosinski treats the first film as a period piece and its sequel as an inheritance — Rooster is a character who exists to be both the great pilot and the warning.",
          "It is the best flying in cinema since the actual flying scenes in Top Gun, which is a sentence nobody expected to write.",
          "A sequel with a pulse, an argument, and an unexpectedly moving final act."
        ],
        quote: "It is a legacy film that is aware it is one."
      },
      breakdown: {5: 1943, 4: 991, 3: 457, 2: 229, 1: 190}
    },
    {
      id: "avatar-the-way-of-water",
      posterPath: "/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
      backdropPath: "/kJsPVzdyBrYHLomuNv5SJDXUQ2f.jpg",
      title: "Avatar: The Way of Water",
      year: 2022,
      runtime: 192,
      rated: "PG-13",
      director: "James Cameron",
      cast: ["Sam Worthington", "Zoe Saldaña", "Sigourney Weaver", "Stephen Oyelowo", "Wes Studi"],
      genres: ["Sci-Fi", "Action", "Adventure", "Drama"],
      tagline: "The way is clear.",
      accent: "#2fa5c9",
      rating: 7.6,
      reviewCount: 4180,
      criticScore: 75,
      isNew: true,
      overview:
        "The Sully family flees the destruction of their forest home into the oceans of Pandora, where a clan of reef people must decide whether the refugees are worth saving.",
      pros: [
        "A purpose-built virtual camera so the cast could actually swim, and it shows in every frame.",
        "Underwater photography that is genuinely unrepeatable — macro, drone and live-action in one seamless space.",
        "A production achievement worth studying in its own right."
      ],
      cons: [
        "The screenplay treats its characters as terrain, and abandons Jake's arc inside the first hour.",
        "Three hours and twelve minutes of largely passive spectacle."
      ],
      review: {
        title: "Technically unprecedented, dramatically waterlogged",
        author: 3,
        date: "2024-05-08",
        body: [
          "Cameron invented a virtual camera system so the performers could actually swim, and the achievement is real — you never see a human actor floating above a CG horizon.",
          "The problem is that the script treats its characters as terrain. By the reef sequences the film has lost the one thread that made its predecessor work.",
          "Watch it for the photography. Do not watch it for a story, because there is not one."
        ],
        quote: "The most beautiful footage ever shot in a film that needed a script."
      },
      breakdown: {5: 1338, 4: 1254, 3: 836, 2: 460, 1: 292}
    },
    {
      id: "knives-out",
      posterPath: "/pThyQovXQrw2m0s9x82twj48Jq4.jpg",
      backdropPath: "/4HWAQu28e2yaWrtupFPGFkdNU7V.jpg",
      title: "Knives Out",
      year: 2019,
      runtime: 130,
      rated: "PG-13",
      director: "Rian Johnson",
      cast: ["Daniel Craig", "Ana de Armas", "Chris Evans", "Jamie Lee Curtis", "Christopher Plummer"],
      genres: ["Mystery", "Comedy", "Crime", "Thriller"],
      tagline: "Hell, any of them could have done it.",
      accent: "#8f4a3c",
      rating: 7.9,
      reviewCount: 3350,
      criticScore: 97,
      isNew: true,
      overview:
        "A famous novelist dies the night after his birthday party, his family suspects each other, and a very unbothered private detective arrives to find out which of them did it.",
      pros: [
        "A real puzzle, honestly constructed — the motive boards are truthful and the answer is deducible.",
        "Evans delivers ten seconds of pure physical comedy inside a murder mystery.",
        "It is a comedy with a body count and it never lets the two tones touch."
      ],
      cons: [
        "The detective is a cipher for two hours before becoming the film's funniest element.",
        "The film outstays its ending by fifteen minutes."
      ],
      review: {
        title: "A whodunit that trusts the audience completely",
        author: 1,
        date: "2024-04-03",
        body: [
          "Johnson structures it as an actual puzzle — everyone has a motive, the motive boards are honest, and the sleuth's conclusion is genuinely deducible from the evidence on screen. Most mysteries cheat. This one shows its work and still lands.",
          "The real trick is that it is a comedy with a body count, and it never lets the two tones touch.",
          "Proof that fair-play mysteries and jokes are not mutually exclusive."
        ],
        quote: "Everyone has a motive, which is either a fair clue or lazy writing. Here it is both."
      },
      breakdown: {5: 1340, 4: 1039, 3: 536, 2: 268, 1: 167}
    },
    {
      id: "the-social-network",
      posterPath: "/n0ybibhJtQ5icDqTp8eRytcIHJx.jpg",
      backdropPath: "/1PXwh3nJzgRkkYnqfWInJNypeL4.jpg",
      title: "The Social Network",
      year: 2010,
      runtime: 120,
      rated: "PG-13",
      director: "David Fincher",
      cast: ["Jesse Eisenberg", "Andrew Garfield", "Justin Timberlake", "Armie Hammer", "Max Minghella"],
      genres: ["Drama", "Biography", "History"],
      tagline: "You don't get to 500 million friends without making a few enemies.",
      accent: "#2f6b9c",
      rating: 7.8,
      reviewCount: 2940,
      criticScore: 82,
      overview:
        "The rise of a college campus social network told through two depositions — one of them about a girl who was also his lawyer's best friend and is now suing him.",
      pros: [
        "Structure as argument: two hearings, cross-cut, the past arriving in tiny shards.",
        "Fincher treats a deposition the way he treats a heist — as a sequence of controlled losses.",
        "The famous opening is a thesis, not a showy piece of business: you cannot have a social network, people are the product."
      ],
      cons: [
        "Nail through a board — the legal plot has no interest in the law.",
        "Cold to the point of emotional stasis for the full two hours."
      ],
      review: {
        title: "A friendship film that happens to be a deposition",
        author: 0,
        date: "2024-03-28",
        body: [
          "It is a movie about how fast a friendship can rot when money arrives faster than character.",
          "Fincher and his cinematographer are the same age and this film is exactly as cold, exact and emotionally withholding as his work.",
          "Eisenberg's charisma and self-sabotage in a single performance."
        ],
        quote: "Two hours of people proving they are bad at friendship."
      },
      breakdown: {5: 1058, 4: 911, 3: 559, 2: 265, 1: 147}
    },
    {
      id: "coco",
      posterPath: "/6Ryitt95xrO8KXuqRGm1fUuNwqF.jpg",
      backdropPath: "/g7CHF8gTLGooTbP4GznIGwaqAGL.jpg",
      title: "Coco",
      year: 2017,
      runtime: 105,
      rated: "PG",
      director: "Lee Unkrich & Adrian Molina",
      cast: ["Anthony Gonzalez", "Gael García Bernal", "Benjamin Bratt", "Alanna Ubach"],
      genres: ["Animation", "Family", "Fantasy", "Music"],
      tagline: "The celebration of a lifetime.",
      accent: "#e8994a",
      rating: 8.4,
      reviewCount: 3560,
      criticScore: 97,
      isNew: true,
      overview:
        "A boy from a family that has banned music discovers that in an afterlife of marigold bridges he can cross into the Land of the Dead, and try to find a great-great-grandfather he has never heard of.",
      pros: [
        "A family tree so traumatised by one murder it has taken the music out of its life — and the film takes that completely seriously.",
        "The Land of the Dead is designed as a working city with real infrastructure.",
        "It is sadder than it needs to be, and one scene will be very difficult for anyone who has lost someone."
      ],
      cons: [
        "Hector's emotional turn arrives a little too neatly.",
        "Mid-film, the chase between two worlds becomes repetitive."
      ],
      review: {
        title: "A grief story with music in it, which is harder than it sounds",
        author: 4,
        date: "2024-01-30",
        body: [
          "The Land of the Dead is designed as a working city with a real economy, which is a wonderful idea that only about three animated films have ever used.",
          "It is sadder than it needs to be, and there is a scene — I will not spoil it — that is going to be very difficult for anyone who has lost someone.",
          "The Land of the Dead should be the theme park everyone ever builds."
        ],
        quote: "Every family has a song it stopped singing. This is about recovering it."
      },
      breakdown: {5: 1887, 4: 926, 3: 427, 2: 178, 1: 142}
    },
    {
      id: "se7en",
      posterPath: "/191nKfP0ehp3uIvWqgPbFmI4lv9.jpg",
      backdropPath: "/i5H7zusQGsysGQ8i6P361Vnr0n2.jpg",
      title: "Se7en",
      year: 1995,
      runtime: 127,
      rated: "R",
      director: "David Fincher",
      cast: ["Brad Pitt", "Morgan Freeman", "Gwyneth Paltrow", "Kevin Spacey", "R. Lee Ermey"],
      genres: ["Crime", "Thriller", "Mystery", "Horror"],
      tagline: "Seven deadly sins. Seven ways to die.",
      accent: "#6b7280",
      rating: 8.6,
      reviewCount: 4230,
      criticScore: 82,
      overview:
        "A retiring detective and his impatient replacement track a methodical killer who is working through the seven deadly sins in a city that will not stop raining.",
      pros: [
        "The detective and the killer want exactly the same thing and are therefore never distinguishable.",
        "Filmed so dark that the basement scenes are genuinely hard to read, and it works.",
        "Still the best pure plot in American cinema since Chinatown."
      ],
      cons: [
        "The ending leans on an intertitle when the image had already done the job.",
        "Fincher never made a blacker film and it is not quite the achievement it appears."
      ],
      review: {
        title: "The last film Fincher made that could genuinely surprise you",
        author: 3,
        date: "2023-11-20",
        body: [
          "Fincher's third film is still the one that feels like a thriller rather than a diagram of one. The movie never gives you a reason to prefer the detective.",
          "It is shot so dark that the basement scenes are genuinely difficult to read, and the reference at the end is one of the few times a film has earned a jump scare with a subtitle.",
          "Gwyneth Paltrow is unfairly maligned for it. Her one scene is the best thing in the movie."
        ],
        quote: "Still the best pure plot in American cinema since Chinatown."
      },
      breakdown: {5: 2327, 4: 1100, 3: 465, 2: 211, 1: 127}
    },
    {
      id: "blade-runner-2049",
      posterPath: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
      backdropPath: "/gNdLJU9TxrpGx4dkZidjys3fyy0.jpg",
      title: "Blade Runner 2049",
      year: 2017,
      runtime: 164,
      rated: "R",
      director: "Denis Villeneuve",
      cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas", "Sylvia Hoeks", "Jared Leto"],
      genres: ["Sci-Fi", "Drama", "Mystery", "Thriller"],
      tagline: "The key to the future is finally unearthed.",
      accent: "#3d8f9c",
      rating: 8.0,
      reviewCount: 2870,
      criticScore: 88,
      overview:
        "A young blade runner unearths a long-buried secret that leads him to track down a former blade runner missing for thirty years — and to ask whether any of it can be repaired.",
      pros: [
        "Understands exactly one thing about the first film: it is not about replicants, it is about memory.",
        "The Greek detective structure — returns home, learns he was wrong about everything.",
        "Deakins lets colour in like daylight after weeks underground."
      ],
      cons: [
        "Slower than people remember and sadder than people admit.",
        "A supporting character is given a mystique that the third act then uses up."
      ],
      review: {
        title: "A sequel that is a poem pretending to be a thriller",
        author: 2,
        date: "2024-11-05",
        body: [
          "Villeneuve made the sequel a film about memory, and the structure is Greek — a detective returns home and learns he was wrong about everything.",
          "Deakins shoots in near-monochrome for the first act and then, when Gosling reaches the orange-walled apartment, lets colour in. It is the most dramatic colour reveal in recent cinema and nobody noticed.",
          "It is slower than people remember and much sadder than people admit."
        ],
        quote: "Deakins paints with restraint. The last shot should be illegal."
      },
      breakdown: {5: 1205, 4: 832, 3: 431, 2: 230, 1: 172}
    },
    {
      id: "mad-max-fury-road",
      posterPath: "/ulcAi4dKpAjHwYGS08vNyx9H6I9.jpg",
      backdropPath: "/gqrnQA6Xppdl8vIb2eJc58VC1tW.jpg",
      title: "Mad Max: Fury Road",
      year: 2015,
      runtime: 120,
      rated: "R",
      director: "George Miller",
      cast: ["Tom Hardy", "Charlize Theron", "Nicholas Hoult", "Hugh Keays-Byrne"],
      genres: ["Action", "Adventure", "Sci-Fi"],
      tagline: "What a lovely day.",
      accent: "#d9662b",
      rating: 8.1,
      reviewCount: 3640,
      criticScore: 97,
      isTrending: true,
      overview:
        "In a scorched wasteland, Max joins Furiosa, a woman fleeing a tyrant across the desert in a thousand-speed war rig, while the tyrant sends a horde of war boys and one very committed priest after her.",
      pros: [
        "The most technically alive action film of its era, made by a seventy-year-old.",
        "Gravity as a collaborator rather than an obstacle — the stunts read as heavy because they are heavy.",
        "Theron plays her entire arc with posture and says almost nothing."
      ],
      cons: [
        "The villain is a sketch, and you feel every gap in his plan.",
        "Nineteen minutes of chase become twenty-two minutes of very similar chase."
      ],
      review: {
        title: "Two hours of the most honest action ever filmed",
        author: 4,
        date: "2024-05-16",
        body: [
          "George Miller is making the most technically alive action film of his career, and the film's superpower is that it is not actually about action. Max is broken and is not going to be fixed by a great escape. That is the plot.",
          "It is the rare action movie that understands gravity as a collaborator, and the sound mix puts the engine in your chest.",
          "Every frame is choreographed. Most action films are merely filmed."
        ],
        quote: "An action film where the quiet parts are the most memorable."
      },
      breakdown: {5: 1711, 4: 1055, 3: 473, 2: 255, 1: 146}
    },
    {
      id: "everything-everywhere",
      posterPath: "/u68AjlvlutfEIcpmbYpKcdi09ut.jpg",
      backdropPath: "/fIwiFha3WPu5nHkBeMQ4GzEk0Hv.jpg",
      title: "Everything Everywhere All at Once",
      year: 2022,
      runtime: 139,
      rated: "R",
      director: "Daniel Kwan & Daniel Scheinert",
      cast: ["Michelle Yeoh", "Ke Huy Quan", "Stephanie Hsu", "Jamie Lee Curtis", "James Hong"],
      genres: ["Sci-Fi", "Comedy", "Action", "Drama"],
      tagline: "The universe is so much bigger than you realise.",
      accent: "#b45cd6",
      rating: 8.0,
      reviewCount: 3510,
      criticScore: 94,
      isNew: true,
      overview:
        "A laundromat owner who is terrible at nearly everything discovers she must connect with parallel-universe versions of herself to stop a threat that endangers every version of existence.",
      pros: [
        "Every alternative universe is worse than the one she started in, which converts a bag of skits into an argument.",
        "Yeoh gets the performance of her career and Curtis finally gets to be funny and terrifying at once.",
        "The bagels are the whole movie, and they are both the solution and the flaw."
      ],
      cons: [
        "Two hours and nineteen minutes, several of which are lost to fight staging that dissolves.",
        "The father-daughter ending is the one sequence that does not know what it is."
      ],
      review: {
        title: "The most generous film ever made about being a mediocre person",
        author: 4,
        date: "2024-01-09",
        body: [
          "The obvious trap for a multiverse comedy is that the alternative lives become a catalogue of cool party tricks. Kwan and Scheinert walk straight past it.",
          "That single decision converts a bag-of-skits film into an argument.",
          "A comedy about the parts of your life that did not get the memo."
        ],
        quote: "Two priests, one fistfight, and the year's best comedy ending."
      },
      breakdown: {5: 1580, 4: 1018, 3: 526, 2: 246, 1: 140}
    },
    {
      id: "nope",
      posterPath: "/AcKVlWaNVVVFQwro3nLXqPljcYA.jpg",
      backdropPath: "/yRutvYkM3OP8N9oqqfjSK1VC7fs.jpg",
      title: "Nope",
      year: 2022,
      runtime: 130,
      rated: "R",
      director: "Jordan Peele",
      cast: ["Daniel Kaluuya", "Keke Palmer", "Steven Yeun", "Michael Rooker"],
      genres: ["Horror", "Mystery", "Sci-Fi"],
      tagline: "What's a bad miracle?",
      accent: "#6d4a8f",
      rating: 6.8,
      reviewCount: 1780,
      criticScore: 73,
      isNew: true,
      overview:
        "Two brothers on a remote California ranch try to capture footage of the thing in the clouds above them — and gradually understand that it is capturing them.",
      pros: [
        "The cloud silhouette is the best design work of the year, and the Academy-ratio framing suits it perfectly.",
        "A correct, unnerving study of the apparatus of belief — cameras, screens, and the man who does the maths.",
        "The opening is one of the decade's great directorial statements."
      ],
      cons: [
        "Tells you what the film means in the first twenty minutes, then explains it again in the third act.",
        "The two killer moments are separated by a Wikipedia entry.",
        "The final shot is the career's best image, wasted on fifteen minutes of over-explaining."
      ],
      review: {
        title: "A gorgeous idea filmed by a very literal filmmaker",
        author: 1,
        date: "2024-02-11",
        body: [
          "The central idea is first rate: a rancher raises horses to make an animal-shaped cloud, and the creature descends in response to the spectacle. And the film is shot in Academy ratio and looks superb doing it.",
          "The problem is that Peele tells you what the film means in the first twenty minutes and then explains it again in the third act.",
          "The cloud silhouette is the best design work of 2022. The screenplay wasted it."
        ],
        quote: "It spends its last fifteen minutes explaining an image instead of landing it."
      },
      breakdown: {5: 427, 4: 463, 3: 427, 2: 267, 1: 196}
    },
    {
      id: "zone-of-interest",
      posterPath: "/hUu9zyZmDd8VZegKi1iK1Vk0RYS.jpg",
      backdropPath: "/pnTSOKcYnvdpQNQElAtJM1rWOxH.jpg",
      title: "The Zone of Interest",
      year: 2023,
      runtime: 105,
      rated: "PG-13",
      director: "Jonathan Glazer",
      cast: ["Christian Friedel", "Sandra Hüller", "Medusa Knopf", "Johann Karthaus"],
      genres: ["Drama", "History", "Thriller"],
      tagline: "Told from the point of view of the perpetrators.",
      accent: "#7f8c6a",
      rating: 7.1,
      reviewCount: 1140,
      criticScore: 85,
      isNew: true,
      overview:
        "The commandant of Auschwitz and his wife build a pleasant house and garden next door to the camp, and the film is about that house — the sounds that drift across the wall, and the deliberate refusal to cross it.",
      pros: [
        "An extraordinarily formal trap: no victim is ever shown, and the banality is the entire argument.",
        "The sound design is the review — screams at the garden wall, and nobody in frame reacts.",
        "The only film on this list that is genuinely hard to sit through, and the one that most deserves the discomfort."
      ],
      cons: [
        "Deliberately resists engagement, which will read as coldness to some viewers.",
        "Without its final intertitle it would risk being mistaken for a garden film."
      ],
      review: {
        title: "The hardest cut in modern cinema",
        author: 0,
        date: "2024-04-17",
        body: [
          "Glazer has engineered a trap: the camera never goes inside the camp, never shows a victim, never gives the audience a single image of atrocity. It stays in the garden with the commandant.",
          "Screams are audible at the garden wall and nobody in frame reacts. The immensity of that detail is the film.",
          "No victim is ever shown. That omission is the review."
        ],
        quote: "The sounds at the wall are more explicit than anything on screen."
      },
      breakdown: {5: 308, 4: 308, 3: 273, 2: 148, 1: 103}
    }
  ];

  /* ---------------------------------------------------------------------------
     DERIVED HELPERS — computed once, used by every page.
  --------------------------------------------------------------------------- */

  /** Rating buckets used by the filter controls on the Movies page. */
  const SCORE_TIERS = [
    { id: "9", label: "Masterpiece", hint: "9.0 and above", min: 9.0, max: 10 },
    { id: "8", label: "Excellent", hint: "8.0 – 8.9", min: 8.0, max: 8.9 },
    { id: "7", label: "Very good", hint: "7.0 – 7.9", min: 7.0, max: 7.9 },
    { id: "6", label: "Mixed", hint: "below 7.0", min: 0, max: 6.9 }
  ];

  /** Every genre, A–Z, with how many films carry it. */
  function genreIndex() {
    const counts = new Map();
    MOVIES.forEach((m) => m.genres.forEach((g) => counts.set(g, (counts.get(g) || 0) + 1)));
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }

  /** Every release year, newest first. */
  function yearIndex() {
    return Array.from(new Set(MOVIES.map((m) => m.year))).sort((a, b) => b - a);
  }

  /** Converts a 0–10 score to a 5-star value for the visual star rows. */
  function toFiveStars(rating) {
    return Math.round((rating / 10) * 5 * 2) / 2;
  }

  /* --- artwork -------------------------------------------------------------
   * Precedence, and it matters which way round:
   *
   *   1. TMDB artwork (posterPath / backdropPath on the record)
   *   2. the generated local SVG
   *   3. the generic placeholder (api.fallbackPoster())
   *
   * The real key art comes first because the generated SVGs are typographic -
   * a title set in large type on a flat field. They exist so a card is never
   * empty, not as artwork in their own right, so showing one in place of a
   * poster that exists is the wrong trade. Previously step 1 did not exist for
   * the bundled catalogue at all, which is why Home (fed by live TMDB lists)
   * showed real posters while Movies and Reviews showed generated title art:
   * same renderer, different records.
   *
   * The TMDB path is joined to the CDN here rather than left for api.js, because
   * these helpers are the single artwork source for every page and must not
   * depend on a module that loads later. Sizes match api.js: w342 for a poster,
   * w780 for a backdrop.
   */
  const POSTER_DIR = "images/movie-posters";
  const BANNER_DIR = "images/banners";
  const TMDB_CDN = "https://image.tmdb.org/t/p";

  const tmdbImage = (path, size) => (path && path.indexOf("/") === 0 ? TMDB_CDN + "/" + size + path : "");

  function posterFor(movie) {
    if (!movie) return "";
    return tmdbImage(movie.posterPath, "w342") || (movie.id ? `${POSTER_DIR}/${movie.id}.svg` : "");
  }

  function bannerFor(movie) {
    if (!movie) return "";
    return tmdbImage(movie.backdropPath, "w780") || (movie.id ? `${BANNER_DIR}/${movie.id}.svg` : "");
  }

  /** The generated local SVG, for when TMDB art is wanted to be skipped. */
  function localPosterFor(movie) {
    return movie && movie.id ? `${POSTER_DIR}/${movie.id}.svg` : "";
  }

  function localBannerFor(movie) {
    return movie && movie.id ? `${BANNER_DIR}/${movie.id}.svg` : "";
  }

  /** Absolute version, needed when a page lives in a subfolder. */
  function asset(path, pageDepth) {
    return pageDepth ? "../".repeat(pageDepth) + path : path;
  }

  /* --- lookups -------------------------------------------------------------- */
  function byId(id) {
    if (!id) return null;
    return MOVIES.find((m) => m.id === String(id).trim().toLowerCase()) || null;
  }

  /** Resolves the critic record behind a review block. */
  function criticFor(index) {
    return CRITICS[((index % CRITICS.length) + CRITICS.length) % CRITICS.length];
  }

  /** Editorial reviews, newest first. */
  function allReviews() {
    return MOVIES.map((movie) => ({ movie, review: movie.review }))
      .sort((a, b) => (a.review.date < b.review.date ? 1 : -1));
  }

  /** Movies matching a partial title / director / cast / genre query. */
  function search(query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return MOVIES.slice();
    return MOVIES.filter((m) => {
      const haystack = [
        m.title,
        m.director,
        m.tagline,
        m.genres.join(" "),
        m.cast.join(" "),
        String(m.year)
      ]
        .join(" ")
        .toLowerCase();
      return q.split(/\s+/).every((token) => haystack.includes(token));
    });
  }

  /**
   * Related titles, ranked by shared genre then shared director/cast.
   * Used for the "Related Movies" block on the details page.
   */
  function related(movie, limit) {
    const pool = MOVIES.filter((m) => m.id !== movie.id);
    const score = (m) => {
      let s = m.genres.filter((g) => movie.genres.includes(g)).length * 3;
      if (m.director === movie.director) s += 4;
      s += m.cast.filter((c) => movie.cast.includes(c)).length * 2;
      const gap = Math.abs(m.year - movie.year);
      s += Math.max(0, 3 - gap / 6);
      return s;
    };
    return pool
      .map((m) => ({ m, s: score(m) }))
      .sort((a, b) => b.s - a.s || b.m.rating - a.m.rating)
      .slice(0, limit || 4)
      .map((x) => x.m);
  }

  /** Ranked lists used by the Home page. */
  function trending(limit) {
    return MOVIES.filter((m) => m.isTrending)
      .slice()
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, limit || 8);
  }

  function topRated(limit) {
    return MOVIES.slice()
      .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
      .slice(0, limit || 8);
  }

  function justReleased(limit) {
    return MOVIES.filter((m) => m.isNew)
      .sort((a, b) => b.year - a.year || b.rating - a.rating)
      .slice(0, limit || 8);
  }

  /** The single hero film. */
  function featured() {
    return MOVIES.find((m) => m.isFeatured) || topRated(1)[0];
  }

  /** Formats 148 → "2h 28m". */
  function runtimeLabel(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h + "h " + String(m).padStart(2, "0") + "m";
  }

  /** Formats an ISO date as "18 November 2024". */
  function formatDate(iso) {
    const parts = String(iso).split("-");
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return Number(parts[2]) + " " + months[Number(parts[1]) - 1] + " " + Number(parts[0]);
  }

  /* ---------------------------------------------------------------------------
     PUBLIC SURFACE
  --------------------------------------------------------------------------- */
  window.CR = window.CR || {};
  window.CR.data = {
    movies: MOVIES,
    critics: CRITICS,
    scoreTiers: SCORE_TIERS,
    genreIndex,
    yearIndex,
    toFiveStars,
    posterFor,
    bannerFor,
    localPosterFor,
    localBannerFor,
    asset,
    byId,
    criticFor,
    allReviews,
    search,
    related,
    trending,
    topRated,
    justReleased,
    featured,
    runtimeLabel,
    formatDate
  };
})();
