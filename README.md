# Jira Sprint Task Viewer

Lightweight developer tool to view Jira sprint issues (active and closed), with filtering and CSV/Excel export.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- Jira Cloud REST API (credentials and board config from **environment variables**)
- TanStack React Query, iron-session (optional UI login / OAuth)

## Quick start (recommended)

### 1. Copy and edit environment

```bash
cp .env.example .env.local
```

### 2. Create Jira API token

1. Open [Atlassian API token settings](https://id.atlassian.com/manage-profile/security/api-tokens).
2. Sign in using your company Atlassian account.
3. Click **Create API token**.
4. Enter a label, for example `Jira Sprint Task Viewer`.
5. Set the expiration period according to your organization's policy.
6. Click **Create**.
7. Copy the generated token immediately and store it securely.

**Important:** Atlassian API tokens are displayed only when created. Store the token securely.

### 3. Configure Jira environment variables

```env
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=<atlassian-api-token>
JIRA_BOARD_ID=<numeric-board-id>
JIRA_PROJECT_KEY=AP4,AP1
JIRA_STORY_POINTS_FIELD=customfield_10016
```

`JIRA_STORY_POINTS_FIELD` can be left empty; the app will try to **auto-discover** it on the first sprint load.

### 4. Create GitHub token (optional)

GitHub token is optional. Jira Development panel integration provides PR links, titles, and statuses without a GitHub token.

A GitHub token is needed only for additional PR enrichment, such as LOC additions/deletions and created/merged dates when Jira does not provide them.

1. Open [GitHub Fine-grained Personal Access Token settings](https://github.com/settings/personal-access-tokens/new).
2. Set **Token name** to `Jira Sprint Task Viewer`.
3. Select your GitHub organization as the resource owner.
4. Select the repositories containing the PRs you want to access.
5. Configure the following repository permissions:

   | Permission | Access |
   |---|---|
   | Contents | Read-only |
   | Pull requests | Read-only |
   | Metadata | Read-only |

6. Set an expiration period allowed by your organization's policy.
   - For Chewy enterprise, token lifetime must not exceed **366 days**.
7. Click **Generate token**.
8. Copy the token immediately and store it securely.

**Note:** Your organization may require approval for the token before it can access private repositories.

### 5. Configure GitHub environment variables (optional)

```env
GITHUB_TOKEN=<github-personal-access-token>
GITHUB_ORG=Chewy-Inc
GITHUB_OWNER=Chewy-Inc
```

- `GITHUB_TOKEN`: GitHub Personal Access Token.
- `GITHUB_ORG`: GitHub organization name.
- `GITHUB_OWNER`: GitHub repository owner when it differs from `GITHUB_ORG`.

Do not configure GitHub credentials if you only need Jira Development panel PR links.

### 6. Run the application

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

When `JIRA_BASE_URL`, `JIRA_EMAIL`, and `JIRA_API_TOKEN` are set, you skip the login page.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `JIRA_BASE_URL` | Yes* | Site URL, e.g. `https://acme.atlassian.net` |
| `JIRA_EMAIL` | Yes* | Atlassian account email |
| `JIRA_API_TOKEN` | Yes* | [Create API token](https://id.atlassian.com/manage-profile/security/api-tokens) |
| `JIRA_BOARD_ID` | Yes† | Scrum/Kanban board ID for the active sprint |
| `JIRA_PROJECT_KEY` | No | Comma-separated keys (e.g. `AP4,AP1`); only matching issue keys are shown |
| `JIRA_STORY_POINTS_FIELD` | No† | Custom field ID; auto-discovered if omitted |
| `GITHUB_TOKEN` | No | Enriches Jira-linked PRs with GitHub API data |
| `GITHUB_ORG` | No† | GitHub organization; required only when GitHub token is configured |
| `GITHUB_OWNER` | No | Repository owner when different from `GITHUB_ORG` |
| `GITHUB_REPOS` | No | Reserved for future discovery; unused in Development panel mode |
| `DEBUG_JIRA_DEV_STATUS` | No | Set `1` to enable Jira Development panel server logs |

\* Required for environment-based authentication; otherwise use UI login or OAuth.

† Required for sprint report unless configured in Settings UI.

Env values are **server-only** and are never sent to the browser.

**Precedence:** Environment variables are defaults. Values saved in Settings are stored in browser `localStorage` and sent with each report request.

## GitHub (optional enrichment)

Pull request links, titles, and statuses come from Jira's **Development panel** using your Jira session (OAuth or API token). **No GitHub token is required** for this.

When `GITHUB_TOKEN` is configured, the application enriches Jira-linked PRs with GitHub API data, such as LOC and created/merged dates, when Jira omits them.

## How Jira tickets map to GitHub PRs

1. **Jira Development panel** – `lib/jira/dev-status/` calls:
   - `/rest/dev-status/latest/issue/summary`
   - `/rest/dev-status/latest/issue/detail`

   It retrieves GitHub-linked PRs from Jira's development integration.

2. **Optional GitHub API** – Enriches linked PRs with LOC/dates when `GITHUB_TOKEN` is configured. It never fabricates missing fields.

3. Multiple PRs per ticket are supported.

4. PRs are deduplicated by URL.

5. "No PRs" appears only when Jira dev-status returns no linked pull requests for that issue.

API:

- `GET /api/sprint/pull-requests` (environment configuration only)
- `POST /api/sprint/pull-requests` with `{ config, tickets }` (used by the UI)

## Finding Board ID & Story Points field

See Atlassian documentation or use **Settings → Auto-discover** when not using locked environment configuration.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
```

## Security

- Keep `JIRA_API_TOKEN` and `GITHUB_TOKEN` in `.env.local` only.
- Never commit `.env.local`.
- Use least-privilege tokens and OAuth scopes.
- Never expose credentials in client-side code or `NEXT_PUBLIC_*` variables.
- Rotate tokens when compromised or expired.
- Follow company policies for token approval and expiration.