# RAG-Powered Chatbot – Developer Guide

A practical developer guide for building a purpose-built **RAG-powered chatbot** using:

- Next.js 15 (App Router)
- Vercel AI SDK
- Upstash Vector (serverless vector DB)

This setup is ideal for the **Thinkly Labs assignment**:
- Demonstrates real RAG (retrieval-augmented generation)
- Shows frontend polish (streaming, loading states, error handling)
- Easy Vercel deployment
- Achievable within 4–8 hours

---

## Recommended Topic

### India travel topics
Include knowledge about:
All the cities places to visit and all those stufff.

Integrate google maps api so that the maps are visible and we're able to track everything


### Example Queries
- “Best 3-day weekend from Bhopal?”
- “How to reach Kanha?”
- “Budget stay in Khajuraho?”

---

## Tech Stack

| Layer            | Choice                          | Why? |
|------------------|----------------------------------|------|
| Framework        | Next.js 15 (App Router)          | Vercel-native, streaming support |
| AI SDK           | Vercel AI SDK                   | useChat, streaming, multi-provider |
| Vector DB        | Upstash Vector                  | Serverless, free tier, no infra |
| Embeddings + LLM | OpenAI (embedding + GPT-4o-mini)| Cheap, fast, reliable |
| UI               | shadcn/ui + Tailwind + Motion   | Fast, polished UI |
| Optional         | LangChain.js                    | Advanced chunking (optional) |

---

## Setup Guide

### 1. Create Project

```bash
npx create-next-app@latest mp-tourism-rag-chatbot --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd mp-tourism-rag-chatbot
Create ProjectBashnpx create-next-app@latest mp-tourism-rag-chatbot --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd mp-tourism-rag-chatbot
Install DependenciesBashnpm install ai @ai-sdk/openai @upstash/vector zod
npm install -D @types/node
# Optional but recommended for nice UI
npx shadcn@latest init
npx shadcn@latest add card button input textarea skeleton avatar
npm install framer-motion lucide-react
Environment Variables (.env.local)envOPENAI_API_KEY=sk-...
UPSTASH_VECTOR_REST_URL=https://your-index-name-xxx.upstash.io
UPSTASH_VECTOR_REST_TOKEN=your-token-here→ Create free Upstash Vector index here: https://console.upstash.com/vector
→ Choose dimension 1536 (for OpenAI text-embedding-3-small)
Project Structure (important files)textsrc/
├── app/
│   ├── page.tsx                # Main chat UI + landing
│   └── api/chat/route.ts       # Core AI endpoint (Vercel AI SDK)
├── lib/
│   ├── rag.ts                  # Embedding + retrieval logic
│   └── utils.ts
├── components/
│   ├── Chat.tsx
│   ├── Message.tsx
│   └── LoadingDots.tsx
├── data/
│   └── tourism-knowledge/      # .txt, .md files or JSON about MP tourism
└── types/
    └── index.ts
Create Vector Index Helper (src/lib/rag.ts)TypeScriptimport { Index } from "@upstash/vector";
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

const embeddingModel = openai.embedding("text-embedding-3-small");

export async function getEmbedding(text: string) {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });
  return embedding;
}

export async function upsertDocument(id: string, text: string, metadata: Record<string, any> = {}) {
  const vector = await getEmbedding(text);
  await index.upsert([
    {
      id,
      vector,
      metadata: { ...metadata, text },
    },
  ]);
}

export async function retrieve(query: string, topK = 4) {
  const vector = await getEmbedding(query);
  const results = await index.query({
    vector,
    topK,
    includeMetadata: true,
  });
  return results.map(r => ({
    text: r.metadata.text as string,
    score: r.score,
  }));
}
API Route – Core Chat Logic (src/app/api/chat/route.ts)TypeScriptimport { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { retrieve } from "@/lib/rag";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const lastMessage = messages[messages.length - 1].content;

  // Retrieve relevant context
  const context = await retrieve(lastMessage);
  const contextText = context.map(c => c.text).join("\n\n");

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    system: `You are a helpful Madhya Pradesh Tourism Guide from Bhopal.
Use only the provided context. Be friendly, use some Hinglish if natural.
Context:\n${contextText}`,
    messages,
  });

  return result.toDataStreamResponse();
}
Frontend Chat UI (src/app/page.tsx – simplified)tsx"use client";

import { useChat } from "ai/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4">
      <Card className="mx-auto max-w-3xl">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-bold">MP Tourism Guide – Bhopal se!</h1>
          <p>Ask anything about Madhya Pradesh travel</p>
        </CardHeader>
        <CardContent>
          <div className="h-[60vh] overflow-y-auto mb-4 space-y-4">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && <Loader2 className="animate-spin mx-auto" />}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Kahan ghumne ka plan hai? (e.g. Khajuraho 3 din)"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
Seed Initial Knowledge (one-time script – run locally)
Create seed.ts in root:TypeScript// Run with: tsx seed.ts
import { upsertDocument } from "./src/lib/rag";

const docs = [
  { id: "khajuraho", text: "Khajuraho: Famous for UNESCO temples... best time Oct-Mar... train from Bhopal ~8 hrs..." },
  // add 10–20 more entries about places, routes, food, etc.
];

async function seed() {
  for (const doc of docs) {
    await upsertDocument(doc.id, doc.text, { source: "manual" });
    console.log(`Upserted ${doc.id}`);
  }
}

seed();
Run & Deploy
npm run dev → http://localhost:3000
Push to GitHub
Deploy on Vercel → add env vars in dashboard
Live link ready in <2 min


Bonus Polish for Assignment / Loom

Add suggestion chips on empty state: "Best wildlife parks?", "Bhopal local food?"
Skeleton loading cards during retrieval
Show "Retrieved X relevant places" hint
Use Framer Motion for message fade-in
Record Loom: "I seeded data → tested retrieval → added guardrail in system prompt to avoid off-topic answers""