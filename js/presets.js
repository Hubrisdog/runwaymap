/*
 * Curated SaaS vendor presets for RunwayMap.
 * Prices represent standard developer and B2B pricing tiers.
 * includes stacks for quick single-click loading.
 */

const stacks = {
  solo: {
    name: "Solo Founder",
    description: "Core tools for a single indie developer launching a product.",
    subscriptions: [
      { name: "Cursor Pro", domain: "cursor.sh", price: 20, cycle: "Monthly", color: "indigo", category: "Dev Tools", isSeatBased: true },
      { name: "OpenAI API", domain: "openai.com", price: 20, cycle: "Monthly", color: "orange", category: "AI / API", isSeatBased: false },
      { name: "Vercel Pro", domain: "vercel.com", price: 20, cycle: "Monthly", color: "cyan", category: "Infrastructure", isSeatBased: true },
      { name: "Supabase Pro", domain: "supabase.com", price: 25, cycle: "Monthly", color: "cyan", category: "Infrastructure", isSeatBased: false },
      { name: "GitHub Pro", domain: "github.com", price: 4, cycle: "Monthly", color: "purple", category: "Dev Tools", isSeatBased: true }
    ]
  },
  ai: {
    name: "AI Startup",
    description: "For small teams building AI products with infrastructure & vector databases.",
    subscriptions: [
      { name: "AWS", domain: "aws.amazon.com", price: 200, cycle: "Monthly", color: "cyan", category: "Infrastructure", isSeatBased: false },
      { name: "OpenAI API", domain: "openai.com", price: 150, cycle: "Monthly", color: "orange", category: "AI / API", isSeatBased: false },
      { name: "Anthropic Claude Pro", domain: "claude.ai", price: 20, cycle: "Monthly", color: "orange", category: "AI / API", isSeatBased: true },
      { name: "Supabase Pro", domain: "supabase.com", price: 25, cycle: "Monthly", color: "cyan", category: "Infrastructure", isSeatBased: false },
      { name: "GitHub Enterprise", domain: "github.com", price: 21, cycle: "Monthly", color: "purple", category: "Dev Tools", isSeatBased: true },
      { name: "Pinecone", domain: "pinecone.io", price: 70, cycle: "Monthly", color: "orange", category: "AI / API", isSeatBased: false }
    ]
  },
  agency: {
    name: "Dev Agency",
    description: "Collaboration and development stack for small developer agencies.",
    subscriptions: [
      { name: "Google Workspace", domain: "workspace.google.com", price: 12, cycle: "Monthly", color: "green", category: "Collaboration", isSeatBased: true },
      { name: "Slack Pro", domain: "slack.com", price: 8.75, cycle: "Monthly", color: "purple", category: "Collaboration", isSeatBased: true },
      { name: "Figma Pro", domain: "figma.com", price: 15, cycle: "Monthly", color: "pink", category: "Collaboration", isSeatBased: true },
      { name: "Linear", domain: "linear.app", price: 10, cycle: "Monthly", color: "indigo", category: "Dev Tools", isSeatBased: true },
      { name: "Vercel Pro", domain: "vercel.com", price: 20, cycle: "Monthly", color: "cyan", category: "Infrastructure", isSeatBased: true },
      { name: "Sentry", domain: "sentry.io", price: 29, cycle: "Monthly", color: "rose", category: "Security / Ops", isSeatBased: false }
    ]
  }
};

const presets = [
  // Infrastructure & Hosting
  { name: "AWS", domain: "aws.amazon.com", price: 150, cycle: "Monthly", color: "cyan", category: "Infrastructure", isSeatBased: false, popular: true },
  { name: "Vercel Pro", domain: "vercel.com", price: 20, cycle: "Monthly", color: "cyan", category: "Infrastructure", isSeatBased: true, popular: true },
  { name: "Supabase Pro", domain: "supabase.com", price: 25, cycle: "Monthly", color: "cyan", category: "Infrastructure", isSeatBased: false, popular: true },
  { name: "Cloudflare Pro", domain: "cloudflare.com", price: 25, cycle: "Monthly", color: "cyan", category: "Infrastructure", isSeatBased: false },
  { name: "Heroku Pro", domain: "heroku.com", price: 50, cycle: "Monthly", color: "purple", category: "Infrastructure", isSeatBased: false },
  { name: "DigitalOcean", domain: "digitalocean.com", price: 24, cycle: "Monthly", color: "cyan", category: "Infrastructure", isSeatBased: false },
  { name: "MongoDB Atlas", domain: "mongodb.com", price: 57, cycle: "Monthly", color: "green", category: "Infrastructure", isSeatBased: false },

  // AI & APIs
  { name: "OpenAI API", domain: "openai.com", price: 120, cycle: "Monthly", color: "orange", category: "AI / API", isSeatBased: false, popular: true },
  { name: "Anthropic Claude Pro", domain: "claude.ai", price: 20, cycle: "Monthly", color: "orange", category: "AI / API", isSeatBased: true, popular: true },
  { name: "Pinecone", domain: "pinecone.io", price: 70, cycle: "Monthly", color: "orange", category: "AI / API", isSeatBased: false },
  { name: "Midjourney", domain: "midjourney.com", price: 30, cycle: "Monthly", color: "indigo", category: "AI / API", isSeatBased: true },

  // Dev Tools
  { name: "GitHub Enterprise", domain: "github.com", price: 21, cycle: "Monthly", color: "purple", category: "Dev Tools", isSeatBased: true, popular: true },
  { name: "Cursor Pro", domain: "cursor.sh", price: 20, cycle: "Monthly", color: "indigo", category: "Dev Tools", isSeatBased: true, popular: true },
  { name: "Linear", domain: "linear.app", price: 10, cycle: "Monthly", color: "indigo", category: "Dev Tools", isSeatBased: true },
  { name: "Copilot Business", domain: "github.com", price: 19, cycle: "Monthly", color: "purple", category: "Dev Tools", isSeatBased: true },

  // Collaboration
  { name: "Slack Pro", domain: "slack.com", price: 8.75, cycle: "Monthly", color: "purple", category: "Collaboration", isSeatBased: true, popular: true },
  { name: "Figma Pro", domain: "figma.com", price: 15, cycle: "Monthly", color: "pink", category: "Collaboration", isSeatBased: true, popular: true },
  { name: "Google Workspace", domain: "workspace.google.com", price: 12, cycle: "Monthly", color: "green", category: "Collaboration", isSeatBased: true },
  { name: "Notion Plus", domain: "notion.so", price: 10, cycle: "Monthly", color: "slate", category: "Collaboration", isSeatBased: true },
  { name: "Zoom Pro", domain: "zoom.us", price: 15.99, cycle: "Monthly", color: "blue", category: "Collaboration", isSeatBased: true },

  // Security & Ops
  { name: "Sentry Pro", domain: "sentry.io", price: 29, cycle: "Monthly", color: "rose", category: "Security / Ops", isSeatBased: false },
  { name: "Datadog Pro", domain: "datadog.com", price: 75, cycle: "Monthly", color: "rose", category: "Security / Ops", isSeatBased: false },
  { name: "Auth0 Pro", domain: "auth0.com", price: 23, cycle: "Monthly", color: "orange", category: "Security / Ops", isSeatBased: false },
  { name: "Logtail", domain: "betterstack.com", price: 29, cycle: "Monthly", color: "cyan", category: "Security / Ops", isSeatBased: false },

  // Marketing & Sales
  { name: "HubSpot Starter", domain: "hubspot.com", price: 30, cycle: "Monthly", color: "orange", category: "Marketing / Sales", isSeatBased: true },
  { name: "Mailchimp Pro", domain: "mailchimp.com", price: 50, cycle: "Monthly", color: "yellow", category: "Marketing / Sales", isSeatBased: false },
  { name: "Postmark Pro", domain: "postmarkapp.com", price: 15, cycle: "Monthly", color: "yellow", category: "Marketing / Sales", isSeatBased: false }
];

function getCategories() {
  const cats = [];
  for (let i = 0; i < presets.length; i++) {
    const cat = presets[i].category;
    if (cats.indexOf(cat) === -1) {
      cats.push(cat);
    }
  }
  return cats;
}
