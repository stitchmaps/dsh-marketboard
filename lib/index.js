/**
 * dsh-marketboard — host half.
 *
 * A focused, read-only market board for stocks (CN / HK / US), FX (majors and
 * crosses), commodity futures (domestic and international) and indices.
 *
 * The host owns the watchlist and settings, normalizes every write, fetches
 * quotes from public endpoints (Sina / Tencent / Yahoo fallback) and exposes
 * three POST routes to the browser half:
 *
 *   /api/dsh-marketboard/state    { op: get | add | remove | favorite |
 *                                          saveSettings | resetWatchlist |
 *                                          addGroup | renameGroup |
 *                                          deleteGroup | setGroupItems }
 *   /api/dsh-marketboard/quotes   {}
 *   /api/dsh-marketboard/search   { q, group }
 *
 * No API key is required. The plugin is read-only and never places orders.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { randomUUID } from 'node:crypto'

export const name = 'dsh-marketboard'

const STATE_VERSION = 2
const MAX_ITEMS = 200
const MAX_NAME = 48
const MAX_GROUPS = 30
const MAX_GROUP_NAME = 24
const MAX_GROUP_ITEMS = 200
const BACKUP_KEEP = 20
const QUOTE_CACHE_MS = 15 * 60 * 1000
const MAX_YAHOO_FALLBACK = 12

const MARKETS = new Set(['cn', 'hk', 'us', 'fx', 'futcn', 'futgl', 'index'])

const RESERVED_GROUP_NAMES = new Set([
  '全部', 'a股', '港股', '美股', '外汇', '商品期货', '指数',
  'all', 'a-shares', 'a shares', 'hong kong', 'us', 'fx', 'futures', 'indices',
])

const DEFAULT_SETTINGS = {
  refreshMs: 5000,
  upColor: 'red', // China convention by default: red = up, green = down
  density: 'comfortable',
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

/**
 * Searchable instrument catalog. The watchlist only stores market + code, so
 * this table can evolve without migrating saved data.
 *
 * @type {{ market: string, code: string, name: string, aliases?: string }[]}
 */
const CATALOG = [
  // A-shares
  { market: 'cn', code: '600519', name: '贵州茅台', aliases: 'maotai kweichow moutai' },
  { market: 'cn', code: '300750', name: '宁德时代', aliases: 'catl' },
  { market: 'cn', code: '002594', name: '比亚迪', aliases: 'byd' },
  { market: 'cn', code: '601318', name: '中国平安', aliases: 'ping an pingan' },
  { market: 'cn', code: '600036', name: '招商银行', aliases: 'cmb' },
  { market: 'cn', code: '688981', name: '中芯国际', aliases: 'smic' },
  { market: 'cn', code: '000858', name: '五粮液', aliases: 'wuliangye' },
  { market: 'cn', code: '300059', name: '东方财富', aliases: 'eastmoney' },
  { market: 'cn', code: '601899', name: '紫金矿业', aliases: 'zijin' },
  { market: 'cn', code: '600900', name: '长江电力' },
  { market: 'cn', code: '600030', name: '中信证券', aliases: 'citic' },
  { market: 'cn', code: '601012', name: '隆基绿能', aliases: 'longi' },
  { market: 'cn', code: '000333', name: '美的集团', aliases: 'midea' },
  { market: 'cn', code: '002415', name: '海康威视', aliases: 'hikvision' },
  { market: 'cn', code: '600276', name: '恒瑞医药' },
  { market: 'cn', code: '601166', name: '兴业银行' },
  { market: 'cn', code: '600887', name: '伊利股份' },
  { market: 'cn', code: '000651', name: '格力电器', aliases: 'gree' },
  { market: 'cn', code: '600309', name: '万华化学' },
  { market: 'cn', code: '000001', name: '平安银行' },
  { market: 'cn', code: '002475', name: '立讯精密' },
  { market: 'cn', code: '601398', name: '工商银行', aliases: 'icbc' },
  { market: 'cn', code: '601288', name: '农业银行', aliases: 'abc' },
  { market: 'cn', code: '601988', name: '中国银行', aliases: 'boc' },
  { market: 'cn', code: '600028', name: '中国石化', aliases: 'sinopec' },
  { market: 'cn', code: '601857', name: '中国石油', aliases: 'petrochina' },
  { market: 'cn', code: '600050', name: '中国联通' },
  { market: 'cn', code: '300124', name: '汇川技术' },
  { market: 'cn', code: '002230', name: '科大讯飞', aliases: 'iflytek' },
  { market: 'cn', code: '688111', name: '金山办公', aliases: 'wps' },
  { market: 'cn', code: '300760', name: '迈瑞医疗', aliases: 'mindray' },
  { market: 'cn', code: '601888', name: '中国中免' },
  { market: 'cn', code: '000725', name: '京东方A', aliases: 'boe' },
  { market: 'cn', code: '600438', name: '通威股份' },

  // Hong Kong
  { market: 'hk', code: '00700', name: '腾讯控股', aliases: 'tencent' },
  { market: 'hk', code: '09988', name: '阿里巴巴-W', aliases: 'alibaba' },
  { market: 'hk', code: '03690', name: '美团-W', aliases: 'meituan' },
  { market: 'hk', code: '01810', name: '小米集团-W', aliases: 'xiaomi' },
  { market: 'hk', code: '00941', name: '中国移动', aliases: 'china mobile' },
  { market: 'hk', code: '01299', name: '友邦保险', aliases: 'aia' },
  { market: 'hk', code: '00005', name: '汇丰控股', aliases: 'hsbc' },
  { market: 'hk', code: '00388', name: '香港交易所', aliases: 'hkex' },
  { market: 'hk', code: '02318', name: '中国平安' },
  { market: 'hk', code: '09618', name: '京东集团-SW', aliases: 'jd' },
  { market: 'hk', code: '09888', name: '百度集团-SW', aliases: 'baidu' },
  { market: 'hk', code: '02020', name: '安踏体育', aliases: 'anta' },
  { market: 'hk', code: '01024', name: '快手-W', aliases: 'kuaishou' },
  { market: 'hk', code: '09999', name: '网易-S', aliases: 'netease' },
  { market: 'hk', code: '01211', name: '比亚迪股份', aliases: 'byd' },
  { market: 'hk', code: '00981', name: '中芯国际', aliases: 'smic' },

  // US
  { market: 'us', code: 'AAPL', name: '苹果', aliases: 'apple' },
  { market: 'us', code: 'MSFT', name: '微软', aliases: 'microsoft' },
  { market: 'us', code: 'NVDA', name: '英伟达', aliases: 'nvidia' },
  { market: 'us', code: 'GOOGL', name: '谷歌', aliases: 'alphabet google' },
  { market: 'us', code: 'AMZN', name: '亚马逊', aliases: 'amazon' },
  { market: 'us', code: 'META', name: 'Meta', aliases: 'facebook meta' },
  { market: 'us', code: 'TSLA', name: '特斯拉', aliases: 'tesla' },
  { market: 'us', code: 'AVGO', name: '博通', aliases: 'broadcom' },
  { market: 'us', code: 'AMD', name: '超威半导体', aliases: 'amd' },
  { market: 'us', code: 'NFLX', name: '奈飞', aliases: 'netflix' },
  { market: 'us', code: 'JPM', name: '摩根大通', aliases: 'jpmorgan' },
  { market: 'us', code: 'V', name: 'Visa', aliases: 'visa' },
  { market: 'us', code: 'COST', name: '好市多', aliases: 'costco' },
  { market: 'us', code: 'DIS', name: '迪士尼', aliases: 'disney' },
  { market: 'us', code: 'BABA', name: '阿里巴巴', aliases: 'alibaba' },
  { market: 'us', code: 'PDD', name: '拼多多', aliases: 'pinduoduo' },
  { market: 'us', code: 'NIO', name: '蔚来', aliases: 'nio' },
  { market: 'us', code: 'XPEV', name: '小鹏汽车', aliases: 'xpeng' },
  { market: 'us', code: 'TSM', name: '台积电', aliases: 'tsmc' },
  { market: 'us', code: 'QCOM', name: '高通', aliases: 'qualcomm' },
  { market: 'us', code: 'INTC', name: '英特尔', aliases: 'intel' },
  { market: 'us', code: 'MU', name: '美光科技', aliases: 'micron' },
  { market: 'us', code: 'PLTR', name: 'Palantir' },
  { market: 'us', code: 'COIN', name: 'Coinbase' },
  { market: 'us', code: 'UBER', name: '优步', aliases: 'uber' },
  { market: 'us', code: 'CRM', name: 'Salesforce' },
  { market: 'us', code: 'ORCL', name: '甲骨文', aliases: 'oracle' },
  { market: 'us', code: 'ADBE', name: 'Adobe' },

  // FX majors and crosses
  { market: 'fx', code: 'USDCNH', name: '美元/离岸人民币', aliases: 'usd cnh offshore yuan' },
  { market: 'fx', code: 'USDCNY', name: '美元/人民币', aliases: 'usd cny onshore yuan' },
  { market: 'fx', code: 'EURUSD', name: '欧元/美元', aliases: 'eur usd euro' },
  { market: 'fx', code: 'GBPUSD', name: '英镑/美元', aliases: 'gbp usd pound sterling' },
  { market: 'fx', code: 'USDJPY', name: '美元/日元', aliases: 'usd jpy yen' },
  { market: 'fx', code: 'USDCHF', name: '美元/瑞郎', aliases: 'usd chf franc' },
  { market: 'fx', code: 'USDCAD', name: '美元/加元', aliases: 'usd cad loonie' },
  { market: 'fx', code: 'AUDUSD', name: '澳元/美元', aliases: 'aud usd aussie' },
  { market: 'fx', code: 'NZDUSD', name: '纽元/美元', aliases: 'nzd usd kiwi' },
  { market: 'fx', code: 'USDHKD', name: '美元/港元', aliases: 'usd hkd' },
  { market: 'fx', code: 'USDSGD', name: '美元/新加坡元', aliases: 'usd sgd' },
  { market: 'fx', code: 'USDTHB', name: '美元/泰铢', aliases: 'usd thb' },
  { market: 'fx', code: 'USDKRW', name: '美元/韩元', aliases: 'usd krw' },
  { market: 'fx', code: 'EURJPY', name: '欧元/日元', aliases: 'eur jpy' },
  { market: 'fx', code: 'GBPJPY', name: '英镑/日元', aliases: 'gbp jpy' },
  { market: 'fx', code: 'EURGBP', name: '欧元/英镑', aliases: 'eur gbp' },
  { market: 'fx', code: 'EURCHF', name: '欧元/瑞郎', aliases: 'eur chf' },
  { market: 'fx', code: 'EURAUD', name: '欧元/澳元', aliases: 'eur aud' },
  { market: 'fx', code: 'EURCAD', name: '欧元/加元', aliases: 'eur cad' },
  { market: 'fx', code: 'EURNZD', name: '欧元/纽元', aliases: 'eur nzd' },
  { market: 'fx', code: 'GBPCHF', name: '英镑/瑞郎', aliases: 'gbp chf' },
  { market: 'fx', code: 'GBPAUD', name: '英镑/澳元', aliases: 'gbp aud' },
  { market: 'fx', code: 'GBPCAD', name: '英镑/加元', aliases: 'gbp cad' },
  { market: 'fx', code: 'GBPNZD', name: '英镑/纽元', aliases: 'gbp nzd' },
  { market: 'fx', code: 'AUDJPY', name: '澳元/日元', aliases: 'aud jpy' },
  { market: 'fx', code: 'CADJPY', name: '加元/日元', aliases: 'cad jpy' },
  { market: 'fx', code: 'CHFJPY', name: '瑞郎/日元', aliases: 'chf jpy' },
  { market: 'fx', code: 'NZDJPY', name: '纽元/日元', aliases: 'nzd jpy' },
  { market: 'fx', code: 'AUDNZD', name: '澳元/纽元', aliases: 'aud nzd' },
  { market: 'fx', code: 'AUDCAD', name: '澳元/加元', aliases: 'aud cad' },
  { market: 'fx', code: 'AUDCHF', name: '澳元/瑞郎', aliases: 'aud chf' },
  { market: 'fx', code: 'CADCHF', name: '加元/瑞郎', aliases: 'cad chf' },
  { market: 'fx', code: 'NZDCAD', name: '纽元/加元', aliases: 'nzd cad' },
  { market: 'fx', code: 'NZDCHF', name: '纽元/瑞郎', aliases: 'nzd chf' },

  // Domestic commodity futures (main continuous contracts)
  { market: 'futcn', code: 'RB0', name: '螺纹钢', aliases: 'rebar steel' },
  { market: 'futcn', code: 'HC0', name: '热卷', aliases: 'hot rolled coil' },
  { market: 'futcn', code: 'CU0', name: '铜', aliases: 'copper' },
  { market: 'futcn', code: 'AL0', name: '铝', aliases: 'aluminium aluminum' },
  { market: 'futcn', code: 'ZN0', name: '锌', aliases: 'zinc' },
  { market: 'futcn', code: 'NI0', name: '镍', aliases: 'nickel' },
  { market: 'futcn', code: 'AU0', name: '黄金', aliases: 'gold' },
  { market: 'futcn', code: 'AG0', name: '白银', aliases: 'silver' },
  { market: 'futcn', code: 'SC0', name: '原油', aliases: 'crude oil' },
  { market: 'futcn', code: 'BU0', name: '沥青', aliases: 'bitumen' },
  { market: 'futcn', code: 'RU0', name: '橡胶', aliases: 'rubber' },
  { market: 'futcn', code: 'M0', name: '豆粕', aliases: 'soybean meal' },
  { market: 'futcn', code: 'Y0', name: '豆油', aliases: 'soybean oil' },
  { market: 'futcn', code: 'P0', name: '棕榈油', aliases: 'palm oil' },
  { market: 'futcn', code: 'C0', name: '玉米', aliases: 'corn' },
  { market: 'futcn', code: 'I0', name: '铁矿石', aliases: 'iron ore' },
  { market: 'futcn', code: 'J0', name: '焦炭', aliases: 'coke' },
  { market: 'futcn', code: 'JM0', name: '焦煤', aliases: 'coking coal' },
  { market: 'futcn', code: 'TA0', name: 'PTA' },
  { market: 'futcn', code: 'MA0', name: '甲醇', aliases: 'methanol' },
  { market: 'futcn', code: 'SR0', name: '白糖', aliases: 'sugar' },
  { market: 'futcn', code: 'CF0', name: '棉花', aliases: 'cotton' },
  { market: 'futcn', code: 'FG0', name: '玻璃', aliases: 'glass' },
  { market: 'futcn', code: 'SA0', name: '纯碱', aliases: 'soda ash' },
  { market: 'futcn', code: 'UR0', name: '尿素', aliases: 'urea' },
  { market: 'futcn', code: 'PF0', name: '短纤' },
  { market: 'futcn', code: 'OI0', name: '菜油', aliases: 'rapeseed oil' },
  { market: 'futcn', code: 'RM0', name: '菜粕', aliases: 'rapeseed meal' },
  { market: 'futcn', code: 'AP0', name: '苹果', aliases: 'apple' },
  { market: 'futcn', code: 'CJ0', name: '红枣', aliases: 'jujube' },
  { market: 'futcn', code: 'LH0', name: '生猪', aliases: 'live hog' },
  { market: 'futcn', code: 'LC0', name: '碳酸锂', aliases: 'lithium carbonate' },
  { market: 'futcn', code: 'SI0', name: '工业硅', aliases: 'industrial silicon' },
  { market: 'futcn', code: 'PS0', name: '多晶硅', aliases: 'polysilicon' },
  { market: 'futcn', code: 'AO0', name: '氧化铝', aliases: 'alumina' },

  // International commodity futures
  { market: 'futgl', code: 'CL=F', name: 'WTI原油', aliases: 'wti crude oil' },
  { market: 'futgl', code: 'BZ=F', name: '布伦特原油', aliases: 'brent crude' },
  { market: 'futgl', code: 'GC=F', name: 'COMEX黄金', aliases: 'gold' },
  { market: 'futgl', code: 'SI=F', name: 'COMEX白银', aliases: 'silver' },
  { market: 'futgl', code: 'HG=F', name: 'COMEX铜', aliases: 'copper' },
  { market: 'futgl', code: 'PL=F', name: '铂金', aliases: 'platinum' },
  { market: 'futgl', code: 'PA=F', name: '钯金', aliases: 'palladium' },
  { market: 'futgl', code: 'NG=F', name: '天然气', aliases: 'natural gas' },
  { market: 'futgl', code: 'ZC=F', name: 'CBOT玉米', aliases: 'corn' },
  { market: 'futgl', code: 'ZS=F', name: 'CBOT大豆', aliases: 'soybean' },
  { market: 'futgl', code: 'ZW=F', name: 'CBOT小麦', aliases: 'wheat' },
  { market: 'futgl', code: 'KC=F', name: '咖啡', aliases: 'coffee' },
  { market: 'futgl', code: 'SB=F', name: '11号糖', aliases: 'sugar' },
  { market: 'futgl', code: 'CC=F', name: '可可', aliases: 'cocoa' },
  { market: 'futgl', code: 'CT=F', name: '棉花', aliases: 'cotton' },
  { market: 'futgl', code: 'ES=F', name: '标普500期货', aliases: 's&p 500 futures' },
  { market: 'futgl', code: 'NQ=F', name: '纳指100期货', aliases: 'nasdaq futures' },
  { market: 'futgl', code: 'YM=F', name: '道指期货', aliases: 'dow futures' },

  // Indices
  { market: 'index', code: 'sh000001', name: '上证指数', aliases: 'sse composite shanghai' },
  { market: 'index', code: 'sz399001', name: '深证成指', aliases: 'szse component shenzhen' },
  { market: 'index', code: 'sz399006', name: '创业板指', aliases: 'chinext' },
  { market: 'index', code: 'sh000300', name: '沪深300', aliases: 'csi 300' },
  { market: 'index', code: 'sh000688', name: '科创50', aliases: 'star 50' },
  { market: 'index', code: 'sz399905', name: '中证500', aliases: 'csi 500' },
  { market: 'index', code: '^HSI', name: '恒生指数', aliases: 'hang seng hsi' },
  { market: 'index', code: '^GSPC', name: '标普500', aliases: 's&p 500' },
  { market: 'index', code: '^IXIC', name: '纳斯达克综合', aliases: 'nasdaq composite' },
  { market: 'index', code: '^DJI', name: '道琼斯工业', aliases: 'dow jones' },
  { market: 'index', code: '^N225', name: '日经225', aliases: 'nikkei' },
  { market: 'index', code: '^FTSE', name: '英国富时100', aliases: 'ftse 100' },
  { market: 'index', code: '^GDAXI', name: '德国DAX', aliases: 'dax' },
  { market: 'index', code: '^FCHI', name: '法国CAC40', aliases: 'cac 40' },
  { market: 'index', code: '^STOXX50E', name: '欧洲斯托克50', aliases: 'euro stoxx 50' },
  { market: 'index', code: '^AXJO', name: '澳洲标普200', aliases: 'asx 200' },
  { market: 'index', code: '^KS11', name: '韩国综合', aliases: 'kospi' },
  { market: 'index', code: '^TWII', name: '台湾加权', aliases: 'taiex' },
  { market: 'index', code: '^VIX', name: '恐慌指数VIX', aliases: 'vix volatility' },
]

const CATALOG_BY_ID = new Map()
const CATALOG_BY_MARKET = new Map()
for (const entry of CATALOG) {
  entry.id = entry.market + ':' + entry.code
  CATALOG_BY_ID.set(entry.id, entry)
  if (!CATALOG_BY_MARKET.has(entry.market)) CATALOG_BY_MARKET.set(entry.market, [])
  CATALOG_BY_MARKET.get(entry.market).push(entry)
}

/**
 * Default watchlist, intentionally spread across every supported market.
 * @type {string[]}
 */
const DEFAULT_IDS = [
  'cn:600519', 'cn:300750', 'cn:002594', 'cn:601318', 'cn:600036', 'cn:688981',
  'hk:00700', 'hk:09988', 'hk:03690', 'hk:01810',
  'us:AAPL', 'us:NVDA', 'us:MSFT', 'us:TSLA', 'us:AMZN', 'us:META',
  'fx:USDCNH', 'fx:EURUSD', 'fx:GBPUSD', 'fx:USDJPY', 'fx:AUDUSD', 'fx:USDCAD',
  'fx:USDCHF', 'fx:NZDUSD', 'fx:EURJPY', 'fx:GBPJPY', 'fx:EURGBP', 'fx:AUDJPY',
  'futcn:RB0', 'futcn:CU0', 'futcn:AU0', 'futcn:AG0', 'futcn:SC0', 'futcn:M0',
  'futcn:I0', 'futcn:J0', 'futcn:TA0', 'futcn:MA0', 'futcn:SR0', 'futcn:HC0',
  'futgl:CL=F', 'futgl:GC=F',
  'index:sh000001', 'index:sz399001', 'index:sz399006', 'index:^HSI',
  'index:^GSPC', 'index:^IXIC', 'index:^DJI',
]

const SUGGESTED_IDS = [
  'cn:000858', 'cn:300059', 'cn:601899', 'hk:01299', 'hk:00941', 'hk:00005',
  'us:NFLX', 'us:BABA', 'us:AMD', 'fx:EURCHF', 'fx:EURAUD', 'fx:AUDNZD',
  'futcn:ZN0', 'futcn:FG0', 'futgl:NG=F', 'futgl:BZ=F', 'index:^N225', 'index:^FTSE',
]

const GROUP_MARKETS = {
  all: null,
  cn: ['cn'],
  hk: ['hk'],
  us: ['us'],
  fx: ['fx'],
  futures: ['futcn', 'futgl'],
  index: ['index'],
}

const YAHOO_UA = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
}
const SINA_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  Referer: 'https://finance.sina.com.cn/',
}
const TENCENT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  Referer: 'https://gu.qq.com/',
}

const TENCENT_MARKET = { cn: 'CNY', hk: 'HKD', us: 'USD' }

const SINA_HF_MAP = {
  'CL=F': 'CL',
  'GC=F': 'GC',
  'SI=F': 'SI',
  'HG=F': 'HG',
  'NG=F': 'NG',
  'ZC=F': 'C',
  'ZS=F': 'S',
  'ZW=F': 'W',
  'KC=F': 'KC',
  'ES=F': 'ES',
  'NQ=F': 'NQ',
  'YM=F': 'YM',
}

const SINA_INDEX_MAP = {
  '^HSI': 'hangseng',
  '^GSPC': 'sp500',
  '^IXIC': 'nasdaq',
  '^DJI': 'dji',
  '^N225': 'nikkei',
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function text(value, max) {
  if (typeof value !== 'string') return ''
  const s = value.trim()
  return s.length > max ? s.slice(0, max) : s
}

function num(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

function positive(value) {
  const n = num(value)
  return n !== null && n > 0 ? n : null
}

function pad2(n) {
  return n < 10 ? '0' + n : String(n)
}

function stamp() {
  const d = new Date()
  return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' +
    pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds())
}

let gbkDecoder = null
function decodeGbk(buffer) {
  try {
    if (!gbkDecoder) gbkDecoder = new TextDecoder('gbk')
    return gbkDecoder.decode(buffer)
  } catch {
    return Buffer.from(buffer).toString('latin1')
  }
}

function chunks(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

function json(payload, status) {
  return Response.json(payload, {
    status: status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function safeJson(object, key) {
  return object && typeof object === 'object' && !Array.isArray(object) ? object[key] : undefined
}

function codedError(code) {
  const error = new Error(code)
  error.code = code
  return error
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function dataDir() {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
  return path.join(home, 'dsh-marketboard')
}

function dataFile() {
  return path.join(dataDir(), 'data.json')
}

let ioChain = Promise.resolve()
function withLock(fn) {
  const run = ioChain.then(fn, fn)
  ioChain = run.then(() => undefined, () => undefined)
  return run
}

async function backupCurrent(file) {
  try {
    const st = await fs.stat(file)
    if (!st.size) return
    await fs.copyFile(file, file + '.bak')
    const dir = path.join(dataDir(), 'backups')
    await fs.mkdir(dir, { recursive: true })
    await fs.copyFile(file, path.join(dir, 'data-' + stamp() + '.json'))
    const names = (await fs.readdir(dir)).filter((n) => /^data-\d{8}-\d{6}\.json$/.test(n)).sort()
    while (names.length > BACKUP_KEEP) {
      try { await fs.unlink(path.join(dir, names.shift())) } catch {}
    }
  } catch (e) {
    if (e && e.code === 'ENOENT') return
  }
}

async function writeState(state) {
  const file = dataFile()
  await fs.mkdir(path.dirname(file), { recursive: true })
  await backupCurrent(file)
  const tmp = file + '.' + process.pid + '.' + Date.now() + '.tmp'
  await fs.writeFile(tmp, JSON.stringify(state, null, 2), 'utf8')
  await fs.rename(tmp, file)
}

async function readStateFromDisk() {
  try {
    const raw = JSON.parse(await fs.readFile(dataFile(), 'utf8'))
    return normalizeState(raw)
  } catch (e) {
    if (e && e.code !== 'ENOENT') {
      try { process.emitWarning('[dsh-marketboard] read state failed: ' + String(e)) } catch {}
    }
    try {
      const raw = JSON.parse(await fs.readFile(dataFile() + '.bak', 'utf8'))
      return normalizeState(raw)
    } catch {}
    return defaultState()
  }
}

let cachedState = null

async function getState() {
  if (cachedState) return cachedState
  const state = await withLock(readStateFromDisk)
  cachedState = state
  return state
}

async function mutateState(mutator) {
  return withLock(async () => {
    const current = cachedState || await readStateFromDisk()
    const next = normalizeState(await mutator(current))
    await writeState(next)
    cachedState = next
    return next
  })
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalizeMarket(value) {
  const market = text(value, 12)
  return MARKETS.has(market) ? market : ''
}

function normalizeCnCode(raw) {
  const c = text(raw, 20).toUpperCase().replace(/\s+/g, '')
  if (/^(SH|SZ|BJ)\d{6}$/.test(c)) {
    return c.slice(2)
  }
  if (/^\d{6}$/.test(c)) return c
  return ''
}

function cnTencentCode(code) {
  const c = String(code || '')
  if (/^(sh|sz|bj)\d{6}$/i.test(c)) return c.toLowerCase()
  if (!/^\d{6}$/.test(c)) return ''
  if (c[0] === '6') return 'sh' + c
  if (c[0] === '0' || c[0] === '3') return 'sz' + c
  if (c[0] === '4' || c[0] === '8' || c[0] === '9') return 'bj' + c
  return ''
}

function normalizeCode(market, raw) {
  let c = text(raw, 24).toUpperCase().replace(/\s+/g, '')
  if (!c) return ''
  if (market === 'cn') return normalizeCnCode(c)
  if (market === 'hk') {
    c = c.replace(/^HK/, '')
    if (/^\d{1,5}$/.test(c)) return c.padStart(5, '0')
    return ''
  }
  if (market === 'us') {
    c = c.replace(/^US/, '')
    if (/^[A-Z][A-Z0-9.\-]{0,9}$/.test(c)) return c
    return ''
  }
  if (market === 'fx') {
    c = c.replace(/[^A-Z]/g, '')
    if (c.length === 7 && c.endsWith('X')) c = c.slice(0, 6)
    if (/^[A-Z]{6}$/.test(c)) return c
    return ''
  }
  if (market === 'futcn') {
    if (/^[A-Z]{1,3}$/.test(c)) c += '0'
    if (/^[A-Z]{1,3}\d{1,4}$/.test(c)) return c
    return ''
  }
  if (market === 'futgl') {
    if (!/=F$/.test(c)) c += '=F'
    if (/^[A-Z0-9.]{1,8}=F$/.test(c)) return c
    return ''
  }
  if (market === 'index') {
    if (/^(SH|SZ)\d{6}$/.test(c)) return c.toLowerCase()
    if (/^\^[A-Z0-9.]{1,12}$/.test(c)) return c
    return ''
  }
  return ''
}

/**
 * Validate one candidate instrument and return the canonical persisted shape.
 * The client never gets to choose the id: it is derived from market + code.
 */
function canonicalizeItem(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const market = normalizeMarket(raw.market)
  if (!market) return null
  const code = normalizeCode(market, raw.code)
  if (!code) return null
  const id = market + ':' + code
  const known = CATALOG_BY_ID.get(id)
  const provided = text(raw.name, MAX_NAME)
  return {
    id,
    market,
    code,
    name: provided || (known && known.name) || code,
  }
}

function normalizeWatchItem(raw, index) {
  const canonical = canonicalizeItem(raw)
  if (!canonical) return null
  const addedAt = Number(raw.addedAt)
  return {
    id: canonical.id,
    market: canonical.market,
    code: canonical.code,
    name: canonical.name,
    favorite: raw.favorite === true,
    addedAt: Number.isFinite(addedAt) && addedAt > 0 ? addedAt : Date.now() + index,
  }
}

function defaultWatchlist() {
  return DEFAULT_IDS.map((id, index) => {
    const entry = CATALOG_BY_ID.get(id)
    return {
      id,
      market: entry.market,
      code: entry.code,
      name: entry.name,
      favorite: false,
      addedAt: index + 1,
    }
  })
}

function normalizeSettings(raw) {
  const s = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  let refreshMs = Number(s.refreshMs)
  if (!Number.isFinite(refreshMs)) refreshMs = DEFAULT_SETTINGS.refreshMs
  refreshMs = Math.max(3000, Math.min(60000, Math.floor(refreshMs)))
  return {
    refreshMs,
    upColor: s.upColor === 'green' ? 'green' : 'red',
    density: s.density === 'compact' ? 'compact' : 'comfortable',
  }
}

function normalizeGroups(rawGroups, watchlist) {
  const validItemIds = new Set(watchlist.map((item) => item.id))
  const groups = []
  const seenIds = new Set()
  const seenNames = new Set()
  if (!Array.isArray(rawGroups)) return groups
  for (const raw of rawGroups) {
    if (groups.length >= MAX_GROUPS) break
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
    const name = text(raw.name, MAX_GROUP_NAME)
    if (!name) continue
    const nameKey = name.toLowerCase()
    if (seenNames.has(nameKey)) continue
    let id = text(raw.id, 60)
    if (!/^g-[a-z0-9-]{6,60}$/i.test(id) || seenIds.has(id)) {
      do { id = 'g-' + randomUUID() } while (seenIds.has(id))
    }
    const itemIds = []
    const seenItems = new Set()
    if (Array.isArray(raw.itemIds)) {
      for (const value of raw.itemIds) {
        if (itemIds.length >= MAX_GROUP_ITEMS) break
        const itemId = text(value, 80)
        if (!validItemIds.has(itemId) || seenItems.has(itemId)) continue
        seenItems.add(itemId)
        itemIds.push(itemId)
      }
    }
    groups.push({
      id,
      name,
      itemIds,
      createdAt: Number.isFinite(Number(raw.createdAt)) && Number(raw.createdAt) > 0
        ? Number(raw.createdAt)
        : Date.now(),
    })
    seenIds.add(id)
    seenNames.add(nameKey)
  }
  return groups
}

function findGroup(groups, id) {
  return groups.find((group) => group.id === id)
}

function hasGroupName(groups, name, exceptId) {
  const key = name.toLowerCase()
  if (RESERVED_GROUP_NAMES.has(key)) return true
  return groups.some((group) => group.id !== exceptId && group.name.toLowerCase() === key)
}

function defaultState() {
  return {
    version: STATE_VERSION,
    watchlist: defaultWatchlist(),
    groups: [],
    settings: Object.assign({}, DEFAULT_SETTINGS),
  }
}

function normalizeState(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaultState()
  const source = Array.isArray(raw.watchlist) ? raw.watchlist : null
  if (source === null) return defaultState()
  const watchlist = []
  const seen = new Set()
  for (let i = 0; i < source.length && watchlist.length < MAX_ITEMS; i++) {
    const item = normalizeWatchItem(source[i], i)
    if (!item || seen.has(item.id)) continue
    seen.add(item.id)
    watchlist.push(item)
  }
  return {
    version: STATE_VERSION,
    watchlist,
    groups: normalizeGroups(raw.groups, watchlist),
    settings: normalizeSettings(raw.settings),
  }
}

// ---------------------------------------------------------------------------
// Upstream fetching
// ---------------------------------------------------------------------------

async function fetchSinaBatch(symbols) {
  const out = new Map()
  const unique = Array.from(new Set(symbols.filter(Boolean)))
  if (unique.length === 0) return out
  const requests = chunks(unique, 60).map(async (group) => {
    const res = await fetch('https://hq.sinajs.cn/list=' + group.join(','), {
      headers: SINA_HEADERS,
      signal: AbortSignal.timeout(9000),
    })
    if (!res.ok) throw new Error('sina HTTP ' + res.status)
    return decodeGbk(await res.arrayBuffer())
  })
  const settled = await Promise.allSettled(requests)
  for (const result of settled) {
    if (result.status !== 'fulfilled') continue
    for (const m of result.value.matchAll(/var hq_str_([a-zA-Z0-9_]+)="([^"]*)"/g)) {
      out.set(m[1], m[2])
    }
  }
  return out
}

async function fetchTencentBatch(codes) {
  const out = new Map()
  const unique = Array.from(new Set(codes.filter(Boolean)))
  if (unique.length === 0) return out
  const requests = chunks(unique, 60).map(async (group) => {
    const res = await fetch('https://qt.gtimg.cn/q=' + group.join(','), {
      headers: TENCENT_HEADERS,
      signal: AbortSignal.timeout(9000),
    })
    if (!res.ok) throw new Error('tencent HTTP ' + res.status)
    return decodeGbk(await res.arrayBuffer())
  })
  const settled = await Promise.allSettled(requests)
  for (const result of settled) {
    if (result.status !== 'fulfilled') continue
    for (const m of result.value.matchAll(/v_([a-z0-9.\-]+)="([^"]*)"/gi)) {
      out.set(m[1].toLowerCase(), m[2])
    }
  }
  return out
}

function tencentCodeFor(item) {
  if (item.market === 'cn') return cnTencentCode(item.code)
  if (item.market === 'hk') return 'hk' + item.code
  if (item.market === 'us') return 'us' + item.code
  if (item.market === 'index' && /^(sh|sz)\d{6}$/.test(item.code)) return item.code
  return ''
}

function sinaCodeFor(item) {
  if (item.market === 'fx') return 'fx_s' + item.code.toLowerCase()
  if (item.market === 'futcn') return 'nf_' + item.code
  if (item.market === 'futgl') {
    const mapped = SINA_HF_MAP[item.code]
    return mapped ? 'hf_' + mapped : ''
  }
  if (item.market === 'index') {
    const mapped = SINA_INDEX_MAP[item.code]
    return mapped ? 'int_' + mapped : ''
  }
  return ''
}

function sinaStockCodeFor(item) {
  if (item.market === 'cn') return cnTencentCode(item.code)
  if (item.market === 'hk') return 'rt_hk' + item.code
  if (item.market === 'us') return 'gb_' + item.code.toLowerCase()
  return ''
}

function yahooSymbolFor(item) {
  if (item.market === 'fx') return item.code + '=X'
  if (item.market === 'futgl') return item.code
  if (item.market === 'index') return item.code
  if (item.market === 'cn') {
    if (/^\d{6}$/.test(item.code)) {
      if (item.code[0] === '6') return item.code + '.SS'
      if (item.code[0] === '0' || item.code[0] === '3') return item.code + '.SZ'
    }
    return ''
  }
  if (item.market === 'hk') return item.code + '.HK'
  if (item.market === 'us') return item.code
  return ''
}

function buildQuote(item, source, values) {
  const price = positive(values.price)
  if (price === null) return null
  let prevClose = positive(values.prevClose)
  if (prevClose === null) prevClose = null
  let change = num(values.change)
  let changePct = num(values.changePct)
  if (change === null && prevClose !== null) change = price - prevClose
  if (changePct === null && prevClose !== null && prevClose !== 0) changePct = ((price - prevClose) / prevClose) * 100
  if (changePct !== null && !Number.isFinite(changePct)) changePct = null
  return {
    id: item.id,
    ok: true,
    market: item.market,
    code: item.code,
    source,
    currency: values.currency || '',
    price,
    prevClose,
    open: positive(values.open),
    high: positive(values.high),
    low: positive(values.low),
    change,
    changePct,
    quoteTime: text(values.quoteTime, 40),
    fetchedAt: Date.now(),
  }
}

function parseTencentQuote(item, line) {
  if (!line || !line.trim()) return null
  const f = line.split('~')
  if (f.length < 35) return null
  const price = positive(f[3])
  if (price === null) return null
  return buildQuote(item, 'tencent', {
    price,
    prevClose: f[4],
    open: f[5],
    high: f[33],
    low: f[34],
    change: f[31],
    changePct: f[32],
    currency: item.market === 'index'
      ? 'pts'
      : item.market === 'us' ? (f[35] || 'USD') : TENCENT_MARKET[item.market],
    quoteTime: f[30],
  })
}

function formatSinaClock(raw) {
  const s = String(raw || '').padStart(6, '0')
  if (!/^\d{6}$/.test(s)) return text(raw, 20)
  return s.slice(0, 2) + ':' + s.slice(2, 4) + ':' + s.slice(4, 6)
}

function parseSinaQuote(item, line) {
  if (!line || !line.trim()) return null
  const f = line.split(',')
  if (item.market === 'futcn') {
    if (f.length < 18) return null
    return buildQuote(item, 'sina', {
      price: f[8],
      prevClose: f[10],
      open: f[2],
      high: f[3],
      low: f[4],
      change: positive(f[8]) !== null && positive(f[10]) !== null ? Number(f[8]) - Number(f[10]) : null,
      changePct: null,
      currency: 'CNY',
      quoteTime: (f[17] || '') + ' ' + formatSinaClock(f[1]),
    })
  }
  if (item.market === 'futgl') {
    if (f.length < 14) return null
    return buildQuote(item, 'sina', {
      price: f[0],
      prevClose: f[7],
      open: f[8],
      high: f[4],
      low: f[5],
      change: null,
      changePct: null,
      currency: 'USD',
      quoteTime: (f[12] || '') + ' ' + (f[6] || ''),
    })
  }
  if (item.market === 'index') {
    if (f.length < 4) return null
    return buildQuote(item, 'sina', {
      price: f[1],
      prevClose: null,
      open: null,
      high: null,
      low: null,
      change: f[2],
      changePct: f[3],
      currency: 'pts',
      quoteTime: '',
    })
  }
  if (item.market === 'fx') {
    if (f.length < 12) return null
    return buildQuote(item, 'sina', {
      price: f[8] || f[1],
      prevClose: f[3],
      open: f[5],
      high: f[6],
      low: f[7],
      change: f[11],
      changePct: f[10],
      currency: item.code.slice(3),
      quoteTime: (f[17] || '') + ' ' + (f[0] || ''),
    })
  }
  return null
}

function parseSinaStockQuote(item, line) {
  if (!line || !line.trim()) return null
  const f = line.split(',')
  if (item.market === 'cn') {
    if (f.length < 32) return null
    return buildQuote(item, 'sina', {
      price: f[3],
      prevClose: f[2],
      open: f[1],
      high: f[4],
      low: f[5],
      change: null,
      changePct: null,
      currency: 'CNY',
      quoteTime: (f[30] || '') + ' ' + (f[31] || ''),
    })
  }
  if (item.market === 'hk') {
    if (f.length < 10) return null
    return buildQuote(item, 'sina', {
      price: f[6],
      prevClose: f[3],
      open: f[2],
      high: f[4],
      low: f[5],
      change: f[7],
      changePct: f[8],
      currency: 'HKD',
      quoteTime: (f[17] || '') + ' ' + (f[18] || ''),
    })
  }
  if (item.market === 'us') {
    if (f.length < 11) return null
    return buildQuote(item, 'sina', {
      price: f[1],
      prevClose: null,
      open: f[5],
      high: f[6],
      low: f[7],
      change: f[4],
      changePct: f[2],
      currency: 'USD',
      quoteTime: f[3],
    })
  }
  return null
}

async function fetchYahooQuote(item) {
  const symbol = yahooSymbolFor(item)
  if (!symbol) return null
  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
      encodeURIComponent(symbol) + '?interval=1d&range=5d&includePrePost=false'
    const res = await fetch(url, { headers: YAHOO_UA, signal: AbortSignal.timeout(4500) })
    if (!res.ok) return null
    const payload = await res.json()
    const result = payload && payload.chart && payload.chart.result && payload.chart.result[0]
    if (!result) return null
    const meta = result.meta || {}
    const q = (result.indicators && result.indicators.quote && result.indicators.quote[0]) || {}
    const lastOf = (arr) => {
      if (!Array.isArray(arr)) return null
      for (let i = arr.length - 1; i >= 0; i--) {
        const value = num(arr[i])
        if (value !== null) return value
      }
      return null
    }
    const currency = item.market === 'index' ? 'pts' : (meta.currency || '')
    return buildQuote(item, 'yahoo', {
      price: meta.regularMarketPrice,
      prevClose: meta.chartPreviousClose !== undefined ? meta.chartPreviousClose : meta.previousClose,
      open: meta.regularMarketOpen !== undefined ? meta.regularMarketOpen : lastOf(q.open),
      high: meta.regularMarketDayHigh !== undefined ? meta.regularMarketDayHigh : lastOf(q.high),
      low: meta.regularMarketDayLow !== undefined ? meta.regularMarketDayLow : lastOf(q.low),
      change: meta.regularMarketChange,
      changePct: meta.regularMarketChangePercent,
      currency,
      quoteTime: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : '',
    })
  } catch {
    return null
  }
}

async function fetchYahooLimited(items) {
  const out = new Map()
  const queue = items.slice(0, MAX_YAHOO_FALLBACK)
  const workers = []
  const workerCount = Math.min(6, queue.length)
  let cursor = 0
  for (let i = 0; i < workerCount; i++) {
    workers.push((async () => {
      while (cursor < queue.length) {
        const item = queue[cursor]
        cursor += 1
        const quote = await fetchYahooQuote(item)
        if (quote) out.set(item.id, quote)
      }
    })())
  }
  await Promise.allSettled(workers)
  return out
}

// ---------------------------------------------------------------------------
// Quote orchestration
// ---------------------------------------------------------------------------

const quoteCache = new Map()
const sourceWarningAt = { sina: 0, tencent: 0, yahoo: 0 }

function warnSourceOnce(source, error) {
  const now = Date.now()
  if (sourceWarningAt[source] && now - sourceWarningAt[source] < 5 * 60 * 1000) return
  sourceWarningAt[source] = now
  try { process.emitWarning('[dsh-marketboard] ' + source + ' quote source failed: ' + String(error)) } catch {}
}

async function fetchQuotesForWatchlist(watchlist) {
  const fresh = new Map()
  const sources = { tencent: 0, sina: 0, yahoo: 0 }
  if (!watchlist || watchlist.length === 0) {
    return { quotes: [], sources, errors: 0, fetchedAt: Date.now() }
  }

  const stockItems = []
  const sinaItems = []
  for (const item of watchlist) {
    const tc = tencentCodeFor(item)
    if (tc) {
      stockItems.push({ item, symbol: tc })
      continue
    }
    const sc = sinaCodeFor(item)
    if (sc) {
      sinaItems.push({ item, symbol: sc })
    }
  }

  await Promise.all([
    (async () => {
      if (stockItems.length === 0) return
      try {
        const lines = await fetchTencentBatch(stockItems.map((x) => x.symbol))
        for (const { item, symbol } of stockItems) {
          const quote = parseTencentQuote(item, lines.get(symbol.toLowerCase()))
          if (quote) {
            fresh.set(item.id, quote)
            sources.tencent += 1
          }
        }
      } catch (e) {
        warnSourceOnce('tencent', e)
      }
    })(),
    (async () => {
      if (sinaItems.length === 0) return
      try {
        const lines = await fetchSinaBatch(sinaItems.map((x) => x.symbol))
        for (const { item, symbol } of sinaItems) {
          const quote = parseSinaQuote(item, lines.get(symbol))
          if (quote) {
            fresh.set(item.id, quote)
            sources.sina += 1
          }
        }
      } catch (e) {
        warnSourceOnce('sina', e)
      }
    })(),
  ])

  // Tencent covers CN/HK/US stocks well; Sina is a second chance for any gaps.
  const missingStocks = watchlist.filter((item) => {
    if (fresh.has(item.id)) return false
    return Boolean(sinaStockCodeFor(item))
  })
  if (missingStocks.length > 0) {
    try {
      const lines = await fetchSinaBatch(missingStocks.map(sinaStockCodeFor))
      for (const item of missingStocks) {
        const quote = parseSinaStockQuote(item, lines.get(sinaStockCodeFor(item)))
        if (quote) {
          fresh.set(item.id, quote)
          sources.sina += 1
        }
      }
    } catch (e) {
      warnSourceOnce('sina', e)
    }
  }

  const missing = watchlist.filter((item) => !fresh.has(item.id))
  if (missing.length > 0) {
    try {
      const yahooQuotes = await fetchYahooLimited(missing)
      for (const [id, quote] of yahooQuotes) {
        fresh.set(id, quote)
        sources.yahoo += 1
      }
    } catch (e) {
      warnSourceOnce('yahoo', e)
    }
  }

  const now = Date.now()
  const quotes = []
  let errors = 0
  for (const item of watchlist) {
    const quote = fresh.get(item.id)
    if (quote) {
      quoteCache.set(item.id, { quote, at: now })
      quotes.push(quote)
      continue
    }
    const cached = quoteCache.get(item.id)
    if (cached && now - cached.at <= QUOTE_CACHE_MS) {
      quotes.push(Object.assign({}, cached.quote, {
        stale: true,
        cacheAge: now - cached.at,
      }))
      errors += 1
      continue
    }
    quotes.push({
      id: item.id,
      ok: false,
      market: item.market,
      code: item.code,
      source: '',
      currency: '',
      price: null,
      prevClose: null,
      open: null,
      high: null,
      low: null,
      change: null,
      changePct: null,
      quoteTime: '',
      fetchedAt: now,
    })
    errors += 1
  }

  if (quoteCache.size > 300) {
    const entries = Array.from(quoteCache.entries()).sort((a, b) => a[1].at - b[1].at)
    for (let i = 0; i < entries.length - 250; i++) quoteCache.delete(entries[i][0])
  }

  return { quotes, sources, errors, fetchedAt: now }
}

let quotesInFlight = null
let quotesInFlightKey = ''

async function getQuotes(watchlist) {
  const key = watchlist.map((item) => item.id).join(',')
  if (quotesInFlight && quotesInFlightKey === key) return quotesInFlight
  quotesInFlightKey = key
  quotesInFlight = fetchQuotesForWatchlist(watchlist)
    .finally(() => {
      if (quotesInFlightKey === key) {
        quotesInFlight = null
        quotesInFlightKey = ''
      }
    })
  return quotesInFlight
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

const remoteSearchCache = new Map()

function groupAllows(group, market) {
  const markets = GROUP_MARKETS[group]
  return markets === null || markets.indexOf(market) >= 0
}

function scoreEntry(entry, q) {
  const code = entry.code.toLowerCase()
  const name = entry.name.toLowerCase()
  const aliases = (entry.aliases || '').toLowerCase()
  if (code === q || name === q) return 0
  if (code.indexOf(q) === 0) return 1
  if (name.indexOf(q) === 0) return 2
  if (aliases.indexOf(q) === 0) return 3
  if (code.indexOf(q) >= 0) return 4
  if (name.indexOf(q) >= 0) return 5
  if (aliases.indexOf(q) >= 0) return 6
  return 99
}

function searchCatalog(q, group, limit) {
  const max = limit || 30
  const markets = GROUP_MARKETS[group]
  const pool = []
  if (q === '') {
    if (group === 'all') {
      for (const id of SUGGESTED_IDS) {
        const entry = CATALOG_BY_ID.get(id)
        if (entry) pool.push(entry)
      }
      return pool
    }
    for (const market of markets) {
      for (const entry of CATALOG_BY_MARKET.get(market) || []) pool.push(entry)
    }
    return pool.slice(0, max)
  }
  const needle = q.toLowerCase()
  for (const entry of CATALOG) {
    if (!groupAllows(group, entry.market)) continue
    if (scoreEntry(entry, needle) < 99) pool.push(entry)
  }
  pool.sort((a, b) => scoreEntry(a, needle) - scoreEntry(b, needle))
  return pool.slice(0, max)
}

async function fetchStockSearch(q) {
  const cached = remoteSearchCache.get(q)
  if (cached && Date.now() - cached.at < 5 * 60 * 1000) return cached.results
  try {
    const res = await fetch('https://smartbox.gtimg.cn/s3/?t=all&q=' + encodeURIComponent(q), {
      headers: { 'User-Agent': YAHOO_UA['User-Agent'] },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const raw = await res.text()
    const match = /v_hint="([^"]*)"/.exec(raw)
    if (!match || match[1] === 'N') return cacheRemote(q, [])
    let decoded = match[1]
    try { decoded = JSON.parse('"' + match[1].replace(/"/g, '\\"') + '"') } catch {}
    const results = []
    const seen = new Set()
    for (const entry of decoded.split('^')) {
      const p = entry.split('~')
      if (p.length < 5) continue
      const market = p[0]
      const rawCode = p[1]
      const name = text(p[2], MAX_NAME)
      const type = p[4] || ''
      if (!name) continue
      if (type !== 'GP' && type !== 'GP-A') continue
      let item = null
      if (market === 'sh' || market === 'sz' || market === 'bj') {
        const code = normalizeCnCode(rawCode)
        if (code) item = { market: 'cn', code, name }
      } else if (market === 'hk') {
        if (/^8/.test(rawCode)) continue
        const code = normalizeCode('hk', rawCode)
        if (code) item = { market: 'hk', code, name }
      } else if (market === 'us') {
        const sym = String(rawCode).toUpperCase().replace(/\.(OQ|N|PS|AM|PK|US)$/, '')
        const code = normalizeCode('us', sym)
        if (code) item = { market: 'us', code, name }
      }
      if (!item) continue
      const id = item.market + ':' + item.code
      if (seen.has(id)) continue
      seen.add(id)
      results.push({ market: item.market, code: item.code, name: item.name })
      if (results.length >= 24) break
    }
    return cacheRemote(q, results)
  } catch {
    return []
  }
}

function cacheRemote(q, results) {
  if (remoteSearchCache.size > 80) {
    const oldest = Array.from(remoteSearchCache.entries()).sort((a, b) => a[1].at - b[1].at)[0]
    if (oldest) remoteSearchCache.delete(oldest[0])
  }
  remoteSearchCache.set(q, { at: Date.now(), results })
  return results
}

async function searchInstruments(rawQuery, rawGroup) {
  const q = text(rawQuery, 40)
  let group = text(rawGroup, 12)
  if (!(group in GROUP_MARKETS)) group = 'all'
  const local = searchCatalog(q, group, 32)
  const results = local.map((entry) => ({
    market: entry.market,
    code: entry.code,
    name: entry.name,
    known: true,
  }))

  const markets = GROUP_MARKETS[group]
  const allowRemote = q !== '' && (
    group === 'all' ||
    (markets && markets.some((m) => m === 'cn' || m === 'hk' || m === 'us'))
  )
  if (allowRemote) {
    const remote = await fetchStockSearch(q)
    const seen = new Set(results.map((r) => r.market + ':' + r.code))
    for (const item of remote) {
      if (!groupAllows(group, item.market)) continue
      const id = item.market + ':' + item.code
      if (seen.has(id)) continue
      seen.add(id)
      const known = CATALOG_BY_ID.get(id)
      results.push({
        market: item.market,
        code: item.code,
        name: (known && known.name) || item.name,
        known: Boolean(known),
      })
      if (results.length >= 40) break
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function readBody(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

async function handleState(request) {
  const body = await readBody(request)
  const op = text(safeJson(body, 'op'), 20) || 'get'
  try {
    if (op === 'get') {
      return json({ ok: true, state: await getState() })
    }

    if (op === 'add') {
      const candidate = canonicalizeItem(safeJson(body, 'item'))
      if (!candidate) {
        return json({ ok: false, error: { code: 'invalid-item', message: 'Unknown market or invalid code.' } }, 400)
      }
      const requestedGroups = new Set(
        (Array.isArray(safeJson(body, 'groupIds')) ? safeJson(body, 'groupIds') : [])
          .map((value) => text(value, 60))
          .filter(Boolean),
      )
      let already = false
      const state = await mutateState((current) => {
        const exists = current.watchlist.some((item) => item.id === candidate.id)
        if (exists) already = true
        if (!exists && current.watchlist.length >= MAX_ITEMS) {
          throw codedError('watchlist-full')
        }
        const watchlist = exists
          ? current.watchlist
          : current.watchlist.concat([{
            id: candidate.id,
            market: candidate.market,
            code: candidate.code,
            name: candidate.name,
            favorite: false,
            addedAt: Date.now(),
          }])
        let groups = current.groups
        if (requestedGroups.size > 0) {
          groups = current.groups.map((group) => {
            if (!requestedGroups.has(group.id) || group.itemIds.includes(candidate.id)) return group
            return Object.assign({}, group, { itemIds: group.itemIds.concat(candidate.id) })
          })
        }
        return {
          version: STATE_VERSION,
          watchlist,
          groups,
          settings: current.settings,
        }
      })
      return json({ ok: true, state, already, item: candidate })
    }

    if (op === 'remove') {
      const id = text(safeJson(body, 'id'), 80)
      if (!id) return json({ ok: false, error: { code: 'invalid-id', message: 'Missing id.' } }, 400)
      let removed = false
      const state = await mutateState((current) => {
        const next = current.watchlist.filter((item) => item.id !== id)
        removed = next.length !== current.watchlist.length
        if (!removed) return current
        return {
          version: STATE_VERSION,
          watchlist: next,
          groups: current.groups.map((group) => ({
            id: group.id,
            name: group.name,
            itemIds: group.itemIds.filter((itemId) => itemId !== id),
            createdAt: group.createdAt,
          })),
          settings: current.settings,
        }
      })
      quoteCache.delete(id)
      return json({ ok: true, state, removed })
    }

    if (op === 'favorite') {
      const id = text(safeJson(body, 'id'), 80)
      if (!id) return json({ ok: false, error: { code: 'invalid-id', message: 'Missing id.' } }, 400)
      let found = false
      const state = await mutateState((current) => {
        const next = current.watchlist.map((item) => {
          if (item.id !== id) return item
          found = true
          return Object.assign({}, item, { favorite: !item.favorite })
        })
        if (!found) return current
        return {
          version: STATE_VERSION,
          watchlist: next,
          groups: current.groups,
          settings: current.settings,
        }
      })
      if (!found) return json({ ok: false, error: { code: 'not-found', message: 'Instrument not found.' } }, 404)
      return json({ ok: true, state })
    }

    if (op === 'saveSettings') {
      const patch = safeJson(body, 'settings')
      const state = await mutateState((current) => ({
        version: STATE_VERSION,
        watchlist: current.watchlist,
        groups: current.groups,
        settings: Object.assign({}, current.settings, patch && typeof patch === 'object' ? patch : {}),
      }))
      return json({ ok: true, state })
    }

    if (op === 'resetWatchlist') {
      const state = await mutateState((current) => {
        const fresh = defaultState()
        fresh.settings = current.settings
        const validItemIds = new Set(fresh.watchlist.map((item) => item.id))
        fresh.groups = current.groups.map((group) => ({
          id: group.id,
          name: group.name,
          itemIds: group.itemIds.filter((itemId) => validItemIds.has(itemId)),
          createdAt: group.createdAt,
        }))
        return fresh
      })
      quoteCache.clear()
      return json({ ok: true, state })
    }

    if (op === 'addGroup') {
      const name = text(safeJson(body, 'name'), MAX_GROUP_NAME)
      if (!name) {
        return json({ ok: false, error: { code: 'invalid-group-name', message: 'Group name is required.' } }, 400)
      }
      let created = null
      const state = await mutateState((current) => {
        if (current.groups.length >= MAX_GROUPS) throw codedError('group-limit')
        if (hasGroupName(current.groups, name)) throw codedError('group-name-taken')
        created = {
          id: 'g-' + randomUUID(),
          name,
          itemIds: [],
          createdAt: Date.now(),
        }
        return {
          version: STATE_VERSION,
          watchlist: current.watchlist,
          groups: current.groups.concat([created]),
          settings: current.settings,
        }
      })
      return json({ ok: true, state, group: created })
    }

    if (op === 'renameGroup') {
      const id = text(safeJson(body, 'id'), 60)
      const name = text(safeJson(body, 'name'), MAX_GROUP_NAME)
      if (!id) return json({ ok: false, error: { code: 'group-not-found', message: 'Group not found.' } }, 404)
      if (!name) {
        return json({ ok: false, error: { code: 'invalid-group-name', message: 'Group name is required.' } }, 400)
      }
      let updated = null
      const state = await mutateState((current) => {
        const group = findGroup(current.groups, id)
        if (!group) throw codedError('group-not-found')
        if (hasGroupName(current.groups, name, id)) throw codedError('group-name-taken')
        updated = Object.assign({}, group, { name })
        return {
          version: STATE_VERSION,
          watchlist: current.watchlist,
          groups: current.groups.map((entry) => entry.id === id ? updated : entry),
          settings: current.settings,
        }
      })
      return json({ ok: true, state, group: updated })
    }

    if (op === 'deleteGroup') {
      const id = text(safeJson(body, 'id'), 60)
      if (!id) return json({ ok: false, error: { code: 'group-not-found', message: 'Group not found.' } }, 404)
      const state = await mutateState((current) => {
        const group = findGroup(current.groups, id)
        if (!group) throw codedError('group-not-found')
        return {
          version: STATE_VERSION,
          watchlist: current.watchlist,
          groups: current.groups.filter((entry) => entry.id !== id),
          settings: current.settings,
        }
      })
      return json({ ok: true, state, removed: true })
    }

    if (op === 'setGroupItems') {
      const id = text(safeJson(body, 'id'), 60)
      if (!id) return json({ ok: false, error: { code: 'group-not-found', message: 'Group not found.' } }, 404)
      const rawItemIds = Array.isArray(safeJson(body, 'itemIds')) ? safeJson(body, 'itemIds') : []
      const selected = new Set(rawItemIds.map((value) => text(value, 80)).filter(Boolean))
      let updated = null
      const state = await mutateState((current) => {
        const group = findGroup(current.groups, id)
        if (!group) throw codedError('group-not-found')
        const itemIds = current.watchlist
          .filter((item) => selected.has(item.id))
          .map((item) => item.id)
          .slice(0, MAX_GROUP_ITEMS)
        updated = Object.assign({}, group, { itemIds })
        return {
          version: STATE_VERSION,
          watchlist: current.watchlist,
          groups: current.groups.map((entry) => entry.id === id ? updated : entry),
          settings: current.settings,
        }
      })
      return json({ ok: true, state, group: updated })
    }

    return json({ ok: false, error: { code: 'unknown-op', message: 'Unknown operation.' } }, 400)
  } catch (e) {
    const code = e && e.code
    if (code === 'watchlist-full') {
      return json({ ok: false, error: { code, message: 'Watchlist is full.' } }, 409)
    }
    if (code === 'group-limit') {
      return json({ ok: false, error: { code, message: 'Too many custom groups.' } }, 409)
    }
    if (code === 'group-name-taken') {
      return json({ ok: false, error: { code, message: 'That group name is already in use.' } }, 409)
    }
    if (code === 'invalid-group-name') {
      return json({ ok: false, error: { code, message: 'Invalid group name.' } }, 400)
    }
    if (code === 'group-not-found') {
      return json({ ok: false, error: { code, message: 'Group not found.' } }, 404)
    }
    return json({ ok: false, error: { code: 'state-io', message: String(e && e.message ? e.message : e) } }, 500)
  }
}

async function handleQuotes() {
  try {
    const state = await getState()
    const result = await getQuotes(state.watchlist)
    return json({
      ok: true,
      fetchedAt: result.fetchedAt,
      sources: result.sources,
      errors: result.errors,
      quotes: result.quotes,
    })
  } catch (e) {
    return json({ ok: false, error: { code: 'quotes', message: String(e && e.message ? e.message : e) } }, 500)
  }
}

async function handleSearch(request) {
  const body = await readBody(request)
  try {
    const results = await searchInstruments(safeJson(body, 'q'), safeJson(body, 'group'))
    return json({ ok: true, results })
  } catch (e) {
    return json({ ok: false, error: { code: 'search', message: String(e && e.message ? e.message : e) } }, 500)
  }
}

// ---------------------------------------------------------------------------
// Cordis
// ---------------------------------------------------------------------------

export function apply(ctx) {
  try { ctx.logger?.info?.('[dsh-marketboard] host active v0.2.0 (groups)') } catch {}

  ctx.inject(['connection'], (scope) => {
    let connection
    try { connection = scope.get('connection') } catch { connection = undefined }
    const register = connection && connection.fetch && typeof connection.fetch.register === 'function'
      ? connection.fetch.register.bind(connection.fetch)
      : undefined
    if (!register) {
      try { ctx.logger?.warn?.('[dsh-marketboard] connection.fetch.register unavailable') } catch {}
      return
    }
    const routes = [
      ['/api/dsh-marketboard/state', handleState, 'dsh-marketboard: state route'],
      ['/api/dsh-marketboard/quotes', handleQuotes, 'dsh-marketboard: quotes route'],
      ['/api/dsh-marketboard/search', handleSearch, 'dsh-marketboard: search route'],
    ]
    for (const [routePath, handler, label] of routes) {
      scope.effect(
        () => register({ path: routePath, methods: ['POST'], requestBody: 'buffered', fetch: handler }),
        label,
      )
    }
  })
}
