# 部署紀錄 (GitHub Pages)

## 2026-11-16：GitHub Actions 自動部署上線

完成 GitHub Actions 自動建置並部署到 GitHub Pages，專案 Web 版已公開上線。

- 網址：https://good9r.github.io/ProfitTracker/
- 相關 commit：`b694562 feat: 新增 GitHub Pages 自動部署`（分支 `feature/github-pages`，已合併至 `main`）

## 運作方式

- Workflow：`.github/workflows/deploy-pages.yml`
- 觸發條件：push 到 `main`，或在 Actions 頁面手動執行 (`workflow_dispatch`)
- 流程：
  1. **build**：checkout → Node 20 → `npm ci` → `npx expo export -p web` → 建立 `dist/.nojekyll` → 上傳 `dist` 為 Pages artifact
  2. **deploy**：使用 `actions/deploy-pages@v4` 發布到 `github-pages` 環境
- 同時只會保留一個部署（`concurrency: pages`，新的會取消舊的）

## 為了支援 Pages 子路徑所做的設定

`app.json`：

- `expo.experiments.baseUrl` 設為 `/ProfitTracker`（Pages 網址有 repo 名稱子路徑，資源路徑才不會壞掉）
- `expo.web.output` 設為 `single`（單頁應用輸出）

## 日常使用

- 要更新線上版本：把變更合併到 `main` 即可，Actions 會自動建置並部署。
- 手動重新部署：GitHub repo → Actions → Deploy to GitHub Pages → Run workflow。
- 本機預覽 web 版：`npm run web`。
- 若部署失敗，先到 Actions 頁面查看 build / deploy 步驟的 log。

## 注意事項

- repo 的 Pages 來源需設定為 **GitHub Actions**（Settings → Pages → Build and deployment → Source）。
- 若 repo 改名，需同步修改 `app.json` 的 `baseUrl`。

## 分支流程

- `main`：只放要發布的版本，push 到 `main` 會觸發自動部署。
- `develop`：日常開發的整合分支。
- `feature/*`、`docs/*`：從 `develop` 開出，完成後合回 `develop`。

發布步驟：

```bash
git switch main
git merge --no-ff develop
git push
```

緊急修復也先進 `develop` 再發布，避免 `main` 與 `develop` 分岔。
