/**
 * dsh-marketboard — browser half.
 *
 * A focused real-time quote board rendered as a full-size `main` keyed panel
 * with a matching left-navigation row. The browser never talks to upstream
 * quote providers directly: all reads and writes go through the host half at
 * `/api/dsh-marketboard/*`.
 *
 * Modules: React is provided by the DSH client module table. No Harness Client
 * package is imported; every control is local to this plugin.
 */
;(function () {
  var MODULE_ID = 'dsh-marketboard'
  var loader = typeof window !== 'undefined' ? window.__ModuleLoader__ : undefined
  if (!loader || typeof loader.load !== 'function') return

  loader.load({
    id: MODULE_ID,
    factory: function (require) {
      var module = { exports: {} }
      var React = require('react')
      var h = React.createElement
      var NS = 'dsh-marketboard'

      // ------------------------------------------------------------------
      // Locale
      // ------------------------------------------------------------------
      var ZH = {
        'nav.title': '行情看板',
        'page.title': '行情看板',
        'page.subtitle': '全球市场 · 实时行情',
        'page.count': '{n} 个自选',
        'live.live': '实时',
        'live.paused': '已暂停',
        'live.connecting': '连接中',
        'live.error': '连接异常',
        'live.failed': '连接失败',
        'live.hint': '每 {s} 秒自动刷新',
        'live.pausedHint': '自动刷新已暂停，仍可手动刷新',
        'actions.refresh': '刷新',
        'actions.add': '添加自选',
        'actions.settings': '设置',
        'actions.pause': '暂停自动刷新',
        'actions.resume': '恢复自动刷新',
        'actions.retry': '重试',
        'actions.close': '关闭',
        'actions.clear': '清除',
        'stats.breadth': '涨跌分布',
        'stats.avg': '平均涨跌',
        'stats.leader': '领涨',
        'stats.lagger': '领跌',
        'stats.updated': '最近更新',
        'stats.up': '涨',
        'stats.down': '跌',
        'stats.flat': '平',
        'stats.none': '暂无数据',
        'stats.items': '{n} 个品种',
        'stats.quoted': '{n} / {total} 有报价',
        'filter.all': '全部',
        'filter.cn': 'A股',
        'filter.hk': '港股',
        'filter.us': '美股',
        'filter.fx': '外汇',
        'filter.futures': '商品期货',
        'filter.index': '指数',
        'toolbar.search': '搜索自选',
        'toolbar.sort': '排序方式',
        'sort.default': '默认排序',
        'sort.pctDesc': '涨幅优先',
        'sort.pctAsc': '跌幅优先',
        'sort.name': '名称排序',
        'table.instrument': '品种',
        'table.price': '最新价',
        'table.change': '涨跌',
        'table.range': '日内区间',
        'table.open': '今开',
        'table.prev': '昨收',
        'table.emptyTitle': '这个分组还没有品种',
        'table.emptyBody': '添加你关注的股票、外汇或商品期货。',
        'table.emptyFilterTitle': '没有匹配的品种',
        'table.emptyFilterBody': '换个关键词或分组再试试。',
        'table.clearSearch': '清除搜索',
        'table.add': '添加品种',
        'row.star': '置顶',
        'row.unstar': '取消置顶',
        'row.remove': '从自选删除',
        'row.stale': '缓存数据',
        'row.noData': '暂无报价',
        'row.rangeTitle': '日内 {low} – {high}',
        'row.quoteTitle': '{source} · {time}',
        'footer.count': '共 {n} 个品种',
        'footer.sources': '数据源：新浪财经 · 腾讯行情 · Yahoo Finance',
        'footer.disclaimer': '行情仅供参考，不构成投资建议',
        'footer.updated': '更新于 {time}',
        'error.state': '自选加载失败，请重试。',
        'error.stateBody': '请确认插件宿主已加载，然后重新加载。',
        'error.quotes': '行情刷新失败，请检查网络后重试。',
        'error.add': '添加失败，请检查代码后重试。',
        'error.remove': '删除失败，请重试。',
        'error.settings': '设置保存失败。',
        'error.retry': '重新加载',
        'toast.added': '已添加 {name}',
        'toast.already': '{name} 已在自选中',
        'toast.removed': '已删除 {name}',
        'toast.reset': '已恢复默认自选',
        'toast.settings': '设置已保存',
        'toast.refreshFailed': '刷新失败，请稍后重试',
        'settings.title': '偏好设置',
        'settings.subtitle': '调整刷新节奏与视觉密度',
        'settings.refresh': '自动刷新',
        'settings.refreshHint': '页面可见时按此频率更新行情',
        'settings.colors': '涨跌配色',
        'settings.colorsHint': '默认符合国内市场习惯',
        'settings.color.red': '红涨绿跌',
        'settings.color.green': '绿涨红跌',
        'settings.density': '列表密度',
        'settings.densityHint': '紧凑模式一屏显示更多品种',
        'settings.density.comfortable': '舒适',
        'settings.density.compact': '紧凑',
        'settings.data': '自选数据',
        'settings.dataHint': '重新载入内置的默认自选，保留当前偏好。',
        'settings.reset': '恢复默认自选',
        'settings.resetConfirm': '再次点击确认恢复',
        'settings.footer': '设置保存在本机，不随浏览器端口变化而丢失。',
        'settings.version': '行情看板 v0.1.0',
        'add.title': '添加自选',
        'add.subtitle': '搜索全球股票、外汇、商品期货与指数',
        'add.search': '搜索名称或代码',
        'add.searchHint': '股票支持中文名、代码与拼音缩写',
        'add.searching': '正在搜索…',
        'add.noResults': '没有找到匹配品种',
        'add.noResultsHint': '试试完整代码，或展开下方手动添加。',
        'add.add': '添加',
        'add.added': '已添加',
        'add.manual': '手动添加代码',
        'add.manualHide': '收起手动添加',
        'add.manualHint': 'A股 600519 · 港股 00700 · 美股 AAPL · 外汇 EURUSD · 期货 RB0 · 指数 sh000001',
        'add.market': '市场',
        'add.code': '代码',
        'add.codePlaceholder': '输入代码',
        'add.name': '名称（可选）',
        'add.namePlaceholder': '留空则使用内置名称',
        'add.submit': '添加到自选',
        'add.sourceNote': '行情来自新浪财经、腾讯行情与 Yahoo Finance 的公开接口；仅供个人参考。',
        'add.jumpHint': '添加后会立即出现在你的自选中',
        'market.cn': 'A股',
        'market.hk': '港股',
        'market.us': '美股',
        'market.fx': '外汇',
        'market.futcn': '国内商品',
        'market.futgl': '国际商品',
        'market.index': '指数',
        'unit.points': '点',
        'unit.seconds': '{n} 秒',
        'source.sina': '新浪财经',
        'source.tencent': '腾讯行情',
        'source.yahoo': 'Yahoo Finance',
        'time.justNow': '刚刚',
        'time.secondsAgo': '{n} 秒前',
        'time.minutesAgo': '{n} 分钟前',
        'time.hoursAgo': '{n} 小时前',
      }

      var EN = {
        'nav.title': 'Marketboard',
        'page.title': 'Marketboard',
        'page.subtitle': 'Global markets · live quotes',
        'page.count': '{n} instruments',
        'live.live': 'Live',
        'live.paused': 'Paused',
        'live.connecting': 'Connecting',
        'live.error': 'Degraded',
        'live.failed': 'Offline',
        'live.hint': 'Refreshing every {s}s',
        'live.pausedHint': 'Auto-refresh paused · manual refresh still available',
        'actions.refresh': 'Refresh',
        'actions.add': 'Add symbol',
        'actions.settings': 'Settings',
        'actions.pause': 'Pause auto-refresh',
        'actions.resume': 'Resume auto-refresh',
        'actions.retry': 'Retry',
        'actions.close': 'Close',
        'actions.clear': 'Clear',
        'stats.breadth': 'Breadth',
        'stats.avg': 'Average move',
        'stats.leader': 'Top gainer',
        'stats.lagger': 'Top loser',
        'stats.updated': 'Last update',
        'stats.up': 'up',
        'stats.down': 'down',
        'stats.flat': 'flat',
        'stats.none': 'No data',
        'stats.items': '{n} instruments',
        'stats.quoted': '{n} / {total} quoted',
        'filter.all': 'All',
        'filter.cn': 'A-shares',
        'filter.hk': 'Hong Kong',
        'filter.us': 'US',
        'filter.fx': 'FX',
        'filter.futures': 'Futures',
        'filter.index': 'Indices',
        'toolbar.search': 'Search watchlist',
        'toolbar.sort': 'Sort',
        'sort.default': 'Default',
        'sort.pctDesc': 'Gainers first',
        'sort.pctAsc': 'Losers first',
        'sort.name': 'Name',
        'table.instrument': 'Instrument',
        'table.price': 'Last',
        'table.change': 'Change',
        'table.range': 'Day range',
        'table.open': 'Open',
        'table.prev': 'Prev close',
        'table.emptyTitle': 'This group is empty',
        'table.emptyBody': 'Add a stock, FX pair or commodity future you follow.',
        'table.emptyFilterTitle': 'No matching instruments',
        'table.emptyFilterBody': 'Try another keyword or group.',
        'table.clearSearch': 'Clear search',
        'table.add': 'Add instrument',
        'row.star': 'Pin to top',
        'row.unstar': 'Unpin',
        'row.remove': 'Remove from watchlist',
        'row.stale': 'Cached quote',
        'row.noData': 'No quote',
        'row.rangeTitle': 'Day range {low} – {high}',
        'row.quoteTitle': '{source} · {time}',
        'footer.count': '{n} instruments',
        'footer.sources': 'Sources: Sina Finance · Tencent · Yahoo Finance',
        'footer.disclaimer': 'Quotes are indicative and not investment advice',
        'footer.updated': 'Updated {time}',
        'error.state': 'Could not load your watchlist. Please retry.',
        'error.stateBody': 'Make sure the plugin host is active, then reload.',
        'error.quotes': 'Quote refresh failed. Check the network and retry.',
        'error.add': 'Could not add that instrument. Check the code and retry.',
        'error.remove': 'Remove failed. Please retry.',
        'error.settings': 'Could not save settings.',
        'error.retry': 'Reload',
        'toast.added': 'Added {name}',
        'toast.already': '{name} is already in your watchlist',
        'toast.removed': 'Removed {name}',
        'toast.reset': 'Default watchlist restored',
        'toast.settings': 'Settings saved',
        'toast.refreshFailed': 'Refresh failed. Please retry.',
        'settings.title': 'Preferences',
        'settings.subtitle': 'Tune the refresh cadence and density',
        'settings.refresh': 'Auto-refresh',
        'settings.refreshHint': 'Applies while this page is visible',
        'settings.colors': 'Movement colours',
        'settings.colorsHint': 'China convention is the default',
        'settings.color.red': 'Red up / green down',
        'settings.color.green': 'Green up / red down',
        'settings.density': 'List density',
        'settings.densityHint': 'Compact fits more rows on one screen',
        'settings.density.comfortable': 'Comfortable',
        'settings.density.compact': 'Compact',
        'settings.data': 'Watchlist data',
        'settings.dataHint': 'Reload the built-in default watchlist and keep your preferences.',
        'settings.reset': 'Restore defaults',
        'settings.resetConfirm': 'Click again to confirm',
        'settings.footer': 'Settings are stored on this machine and survive port changes.',
        'settings.version': 'Marketboard v0.1.0',
        'add.title': 'Add instrument',
        'add.subtitle': 'Search global stocks, FX, commodity futures and indices',
        'add.search': 'Search by name or code',
        'add.searchHint': 'Stocks support Chinese names, tickers and pinyin initials',
        'add.searching': 'Searching…',
        'add.noResults': 'No matching instruments',
        'add.noResultsHint': 'Try a full ticker, or add a code manually below.',
        'add.add': 'Add',
        'add.added': 'Added',
        'add.manual': 'Add a code manually',
        'add.manualHide': 'Hide manual entry',
        'add.manualHint': 'A-share 600519 · HK 00700 · US AAPL · FX EURUSD · Futures RB0 · Index sh000001',
        'add.market': 'Market',
        'add.code': 'Code',
        'add.codePlaceholder': 'Enter a code',
        'add.name': 'Name (optional)',
        'add.namePlaceholder': 'Leave blank to use the built-in name',
        'add.submit': 'Add to watchlist',
        'add.sourceNote': 'Quotes come from public Sina, Tencent and Yahoo endpoints; for personal reference only.',
        'add.jumpHint': 'New symbols appear in your watchlist immediately',
        'market.cn': 'A-shares',
        'market.hk': 'Hong Kong',
        'market.us': 'US',
        'market.fx': 'FX',
        'market.futcn': 'China futures',
        'market.futgl': 'Global futures',
        'market.index': 'Index',
        'unit.points': 'pts',
        'unit.seconds': '{n}s',
        'source.sina': 'Sina Finance',
        'source.tencent': 'Tencent',
        'source.yahoo': 'Yahoo Finance',
        'time.justNow': 'just now',
        'time.secondsAgo': '{n}s ago',
        'time.minutesAgo': '{n}m ago',
        'time.hoursAgo': '{n}h ago',
      }

      // ------------------------------------------------------------------
      // Constants
      // ------------------------------------------------------------------
      var API_BASE = 'api/dsh-marketboard/'
      var DEFAULT_SETTINGS = { refreshMs: 5000, upColor: 'red', density: 'comfortable' }
      var REFRESH_OPTIONS = [3000, 5000, 10000, 30000, 60000]
      var GROUPS = [
        { key: 'all', tKey: 'filter.all' },
        { key: 'cn', tKey: 'filter.cn' },
        { key: 'hk', tKey: 'filter.hk' },
        { key: 'us', tKey: 'filter.us' },
        { key: 'fx', tKey: 'filter.fx' },
        { key: 'futures', tKey: 'filter.futures' },
        { key: 'index', tKey: 'filter.index' },
      ]
      var GROUP_OF = {
        cn: 'cn', hk: 'hk', us: 'us', fx: 'fx', futcn: 'futures', futgl: 'futures', index: 'index',
      }
      var BADGE = { cn: 'A', hk: 'HK', us: 'US', fx: 'FX', futcn: 'FU', futgl: 'GL', index: 'IX' }
      var MARKET_TKEY = {
        cn: 'market.cn', hk: 'market.hk', us: 'market.us', fx: 'market.fx',
        futcn: 'market.futcn', futgl: 'market.futgl', index: 'market.index',
      }
      var MANUAL_MARKETS = ['cn', 'hk', 'us', 'fx', 'futcn', 'futgl', 'index']

      // ------------------------------------------------------------------
      // Small helpers
      // ------------------------------------------------------------------
      function pad2(n) {
        return n < 10 ? '0' + n : String(n)
      }

      function formatClock(ts) {
        if (!ts) return '—'
        var d = new Date(ts)
        if (isNaN(d.getTime())) return '—'
        return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds())
      }

      function formatNumber(value, digits) {
        if (value === null || value === undefined || !isFinite(value)) return '—'
        try {
          return Number(value).toLocaleString('en-US', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
          })
        } catch (e) {
          return Number(value).toFixed(digits)
        }
      }

      function digitsFor(item, price) {
        if (!item) return 2
        if (item.market === 'fx') {
          return /JPY$/.test(item.code) ? 3 : 4
        }
        if (item.market === 'futcn') {
          if (price === null || price === undefined || !isFinite(price)) return 0
          return price < 1000 ? 2 : 0
        }
        if (item.market === 'futgl') return 2
        if (item.market === 'hk') return 3
        if (item.market === 'index') return 2
        return 2
      }

      function formatPrice(item, price) {
        return formatNumber(price, digitsFor(item, price))
      }

      function formatChange(item, value, price) {
        if (value === null || value === undefined || !isFinite(value)) return '—'
        var digits = digitsFor(item, price)
        var sign = value > 0 ? '+' : ''
        return sign + formatNumber(value, digits)
      }

      function formatPct(value) {
        if (value === null || value === undefined || !isFinite(value)) return '—'
        var n = Number(value)
        var sign = n > 0 ? '+' : ''
        return sign + n.toFixed(2) + '%'
      }

      function directionOf(quote) {
        if (!quote) return 'flat'
        var pct = quote.changePct
        if (pct !== null && pct !== undefined && isFinite(pct)) {
          if (pct > 0) return 'up'
          if (pct < 0) return 'down'
          return 'flat'
        }
        if (quote.change !== null && quote.change !== undefined && isFinite(quote.change)) {
          if (quote.change > 0) return 'up'
          if (quote.change < 0) return 'down'
        }
        return 'flat'
      }

      function dirClass(direction) {
        return 'mb-dir-' + direction
      }

      function displayCode(item) {
        if (!item) return ''
        if (item.market === 'futgl') return item.code.replace(/=F$/, '')
        if (item.market === 'index') return item.code.replace(/^\^/, '').replace(/^(sh|sz)/, '')
        return item.code
      }

      function currencyLabel(quote, t) {
        if (!quote) return ''
        if (quote.market === 'index' || quote.currency === 'pts') return t('unit.points')
        if (quote.currency === 'USX') return 'US¢'
        return quote.currency || ''
      }

      function sourceLabel(t, source) {
        if (!source) return ''
        var key = 'source.' + source
        var value = t(key)
        return value === key ? source : value
      }

      function quoteTitle(t, quote) {
        if (!quote) return ''
        var parts = []
        if (quote.source) parts.push(sourceLabel(t, quote.source))
        if (quote.quoteTime) parts.push(String(quote.quoteTime).slice(0, 32))
        if (quote.stale) parts.push(t('row.stale'))
        return parts.join(' · ')
      }

      function fullCode(item) {
        return item ? item.market + ':' + item.code : ''
      }

      function post(route, payload) {
        return fetch(API_BASE + route, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload || {}),
          cache: 'no-store',
        }).then(function (res) {
          return res.json().catch(function () { return null }).then(function (data) {
            if (!data) throw new Error('empty-response')
            if (!res.ok || data.ok === false) {
              var err = new Error((data.error && data.error.code) || 'request-failed')
              err.code = data.error && data.error.code
              throw err
            }
            return data
          })
        })
      }

      // ------------------------------------------------------------------
      // Icons
      // ------------------------------------------------------------------
      function svgProps(size) {
        var n = typeof size === 'number' ? size : 18
        return {
          width: n,
          height: n,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: false,
        }
      }

      function IconBoard(props) {
        return h('svg', svgProps(props && props.size), [
          h('rect', { key: 'r', x: 3.2, y: 3.2, width: 17.6, height: 17.6, rx: 4 }),
          h('path', { key: 'a', d: 'M7.1 8.1h4.1' }),
          h('path', { key: 'b', d: 'M7.1 11.6h2.9', opacity: 0.75 }),
          h('path', { key: 'c', d: 'M7.1 15.1h3.6', opacity: 0.55 }),
          h('path', { key: 'd', d: 'M13.4 15.5l1.7-3.8 1.3 2.5 1.5-1.6' }),
          h('circle', { key: 'e', cx: 17.9, cy: 8, r: 0.9, fill: 'currentColor', stroke: 'none' }),
        ])
      }

      function IconPlus(props) {
        return h('svg', svgProps(props && props.size), [
          h('path', { key: 'a', d: 'M12 5v14' }),
          h('path', { key: 'b', d: 'M5 12h14' }),
        ])
      }

      function IconRefresh(props) {
        return h('svg', svgProps(props && props.size), [
          h('path', { key: 'a', d: 'M20 6.8v5.1h-5.1' }),
          h('path', { key: 'b', d: 'M19.1 11.6a7.2 7.2 0 1 1-2.1-5.4l3 3' }),
        ])
      }

      function IconSettings(props) {
        return h('svg', svgProps(props && props.size), [
          h('circle', { key: 'a', cx: 12, cy: 12, r: 3.1 }),
          h('path', { key: 'b', d: 'M19.2 13.5a7.8 7.8 0 0 0 0-3l1.7-1.3-1.8-3-2 .8a7.8 7.8 0 0 0-2.6-1.5L14.2 3h-4.4l-.4 2.5A7.8 7.8 0 0 0 6.9 7l-2-.8-1.8 3 1.7 1.3a7.8 7.8 0 0 0 0 3l-1.7 1.3 1.8 3 2-.8a7.8 7.8 0 0 0 2.6 1.5l.4 2.5h4.4l.4-2.5a7.8 7.8 0 0 0 2.6-1.5l2 .8 1.8-3-1.7-1.3z' }),
        ])
      }

      function IconSearch(props) {
        return h('svg', svgProps(props && props.size), [
          h('circle', { key: 'a', cx: 10.7, cy: 10.7, r: 6.4 }),
          h('path', { key: 'b', d: 'M15.5 15.5l4.3 4.3' }),
        ])
      }

      function IconClose(props) {
        return h('svg', svgProps(props && props.size), [
          h('path', { key: 'a', d: 'M6.3 6.3l11.4 11.4' }),
          h('path', { key: 'b', d: 'M17.7 6.3L6.3 17.7' }),
        ])
      }

      function IconStar(props) {
        var size = typeof (props && props.size) === 'number' ? props.size : 15
        return h('svg', {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: props && props.filled ? 'currentColor' : 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: false,
        }, h('path', { d: 'M12 3.7l2.5 5.1 5.6.8-4 3.9.9 5.5-5-2.6-5 2.6.9-5.5-4-3.9 5.6-.8L12 3.7z' }))
      }

      function IconPause(props) {
        return h('svg', svgProps(props && props.size), [
          h('path', { key: 'a', d: 'M9 6v12' }),
          h('path', { key: 'b', d: 'M15 6v12' }),
        ])
      }

      function IconPlay(props) {
        return h('svg', svgProps(props && props.size), [
          h('path', { key: 'a', d: 'M8 5.5l10 6.5-10 6.5z' }),
        ])
      }

      function IconCheck(props) {
        return h('svg', svgProps(props && props.size), [
          h('path', { key: 'a', d: 'M5 12.5l4.2 4.2L19 7' }),
        ])
      }

      function IconWarning(props) {
        return h('svg', svgProps(props && props.size), [
          h('path', { key: 'a', d: 'M12 3.8l8.8 15.4H3.2L12 3.8z' }),
          h('path', { key: 'b', d: 'M12 9.2v4.2' }),
          h('path', { key: 'c', d: 'M12 16.4v.1' }),
        ])
      }

      function IconChevron(props) {
        var p = svgProps(props && props.size)
        if (props && props.style) p.style = props.style
        return h('svg', p, [
          h('path', { key: 'a', d: 'M7 9.5l5 5 5-5' }),
        ])
      }

      // ------------------------------------------------------------------
      // Styles
      // ------------------------------------------------------------------
      var CSS = `
.mb-page{--mb-pos:var(--dsw-alias-state-error-primary,#ff5a5f);--mb-neg:var(--dsw-alias-state-success-primary,#18b26b);box-sizing:border-box;position:relative;height:100%;min-height:0;display:flex;flex-direction:column;overflow:hidden;background:var(--dsw-alias-bg-base,#15171c);color:var(--dsw-alias-label-primary,#e7e9ee);font-size:13px;line-height:1.5}
.mb-page[data-up="green"]{--mb-pos:var(--dsw-alias-state-success-primary,#18b26b);--mb-neg:var(--dsw-alias-state-error-primary,#ff5a5f)}
.mb-page *{box-sizing:border-box}
.mb-page button{font:inherit;color:inherit}
.mb-page button:focus-visible,.mb-page input:focus-visible,.mb-page select:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#4d8dff);outline-offset:2px}
.mb-search input:focus-visible,.mb-add-search input:focus-visible{outline:none}
.mb-table-scroll,.mb-results,.mb-settings-body{scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--dsw-alias-label-secondary,#9aa2b1) 32%,transparent) transparent}
.mb-table-scroll::-webkit-scrollbar,.mb-results::-webkit-scrollbar,.mb-settings-body::-webkit-scrollbar{width:8px;height:8px}
.mb-table-scroll::-webkit-scrollbar-track,.mb-results::-webkit-scrollbar-track,.mb-settings-body::-webkit-scrollbar-track{background:transparent}
.mb-table-scroll::-webkit-scrollbar-thumb,.mb-results::-webkit-scrollbar-thumb,.mb-settings-body::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--dsw-alias-label-secondary,#9aa2b1) 26%,transparent);border-radius:99px;border:2px solid transparent;background-clip:padding-box}
.mb-table-scroll::-webkit-scrollbar-thumb:hover,.mb-results::-webkit-scrollbar-thumb:hover,.mb-settings-body::-webkit-scrollbar-thumb:hover{background:color-mix(in srgb,var(--dsw-alias-label-secondary,#9aa2b1) 42%,transparent);background-clip:padding-box}
.mb-page::before{content:"";position:absolute;inset:-30% -10% auto -10%;height:78%;pointer-events:none;background:radial-gradient(58% 62% at 14% 0%,color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 13%,transparent),transparent 66%),radial-gradient(42% 55% at 88% 0%,color-mix(in srgb,var(--dsw-alias-label-primary,#e7e9ee) 5%,transparent),transparent 70%)}
.mb-shell{position:relative;z-index:1;width:100%;max-width:1400px;height:100%;min-height:0;margin:0 auto;padding:22px clamp(16px,2.5vw,34px) 20px;display:flex;flex-direction:column;overflow:hidden}
.mb-top{flex:none;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
.mb-brand{display:flex;align-items:center;gap:13px;min-width:0}
.mb-brand-icon{flex:none;width:44px;height:44px;display:grid;place-items:center;border-radius:14px;border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 28%,transparent);background:linear-gradient(145deg,color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 20%,var(--dsw-alias-bg-layer-1,#1d2026)),var(--dsw-alias-bg-layer-1,#1d2026));color:var(--dsw-alias-brand-primary,#4d8dff);box-shadow:inset 0 1px 0 color-mix(in srgb,var(--dsw-alias-label-primary,#fff) 12%,transparent)}
.mb-title-wrap{min-width:0}
.mb-title{margin:0;font-size:23px;line-height:1.2;font-weight:720;letter-spacing:-.025em;color:var(--dsw-alias-label-primary,#e7e9ee)}
.mb-subtitle{margin-top:3px;font-size:12.5px;color:var(--dsw-alias-label-secondary,#9aa2b1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mb-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.mb-live{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 11px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.09));background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#1d2026) 78%,transparent);color:var(--dsw-alias-label-secondary,#9aa2b1);font-size:11.5px;font-weight:600;white-space:nowrap;backdrop-filter:blur(10px)}
.mb-live-dot{width:6px;height:6px;border-radius:50%;flex:none;background:var(--dsw-alias-state-success-primary,#18b26b);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-success-primary,#18b26b) 15%,transparent)}
.mb-live.is-live .mb-live-dot{animation:mbPulse 2.2s ease-out infinite}
.mb-live.is-paused .mb-live-dot{background:var(--dsw-alias-label-secondary,#9aa2b1);box-shadow:none;animation:none}
.mb-live.is-connecting .mb-live-dot{background:var(--dsw-alias-state-warn-primary,#f0a020);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f0a020) 15%,transparent);animation:mbPulse 1.1s ease-out infinite}
.mb-live.is-error .mb-live-dot{background:var(--dsw-alias-state-warn-primary,#f0a020);box-shadow:none;animation:none}
.mb-live.is-failed .mb-live-dot{background:var(--dsw-alias-state-error-primary,#ff5a5f);box-shadow:none;animation:none}
.mb-live-time{padding-left:7px;border-left:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.1));font-weight:500;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-tertiary,#737b89)}
.mb-iconbtn{flex:none;width:36px;height:36px;display:grid;place-items:center;border-radius:10px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.09));background:var(--dsw-alias-bg-layer-1,#1d2026);color:var(--dsw-alias-label-secondary,#9aa2b1);cursor:pointer;transition:background .15s ease,color .15s ease,border-color .15s ease}
.mb-iconbtn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.055));color:var(--dsw-alias-label-primary,#e7e9ee);border-color:var(--dsw-alias-border-l2,rgba(255,255,255,.16))}
.mb-iconbtn:disabled{opacity:.45;cursor:default}
.mb-iconbtn.is-spinning svg{animation:mbSpin .8s linear infinite}
.mb-iconbtn.is-on{color:var(--dsw-alias-state-warn-primary,#f0a020);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f0a020) 40%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f0a020) 10%,var(--dsw-alias-bg-layer-1,#1d2026))}
.mb-btn-primary{flex:none;height:36px;display:inline-flex;align-items:center;gap:7px;padding:0 14px;border-radius:10px;border:1px solid transparent;background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary,#4d8dff));color:var(--dsw-alias-label-primary-foreground,#fff);font-size:12.5px;font-weight:650;cursor:pointer;transition:filter .15s ease,transform .15s ease}
.mb-btn-primary:hover{filter:brightness(1.08)}
.mb-btn-primary:active{transform:translateY(1px)}
.mb-btn-primary:disabled{opacity:.5;cursor:default}
.mb-stats{flex:none;display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr 1.05fr;margin-top:18px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.09));border-radius:16px;background:linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-bg-layer-1,#1d2026) 94%,transparent),color-mix(in srgb,var(--dsw-alias-bg-layer-1,#1d2026) 78%,transparent));overflow:hidden;backdrop-filter:blur(12px)}
.mb-stat{min-width:0;padding:12px 17px 13px;border-left:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08))}
.mb-stat:first-child{border-left:0}
.mb-stat-label{font-size:10.5px;font-weight:600;letter-spacing:.055em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary,#737b89);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mb-stat-value{margin-top:3px;font-size:18px;line-height:1.35;font-weight:680;letter-spacing:-.015em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.mb-stat-sub{margin-top:1px;font-size:11px;color:var(--dsw-alias-label-tertiary,#737b89);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.mb-stat-name{font-size:14.5px;font-weight:600}
.mb-stat .mb-inline-pct{margin-left:6px;font-size:12px;font-weight:650}
.mb-breadth-line{display:flex;align-items:baseline;gap:10px;white-space:nowrap}
.mb-breadth-count{font-size:16px;font-weight:700;font-variant-numeric:tabular-nums}
.mb-breadth-count small{margin-left:3px;font-size:10.5px;font-weight:600;color:var(--dsw-alias-label-tertiary,#737b89)}
.mb-breadth-bar{height:4px;margin-top:7px;border-radius:999px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.07));overflow:hidden;display:flex}
.mb-breadth-bar i{display:block;height:100%}
.mb-breadth-bar i.up{background:var(--mb-pos)}
.mb-breadth-bar i.down{background:var(--mb-neg)}
.mb-toolbar{flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:16px 0 12px}
.mb-chips{flex:1 1 320px;min-width:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.mb-chip{flex:none;height:38px;display:inline-flex;align-items:center;gap:8px;padding:0 13px;border-radius:11px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.18));background:var(--dsw-alias-bg-layer-1,#1d2026);color:var(--dsw-alias-label-primary,#e7e9ee);font-size:13.5px;font-weight:600;cursor:pointer;backdrop-filter:blur(14px) saturate(1.1);box-shadow:0 2px 8px color-mix(in srgb,var(--dsw-alias-bg-base,#0f1116) 22%,transparent),inset 0 1px 0 color-mix(in srgb,var(--dsw-alias-label-primary,#fff) 6%,transparent);transition:background .15s ease,color .15s ease,border-color .15s ease,box-shadow .15s ease,filter .15s ease}
.mb-chip:hover{background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.07));border-color:var(--dsw-alias-border-l2,rgba(255,255,255,.2));color:var(--dsw-alias-label-primary,#e7e9ee)}
.mb-chip.is-active{background:var(--dsw-alias-brand-primary,#4d8dff);border-color:var(--dsw-alias-brand-primary,#4d8dff);color:var(--dsw-alias-label-primary-foreground,#fff);font-weight:650;box-shadow:0 6px 18px color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 28%,transparent),inset 0 1px 0 color-mix(in srgb,var(--dsw-alias-label-primary-foreground,#fff) 18%,transparent)}
.mb-chip.is-active:hover{background:var(--dsw-alias-brand-primary,#4d8dff);border-color:var(--dsw-alias-brand-primary,#4d8dff);color:var(--dsw-alias-label-primary-foreground,#fff);filter:brightness(1.06)}
.mb-chip-count{flex:none;min-width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;padding:0 6px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.1));background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.07));color:var(--dsw-alias-label-secondary,#9aa2b1);font-size:12px;font-weight:650;line-height:1;font-variant-numeric:tabular-nums}
.mb-chip.is-active .mb-chip-count{background:color-mix(in srgb,var(--dsw-alias-label-primary-foreground,#fff) 20%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-label-primary-foreground,#fff) 25%,transparent);color:var(--dsw-alias-label-primary-foreground,#fff)}
.mb-search{flex:0 1 230px;min-width:160px;height:38px;display:flex;align-items:center;gap:8px;padding:0 11px;border-radius:11px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.12));background:var(--dsw-alias-bg-layer-1,#1d2026);color:var(--dsw-alias-label-tertiary,#737b89);backdrop-filter:blur(14px);transition:border-color .15s ease,box-shadow .15s ease}
.mb-search:focus-within{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 55%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 13%,transparent)}
.mb-search input{flex:1;min-width:0;border:0;outline:none;background:transparent;color:var(--dsw-alias-label-primary,#e7e9ee);font:inherit;font-size:12.5px}
.mb-search input::placeholder{color:var(--dsw-alias-label-tertiary,#737b89)}
.mb-search-clear{flex:none;width:20px;height:20px;display:grid;place-items:center;border:0;border-radius:6px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.08));color:var(--dsw-alias-label-secondary,#9aa2b1);cursor:pointer;padding:0}
.mb-selectwrap{position:relative;flex:none;height:38px;color:var(--dsw-alias-label-secondary,#9aa2b1)}
.mb-selectwrap select{height:38px;appearance:none;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.12));border-radius:11px;background:var(--dsw-alias-bg-layer-1,#1d2026);color:var(--dsw-alias-label-secondary,#9aa2b1);padding:0 31px 0 11px;font:inherit;font-size:12.5px;cursor:pointer;outline:none;backdrop-filter:blur(14px)}
.mb-selectwrap svg{position:absolute;right:8px;top:50%;transform:translateY(-50%);pointer-events:none;opacity:.7}
.mb-toolbtn{flex:none;width:38px;height:38px;display:grid;place-items:center;border-radius:11px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.12));background:var(--dsw-alias-bg-layer-1,#1d2026);color:var(--dsw-alias-label-secondary,#9aa2b1);cursor:pointer;backdrop-filter:blur(14px);transition:background .15s ease,color .15s ease,border-color .15s ease}
.mb-toolbtn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.055));color:var(--dsw-alias-label-primary,#e7e9ee);border-color:var(--dsw-alias-border-l2,rgba(255,255,255,.16))}
.mb-toolbtn.is-paused{color:var(--dsw-alias-state-warn-primary,#f0a020);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f0a020) 36%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f0a020) 9%,var(--dsw-alias-bg-layer-1,#1d2026))}
.mb-table-card{flex:1;min-height:0;display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.09));border-radius:18px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#1d2026) 92%,transparent);overflow:hidden;box-shadow:0 18px 48px color-mix(in srgb,var(--dsw-alias-bg-base,#0f1116) 24%,transparent);backdrop-filter:blur(14px)}
.mb-table-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-gutter:stable}
.mb-head,.mb-row{display:grid;grid-template-columns:minmax(190px,230px) minmax(108px,120px) minmax(110px,120px) minmax(160px,1fr) 80px 80px 40px;align-items:center;column-gap:12px;padding:0 17px}
.mb-col-spacer{display:none}
.mb-head > .mb-col-range,.mb-row > .mb-col-range{border-left:1px solid color-mix(in srgb,var(--dsw-alias-border-l1,rgba(255,255,255,.08)) 82%,transparent);padding-left:14px}
.mb-head{position:sticky;top:0;z-index:3;height:38px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#1d2026) 94%,var(--dsw-alias-bg-base,#15171c));font-size:10px;font-weight:650;letter-spacing:.065em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary,#737b89)}
.mb-head > div{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mb-head .mb-head-num{text-align:right}
.mb-row{position:relative;min-height:61px;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-border-l1,rgba(255,255,255,.08)) 72%,transparent);transition:background .14s ease}
.mb-row:last-child{border-bottom:0}
.mb-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.045))}
.mb-cell{min-width:0}
.mb-namecell{display:flex;align-items:center;gap:8px;min-width:0}
.mb-star{flex:none;width:22px;height:28px;display:grid;place-items:center;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary,#737b89);opacity:.3;cursor:pointer;padding:0;transition:opacity .14s ease,color .14s ease,background .14s ease}
.mb-row:hover .mb-star{opacity:.8}
.mb-star:hover{background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.07));opacity:1;color:var(--dsw-alias-label-primary,#e7e9ee)}
.mb-star.is-on{opacity:1;color:var(--dsw-alias-state-warn-primary,#f0a020)}
.mb-badge{flex:none;width:34px;height:34px;display:grid;place-items:center;border-radius:10px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.09));background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.06));color:var(--dsw-alias-label-secondary,#9aa2b1);font-size:9px;font-weight:750;letter-spacing:.04em;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.mb-namewrap{min-width:0;display:flex;flex-direction:column;gap:1px}
.mb-name{font-size:13.5px;font-weight:600;letter-spacing:-.005em;color:var(--dsw-alias-label-primary,#e7e9ee);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mb-codewrap{display:flex;align-items:center;gap:5px;min-width:0;color:var(--dsw-alias-label-tertiary,#737b89);font-size:10.5px;white-space:nowrap}
.mb-code{font-variant-numeric:tabular-nums;letter-spacing:.015em;overflow:hidden;text-overflow:ellipsis}
.mb-dot-sep{opacity:.5}
.mb-market-name{overflow:hidden;text-overflow:ellipsis}
.mb-stale-dot{flex:none;width:5px;height:5px;border-radius:50%;background:var(--dsw-alias-state-warn-primary,#f0a020);margin-left:2px}
.mb-cell-price{display:flex;align-items:baseline;justify-content:flex-end;gap:4px;white-space:nowrap}
.mb-price{font-size:16px;font-weight:680;line-height:1.2;letter-spacing:-.015em;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary,#e7e9ee);border-radius:5px;padding:0 2px}
.mb-price.is-tick{animation:mbTick .75s ease-out}
.mb-unit{font-size:9.5px;font-weight:550;color:var(--dsw-alias-label-tertiary,#737b89);letter-spacing:.02em}
.mb-cell-change{display:flex;flex-direction:column;align-items:flex-end;gap:2px;white-space:nowrap}
.mb-pill{display:inline-flex;align-items:center;justify-content:center;min-width:62px;padding:1px 6px;border-radius:5px;font-size:11.5px;font-weight:680;line-height:1.55;font-variant-numeric:tabular-nums;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.06));color:var(--dsw-alias-label-secondary,#9aa2b1)}
.mb-pill.mb-dir-up{background:color-mix(in srgb,var(--mb-pos) 12%,transparent);color:var(--mb-pos)}
.mb-pill.mb-dir-down{background:color-mix(in srgb,var(--mb-neg) 12%,transparent);color:var(--mb-neg)}
.mb-change-abs{font-size:10.5px;color:var(--dsw-alias-label-tertiary,#737b89);font-variant-numeric:tabular-nums}
.mb-dir-up{color:var(--mb-pos)}
.mb-dir-down{color:var(--mb-neg)}
.mb-dir-flat{color:var(--dsw-alias-label-secondary,#9aa2b1)}
.mb-cell-range{min-width:0;padding-right:4px}
.mb-range-nums{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10px;color:var(--dsw-alias-label-tertiary,#737b89);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden}
.mb-range-nums span{overflow:hidden;text-overflow:ellipsis}
.mb-range-track{position:relative;height:3px;margin-top:6px;border-radius:999px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.075))}
.mb-range-marker{position:absolute;top:50%;width:6px;height:6px;margin-left:-3px;transform:translateY(-50%);border-radius:50%;background:var(--mb-pos)}
.mb-range-marker.is-down{background:var(--mb-neg)}
.mb-range-marker.is-flat{background:var(--dsw-alias-label-secondary,#9aa2b1)}.mb-range-empty{font-size:10.5px;color:var(--dsw-alias-label-tertiary,#737b89)}
.mb-cell-num{text-align:right;font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary,#9aa2b1);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mb-cell-action{display:flex;align-items:center;justify-content:flex-end}
.mb-remove{width:24px;height:24px;display:grid;place-items:center;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary,#737b89);opacity:0;cursor:pointer;padding:0;transition:opacity .14s ease,color .14s ease,background .14s ease}
.mb-row:hover .mb-remove,.mb-row:focus-within .mb-remove{opacity:.75}
.mb-remove:hover{opacity:1!important;color:var(--dsw-alias-state-error-primary,#ff5a5f);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ff5a5f) 10%,transparent)}
.mb-noquote{font-size:11px;color:var(--dsw-alias-label-tertiary,#737b89)}
.mb-table-foot{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 17px;border-top:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#1d2026) 84%,transparent);font-size:10.5px;color:var(--dsw-alias-label-tertiary,#737b89);white-space:nowrap}
.mb-foot-left,.mb-foot-right{display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden;text-overflow:ellipsis}
.mb-foot-right{justify-content:flex-end}
.mb-foot-sep{opacity:.4}
.mb-empty{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:44px 22px}
.mb-empty-icon{width:52px;height:52px;display:grid;place-items:center;border-radius:16px;border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 22%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 9%,transparent);color:var(--dsw-alias-brand-primary,#4d8dff);margin-bottom:12px}
.mb-empty-title{font-size:14px;font-weight:650;color:var(--dsw-alias-label-primary,#e7e9ee)}
.mb-empty-body{margin-top:3px;max-width:360px;font-size:12px;color:var(--dsw-alias-label-secondary,#9aa2b1);line-height:1.6}
.mb-empty-btn{margin-top:14px;height:32px;padding:0 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.16));background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,#e7e9ee);font-size:11.5px;cursor:pointer}
.mb-empty-btn:hover{border-color:var(--dsw-alias-brand-primary,#4d8dff);color:var(--dsw-alias-brand-primary,#4d8dff)}
.mb-page[data-density="compact"] .mb-row{min-height:48px}
.mb-page[data-density="compact"] .mb-badge{width:30px;height:30px;border-radius:9px;font-size:8.5px}
.mb-page[data-density="compact"] .mb-name{font-size:13px}
.mb-page[data-density="compact"] .mb-price{font-size:15px}
.mb-page[data-density="compact"] .mb-codewrap{font-size:10px}
.mb-page[data-density="compact"] .mb-star{height:24px}
.mb-page[data-density="compact"] .mb-head{height:34px}
.mb-skeleton{display:block;border-radius:6px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.07));position:relative;overflow:hidden}
.mb-skeleton::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--dsw-alias-label-primary,#fff) 7%,transparent),transparent);animation:mbShimmer 1.3s ease-in-out infinite}
.mb-skel-brand{width:150px;height:22px;margin-bottom:4px}
.mb-skel-sub{width:100px;height:10px}
.mb-skel-stat{height:62px;border-radius:0;border-right:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06))}
.mb-skel-row{display:flex;align-items:center;gap:12px;min-height:61px;padding:0 17px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06))}
.mb-skel-row .mb-skel-badge{width:34px;height:34px;border-radius:10px;flex:none}
.mb-skel-row .mb-skel-lines{flex:1;display:flex;flex-direction:column;gap:6px}
.mb-skel-row .mb-skel-line{height:10px;width:42%}
.mb-skel-row .mb-skel-line.short{width:24%}
.mb-skel-row .mb-skel-price{width:74px;height:13px}
.mb-center{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:24px}
.mb-error-card{width:min(440px,100%);padding:24px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.09));border-radius:16px;background:var(--dsw-alias-bg-layer-1,#1d2026);text-align:center}
.mb-error-icon{width:44px;height:44px;display:grid;place-items:center;margin:0 auto 12px;border-radius:13px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ff5a5f) 10%,transparent);color:var(--dsw-alias-state-error-primary,#ff5a5f)}
.mb-error-title{font-size:14px;font-weight:650}
.mb-error-body{margin-top:4px;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary,#9aa2b1)}
.mb-error-btn{margin-top:14px;height:34px;padding:0 14px;border-radius:9px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.16));background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.06));font-size:12px;cursor:pointer}
.mb-error-btn:hover{border-color:var(--dsw-alias-brand-primary,#4d8dff);color:var(--dsw-alias-brand-primary,#4d8dff)}
.mb-banner{flex:none;display:flex;align-items:center;gap:8px;padding:8px 12px;margin:10px 14px 0;border-radius:10px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f0a020) 32%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f0a020) 8%,transparent);color:var(--dsw-alias-state-warn-primary,#f0a020);font-size:11.5px}
.mb-banner button{margin-left:auto;border:0;background:transparent;color:inherit;font-size:11.5px;text-decoration:underline;cursor:pointer;padding:0}
.mb-overlay{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:24px;background:color-mix(in srgb,var(--dsw-alias-bg-base,#15171c) 58%,transparent);backdrop-filter:blur(14px) saturate(.9);animation:mbFade .17s ease}
.mb-modal{width:100%;max-width:720px;max-height:min(84vh,800px);display:flex;flex-direction:column;min-height:0;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));border-radius:20px;background:var(--dsw-alias-bg-overlay,#20242c);overflow:hidden;box-shadow:0 30px 90px color-mix(in srgb,var(--dsw-alias-bg-base,#0f1116) 72%,transparent);animation:mbRise .22s cubic-bezier(.2,.85,.25,1)}
.mb-modal.is-settings{max-width:580px}
.mb-modal:focus{outline:none}
.mb-modal-head{flex:none;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:22px 24px 0}
.mb-modal-eyebrow{font-size:10px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--dsw-alias-brand-primary,#4d8dff);margin-bottom:4px}
.mb-modal-title{margin:0;font-size:19px;line-height:1.25;font-weight:720;letter-spacing:-.02em;color:var(--dsw-alias-label-primary,#e7e9ee)}
.mb-modal-sub{margin-top:4px;font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary,#9aa2b1)}
.mb-modal-close{flex:none;width:30px;height:30px;display:grid;place-items:center;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary,#737b89);cursor:pointer;padding:0}
.mb-modal-close:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,#e7e9ee);border-color:var(--dsw-alias-border-l1,rgba(255,255,255,.09))}
.mb-add-search{flex:none;height:44px;display:flex;align-items:center;gap:9px;margin:16px 24px 10px;padding:0 12px;border-radius:11px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.09));background:var(--dsw-alias-bg-layer-1,#1d2026);color:var(--dsw-alias-label-tertiary,#737b89);transition:border-color .15s ease,box-shadow .15s ease}
.mb-add-search:focus-within{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 58%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 13%,transparent)}
.mb-add-search input{flex:1;min-width:0;border:0;outline:none;background:transparent;color:var(--dsw-alias-label-primary,#e7e9ee);font:inherit;font-size:13px}
.mb-add-search input::placeholder{color:var(--dsw-alias-label-tertiary,#737b89)}
.mb-modal-chips{flex:none;display:flex;flex-wrap:wrap;gap:7px;padding:0 24px 8px}
.mb-modal-chips .mb-chip{height:32px;font-size:12px;padding:0 11px;border-radius:9px;gap:6px}
.mb-hint-line{flex:none;padding:0 24px 7px;font-size:10.5px;color:var(--dsw-alias-label-tertiary,#737b89)}
.mb-results{flex:1;min-height:150px;overflow-y:auto;overscroll-behavior:contain;display:flex;flex-direction:column;gap:1px;padding:0 14px 8px}
.mb-result{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;min-height:50px;transition:background .14s ease}
.mb-result:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.045))}
.mb-result .mb-badge{width:32px;height:32px;border-radius:9px}
.mb-result-main{min-width:0;flex:1;display:flex;flex-direction:column;gap:0}
.mb-result-name{font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-primary,#e7e9ee);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mb-result-meta{font-size:10.5px;color:var(--dsw-alias-label-tertiary,#737b89);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mb-result-action{flex:none;margin-left:4px}
.mb-mini-add{height:27px;min-width:52px;padding:0 10px;border-radius:7px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.16));background:var(--dsw-alias-bg-layer-1,#1d2026);color:var(--dsw-alias-label-primary,#e7e9ee);font-size:11px;font-weight:550;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px}
.mb-mini-add:hover{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 55%,transparent);color:var(--dsw-alias-brand-primary,#4d8dff);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 8%,transparent)}
.mb-mini-add.is-added{border-color:transparent;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.06));color:var(--dsw-alias-label-tertiary,#737b89);cursor:default}
.mb-mini-add:disabled{cursor:default;opacity:.7}
.mb-results-state{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:30px 16px;font-size:12px;color:var(--dsw-alias-label-secondary,#9aa2b1);text-align:center}
.mb-results-state-title{font-weight:600;color:var(--dsw-alias-label-primary,#e7e9ee)}
.mb-results-state-hint{font-size:11px;color:var(--dsw-alias-label-tertiary,#737b89);line-height:1.55;max-width:320px}
.mb-spinner{width:18px;height:18px;border:2px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));border-top-color:var(--dsw-alias-brand-primary,#4d8dff);border-radius:50%;animation:mbSpin .75s linear infinite}
.mb-manual{flex:none;margin:4px 24px 0;padding:11px 0 0;border-top:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08))}
.mb-manual-toggle{height:28px;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#9aa2b1);font-size:11px;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
.mb-manual-toggle:hover{color:var(--dsw-alias-brand-primary,#4d8dff)}
.mb-manual-grid{display:grid;grid-template-columns:112px minmax(100px,1fr) minmax(140px,1.15fr) auto;gap:7px;align-items:end;margin-top:9px}
.mb-field{min-width:0;display:flex;flex-direction:column;gap:4px}
.mb-field label{font-size:10px;font-weight:600;letter-spacing:.03em;color:var(--dsw-alias-label-tertiary,#737b89)}
.mb-input,.mb-field select{width:100%;height:34px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.1));border-radius:8px;background:var(--dsw-alias-bg-layer-1,#1d2026);color:var(--dsw-alias-label-primary,#e7e9ee);padding:0 9px;font:inherit;font-size:12px;outline:none}
.mb-input:focus,.mb-field select:focus{border-color:var(--dsw-alias-brand-primary,#4d8dff)}
.mb-manual-submit{height:34px;padding:0 13px;border-radius:8px;border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 35%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 12%,transparent);color:var(--dsw-alias-brand-primary,#4d8dff);font-size:11.5px;font-weight:600;cursor:pointer;white-space:nowrap}
.mb-manual-submit:disabled{opacity:.45;cursor:default}
.mb-manual-hint{margin-top:6px;font-size:10px;color:var(--dsw-alias-label-tertiary,#737b89);line-height:1.55}
.mb-modal-foot{flex:none;padding:10px 24px 16px;border-top:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.07));background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#1d2026) 55%,transparent);font-size:10.5px;line-height:1.55;color:var(--dsw-alias-label-tertiary,#737b89)}
.mb-settings-body{flex:1;min-height:0;overflow-y:auto;padding:16px 24px 6px}
.mb-setting{padding:13px 0;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.07))}
.mb-setting:last-child{border-bottom:0}
.mb-setting-label{font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-primary,#e7e9ee)}
.mb-setting-hint{margin-top:2px;font-size:11px;line-height:1.55;color:var(--dsw-alias-label-secondary,#9aa2b1)}
.mb-seg{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
.mb-seg-btn{height:29px;padding:0 11px;border-radius:7px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.1));background:var(--dsw-alias-bg-layer-1,#1d2026);color:var(--dsw-alias-label-secondary,#9aa2b1);font-size:11px;cursor:pointer}
.mb-seg-btn:hover{border-color:var(--dsw-alias-border-l2,rgba(255,255,255,.18));color:var(--dsw-alias-label-primary,#e7e9ee)}
.mb-seg-btn.is-active{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 12%,transparent);color:var(--dsw-alias-brand-primary,#4d8dff);font-weight:600}
.mb-color-options{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}
.mb-color-option{text-align:left;padding:10px 11px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.1));border-radius:9px;background:var(--dsw-alias-bg-layer-1,#1d2026);cursor:pointer}
.mb-color-option:hover{border-color:var(--dsw-alias-border-l2,rgba(255,255,255,.18))}
.mb-color-option.is-active{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 50%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 7%,var(--dsw-alias-bg-layer-1,#1d2026))}
.mb-color-preview{display:flex;align-items:center;gap:9px;font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.2}
.mb-color-option.is-red .mb-preview-up{color:var(--dsw-alias-state-error-primary,#ff5a5f)}
.mb-color-option.is-red .mb-preview-down{color:var(--dsw-alias-state-success-primary,#18b26b)}
.mb-color-option.is-green .mb-preview-up{color:var(--dsw-alias-state-success-primary,#18b26b)}
.mb-color-option.is-green .mb-preview-down{color:var(--dsw-alias-state-error-primary,#ff5a5f)}
.mb-color-name{margin-top:5px;font-size:10.5px;color:var(--dsw-alias-label-secondary,#9aa2b1)}
.mb-setting-danger{display:flex;align-items:center;justify-content:space-between;gap:14px}
.mb-danger-btn{flex:none;height:31px;padding:0 11px;border-radius:7px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary,#ff5a5f) 36%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ff5a5f) 7%,transparent);color:var(--dsw-alias-state-error-primary,#ff5a5f);font-size:11px;cursor:pointer;white-space:nowrap}
.mb-danger-btn:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ff5a5f) 13%,transparent)}
.mb-danger-btn.is-armed{background:var(--dsw-alias-state-error-primary,#ff5a5f);color:var(--dsw-alias-label-primary-foreground,#fff)}
.mb-settings-foot{flex:none;padding:10px 24px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.07));font-size:10px;color:var(--dsw-alias-label-tertiary,#737b89)}
.mb-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:95;max-width:min(520px,calc(100vw - 32px));display:flex;align-items:center;gap:8px;padding:9px 15px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.16));background:var(--dsw-alias-bg-overlay,#20242c);color:var(--dsw-alias-label-primary,#e7e9ee);font-size:11.5px;font-weight:550;box-shadow:0 12px 36px color-mix(in srgb,var(--dsw-alias-bg-base,#0f1116) 58%,transparent);animation:mbToastIn .22s cubic-bezier(.2,.85,.25,1)}
.mb-toast.is-error{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ff5a5f) 45%,transparent);color:var(--dsw-alias-state-error-primary,#ff5a5f)}
.mb-toast-dot{width:6px;height:6px;border-radius:50%;flex:none;background:var(--dsw-alias-state-success-primary,#18b26b)}
.mb-toast.is-error .mb-toast-dot{background:var(--dsw-alias-state-error-primary,#ff5a5f)}
@media (max-width:1260px){.mb-head,.mb-row{grid-template-columns:minmax(190px,230px) minmax(108px,120px) minmax(110px,120px) minmax(160px,1fr) 40px}.mb-col-open,.mb-col-prev{display:none}}
@media (max-width:1080px){.mb-stats{grid-template-columns:1.16fr 1fr 1fr 1fr}.mb-stat-updated{display:none}}
@media (max-width:1020px){.mb-head,.mb-row{grid-template-columns:minmax(180px,230px) 100px 102px minmax(0,1fr) 38px}.mb-col-range{display:none}.mb-col-spacer{display:block}}
@media (max-width:880px){.mb-search{flex:1 1 160px}.mb-stats{grid-template-columns:1.16fr 1fr 1fr}.mb-stat-lagger{display:none}}
@media (max-width:720px){.mb-shell{padding:16px 12px 14px}.mb-title{font-size:20px}.mb-brand-icon{width:40px;height:40px;border-radius:12px}.mb-stats{grid-template-columns:1fr 1fr}.mb-stat{border-left:0;border-top:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08))}.mb-stat:nth-child(1),.mb-stat:nth-child(2){border-top:0}.mb-stat:first-child{border-top:0}.mb-stat-breadth{grid-column:auto}.mb-stat-lagger{display:block}.mb-stat-updated{display:none}.mb-toolbar{gap:7px}.mb-chips{flex-basis:100%;order:3}.mb-head,.mb-row{grid-template-columns:minmax(170px,210px) 88px 92px minmax(0,1fr) 34px;padding:0 12px;column-gap:8px}.mb-head{font-size:9px}.mb-row{min-height:57px}.mb-badge{width:31px;height:31px}.mb-price{font-size:15px}.mb-pill{min-width:56px;font-size:11px}.mb-search{order:1;flex:1 1 140px}.mb-selectwrap{order:2}.mb-toolbtn{order:2}.mb-actions{gap:6px}.mb-live{height:32px;padding:0 9px}.mb-table-foot{padding:8px 12px}.mb-foot-right{display:none}.mb-manual-grid{grid-template-columns:1fr 1fr}.mb-manual-submit{grid-column:span 2}.mb-overlay{padding:10px}.mb-modal{max-height:88vh;border-radius:16px}.mb-results{min-height:120px}.mb-result{padding:7px 8px}}
@media (max-width:560px){.mb-modal-head{padding:18px 18px 0}.mb-add-search{margin:13px 18px 9px}.mb-modal-chips{padding:0 18px 7px}.mb-results{padding:0 10px 6px}.mb-manual{margin:4px 18px 0}.mb-modal-foot{padding:9px 18px 14px}.mb-settings-body{padding:12px 18px 4px}.mb-settings-foot{padding:9px 18px 14px}.mb-color-options{grid-template-columns:1fr}.mb-stat{padding:10px 12px}.mb-stat-value{font-size:16px}.mb-breadth-count{font-size:15px}.mb-top{gap:10px}.mb-subtitle{display:none}.mb-live-time{display:none}.mb-brand{gap:10px}.mb-btn-primary .mb-add-label{display:none}.mb-btn-primary{width:36px;padding:0;justify-content:center}.mb-head,.mb-row{grid-template-columns:minmax(0,180px) 82px 84px minmax(0,1fr) 30px;padding:0 9px;column-gap:6px}.mb-star{width:18px}.mb-namecell{gap:5px}.mb-badge{width:28px;height:28px;font-size:8px}.mb-name{font-size:12.5px}.mb-codewrap{font-size:9.5px}.mb-market-name{display:none}.mb-dot-sep{display:none}.mb-pill{min-width:52px;font-size:10.5px}.mb-change-abs{font-size:9.5px}.mb-table-foot .mb-foot-sources{display:none}.mb-toolbar{margin-top:10px}.mb-stat-label{font-size:9px}.mb-stats{margin-top:12px}.mb-chip{height:36px;padding:0 10px;font-size:12.5px;gap:6px}.mb-chip-count{min-width:19px;height:19px;font-size:11px;padding:0 5px}.mb-toolbar{gap:8px}}
@media (max-width:560px){.mb-modal-chips .mb-chip{height:30px;font-size:11.5px;padding:0 9px}}
@media (hover:none){.mb-star,.mb-remove{opacity:.72}}
@keyframes mbPulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--dsw-alias-state-success-primary,#18b26b) 34%,transparent)}70%{box-shadow:0 0 0 5px transparent}100%{box-shadow:0 0 0 0 transparent}}
@keyframes mbSpin{to{transform:rotate(360deg)}}
@keyframes mbTick{0%{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 18%,transparent)}100%{background:transparent}}
@keyframes mbShimmer{100%{transform:translateX(100%)}}
@keyframes mbFade{from{opacity:0}to{opacity:1}}
@keyframes mbRise{from{opacity:0;transform:translateY(10px) scale(.99)}to{opacity:1;transform:none}}
@keyframes mbToastIn{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}
@media (prefers-reduced-motion:reduce){.mb-page *,.mb-page *::before,.mb-page *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}.mb-table-scroll{scroll-behavior:auto}}
`

      function injectStyles() {
        if (typeof document === 'undefined') return function () {}
        var marker = 'dsh-marketboard/styles'
        if (document.querySelector('style[data-plugin-css="' + marker + '"]')) return function () {}
        var el = document.createElement('style')
        el.dataset.plugin = 'dsh-marketboard'
        el.dataset.pluginCss = marker
        el.textContent = CSS
        document.head.appendChild(el)
        return function () {
          try { el.remove() } catch (e) {}
        }
      }

      // ------------------------------------------------------------------
      // Shared UI bits
      // ------------------------------------------------------------------
      function LivePill(props) {
        var t = props.t
        var paused = props.paused
        var loading = props.loading
        var error = props.error
        var updatedAt = props.updatedAt
        var refreshMs = props.refreshMs
        var stateKey = 'live'
        var labelKey = 'live.live'
        if (loading) {
          stateKey = 'connecting'
          labelKey = 'live.connecting'
        } else if (paused) {
          stateKey = 'paused'
          labelKey = 'live.paused'
        } else if (error) {
          if (updatedAt) {
            stateKey = 'error'
            labelKey = 'live.error'
          } else {
            stateKey = 'failed'
            labelKey = 'live.failed'
          }
        }
        var clock = updatedAt ? formatClock(updatedAt) : ''
        var title = paused
          ? t('live.pausedHint')
          : t('live.hint', { s: Math.round((refreshMs || 5000) / 1000) })
        return h('div', {
          className: 'mb-live is-' + stateKey,
          role: 'status',
          title: title,
          'aria-live': 'polite',
        }, [
          h('span', { className: 'mb-live-dot', key: 'dot' }),
          h('span', { className: 'mb-live-text', key: 'text' }, t(labelKey)),
          clock ? h('span', { className: 'mb-live-time', key: 'clock' }, clock) : null,
        ])
      }

      function Brand(props) {
        var t = props.t
        return h('div', { className: 'mb-brand' }, [
          h('div', { className: 'mb-brand-icon', key: 'icon' }, h(IconBoard, { size: 23 })),
          h('div', { className: 'mb-title-wrap', key: 'title' }, [
            h('h1', { className: 'mb-title', key: 'h' }, t('page.title')),
            h('div', { className: 'mb-subtitle', key: 's' }, t('page.subtitle')),
          ]),
        ])
      }

      function StatsStrip(props) {
        var t = props.t
        var items = props.items || []
        var quotes = props.quotes || {}
        var meta = props.meta || {}
        var paused = props.paused
        var quoteError = props.quoteError
        var up = 0
        var down = 0
        var flat = 0
        var withData = 0
        var withPct = 0
        var sum = 0
        var leader = null
        var lagger = null
        for (var i = 0; i < items.length; i++) {
          var item = items[i]
          var q = quotes[item.id]
          if (!q || q.price === null || q.price === undefined) continue
          withData++
          var d = directionOf(q)
          if (d === 'up') up++
          else if (d === 'down') down++
          else flat++
          if (q.changePct !== null && q.changePct !== undefined && isFinite(q.changePct)) {
            withPct++
            sum += q.changePct
            if (!leader || q.changePct > leader.pct) leader = { item: item, pct: q.changePct }
            if (!lagger || q.changePct < lagger.pct) lagger = { item: item, pct: q.changePct }
          }
        }
        var avg = withPct > 0 ? sum / withPct : null
        var total = Math.max(up + down + flat, 1)
        var upPct = up / total * 100
        var downPct = down / total * 100
        var updated = meta.fetchedAt ? formatClock(meta.fetchedAt) : '—'
        var itemsLabel = t('stats.items', { n: items.length })
        return h('div', { className: 'mb-stats', role: 'group', 'aria-label': t('stats.breadth') }, [
          h('div', { className: 'mb-stat mb-stat-breadth', key: 'breadth' }, [
            h('div', { className: 'mb-stat-label', key: 'l' }, t('stats.breadth')),
            h('div', { className: 'mb-breadth-line', key: 'v' }, [
              h('span', { className: 'mb-breadth-count mb-dir-up', key: 'u' }, [String(up), h('small', { key: 'us' }, t('stats.up'))]),
              h('span', { className: 'mb-breadth-count mb-dir-down', key: 'd' }, [String(down), h('small', { key: 'ds' }, t('stats.down'))]),
              flat > 0 ? h('span', { className: 'mb-breadth-count mb-dir-flat', key: 'f' }, [String(flat), h('small', { key: 'fs' }, t('stats.flat'))]) : null,
            ]),
            h('div', { className: 'mb-breadth-bar', key: 'bar' }, [
              h('i', { key: 'u', className: 'up', style: { width: upPct + '%' } }),
              h('i', { key: 'd', className: 'down', style: { width: downPct + '%' } }),
            ]),
            h('div', { className: 'mb-stat-sub', key: 's' }, itemsLabel),
          ]),
          h('div', { className: 'mb-stat', key: 'avg' }, [
            h('div', { className: 'mb-stat-label', key: 'l' }, t('stats.avg')),
            h('div', {
              key: 'v',
              className: 'mb-stat-value ' + (avg === null ? 'mb-dir-flat' : 'mb-dir-' + (avg > 0 ? 'up' : avg < 0 ? 'down' : 'flat')),
            }, formatPct(avg)),
            h('div', { className: 'mb-stat-sub', key: 's' }, t('stats.quoted', { n: withData, total: items.length })),
          ]),
          h('div', { className: 'mb-stat mb-stat-leader', key: 'leader' }, [
            h('div', { className: 'mb-stat-label', key: 'l' }, t('stats.leader')),
            h('div', { className: 'mb-stat-value mb-stat-name', key: 'v' }, leader ? leader.item.name : '—'),
            h('div', { className: 'mb-stat-sub', key: 's' }, leader
              ? [h('span', { key: 'p', className: 'mb-inline-pct mb-dir-up' }, formatPct(leader.pct)), ' · ' + leader.item.code]
              : t('stats.none')),
          ]),
          h('div', { className: 'mb-stat mb-stat-lagger', key: 'lagger' }, [
            h('div', { className: 'mb-stat-label', key: 'l' }, t('stats.lagger')),
            h('div', { className: 'mb-stat-value mb-stat-name', key: 'v' }, lagger ? lagger.item.name : '—'),
            h('div', { className: 'mb-stat-sub', key: 's' }, lagger
              ? [h('span', { key: 'p', className: 'mb-inline-pct mb-dir-down' }, formatPct(lagger.pct)), ' · ' + lagger.item.code]
              : t('stats.none')),
          ]),
          h('div', { className: 'mb-stat mb-stat-updated', key: 'updated' }, [
            h('div', { className: 'mb-stat-label', key: 'l' }, t('stats.updated')),
            h('div', { className: 'mb-stat-value mb-stat-time', key: 'v' }, paused ? t('live.paused') : updated),
            h('div', { className: 'mb-stat-sub', key: 's' }, quoteError ? t('live.error') : itemsLabel),
          ]),
        ])
      }

      function Toolbar(props) {
        var t = props.t
        var category = props.category
        var setCategory = props.setCategory
        var counts = props.counts
        var query = props.query
        var setQuery = props.setQuery
        var sort = props.sort
        var setSort = props.setSort
        var paused = props.paused
        var onTogglePause = props.onTogglePause
        var queryRef = React.useRef(null)
        return h('div', { className: 'mb-toolbar' }, [
          h('div', { className: 'mb-chips', key: 'chips' }, GROUPS.map(function (group) {
            var count = group.key === 'all' ? props.total : (counts[group.key] || 0)
            return h('button', {
              key: group.key,
              type: 'button',
              className: 'mb-chip' + (category === group.key ? ' is-active' : ''),
              onClick: function () { setCategory(group.key) },
              'aria-pressed': category === group.key,
            }, [
              h('span', { key: 'l' }, t(group.tKey)),
              h('span', { className: 'mb-chip-count', key: 'c' }, String(count)),
            ])
          })),
          h('div', { className: 'mb-search', key: 'search' }, [
            h(IconSearch, { key: 'i', size: 15 }),
            h('input', {
              key: 'input',
              ref: queryRef,
              type: 'text',
              value: query,
              placeholder: t('toolbar.search'),
              'aria-label': t('toolbar.search'),
              onChange: function (event) { setQuery(event.target.value) },
            }),
            query ? h('button', {
              key: 'clear',
              type: 'button',
              className: 'mb-search-clear',
              title: t('actions.clear'),
              'aria-label': t('actions.clear'),
              onClick: function () {
                setQuery('')
                if (queryRef.current) queryRef.current.focus()
              },
            }, h(IconClose, { size: 11 })) : null,
          ]),
          h('div', { className: 'mb-selectwrap', key: 'sort', title: t('toolbar.sort') }, [
            h('select', {
              key: 's',
              value: sort,
              'aria-label': t('toolbar.sort'),
              onChange: function (event) { setSort(event.target.value) },
            }, [
              h('option', { key: 'default', value: 'default' }, t('sort.default')),
              h('option', { key: 'pctDesc', value: 'pctDesc' }, t('sort.pctDesc')),
              h('option', { key: 'pctAsc', value: 'pctAsc' }, t('sort.pctAsc')),
              h('option', { key: 'name', value: 'name' }, t('sort.name')),
            ]),
            h(IconChevron, { key: 'c', size: 13 }),
          ]),
          h('button', {
            key: 'pause',
            type: 'button',
            className: 'mb-toolbtn' + (paused ? ' is-paused' : ''),
            title: paused ? t('actions.resume') : t('actions.pause'),
            'aria-label': paused ? t('actions.resume') : t('actions.pause'),
            'aria-pressed': paused,
            onClick: onTogglePause,
          }, paused ? h(IconPlay, { size: 15 }) : h(IconPause, { size: 15 })),
        ])
      }

      function RangeCell(props) {
        var quote = props.quote
        var item = props.item
        var t = props.t
        if (!quote || !(quote.low > 0) || !(quote.high > 0) || quote.high < quote.low) {
          return h('div', { className: 'mb-range-empty' }, '—')
        }
        var span = quote.high - quote.low
        var pos = span === 0 ? 50 : ((quote.price - quote.low) / span) * 100
        pos = Math.max(2, Math.min(98, pos))
        var dir = directionOf(quote)
        var low = formatPrice(item, quote.low)
        var high = formatPrice(item, quote.high)
        return h('div', {
          title: t('row.rangeTitle', { low: low, high: high }),
        }, [
          h('div', { className: 'mb-range-nums', key: 'nums' }, [
            h('span', { key: 'l' }, low),
            h('span', { key: 'h' }, high),
          ]),
          h('div', { className: 'mb-range-track', key: 'track' }, h('i', {
            className: 'mb-range-marker' + (dir === 'down' ? ' is-down' : dir === 'flat' ? ' is-flat' : ''),
            style: { left: pos + '%' },
          })),
        ])
      }

      function QuoteRow(props) {
        var item = props.item
        var quote = props.quote
        var t = props.t
        var onRemove = props.onRemove
        var onFavorite = props.onFavorite
        var busy = props.busy
        var dir = directionOf(quote)
        var hasQuote = Boolean(quote && quote.ok && quote.price !== null && quote.price !== undefined)
        var price = hasQuote ? formatPrice(item, quote.price) : '—'
        var unit = hasQuote ? currencyLabel(quote, t) : ''
        var pct = hasQuote ? formatPct(quote.changePct) : '—'
        var change = hasQuote ? formatChange(item, quote.change, quote.price) : '—'
        var fullTitle = fullCode(item)
        var title = quoteTitle(t, quote)
        return h('div', {
          className: 'mb-row',
          role: 'row',
          'data-id': item.id,
          'aria-label': item.name + ' ' + fullTitle,
        }, [
          h('div', { className: 'mb-cell mb-namecell', key: 'name', role: 'cell' }, [
            h('button', {
              key: 'star',
              type: 'button',
              className: 'mb-star' + (item.favorite ? ' is-on' : ''),
              title: item.favorite ? t('row.unstar') : t('row.star'),
              'aria-label': item.favorite ? t('row.unstar') : t('row.star'),
              onClick: function () { onFavorite(item) },
              disabled: busy,
            }, h(IconStar, { size: 14, filled: item.favorite })),
            h('span', { className: 'mb-badge', key: 'badge', title: t(MARKET_TKEY[item.market]) }, BADGE[item.market] || ''),
            h('div', { className: 'mb-namewrap', key: 'nm' }, [
              h('div', { className: 'mb-name', key: 'n', title: item.name }, item.name),
              h('div', { className: 'mb-codewrap', key: 'c' }, [
                h('span', { className: 'mb-code', key: 'code', title: fullTitle }, displayCode(item)),
                h('span', { className: 'mb-dot-sep', key: 'sep' }, '·'),
                h('span', { className: 'mb-market-name', key: 'mk' }, t(MARKET_TKEY[item.market])),
                quote && quote.stale ? h('span', { key: 'stale', className: 'mb-stale-dot', title: t('row.stale') }) : null,
              ]),
            ]),
          ]),
          h('div', { className: 'mb-cell mb-cell-price', key: 'price', role: 'cell', title: title || undefined }, hasQuote ? [
            h('span', {
              key: 'p' + quote.price,
              className: 'mb-price is-tick',
            }, price),
            unit ? h('span', { key: 'u', className: 'mb-unit' }, unit) : null,
          ] : h('span', { className: 'mb-noquote' }, '—')),
          h('div', { className: 'mb-cell mb-cell-change', key: 'change', role: 'cell' }, hasQuote ? [
            h('span', { key: 'p', className: 'mb-pill ' + dirClass(dir) }, [h('span', { key: 'a', 'aria-hidden': true }, dir === 'up' ? '↑ ' : dir === 'down' ? '↓ ' : ''), pct]),
            h('span', { key: 'a', className: 'mb-change-abs' }, change),
          ] : h('span', { className: 'mb-noquote' }, t('row.noData'))),
          h('div', { className: 'mb-cell mb-cell-range mb-col-range', key: 'range', role: 'cell' },
            h(RangeCell, { quote: quote, item: item, t: t })),
          h('div', { className: 'mb-cell mb-cell-num mb-col-open', key: 'open', role: 'cell' },
            hasQuote && quote.open ? formatPrice(item, quote.open) : '—'),
          h('div', { className: 'mb-cell mb-cell-num mb-col-prev', key: 'prev', role: 'cell' },
            hasQuote && quote.prevClose ? formatPrice(item, quote.prevClose) : '—'),
          h('div', { className: 'mb-cell mb-col-spacer', key: 'spacer', role: 'presentation' }),
          h('div', { className: 'mb-cell mb-cell-action', key: 'action', role: 'cell' }, h('button', {
            type: 'button',
            className: 'mb-remove',
            title: t('row.remove'),
            'aria-label': t('row.remove') + ' ' + item.name,
            onClick: function () { onRemove(item) },
            disabled: busy,
          }, h(IconClose, { size: 13 }))),
        ])
      }

      function EmptyState(props) {
        var t = props.t
        var searching = props.searching
        var onClear = props.onClear
        var onAdd = props.onAdd
        return h('div', { className: 'mb-empty' }, [
          h('div', { className: 'mb-empty-icon', key: 'i' }, h(IconBoard, { size: 27 })),
          h('div', { className: 'mb-empty-title', key: 't' }, t(searching ? 'table.emptyFilterTitle' : 'table.emptyTitle')),
          h('div', { className: 'mb-empty-body', key: 'b' }, t(searching ? 'table.emptyFilterBody' : 'table.emptyBody')),
          h('button', {
            key: 'a',
            type: 'button',
            className: 'mb-empty-btn',
            onClick: searching ? onClear : onAdd,
          }, t(searching ? 'table.clearSearch' : 'table.add')),
        ])
      }

      function TableSkeleton() {
        var rows = []
        for (var i = 0; i < 8; i++) {
          rows.push(h('div', { className: 'mb-skel-row', key: i }, [
            h('span', { className: 'mb-skeleton mb-skel-badge', key: 'b' }),
            h('div', { className: 'mb-skel-lines', key: 'l' }, [
              h('span', { className: 'mb-skeleton mb-skel-line', key: 'a' }),
              h('span', { className: 'mb-skeleton mb-skel-line short', key: 'b' }),
            ]),
            h('span', { className: 'mb-skeleton mb-skel-price', key: 'p' }),
          ]))
        }
        return rows
      }

      function LoadingPanel(props) {
        var t = props.t
        return h('section', { className: 'mb-page', 'data-up': 'red', 'data-density': 'comfortable', 'aria-busy': 'true', 'aria-label': t('page.title') }, h('div', { className: 'mb-shell' }, [
          h('div', { className: 'mb-top', key: 'top' }, [
            h('div', { className: 'mb-brand', key: 'brand' }, [
              h('div', { className: 'mb-brand-icon', key: 'i' }, h(IconBoard, { size: 23 })),
              h('div', { className: 'mb-title-wrap', key: 'w' }, [
                h('div', { className: 'mb-title', key: 't' }, t('page.title')),
                h('div', { className: 'mb-subtitle', key: 's' }, t('page.subtitle')),
              ]),
            ]),
            h('div', { className: 'mb-actions', key: 'a' }, h(LivePill, { t: t, loading: true, paused: false, error: false, updatedAt: 0, refreshMs: 5000 })),
          ]),
          h('div', { className: 'mb-stats', key: 'stats' }, [1, 2, 3, 4, 5].map(function (n) {
            return h('div', { className: 'mb-stat', key: n }, [
              h('span', { className: 'mb-skeleton', style: { width: '52px', height: '10px', display: 'block', marginBottom: '9px' } }),
              h('span', { className: 'mb-skeleton', style: { width: '74px', height: '17px', display: 'block' } }),
            ])
          })),
          h('div', { className: 'mb-toolbar', key: 'bar' }, [
            h('div', { className: 'mb-chips' }, [1, 2, 3, 4, 5, 6].map(function (n) {
              return h('span', { key: n, className: 'mb-skeleton', style: { width: n === 1 ? '62px' : '74px', height: '30px', borderRadius: '8px' } })
            })),
            h('span', { className: 'mb-skeleton', style: { width: '200px', height: '36px', borderRadius: '10px' } }),
          ]),
          h('div', { className: 'mb-table-card', key: 'table' }, h('div', { className: 'mb-table-scroll' }, TableSkeleton())),
        ]))
      }

      function ErrorPanel(props) {
        var t = props.t
        var onRetry = props.onRetry
        return h('section', { className: 'mb-page', 'data-up': 'red', 'data-density': 'comfortable', 'aria-label': t('page.title') }, h('div', { className: 'mb-shell' }, [
          h('div', { className: 'mb-top' }, h('div', { className: 'mb-brand' }, [
            h('div', { className: 'mb-brand-icon' }, h(IconBoard, { size: 23 })),
            h('div', { className: 'mb-title-wrap' }, [
              h('h1', { className: 'mb-title' }, t('page.title')),
              h('div', { className: 'mb-subtitle' }, t('page.subtitle')),
            ]),
          ])),
          h('div', { className: 'mb-center' }, h('div', { className: 'mb-error-card' }, [
            h('div', { className: 'mb-error-icon' }, h(IconWarning, { size: 22 })),
            h('div', { className: 'mb-error-title' }, t('error.state')),
            h('div', { className: 'mb-error-body' }, t('error.stateBody')),
            h('button', { type: 'button', className: 'mb-error-btn', onClick: onRetry }, t('error.retry')),
          ])),
        ]))
      }

      // ------------------------------------------------------------------
      // Modal
      // ------------------------------------------------------------------
      function Modal(props) {
        var t = props.t
        var panelRef = React.useRef(null)
        var closeRef = React.useRef(props.onClose)
        closeRef.current = props.onClose
        React.useEffect(function () {
          function onKey(event) {
            if (event.key === 'Escape') closeRef.current()
          }
          document.addEventListener('keydown', onKey)
          var node = panelRef.current
          if (node) {
            var focusable = node.querySelector('[data-autofocus]') || node.querySelector('button, input, select')
            if (focusable) {
              try { focusable.focus() } catch (e) {}
            }
          }
          return function () { document.removeEventListener('keydown', onKey) }
        }, [])
        return h('div', {
          className: 'mb-overlay',
          onMouseDown: function (event) {
            if (event.target === event.currentTarget) props.onClose()
          },
        }, h('div', {
          ref: panelRef,
          className: 'mb-modal' + (props.settings ? ' is-settings' : ''),
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': props.label,
          tabIndex: -1,
        }, props.children))
      }

      function DialogHeader(props) {
        return h('div', { className: 'mb-modal-head' }, [
          h('div', { key: 't' }, [
            h('div', { className: 'mb-modal-eyebrow', key: 'e' }, props.eyebrow),
            h('h2', { className: 'mb-modal-title', key: 'h' }, props.title),
            props.subtitle ? h('div', { className: 'mb-modal-sub', key: 's' }, props.subtitle) : null,
          ]),
          h('button', {
            key: 'c',
            type: 'button',
            className: 'mb-modal-close',
            title: props.t('actions.close'),
            'aria-label': props.t('actions.close'),
            onClick: props.onClose,
          }, h(IconClose, { size: 15 })),
        ])
      }

      // ------------------------------------------------------------------
      // Add dialog
      // ------------------------------------------------------------------
      function AddDialog(props) {
        var t = props.t
        var state = props.state
        var onClose = props.onClose
        var onAdd = props.onAdd
        var addingKey = props.addingKey
        var queryState = React.useState('')
        var query = queryState[0]
        var setQuery = queryState[1]
        var groupState = React.useState('all')
        var group = groupState[0]
        var setGroup = groupState[1]
        var resultsState = React.useState([])
        var results = resultsState[0]
        var setResults = resultsState[1]
        var loadingState = React.useState(true)
        var loading = loadingState[0]
        var setLoading = loadingState[1]
        var searchErrorState = React.useState(false)
        var searchError = searchErrorState[0]
        var setSearchError = searchErrorState[1]
        var manualState = React.useState(false)
        var manual = manualState[0]
        var setManual = manualState[1]
        var manualMarketState = React.useState('cn')
        var manualMarket = manualMarketState[0]
        var setManualMarket = manualMarketState[1]
        var codeState = React.useState('')
        var manualCode = codeState[0]
        var setManualCode = codeState[1]
        var nameState = React.useState('')
        var manualName = nameState[0]
        var setManualName = nameState[1]
        var manualBusyState = React.useState(false)
        var manualBusy = manualBusyState[0]
        var setManualBusy = manualBusyState[1]
        var inputRef = React.useRef(null)
        var existing = {}
        for (var i = 0; i < state.watchlist.length; i++) existing[state.watchlist[i].id] = true

        React.useEffect(function () {
          var cancelled = false
          setLoading(true)
          setSearchError(false)
          var timer = setTimeout(function () {
            post('search', { q: query.trim(), group: group }).then(function (data) {
              if (cancelled) return
              setResults(Array.isArray(data.results) ? data.results : [])
              setLoading(false)
            }).catch(function () {
              if (cancelled) return
              setResults([])
              setSearchError(true)
              setLoading(false)
            })
          }, query.trim() ? 260 : 0)
          return function () {
            cancelled = true
            clearTimeout(timer)
          }
        }, [query, group])

        function submitManual() {
          if (manualBusy || manualCode.trim() === '') return
          setManualBusy(true)
          Promise.resolve(onAdd({
            market: manualMarket,
            code: manualCode.trim(),
            name: manualName.trim(),
          }, true)).then(function (ok) {
            if (ok) {
              setManualCode('')
              setManualName('')
              if (inputRef.current) inputRef.current.focus()
            }
            setManualBusy(false)
          }).catch(function () { setManualBusy(false) })
        }

        var resultNodes = []
        if (loading) {
          resultNodes.push(h('div', { className: 'mb-results-state', key: 'loading' }, [
            h('span', { className: 'mb-spinner', key: 's' }),
            h('span', { key: 't' }, t('add.searching')),
          ]))
        } else if (searchError) {
          resultNodes.push(h('div', { className: 'mb-results-state', key: 'err' }, [
            h('div', { className: 'mb-results-state-title', key: 't' }, t('add.noResults')),
            h('div', { className: 'mb-results-state-hint', key: 'h' }, t('add.noResultsHint')),
          ]))
        } else if (results.length === 0) {
          resultNodes.push(h('div', { className: 'mb-results-state', key: 'empty' }, [
            h('div', { className: 'mb-results-state-title', key: 't' }, t('add.noResults')),
            h('div', { className: 'mb-results-state-hint', key: 'h' }, t('add.noResultsHint')),
          ]))
        } else {
          for (var j = 0; j < results.length; j++) {
            var item = results[j]
            var id = item.market + ':' + item.code
            var added = Boolean(existing[id])
            var isAdding = addingKey === id
            resultNodes.push(h('div', { className: 'mb-result', key: id }, [
              h('span', { className: 'mb-badge', key: 'b', title: t(MARKET_TKEY[item.market]) }, BADGE[item.market] || ''),
              h('div', { className: 'mb-result-main', key: 'm' }, [
                h('div', { className: 'mb-result-name', key: 'n' }, item.name),
                h('div', { className: 'mb-result-meta', key: 'c' }, item.code + ' · ' + t(MARKET_TKEY[item.market])),
              ]),
              h('div', { className: 'mb-result-action', key: 'a' }, h('button', {
                type: 'button',
                className: 'mb-mini-add' + (added ? ' is-added' : ''),
                disabled: added || isAdding,
                onClick: function (candidate) {
                  return function () {
                    onAdd(candidate, false)
                  }
                }(item),
              }, isAdding ? h('span', { className: 'mb-spinner', style: { width: '12px', height: '12px', borderWidth: '1.5px' } }) : added ? t('add.added') : t('add.add'))),
            ]))
          }
        }

        return h(Modal, { t: t, onClose: onClose, label: t('add.title') }, [
          h(DialogHeader, {
            key: 'head',
            t: t,
            eyebrow: t('page.title'),
            title: t('add.title'),
            subtitle: t('add.subtitle'),
            onClose: onClose,
          }),
          h('div', { className: 'mb-add-search', key: 'search' }, [
            h(IconSearch, { key: 'i', size: 17 }),
            h('input', {
              key: 'in',
              ref: inputRef,
              type: 'text',
              value: query,
              placeholder: t('add.search'),
              'aria-label': t('add.search'),
              'data-autofocus': true,
              onChange: function (event) { setQuery(event.target.value) },
            }),
            query ? h('button', {
              key: 'c',
              type: 'button',
              className: 'mb-search-clear',
              onClick: function () { setQuery(''); if (inputRef.current) inputRef.current.focus() },
              'aria-label': t('actions.clear'),
            }, h(IconClose, { size: 11 })) : null,
          ]),
          h('div', { className: 'mb-modal-chips', key: 'groups' }, GROUPS.map(function (g) {
            return h('button', {
              key: g.key,
              type: 'button',
              className: 'mb-chip' + (group === g.key ? ' is-active' : ''),
              onClick: function () {
                setGroup(g.key)
                if (g.key !== 'all' && g.key !== 'futures' && MANUAL_MARKETS.indexOf(g.key) >= 0) setManualMarket(g.key)
                if (g.key === 'futures') setManualMarket('futcn')
              },
            }, t(g.tKey))
          })),
          h('div', { className: 'mb-hint-line', key: 'hint' }, t('add.searchHint')),
          h('div', { className: 'mb-results', key: 'results' }, resultNodes),
          h('div', { className: 'mb-manual', key: 'manual' }, [
            h('button', {
              key: 'toggle',
              type: 'button',
              className: 'mb-manual-toggle',
              onClick: function () { setManual(!manual) },
            }, [t(manual ? 'add.manualHide' : 'add.manual'), h(IconChevron, { key: 'i', size: 12, style: { transform: manual ? 'rotate(180deg)' : 'none' } })]),
            manual ? h('div', { key: 'form' }, [
              h('div', { className: 'mb-manual-grid', key: 'grid' }, [
                h('div', { className: 'mb-field', key: 'market' }, [
                  h('label', { key: 'l' }, t('add.market')),
                  h('select', {
                    key: 's',
                    value: manualMarket,
                    onChange: function (event) { setManualMarket(event.target.value) },
                  }, MANUAL_MARKETS.map(function (market) {
                    return h('option', { key: market, value: market }, t(MARKET_TKEY[market]))
                  })),
                ]),
                h('div', { className: 'mb-field', key: 'code' }, [
                  h('label', { key: 'l' }, t('add.code')),
                  h('input', {
                    key: 'i', className: 'mb-input', type: 'text', value: manualCode,
                    placeholder: t('add.codePlaceholder'),
                    onChange: function (event) { setManualCode(event.target.value) },
                    onKeyDown: function (event) { if (event.key === 'Enter') submitManual() },
                  }),
                ]),
                h('div', { className: 'mb-field', key: 'name' }, [
                  h('label', { key: 'l' }, t('add.name')),
                  h('input', {
                    key: 'i', className: 'mb-input', type: 'text', value: manualName,
                    placeholder: t('add.namePlaceholder'),
                    onChange: function (event) { setManualName(event.target.value) },
                    onKeyDown: function (event) { if (event.key === 'Enter') submitManual() },
                  }),
                ]),
                h('button', {
                  key: 'submit',
                  type: 'button',
                  className: 'mb-manual-submit',
                  disabled: manualBusy || manualCode.trim() === '',
                  onClick: submitManual,
                }, manualBusy ? h('span', { className: 'mb-spinner', style: { width: '13px', height: '13px', borderWidth: '1.5px' } }) : t('add.submit')),
              ]),
              h('div', { className: 'mb-manual-hint', key: 'hint' }, t('add.manualHint')),
            ]) : null,
          ]),
          h('div', { className: 'mb-modal-foot', key: 'foot' }, t('add.sourceNote')),
        ])
      }

      // ------------------------------------------------------------------
      // Settings dialog
      // ------------------------------------------------------------------
      function SettingsDialog(props) {
        var t = props.t
        var settings = props.settings
        var onPatch = props.onPatch
        var onReset = props.onReset
        var onClose = props.onClose
        var confirmState = React.useState(false)
        var confirm = confirmState[0]
        var setConfirm = confirmState[1]
        var timerRef = React.useRef(null)

        React.useEffect(function () {
          return function () { if (timerRef.current) clearTimeout(timerRef.current) }
        }, [])

        function armReset() {
          if (!confirm) {
            setConfirm(true)
            if (timerRef.current) clearTimeout(timerRef.current)
            timerRef.current = setTimeout(function () { setConfirm(false) }, 4000)
            return
          }
          setConfirm(false)
          if (timerRef.current) clearTimeout(timerRef.current)
          onReset()
        }

        return h(Modal, { t: t, onClose: onClose, label: t('settings.title'), settings: true }, [
          h(DialogHeader, {
            key: 'head', t: t, eyebrow: t('page.title'),
            title: t('settings.title'), subtitle: t('settings.subtitle'), onClose: onClose,
          }),
          h('div', { className: 'mb-settings-body', key: 'body' }, [
            h('div', { className: 'mb-setting', key: 'refresh' }, [
              h('div', { className: 'mb-setting-label', key: 'l' }, t('settings.refresh')),
              h('div', { className: 'mb-setting-hint', key: 'h' }, t('settings.refreshHint')),
              h('div', { className: 'mb-seg', key: 's' }, REFRESH_OPTIONS.map(function (ms) {
                return h('button', {
                  key: ms,
                  type: 'button',
                  className: 'mb-seg-btn' + (settings.refreshMs === ms ? ' is-active' : ''),
                  onClick: function () { onPatch({ refreshMs: ms }) },
                }, t('unit.seconds', { n: Math.round(ms / 1000) }))
              })),
            ]),
            h('div', { className: 'mb-setting', key: 'colors' }, [
              h('div', { className: 'mb-setting-label', key: 'l' }, t('settings.colors')),
              h('div', { className: 'mb-setting-hint', key: 'h' }, t('settings.colorsHint')),
              h('div', { className: 'mb-color-options', key: 'o' }, [
                h('button', {
                  key: 'red',
                  type: 'button',
                  className: 'mb-color-option is-red' + (settings.upColor === 'red' ? ' is-active' : ''),
                  onClick: function () { onPatch({ upColor: 'red' }) },
                }, [
                  h('div', { className: 'mb-color-preview', key: 'p' }, [
                    h('span', { className: 'mb-preview-up', key: 'u' }, '+1.24%'),
                    h('span', { className: 'mb-preview-down', key: 'd' }, '−0.86%'),
                  ]),
                  h('div', { className: 'mb-color-name', key: 'n' }, t('settings.color.red')),
                ]),
                h('button', {
                  key: 'green',
                  type: 'button',
                  className: 'mb-color-option is-green' + (settings.upColor === 'green' ? ' is-active' : ''),
                  onClick: function () { onPatch({ upColor: 'green' }) },
                }, [
                  h('div', { className: 'mb-color-preview', key: 'p' }, [
                    h('span', { className: 'mb-preview-up', key: 'u' }, '+1.24%'),
                    h('span', { className: 'mb-preview-down', key: 'd' }, '−0.86%'),
                  ]),
                  h('div', { className: 'mb-color-name', key: 'n' }, t('settings.color.green')),
                ]),
              ]),
            ]),
            h('div', { className: 'mb-setting', key: 'density' }, [
              h('div', { className: 'mb-setting-label', key: 'l' }, t('settings.density')),
              h('div', { className: 'mb-setting-hint', key: 'h' }, t('settings.densityHint')),
              h('div', { className: 'mb-seg', key: 's' }, [
                h('button', {
                  key: 'comfortable', type: 'button',
                  className: 'mb-seg-btn' + (settings.density === 'comfortable' ? ' is-active' : ''),
                  onClick: function () { onPatch({ density: 'comfortable' }) },
                }, t('settings.density.comfortable')),
                h('button', {
                  key: 'compact', type: 'button',
                  className: 'mb-seg-btn' + (settings.density === 'compact' ? ' is-active' : ''),
                  onClick: function () { onPatch({ density: 'compact' }) },
                }, t('settings.density.compact')),
              ]),
            ]),
            h('div', { className: 'mb-setting', key: 'data' }, [
              h('div', { className: 'mb-setting-danger', key: 'danger' }, [
                h('div', { key: 'txt' }, [
                  h('div', { className: 'mb-setting-label', key: 'l' }, t('settings.data')),
                  h('div', { className: 'mb-setting-hint', key: 'h' }, t('settings.dataHint')),
                ]),
                h('button', {
                  key: 'b', type: 'button',
                  className: 'mb-danger-btn' + (confirm ? ' is-armed' : ''),
                  onClick: armReset,
                }, confirm ? t('settings.resetConfirm') : t('settings.reset')),
              ]),
            ]),
          ]),
          h('div', { className: 'mb-settings-foot', key: 'foot' }, [
            h('span', { key: 'f' }, t('settings.footer')),
            h('span', { key: 'v', style: { opacity: 0.7, whiteSpace: 'nowrap' } }, t('settings.version')),
          ]),
        ])
      }

      // ------------------------------------------------------------------
      // Panel
      // ------------------------------------------------------------------
      function createPanel(ctx, t) {
        function Panel() {
          var stateHook = React.useState(null)
          var state = stateHook[0]
          var setState = stateHook[1]
          var loadedHook = React.useState(false)
          var loaded = loadedHook[0]
          var setLoaded = loadedHook[1]
          var stateErrorHook = React.useState(false)
          var stateError = stateErrorHook[0]
          var setStateError = stateErrorHook[1]
          var loadKeyHook = React.useState(0)
          var loadKey = loadKeyHook[0]
          var setLoadKey = loadKeyHook[1]
          var quotesHook = React.useState({})
          var quotes = quotesHook[0]
          var setQuotes = quotesHook[1]
          var metaHook = React.useState({ fetchedAt: 0, sources: {}, errors: 0 })
          var meta = metaHook[0]
          var setMeta = metaHook[1]
          var quoteErrorHook = React.useState(false)
          var quoteError = quoteErrorHook[0]
          var setQuoteError = quoteErrorHook[1]
          var initialQuotesLoadingHook = React.useState(true)
          var initialQuotesLoading = initialQuotesLoadingHook[0]
          var setInitialQuotesLoading = initialQuotesLoadingHook[1]
          var refreshingHook = React.useState(false)
          var refreshing = refreshingHook[0]
          var setRefreshing = refreshingHook[1]
          var categoryHook = React.useState('all')
          var category = categoryHook[0]
          var setCategory = categoryHook[1]
          var queryHook = React.useState('')
          var query = queryHook[0]
          var setQuery = queryHook[1]
          var sortHook = React.useState('default')
          var sort = sortHook[0]
          var setSort = sortHook[1]
          var pausedHook = React.useState(false)
          var paused = pausedHook[0]
          var setPaused = pausedHook[1]
          var addOpenHook = React.useState(false)
          var addOpen = addOpenHook[0]
          var setAddOpen = addOpenHook[1]
          var settingsOpenHook = React.useState(false)
          var settingsOpen = settingsOpenHook[0]
          var setSettingsOpen = settingsOpenHook[1]
          var toastHook = React.useState(null)
          var toast = toastHook[0]
          var setToast = toastHook[1]
          var addingKeyHook = React.useState('')
          var addingKey = addingKeyHook[0]
          var setAddingKey = addingKeyHook[1]
          var busyIdHook = React.useState('')
          var busyId = busyIdHook[0]
          var setBusyId = busyIdHook[1]
          var mountedRef = React.useRef(true)
          var inFlightRef = React.useRef(false)
          var toastTimerRef = React.useRef(null)

          React.useEffect(function () {
            mountedRef.current = true
            return function () {
              mountedRef.current = false
              if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
            }
          }, [])

          React.useEffect(function () {
            var cancelled = false
            setStateError(false)
            post('state', { op: 'get' }).then(function (data) {
              if (cancelled || !mountedRef.current) return
              setState(data.state)
              setLoaded(true)
            }).catch(function () {
              if (cancelled || !mountedRef.current) return
              setStateError(true)
              setLoaded(true)
            })
            return function () { cancelled = true }
          }, [loadKey])

          function showToast(message, kind) {
            if (!mountedRef.current) return
            setToast({ message: message, kind: kind || 'ok', id: Date.now() })
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
            toastTimerRef.current = setTimeout(function () {
              if (mountedRef.current) setToast(null)
            }, 2600)
          }

          var refreshQuotes = React.useCallback(function (opts) {
            if (inFlightRef.current) return Promise.resolve(false)
            inFlightRef.current = true
            var silent = Boolean(opts && opts.silent)
            if (!silent) setRefreshing(true)
            return post('quotes', {}).then(function (data) {
              if (!mountedRef.current) return false
              var map = {}
              var list = Array.isArray(data.quotes) ? data.quotes : []
              for (var i = 0; i < list.length; i++) map[list[i].id] = list[i]
              setQuotes(map)
              setMeta({
                fetchedAt: data.fetchedAt || Date.now(),
                sources: data.sources || {},
                errors: data.errors || 0,
              })
              setQuoteError(false)
              setInitialQuotesLoading(false)
              return true
            }).catch(function () {
              if (mountedRef.current) {
                setQuoteError(true)
                setInitialQuotesLoading(false)
                setRefreshing(false)
              }
              return false
            }).then(function (ok) {
              inFlightRef.current = false
              if (mountedRef.current && !silent) setRefreshing(false)
              return ok
            })
          }, [])

          var refreshSoon = React.useCallback(function () {
            var tries = 0
            function attempt() {
              if (!mountedRef.current) return
              if (inFlightRef.current && tries < 14) {
                tries += 1
                setTimeout(attempt, 250)
                return
              }
              refreshQuotes({ silent: true })
            }
            setTimeout(attempt, 80)
          }, [refreshQuotes])

          React.useEffect(function () {
            if (loaded && state && !stateError) refreshQuotes()
          }, [loaded, loadKey, stateError, refreshQuotes])

          React.useEffect(function () {
            if (!loaded || !state || paused) return
            var stopped = false
            var timer = null
            function schedule() {
              timer = setTimeout(function () {
                if (stopped) return
                var work = (typeof document !== 'undefined' && document.hidden)
                  ? Promise.resolve(true)
                  : refreshQuotes({ silent: true })
                Promise.resolve(work).then(function () {
                  if (!stopped) schedule()
                })
              }, state.settings.refreshMs)
            }
            schedule()
            return function () {
              stopped = true
              if (timer) clearTimeout(timer)
            }
          }, [loaded, paused, state && state.settings.refreshMs, refreshQuotes])

          React.useEffect(function () {
            function onVisibility() {
              if (typeof document !== 'undefined' && !document.hidden && loaded && state && !paused) {
                refreshQuotes({ silent: true })
              }
            }
            document.addEventListener('visibilitychange', onVisibility)
            return function () { document.removeEventListener('visibilitychange', onVisibility) }
          }, [loaded, state, paused, refreshQuotes])

          function retryLoad() {
            setState(null)
            setStateError(false)
            setLoaded(false)
            setInitialQuotesLoading(true)
            setLoadKey(function (n) { return n + 1 })
          }

          function addInstrument(candidate, manual) {
            var key = candidate.market + ':' + candidate.code
            setAddingKey(key)
            return post('state', { op: 'add', item: candidate }).then(function (data) {
              if (!mountedRef.current) return false
              setState(data.state)
              showToast(data.already
                ? t('toast.already', { name: (data.item && data.item.name) || candidate.name || candidate.code })
                : t('toast.added', { name: (data.item && data.item.name) || candidate.name || candidate.code }))
              if (!data.already) refreshSoon()
              return true
            }).catch(function () {
              if (mountedRef.current) showToast(t('error.add'), 'error')
              return false
            }).then(function (ok) {
              if (mountedRef.current) setAddingKey('')
              return ok
            })
          }

          function removeInstrument(item) {
            if (busyId) return
            setBusyId(item.id)
            post('state', { op: 'remove', id: item.id }).then(function (data) {
              if (!mountedRef.current) return
              setState(data.state)
              setQuotes(function (prev) {
                var next = Object.assign({}, prev)
                delete next[item.id]
                return next
              })
              showToast(t('toast.removed', { name: item.name }))
            }).catch(function () {
              if (mountedRef.current) showToast(t('error.remove'), 'error')
            }).then(function () {
              if (mountedRef.current) setBusyId('')
            })
          }

          function toggleFavorite(item) {
            if (busyId) return
            setBusyId(item.id)
            var before = state
            setState(function (prev) {
              if (!prev) return prev
              return {
                version: prev.version,
                settings: prev.settings,
                watchlist: prev.watchlist.map(function (entry) {
                  return entry.id === item.id ? Object.assign({}, entry, { favorite: !entry.favorite }) : entry
                }),
              }
            })
            post('state', { op: 'favorite', id: item.id }).then(function (data) {
              if (!mountedRef.current) return
              setState(data.state)
            }).catch(function () {
              if (!mountedRef.current) return
              setState(before)
              showToast(t('error.settings'), 'error')
            }).then(function () {
              if (mountedRef.current) setBusyId('')
            })
          }

          function patchSettings(patch) {
            setState(function (prev) {
              if (!prev) return prev
              return {
                version: prev.version,
                watchlist: prev.watchlist,
                settings: Object.assign({}, prev.settings, patch),
              }
            })
            post('state', { op: 'saveSettings', settings: patch }).then(function (data) {
              if (!mountedRef.current) return
              setState(data.state)
            }).catch(function () {
              if (mountedRef.current) showToast(t('error.settings'), 'error')
            })
          }

          function resetWatchlist() {
            post('state', { op: 'resetWatchlist' }).then(function (data) {
              if (!mountedRef.current) return
              setState(data.state)
              setQuotes({})
              setCategory('all')
              setQuery('')
              showToast(t('toast.reset'))
              refreshSoon()
            }).catch(function () {
              if (mountedRef.current) showToast(t('error.settings'), 'error')
            })
          }

          function togglePause() {
            setPaused(function (p) { return !p })
          }

          if (!loaded) return h(LoadingPanel, { t: t })
          if (stateError || !state) return h(ErrorPanel, { t: t, onRetry: retryLoad })

          var watchlist = state.watchlist || []
          var settings = Object.assign({}, DEFAULT_SETTINGS, state.settings || {})
          var counts = { cn: 0, hk: 0, us: 0, fx: 0, futures: 0, index: 0 }
          for (var ci = 0; ci < watchlist.length; ci++) {
            var groupKey = GROUP_OF[watchlist[ci].market]
            if (groupKey) counts[groupKey] = (counts[groupKey] || 0) + 1
          }

          var needle = query.trim().toLowerCase()
          var filtered = []
          for (var fi = 0; fi < watchlist.length; fi++) {
            var item = watchlist[fi]
            if (category !== 'all' && GROUP_OF[item.market] !== category) continue
            if (needle) {
              var haystack = (item.name + ' ' + item.code + ' ' + item.market).toLowerCase()
              if (haystack.indexOf(needle) < 0) continue
            }
            filtered.push(item)
          }

          filtered = filtered.slice().sort(function (a, b) {
            if (sort === 'default') {
              if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
              return (a.addedAt || 0) - (b.addedAt || 0)
            }
            if (sort === 'name') return String(a.name).localeCompare(String(b.name), 'zh-Hans-CN')
            var qa = quotes[a.id]
            var qb = quotes[b.id]
            var pa = qa && qa.changePct !== null && qa.changePct !== undefined && isFinite(qa.changePct) ? qa.changePct : null
            var pb = qb && qb.changePct !== null && qb.changePct !== undefined && isFinite(qb.changePct) ? qb.changePct : null
            if (pa === null && pb === null) return 0
            if (pa === null) return 1
            if (pb === null) return -1
            return sort === 'pctAsc' ? pa - pb : pb - pa
          })

          var rows = []
          for (var ri = 0; ri < filtered.length; ri++) {
            rows.push(h(QuoteRow, {
              key: filtered[ri].id,
              item: filtered[ri],
              quote: quotes[filtered[ri].id],
              t: t,
              onRemove: removeInstrument,
              onFavorite: toggleFavorite,
              busy: busyId === filtered[ri].id,
            }))
          }

          var updatedClock = meta.fetchedAt ? formatClock(meta.fetchedAt) : ''
          var refreshSeconds = Math.round(settings.refreshMs / 1000)
          var showQuoteBanner = quoteError

          var tableChildren = []
          if (showQuoteBanner) {
            tableChildren.push(h('div', { className: 'mb-banner', key: 'banner' }, [
              h(IconWarning, { key: 'i', size: 14 }),
              h('span', { key: 't' }, t('error.quotes')),
              h('button', { key: 'b', type: 'button', onClick: function () { refreshQuotes() } }, t('actions.retry')),
            ]))
          }
          tableChildren.push(h('div', { className: 'mb-table-scroll', key: 'scroll' }, [
            h('div', { className: 'mb-head', role: 'row', key: 'head' }, [
              h('div', { key: 'n', role: 'columnheader' }, t('table.instrument')),
              h('div', { key: 'p', className: 'mb-head-num', role: 'columnheader' }, t('table.price')),
              h('div', { key: 'c', className: 'mb-head-num', role: 'columnheader' }, t('table.change')),
              h('div', { key: 'r', className: 'mb-col-range', role: 'columnheader' }, t('table.range')),
              h('div', { key: 'o', className: 'mb-head-num mb-col-open', role: 'columnheader' }, t('table.open')),
              h('div', { key: 'v', className: 'mb-head-num mb-col-prev', role: 'columnheader' }, t('table.prev')),
              h('div', { key: 'sp', className: 'mb-col-spacer', role: 'presentation' }),
              h('div', { key: 'a', role: 'columnheader', 'aria-label': '' }),
            ]),
            filtered.length > 0
              ? rows
              : h(EmptyState, {
                key: 'empty',
                t: t,
                searching: Boolean(needle) || category !== 'all',
                onClear: function () { setQuery(''); setCategory('all') },
                onAdd: function () { setAddOpen(true) },
              }),
          ]))
          tableChildren.push(h('div', { className: 'mb-table-foot', key: 'foot' }, [
            h('div', { className: 'mb-foot-left', key: 'l' }, [
              h('span', { key: 'count' }, t('footer.count', { n: filtered.length })),
              h('span', { className: 'mb-foot-sep', key: 'sep' }, '·'),
              h('span', { className: 'mb-foot-sources', key: 'src' }, t('footer.sources')),
            ]),
            h('div', { className: 'mb-foot-right', key: 'r' }, [
              updatedClock ? h('span', { key: 'u' }, t('footer.updated', { time: updatedClock })) : null,
              h('span', { className: 'mb-foot-sep', key: 'sep' }, '·'),
              h('span', { key: 'd' }, t('footer.disclaimer')),
            ]),
          ]))

          var toastNode = toast ? h('div', {
            key: toast.id,
            className: 'mb-toast' + (toast.kind === 'error' ? ' is-error' : ''),
            role: 'status',
            'aria-live': 'polite',
          }, [
            h('span', { className: 'mb-toast-dot', key: 'd' }),
            h('span', { key: 't' }, toast.message),
          ]) : null

          return h('section', {
            className: 'mb-page',
            'data-up': settings.upColor,
            'data-density': settings.density,
            'aria-label': t('page.title'),
          }, [
            h('div', { className: 'mb-shell', key: 'shell' }, [
              h('div', { className: 'mb-top', key: 'top' }, [
                h(Brand, { t: t, key: 'brand' }),
                h('div', { className: 'mb-actions', key: 'actions' }, [
                  h(LivePill, {
                    key: 'live',
                    t: t,
                    loading: initialQuotesLoading && !meta.fetchedAt,
                    paused: paused,
                    error: quoteError,
                    updatedAt: meta.fetchedAt,
                    refreshMs: settings.refreshMs,
                  }),
                  h('button', {
                    key: 'refresh',
                    type: 'button',
                    className: 'mb-iconbtn' + (refreshing ? ' is-spinning' : ''),
                    title: t('actions.refresh'),
                    'aria-label': t('actions.refresh'),
                    disabled: refreshing,
                    onClick: function () { refreshQuotes() },
                  }, h(IconRefresh, { size: 16 })),
                  h('button', {
                    key: 'settings',
                    type: 'button',
                    className: 'mb-iconbtn',
                    title: t('actions.settings'),
                    'aria-label': t('actions.settings'),
                    onClick: function () { setSettingsOpen(true) },
                  }, h(IconSettings, { size: 16 })),
                  h('button', {
                    key: 'add',
                    type: 'button',
                    className: 'mb-btn-primary',
                    title: t('actions.add'),
                    'aria-label': t('actions.add'),
                    onClick: function () { setAddOpen(true) },
                  }, [h(IconPlus, { key: 'i', size: 15 }), h('span', { key: 'l', className: 'mb-add-label' }, t('actions.add'))]),
                ]),
              ]),
              h(StatsStrip, {
                key: 'stats',
                t: t,
                items: filtered,
                quotes: quotes,
                meta: meta,
                paused: paused,
                quoteError: quoteError,
              }),
              h(Toolbar, {
                key: 'toolbar',
                t: t,
                category: category,
                setCategory: setCategory,
                counts: counts,
                total: watchlist.length,
                query: query,
                setQuery: setQuery,
                sort: sort,
                setSort: setSort,
                paused: paused,
                onTogglePause: togglePause,
              }),
              h('div', { className: 'mb-table-card', key: 'table' }, tableChildren),
            ]),
            addOpen ? h(AddDialog, {
              key: 'add-dialog',
              t: t,
              state: state,
              onClose: function () { setAddOpen(false) },
              onAdd: addInstrument,
              addingKey: addingKey,
            }) : null,
            settingsOpen ? h(SettingsDialog, {
              key: 'settings-dialog',
              t: t,
              settings: settings,
              onClose: function () { setSettingsOpen(false) },
              onPatch: patchSettings,
              onReset: resetWatchlist,
            }) : null,
            toastNode,
          ])
        }

        Panel.displayName = 'MarketboardPanel'
        return Panel
      }

      // ------------------------------------------------------------------
      // Apply
      // ------------------------------------------------------------------
      function apply(ctx) {
        ctx.effect(function () {
          return ctx.locale.register(NS, { zh: ZH, en: EN })
        }, 'dsh-marketboard: dictionaries')
        ctx.effect(function () {
          return injectStyles()
        }, 'dsh-marketboard: styles')

        var t = ctx.locale.bind(NS)
        var Panel = createPanel(ctx, t)

        ctx.slots.inject('main', function () {
          return ctx.slots.register({ name: 'main', key: MODULE_ID, locale: NS }, function (props) {
            return h(Panel, props)
          })
        })

        ctx.slots.inject('sidebar.panellist', function () {
          return ctx.slots.register({
            name: 'sidebar.panellist',
            id: MODULE_ID,
            order: 31,
            label: function () { return t('nav.title') },
            locale: NS,
          }, function (props) {
            return h(IconBoard, { size: props && typeof props.size === 'number' ? props.size : undefined })
          })
        })
      }

      module.exports = { name: MODULE_ID, inject: ['slots', 'locale'], apply: apply }
      return module.exports
    },
  })
})()
