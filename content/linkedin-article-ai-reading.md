# LinkedIn Article: I Asked ChatGPT to Look at My App. It Saw Nothing.

**Status:** Draft  
**Date:** January 28, 2026  
**Related:** GitHub Issue #126, feature/ssr-shared-shelf branch

---

## ARTICLE

**I asked ChatGPT to look at my app. It saw nothing.**

I've been building a side project — a virtual bookshelf where you can curate and share your favorite books, podcasts, and music. I've been posting shelves here for a few weeks now.

Last week I shared a shelf link with ChatGPT. Asked it to describe what was on the page.

*"The actual content of the items isn't visible in the fetched page content."*

The page works fine in my browser. I can see everything. So I started debugging.

📸 **[SCREENSHOT A: ChatGPT saying content not visible]**

### What went wrong

I built my app the "modern" way — React components, client-side rendering. Your browser downloads JavaScript, runs it, and assembles the page.

Works great. Unless you can't run JavaScript.

AI assistants don't run JavaScript. Neither do most web crawlers, screen readers, or accessibility tools.

They see the raw HTML. And my raw HTML was basically empty.

It's like handing someone a recipe when they asked for dinner.

```
┌─────────────────────────────────────────────────────────────┐
│              🍽️  THE RECIPE vs. MEAL PROBLEM                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   WHAT I WAS SENDING:                                       │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                                                     │  │
│   │  Server: "Here's the recipe!"  📜                  │  │
│   │                     ↓                               │  │
│   │  🧑 Browser: *cooks it* → 🍝 Sees pasta!          │  │
│   │  🤖 AI:     *can't cook* → 📜 Sees... recipe?    │  │
│   │                                                     │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   WHAT I NEEDED TO SEND:                                    │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                                                     │  │
│   │  Server: "Here's your meal!"  🍝                   │  │
│   │                     ↓                               │  │
│   │  🧑 Browser: → 🍝 Sees pasta!                      │  │
│   │  🤖 AI:     → 🍝 Sees pasta!                      │  │
│   │                                                     │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### The fix

Server-side rendering. Instead of sending instructions, send the finished page.

The browser still gets the same experience — all the interactivity still works. But now anything that reads the HTML directly can actually see the content.

This is old-school web development. The kind of thing I'd skipped over because modern frameworks made it easy to ignore.

📸 **[SCREENSHOT B: ChatGPT now listing all the items correctly]**

### For the developers

If you're using Next.js or similar:

The issue was a `'use client'` component rendering all my content. The server sent a shell, and JavaScript filled it in.

The fix was refactoring to render the content in a server component, then wrapping it with a client component for interactivity (modals, click handlers). Same user experience, completely different HTML output.

```
┌─────────────────────────────────────────────────────────────┐
│                    THE TECHNICAL FIX                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BEFORE:                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  page.tsx (Server)                                   │  │
│  │     └─→ <ClientComponent />  ← 'use client'         │  │
│  │              └─→ renders items via JavaScript        │  │
│  │                                                      │  │
│  │  HTML sent to AI: <div id="root"></div>  ❌ Empty   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  AFTER:                                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  page.tsx (Server)                                   │  │
│  │     ├─→ <StaticShelfGrid />  ← Server-rendered      │  │
│  │     │        └─→ <article>Book Title</article>       │  │
│  │     │        └─→ <article>Podcast Name</article>     │  │
│  │     └─→ <InteractiveWrapper />  ← Hydrates for UI   │  │
│  │                                                      │  │
│  │  HTML sent to AI: <article>Book Title</article>  ✅ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Why this matters

This isn't new. Google dealt with this a decade ago. Accessibility has always needed it.

But AI assistants are making it relevant again. More and more, people ask ChatGPT "what's on this page?" before they click.

If your content isn't in the HTML, you're invisible.

The web still runs on HTML. Everything else is just convenience.

---

## VISUALS NEEDED

- [ ] Screenshot A: ChatGPT "before" — saying content not visible
- [ ] Screenshot B: ChatGPT "after" — listing actual shelf items
- [ ] Convert ASCII diagrams to clean graphics (Figma/Canva)

---

## NOTES

- Keep diagrams simple, could recreate as actual images
- Article can be posted on LinkedIn or personal blog
- Link back to the short post and the shelf
