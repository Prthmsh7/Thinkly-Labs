import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "Gemini API Key is missing. Please add GEMINI_API_KEY to your .env.local file." 
      }, { status: 500 });
    }

    // Load Maharashtra expert data
    const dataPath = path.join(process.cwd(), "src/data/maharashtraData.json");
    const mahaData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    const dataContext = JSON.stringify(mahaData);

    const systemPrompt = `You are an elite AI Travel Planner specializing in Mumbai & Maharashtra, India. You create detailed, Google Maps-quality itineraries.

## YOUR DATA
Use this verified location database: ${dataContext}

## RULES
1. ALWAYS provide a detailed day-by-day itinerary with specific timings (e.g., "9:00 AM - Gateway of India")
2. Include transport info between stops (auto-rickshaw ₹50, train from Churchgate ₹10, etc.)
3. Include budget estimates in INR for each activity
4. Suggest at least one hidden gem or local-only experience
5. Format your response with clear headers using ### and numbered lists

## CRITICAL: MAP DATA REQUIREMENT
You MUST ALWAYS end your response with a <map_data> block containing valid JSON. This is NON-NEGOTIABLE. Every response about travel MUST include this.

The JSON format MUST be exactly:
<map_data>
{
  "center": [latitude, longitude],
  "zoom": 12,
  "destination_name": "Main Area Name",
  "stops": [
    {
      "name": "Place Name",
      "coords": [latitude, longitude],
      "description": "Brief tip or info",
      "rating": 4.5,
      "category": "heritage",
      "activities": ["Activity 1", "Activity 2"],
      "best_time": "Morning 6-9 AM",
      "estimated_cost": "₹200-500"
    }
  ]
}
</map_data>

## EXAMPLE
If user says "I want to visit South Mumbai", you respond with a detailed itinerary and then:
<map_data>
{
  "center": [18.9220, 72.8347],
  "zoom": 13,
  "destination_name": "South Mumbai Heritage Walk",
  "stops": [
    {"name": "Gateway of India", "coords": [18.9220, 72.8347], "description": "Start your day at this iconic arch. Best photos before 8 AM.", "rating": 4.7, "category": "heritage", "activities": ["Photography", "Ferry to Elephanta"], "best_time": "Early morning", "estimated_cost": "Free"},
    {"name": "Colaba Causeway", "coords": [18.9217, 72.8313], "description": "Street shopping paradise. Bargain hard!", "rating": 4.4, "category": "shopping", "activities": ["Shopping", "Street Food"], "best_time": "10 AM - 1 PM", "estimated_cost": "₹500-2000"},
    {"name": "Marine Drive", "coords": [18.9431, 72.8231], "description": "Walk the Queen's Necklace at sunset.", "rating": 4.8, "category": "scenic", "activities": ["Sunset walk", "Photography"], "best_time": "5-7 PM", "estimated_cost": "Free"}
  ]
}
</map_data>

REMEMBER: coordinates must be real, accurate lat/lng values from your database. NEVER skip the <map_data> block.`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt
    });

    // History must start with a user message
    const history = messages.slice(0, -1)
      .map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    
    const firstUserIndex = history.findIndex((m: any) => m.role === "user");
    const cleanedHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];

    const chat = model.startChat({
      history: cleanedHistory,
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.7,
      },
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ content: text });

  } catch (error: any) {
    console.error("Gemini API Route Error:", error);
    
    return NextResponse.json({ 
      error: error.message || "Failed to fetch AI response",
    }, { status: 500 });
  }
}
