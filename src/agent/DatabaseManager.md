# DatabaseManager 说明文档

## 概述

`DatabaseManager.ts` 是一个数据库管理器类，负责管理基于 SQLite 的团队和 Agent 数据存储。它使用 `sql.js` 库在客户端环境中提供完整的数据库功能，无需独立的数据库服务器。

## 核心功能

### 1. 数据库初始化与管理
- 自动创建数据库文件和目录结构
- 支持 per-team 数据库隔离（每个团队有独立的数据库文件）
- 自动初始化数据库表结构和索引
- 内存数据库与文件持久化之间的转换

### 2. 数据查询与操作
- 提供 `query()` 方法执行 SELECT 查询
- 提供 `run()` 方法执行 INSERT、UPDATE、DELETE 操作
- 自动处理 SQL 参数绑定和转义
- 自动保存数据库更改到文件

### 3. 连接管理
- 懒加载 sql.js 库（首次使用时初始化）
- 数据库连接复用
- 自动保存和关闭连接

## 数据库结构

### 表结构

#### 1. agents 表
存储团队中的 Agent 信息：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | TEXT | Agent 名称 |
| role | TEXT | Agent 角色 |
| class | TEXT | Agent 类别 |
| status | TEXT | 状态（默认 'active'） |
| is_vocal | INTEGER | 是否发声（0/1） |
| is_user | INTEGER | 是否为用户（0/1） |
| coins | INTEGER | 金币数量 |
| goal_description | TEXT | 目标描述 |
| team_name | TEXT | 所属团队名称 |

#### 2. sessions 表
存储聊天会话信息：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 会话 ID（主键） |
| directory_path | TEXT | 会话目录路径（唯一） |
| title | TEXT | 会话标题 |
| created_at | INTEGER | 创建时间（时间戳） |
| updated_at | INTEGER | 更新时间（时间戳） |
| message_count | INTEGER | 消息数量 |

#### 3. messages 表
存储聊天消息历史：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| session_id | TEXT | 所属会话 ID（外键） |
| role | TEXT | 角色（user/assistant/system） |
| content | TEXT | 消息内容 |
| timestamp | INTEGER | 时间戳 |

### 索引
- `idx_agents_name`: agents.name 字段索引
- `idx_agents_team`: agents.team_name 字段索引
- `idx_messages_session`: messages.session_id 字段索引
- `idx_messages_timestamp`: messages.timestamp 降序索引

## 主要方法

### 构造函数
- 接受可选的 agents 目录参数
- 如果未指定，从环境变量读取或使用默认值
- 自动创建所需目录结构

### 连接方法
- 连接到指定团队的数据库
- 如果数据库不存在，自动创建并初始化表结构
- 返回数据库实例供后续操作使用

### 查询方法
- 执行 SELECT 查询操作
- 支持参数化查询，防止 SQL 注入
- 返回查询结果数组，每个结果为对象形式

### 更新方法
- 执行 INSERT、UPDATE、DELETE 等更新操作
- 支持参数绑定
- 自动保存更改到文件

### 工具方法
- 获取团队数据库文件路径
- 检查团队数据库是否存在
- 手动保存数据库到文件
- 关闭数据库连接
- 获取 agents 数据目录

## 使用说明

### 基本流程
1. 创建 DatabaseManager 实例，指定或使用默认的数据目录
2. 调用 connect 方法连接到指定团队的数据库
3. 使用 query 方法进行数据查询
4. 使用 run 方法进行数据插入、更新、删除
5. 完成后调用 close 方法关闭连接（会自动保存）

### 数据操作
- 所有数据库操作都需要指定团队名称
- SQL 语句使用问号作为参数占位符
- 参数会自动进行类型转换和转义处理
- 更新操作会自动保存到文件

## 技术细节

### sql.js 特性
- 使用 `sql.js` 在内存中运行 SQLite
- 数据库导出为二进制格式持久化到磁盘
- 不支持原生的参数绑定，通过字符串替换实现（已处理转义）

### 文件结构
```
agents-data/
└── {team-name}/
    └── agents.db
```

### 参数处理
- `NULL` 值自动转换为 SQL NULL
- 数字类型直接使用
- 字符串类型自动转义单引号（`'` → `''`）
- 所有参数都经过安全处理，防止 SQL 注入

## 注意事项

1. **并发访问**：当前实现不支持多进程并发写入，仅适合单进程使用
2. **性能**：数据量较大时，考虑定期优化或使用服务端数据库
3. **备份**：数据库文件存储在本地，需要定期备份
4. **错误处理**：建议在生产环境中添加更完善的错误处理和日志记录
5. **SQL 注入**：虽然已做参数转义，但仍需谨慎处理用户输入

## 依赖项

- `sql.js`: SQLite 的 JavaScript/WebAssembly 版本
- Node.js 内置模块：`path`, `fs`

## 适用场景

- 桌面应用程序的本地数据存储
- 小型团队的 Agent 和会话管理
- 需要离线工作的应用场景
- 快速原型开发和测试

## 后续优化建议

1. 添加数据库迁移机制
2. 实现连接池管理
3. 添加查询结果缓存
4. 支持事务操作
5. 添加数据库压缩和优化功能
