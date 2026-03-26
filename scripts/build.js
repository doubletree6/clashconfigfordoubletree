#!/usr/bin/env node
/**
 * Clash Config Builder
 * 解析规则文件，生成中间输出
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
  
  // 输出规则列表
  const outputPath = path.join(distDir, 'extra-rules.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    total: allExtraRules.length,
    bypass: bypassRules,
    custom: customRules,
    proxy: proxyRules,
    clashRules: clashRules
  }, null, 2));
  
  console.log(`\nExtra rules saved to ${outputPath}`);
  console.log(`Total rules: ${allExtraRules.length}`);
  
  // 打印规则预览
  console.log('\nRules preview:');
  clashRules.slice(0, 5).forEach(r => console.log(`  ${r}`));
  if (clashRules.length > 5) console.log(`  ... and ${clashRules.length - 5} more`);
}

build();