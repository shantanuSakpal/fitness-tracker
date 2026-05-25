# Fitness OS

A personal fitness companion that helps you see **one day at a time**: what you ate, how you moved and slept, how you felt, and how your body is changing—without drowning in spreadsheets.

---

## What you can do

**Log what you eat**  
Add meals and snacks with calories, protein, fat, and fibre. You can note weight or portions, mark items as fruit when you want them to count toward your fruit goal, and attach quick notes. Everything is organized by date so you can look back at any day.

**Track your daily inputs**  
Set targets and record progress for the habits that matter to you: calories and protein, training, sleep, steps, easy walks, cardio, water, fibre, and fruit. It’s built to mirror how you actually plan a day—not just numbers, but did you train, rest, and move?

**Record how you’re doing on the outside**  
On the outputs side, log measurements (weight, waist, and more), how your energy and mood felt, recovery, and space for a progress photo link. Over time you get a clearer picture of trends, not just a single snapshot.

**See it all on the dashboard**  
Pick a date and get a summary: nutrition vs targets, key habits, recent notes, and how your weight is trending. A streak helps you stay consistent—one honest day after another.

---

## For developers

The app is a Next.js project backed by PostgreSQL (e.g. Neon). To run locally:

1. Create a database and set `POSTGRES_URL` in `.env` (see `.env.example`).
2. Set `GOOGLE_GENERATIVE_AI_API_KEY` to enable the dashboard food assistant. Optionally set `OPENAI_MODEL` to override the default `gpt-4.1-mini` model.
3. Apply the schema: `npm run db:push`
4. Start the app: `npm run dev`

For production, configure the same database URL on your host and run `npm run build` after migrations are applied to the production database.
