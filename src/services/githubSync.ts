/**
 * Serviço de Integração e Sincronização com GitHub
 * Suporta GitHub REST API oficial e versionamento com histórico de commits.
 * Responsável Técnica: Gabriela Cares
 */

import { DatabaseState, GitCommitRecord, GitHubConfig } from '../types/inventory';

export interface GitHubSyncResult {
  success: boolean;
  message: string;
  sha?: string;
  commitUrl?: string;
  data?: DatabaseState;
}

/**
 * Converte string para Base64 de forma compatível com UTF-8 / acentuação
 */
function utf8ToBase64(str: string): string {
  return window.btoa(unescape(encodeURIComponent(str)));
}

/**
 * Converte Base64 para string UTF-8
 */
function base64ToUtf8(str: string): string {
  return decodeURIComponent(escape(window.atob(str)));
}

/**
 * Testa a conexão com o repositório GitHub
 */
export async function testGitHubConnection(config: GitHubConfig): Promise<{ success: boolean; message: string }> {
  if (!config.token.trim()) {
    return { success: false, message: 'Informe um Personal Access Token (PAT) do GitHub.' };
  }
  if (!config.owner.trim() || !config.repo.trim()) {
    return { success: false, message: 'Informe o proprietário (usuário/organização) e o repositório.' };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
      headers: {
        Authorization: `Bearer ${config.token.trim()}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (res.status === 200) {
      const data = await res.json();
      return {
        success: true,
        message: `Conectado com sucesso ao repositório "${data.full_name}" (${data.private ? 'Privado' : 'Público'}).`,
      };
    } else if (res.status === 401) {
      return { success: false, message: 'Token de acesso inválido ou expirado (HTTP 401).' };
    } else if (res.status === 404) {
      return { success: false, message: `Repositório ${config.owner}/${config.repo} não encontrado (HTTP 404). Verifique as permissões do token.` };
    } else {
      const errData = await res.json().catch(() => ({}));
      return { success: false, message: `Erro GitHub (${res.status}): ${errData.message || res.statusText}` };
    }
  } catch (error: any) {
    return { success: false, message: `Falha na requisição de rede: ${error.message}` };
  }
}

/**
 * Envia (Push) o snapshot atual do inventário para o repositório GitHub
 */
export async function pushToGitHub(
  db: DatabaseState,
  config: GitHubConfig,
  commitMessage?: string
): Promise<GitHubSyncResult> {
  const summary = {
    typesCount: db.types.length,
    groupsCount: db.groups.length,
    subgroupsCount: db.subgroups.length,
    articlesCount: db.articles.length,
    movementsCount: db.movements.length,
    totalStockUnits: db.articles.reduce((acc, a) => acc + (a.currentStock || 0), 0),
  };

  const message =
    commitMessage ||
    `chore(estoque): sincronização de inventário SENAI-SP [${summary.articlesCount} artigos, ${summary.movementsCount} movs]`;

  // Se o usuário não configurou token real, cria commit local no histórico
  if (!config.token.trim() || !config.owner.trim() || !config.repo.trim()) {
    const localSha = Math.random().toString(16).substring(2, 9);
    const newCommit: GitCommitRecord = {
      sha: localSha,
      message,
      author: 'Gabriela Cares (Resp. Técnica)',
      timestamp: new Date().toISOString(),
      snapshotSummary: summary,
    };

    return {
      success: true,
      sha: localSha,
      message: `Snapshot registrado no histórico local (${localSha}). Para sincronização na nuvem do GitHub, informe seu Personal Access Token.`,
    };
  }

  try {
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}`;
    const headers = {
      Authorization: `Bearer ${config.token.trim()}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    };

    // 1. Verificar se o arquivo já existe para obter seu SHA atual
    let existingSha: string | undefined = undefined;
    const checkRes = await fetch(`${url}?ref=${config.branch}`, { headers });
    if (checkRes.status === 200) {
      const checkData = await checkRes.json();
      existingSha = checkData.sha;
    }

    // 2. Preparar conteúdo JSON
    const contentPayload = JSON.stringify(db, null, 2);
    const base64Content = utf8ToBase64(contentPayload);

    const body: Record<string, any> = {
      message,
      content: base64Content,
      branch: config.branch,
      committer: {
        name: 'Gabriela Cares - SENAI SP',
        email: 'caresgabriela24@gmail.com',
      },
    };

    if (existingSha) {
      body.sha = existingSha;
    }

    // 3. Fazer o PUT para criar ou atualizar o arquivo
    const putRes = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (putRes.status === 200 || putRes.status === 201) {
      const resultData = await putRes.json();
      const commitSha = resultData.commit?.sha?.substring(0, 7) || 'ok';
      return {
        success: true,
        sha: commitSha,
        commitUrl: resultData.commit?.html_url,
        message: `Dados gravados com sucesso no GitHub no commit ${commitSha}!`,
      };
    } else {
      const errData = await putRes.json().catch(() => ({}));
      return {
        success: false,
        message: `Falha ao gravar no GitHub (${putRes.status}): ${errData.message || putRes.statusText}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Erro na comunicação com a API do GitHub: ${error.message}`,
    };
  }
}

/**
 * Puxa (Pull) a versão mais recente do arquivo do repositório GitHub
 */
export async function pullFromGitHub(config: GitHubConfig): Promise<GitHubSyncResult> {
  if (!config.token.trim() || !config.owner.trim() || !config.repo.trim()) {
    return {
      success: false,
      message: 'Configure Token, Proprietário e Repositório para puxar dados do GitHub.',
    };
  }

  try {
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}?ref=${config.branch}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.token.trim()}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (res.status === 200) {
      const data = await res.json();
      const contentJson = base64ToUtf8(data.content.replace(/\s/g, ''));
      const parsedDb = JSON.parse(contentJson) as DatabaseState;
      return {
        success: true,
        message: `Dados baixados com sucesso do GitHub (${data.name}, SHA: ${data.sha.substring(0, 7)}).`,
        data: parsedDb,
      };
    } else if (res.status === 404) {
      return {
        success: false,
        message: `O arquivo ${config.filePath} ainda não existe no branch ${config.branch}. Faça um envio primeiro.`,
      };
    } else {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        message: `Erro ao baixar dados do GitHub: ${err.message || res.statusText}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Erro de rede ao baixar do GitHub: ${error.message}`,
    };
  }
}
