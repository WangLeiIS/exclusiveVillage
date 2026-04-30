# SessionManager 说明文档

## 概述

`SessionManager.ts` 是一个 Agent 会话管理器，负责管理多个 Agent 实例的生命周期。该文件实现了一个单例模式的会话管理服务，用于创建、复用和清理 Agent 会话，确保会话资源的有效利用和及时释放。

该文件在项目中扮演核心服务角色，为主进程的各种处理器（Agent、Chat、Team、CWD 等处理器）提供会话管理能力。

## 核心功能

- **多会话支持**：每个用户会话都有独立的 Agent 实例，通过 `userSessionId` 进行隔离，支持同时进行多个对话
- **会话创建与复用**：通过 `getOrCreate` 方法智能管理会话，如果会话已存在则复用，否则创建新会话
- **工作目录（CWD）管理**：支持动态更新会话的工作目录，当 CWD 变化时自动更新现有会话并验证
- **会话生命周期管理**：每个会话记录创建时间，支持基于时间的会话清理
- **自动清理机制**：定期清理超过 30 分钟未活动的会话，默认每 5 分钟执行一次清理
- **会话查询**：提供获取活跃会话列表、会话数量、特定会话 CWD 等查询功能
- **会话移除**：支持手动移除指定会话

### 主要方法

- `getOrCreate(teamName, agentName, config, cwd, userSessionId)`：获取或创建 Agent 会话
  - **userSessionId**（必需）：用户会话 ID（从数据库 sessions 表的 id 字段）
  - 每个 `userSessionId` 拥有独立的 Agent 实例
  - 会话复用时自动更新 CWD 并验证
- `remove(teamName, agentName, userSessionId)`：移除指定会话
  - **userSessionId**（必需）：用户会话 ID
- `cleanup()`：清理过期会话，返回清理数量
- `getActiveSessions()`：获取所有活跃会话 ID 数组
- `getSessionCount()`：获取当前会话总数
- `getSessionCwd(teamName, agentName, userSessionId)`：获取指定会话的工作目录
  - **userSessionId**（必需）：用户会话 ID
- `getSessionId(teamName, agentName, userSessionId)`（私有）：生成会话 ID `teamName:agentName:userSessionId`

## 依赖关系

### 该文件使用的依赖

| 依赖项 | 用途 |
|--------|------|
| SimpleAgent | Agent 实现类，被创建和管理的对象 |
| Logger | 日志工具，用于记录会话操作日志 |

### 使用该文件的模块

| 使用者 | 用途 |
|--------|------|
| src/main/handlers/agentHandlers.ts | Agent 相关操作的会话管理 |
| src/main/handlers/chatHandlers.ts | 聊天功能的会话管理 |
| src/main/handlers/teamHandlers.ts | Team 相关操作的会话管理 |
| src/main/handlers/cwdHandlers.ts | 工作目录变更时的会话管理 |
| src/main/handlers/primaryAgentHandlers.ts | 主要 Agent 的会话管理 |

### 集成方式

该模块通过单例模式导出 `sessionManager` 实例，所有处理器直接导入该单例使用会话管理功能。

### 会话 ID 格式

**格式**：`teamName:agentName:userSessionId`
- 每个用户会话都有独立的 Agent 实例
- 例如：`teamA:coder:session-123` 和 `teamA:coder:session-456` 是两个独立的会话
- 这种设计确保了不同用户会话的 Agent 状态隔离，避免状态混淆

## 代码风险和异味

### 类型安全问题

- **过多的 any 类型使用**：`SessionInfo` 接口中 `agent` 字段和 `getOrCreate` 方法的 `config` 参数都使用 `any` 类型，降低了类型安全性
- **TypeScript 与 CommonJS 混用**：文件使用 TypeScript 的 `interface` 和 `class` 语法，但导出使用 CommonJS 的 `module.exports`，这种混合方式可能导致类型推断问题

### 设计问题

- **全局单例副作用**：模块在加载时立即创建全局单例并启动定时器，这在单元测试中可能导致状态污染和难以隔离的问题
- **缺少清理机制**：定期清理的 `setInterval` 定时器没有提供清除机制，应用关闭时可能导致资源泄漏
- **硬编码配置**：会话超时时间（30 分钟）和清理间隔（5 分钟）硬编码在类中，缺乏灵活性，无法通过配置调整

### 代码一致性

- **日志方式不统一**：部分地方使用 `logger.logSession()`，部分地方使用 `console.log()`，应该统一使用 Logger
- **Map 迭代时删除**：在 `cleanup()` 方法中迭代 Map 时直接删除元素，虽然 JavaScript/Node.js 的 Map 迭代器允许这样做，但需要开发者明确理解这一行为

### 错误处理

- **缺少错误处理**：`agent.init()` 是异步调用，但没有 try-catch 包裹，如果初始化失败会导致未捕获的 Promise rejection
- **缺少输入验证**：`getOrCreate` 等方法没有验证输入参数（如 teamName、agentName 是否为空字符串）

### 并发和竞态条件

- **异步竞态**：`getOrCreate` 方法中的"检查-创建"操作不是原子性的，在并发场景下可能导致同一会话被创建多次
- **CWD 更新竞态**：在更新 CWD 时进行异步验证操作，如果验证失败，可能导致会话处于不一致状态

## 如何测试

### 单元测试策略

- **多会话隔离测试**：验证不同的 `userSessionId` 创建独立的 Agent 实例，状态互不影响
- **会话创建测试**：验证调用 `getOrCreate` 能够正确创建新会话，并验证传入的参数正确传递给 SimpleAgent
- **会话复用测试**：验证相同 sessionId 的第二次调用返回同一个 Agent 实例，不创建新实例
- **CWD 更新测试**：验证当传入不同 CWD 时，现有会话的 CWD 能够正确更新并验证
- **会话移除测试**：验证 `remove` 方法能够正确删除指定会话
- **会话超时测试**：使用时间 mocking 验证超过 30 分钟的会话能够被正确清理
- **查询方法测试**：验证 `getActiveSessions`、`getSessionCount`、`getSessionCwd` 等方法返回正确数据
- **必需参数测试**：验证不提供 `userSessionId` 时 TypeScript 编译失败

### Mock 和 Stub 建议

- **Mock SimpleAgent**：创建 mock 对象替代真实的 SimpleAgent，验证构造函数参数和 `init`、`setCwd` 方法调用
- **Mock Logger**：验证日志记录是否正确调用
- **使用依赖注入**：考虑将 `setInterval` 抽象为可注入的依赖，便于测试清理逻辑

### 集成测试考虑

- **多会话管理**：测试同时存在多个会话时的行为
- **边界条件**：测试会话数量为零、会话刚好超时等边界情况
- **定期清理验证**：验证定时器能够正常触发清理功能

### 测试组织建议

- 为每个方法编写独立的测试用例
- 使用 beforeEach/afterEach 确保测试之间的隔离（需要处理单例问题）
- 考虑在测试环境中导出 AgentSessionManager 类而非单例，或提供重置单例的方法

## 注意事项

### 性能考虑

- **内存管理**：会话数量与并发 Agent 数量成正比，需要关注长时间运行后的内存占用
- **Map 操作效率**：使用 Map 数据结构保证了 O(1) 的查找和插入效率，适合会话管理场景
- **定期清理开销**：清理操作需要遍历所有会话，会话数量很大时可能造成性能问题，可以考虑优化算法或增加清理频率

### 配置要求

- **环境依赖**：需要 Node.js 环境支持 `setInterval`（代码中已做存在性检查）
- **SimpleAgent 依赖**：必须确保 SimpleAgent 类已正确实现并导出

### 常见陷阱

- **单例状态污染**：在测试中如果需要重置状态，目前没有提供官方的重置方法
- **定时器生命周期**：应用退出时定时器不会自动清除，需要在应用关闭逻辑中手动清理（如果有的话）
- **会话 ID 冲突**：会话 ID 格式包含冒号分隔符，如果 teamName、agentName 或 userSessionId 包含冒号可能导致解析问题
- **CWD 验证失败**：如果设置的 CWD 验证失败，会记录错误日志但不会阻止操作，可能导致后续行为异常

### 维护建议

- **配置化**：将会话超时时间和清理间隔提取为可配置参数
- **类型安全**：为 SimpleAgent 和 config 定义明确的接口，减少 any 类型的使用
- **日志统一**：统一使用 Logger 而非 console.log
- **错误处理**：增加异步操作的错误处理和输入参数验证
- **测试友好**：考虑提供单例重置方法或使用依赖注入模式，便于单元测试

## 文档版本信息

- **最后更新**: 2025-04-29
- **当前版本**: 2.0
- **功能特性**: 多会话隔离，userSessionId 为必需参数

### 版本历史

**v2.0 (2025-04-29)** - 多会话支持
- `userSessionId` 改为必需参数，确保每个用户会话都有独立的 Agent 实例
- 会话 ID 格式：`teamName:agentName:userSessionId`
- 移除向后兼容逻辑，简化代码
- 新增 CWD 验证逻辑，确保工作目录设置成功
- 彻底修复多会话场景下的状态混淆问题

**v1.0 (早期版本)** - 单会话模式
- 基本的会话管理功能
- 团队级别的 Agent 实例复用
- 定期清理过期会话
