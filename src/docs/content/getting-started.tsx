import { Link } from "react-router-dom";
import { Screenshot } from "@/docs/components/Screenshot";
import { Callout } from "@/docs/components/Callout";
import { TableOfContents } from "@/docs/components/TableOfContents";

// Getting started — walks a new user from account creation through
// connecting Amazon and wiring DragonBot into their AI client. Steps mirror
// the real app UI (sign-up form, Dashboard → Data tab, Dashboard → Keys
// tab). Swap the <Screenshot> placeholders for real images by dropping
// files into public/docs/screenshots/ and passing a `src`.
export function GettingStarted() {
  return (
    <>
      <h1>Getting started</h1>
      <p className="lead">
        Set up DragonBot in three steps: create your account, connect your
        Amazon Seller and Ads accounts, and link DragonBot to the AI you chat
        with. The whole thing takes a few minutes.
      </p>

      <TableOfContents
        items={[
          { id: "create-account", label: "Create your DragonBot account" },
          { id: "connect-amazon", label: "Connect your Amazon accounts" },
          { id: "connect-ai", label: "Connect DragonBot to your AI" },
        ]}
      />

      {/* ---------------------------------------------------------------- */}
      <h2 id="create-account">1. Create your DragonBot account</h2>
      <p>
        Head to the <Link to="/sign-up">sign-up page</Link> and create your
        account. You'll start a free 7-day trial — no credit card required.
      </p>
      <ol>
        <li>Enter your name, work email, and a password (at least 8 characters).</li>
        <li>
          Click <strong>Create account</strong>. You'll land straight on your
          dashboard.
        </li>
      </ol>
      <Screenshot
        alt="The DragonBot sign-up form — name, work email, and password fields with a Create account button."
        caption="The sign-up form at app.getdragonbot.com/sign-up"
      />

      {/* ---------------------------------------------------------------- */}
      <h2 id="connect-amazon">2. Connect your Amazon accounts</h2>
      <p>
        DragonBot reads your Amazon data through official Amazon APIs. From your
        dashboard, open the <strong>Data</strong> tab to connect your accounts.
      </p>

      <h3>Connect Amazon Seller Central</h3>
      <ol>
        <li>
          In the <strong>Amazon Seller Central</strong> card, click{" "}
          <strong>Connect Amazon Seller Central account</strong>.
        </li>
        <li>
          A secure Amazon window opens. Sign in and authorize DragonBot to read
          your Seller Central data (SP-API).
        </li>
        <li>
          When you're done, the window closes and your account appears in the
          card. You can connect multiple seller accounts.
        </li>
      </ol>
      <Screenshot
        alt="The Data tab showing the Amazon Seller Central card with a Connect Amazon Seller Central account button."
        caption="Dashboard → Data → Amazon Seller Central"
      />

      <h3>Connect Amazon Ads</h3>
      <ol>
        <li>
          In the <strong>Amazon Ads</strong> card, click{" "}
          <strong>Connect Amazon Ads account</strong>.
        </li>
        <li>
          Authorize DragonBot in the Amazon window that opens. You can connect
          multiple ads accounts here too.
        </li>
      </ol>
      <Screenshot
        alt="The Data tab showing the Amazon Ads card with a Connect Amazon Ads account button."
        caption="Dashboard → Data → Amazon Ads"
      />

      <Callout title="Your data is syncing">
        <p>
          After you connect, DragonBot begins pulling your historical data in
          the background. The first reports usually land within ~10 minutes, and
          each connection shows a live <strong>Sync progress</strong> bar. You
          don't need to wait for it to finish before moving on.
        </p>
      </Callout>

      {/* ---------------------------------------------------------------- */}
      <h2 id="connect-ai">3. Connect DragonBot to your AI</h2>
      <p>
        DragonBot works as an <strong>MCP server</strong> — it plugs into AI
        clients like Claude so your assistant can pull live data from your
        Amazon accounts. To connect, you'll create an API key and add it to your
        AI client.
      </p>

      <Callout title="Not using AI yet?">
        <p>
          We recommend starting with{" "}
          <strong>Claude's FREE plan</strong> — it supports custom connectors at
          no cost.{" "}
          <Link to="/docs/getting-started-with-claude">
            Follow our guide to getting started with Claude →
          </Link>
        </p>
      </Callout>

      <h3>Create an API key</h3>
      <ol>
        <li>
          From your dashboard, open the <strong>Keys</strong> tab and click{" "}
          <strong>Create key</strong>.
        </li>
        <li>
          Give the key a name that describes where you'll use it (for example,{" "}
          <code>claude-desktop</code>), and choose which tool scopes it can
          access.
        </li>
        <li>
          Click <strong>Create key</strong>. DragonBot shows your{" "}
          <strong>API key</strong> and an <strong>MCP connector URL</strong>.
        </li>
      </ol>

      <Callout tone="warn" title="Copy your key now">
        <p>
          This is the only time the full key is shown. Copy it somewhere safe
          before you dismiss the banner — you can always revoke it and create a
          new one if you lose it.
        </p>
      </Callout>

      <Screenshot
        alt="The Keys tab after creating a key, showing the API key and MCP connector URL with copy buttons."
        caption="Dashboard → Keys → Create key"
      />

      <h3>Add it to your AI client</h3>
      <p>
        In your MCP client (such as Claude), add a new custom connector and paste
        in the values DragonBot gave you:
      </p>
      <ul>
        <li>
          <strong>MCP connector URL</strong> — the server address your AI
          connects to.
        </li>
        <li>
          <strong>API key</strong> — provide this when the client asks for
          authentication.
        </li>
      </ul>
      <p>
        Once the connector is added, your AI can query your Amazon Seller and Ads
        data on demand. Try asking it something like{" "}
        <em>"What were my best-selling products last week?"</em> to confirm the
        connection works.
      </p>

      <Callout title="You're all set">
        <p>
          That's it — your account is live, your Amazon data is syncing, and your
          AI is connected. From here you can add more accounts or mint
          additional scoped keys any time from your dashboard.
        </p>
      </Callout>
    </>
  );
}
