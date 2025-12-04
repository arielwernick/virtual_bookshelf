// Public domain context and prompt for the Talk-to-Book demo
// Source: Winnie-the-Pooh by A.A. Milne (1926), public domain since 2022

export const winnieTitle = 'Winnie-the-Pooh';
export const winnieAuthor = 'A.A. Milne';
export const winnieYear = 1926;
export const winnieCoverUrl =
  'https://upload.wikimedia.org/wikipedia/commons/7/73/Winnie-the-Pooh_1st_ed._cover.jpg';

export const systemPrompt = `You are an old-school storytime narrator reading from the beloved book "Winnie-the-Pooh" by A.A. Milne (1926). You have a gentle, grandfatherly voice and speak as if you're sitting in a cozy armchair by the fire, telling stories to children gathered at your feet.

CRITICAL: Keep ALL responses SHORT - aim for 2-3 sentences maximum (roughly 20 seconds when spoken aloud). Be concise but warm. Get to the heart of the answer quickly.

IMPORTANT: You can ONLY answer questions about the Winnie-the-Pooh story, its characters, adventures, and the Hundred Acre Wood. If someone asks about topics outside this storybook world (modern technology, current events, other books, general knowledge, etc.), politely decline and redirect them back to the story in ONE sentence.

NARRATION STYLE (keep brief):
- Begin with ONE phrase like "Ah, yes..." or "Well now..." then get straight to the answer
- Use storytelling cadence but BE CONCISE
- Add ONE brief aside at most: "(and you know how bears are about honey)"
- Speak about characters warmly but BRIEFLY: "There was the time when..." then summarize quickly
- NO long transitions - answer the question directly in story voice

CHARACTER DESCRIPTIONS (speak of them warmly):
- Pooh: "A dear bear of very little brain, but such a big heart. Forever thinking about honey, or perhaps inventing a hum."
- Piglet: "A very small animal indeed, but oh, so brave when his friends needed him most."
- Eeyore: "The old grey donkey, rather gloomy, but we loved him dearly all the same."
- Christopher Robin: "The boy who understood us all. Wise beyond his years, that one."

THEMES to weave in naturally:
- Friendship matters more than cleverness
- Simple pleasures like honey, balloons, and parties bring the greatest joy
- Everyone has something valuable to contribute
- Kindness and loyalty above all else

If asked about unrelated topics, respond like a kindly storyteller redirecting a wandering child: "Now, now, that's not in this story, my dear. But would you like to hear about the time Pooh got stuck in Rabbit's door? Or perhaps when we all went on an Expotition to find the North Pole?"

Keep your voice warm, patient, and suitable for bedtime stories. Use simple, timeless language that captures the gentle magic of A.A. Milne's world.`;

export const characterNotes = {
  Pooh: 'A bear of very little brain but much heart; loves honey and simple pleasures.',
  Piglet: 'Small and timid but brave when friends need him; loyal and kind.',
  Eeyore: 'Often gloomy yet lovable; appreciates small acts of kindness.',
  Tigger: 'Energetic and bouncy; enthusiastic and sometimes impulsive.',
  'Christopher Robin': 'A caring friend who loves everyone in the Hundred Acre Wood.',
};

// Curated key chapters and passages from the public domain text (Project Gutenberg)
// Selected to give LLM enough context for detailed questions while managing token limits
export const bookExcerpts = `
INTRODUCTION:
This is Winnie-the-Pooh by A.A. Milne (1926). Pooh is a bear of very little brain who lives in the Forest with his friends.

CHAPTER I - In Which We Are Introduced to Winnie-the-Pooh and Some Bees:
Pooh wants honey from a tree. He tries to reach it with a balloon, pretending to be a small black cloud, but the bees suspect something. Christopher Robin shoots the balloon down, and Pooh floats safely to the ground.

CHAPTER II - In Which Pooh Goes Visiting and Gets Into a Tight Place:
Pooh visits Rabbit and eats too much honey and condensed milk. He gets stuck in Rabbit's front door trying to leave. Christopher Robin and Rabbit help him wait a week until he gets thin enough to be pulled out.

CHAPTER III - In Which Pooh and Piglet Go Hunting and Nearly Catch a Woozle:
Pooh and Piglet follow mysterious tracks around a spinney, thinking they're tracking Woozles. Christopher Robin points out they've been following their own footprints in circles.

CHAPTER IV - In Which Eeyore Loses a Tail and Pooh Finds One:
Eeyore's tail goes missing. Pooh discovers it's being used as Owl's bell-rope. Christopher Robin nails it back on for Eeyore.

CHAPTER V - In Which Piglet Meets a Heffalump:
Pooh and Piglet try to trap a Heffalump with honey. Pooh eats most of the honey himself, then gets his head stuck in the jar. Piglet mistakes him for a Heffalump and runs away.

CHAPTER VI - In Which Eeyore Has a Birthday and Gets Two Presents:
It's Eeyore's birthday. Pooh brings him a jar (having eaten all the honey), and Piglet brings a popped balloon. Eeyore discovers the balloon fits perfectly in the pot, and he's delighted.

CHAPTER VIII - In Which Christopher Robin Leads an Expotition to the North Pole:
Everyone goes on an expedition to find the North Pole. When Roo falls into a stream, Pooh uses a long pole to help Kanga fish him out. Christopher Robin declares that Pooh has discovered the North Pole.

CHAPTER IX - In Which Piglet Is Entirely Surrounded by Water:
Heavy rains flood the Forest. Piglet sends a message in a bottle. Pooh rescues him using Christopher Robin's umbrella as a boat.

CHAPTER X - In Which Christopher Robin Gives Pooh a Party:
Christopher Robin throws a party for Pooh to celebrate his heroism. Pooh receives a Special Pencil Case with pencils marked "B" for Bear, "HB" for Helping Bear, and "BB" for Brave Bear.

CHARACTERS:
- Winnie-the-Pooh: A bear of very little brain but much heart; loves honey and inventing hums
- Piglet: Very small and timid but brave when his friends need him; lives at TRESPASSERS W
- Eeyore: The gloomy grey donkey who has lost his tail; appreciates small kindnesses
- Christopher Robin: The boy who loves them all and helps solve their problems
- Rabbit: Practical and organized; has many friends-and-relations
- Owl: Wise (or thinks he is); can spell his name WOL
- Kanga and Roo: Mother and baby kangaroo; newcomers to the Forest
- Tigger: Bouncy and enthusiastic (appears in later stories)

THEMES:
- Friendship and loyalty in the Hundred Acre Wood
- Finding joy in simple things like honey, balloons, and parties
- Kindness matters more than cleverness
- Everyone has something valuable to contribute
- Adventures happen in everyday moments
`;

export function buildBookContext(): string {
  return `${winnieTitle} (${winnieYear}) by ${winnieAuthor}.\n\n${bookExcerpts}`;
}
