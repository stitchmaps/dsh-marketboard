# 上架 DSH 插件市场（dshmarket）

> **dshmarket 不接收插件代码。** 它读取精选列表 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 的目录；被该列表收录后，dshmarket、[dshmarket.com](https://dshmarket.com) 和 DSH Discover 会自动显示。
>
> 不要向 [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market) 提插件条目；也不要向 `dsh-plugin-catalog` 提 PR，它是自动生成的。

## 1. 前置条件

- 公开 GitHub 仓库
- `package.json` 声明 `dsh.bundle`（本项目已满足）
- 仓库根目录有 `cordis.patch.yml`（本项目已满足）
- GitHub 仓库添加 `dsh-plugin` topic
- **GitHub 仓库创建满 24 小时**（CI 自动检查）
- 真实可用的代码，不是占位或纯 README 仓库
- 描述准确，不使用夸大营销词

## 2. 创建公开仓库

```powershell
cd "E:\03_Project\Deepseek Harness插件开发\dsh-marketboard"
gh repo create stitchmaps/dsh-marketboard --public --source . --remote origin --push
gh repo edit stitchmaps/dsh-marketboard --add-topic dsh-plugin
```

## 3. 可选展示资源

- **市场卡片图标**：GitHub 托管的 PNG/JPG/WebP，放在仓库里，例如 `assets/icon-180.png`。目录条目写：
  ```yaml
  icon: https://raw.githubusercontent.com/stitchmaps/dsh-marketboard/main/assets/icon-180.png
  ```
  SVG 不能作为目录条目的 `icon`；不写则回退到 GitHub 头像。
- **截图**：仓库根目录放 `screenshots.json`，列出 1–8 张 GitHub 托管的位图：
  ```json
  ["docs/panel.png", "docs/panel-light.png"]
  ```
- **预构建 tarball**（不发 npm 时推荐）：`npm pack` 后上传到 GitHub Release，再在条目里写 `tarball:`。

## 4. 向 awesome-dsh-plugin 提 PR

1. Fork [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)。
2. **只新增一个文件**：
   `data/plugins/<owner>__<repo>.yml`
3. 本项目的条目：

```yaml
url: https://github.com/stitchmaps/dsh-marketboard
name: stitchmaps/dsh-marketboard
category: ui
description:
  en: 'Quote board for A-shares, Hong Kong and US stocks, FX, Chinese and global commodity futures and indices, with watchlists, custom groups, auto-refresh and host-side persistence.'
  zh: 'A股、港股、美股、外汇、国内外商品期货与指数的行情看板，支持自选、自定义分组、自动刷新与宿主端持久化。'
icon: https://raw.githubusercontent.com/stitchmaps/dsh-marketboard/main/assets/icon-180.png
tarball: https://github.com/stitchmaps/dsh-marketboard/releases/download/v0.2.1/dsh-marketboard-0.2.1.tgz
```

4. 提交并创建 PR：

```powershell
gh repo fork awesome-dsh-plugin/awesome-dsh-plugin --clone --default-branch-only
cd awesome-dsh-plugin
git checkout -b add-dsh-marketboard
# 创建 data/plugins/stitchmaps__dsh-marketboard.yml
git add data/plugins/stitchmaps__dsh-marketboard.yml
git commit -m "Add stitchmaps/dsh-marketboard"
git push -u origin add-dsh-marketboard
gh pr create --repo awesome-dsh-plugin/awesome-dsh-plugin --base main --head stitchmaps:add-dsh-marketboard --title "Add stitchmaps/dsh-marketboard"
```

也可以用 GitHub 网页 Fork → Add file → Create pull request，一个文件就是全部投稿。

> 两个 README 是自动生成的，**不要手改**。一个 PR 最多新增 3 条，提交自己的插件只加 1 条。

## 5. CI 与合并

- CI 会检查：`dsh.bundle` 是否声明、仓库是否满 1 天、YAML/目录格式、awesome-lint、生成的 READMEs 是否一致。
- 仓库刚创建时，`Submission gate` 会因「repo too new」等待或失败；满 24 小时后 gate 会自动重跑，不需要空提交。
- 维护者合并后，站点和目录会自动更新，通常一天内出现在 dshmarket。

## 6. npm 发布（可选）

npm 不是上架必需条件。发布后市场会显示下载量，安装也会走预构建包。

```powershell
npm login
npm publish --access public
```

发布包的 `repository` 字段必须指回同一仓库（本项目已配置）。**不要**在 awesome 的 YAML 里手写 `npm:` 字段，映射会自动采集。

## 当前状态

- 仓库：https://github.com/stitchmaps/dsh-marketboard
- Release：https://github.com/stitchmaps/dsh-marketboard/releases/tag/v0.2.1
- 市场 PR：https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/10723
