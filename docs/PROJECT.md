# IAapp

Status: concept and integration validation; no working app or hackathon submission yet.

## Product
Messaging for people and selectively connected original AI conversations. Users choose which conversations to connect; no bulk history import. Rooms store their own messages and explicit agreements. Private source-chat history is not automatically shared.

## First acceptance test
One human, two original compatible ChatGPT Work conversations, one room. Deliver a message, invoke the subscribed chat through MCP Events, return its response through an authorized MCP tool, persist it and display it. Test closed UI, duplicate delivery, retry, permission revocation and prevention of response loops. Account availability remains to be verified. Claude and Grok original-chat connectivity remains unconfirmed.

## Identity
Official Sign in with ChatGPT is the proposed registration path, subject to integration eligibility. Identity sign-in does not import conversations or memory. Individual chat pairing is a separate authorization.

## Proposed stack
Next.js, TypeScript, Tailwind and Vercel for the PWA; Supabase Postgres, Realtime and Storage for messages and attachments; Node.js MCP service and durable event delivery on Railway. Authentication provider choice must accommodate official ChatGPT sign-in. No infrastructure has been provisioned.

## Work allocation proposal
- Luis: product scope, acceptance and submission representative if selected.
- Connection workstream: prove sign-in eligibility and original-chat round trip.
- Messaging workstream: identities, rooms, permissions, durable messages and event delivery.
- Interface workstream: approved visual direction, inbox, direct conversation and groups.
- Delivery workstream: integration tests, reproducible setup, English demo and submission package.

Workstream owners other than Luis are not assigned. AI assistants are development tools, not separately registered human contestants.

## Hackathons reviewed 2026-10-30 America/Cancun
PayPal: individuals, teams and organizations allowed; multiple entries must be substantially different. PayPal sandbox integration must be central, alongside AI. Public source repository with an open-source license; functional demo; video under three minutes; English materials or translations. Existing projects need significant updates during the submission period. Deadline November 12 at 12:00 PST (15:00 Cancun). IAapp currently lacks the required PayPal use case and implementation.

Hack the Audience (Extriver): assumed second event from discussion, not yet confirmed by Luis. November 5–December 5; up to three team members; one project for one creator. Advertised creator partnership includes 20% of contracted net revenue for 24 months. Final eligibility, IP and commercialization terms remain to be verified; linked rules currently return the landing page. No registration or commercial agreement accepted.

Recommendation: one focused submission with explicit workstreams first. Do not duplicate the same project under different contestant identities.

## License
Apache-2.0, see ../LICENSE. Permits commercial use subject to its terms; does not make the project nonprofit or guarantee compliance with third-party terms. Dependencies retain their own licenses.

## Sources
- https://paypalaihackathon.devpost.com/rules
- https://extriver.com/event1/
- https://www.apache.org/licenses/LICENSE-2.0
- https://developers.openai.com/siwc/quickstart
- https://developers.openai.com/plugins/build/mcp-events
- https://help.openai.com/en/articles/20001410-sign-in-with-chatgpt
