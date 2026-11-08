# Pi Agent 配置備份

保存可在另一台機器還原的 Pi 配置，不保存插件版本、登入憑證、對話紀錄或工具安裝目錄。

使用的是 `@earendil-works/pi-coding-agent`。插件來源以 `.pi/agent/settings.json` 的 `packages` 為準，全部不鎖版本。
因此還原的是相同的設定與插件清單，不保證不同時間安裝的插件、MCP 套件或模型目錄有完全相同的行為。

## 保存範圍

| 路徑 | 用途 |
| --- | --- |
| `.pi/agent/settings.json` | 10 個插件來源、預設模型、思考等級及 smartCompact 設定 |
| `.pi/agent/models.json` | 自訂 provider／模型定義 |
| `.pi/agent/mcp.json` | 選定的 4 個 MCP 服務器的連線／啟動資訊及啟用狀態 |
| `.pi/agent/subagents.json` | 子代理行為設定 |
| `.pi/agent/agents/*.md` | 7 個子代理的提示詞、模型及工具設定 |
| `.pi/agent/model-system-prompt/*.md` | DeepSeek、GLM、GPT 的系統提示詞 |
| `.pi/agent/agent-tool-description.md` | 子代理工具說明模板 |
| `.pi/agent/extensions/delegation.ts` | 本地自訂擴充，不是可省略的 npm 安裝產物 |
| `.pi/agent/pi-atelier.json` | Atelier 設定 |
| `.pi/agent/pi-goal-x-settings.json` | Goal X 設定 |
| `.pi/agent/web-search.json` | 網頁搜尋／回答模型設定 |
| `.pi-lens/config.json` | Lens 全域設定 |

`models-store.json` 是 Pi 管理的模型目錄快取，不是手寫模型配置，因此不保存。
`npm/package.json`、`npm/package-lock.json` 和整個 `node_modules/` 也不保存。
`.pi-lens/rules/opengrep-registry.yaml` 是下載的第三方規則快取，不是手寫配置，不保存；需要時在新機器依 Lens 的安裝提示取得規則。
`settings.json` 的 `lastChangelogVersion` 只是 Pi 的更新提示狀態，不是插件版本鎖定。

`.gitignore` 採明確白名單：新檔案預設不公開。新增插件的獨立配置、代理、提示詞或 MCP 輔助檔案後，需先檢查內容，再將對應路徑加入白名單。
插件若把設定寫在本目錄以外，必須另外收錄，這個備份不會自動捕捉。

## MCP 服務器

下表是備份時的狀態；實際設定以 `mcp.json` 為準。目前只收錄以下 4 個 MCP，皆啟用。
現有設定共用 `timeout: 90`、`exposure: "codemode"`。

| 名稱 | 狀態 | 連線或啟動方式 |
| --- | --- | --- |
| `context7` | 啟用 | `https://mcp.context7.com/mcp` |
| `nano-pdf-mcp` | 啟用 | `uvx nano-pdf-mcp` |
| `sequential-thinking` | 啟用 | `npx -y @modelcontextprotocol/server-sequential-thinking` |
| `arxiv-mcp-server` | 啟用 | `uvx --from arxiv-mcp-server arxiv-mcp-server` |

### 官方來源與下載入口

安裝時以以下「發布平台 + 完整套件名稱 + 原始碼擁有者」辨認，不要只搜尋 MCP 的顯示名稱。
連結不鎖版本；PyPI 的「Download files」和 npm 的套件頁可取得發布檔案，GitHub 的「Code → Download ZIP」可下載源碼。

| 配置名稱 | 指定來源／原始碼 | 套件下載入口與完整名稱 |
| --- | --- | --- |
| `context7` | [upstash/context7](https://github.com/upstash/context7) · [官方連線文件](https://context7.com/docs/resources/all-clients) | 本配置使用官方託管服務，**不需下載**；若另行改成本地部署，官方 npm 套件為 [`@upstash/context7-mcp`](https://www.npmjs.com/package/@upstash/context7-mcp) |
| `nano-pdf-mcp` | [eren0315/nano-pdf-mcp](https://github.com/eren0315/nano-pdf-mcp) | PyPI：[`nano-pdf-mcp`](https://pypi.org/project/nano-pdf-mcp/#files) |
| `sequential-thinking` | [modelcontextprotocol/servers 的 sequentialthinking](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking) | npm：[`@modelcontextprotocol/server-sequential-thinking`](https://www.npmjs.com/package/@modelcontextprotocol/server-sequential-thinking) |
| `arxiv-mcp-server` | [blazickjp/arxiv-mcp-server](https://github.com/blazickjp/arxiv-mcp-server) | PyPI：[`arxiv-mcp-server`](https://pypi.org/project/arxiv-mcp-server/#files) |

**特別注意 arXiv：上游明確指出 npm 有同名但無關的套件。此處只使用 `blazickjp` 的 PyPI 發布，不要換成 `npx arxiv-mcp-server`。**
Nano PDF 也必須對應 `eren0315/nano-pdf-mcp`，不要將其他名為 `nano-pdf` 的專案視為同一個服務。
Context7 的本地套件只提供來源辨識，本配置仍維持 `https://mcp.context7.com/mcp`，不會同時啟動本地版本。

npm 網頁若因防爬機制回傳 403，可使用官方 registry 的套件資訊入口：
[Context7](https://registry.npmjs.org/@upstash/context7-mcp/latest)、
[Sequential Thinking](https://registry.npmjs.org/@modelcontextprotocol/server-sequential-thinking/latest)。
其中 `repository` 可核對源碼擁有者，`dist.tarball` 是當前發布版的實際下載網址；這些入口不鎖版本。

本地啟動的 MCP 需要目標機器可連線下載套件；啟動命令不會替你還原第三方服務帳號、API key 或服務自己的私有配置。

## 在新 Linux server 還原

### 1. 安裝前置工具

- Node.js 24 或更新版本，包含 `npm` 和 `npx`。Pi 本身最低要求為 22.19，但本配置未鎖版本的 Sequential Thinking 套件目前要求 Node.js 24 或更新版本。
- [uv](https://docs.astral.sh/uv/getting-started/installation/)，並確認 `uv`、`uvx` 在 `PATH` 中。
- Python 3.11 或更新版本可供 `uvx` 使用；目前 arXiv 套件要求至少 3.11，Nano PDF 要求至少 3.10。版本需求仍以各套件發布頁為準。
- Git。
- Lens 所需的各語言工具依使用的語言另裝，或依插件的安裝提示處理；不要從 Windows 複製執行檔。

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

### 2. 從乾淨 clone 複製配置到使用者目錄

先 clone 本倉庫，進入 clone 的根目錄。下列步驟只適用於新機器；若已有配置，先自行備份，以免同名檔案被覆蓋。
若設定了 `PI_CODING_AGENT_DIR` 或 `PI_LENS_CONFIG_PATH`，請改用它們指定的部署位置，不要混用預設路徑。

```bash
mkdir -p "$HOME/.pi/agent" "$HOME/.pi-lens"
cp -R .pi/agent/. "$HOME/.pi/agent/"
cp .pi-lens/config.json "$HOME/.pi-lens/config.json"
```

**必須從乾淨 clone 執行**，不要從原始備份資料夾整目錄複製。原始資料夾仍可能有被 Git 忽略的憑證和 1 GiB 以上的執行資料。

Pi 預設讀取 `~/.pi/agent`，不是當前專案下的 `.pi/agent`。
若要直接使用 clone 內的 agent 目錄，需明確設定 `PI_CODING_AGENT_DIR` 為其絕對路徑；
Lens 配置則可用 `PI_LENS_CONFIG_PATH` 明確指定。建議採以上的「部署副本」方式，避免登入資料和本機修改混進倉庫。

### 3. 調整機器依賴，安裝插件並登入

1. 確認 `node`、`npx`、`uv`、`uvx` 可由啟動 Pi 的使用者找到。透過 systemd 啟動時需另外設定服務的 `PATH`。
2. 在倉庫以外的正常工作目錄執行以下命令，以免專案級配置干擾：

```bash
pi update --extensions
pi list
pi
```

Pi 會依 `settings.json` 的插件來源安裝缺少的套件，安裝產物放在 agent 目錄的 `npm/`。
不要使用 `PI_OFFLINE=1` 還原缺少的套件。`pi update` 單獨執行是更新 Pi 本身，不等於更新插件。

在 Pi 互動介面用 `/login` 重新登入需要的 provider。此配置使用 `openai-codex` 和 `zai-coding-cn` 等 provider；
子代理指定的模型也必須在新帳號可用，否則需調整對應代理的 `model`，這不會因安裝插件而自動解決。
MCP 若要求 OAuth 或 API key，依 `pi mcp --help` 及各服務說明重新配置，不能共用公開倉庫保存憑證。

### 4. 還原後檢查

- `pi list` 列出預期的 10 個插件。
- 系統提示詞與 7 個子代理能被載入，本地 `delegation.ts` 沒有載入錯誤。
- 依 `pi mcp --help` 檢查服務狀態，並實際呼叫已啟用 MCP 的工具；不要把「列出配置」當成「服務連線成功」。
- Lens 使用已部署的全域配置，且所需語言服務可正常工作。

## 不公開的資料與安全邊界

不保存 `auth.json`、`mcp-auth.json`、`antigravity-accounts.json`、環境檔、對話、壓縮備份、快取、日誌、索引及工具二進位檔。
本目錄目前沒有單獨的使用者 `skills/` 配置；其他位置的 skills、AGENTS.md、shell 環境或服務配置不在此次備份範圍。

目前保存的 `mcp.json` 沒有憑證。日後若在其中加入 `env`、`headers`、URL token 或命令列密鑰，
**它們仍會隨該檔案一起上傳**。`models.json` 等白名單配置也一樣；白名單不是自動脫敏器。
公開副本只保存非敏感設定，密鑰在部署副本或目標服務環境中提供。

本機執行資料只是被 Git 忽略，沒有刪除，原始資料夾在磁碟上不會因此變小。
不要把原始資料夾直接打包上傳，也不要使用 `git add -f` 越過白名單。
`.gitignore` 不會移除已追蹤檔案或既有歷史中的秘密；首次加入或以後修改前都應檢查 Git 的待提交清單和差異。

## 參考

- [Pi 安裝說明](https://github.com/earendil-works/pi)
- [Pi CLI](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/cli.md)
- [Pi 環境變數](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/environment-variables.md)
- [pi-lens](https://github.com/apmantza/pi-lens)
