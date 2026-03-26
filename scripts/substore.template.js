/*!
 * DoubleTree Clash Config for Substore
 * 基于 powerfullz/override-rules 扩展
 * 
 * 自定义功能：
 * - 新增「♻️ 自动选择」策略组（url-test 自动选择最快节点）
 
 * - 支持额外规则注入（在 MATCH 之前插入）
 * 
 * 支持的传入参数：
 * - loadbalance: 启用负载均衡（url-test/load-balance，默认 false）
 * - landing: 启用落地节点功能（如机场家宽/星链/落地分组，默认 false）
 * - ipv6: 启用 IPv6 支持（默认 false）
 * - full: 输出完整配置（适合纯内核启动，默认 false）
 * - keepalive: 启用 tcp-keep-alive（默认 false）
 * - fakeip: DNS 使用 FakeIP 模式（默认 false，false 为 RedirHost）
 * - quic: 允许 QUIC 流量（UDP 443，默认 false）
 * - threshold: 国家节点数量小于该值时不显示分组 (默认 0)
 * - regex: 使用正则过滤模式（include-all + filter）写入各国家代理组，而非直接枚举节点名称（默认 false）
 */

// ============================================================
// 基础配置
// ============================================================

const NODE_SUFFIX = "节点";

// 参数解析
function parseBool(e) {
  return typeof e === "boolean" 
    ? e 
    : typeof e === "string" && (e.toLowerCase() === "true" || e === "1");
}

function parseNumber(e, t = 0) {
  if (e == null) return t;
  const o = parseInt(e, 10);
  return isNaN(o) ? t : o;
}

function buildFeatureFlags(e) {
  const t = Object.entries({
    loadbalance: "loadBalance",
    landing: "landing",
    ipv6: "ipv6Enabled",
    full: "fullConfig",
    keepalive: "keepAliveEnabled",
    fakeip: "fakeIPEnabled",
    quic: "quicEnabled",
    regex: "regexFilter"
  }).reduce((t, [o, r]) => (t[r] = parseBool(e[o]) || false, t), {});
  return t.countryThreshold = parseNumber(e.threshold, 0), t;
}

const rawArgs = typeof $arguments !== "undefined" ? $arguments : {};
const { 
  loadBalance, landing, ipv6Enabled, fullConfig, 
  keepAliveEnabled, fakeIPEnabled, quicEnabled, 
  regexFilter, countryThreshold 
} = buildFeatureFlags(rawArgs);

// ============================================================
// 国家/地区配置
// ============================================================

const countriesMeta = {
  "香港": {
    weight: 10,
    pattern: "香港|港|HK|hk|Hong Kong|HongKong|hongkong|🇭🇰",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Hong_Kong.png"
  },
  "澳门": {
    pattern: "澳门|MO|Macau|🇲🇴",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Macao.png"
  },
  "台湾": {
    weight: 20,
    pattern: "台|新北|彰化|TW|Taiwan|🇹🇼",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Taiwan.png"
  },
  "新加坡": {
    weight: 30,
    pattern: "新加坡|坡|狮城|SG|Singapore|🇸🇬",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Singapore.png"
  },
  "日本": {
    weight: 40,
    pattern: "日本|川日|东京|大阪|泉日|埼玉|沪日|深日|JP|Japan|🇯🇵",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Japan.png"
  },
  "韩国": {
    pattern: "KR|Korea|KOR|首尔|韩|韓|🇰🇷",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Korea.png"
  },
  "美国": {
    weight: 50,
    pattern: "美国|美|US|United States|🇺🇸",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_States.png"
  },
  "加拿大": {
    pattern: "加拿大|Canada|CA|🇨🇦",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Canada.png"
  },
  "英国": {
    weight: 60,
    pattern: "英国|United Kingdom|UK|伦敦|London|🇬🇧",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_Kingdom.png"
  },
  "澳大利亚": {
    pattern: "澳洲|澳大利亚|AU|Australia|🇦🇺",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Australia.png"
  },
  "德国": {
    weight: 70,
    pattern: "德国|德|DE|Germany|🇩🇪",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Germany.png"
  },
  "法国": {
    weight: 80,
    pattern: "法国|法|FR|France|🇫🇷",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/France.png"
  },
  "俄罗斯": {
    pattern: "俄罗斯|俄|RU|Russia|🇷🇺",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Russia.png"
  },
  "泰国": {
    pattern: "泰国|泰|TH|Thailand|🇹🇭",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Thailand.png"
  },
  "印度": {
    pattern: "印度|IN|India|🇮🇳",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/India.png"
  },
  "马来西亚": {
    pattern: "马来西亚|马来|MY|Malaysia|🇲🇾",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Malaysia.png"
  }
};

// 正则表达式
const LOW_COST_REGEX = /0\.[0-5]|低倍率|省流|大流量|实验性/i;
const LANDING_REGEX = /家宽|家庭|家庭宽带|商宽|商业宽带|星链|Starlink|落地/i;
const LANDING_PATTERN = "(?i)家宽|家庭|家庭宽带|商宽|商业宽带|星链|Starlink|落地";

// 策略组名称常量
const PROXY_GROUPS = {
  SELECT: "选择代理",
  MANUAL: "手动选择",
  FALLBACK: "故障转移",
  DIRECT: "直连",
  LANDING: "落地节点",
  LOW_COST: "低倍率节点",
  AUTO_SELECT: "♻️ 自动选择"
};

// ============================================================
// 规则提供者配置
// ============================================================

const ruleProviders = {
  ADBlock: {
    type: "http",
    behavior: "domain",
    format: "mrs",
    interval: 86400,
    url: "https://adrules.top/adrules-mihomo.mrs",
    path: "./ruleset/ADBlock.mrs"
  },
  SogouInput: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://ruleset.skk.moe/Clash/non_ip/sogouinput.txt",
    path: "./ruleset/SogouInput.txt"
  },
  StaticResources: {
    type: "http",
    behavior: "domain",
    format: "text",
    interval: 86400,
    url: "https://ruleset.skk.moe/Clash/domainset/cdn.txt",
    path: "./ruleset/StaticResources.txt"
  },
  CDNResources: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://ruleset.skk.moe/Clash/non_ip/cdn.txt",
    path: "./ruleset/CDNResources.txt"
  },
  TikTok: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/TikTok.list",
    path: "./ruleset/TikTok.list"
  },
  EHentai: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/EHentai.list",
    path: "./ruleset/EHentai.list"
  },
  SteamFix: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/SteamFix.list",
    path: "./ruleset/SteamFix.list"
  },
  GoogleFCM: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/FirebaseCloudMessaging.list",
    path: "./ruleset/FirebaseCloudMessaging.list"
  },
  AdditionalFilter: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/AdditionalFilter.list",
    path: "./ruleset/AdditionalFilter.list"
  },
  AdditionalCDNResources: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/AdditionalCDNResources.list",
    path: "./ruleset/AdditionalCDNResources.list"
  },
  Crypto: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/Crypto.list",
    path: "./ruleset/Crypto.list"
  }
};

// ============================================================
// 基础规则配置
// ============================================================

const baseRules = [
  "RULE-SET,ADBlock,广告拦截",
  "RULE-SET,AdditionalFilter,广告拦截",
  "RULE-SET,SogouInput,搜狗输入法",
  "DOMAIN-SUFFIX,truthsocial.com,Truth Social",
  "RULE-SET,StaticResources,静态资源",
  "RULE-SET,CDNResources,静态资源",
  "RULE-SET,AdditionalCDNResources,静态资源",
  "RULE-SET,Crypto,Crypto",
  "RULE-SET,EHentai,E-Hentai",
  "RULE-SET,TikTok,TikTok",
  `RULE-SET,SteamFix,${PROXY_GROUPS.DIRECT}`,
  `RULE-SET,GoogleFCM,${PROXY_GROUPS.DIRECT}`,
  `DOMAIN,services.googleapis.cn,${PROXY_GROUPS.SELECT}`,
  "GEOSITE,CATEGORY-AI-!CN,AI",
  `GEOSITE,GOOGLE-PLAY@CN,${PROXY_GROUPS.DIRECT}`,
  `GEOSITE,MICROSOFT@CN,${PROXY_GROUPS.DIRECT}`,
  "GEOSITE,ONEDRIVE,OneDrive",
  "GEOSITE,MICROSOFT,Microsoft",
  "GEOSITE,TELEGRAM,Telegram",
  "GEOSITE,YOUTUBE,YouTube",
  "GEOSITE,GOOGLE,Google",
  "GEOSITE,NETFLIX,Netflix",
  "GEOSITE,SPOTIFY,Spotify",
  "GEOSITE,BAHAMUT,Bahamut",
  "GEOSITE,BILIBILI,Bilibili",
  "GEOSITE,PIKPAK,PikPak",
  `GEOSITE,GFW,${PROXY_GROUPS.SELECT}`,
  `GEOSITE,CN,${PROXY_GROUPS.DIRECT}`,
  `GEOSITE,PRIVATE,${PROXY_GROUPS.DIRECT}`,
  "GEOIP,NETFLIX,Netflix,no-resolve",
  "GEOIP,TELEGRAM,Telegram,no-resolve",
  `GEOIP,CN,${PROXY_GROUPS.DIRECT}`,
  `GEOIP,PRIVATE,${PROXY_GROUPS.DIRECT}`,
  "DST-PORT,22,SSH(22端口)",
  `MATCH,${PROXY_GROUPS.SELECT}`
];

// ============================================================
// 额外规则配置（自定义扩展）
// 这些规则会在 MATCH 规则之前插入
// 占位符格式：{{EXTRA_RULES}} 由构建脚本替换
// ============================================================

const EXTRA_RULES = [
  // ========== Bypass 规则（直连）==========
  "DOMAIN-SUFFIX,tailscale.com,DIRECT",
  "IP-CIDR,100.64.0.0/10,DIRECT",
  "DOMAIN-KEYWORD,qinglin,DIRECT",
  "DOMAIN-KEYWORD,volcengine,DIRECT",
  "DOMAIN-SUFFIX,follow.is,DIRECT",
  "DOMAIN-SUFFIX,acs.org,DIRECT",
  
  // ========== 自定义代理规则 ==========
  "DOMAIN-KEYWORD,generativelanguage,🚀 手动切换",
  "DOMAIN-KEYWORD,aistudio,🌏 全球加速"
];

// ============================================================
// DNS 配置
// ============================================================

const snifferConfig = {
  sniff: {
    TLS: { ports: [443, 8443] },
    HTTP: { ports: [80, 8080, 8880] },
    QUIC: { ports: [443, 8443] }
  },
  "override-destination": false,
  enable: true,
  "force-dns-mapping": true,
  "skip-domain": [
    "Mijia Cloud",
    "dlg.io.mi.com",
    "+.push.apple.com"
  ]
};

function buildDnsConfig({ mode, fakeIpFilter }) {
  const config = {
    enable: true,
    ipv6: ipv6Enabled,
    "prefer-h3": true,
    "enhanced-mode": mode,
    "default-nameserver": ["119.29.29.29", "223.5.5.5"],
    nameserver: ["system", "223.5.5.5", "119.29.29.29", "180.184.1.1"],
    fallback: [
      "quic://dns0.eu",
      "https://dns.cloudflare.com/dns-query",
      "https://dns.sb/dns-query",
      "tcp://208.67.222.222",
      "tcp://8.26.56.2"
    ],
    "proxy-server-nameserver": [
      "https://dns.alidns.com/dns-query",
      "tls://dot.pub"
    ]
  };
  
  if (fakeIpFilter) {
    config["fake-ip-filter"] = fakeIpFilter;
  }
  
  return config;
}

const dnsConfig = buildDnsConfig({ mode: "redir-host" });
const dnsConfigFakeIp = buildDnsConfig({
  mode: "fake-ip",
  fakeIpFilter: [
    "geosite:private",
    "geosite:connectivity-check",
    "geosite:cn",
    "Mijia Cloud",
    "dig.io.mi.com",
    "localhost.ptlogin2.qq.com",
    "*.icloud.com",
    "*.stun.*.*",
    "*.stun.*.*.*"
  ]
});

const geoxURL = {
  geoip: "https://gcore.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geoip.dat",
  geosite: "https://gcore.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geosite.dat",
  mmdb: "https://gcore.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb",
  asn: "https://gcore.jsdelivr.net/gh/Loyalsoldier/geoip@release/GeoLite2-ASN.mmdb"
};

// ============================================================
// 节点解析函数
// ============================================================

function getCountryGroupNames(countries, threshold) {
  const filtered = countries.filter(c => c.nodes.length >= threshold);
  filtered.sort((a, b) => (countriesMeta[a.country]?.weight ?? Infinity) - (countriesMeta[b.country]?.weight ?? Infinity));
  return filtered.map(c => c.country + "节点");
}

function stripNodeSuffix(names) {
  const regex = new RegExp("节点$");
  return names.map(name => name.replace(regex, ""));
}

const buildList = (...items) => items.flat().filter(Boolean);

function buildBaseLists({ landing, lowCostNodes, countryGroupNames }) {
  const hasLowCost = lowCostNodes.length > 0 || regexFilter;
  
  const defaultSelector = buildList(
    PROXY_GROUPS.FALLBACK,
    landing && PROXY_GROUPS.LANDING,
    countryGroupNames,
    hasLowCost && PROXY_GROUPS.LOW_COST,
    PROXY_GROUPS.MANUAL,
    "DIRECT"
  );
  
  return {
    defaultProxies: buildList(
      PROXY_GROUPS.SELECT,
      countryGroupNames,
      hasLowCost && PROXY_GROUPS.LOW_COST,
      PROXY_GROUPS.MANUAL,
      PROXY_GROUPS.DIRECT
    ),
    defaultProxiesDirect: buildList(
      PROXY_GROUPS.DIRECT,
      countryGroupNames,
      hasLowCost && PROXY_GROUPS.LOW_COST,
      PROXY_GROUPS.SELECT,
      PROXY_GROUPS.MANUAL
    ),
    defaultSelector,
    defaultFallback: buildList(
      landing && PROXY_GROUPS.LANDING,
      countryGroupNames,
      hasLowCost && PROXY_GROUPS.LOW_COST,
      PROXY_GROUPS.MANUAL,
      "DIRECT"
    )
  };
}

function parseLowCost(proxyData) {
  return (proxyData.proxies || [])
    .filter(p => LOW_COST_REGEX.test(p.name))
    .map(p => p.name);
}

function parseLandingNodes(proxyData) {
  return (proxyData.proxies || [])
    .filter(p => LANDING_REGEX.test(p.name))
    .map(p => p.name);
}

function parseCountries(proxyData) {
  const proxies = proxyData.proxies || [];
  const countryMap = Object.create(null);
  const patterns = {};
  
  // 为每个国家创建正则表达式
  for (const [country, meta] of Object.entries(countriesMeta)) {
    patterns[country] = new RegExp(meta.pattern.replace(/^\(\?i\)/, ""));
  }
  
  // 分类节点
  for (const proxy of proxies) {
    const name = proxy.name || "";
    
    // 排除落地节点和低倍率节点
    if (LANDING_REGEX.test(name) || LOW_COST_REGEX.test(name)) continue;
    
    for (const [country, pattern] of Object.entries(patterns)) {
      if (pattern.test(name)) {
        if (!countryMap[country]) countryMap[country] = [];
        countryMap[country].push(name);
        break;
      }
    }
  }
  
  // 转换为数组格式
  const result = [];
  for (const [country, nodes] of Object.entries(countryMap)) {
    result.push({ country, nodes });
  }
  
  return result;
}

// ============================================================
// 策略组构建函数
// ============================================================

function buildCountryProxyGroups({ countries, landing, loadBalance, regexFilter, countryInfo }) {
  const groups = [];
  const lowCostPattern = "0\\.[0-5]|低倍率|省流|大流量|实验性";
  const type = loadBalance ? "load-balance" : "url-test";
  
  const nodeMap = regexFilter 
    ? null 
    : Object.fromEntries(countryInfo.map(c => [c.country, c.nodes]));
  
  for (const country of countries) {
    const meta = countriesMeta[country];
    if (!meta) continue;
    
    let group;
    
    if (regexFilter) {
      group = {
        name: `${country}节点`,
        icon: meta.icon,
        "include-all": true,
        filter: meta.pattern,
        "exclude-filter": landing ? `${LANDING_PATTERN}|${lowCostPattern}` : lowCostPattern,
        type: type
      };
    } else {
      const nodes = nodeMap[country] || [];
      group = {
        name: `${country}节点`,
        icon: meta.icon,
        type: type,
        proxies: nodes
      };
    }
    
    // 添加 url-test 相关配置
    if (!loadBalance) {
      Object.assign(group, {
        url: "https://cp.cloudflare.com/generate_204",
        interval: 60,
        tolerance: 20,
        lazy: false
      });
    }
    
    groups.push(group);
  }
  
  return groups;
}

function buildProxyGroups({ 
  landing, countries, countryProxyGroups, lowCostNodes, landingNodes,
  defaultProxies, defaultProxiesDirect, defaultSelector, defaultFallback 
}) {
  const hasTaiwan = countries.includes("台湾");
  const hasHK = countries.includes("香港");
  const hasUS = countries.includes("美国");
  
  const preLandingProxies = landing 
    ? defaultSelector.filter(p => p !== PROXY_GROUPS.LANDING && p !== PROXY_GROUPS.FALLBACK) 
    : [];
  
  const groups = [
    // 主选择器
    {
      name: PROXY_GROUPS.SELECT,
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Proxy.png",
      type: "select",
      proxies: defaultSelector
    },
    
    // 手动选择
    {
      name: PROXY_GROUPS.MANUAL,
      icon: "https://gcore.jsdelivr.net/gh/shindgewongxj/WHATSINStash@master/icon/select.png",
      "include-all": true,
      type: "select"
    },
    
    // ========== 自定义扩展：♻️ 自动选择 ==========
    {
      name: PROXY_GROUPS.AUTO_SELECT,
      type: "url-test",
      lazy: true,
      url: "http://www.gstatic.com/generate_204",
      interval: 900,
      use: ["Subscribe"]
    },
    // ========== 自定义扩展结束 ==========
    
    // 落地节点相关
    landing ? {
      name: "前置代理",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Area.png",
      type: "select",
      ...(regexFilter 
        ? { "include-all": true, "exclude-filter": LANDING_PATTERN, proxies: preLandingProxies }
        : { proxies: preLandingProxies }
      )
    } : null,
    
    landing ? {
      name: PROXY_GROUPS.LANDING,
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Airport.png",
      type: "select",
      ...(regexFilter 
        ? { "include-all": true, filter: LANDING_PATTERN }
        : { proxies: landingNodes }
      )
    } : null,
    
    // 故障转移
    {
      name: PROXY_GROUPS.FALLBACK,
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Bypass.png",
      type: "fallback",
      url: "https://cp.cloudflare.com/generate_204",
      proxies: defaultFallback,
      interval: 180,
      tolerance: 20,
      lazy: false
    },
    
    // 服务分组
    {
      name: "静态资源",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Cloudflare.png",
      type: "select",
      proxies: defaultProxies
    },
    {
      name: "AI",
      icon: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/icons/chatgpt.png",
      type: "select",
      proxies: defaultProxies
    },
    {
      name: "Crypto",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Cryptocurrency_3.png",
      type: "select",
      proxies: defaultProxies
    },
    {
      name: "Google",
      icon: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/icons/Google.png",
      type: "select",
      proxies: defaultProxies
    },
    {
      name: "Microsoft",
      icon: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/icons/Microsoft_Copilot.png",
      type: "select",
      proxies: defaultProxies
    },
    {
      name: "YouTube",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/YouTube.png",
      type: "select",
      proxies: defaultProxies
    },
    {
      name: "Bilibili",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/bilibili.png",
      type: "select",
      proxies: hasTaiwan && hasHK 
        ? [PROXY_GROUPS.DIRECT, "台湾节点", "香港节点"] 
        : defaultProxiesDirect
    },
    {
      name: "Bahamut",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Bahamut.png",
      type: "select",
      proxies: hasTaiwan 
        ? ["台湾节点", PROXY_GROUPS.SELECT, PROXY_GROUPS.MANUAL, PROXY_GROUPS.DIRECT] 
        : defaultProxies
    },
    {
      name: "Netflix",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Netflix.png",
      type: "select",
      proxies: defaultProxies
    },
    {
      name: "TikTok",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/TikTok.png",
      type: "select",
      proxies: defaultProxies
    },
    {
      name: "Spotify",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Spotify.png",
      type: "select",
      proxies: defaultProxies
    },
    {
      name: "E-Hentai",
      icon: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/icons/Ehentai.png",
      type: "select",
      proxies: defaultProxies
    },
    {
      name: "Telegram",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Telegram.png",
      type: "select",
      proxies: defaultProxies
    },
    {
      name: "Truth Social",
      icon: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/icons/TruthSocial.png",
      type: "select",
      proxies: hasUS 
        ? ["美国节点", PROXY_GROUPS.SELECT, PROXY_GROUPS.MANUAL] 
        : defaultProxies
    },
    {
      name: "OneDrive",
      icon: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/icons/Onedrive.png",
      type: "select",
      proxies: defaultProxies
    },
    {
      name: "PikPak",
      icon: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/icons/PikPak.png",
      type: "select",
      proxies: defaultProxies
    },
    {
      name: "SSH(22端口)",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Server.png",
      type: "select",
      proxies: defaultProxies
    },
    {
      name: "搜狗输入法",
      icon: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/icons/Sougou.png",
      type: "select",
      proxies: [PROXY_GROUPS.DIRECT, "REJECT"]
    },
    {
      name: PROXY_GROUPS.DIRECT,
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Direct.png",
      type: "select",
      proxies: ["DIRECT", PROXY_GROUPS.SELECT]
    },
    {
      name: "广告拦截",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/AdBlack.png",
      type: "select",
      proxies: ["REJECT", "REJECT-DROP", PROXY_GROUPS.DIRECT]
    },
    
    // 低倍率节点
    lowCostNodes.length > 0 || regexFilter ? {
      name: PROXY_GROUPS.LOW_COST,
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Lab.png",
      type: "url-test",
      url: "https://cp.cloudflare.com/generate_204",
      ...(regexFilter 
        ? { "include-all": true, filter: "(?i)0\\.[0-5]|低倍率|省流|大流量|实验性" }
        : { proxies: lowCostNodes }
      )
    } : null,
    
    // 国家节点分组
    ...countryProxyGroups
  ];
  
  return groups.filter(Boolean);
}

// ============================================================
// 规则构建函数（扩展版本）
// ============================================================

function buildRules({ quicEnabled }) {
  const rules = [...baseRules];
  
  // 移除最后的 MATCH 规则
  const matchRule = rules.pop();
  
  // 在 MATCH 之前插入额外规则
  rules.push(...EXTRA_RULES);
  
  // 重新添加 MATCH
  rules.push(matchRule);
  
  // QUIC 禁用规则
  if (!quicEnabled) {
    rules.unshift("AND,((DST-PORT,443),(NETWORK,UDP)),REJECT");
  }
  
  return rules;
}

// ============================================================
// 主函数
// ============================================================

function main(proxyData) {
  const config = { proxies: proxyData.proxies };
  
  // 解析节点
  const countryInfo = parseCountries(proxyData);
  const lowCostNodes = parseLowCost(proxyData);
  const landingNodes = landing ? parseLandingNodes(proxyData) : [];
  
  // 获取国家分组名称
  const countryGroupNames = getCountryGroupNames(countryInfo, countryThreshold);
  const countries = stripNodeSuffix(countryGroupNames);
  
  // 构建基础列表
  const { defaultProxies, defaultProxiesDirect, defaultSelector, defaultFallback } = 
    buildBaseLists({ landing, lowCostNodes, countryGroupNames });
  
  // 构建国家代理组
  const countryProxyGroups = buildCountryProxyGroups({
    countries,
    landing,
    loadBalance,
    regexFilter,
    countryInfo
  });
  
  // 构建所有策略组
  const proxyGroups = buildProxyGroups({
    landing,
    countries,
    countryProxyGroups,
    lowCostNodes,
    landingNodes,
    defaultProxies,
    defaultProxiesDirect,
    defaultSelector,
    defaultFallback
  });
  
  // 添加 GLOBAL 组
  const proxyGroupNames = proxyGroups.map(g => g.name);
  proxyGroups.push({
    name: "GLOBAL",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png",
    "include-all": true,
    type: "select",
    proxies: proxyGroupNames
  });
  
  // 构建规则
  const rules = buildRules({ quicEnabled });
  
  // 完整配置选项
  if (fullConfig) {
    Object.assign(config, {
      "mixed-port": 7890,
      "redir-port": 7892,
      "tproxy-port": 7893,
      "routing-mark": 7894,
      "allow-lan": true,
      "bind-address": "*",
      ipv6: ipv6Enabled,
      mode: "rule",
      "unified-delay": true,
      "tcp-concurrent": true,
      "find-process-mode": "off",
      "log-level": "info",
      "geodata-loader": "standard",
      "external-controller": ":9999",
      "disable-keep-alive": !keepAliveEnabled,
      profile: { "store-selected": true }
    });
  }
  
  // 合并最终配置
  Object.assign(config, {
    "proxy-groups": proxyGroups,
    "rule-providers": ruleProviders,
    rules: rules,
    sniffer: snifferConfig,
    dns: fakeIPEnabled ? dnsConfigFakeIp : dnsConfig,
    "geodata-mode": true,
    "geox-url": geoxURL
  });
  
  return config;
}