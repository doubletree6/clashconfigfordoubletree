# Clash Config for DoubleTree

基于 [powerfullz/override-rules](https://github.com/powerfullz/override-rules) 的 Clash 配置生成器，支持自定义规则。

## 输出产物

| 文件 | 用途 | URL |
|------|------|-----|
| `substore.js` | Substore 订阅脚本 | `https://<username>.github.io/clashconfigfordoubletree/substore.js` |
| `clash.yaml` | Clash 配置文件 | `https://<username>.github.io/clashconfigfordoubletree/clash.yaml` |

## 使用方法

### Substore

1. 打开 Substore App
2. 添加订阅 → 选择「脚本」类型
3. URL 填写：`https://<username>.github.io/clashconfigfordoubletree/substore.js`

### Clash 客户端

1. Clash → 配置 → 远程配置
2. URL 填写：`https://<username>.github.io/clashconfigfordoubletree/clash.yaml`

## 自定义规则

### 规则文件

| 文件 | 说明 |
|------|------|
| `rules/bypass.txt` | 直连规则 |
| `rules/custom.txt` | 自定义规则 |
| `rules/proxy.txt` | 代理规则 |

### 规则格式

每行一条规则，格式：`规则类型,值,策略组`

```
# 注释行
DOMAIN-SUFFIX,example.com,DIRECT
DOMAIN-KEYWORD,google,🇸🇬 狮城节点
IP-CIDR,100.64.0.0/10,DIRECT
PROCESS-NAME,WeChat,DIRECT
```

### 添加规则

1. 编辑对应的 `rules/*.txt` 文件
2. Push 到 main 分支
3. GitHub Actions 自动重新构建

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
| 🪩Frpservice | select | 自定义服务 |
| 🐟 兜底分流 | select | 兜底策略 |

## Substore 参数

支持 URL 参数控制功能（`#` 后面）：

```
https://...substore.js#landing=true&ipv6=true
```

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `landing` | 启用落地节点功能 | false |
| `ipv6` | 启用 IPv6 支持 | false |
| `full` | 输出完整配置 | false |
| `fakeip` | DNS 使用 FakeIP 模式 | false |
| `quic` | 允许 QUIC 流量 | false |
| `regex` | 使用正则过滤模式 | false |

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/doubletree6/clashconfigfordoubletree.git
cd clashconfigfordoubletree

# 安装依赖（可选）
npm install

# 本地构建
node scripts/build.js

# 查看输出
ls -la dist/
```

## 感谢

- [powerfullz/override-rules](https://github.com/powerfullz/override-rules) - 基准配置
- [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) - 规则集