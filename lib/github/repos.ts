import { githubFetch, githubJsonPaginated } from "./client";
import { cacheGet, cacheKey, cacheSet } from "./cache";

interface GithubRepo {
  name: string;
  full_name: string;
  private: boolean;
}

const MAX_ORG_REPOS = 60;
const REPO_CACHE_TTL_MS = 10 * 60 * 1000;

export interface ResolvedRepositories {
  names: string[];
  inaccessible: string[];
}

async function repositoryAccessible(
  token: string,
  owner: string,
  repo: string,
): Promise<boolean> {
  const res = await githubFetch(token, `/repos/${owner}/${repo}`, {
    method: "HEAD",
  });
  return res.ok;
}

export async function resolveRepositoriesForScan(
  token: string,
  owner: string,
  allowList?: string[],
): Promise<ResolvedRepositories> {
  if (allowList && allowList.length > 0) {
    const cacheId = cacheKey(["repos-resolved", owner, allowList.join(",")]);
    const cached = cacheGet<ResolvedRepositories>(cacheId);
    if (cached) return cached;

    const names: string[] = [];
    const inaccessible: string[] = [];
    for (const repo of allowList) {
      if (await repositoryAccessible(token, owner, repo)) {
        names.push(repo);
      } else {
        inaccessible.push(repo);
      }
    }

    const resolved = { names, inaccessible };
    cacheSet(cacheId, resolved, REPO_CACHE_TTL_MS);
    return resolved;
  }

  const cacheId = cacheKey(["repos", owner, "*"]);
  const cached = cacheGet<string[]>(cacheId);
  if (cached) {
    return { names: cached, inaccessible: [] };
  }

  const repos = await githubJsonPaginated<GithubRepo>(
    token,
    `/orgs/${owner}/repos?type=all&sort=updated`,
    3,
  );

  const names = repos.map((r) => r.name).slice(0, MAX_ORG_REPOS);
  cacheSet(cacheId, names, REPO_CACHE_TTL_MS);
  return { names, inaccessible: [] };
}

/** @deprecated Use resolveRepositoriesForScan */
export async function listOrgRepositories(
  token: string,
  org: string,
  allowList?: string[],
): Promise<string[]> {
  const resolved = await resolveRepositoriesForScan(token, org, allowList);
  return resolved.names;
}
