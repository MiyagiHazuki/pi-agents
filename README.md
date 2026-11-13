# Pi Agent 配置備份

保存可在另一台機器還原的 Pi 配置。不鎖定插件版本，也不保存登入憑證、對話紀錄或工具安裝目錄。

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
| `.pi/agent/extensions/subagent-sidebar.ts` | Subagents Live 側欄橋接，顯示頂層代理的即時狀態與任務 |
| `.pi/agent/pi-atelier.json` | Atelier 設定，含 Subagents Live 的可見性與位置 |
| `.pi/agent/pi-goal-x-settings.json` | Goal X 設定 |
| `.pi/agent/web-search.json` | 網頁搜尋／回答模型設定 |
| `.pi-lens/config.json` | Lens 全域設定 |
| `patches/pi-smart-compact-10.8.1-aborted.patch` | smartCompact 10.8.1 中止回合修補；需依下方說明另行套用 |

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

**Pi 官方推薦**使用安裝腳本安裝（會鎖定所有相依套件版本，後續可用 `pi update` 更新 Pi）：

Linux / macOS：

> ### `curl -fsSL https://pi.dev/install.sh | sh`

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

Windows（PowerShell）：

> ### `powershell -c "irm https://pi.dev/install.ps1 | iex"`

```powershell
powershell -c "irm https://pi.dev/install.ps1 | iex"
```

也可改用官方 npm 套件全域安裝（不鎖定間接相依套件，需自行準備 Node.js 22.19+）：

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

Linux / macOS 若使用 Nix，亦可透過官方 flake 安裝（需改用 `nix profile upgrade pi` 更新，不適用 `pi update`）：

```bash
nix profile add github:earendil-works/pi/stable
```

以上方式擇一即可；安裝完成後確認 `pi` 在 `PATH` 中（可執行 `pi --version` 驗證）。

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
安裝後先依下方「smartCompact 已知問題與修正」核對插件版本；若為 10.8.1，套用中止回合補丁並重載，再進行驗收。

在 Pi 互動介面用 `/login` 重新登入需要的 provider。此配置使用 `openai-codex` 和 `zai-coding-cn` 等 provider；
子代理指定的模型也必須在新帳號可用，否則需調整對應代理的 `model`，這不會因安裝插件而自動解決。
MCP 若要求 OAuth 或 API key，依 `pi mcp --help` 及各服務說明重新配置，不能共用公開倉庫保存憑證。

### 4. 還原後檢查

- `pi list` 列出預期的 10 個插件。
- 系統提示詞與 7 個子代理能被載入，本地 `delegation.ts` 與 `subagent-sidebar.ts` 沒有載入錯誤。
- 依 `pi mcp --help` 檢查服務狀態，並實際呼叫已啟用 MCP 的工具；不要把「列出配置」當成「服務連線成功」。
- Lens 使用已部署的全域配置，且所需語言服務可正常工作。
- 在獨立測試會話中驗收 smartCompact 的**自動**觸發、模型摘要來源與實際寫入；方法見下方 C 節。手動壓縮成功不能代替此項，未執行的檢查須標記「未驗證」。

## Subagents Live 側欄

[側欄橋接擴充](.pi/agent/extensions/subagent-sidebar.ts) 將 `@tintinweb/pi-subagents` 的頂層代理狀態顯示在 Atelier 的 **SUBAGENTS LIVE** 面板。
本機驗證環境為 Pi 1.5.1、pi-atelier 0.18.0 與 pi-subagents 0.23.1；此處記錄驗證版本，插件清單仍不鎖版本。

還原時先完成插件安裝，再啟動 Pi 或執行 `/reload`。擴充會相對載入 agent 目錄中
`npm/node_modules/pi-atelier/extensions/index.ts` 的公開面板 API，因此需連同既有 `extensions/` 目錄結構部署。
`pi-atelier.json` 已將 `subagents:live` 設為可見，排在 `workspace` 後面；可用 `/atelier display` 調整。
`subagents.json` 的 `widgetMode: "off"` 控制原本輸入框旁的 Widget，橋接側欄仍會顯示。

面板顯示代理類型、指派任務、狀態、耗時與工具次數，每秒更新；工具次數透過 Subagents 公開的唯讀 manager registry 補齊。
完成項目保留約 12 秒。列表依目前保留項目數自動壓縮：

- 1～2 筆：每筆 2 行，分別顯示任務與執行資訊。
- 3～4 筆：每筆 1 行。
- 5 筆以上：顯示 3 筆及剩餘數量，可到 `/agents` 查看完整列表。

面板最多 5 行內容，加上 Atelier 外框與間距共 8 行。本機已實測多代理顯示；更矮的終端仍可能因 Atelier 的高度裁切策略隱藏面板。
此擴充追蹤頂層代理，未整合巢狀與 workflow 子代理的完整生命週期；RPC／排程代理開始執行後才會被追蹤。

## smartCompact 已知問題與修正

以下問題在 **Pi 1.5.0 + pi-smart-compact 10.8.1** 上觀察到。耗時與成功案例是本機既有實測紀錄，不代表每次還原都已完成驗收；其他版本需重新確認。

### 1. 問題定位

#### 問題 A：長摘要超過 Codex 預設呼叫期限

本倉庫原有設定如下，但未設定 `codexMaxCallMs`：

```json
{
  "mode": "thorough",
  "summaryThinkingLevel": "high",
  "segmentationThinkingLevel": "high"
}
```

該版本插件對 Codex 的預設單次呼叫期限最多為 **90 秒**。實測長摘要生成需要超過 90 秒，因此可能出現：

- 模型摘要呼叫超時。
- 插件改用規則式摘要，記錄為 `summarySource: "fallback"`。
- 最終仍顯示 `status: "success"`、驗證分數 100。

因此，插件載入成功、壓縮顯示成功或驗證滿分，都不足以證明模型摘要成功。降低推理強度也不保證能在 90 秒內完成。

#### 問題 B：中止回合仍觸發自動壓縮

Pi 在回合被中止後仍會發出：

```text
agent_settled，aborted: true
```

插件 10.8.1 的相關處理函式沒有檢查 `aborted`，因此中止回合仍可能啟動自動壓縮。

本機另有一次壓縮僅執行 **146 毫秒**便被取消，記錄為 `cancelled`。這與長時間超時不同，不能單靠增加期限處理；原始取消來源尚未完全確認。

### 2. 解決方法

#### A. 補上 Codex 呼叫期限

本倉庫的 [`.pi/agent/settings.json`](.pi/agent/settings.json) 已在 `smartCompact` 區塊加入下列欄位，並保留其他設定。
已有部署配置時，只合併此欄位，不要用以下片段取代整個 `smartCompact` 區塊：

```json
{
  "codexMaxCallMs": 240000
}
```

這將單次呼叫期限設為 **240 秒**。自動壓縮整輪仍受 **300 秒**上限限制，包含生成與驗證，不能將兩種期限混為一談。

本機先前修改後已有一次完整自動壓縮成功：

- 摘要生成約 149 秒。
- 驗證約 104 秒。
- 總計約 253 秒。
- `summarySource: "llm"`，摘要已實際寫入會話。

此數值是已驗證的本機設定，不保證所有模型與網路環境都能完成。

#### B. 修補中止回合的觸發條件

對存在該缺陷的插件版本，在啟動自動壓縮的 `agent_settled` 處理函式開頭加入檢查：

```diff
- pi.on("agent_settled", async (_event, ctx) => {
+ pi.on("agent_settled", async (event, ctx) => {
+   if (event.aborted)
+     return;
```

正常完成的回合繼續按照原有條件觸發自動壓縮。修改後執行 `/reload` 或重啟 Pi。

本機先前補丁已通過「中止回合、正常回合、待處理 pivot」三項回歸測試。
本倉庫補丁亦已對 10.8.1 發布包的處理函式重跑上述三種隔離測試，並驗證套用、重複套用辨識及版本／內容不符時拒絕修改。
**重載後的高上下文中止場景仍待實際驗證**；處理函式測試不能代替下方的實際會話驗收。

倉庫保存了 [10.8.1 專用補丁](patches/pi-smart-compact-10.8.1-aborted.patch)，目標是發布包中實際載入的 `dist/index.js`。補丁已對 npm 的 10.8.1 發布包核對；不需重新編譯。
在插件安裝完成後，從本倉庫根目錄執行以下 Bash 命令（Linux 或 Windows Git Bash）：

```bash
(
  set -eu
  patch_file="$(pwd)/patches/pi-smart-compact-10.8.1-aborted.patch"
  agent_dir="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"
  plugin_dir="$agent_dir/npm/node_modules/pi-smart-compact"

  node -e '
    const fs = require("node:fs");
    const pkg = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    if (pkg.name !== "pi-smart-compact" || pkg.version !== "10.8.1") {
      console.error("此補丁僅適用 pi-smart-compact 10.8.1；請重新確認新版是否仍有缺陷。");
      process.exit(1);
    }
  ' "$plugin_dir/package.json"

  # 避免部署目錄位於 Git 工作樹內時，git apply 因子目錄而略過補丁。
  export GIT_CEILING_DIRECTORIES="$(cd "$plugin_dir/.." && pwd)"

  if git -C "$plugin_dir" -c core.autocrlf=false apply --reverse --check "$patch_file" 2>/dev/null; then
    printf '%s\n' '補丁已套用，無需重複修改。'
  elif git -C "$plugin_dir" -c core.autocrlf=false apply --check "$patch_file"; then
    git -C "$plugin_dir" -c core.autocrlf=false apply "$patch_file"
    printf '%s\n' '補丁已套用；請執行 /reload 或重啟 Pi。'
  else
    printf '%s\n' '補丁與安裝內容不符，未修改；請檢查版本與本機修改。' >&2
    exit 1
  fi
)
```

若自訂 agent 目錄，`PI_CODING_AGENT_DIR` 應指向實際部署位置的絕對路徑。版本不符或補丁檢查失敗時，先核對新版實作，不要強制套用。

**只修改本機 `node_modules` 不會隨配置倉庫一起還原，而且插件更新可能覆蓋修改。** 複製配置不會自動套用此補丁；上游修復前，每次重新安裝或更新後都需重新檢查。新版需重新確認是否仍需要補丁。

#### C. 將自動壓縮加入安裝驗收

> 在獨立測試會話中，確認達到門檻後能自動觸發壓縮。核對成功的模型呼叫、`summarySource: "llm"`，以及會話中實際新增的 `compaction` 記錄。手動壓縮成功不能代替自動觸發驗收；未執行的檢查須明確標記「未驗證」。

驗收時記錄 Pi／插件版本、有效設定與結果，並逐項檢查：

1. 讓測試會話達到自動壓縮門檻，正常結束回合且沒有待處理訊息，確認自動觸發。
2. 核對該次摘要模型呼叫確實成功、`summarySource: "llm"`，以及同一會話實際新增的 `compaction` 記錄；不能只看 `status: "success"` 或驗證分數。
3. 套用補丁並重載後，在達到門檻的測試會話中中止回合，確認不會因該次 `agent_settled` 啟動自動壓縮；另確認正常回合仍能觸發。未執行的場景標記「未驗證」。

此版本另有以下行為需要留意：

- 預設在上下文達到 **80%**、回合結束且沒有待處理訊息時觸發，不會立即打斷工具迴圈。
- 自動嘗試失敗後也會進入 **10 分鐘冷卻**；重試驗收時需考慮冷卻狀態。
- `agentToolAccess: "disabled"` 不會關閉自動壓縮。
- `zeroCallEnabled: false` 不會禁止生成失敗後的規則式兜底。
- 本倉庫不鎖插件版本，每次重新安裝或更新後都應重新驗收。

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
