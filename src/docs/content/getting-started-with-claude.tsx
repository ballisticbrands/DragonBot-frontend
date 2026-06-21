import { Link } from "react-router-dom";
import { Callout } from "@/docs/components/Callout";
import { Screenshot } from "@/docs/components/Screenshot";
import { TableOfContents } from "@/docs/components/TableOfContents";

// Getting started with Claude — aimed at DragonBot users who don't have an
// AI client yet. Walks through creating a FREE Claude account, optionally
// installing the desktop app, and adding DragonBot as a custom connector,
// then explains free-plan usage limits and when upgrading helps. External
// links open in a new tab; swap Screenshot placeholders for real images by
// dropping files into public/docs/screenshots/.
export function GettingStartedWithClaude() {
  return (
    <>
      <h1>Getting started with Claude</h1>
      <p className="lead">
        Claude is the AI assistant we recommend pairing with DragonBot — and you
        can use it completely free. This guide walks you through creating a free
        Claude account and connecting DragonBot to it.
      </p>

      <Callout title="The short version">
        <p>
          Claude's free plan costs nothing, needs no credit card, and never
          expires. It's enough to connect DragonBot and start asking questions
          about your Amazon data today. You only pay if you want higher usage
          limits later.
        </p>
      </Callout>

      <TableOfContents
        items={[
          { id: "create-account", label: "Create your free Claude account" },
          { id: "desktop-app", label: "Get the desktop app (optional)" },
          { id: "connect-dragonbot", label: "Connect DragonBot to Claude" },
          { id: "free-limits", label: "Using Claude for free" },
          { id: "upgrading", label: "Upgrading for more tokens" },
        ]}
      />

      {/* ---------------------------------------------------------------- */}
      <h2 id="create-account">1. Create your free Claude account</h2>
      <p>
        Go to{" "}
        <a href="https://claude.ai" target="_blank" rel="noreferrer">
          claude.ai
        </a>{" "}
        and sign up with your email or a Google account. There's no trial timer
        and no credit card required — the free plan is permanent.
      </p>
      <p>
        Once you're signed in you can chat with Claude right away in your
        browser. That's all you need to get started.
      </p>

      {/* ---------------------------------------------------------------- */}
      <h2 id="desktop-app">2. Get the desktop app (optional)</h2>
      <p>
        You can do everything from the browser, but the desktop app is a nicer
        home for day-to-day use. Download it from{" "}
        <a href="https://claude.com/download" target="_blank" rel="noreferrer">
          claude.com/download
        </a>{" "}
        for macOS or Windows, then sign in with the same account. The app is free
        on the free plan.
      </p>

      {/* ---------------------------------------------------------------- */}
      <h2 id="connect-dragonbot">3. Connect DragonBot to Claude</h2>
      <p>
        DragonBot connects to Claude as a <strong>custom connector</strong> (an
        MCP server). The free plan supports one custom connector — which is all
        you need for DragonBot.
      </p>
      <ol>
        <li>
          First, create a DragonBot API key and copy your{" "}
          <strong>MCP connector URL</strong>. If you haven't done this yet,
          follow the{" "}
          <Link to="/docs/getting-started#connect-ai">
            "Connect DragonBot to your AI" step in the Getting Started guide
          </Link>
          .
        </li>
        <li>
          In Claude, open <strong>Settings → Connectors</strong> and choose{" "}
          <strong>Add custom connector</strong>.
        </li>
        <li>
          Paste in your DragonBot <strong>MCP connector URL</strong>, then finish
          adding the connector. Provide your API key if Claude prompts for
          authentication.
        </li>
        <li>
          Start a new chat and ask Claude something about your Amazon data — for
          example, <em>"What were my best-selling products last week?"</em> — to
          confirm the connection works.
        </li>
      </ol>
      <Screenshot
        alt="Claude's Settings → Connectors screen with the Add custom connector option."
        caption="Claude → Settings → Connectors → Add custom connector"
      />
      <p>
        For Anthropic's own walkthrough of this screen, see their help article on{" "}
        <a
          href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp"
          target="_blank"
          rel="noreferrer"
        >
          custom connectors using remote MCP
        </a>
        .
      </p>

      {/* ---------------------------------------------------------------- */}
      <h2 id="free-limits">Using Claude for free</h2>
      <p>
        The free plan gives you a generous amount of usage to get going. Claude
        works on a rolling usage window: you get a batch of messages that resets
        every few hours, rather than one fixed daily total. In practice that's
        enough for plenty of back-and-forth with your Amazon data each day.
      </p>
      <p>A few things to know about the free plan:</p>
      <ul>
        <li>No credit card, no trial expiry — it stays free for as long as you use it.</li>
        <li>
          Usage resets on a rolling window (every few hours), so if you hit the
          limit you can pick back up a bit later.
        </li>
        <li>
          During very busy periods, paid plans are prioritized, so free responses
          may be a little slower.
        </li>
      </ul>

      {/* ---------------------------------------------------------------- */}
      <h2 id="upgrading">Upgrading for more tokens</h2>
      <p>
        <strong>You don't need to pay to use DragonBot with Claude.</strong> The
        free plan is a complete way to get started, and many users never need
        more.
      </p>
      <p>
        That said, if you find yourself chatting with your data all day and
        bumping into the free limits, upgrading to a paid plan gives you{" "}
        <strong>much higher usage</strong> (more messages and tokens before you
        hit a limit), priority access during busy times, and access to Claude's
        most capable models. You can compare plans on the{" "}
        <a href="https://claude.com/pricing" target="_blank" rel="noreferrer">
          Claude pricing page
        </a>
        .
      </p>
      <Callout title="Start free, upgrade only if you need to">
        <p>
          Our recommendation: start on the free plan, connect DragonBot, and see
          how much you use it. If you hit the limits often enough that it slows
          you down, that's the right time to upgrade — not before.
        </p>
      </Callout>
    </>
  );
}
