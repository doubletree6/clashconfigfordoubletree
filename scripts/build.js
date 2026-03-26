#!/usr/bin/env node
/**
 * Clash Config Builder
 * 生成 substore.js 和 clash.yaml
 */

const fs = require('fs');
const path = require('path');

// 读取规则文件
function readRulesFile(filename) {
  const rulesDir = path.join(__dirname, '..', 'rules');
  const filePath = path.join(rulesDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Warning: ${filename} not found, skipping`);
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  return lines
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      // 解析格式: RULE,value,policy
      // 支持多种 value 中可能有逗号的情况，最后一个逗号后面是 policy
      const lastComma = line.lastIndexOf(',');
      if (lastComma === -1) return null;
      
      const policy = line.slice(lastComma + 1).trim();
      const rulePart = line.slice(0, lastComma).trim();
      const firstComma = rulePart.indexOf(',');
      
      if (firstComma === -1) return null;
      
      const ruleType = rulePart.slice(0, firstComma).trim();
      const value = rulePart.slice(firstComma + 1).trim();
      
      return {
        type: ruleType,
        value: value,
        policy: policy,
        raw: line
      };
    })
    .filter(Boolean);
}

// 生成 substore.js
function generateSubstoreJS(clashRules) {
  const templatePath = path.join(__dirname, 'substore.template.js');
  let template = fs.readFileSync(templatePath, 'utf-8');
  
  // 替换 EXTRA_RULES 占位符
  const rulesArray = clashRules.map(r => `  "${r}"`).join(',\n');
  const extraRulesCode = `const EXTRA_RULES = [\n${rulesArray}\n];`;
  
  template = template.replace(
    /const EXTRA_RULES = \[[\s\S]*?\];/,
    extraRulesCode
  );
  
  return template;
}

// 生成 clash.yaml
function generateClashYAML(clashRules) {
  // YAML 配置模板
  return `# Clash 配置文件
# 由 build.js 自动生成

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
  nameserver:
    - 223.5.5.5
    - 119.29.29.29
  fallback:
    - https://cloudflare-dns.com/dns-query
    - https://dns.google/dns-query

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
  - name: 🚀 手动切换
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
  - name: 🌏 全球加速
    type: select
    proxies:
      - ♻️ 自动选择
      - 🚀 手动切换
      - DIRECT
  - name: 🇭🇰 香港节点
    type: url-test
    lazy: true
    url: http://www.gstatic.com/generate_204
    interval: 900
    use:
      - Subscribe
    filter: "港|HK|(?i)Hong"
  - name: 🇯🇵 日本节点
    type: url-test
    lazy: true
    url: http://www.gstatic.com/generate_204
    interval: 900
    use:
      - Subscribe
    filter: "日|东京|JP|(?i)Japan"
  - name: 🇺🇲 美国节点
    type: url-test
    lazy: true
    url: http://www.gstatic.com/generate_204
    interval: 900
    use:
      - Subscribe
    filter: "美|US|(?i)States|American"
  - name: 🇨🇳 台湾节点
    type: url-test
    lazy: true
    url: http://www.gstatic.com/generate_204
    interval: 900
    use:
      - Subscribe
    filter: "台|湾|TW|(?i)Taiwan"
  - name: 🇸🇬 狮城节点
    type: url-test
    lazy: true
    url: http://www.gstatic.com/generate_204
    interval: 900
    use:
      - Subscribe
    filter: "新|坡|SG|(?i)Singapore"
  - name: 🐟 兜底分流
    type: select
    proxies:
      - ♻️ 自动选择
      - 🚀 手动切换
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
${clashRules.map(r => `  - ${r}`).join('\n')}
  - RULE-SET,Direct,DIRECT
  - RULE-SET,Lan,DIRECT
  - RULE-SET,Ad,REJECT
  - RULE-SET,ProxyLite,🌏 全球加速
  - RULE-SET,ChinaIP,DIRECT
  - GEOIP,CN,DIRECT
  - MATCH,🐟 兜底分流
`;
}

// 主函数
function build() {
  console.log('Building clash config...');
  
  // 读取所有规则
  const bypassRules = readRulesFile('bypass.txt');
  const customRules = readRulesFile('custom.txt');
  const proxyRules = readRulesFile('proxy.txt');
  
  console.log(`Loaded rules: bypass=${bypassRules.length}, custom=${customRules.length}, proxy=${proxyRules.length}`);
  
  // 合并规则（按顺序：bypass -> custom -> proxy）
  const allExtraRules = [...bypassRules, ...customRules, ...proxyRules];
  
  // 生成 Clash 格式规则
  const clashRules = allExtraRules.map(r => `${r.type},${r.value},${r.policy}`);
  
  // 确保输出目录存在
  const distDir = path.join(__dirname, '..', 'dist');
  fs.mkdirSync(distDir, { recursive: true });
  
  // 生成 substore.js
  console.log('\nGenerating substore.js...');
  const substoreJS = generateSubstoreJS(clashRules);
  fs.writeFileSync(path.join(distDir, 'substore.js'), substoreJS);
  console.log(`  -> dist/substore.js (${substoreJS.length} bytes)`);
  
  // 生成 clash.yaml
  console.log('\nGenerating clash.yaml...');
  const clashYAML = generateClashYAML(clashRules);
  fs.writeFileSync(path.join(distDir, 'clash.yaml'), clashYAML);
  console.log(`  -> dist/clash.yaml (${clashYAML.length} bytes)`);
  
  // 保存规则 JSON（调试用）
  fs.writeFileSync(path.join(distDir, 'extra-rules.json'), JSON.stringify({
    total: allExtraRules.length,
    bypass: bypassRules,
    custom: customRules,
    proxy: proxyRules,
    clashRules: clashRules
  }, null, 2));
  
  console.log('\n✅ Build complete!');
  console.log(`Total extra rules: ${clashRules.length}`);
}

build();