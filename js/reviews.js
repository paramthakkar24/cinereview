/* =============================================================================
   CineReview — our own review text
   -----------------------------------------------------------------------------
   GENERATED FILE — do not edit by hand.
   Rebuild with:  node tools/build-reviews.mjs
   Source prose:  js/data.js  (edited there, not here)
   TMDB ids:      tools/tmdb-id-map.json  (produced by tools/link-tmdb-ids.mjs)

   This module holds editorial only: headlines, body copy, pull quotes, pros and
   cons, and who wrote them. It is deliberately free of TMDB-sourced fields so
   the two concerns never get tangled. The only TMDB value here is the numeric
   movie id, used purely as the join key.

   A TMDB movie with no entry here is not an error. js/api.js reports it and the
   pages fall back to showing the TMDB synopsis instead of inventing a review.
   ========================================================================== */

(function () {
  "use strict";

  /** Critics who write for CineReview. */
  var CRITICS = [
    {
      "name": "Maya Raghunathan",
      "role": "Senior Critic",
      "initials": "MR"
    },
    {
      "name": "Daniel Okafor",
      "role": "Staff Writer",
      "initials": "DO"
    },
    {
      "name": "Sofia Lindqvist",
      "role": "Contributing Editor",
      "initials": "SL"
    },
    {
      "name": "Kenji Arakawa",
      "role": "Film Programme",
      "initials": "KA"
    },
    {
      "name": "Priya Raman",
      "role": "Managing Editor",
      "initials": "PR"
    }
  ];

  /** Keyed by TMDB movie id. 28 reviews. */
  var BY_ID = {
    "129": {
      "tmdbId": 129,
      "slug": "spirited-away",
      "headline": "The film that remembers what children actually feel",
      "body": [
        "There is a scene where Chihiro rides a train across a flooded city, alone, and the film cuts away. No reaction shot, no score swell to tell you how to feel. Miyazaki trusts the image and the child watching.",
        "Twenty-five years on it has lost none of its strangeness, which is the highest compliment available to a children's film.",
        "It is about a child who gets her parents back and has to decide whether that is the point."
      ],
      "quote": "A bathhouse for the gods, staffed by a sulky ten-year-old.",
      "critic": {
        "name": "Kenji Arakawa",
        "role": "Film Programme",
        "initials": "KA"
      },
      "date": "2024-08-14",
      "score": 8.6,
      "pros": [
        "There is a sequence where a child rides a train across a flooded city alone and the film simply cuts away. Total trust in the audience.",
        "The bathhouse is a genuinely unsettling place — beautiful, crowded, and built on vanished gods.",
        "Fantasy as labour rather than decoration, treated with total seriousness."
      ],
      "cons": [
        "The pacing assumes a child who is willing to wait for the quiet stretches.",
        "The final montage compresses the third act into something closer to a memory than a resolution."
      ],
      "breakdown": {
        "1": 97,
        "2": 162,
        "3": 356,
        "4": 810,
        "5": 1815
      }
    },
    "155": {
      "tmdbId": 155,
      "slug": "the-dark-knight",
      "headline": "The film that made comic books take themselves seriously",
      "body": [
        "Every entry in this series is a procedural. This is the only one that is a tragedy, and the difference is entirely Heath Ledger. His Joker exists to prove that decent people will bargain with him, every single time, for the right price.",
        "Nolan refuses the shortcut. There is a scene, roughly two-thirds in, that simply sits with Dent in a hospital bed while a detonator counts down. Nothing explodes. The tension is entirely moral.",
        "Gotham gets a skyline. Ledger gives it weather."
      ],
      "quote": "Ledger plays the Joker like he is auditing the rest of us.",
      "critic": {
        "name": "Sofia Lindqvist",
        "role": "Contributing Editor",
        "initials": "SL"
      },
      "date": "2024-10-02",
      "score": 9,
      "pros": [
        "Heath Ledger's Joker has no origin, no plan and no interest in money — he is an argument, not a character.",
        "The hospital detonator scene denies the audience a cut and is the highest-tension three minutes in comic-book cinema.",
        "Nolan shoots Gotham like a real city that has to be maintained, not a studio backlot."
      ],
      "cons": [
        "Two-faced gets sidelined for whole stretches, which quietly breaks the plot the first act sets up.",
        "The overlong runtime is only forgivable because the third act earns it."
      ],
      "breakdown": {
        "1": 56,
        "2": 169,
        "3": 337,
        "4": 1068,
        "5": 3990
      }
    },
    "238": {
      "tmdbId": 238,
      "slug": "the-godfather",
      "headline": "A tragedy that thinks it is about the mob",
      "body": [
        "Coppola said he was shooting a story about a king, and the film is organised exactly like one. The wedding in the first act is a promise that the entire family is going to be fine, delivered with a bottle of champagne in frame.",
        "Pacino's Vito is the great unfinished performance of the era. You can see every possible future for him in the first twenty minutes.",
        "It has aged into something almost unnerving. Every door is a metaphor and nobody minds."
      ],
      "quote": "The one film where you feel the pull of the thing it is warning you about.",
      "critic": {
        "name": "Daniel Okafor",
        "role": "Staff Writer",
        "initials": "DO"
      },
      "date": "2024-04-22",
      "score": 9.2,
      "pros": [
        "Organised exactly like a king's story — coronation, consolidation, succession, fall.",
        "Pacino's Vito is the great unfinished performance of the era, and every future declines in real time.",
        "Duvall's entrance is the finest two minutes of character introduction in film history."
      ],
      "cons": [
        "Cuts the wedding scenes, so a third of the running time is setup by design.",
        "A godfather to some degree — Michael's decline is over-narrated by the direction."
      ],
      "breakdown": {
        "1": 59,
        "2": 177,
        "3": 294,
        "4": 942,
        "5": 4418
      }
    },
    "278": {
      "tmdbId": 278,
      "slug": "the-shawshank-redemption",
      "headline": "Hope is the load-bearing wall",
      "body": [
        "The rock hammer is the least interesting part of the plot. The film is about a man keeping a bank of small things in his chest so that his soul does not atrophy.",
        "It sits at number one on our list for a reason that has nothing to do with craft and everything to do with nerve.",
        "Get busy living, or get busy dying."
      ],
      "quote": "The most patient film ever made about the shortest distance.",
      "critic": {
        "name": "Daniel Okafor",
        "role": "Staff Writer",
        "initials": "DO"
      },
      "date": "2024-07-30",
      "score": 9.3,
      "pros": [
        "A Stephen King novella adapted into a film that is really about time.",
        "The tax-deduction library scene is a study in institutional softness that still works.",
        "Morgan Freeman's narration is the perfect instrument: unhurried, warm, quietly furious."
      ],
      "cons": [
        "The narration explains subtext that the performances have already delivered.",
        "It is sentimental in the last fifteen minutes, and knows it."
      ],
      "breakdown": {
        "1": 61,
        "2": 184,
        "3": 246,
        "4": 860,
        "5": 4789
      }
    },
    "680": {
      "tmdbId": 680,
      "slug": "pulp-fiction",
      "headline": "Structure as a punchline",
      "body": [
        "Tarantino's real subject here is digression. Every character is on their way somewhere else, and the film is about the interruption — the wrong place at the wrong time, and what a person reveals when their plans dissolve.",
        "It works because the dialogue underneath it is so good that the cleverness never becomes the point.",
        "It remains the most influential film of the last thirty years and also, easily, the most fun to watch at 2am."
      ],
      "quote": "He made cool feel like a narrative device, and then retired it.",
      "critic": {
        "name": "Maya Raghunathan",
        "role": "Senior Critic",
        "initials": "MR"
      },
      "date": "2024-06-21",
      "score": 8.9,
      "pros": [
        "Every character is interrupted en route somewhere else, and digression is the actual subject.",
        "A structure audacious enough to be a punchline, in chapters, and it never once feels like showing off.",
        "The dialogue is the best in modern cinema, which is why the plot can be non-linear."
      ],
      "cons": [
        "Tarantino's fondness for the same word repeated eight times has aged less gracefully than the rest.",
        "The third act rushes to resolve two characters in a way the film earns but does not enjoy."
      ],
      "breakdown": {
        "1": 98,
        "2": 196,
        "3": 342,
        "4": 1027,
        "5": 3227
      }
    },
    "807": {
      "tmdbId": 807,
      "slug": "se7en",
      "headline": "The last film Fincher made that could genuinely surprise you",
      "body": [
        "Fincher's third film is still the one that feels like a thriller rather than a diagram of one. The movie never gives you a reason to prefer the detective.",
        "It is shot so dark that the basement scenes are genuinely difficult to read, and the reference at the end is one of the few times a film has earned a jump scare with a subtitle.",
        "Gwyneth Paltrow is unfairly maligned for it. Her one scene is the best thing in the movie."
      ],
      "quote": "Still the best pure plot in American cinema since Chinatown.",
      "critic": {
        "name": "Kenji Arakawa",
        "role": "Film Programme",
        "initials": "KA"
      },
      "date": "2023-11-20",
      "score": 8.6,
      "pros": [
        "The detective and the killer want exactly the same thing and are therefore never distinguishable.",
        "Filmed so dark that the basement scenes are genuinely hard to read, and it works.",
        "Still the best pure plot in American cinema since Chinatown."
      ],
      "cons": [
        "The ending leans on an intertitle when the image had already done the job.",
        "Fincher never made a blacker film and it is not quite the achievement it appears."
      ],
      "breakdown": {
        "1": 127,
        "2": 211,
        "3": 465,
        "4": 1100,
        "5": 2327
      }
    },
    "27205": {
      "tmdbId": 27205,
      "slug": "inception",
      "headline": "The most precise puzzle-box you will ever fall into",
      "body": [
        "Nolan builds a film with load-bearing walls and no visible scaffolding. The dream levels are stacked like Russian dolls, each with its own physics, its own stakes and its own quiet dread — and the film treats a lucid dream the way a heist film treats a vault: as somewhere you can get trapped.",
        "What lingers is the emotional inversion. Cobb is not a thief who wants in; he is a man trying to get back out, and the movie understands that those are the same action running in opposite directions.",
        "It is fifteen years old and still three layers ahead of the conversation."
      ],
      "quote": "I stopped the projector and sat in the dark for a while. That never happens.",
      "critic": {
        "name": "Maya Raghunathan",
        "role": "Senior Critic",
        "initials": "MR"
      },
      "date": "2024-11-18",
      "score": 8.8,
      "pros": [
        "A heist plot that actually works as a heist plot — every rule of the dream is established before it is exploited.",
        "DiCaprio plays exhaustion as a physical condition rather than a mood.",
        "The zero-gravity corridor is the most credible weightlessness in modern cinema."
      ],
      "cons": [
        "The emotional beats of the children are quietly the weakest part of a very strong film.",
        "Two hours and twenty minutes, with a fifteen-minute coda it does not need."
      ],
      "breakdown": {
        "1": 83,
        "2": 165,
        "3": 330,
        "4": 991,
        "5": 2559
      }
    },
    "37799": {
      "tmdbId": 37799,
      "slug": "the-social-network",
      "headline": "A friendship film that happens to be a deposition",
      "body": [
        "It is a movie about how fast a friendship can rot when money arrives faster than character.",
        "Fincher and his cinematographer are the same age and this film is exactly as cold, exact and emotionally withholding as his work.",
        "Eisenberg's charisma and self-sabotage in a single performance."
      ],
      "quote": "Two hours of people proving they are bad at friendship.",
      "critic": {
        "name": "Maya Raghunathan",
        "role": "Senior Critic",
        "initials": "MR"
      },
      "date": "2024-03-28",
      "score": 7.8,
      "pros": [
        "Structure as argument: two hearings, cross-cut, the past arriving in tiny shards.",
        "Fincher treats a deposition the way he treats a heist — as a sequence of controlled losses.",
        "The famous opening is a thesis, not a showy piece of business: you cannot have a social network, people are the product."
      ],
      "cons": [
        "Nail through a board — the legal plot has no interest in the law.",
        "Cold to the point of emotional stasis for the full two hours."
      ],
      "breakdown": {
        "1": 147,
        "2": 265,
        "3": 559,
        "4": 911,
        "5": 1058
      }
    },
    "76341": {
      "tmdbId": 76341,
      "slug": "mad-max-fury-road",
      "headline": "Two hours of the most honest action ever filmed",
      "body": [
        "George Miller is making the most technically alive action film of his career, and the film's superpower is that it is not actually about action. Max is broken and is not going to be fixed by a great escape. That is the plot.",
        "It is the rare action movie that understands gravity as a collaborator, and the sound mix puts the engine in your chest.",
        "Every frame is choreographed. Most action films are merely filmed."
      ],
      "quote": "An action film where the quiet parts are the most memorable.",
      "critic": {
        "name": "Priya Raman",
        "role": "Managing Editor",
        "initials": "PR"
      },
      "date": "2024-05-16",
      "score": 8.1,
      "pros": [
        "The most technically alive action film of its era, made by a seventy-year-old.",
        "Gravity as a collaborator rather than an obstacle — the stunts read as heavy because they are heavy.",
        "Theron plays her entire arc with posture and says almost nothing."
      ],
      "cons": [
        "The villain is a sketch, and you feel every gap in his plan.",
        "Nineteen minutes of chase become twenty-two minutes of very similar chase."
      ],
      "breakdown": {
        "1": 146,
        "2": 255,
        "3": 473,
        "4": 1055,
        "5": 1711
      }
    },
    "76600": {
      "tmdbId": 76600,
      "slug": "avatar-the-way-of-water",
      "headline": "Technically unprecedented, dramatically waterlogged",
      "body": [
        "Cameron invented a virtual camera system so the performers could actually swim, and the achievement is real — you never see a human actor floating above a CG horizon.",
        "The problem is that the script treats its characters as terrain. By the reef sequences the film has lost the one thread that made its predecessor work.",
        "Watch it for the photography. Do not watch it for a story, because there is not one."
      ],
      "quote": "The most beautiful footage ever shot in a film that needed a script.",
      "critic": {
        "name": "Kenji Arakawa",
        "role": "Film Programme",
        "initials": "KA"
      },
      "date": "2024-05-08",
      "score": 7.6,
      "pros": [
        "A purpose-built virtual camera so the cast could actually swim, and it shows in every frame.",
        "Underwater photography that is genuinely unrepeatable — macro, drone and live-action in one seamless space.",
        "A production achievement worth studying in its own right."
      ],
      "cons": [
        "The screenplay treats its characters as terrain, and abandons Jake's arc inside the first hour.",
        "Three hours and twelve minutes of largely passive spectacle."
      ],
      "breakdown": {
        "1": 292,
        "2": 460,
        "3": 836,
        "4": 1254,
        "5": 1338
      }
    },
    "120467": {
      "tmdbId": 120467,
      "slug": "grand-budapest-hotel",
      "headline": "A comedy with an actual pulse under it",
      "body": [
        "The three-format structure sounds like a gimmick and is in fact a thesis. As the world degrades, so does the image — and you feel it before you can articulate it.",
        "The hidden centre of the story, what Zero and Gustave actually feel, arrives almost by accident and breaks you.",
        "Aspect ratio as a moral argument."
      ],
      "quote": "The rare comedy with a real wound underneath it.",
      "critic": {
        "name": "Sofia Lindqvist",
        "role": "Contributing Editor",
        "initials": "SL"
      },
      "date": "2024-06-04",
      "score": 8.1,
      "pros": [
        "Aspect ratio used as a moral argument: as the world degrades, so does the image.",
        "Wickedly funny, which people forget because it is so precisely composed.",
        "Dafoe delivers the best lines in the film while looking like a disappointed ferret."
      ],
      "cons": [
        "The emotional centre arrives by accident rather than by design.",
        "A film that would fall apart if it were not photographed so exquisitely."
      ],
      "breakdown": {
        "1": 137,
        "2": 192,
        "3": 384,
        "4": 822,
        "5": 1205
      }
    },
    "157336": {
      "tmdbId": 157336,
      "slug": "interstellar",
      "headline": "The loudest film ever made, and the quietest ending",
      "body": [
        "Nolan builds a cathedral of a film and then, in its final movement, makes you whisper. The organ chords are famous and deserved. The sound design is better.",
        "McConaughey does something subtle with time. The film simply hands us the maths and trusts us to do the arithmetic on what we have lost.",
        "The ending is one-sided and people have been arguing about it for a decade. I am on the side of the film."
      ],
      "quote": "A sequel in ideas that makes its predecessor feel like a sketch.",
      "critic": {
        "name": "Kenji Arakawa",
        "role": "Film Programme",
        "initials": "KA"
      },
      "date": "2024-09-27",
      "score": 8.7,
      "pros": [
        "McConaughey plays a man watching his children age past him, and the film never tells us to feel bad about it.",
        "The sound design puts you inside the Endurance during docking — all breath, scrape and radio static.",
        "Zimmer's organ theme earns its bombast by being used exactly twice."
      ],
      "cons": [
        "The exposition arrives in speech, not action, whenever the science has to be explained.",
        "One-loned for a summer and stretched over 169 minutes, the third act is the slowest."
      ],
      "breakdown": {
        "1": 119,
        "2": 199,
        "3": 438,
        "4": 1075,
        "5": 2149
      }
    },
    "244786": {
      "tmdbId": 244786,
      "slug": "whiplash",
      "headline": "Two men, one drum, no air in the room",
      "body": [
        "Chazelle shoots rehearsal sequences in unbroken two- and three-minute takes and the effect is physiological. It is not editing that is filming — it is closer to being held.",
        "The ending is deliberately unresolved and has produced thirty seconds of argument ever since.",
        "It is the only film that made me check my own pulse."
      ],
      "quote": "Primal, precise, and about two people who should probably stop.",
      "critic": {
        "name": "Maya Raghunathan",
        "role": "Senior Critic",
        "initials": "MR"
      },
      "date": "2023-12-19",
      "score": 8.5,
      "pros": [
        "Rehearsal sequences in unbroken takes that are physiological — you sync your breathing to the snare.",
        "Simmons is terrifying because he lowers his voice and the temperature drops with it.",
        "106 minutes, no waste, and a score that never once asks for forgiveness."
      ],
      "cons": [
        "Deliberately unresolved about whether the ending is triumph or ruin.",
        "The jazz standards are excellent but the film's relationship with music is entirely functional."
      ],
      "breakdown": {
        "1": 94,
        "2": 156,
        "3": 374,
        "4": 874,
        "5": 1622
      }
    },
    "299534": {
      "tmdbId": 299534,
      "slug": "avengers-endgame",
      "headline": "A finale that earns its exhaustion",
      "body": [
        "Twenty-two films in, the Russos solve the problem nobody had solved: how to make a finale that is about paying up rather than winning. The answer is that the victory belongs to the hero who is not there for it.",
        "It is deliberately exhausting. The film returns you to time travel fatigue before it asks you to care one more time, and the exhaustion is the point.",
        "The seams show. That it still works is a testament to how much groundwork the earlier entries did."
      ],
      "quote": "It is a finale about debt, not victory. That is why it works.",
      "critic": {
        "name": "Maya Raghunathan",
        "role": "Senior Critic",
        "initials": "MR"
      },
      "date": "2024-09-30",
      "score": 7.9,
      "pros": [
        "The most disciplined act-three structure of any blockbuster of the century.",
        "A genuinely earned ending that resolves a decade of plot without a single twist for the sake of it.",
        "Time travel is treated as a cost with a body count, not a convenience."
      ],
      "cons": [
        "Six minutes of credits before the film returns to give the moment its weight.",
        "Several key emotional beats land in scenes that were clearly shot months apart."
      ],
      "breakdown": {
        "1": 282,
        "2": 469,
        "3": 844,
        "4": 1313,
        "5": 1782
      }
    },
    "313369": {
      "tmdbId": 313369,
      "slug": "la-la-land",
      "headline": "A musical about the difference between loving and choosing",
      "body": [
        "People call this the film where the credits number is the twist, and it is — but the number only registers because Chazelle spent two hours teaching you to want the two of them together.",
        "It should not work. It is a high-wire act with a two-hour approach, and the whole thing is engineered by a director who knows exactly how long a shot can be held.",
        "A love story about the routes not taken, sung in full."
      ],
      "quote": "Two hours of someone hoping out loud, then a number that says nothing works.",
      "critic": {
        "name": "Priya Raman",
        "role": "Managing Editor",
        "initials": "PR"
      },
      "date": "2024-08-30",
      "score": 8,
      "pros": [
        "A two-hour approach that pays off with one of the best sequences in modern musicals.",
        "Stone sells exhaustion as a punchline during the traffic-light improvisation.",
        "It treats the love story as real and the ending as a tragedy rather than a twist."
      ],
      "cons": [
        "The score is nearly all pastiche of a fifty-year-old style.",
        "Rehearsal footage from production is almost as good as the film."
      ],
      "breakdown": {
        "1": 244,
        "2": 325,
        "3": 568,
        "4": 1096,
        "5": 1827
      }
    },
    "329865": {
      "tmdbId": 329865,
      "slug": "arrival",
      "headline": "A film about the size of a life, not a planet",
      "body": [
        "Villeneuve keeps the aliens abstract on purpose. The whole film is built on the idea that the biggest event in history is only ever experienced privately, one person at a time.",
        "It is a film about accepting a terrible piece of knowledge and choosing to act anyway, and it is far less interested in the world's politics than in one woman's relationship to her own daughter.",
        "The scientist is not studying the language. The language is studying her."
      ],
      "quote": "It taught a generation of screenwriters to trust silence.",
      "critic": {
        "name": "Kenji Arakawa",
        "role": "Film Programme",
        "initials": "KA"
      },
      "date": "2024-03-14",
      "score": 7.9,
      "pros": [
        "The aliens stay abstract on purpose; what matters is the light, the sound and Adams's face.",
        "A film about accepting a terrible piece of knowledge and choosing to act anyway.",
        "The eleven minutes after the landings: almost no dialogue, and it entirely works."
      ],
      "cons": [
        "The central linguistic puzzle is solved by deduction the film only half-executes.",
        "Arrives soft and slow where the premise promised harder edges."
      ],
      "breakdown": {
        "1": 149,
        "2": 238,
        "3": 536,
        "4": 924,
        "5": 1133
      }
    },
    "335984": {
      "tmdbId": 335984,
      "slug": "blade-runner-2049",
      "headline": "A sequel that is a poem pretending to be a thriller",
      "body": [
        "Villeneuve made the sequel a film about memory, and the structure is Greek — a detective returns home and learns he was wrong about everything.",
        "Deakins shoots in near-monochrome for the first act and then, when Gosling reaches the orange-walled apartment, lets colour in. It is the most dramatic colour reveal in recent cinema and nobody noticed.",
        "It is slower than people remember and much sadder than people admit."
      ],
      "quote": "Deakins paints with restraint. The last shot should be illegal.",
      "critic": {
        "name": "Sofia Lindqvist",
        "role": "Contributing Editor",
        "initials": "SL"
      },
      "date": "2024-11-05",
      "score": 8,
      "pros": [
        "Understands exactly one thing about the first film: it is not about replicants, it is about memory.",
        "The Greek detective structure — returns home, learns he was wrong about everything.",
        "Deakins lets colour in like daylight after weeks underground."
      ],
      "cons": [
        "Slower than people remember and sadder than people admit.",
        "A supporting character is given a mystique that the third act then uses up."
      ],
      "breakdown": {
        "1": 172,
        "2": 230,
        "3": 431,
        "4": 832,
        "5": 1205
      }
    },
    "354912": {
      "tmdbId": 354912,
      "slug": "coco",
      "headline": "A grief story with music in it, which is harder than it sounds",
      "body": [
        "The Land of the Dead is designed as a working city with a real economy, which is a wonderful idea that only about three animated films have ever used.",
        "It is sadder than it needs to be, and there is a scene — I will not spoil it — that is going to be very difficult for anyone who has lost someone.",
        "The Land of the Dead should be the theme park everyone ever builds."
      ],
      "quote": "Every family has a song it stopped singing. This is about recovering it.",
      "critic": {
        "name": "Priya Raman",
        "role": "Managing Editor",
        "initials": "PR"
      },
      "date": "2024-01-30",
      "score": 8.4,
      "pros": [
        "A family tree so traumatised by one murder it has taken the music out of its life — and the film takes that completely seriously.",
        "The Land of the Dead is designed as a working city with real infrastructure.",
        "It is sadder than it needs to be, and one scene will be very difficult for anyone who has lost someone."
      ],
      "cons": [
        "Hector's emotional turn arrives a little too neatly.",
        "Mid-film, the chase between two worlds becomes repetitive."
      ],
      "breakdown": {
        "1": 142,
        "2": 178,
        "3": 427,
        "4": 926,
        "5": 1887
      }
    },
    "361743": {
      "tmdbId": 361743,
      "slug": "top-gun-maverick",
      "headline": "A sequel that understands sequels are about time",
      "body": [
        "Kosinski treats the first film as a period piece and its sequel as an inheritance — Rooster is a character who exists to be both the great pilot and the warning.",
        "It is the best flying in cinema since the actual flying scenes in Top Gun, which is a sentence nobody expected to write.",
        "A sequel with a pulse, an argument, and an unexpectedly moving final act."
      ],
      "quote": "It is a legacy film that is aware it is one.",
      "critic": {
        "name": "Sofia Lindqvist",
        "role": "Contributing Editor",
        "initials": "SL"
      },
      "date": "2024-07-05",
      "score": 8.2,
      "pros": [
        "Aerial photography shot practically with nose-mounted cameras, and the sound mix puts you in the canopy.",
        "It treats the original as a period piece, and therefore as something to update rather than repeat.",
        "The last twenty minutes make a beach fist-bump feel like the payoff of a career arc."
      ],
      "cons": [
        "Blockbuster deference and Tom Cruise's immaculate hair make it occasionally insufferable.",
        "A '90s plot in a '90s film, including a defence lawyer with a conscience."
      ],
      "breakdown": {
        "1": 190,
        "2": 229,
        "3": 457,
        "4": 991,
        "5": 1943
      }
    },
    "419430": {
      "tmdbId": 419430,
      "slug": "get-out",
      "headline": "The rare horror film that is really a social thriller",
      "body": [
        "Peele writes the sunny surface so cheerfully that you accept the house before he makes you regret it.",
        "The horror is procedural — and the final stretch is a Saturday-morning documentary crew spliced into something it should never be near.",
        "The first ninety minutes are a masterclass in social discomfort used as a weapon."
      ],
      "quote": "Peele understands that racism is often just politeness with the volume turned down.",
      "critic": {
        "name": "Sofia Lindqvist",
        "role": "Contributing Editor",
        "initials": "SL"
      },
      "date": "2024-02-27",
      "score": 7.7,
      "pros": [
        "The Sunken Place sequence works because you have spent ninety minutes being told, politely, that everything is fine.",
        "Racism as procedural horror: a checklist of small courtesies a reasonable person would accept, because refusing would look rude.",
        "Not one beat is a jump scare."
      ],
      "cons": [
        "The second act loses a nerve and the third act overshoots.",
        "Two of the three companions are functions rather than people."
      ],
      "breakdown": {
        "1": 207,
        "2": 276,
        "3": 586,
        "4": 1035,
        "5": 1346
      }
    },
    "467244": {
      "tmdbId": 467244,
      "slug": "zone-of-interest",
      "headline": "The hardest cut in modern cinema",
      "body": [
        "Glazer has engineered a trap: the camera never goes inside the camp, never shows a victim, never gives the audience a single image of atrocity. It stays in the garden with the commandant.",
        "Screams are audible at the garden wall and nobody in frame reacts. The immensity of that detail is the film.",
        "No victim is ever shown. That omission is the review."
      ],
      "quote": "The sounds at the wall are more explicit than anything on screen.",
      "critic": {
        "name": "Maya Raghunathan",
        "role": "Senior Critic",
        "initials": "MR"
      },
      "date": "2024-04-17",
      "score": 7.1,
      "pros": [
        "An extraordinarily formal trap: no victim is ever shown, and the banality is the entire argument.",
        "The sound design is the review — screams at the garden wall, and nobody in frame reacts.",
        "The only film on this list that is genuinely hard to sit through, and the one that most deserves the discomfort."
      ],
      "cons": [
        "Deliberately resists engagement, which will read as coldness to some viewers.",
        "Without its final intertitle it would risk being mistaken for a garden film."
      ],
      "breakdown": {
        "1": 103,
        "2": 148,
        "3": 273,
        "4": 308,
        "5": 308
      }
    },
    "496243": {
      "tmdbId": 496243,
      "slug": "parasite",
      "headline": "A thriller that keeps changing genre on you",
      "body": [
        "Bong has said he set out to test whether a comedy could hold a class thriller underneath it. The answer is an emphatic yes, and the trick is tonal patience — the film lets you laugh for ninety minutes while quietly assembling a staircase.",
        "The formal control is extraordinary. When the axis flips, the shock is architectural, and the violence that follows lands like a building giving way.",
        "It is the rare film where the basement is the third main character."
      ],
      "quote": "Fear and comedy, sharing one set, never touching.",
      "critic": {
        "name": "Priya Raman",
        "role": "Managing Editor",
        "initials": "PR"
      },
      "date": "2024-12-05",
      "score": 8.5,
      "pros": [
        "Comedy, thriller and class drama coexist without the tonal seams showing once.",
        "Every scene is staged on a single axis, so the axis flip lands as structural failure rather than sentiment.",
        "Song Kang-ho's most naturalistic performance of his career, in a role begging for caricature."
      ],
      "cons": [
        "The final act escalates past the register the first ninety minutes established.",
        "Some critics found the basement reveal telegraphed by the second act."
      ],
      "breakdown": {
        "1": 176,
        "2": 265,
        "3": 573,
        "4": 1235,
        "5": 2161
      }
    },
    "545611": {
      "tmdbId": 545611,
      "slug": "everything-everywhere",
      "headline": "The most generous film ever made about being a mediocre person",
      "body": [
        "The obvious trap for a multiverse comedy is that the alternative lives become a catalogue of cool party tricks. Kwan and Scheinert walk straight past it.",
        "That single decision converts a bag-of-skits film into an argument.",
        "A comedy about the parts of your life that did not get the memo."
      ],
      "quote": "Two priests, one fistfight, and the year's best comedy ending.",
      "critic": {
        "name": "Priya Raman",
        "role": "Managing Editor",
        "initials": "PR"
      },
      "date": "2024-01-09",
      "score": 8,
      "pros": [
        "Every alternative universe is worse than the one she started in, which converts a bag of skits into an argument.",
        "Yeoh gets the performance of her career and Curtis finally gets to be funny and terrifying at once.",
        "The bagels are the whole movie, and they are both the solution and the flaw."
      ],
      "cons": [
        "Two hours and nineteen minutes, several of which are lost to fight staging that dissolves.",
        "The father-daughter ending is the one sequence that does not know what it is."
      ],
      "breakdown": {
        "1": 140,
        "2": 246,
        "3": 526,
        "4": 1018,
        "5": 1580
      }
    },
    "546554": {
      "tmdbId": 546554,
      "slug": "knives-out",
      "headline": "A whodunit that trusts the audience completely",
      "body": [
        "Johnson structures it as an actual puzzle — everyone has a motive, the motive boards are honest, and the sleuth's conclusion is genuinely deducible from the evidence on screen. Most mysteries cheat. This one shows its work and still lands.",
        "The real trick is that it is a comedy with a body count, and it never lets the two tones touch.",
        "Proof that fair-play mysteries and jokes are not mutually exclusive."
      ],
      "quote": "Everyone has a motive, which is either a fair clue or lazy writing. Here it is both.",
      "critic": {
        "name": "Daniel Okafor",
        "role": "Staff Writer",
        "initials": "DO"
      },
      "date": "2024-04-03",
      "score": 7.9,
      "pros": [
        "A real puzzle, honestly constructed — the motive boards are truthful and the answer is deducible.",
        "Evans delivers ten seconds of pure physical comedy inside a murder mystery.",
        "It is a comedy with a body count and it never lets the two tones touch."
      ],
      "cons": [
        "The detective is a cipher for two hours before becoming the film's funniest element.",
        "The film outstays its ending by fifteen minutes."
      ],
      "breakdown": {
        "1": 167,
        "2": 268,
        "3": 536,
        "4": 1039,
        "5": 1340
      }
    },
    "634649": {
      "tmdbId": 634649,
      "slug": "spider-man-no-way-home",
      "headline": "Nostalgia with the brakes off",
      "body": [
        "The film knows exactly what it is doing and that is both the pleasure and the problem. It is a victory lap that assumes you have been to the party for fifty years — and it works right up until the drumming arrives in act three.",
        "Tom Holland is extraordinary and Tom Hollander is funnier than anyone gives him credit for. But the plot is a dare: what if the heroes were just wrong, and nobody says so?",
        "The emotional climax arrives fifteen minutes before the credits, which is a scheduling failure, not a writing one."
      ],
      "quote": "The most generous crossover ever built on a hollow premise.",
      "critic": {
        "name": "Sofia Lindqvist",
        "role": "Contributing Editor",
        "initials": "SL"
      },
      "date": "2024-05-19",
      "score": 7.5,
      "pros": [
        "Tom Holland gives a complete performance across three different actors playing the same hero.",
        "No continuity error: every previous film version is treated as canon, which is audacious and works.",
        "The scene where everyone meets everyone is a thrill-ride novelty that has never been topped."
      ],
      "cons": [
        "Three hours of action exhausts the audience and flattens the emotional beats around it.",
        "Strange's motivation for the entire plot is one thin line of dialogue."
      ],
      "breakdown": {
        "1": 330,
        "2": 536,
        "3": 865,
        "4": 1112,
        "5": 1277
      }
    },
    "693134": {
      "tmdbId": 693134,
      "slug": "dune-part-two",
      "headline": "Sand as a clock",
      "body": [
        "The first hour gives you everything the first Dune refused to: characters you can follow, an antagonist whose motives are legible, and a sense of what is actually at stake.",
        "Villeneuve builds dread at geological speed. Chalamet's physical transformation is genuinely unsettling, and the film never once tells you what he is becoming. It just cuts to Paul looking at a horizon.",
        "It made a rewatch of Part One compulsory, which no sequel has managed since 1974."
      ],
      "quote": "The best sequel since The Godfather.",
      "critic": {
        "name": "Daniel Okafor",
        "role": "Staff Writer",
        "initials": "DO"
      },
      "date": "2024-09-15",
      "score": 8.5,
      "pros": [
        "A sequel that respects the fact you may have skipped the original: legible motives, real stakes, no homework.",
        "Greig Fraser holds dunes on screen for seconds and turns a footstep into an event.",
        "The sound design makes the sand a character — a low, moving pressure you feel in the chair."
      ],
      "cons": [
        "The second hour is three hours long once you account for the sandworm transit sequences.",
        "It leans on a twist that a careful reader of the first film will have predicted."
      ],
      "breakdown": {
        "1": 159,
        "2": 239,
        "3": 518,
        "4": 1154,
        "5": 1910
      }
    },
    "762504": {
      "tmdbId": 762504,
      "slug": "nope",
      "headline": "A gorgeous idea filmed by a very literal filmmaker",
      "body": [
        "The central idea is first rate: a rancher raises horses to make an animal-shaped cloud, and the creature descends in response to the spectacle. And the film is shot in Academy ratio and looks superb doing it.",
        "The problem is that Peele tells you what the film means in the first twenty minutes and then explains it again in the third act.",
        "The cloud silhouette is the best design work of 2022. The screenplay wasted it."
      ],
      "quote": "It spends its last fifteen minutes explaining an image instead of landing it.",
      "critic": {
        "name": "Daniel Okafor",
        "role": "Staff Writer",
        "initials": "DO"
      },
      "date": "2024-02-11",
      "score": 6.8,
      "pros": [
        "The cloud silhouette is the best design work of the year, and the Academy-ratio framing suits it perfectly.",
        "A correct, unnerving study of the apparatus of belief — cameras, screens, and the man who does the maths.",
        "The opening is one of the decade's great directorial statements."
      ],
      "cons": [
        "Tells you what the film means in the first twenty minutes, then explains it again in the third act.",
        "The two killer moments are separated by a Wikipedia entry.",
        "The final shot is the career's best image, wasted on fifteen minutes of over-explaining."
      ],
      "breakdown": {
        "1": 196,
        "2": 267,
        "3": 427,
        "4": 463,
        "5": 427
      }
    },
    "872585": {
      "tmdbId": 872585,
      "slug": "oppenheimer",
      "headline": "Three hours, no wasted minute, and a nuclear thriller inside",
      "body": [
        "The Trinity sequence is the set-piece everyone remembers, but the real achievement is the second act: a security hearing where a physicist is grilled about his left-wing reading habits.",
        "Three hours is a long time. The thing that saves it is that the third act is a genuine reckoning rather than a victory lap, which is more than the genre usually promises.",
        "Nolan turns a security hearing into a thriller without once reaching for volume."
      ],
      "quote": "A biopic that doubles as a procedural and never cheats on either.",
      "critic": {
        "name": "Maya Raghunathan",
        "role": "Senior Critic",
        "initials": "MR"
      },
      "date": "2024-08-11",
      "score": 8.3,
      "pros": [
        "A security hearing rendered with the exact tension of a courtroom thriller, and Nolan never raises his voice.",
        "The Trinity sequence keeps the bomb offscreen and is far more frightening for it.",
        "Cillian Murphy appears to have been assembled from the archival photographs."
      ],
      "cons": [
        "Three hours in which the interrogation scenes repeat a similar trick three times.",
        "The patriotic score is loud enough to become the loudest character."
      ],
      "breakdown": {
        "1": 175,
        "2": 262,
        "3": 568,
        "4": 1180,
        "5": 2185
      }
    }
  };

  /* --- lookups ------------------------------------------------------------ */

  /** Our review for a TMDB id, or null when the film has not been written up. */
  function forMovie(tmdbId) {
    if (tmdbId === undefined || tmdbId === null) return null;
    return BY_ID[String(tmdbId)] || null;
  }

  /** Our review for a bundled slug, used by the offline dataset. */
  function forSlug(slug) {
    for (var id in BY_ID) {
      if (BY_ID[id].slug === slug) return BY_ID[id];
    }
    return null;
  }

  /** Every review, newest first. */
  function list() {
    return Object.keys(BY_ID)
      .map(function (id) {
        return BY_ID[id];
      })
      .sort(function (a, b) {
        return a.date < b.date ? 1 : -1;
      });
  }

  /** The review behind the Home page hero. */
  function featured() {
    /* Reached through window rather than a bare CR identifier: an unqualified
       `CR` only resolves because a browser promotes window.CR to a global, which
       stops being true the moment this file is loaded in a worker, a test
       harness, or anything that is not a page. */
    var root = window.CR || {};
    var all = list();
    for (var i = 0; i < all.length; i++) {
      var slugMovie = root.data && root.data.byId(all[i].slug);
      if (slugMovie && slugMovie.isFeatured) return all[i];
    }
    return all[0] || null;
  }

  /** Reviews written by one critic. */
  function byCritic(name) {
    return list().filter(function (r) {
      return r.critic.name === name;
    });
  }

  /**
   * Text to show where a review is expected but missing. Never fabricates a
   * verdict — it says plainly that the review is not written yet.
   */
  function pending() {
    return {
      headline: "Full review in progress",
      pending: true,
      body: [],
      quote: "",
      pros: [],
      cons: []
    };
  }

  window.CR = window.CR || {};
  window.CR.reviews = {
    byId: BY_ID,
    critics: CRITICS,
    count: 28,
    forMovie: forMovie,
    forSlug: forSlug,
    list: list,
    featured: featured,
    byCritic: byCritic,
    pending: pending
  };
})();
