# dsh-marketboard

**中文** | [English](README.md)

一个专注**实时行情列表**的 DeepSeek Harness 插件。把 **A股、港股、美股、外汇直盘与交叉盘、国内与国际商品期货、全球指数** 收进同一个自选看板——**只有列表和实时价格，没有图表**。

界面作为 DSH 原生 Client 插件运行：自动跟随明暗主题、接入 Harness 多语言服务，自选数据由宿主端持久化，不依赖浏览器 localStorage。

## 特点

- **一个看板，六大市场** —— A股、港股、美股、外汇、商品期货、指数。分组筛选、自选内搜索、涨跌幅排序。
- **默认真实时** —— 3/5/10/30/60 秒自动刷新，支持暂停/恢复与手动刷新；数据源抖动时保留最近报价并标记「缓存数据」。
- **顺手好用的自选** —— 首次运行内置 49 个精选品种；星标置顶、一键删除，支持搜索添加和手动输入代码。
- **自定义分组** —— 可以把不同市场的标的放进同一个组合；支持新建、重命名、删除和勾选成员。A股/港股/美股/外汇/商品期货/指数是默认分组，**不可删除**。
- **真正的行情仪表盘** —— 涨跌分布、平均涨跌、领涨/领跌、最近更新、日内区间位置、今开与昨收。
- **符合 Harness 视觉体系** —— 全部 UI 颜色来自主题 token，中英双语、响应式，使用本地 React 控件（不引用 Harness Client 组件包）。
- **宿主端持久化** —— 数据存 `<DSH_HOME>/dsh-marketboard/data.json`，原子写、`.bak` 回退、保留最近 20 份时间戳备份。不用 localStorage。

## 市场与代码

| 分组 | 市场键 | 默认示例 |
|---|---|---|
| A股 | `cn` | 600519 贵州茅台、300750 宁德时代、002594 比亚迪 |
| 港股 | `hk` | 00700 腾讯控股、09988 阿里巴巴-W、03690 美团-W |
| 美股 | `us` | AAPL、NVDA、MSFT、TSLA、AMZN、META |
| 外汇 | `fx` | USDCNH、EURUSD、GBPUSD、USDJPY、EURJPY、GBPJPY、AUDJPY…… |
| 商品期货 | `futcn`、`futgl` | RB0、CU0、AU0、AG0、SC0、M0、I0、TA0；CL=F、GC=F |
| 指数 | `index` | 上证指数、深证成指、创业板指、恒生指数、标普500、纳斯达克、道琼斯、日经225 |

手动添加代码格式：

- A股：`600519` 或 `sh600519` / `sz000001`
- 港股：`00700` 或 `700`
- 美股：`AAPL`、`BRK.B`
- 外汇：`EURUSD`、`EUR/USD`、`EURUSD=X`
- 国内期货：`RB0`（主力连续）、`RB`（自动补成 `RB0`）或具体合约代码
- 国际期货：`CL`、`CL=F`
- 指数：`sh000001`、`sz399001`、`^GSPC`、`^HSI`

## 数据源

全部为公开接口，**无需 API Key、无需账号**。

| 品种 | 首选 | 回退 |
|---|---|---|
| A股 / 港股 / 美股 / A股指数 | 腾讯 `qt.gtimg.cn`（批量） | 新浪 `hq.sinajs.cn` |
| 外汇（直盘 + 交叉盘） | 新浪 `fx_s*`（批量） | Yahoo Finance chart |
| 国内商品期货 | 新浪 `nf_*`（批量） | — |
| 国际商品期货 | 新浪 `hf_*` | Yahoo Finance chart |
| 全球指数 | 新浪 `int_*` | Yahoo Finance chart |

每次刷新最多只用两个批量请求拿全主要行情；只有仍缺失的品种才逐个回退。最近一次成功报价会缓存 15 分钟，复用时标记为「缓存数据」。

> 行情可能延迟、缺失或短暂不可用。插件只读，**不会执行任何下单操作**。

## 安装

本仓库是一个 DSH bundle（包含 `dsh.bundle.patch` 与 `dsh.client`）。

### 方式一：DSH CLI

```bash
dsh plugin --profile desktop add file:/绝对路径/dsh-marketboard
```

### 方式二：插件管理器

在 DSH 插件管理器里把本仓库目录作为本地 bundle 加入并启用。

安装后**刷新 DSH Web GUI**（`Ctrl+R`）。若宿主半侧此前已经加载过，请在 profile 的 `cordis.patch.yml` 中删除再加回 `dsh-marketboard` 的 `insert` 行，或重启一次桌面端。

## 使用

1. 点击左侧导航的 **行情看板**。
2. 用分组 chips 切换市场或自定义分组；默认分组由市场自动归类，不可删除。
3. 点击 **新建分组** 创建自定义组合，随后勾选要归入该组的自选品种；点击 **管理** 可重命名或删除自定义分组。
4. 点击 **添加自选**，按中文名/代码搜索，或展开「手动添加代码」。当前选中自定义分组时，新添加的品种会自动归入该组。
5. 鼠标移到行上：星标置顶，`×` 删除。
6. 工具栏可暂停自动刷新；顶部刷新按钮随时手动拉取。
7. 打开 **设置** 调整刷新频率、涨跌配色（红涨绿跌/绿涨红跌）与列表密度。

## 实现结构

| 半侧 | 文件 | 职责 |
|---|---|---|
| 宿主 | `lib/index.js` | Cordis 插件；注册 `/api/dsh-marketboard/state`、`/quotes`、`/search`；负责持久化、输入归一化与全部上游抓取 |
| 浏览器 | `lib/client.js` | DSH `__ModuleLoader__` CJS 工厂；注册 `main`（主面板）与 `sidebar.panellist`（导航入口）；渲染 React 界面 |

浏览器端统一使用相对路径（`api/dsh-marketboard/...`），适配 DSH 桌面端基于 IPC 的 fetch。

### 宿主 API

均为 `POST` JSON。

| 路由 | Body | 说明 |
|---|---|---|
| `/api/dsh-marketboard/state` | `{op:'get'}` | 读取自选与设置 |
| | `{op:'add', item:{market,code,name?}}` | 归一化后添加品种 |
| | `{op:'remove', id}` | 删除品种 |
| | `{op:'favorite', id}` | 切换置顶 |
| | `{op:'saveSettings', settings}` | 保存偏好 |
| | `{op:'resetWatchlist'}` | 恢复内置默认自选，保留设置与自定义分组（仅保留仍存在的成员） |
| | `{op:'addGroup', name}` | 新建自定义分组 |
| | `{op:'renameGroup', id, name}` | 重命名自定义分组 |
| | `{op:'deleteGroup', id}` | 删除自定义分组，不影响自选品种 |
| | `{op:'setGroupItems', id, itemIds}` | 设置自定义分组的成员 |
| `/api/dsh-marketboard/quotes` | `{}` | 拉取当前自选的行情 |
| `/api/dsh-marketboard/search` | `{q, group}` | 搜索内置目录 + 腾讯股票搜索 |

宿主会校验并归一化所有写入；浏览器不能自行指定行情 ID。自选、设置和自定义分组都保存在本机数据文件中，默认市场分组是隐式的、不可修改或删除。

## 兼容性

- DSH `>= 0.2.0-rc.2 || >= 0.2.1-rc.2`（已按当前桌面版本验证）
- Node `^22.19.0 || >= 24.0.0`
- Web GUI

## 隐私

- 不需要账号、Cookie 或 API Key。
- 没有遥测。
- 只有宿主进程访问公开行情/搜索接口；浏览器只访问本机 DSH API。
- 自选与设置不离开本机。

## 免责声明

行情聚合自公开接口，仅供个人参考。不保证准确、完整或实时，**不构成任何投资建议**。请自行遵守上游数据源的使用条款，并自行承担相关决策责任。

## License

MIT © 2026 gary
