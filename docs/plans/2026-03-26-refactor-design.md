# ClashConfig 重构设计

## 目标

基于 powerfullz/override-rules 基准配置，构建可定制的 Clash 配置生成器，输出两种格式：
1. **substore.js** - 直接导入 Substore 使用
2. **clash.yaml** - 直接导入 Clash 客户端

## 项目结构

```
clashconfigfordoubletree/
├── rules/
│   ├── bypass.txt      # 直连规则
│   ├── custom.txt      # 自定义规则
│   └── proxy.txt       # 代理规则
├── scripts/
│   ├── build.js        # 构建脚本（合并配置）
│   └── substore.js     # 输出产物（自动生成）
├── .github/workflows/
│   └── deploy.yml      # CI/CD 工作流
├── clash.yaml          # 输出产物（自动生成）
└── README.md
```

## 核心功能

### 1. 基准配置

来源：`https://gcore.jsdelivr.net/gh/powerfullz/override-rules@refs/heads/main/convert.min.js`

包含：
- 完整的 proxy-groups 配置
- rule-providers 定义
- rules 规则列表
- DNS、sniffer 等基础配置
- 国家节点分组（香港、日本、美国等）

### 2. 新增策略组

在基准配置基础上新增：

```javascript
{
  name: '自动选择',
  type: 'url-test',
  lazy: true,
  url: 'http://www.gstatic.com/generate_204',
  interval: 900,
  use: ['Subscribe']
}
```

### 3. 额外规则文件

**rules/bypass.txt** - 直连规则
```
# 格式：RULE,策略组
DOMAIN-SUFFIX,example.com,DIRECT
DOMAIN-KEYWORD,myapp,DIRECT
```

**rules/custom.txt** - 自定义规则
```
# 格式：RULE,策略组
DOMAIN-SUFFIX,mystuff.com,香港节点
DOMAIN-KEYWORD,private,手动选择
```

**rules/proxy.txt** - 代理规则
```
# 格式：RULE,策略组
DOMAIN-SUFFIX,blocked-site.com,全球加速
DOMAIN-KEYWORD,sensitive,选择代理
```

### 4. 规则合并逻辑

```
最终 rules = [
  ...bypass 规则,
  ...custom 规则,
  ...proxy 规则,
  ...基准配置的 rules（去掉 MATCH）,
  MATCH,选择代理
]
```

规则插入位置：在 MATCH 规则之前，确保自定义规则优先匹配。

## 构建流程

### GitHub Actions 工作流

```yaml
1. Checkout 仓库
2. 获取基准配置（远程 JS）
3. 读取本地 rules/*.txt
4. 运行构建脚本：
   - 合并配置
   - 生成 substore.js
   - 生成 clash.yaml
5. 部署到 gh-pages
```

### 本地开发

```bash
# 安装依赖
npm install

# 本地构建预览
npm run build

# 输出：
# - dist/substore.js
# - dist/clash.yaml
```

## 输出产物

### substore.js

完整可用的 Substore 脚本，包含：
- 基准配置所有逻辑
- 新增的「自动选择」策略组
- 内嵌的额外规则

使用方式：
1. Substore → 订阅 → 添加脚本
2. URL: `https://<username>.github.io/clashconfigfordoubletree/substore.js`

### clash.yaml

完整可用的 Clash 配置文件，包含：
- proxy-providers（订阅源）
- proxy-groups（策略组）
- rule-providers（规则集）
- rules（分流规则）
- DNS、sniffer 等配置

使用方式：
1. Clash 客户端 → 配置 → 远程配置
2. URL: `https://<username>.github.io/clashconfigfordoubletree/clash.yaml`

## 配置参数

支持通过 URL 参数控制功能（继承自基准配置）：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| landing | 启用落地节点功能 | false |
| ipv6 | 启用 IPv6 支持 | false |
| full | 输出完整配置 | false |
| fakeip | DNS 使用 FakeIP 模式 | false |
| quic | 允许 QUIC 流量 | false |
| regex | 使用正则过滤模式 | false |

示例：
```
https://...substore.js#landing=true&ipv6=true
```

## 维护说明

### 添加新规则

1. 编辑对应的 rules/*.txt 文件
2. 推送到 main 分支
3. GitHub Actions 自动重新构建

### 更新基准配置

基准配置通过 jsdelivr CDN 引用，更新方式：
- 使用 `@refs/heads/main` 自动跟随最新版本
- 如需锁定版本，改为 `@v1.0.0` 标签

## 下一步

实现计划：
1. 创建 rules/ 目录和示例规则文件
2. 编写构建脚本 scripts/build.js
3. 编写 substore.js 模板
4. 配置 GitHub Actions 工作流
5. 测试输出产物