# Clash Config for DoubleTree

基于 [powerfullz/override-rules](https://github.com/powerfullz/override-rules) 的 Clash 配置生成器，支持自定义规则。

## 订阅地址

| 文件 | 用途 |
|------|------|
| `substore.js` | Substore 订阅脚本 |
| `clash.yaml` | Clash 配置文件 |

### GitHub Pages

```
https://doubletree6.github.io/clashconfigfordoubletree/substore.js
https://doubletree6.github.io/clashconfigfordoubletree/clash.yaml
```

### jsdelivr CDN（推荐，国内更快）

```
https://gcore.jsdelivr.net/gh/doubletree6/clashconfigfordoubletree@gh-pages/substore.js
https://gcore.jsdelivr.net/gh/doubletree6/clashconfigfordoubletree@gh-pages/clash.yaml
```

## 使用方法

### Substore

1. 打开 Substore App
2. 添加订阅 → 选择「脚本」类型
3. URL 填写上面的 `substore.js` 地址

### Clash 客户端

1. Clash → 配置 → 远程配置
2. URL 填写上面的 `clash.yaml` 地址

## 自定义规则

### 规则文件

| 文件 | 说明 | 规则数 |
|------|------|--------|
| `rules/bypass.txt` | 直连规则 | 19 条 |
| `rules/custom.txt` | 手动切换规则 | 5 条 |
| `rules/proxy.txt` | 代理规则 | 8 条 |

### 规则格式

```
# 注释行
DOMAIN-SUFFIX,example.com,DIRECT
DOMAIN-KEYWORD,google,🇸🇬 狮城节点
IP-CIDR,100.64.0.0/10,DIRECT
PROCESS-NAME,WeChat,DIRECT
```

### 当前规则概览

**直连 (bypass.txt)**
- Tailscale、ZeroTier
- 自定义域名（qinglin、volcengine、follow.is 等）
- Steam 相关
- 学术网站（sciencedirect、acs.org）
- 进程（onedrive、docker、WeChat、zotero）

**手动切换 (custom.txt)**
- AI：generativelanguage、ohmygpt
- 游戏：intlgame、nikke
- 其他：mtalk

**代理 (proxy.txt)**
- AI：aistudio、huggingface
- Google：google、googleapis、copilot
- 国家节点：edisonscientific（美国）、cline（日本）

### 修改规则

1. 编辑 `rules/*.txt` 文件
2. Push 到 main 分支
3. GitHub Actions 自动构建部署

## 策略组

| 策略组 | 类型 | 说明 |
|--------|------|------|
| 🚀 手动切换 | select | 手动选择节点 |
| ♻️ 自动选择 | url-test | 自动测速选最快 |
| 🌏 全球加速 | select | 全球代理服务 |
| 🇭🇰 香港节点 | url-test | 香港节点组 |
| 🇯🇵 日本节点 | url-test | 日本节点组 |
| 🇺🇲 美国节点 | url-test | 美国节点组 |
| 🇨🇳 台湾节点 | url-test | 台湾节点组 |
| 🇸🇬 狮城节点 | url-test | 新加坡节点组 |
| 🐟 兜底分流 | select | 兜底策略 |

## Substore 参数

```
https://...substore.js#landing=true&ipv6=true
```

| 参数 | 说明 | 默认值 |
|------|------|--------|
| landing | 启用落地节点功能 | false |
| ipv6 | 启用 IPv6 支持 | false |
| full | 输出完整配置 | false |
| fakeip | DNS 使用 FakeIP 模式 | false |
| quic | 允许 QUIC 流量 | false |
| regex | 使用正则过滤模式 | false |

## 本地开发

```bash
git clone https://github.com/doubletree6/clashconfigfordoubletree.git
cd clashconfigfordoubletree
node scripts/build.js
ls -la dist/
```

## 感谢

- [powerfullz/override-rules](https://github.com/powerfullz/override-rules) - 基准配置
- [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) - 规则集