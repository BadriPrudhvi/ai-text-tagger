import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

// Types
interface AIResponse {
  response: string;
}

interface SentimentMap {
  [key: string]: {
    label: string;
    color: string;
  };
}

interface AnalysisResult {
  sentiment: SentimentMap[keyof SentimentMap];
  products: string[];
  issues: string[];
}

// Constants
const SENTIMENT_MAP: SentimentMap = {
  positive: {
    label: 'Positive',
    color: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  },
  negative: {
    label: 'Negative',
    color: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
  },
  neutral: {
    label: 'Neutral',
    color: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  },
};

const CLOUDFLARE_PRODUCTS = [
  "AI Gateway",
  "Browser Rendering",
  "Calls",
  "Cloudflare for Platforms",
  "Email Routing",
  "Hyperdrive",
  "KV",
  "WAF",
  "Pages Gateway",
  "Pub/Sub",
  "Pulumi",
  "Queues",
  "Magic Transit",
  "Bot Management",
  "Workers",
  "Pages",
  "R2",
  "D1",
  "Images",
  "Stream",
  "DNS",
  "SSL/TLS",
  "DDoS Protection",
  "Access",
  "Zero Trust",
  "Spectrum",
  "Load Balancing",
  "Durable Objects",
  "Tenant",
  "TURN Service",
  "Turnstile",
  "Vectorize",
  "Waiting Room",
  "Cloudflare Web Analytics",
  "Workers AI",
  "Workers Analytics Engine",
  "Workers for Platforms",
  "Workflows",
  "Zaraz",
] as const;

const ISSUE_LABELS = [
  "Bug Report",
  "Feature Request",
  "Performance Issue",
  "Security Concern",
  "Documentation Need",
  "Integration Problem",
  "Configuration Help",
  "Billing Question",
  "Service Disruption",
  "API Issue",
  "General",
] as const;

const AI_MODEL = "@cf/meta/llama-3.1-70b-instruct";

const AI_CONFIG = {
  temperature: 0.0,
  max_tokens: 150,
};

// Prompts
const PROMPTS = {
  sentiment: `You are a sentiment analysis AI specializing in Cloudflare-related feedback. Analyze the given text and determine if it expresses a positive, negative, or neutral sentiment towards Cloudflare's products, services, or the company in general.

Guidelines:
- Respond with exactly one word: "positive", "negative", or "neutral"
- "positive": User expresses satisfaction, praise, or enthusiasm about Cloudflare
- "negative": User expresses dissatisfaction, criticism, or frustration with Cloudflare
- "neutral": Factual statements, general inquiries, or balanced feedback about Cloudflare

Focus on Cloudflare-specific context and user sentiment. Respond with only one of these three words, nothing else.`,

  products: `You are a Cloudflare product detection AI assistant. Analyze the text and identify any mentioned Cloudflare products or services from the following list:

${CLOUDFLARE_PRODUCTS.join(", ")}

Guidelines:
- Return only product names from the provided list
- Multiple products may be mentioned
- If no products are mentioned, respond with "none"
- Separate multiple products with commas
- Match products even if mentioned with slight variations
- Do not add any explanation or additional text

Example responses:
"WAF, Workers"
"Pages, Hyperdrive, D1"
"R2"
"none"`,

  issues: `You are an AI assistant specialized in categorizing feedback into appropriate categories. Categorize the text into the most appropriate category from the following list:

${ISSUE_LABELS.join(", ")}

Guidelines:
- Return exactly one issue type from the list above
- Use exact spelling and capitalization as shown
- Choose the most relevant category based on the main concern
- If no clear issue type matches, respond with "General Question"
- Do not add any explanation or additional text

Example responses:
"Bug Report"
"General"
"Billing Question"`,
};

// Helper Functions
async function makeAICall(
  ai: any, 
  gateway_id: string, 
  prompt: string, 
  text: string
): Promise<string> {
  const result = await ai.run(
    AI_MODEL,
    {
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text }
      ],
      ...AI_CONFIG,
    },
    { 
      gateway: { 
        id: gateway_id, 
        skipCache: false, 
        cacheTtl: 3600000 
      } 
    }
  ) as AIResponse;

  return result.response.trim();
}

function processProducts(response: string): string[] {
  if (response.toLowerCase() === 'none') return [];
  return response.split(',')
    .map(p => p.trim())
    .filter(p => CLOUDFLARE_PRODUCTS.some(
      cp => p.toLowerCase().includes(cp.toLowerCase())
    ));
}

function processIssues(response: string): string[] {
  const issue = response.trim();
  return ISSUE_LABELS.some(label => label === issue) ? [issue] : ['General Question'];
}

// Main Handler
export async function POST(req: NextRequest) {
  try {
    const ctx = getRequestContext();
    if (!ctx?.env?.AI || !ctx?.env?.CLOUDFLARE_GATEWAY_ID) {
      throw new Error('Required environment variables are not set');
    }

    const { text } = (await req.json()) as { text: string };
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Parallel API calls
    const [sentimentResponse, productsResponse, issuesResponse] = await Promise.all([
      makeAICall(ctx.env.AI, ctx.env.CLOUDFLARE_GATEWAY_ID, PROMPTS.sentiment, text),
      makeAICall(ctx.env.AI, ctx.env.CLOUDFLARE_GATEWAY_ID, PROMPTS.products, text),
      makeAICall(ctx.env.AI, ctx.env.CLOUDFLARE_GATEWAY_ID, PROMPTS.issues, text),
    ]);

    const result: AnalysisResult = {
      sentiment: SENTIMENT_MAP[sentimentResponse.toLowerCase()],
      products: processProducts(productsResponse),
      issues: processIssues(issuesResponse),
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze text',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}