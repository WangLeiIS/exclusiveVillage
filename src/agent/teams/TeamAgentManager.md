# TeamAgentManager 说明文档

## 概述

TeamAgentManager.ts 是团队内部 Agent 管理器类，负责管理特定团队内的 AI Agent 实例。该类提供 Agent 的完整 CRUD（创建、读取、更新、删除）操作，专注于团队内部的 Agent 资源管理。

该文件与 TeamManager 协同工作，TeamManager 负责团队的生命周期管理，而 TeamAgentManager 负责团队内 Agent 的管理。每个团队都有独立的数据库存储其 Agent 信息。

## 核心功能

- **Agent 列表查询**：列出指定团队中的所有 Agent，按 ID 排序
- **Agent 创建**：创建新的 Agent 并自动分配默认属性（status='active', coins=0）
- **Agent 信息更新**：更新 Agent 的角色和目标描述
- **Agent 删除**：从团队中删除指定的 Agent
- **单个 Agent 查询**：获取特定 Agent 的详细信息
- **综合查询**：获取所有团队及其 Agent 的完整数据结构

## 依赖关系

### 该文件使用的依赖

| 依赖项 | 用途 |
|--------|------|
| DatabaseManager | 数据库操作的基础类，负责团队数据库的连接和管理 |
| Logger | 日志系统，记录操作日志和错误信息 |
| TeamManager | 团队管理器，用于获取团队列表 |

### 使用该文件的模块

| 使用者 | 用途 |
|--------|------|
| src/main/handlers/agentHandlers.ts | 主进程中处理 Agent 相关的 IPC 通信 |
| src/main/handlers/teamHandlers.ts | 主进程中处理包含 Agent 信息的团队查询 |
| src/agent/teams/TeamManager.ts | 团队管理器在创建团队时自动创建默认 Agent |

### 集成方式

TeamAgentManager 通过单例模式导出 `teamAgentManager` 实例，所有处理器直接导入该单例使用 Agent 管理功能。每个 Agent 操作都需要指定团队名称，确保 Agent 数据的团队隔离。

TeamAgentManager 与 DatabaseManager 紧密集成，通过调用 DatabaseManager 的 `connect`、`close`、`run`、`exec` 等方法进行数据库操作。

## 代码风险和异味

### 安全问题

- **SQL 注入风险**：多处使用字符串拼接构建 SQL 查询，存在严重的安全隐患
  - 第 134 行：`SELECT * FROM agents WHERE name = '${config.name}'`
  - 第 202 行：`DELETE FROM agents WHERE name = '${agentName}'`
  - 第 216 行：`SELECT * FROM agents WHERE name = '${agentName}'`
  - 攻击者可以通过构造特殊的 agentName 来执行任意 SQL 命令

- **缺少输入验证**：所有公共方法都没有验证输入参数的合法性和安全性
  - 没有验证 teamName 格式，可能导致路径遍历攻击
  - 没有检查 agentName 是否包含特殊字符（如 `../`）
  - 没有验证 role、goal_description 等字段的长度和内容

### 错误处理

- **不完整的错误处理**：多个方法缺少适当的错误处理机制
  - `createAgent` 查询结果时不检查是否有数据就直接访问，可能导致运行时错误
  - `deleteAgent` 不检查删除是否成功
  - `getAgent` 返回 null 但调用方可能没有处理 null 情况

### 资源管理

- **数据库连接管理不当**：每个方法都手动调用 `connect` 和 `close`，存在资源泄漏风险
  - 如果中间操作抛出异常，`close` 不会被调用
  - 没有 try-finally 保证连接一定会被关闭
  - 频繁开关连接可能影响性能

### 代码质量问题

- **魔法数字**：使用整数 1 和 0 来表示布尔值，可读性较差
- **代码重复**：多处存在相似的数据库查询和结果处理逻辑，可以提取为私有方法
- **数据库字段硬编码**：SQL 查询中直接使用字段名索引（如 row[0], row[1]），可维护性差

### 并发和竞态条件

- **无并发控制**：如果多个请求同时操作同一个团队的 Agent，可能导致数据竞争
- **循环中的异步操作**：`getAllTeamsWithAgents` 方法中循环调用 `listAgents`，效率较低

## 如何测试

### 单元测试策略

- **Agent 列表测试**：验证能够正确返回团队中的所有 Agent
- **Agent 创建测试**：验证 Agent 能够正确创建并保存到数据库
- **Agent 更新测试**：验证允许的字段能够正确更新
- **Agent 删除测试**：验证 Agent 被正确删除
- **单个 Agent 查询测试**：验证能够返回正确的 Agent 信息，包括不存在的情况
- **综合查询测试**：验证 `getAllTeamsWithAgents` 能够返回正确的数据结构

### Mock 和 Stub 建议

- **Mock DatabaseManager**：创建 mock 对象来模拟数据库操作
- **Mock Logger**：验证日志记录是否正确调用
- **使用内存数据库**：配合 DatabaseManager 使用内存数据库进行快速测试

### 集成测试考虑

- **真实数据库操作**：使用真实的 SQLite 数据库测试完整的 CRUD 流程
- **跨团队测试**：验证不同团队的 Agent 数据是否正确隔离

### 安全测试

- **SQL 注入测试**：尝试在 agentName 中注入恶意 SQL 语句
- **路径遍历测试**：尝试使用包含 `../` 的 teamName 访问系统文件

## 注意事项

### 性能考虑

- **数据库连接开销**：每个操作都会打开和关闭数据库连接，频繁操作时可能影响性能
- **批量查询效率**：`getAllTeamsWithAgents` 需要多次数据库查询，可以考虑优化

### 配置要求

- **DatabaseManager 依赖**：必须正确配置 DatabaseManager
- **团队必须存在**：所有 Agent 操作都需要团队已存在

### 使用流程

- **必须先有团队**：Agent 必须属于某个团队，团队需要先创建
- **团队隔离**：每个 Agent 操作都必须指定团队名称

### 常见陷阱

- **Agent 名称唯一性**：在同一团队内 Agent 名称应该唯一，但当前实现没有强制约束
- **数据库连接泄漏**：如果方法在关闭连接前抛出异常，可能导致连接泄漏
- **并发操作风险**：多个请求同时操作同一团队的 Agent 可能导致数据不一致

### 维护建议

- **修复 SQL 注入**：将所有字符串拼接的查询改为参数化查询（最高优先级）
- **添加输入验证**：验证所有输入参数的格式、长度和安全性
- **改进错误处理**：为每个方法添加完善的错误处理和资源清理
- **使用连接池**：考虑使用数据库连接池，而不是每次操作都开关连接
- **添加事务支持**：对于复杂的操作，使用数据库事务确保数据一致性
- **优化查询性能**：对于 `getAllTeamsWithAgents`，考虑使用批量查询或缓存

## 文档版本信息

- **最后更新**: 2025-04-29
- **当前版本**: 1.0
- **最近变更**: 从 TeamManager 拆分，专注于 Agent 管理

### 版本历史

**v1.0 (2025-04-29)** - 初始版本
- 从原 TeamManager 拆分，专注于团队内 Agent 管理
- 完整的 Agent CRUD 操作实现
- 统一日志记录方式
