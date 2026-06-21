// Getting started — placeholder content. Replace the prose below with the
// real onboarding walkthrough. Authored as semantic HTML; the .docs-prose
// wrapper (applied by DocsLayout) handles all typographic styling.
export function GettingStarted() {
  return (
    <>
      <h1>Getting started</h1>
      <p className="lead">
        Welcome to the DragonBot documentation. This guide will walk you through
        setting up DragonBot and connecting your first AI agent.
      </p>

      <p>
        <em>
          This page is a placeholder. Real content is coming soon — the sections
          below outline what this guide will cover.
        </em>
      </p>

      <h2>1. Create your account</h2>
      <p>
        Sign in to your DragonBot dashboard to get started. From there you can
        mint scoped API keys and connect your Amazon Seller Central account.
      </p>

      <h2>2. Mint an API key</h2>
      <p>
        Generate a scoped API key from the dashboard. This key authorizes your AI
        agent to talk to your DragonBot instance.
      </p>

      <h2>3. Connect your agent</h2>
      <p>
        Point Claude, ChatGPT, or Cursor at your DragonBot MCP endpoint using the
        key you just created. Once connected, your agent can query Seller Central
        and Amazon Advertising data on your behalf.
      </p>

      <h2>Next steps</h2>
      <ul>
        <li>Explore the available MCP tools.</li>
        <li>Review usage and billing in your dashboard.</li>
        <li>Reach out to support if you get stuck.</li>
      </ul>
    </>
  );
}
