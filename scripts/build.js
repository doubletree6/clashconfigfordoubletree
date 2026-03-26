#!/usr/bin/env node
/**
 * Clash Config Builder
 * 基于 powerfullz/override-rules 构建，注入自定义修改
 * 
 * 修改内容：
 * 1. 添加「♻️ 自动选择」策略组（在 main 函数中动态构建，包含所有节点）
 * 2. 注入额外规则（从 rules/*.txt 读取）
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ========== 配置 ==========
const BASE_URL = 'https://gcore.jsdelivr.net/gh/powerfullz/override-rules@refs/heads/main/convert.min.js';
const OUTPUT_DIR = path.join(__dirname, '..', 'dist');

// ========== 读取规则文件 ==========
function readRulesFile(filename) {
  const rulesDir = path.join(__dirname, '..', 'rules');
  const filePath = path.join(rulesDir, filename);
  
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  return lines
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const lastComma = line.lastIndexOf(',');
      if (lastComma === -1) return null;
      
      const policy = line.slice(lastComma + 1).trim();
      const rulePart = line.slice(0, lastComma).trim();
      const firstComma = rulePart.indexOf(',');
      
      if (firstComma === -1) return null;
      
      const ruleType = rulePart.slice(0, firstComma).trim();
      const value = rulePart.slice(firstComma + 1).trim();
      
      return `${ruleType},${value},${policy}`;
    })
    .filter(Boolean);
}

// ========== 获取基准脚本 ==========
function fetchBaseScript() {
  return new Promise((resolve, reject) => {
    console.log('Fetching base script from powerfullz/override-rules...');
    
    https.get(BASE_URL, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`  -> Downloaded ${data.length} bytes`);
        resolve(data);
      });
    }).on('error', reject);
  });
}

// ========== 注入修改 ==========
function injectModifications(baseScript, extraRules) {
  let script = baseScript;
  
  // 1. 在 PROXY_GROUPS 定义中添加 AUTO_SELECT
  script = script.replace(
    /const PROXY_GROUPS=\{SELECT:"选择代理",MANUAL:"手动选择",FALLBACK:"故障转移",DIRECT:"直连",LANDING:"落地节点",LOW_COST:"低倍率节点"\}/,
    'const PROXY_GROUPS={SELECT:"选择代理",MANUAL:"手动选择",FALLBACK:"故障转移",DIRECT:"直连",LANDING:"落地节点",LOW_COST:"低倍率节点",AUTO_SELECT:"♻️ 自动选择"}'
  );
  
  // 2. 定义 EXTRA_RULES（在参数解析后）
  const extraRulesArray = extraRules.map(r => `"${r}"`).join(',');
  const extraRulesCode = `const EXTRA_RULES=[${extraRulesArray}];`;
  
  script = script.replace(
    /(countryThreshold:countryThreshold\}=buildFeatureFlags\(rawArgs\);)/,
    `$1${extraRulesCode}`
  );
  
  // 3. 在 main 函数中：
  //    - 在构建完策略组后，添加 AUTO_SELECT 策略组
  //    - 注入额外规则
    
  // 使用 include-all: true，让 Substore 自动填充所有节点
  // 这是 Substore 特性，原始 Clash 不支持，但 Substore 会在输出时展开
  const autoSelectCode = `d.splice(2,0,{name:PROXY_GROUPS.AUTO_SELECT,icon:"https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Speed.png","include-all":!0,type:"url-test",url:"https://cp.cloudflare.com/generate_204",interval:900,lazy:!0});`;
  
  script = script.replace(
    /g=d\.map\(e=>e\.name\);d\.push\(\{name:"GLOBAL"/,
    `${autoSelectCode}g=d.map(e=>e.name);d.push({name:"GLOBAL"`
  );
  
  // 4. 注入额外规则（在 MATCH 之前）
  script = script.replace(
    /const h=buildRules\(\{quicEnabled:quicEnabled\}\);/,
    'const h=buildRules({quicEnabled:quicEnabled});const matchRule=h.pop();h.push(...EXTRA_RULES);h.push(matchRule);'
  );
  
  return script;
}

// ========== 生成 Clash YAML ==========
function generateClashYAML(extraRules) {
  const bypassRules = readRulesFile('bypass.txt');
  const customRules = readRulesFile('custom.txt');
  const proxyRules = readRulesFile('proxy.txt');
  
  // 替换规则中的策略组名称以匹配 clash.yaml
  const policyNameMap = {
    '🚀 手动切换': '手动选择',
    '🌏 全球加速': '选择代理',
    '🇸🇬 狮城节点': '手动选择',
    '🇺🇲 美国节点': '手动选择',
    '🇯🇵 日本节点': '手动选择'
  };
  
  const mappedRules = [...bypassRules, ...customRules, ...proxyRules].map(rule => {
    let mappedRule = rule;
    for (const [oldName, newName] of Object.entries(policyNameMap)) {
      if (rule.endsWith(oldName)) {
        mappedRule = rule.replace(oldName, newName);
        break;
      }
    }
    return mappedRule;
  });
  
  return `# Clash 配置文件
# 基于 powerfullz/override-rules，由 build.js 自动生成
# 使用方式：将 YOUR_SUBSCRIPTION_URL 替换为你的订阅地址

port: 7890
socks-port: 7891
mixed-port: 7893
allow-lan: true
bind-address: "*"
mode: rule
log-level: info
ipv6: false
external-controller: 127.0.0.1:9090

dns:
  enable: true
  ipv6: false
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  fake-ip-filter:
    - "*.lan"
    - localhost.ptlogin2.qq.com
    - "+.srv.nintendo.net"
    - "+.stun.playstation.net"
    - "+.msftconnecttest.com"
    - "+.msftncsi.com"
    - "+.xboxlive.com"
  nameserver:
    - 223.5.5.5
    - 119.29.29.29
  fallback:
    - https://cloudflare-dns.com/dns-query
    - https://dns.google/dns-query
  fallback-filter:
    geoip: true
    geoip-code: CN

proxy-providers:
  Subscribe:
    type: http
    interval: 86400
    url: YOUR_SUBSCRIPTION_URL
    path: ./proxy_providers/tmp.yaml
    health-check:
      enable: true
      url: http://www.gstatic.com/generate_204
      interval: 1800

proxies: null

proxy-groups:
  - name: 选择代理
    type: select
    use:
      - Subscribe
  - name: 手动选择
    type: select
    use:
      - Subscribe
  - name: ♻️ 自动选择
    type: url-test
    lazy: true
    url: http://www.gstatic.com/generate_204
    interval: 900
    use:
      - Subscribe
  - name: 故障转移
    type: fallback
    url: http://www.gstatic.com/generate_204
    interval: 180
    use:
      - Subscribe
  - name: 静态资源
    type: select
    use:
      - Subscribe
  - name: AI
    type: select
    use:
      - Subscribe
  - name: Crypto
    type: select
    use:
      - Subscribe
  - name: Google
    type: select
    use:
      - Subscribe
  - name: Microsoft
    type: select
    use:
      - Subscribe
  - name: YouTube
    type: select
    use:
      - Subscribe
  - name: Bilibili
    type: select
    use:
      - Subscribe
  - name: Netflix
    type: select
    use:
      - Subscribe
  - name: TikTok
    type: select
    use:
      - Subscribe
  - name: Spotify
    type: select
    use:
      - Subscribe
  - name: E-Hentai
    type: select
    use:
      - Subscribe
  - name: Telegram
    type: select
    use:
      - Subscribe
  - name: OneDrive
    type: select
    use:
      - Subscribe
  - name: PikPak
    type: select
    use:
      - Subscribe
  - name: SSH(22端口)
    type: select
    use:
      - Subscribe
  - name: 搜狗输入法
    type: select
    proxies:
      - DIRECT
      - REJECT
  - name: 直连
    type: select
    proxies:
      - DIRECT
      - 选择代理
  - name: 广告拦截
    type: select
    proxies:
      - REJECT
      - REJECT-DROP
      - DIRECT

rule-providers:
  Direct:
    type: http
    behavior: domain
    interval: 86400
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Direct/Direct.yaml
    path: ./ruleset/Direct.yaml
  Lan:
    type: http
    behavior: classical
    interval: 86400
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Lan/Lan.yaml
    path: ./ruleset/Lan.yaml
  Ad:
    type: http
    behavior: domain
    interval: 86400
    url: https://gcore.jsdelivr.net/gh/217heidai/adblockfilters@main/rules/adblockmihomolite.yaml
    path: ./ruleset/adblock_reject.yaml
  ProxyLite:
    type: http
    behavior: classical
    interval: 86400
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/ProxyLite/ProxyLite.yaml
    path: ./ruleset/ProxyLite.yaml
  ChinaIP:
    type: http
    behavior: ipcidr
    interval: 86400
    url: https://cdn.jsdelivr.net/gh/soffchen/GeoIP2-CN@release/clash-rule-provider.yml
    path: ./ruleset/ChinaIP.yaml

rules:
${mappedRules.map(r => `  - ${r}`).join('\n')}
  - RULE-SET,Direct,DIRECT
  - RULE-SET,Lan,DIRECT
  - RULE-SET,Ad,广告拦截
  - RULE-SET,ProxyLite,手动选择
  - RULE-SET,ChinaIP,DIRECT
  - GEOIP,CN,DIRECT
  - MATCH,选择代理
`;
}

// ========== 主函数 ==========
async function main() {
  console.log('Building clash config...\n');
  
  // 读取规则
  const bypassRules = readRulesFile('bypass.txt');
  const customRules = readRulesFile('custom.txt');
  const proxyRules = readRulesFile('proxy.txt');
  const extraRules = [...bypassRules, ...customRules, ...proxyRules];
  
  console.log(`Loaded rules: bypass=${bypassRules.length}, custom=${customRules.length}, proxy=${proxyRules.length}`);
  console.log(`Total extra rules: ${extraRules.length}\n`);
  
  // 获取基准脚本
  const baseScript = await fetchBaseScript();
  
  // 注入修改
  console.log('\nInjecting modifications...');
  console.log('  -> Adding AUTO_SELECT proxy group (dynamic, includes all nodes)');
  console.log('  -> Injecting extra rules');
  const modifiedScript = injectModifications(baseScript, extraRules);
  
  // 确保输出目录存在
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // 输出 substore.js
  const substorePath = path.join(OUTPUT_DIR, 'substore.js');
  fs.writeFileSync(substorePath, modifiedScript);
  console.log(`\n✅ Generated: ${substorePath} (${modifiedScript.length} bytes)`);
  
  // 输出 clash.yaml
  const yamlContent = generateClashYAML(extraRules);
  const yamlPath = path.join(OUTPUT_DIR, 'clash.yaml');
  fs.writeFileSync(yamlPath, yamlContent);
  console.log(`✅ Generated: ${yamlPath} (${yamlContent.length} bytes)`);
  
  // 保存规则 JSON（调试用）
  fs.writeFileSync(path.join(OUTPUT_DIR, 'extra-rules.json'), JSON.stringify({
    total: extraRules.length,
    bypass: bypassRules,
    custom: customRules,
    proxy: proxyRules
  }, null, 2));
  
  console.log('\n✅ Build complete!');
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});