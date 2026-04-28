# 打包和版本管理指南

## 环境要求

### 开发环境（开发者）
- Node.js (v18+)
- npm 或 yarn
- Git

### 生产环境（最终用户）
- **不需要Node.js！**
- **不需要npm！**
- Windows 10/11 系统
- 双击exe文件即可运行

**注意：** Electron打包后的应用已内置Node.js运行时和Chromium浏览器引擎，完全独立运行。

项目遵循语义化版本 (Semantic Versioning)：`主版本.次版本.修订版本`

- **主版本 (Major)**：不兼容的API更改
- **次版本 (Minor)**：向下兼容的功能新增
- **修订版本 (Patch)**：向下兼容的问题修正

示例：`0.1.0` → `0.1.1` → `0.2.0` → `1.0.0`

## 版本更新流程

### 1. 修改版本号

编辑 `package.json` 文件中的 `version` 字段：

```json
{
  "version": "0.1.1"
}
```

### 2. 提交版本变更

```bash
git add package.json
git commit -m "chore: bump version to 0.1.1"
git tag v0.1.1
git push origin master --tags
```

## 打包命令

### 开发环境

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```

### 打包应用

```bash
# 打包为目录（推荐，无需安装）
npm run dist:dir

# 打包但不分发（用于测试）
npm run pack

# 打包当前平台
npm run dist

# Windows
npm run dist:win

# macOS 安装包
npm run dist:mac

# Linux 安装包
npm run dist:linux
```

**推荐使用目录分发：** 本应用使用目录分发方式，无需安装，包含所有资源文件。

### 发布（生成但不发布）

```bash
npm run release
```

## 打包输出

打包完成后，文件会保存在 `release/` 目录：

- **Windows**: `release/OpenVillage Desktop-win32-x64/` (完整应用目录)
- **macOS**: `release/OpenVillage Desktop-0.1.0.dmg`
- **Linux**: `release/OpenVillage Desktop-0.1.0.AppImage`

**Windows分发方式：**

### 方式1：目录分发（推荐）
1. 打包完成后，在 `release/` 目录找到 `OpenVillage Desktop-win32-x64/`
2. 将整个目录压缩为zip文件
3. 用户解压后运行 `OpenVillage Desktop.exe`
4. 优点：包含所有资源文件，不会出现ICU错误

### 方式2：创建快捷方式
在应用目录中创建快捷方式，用户可以放在桌面：
```bash
# 右键 OpenVillage Desktop.exe
# 发送到 -> 桌面快捷方式
```

### 方式3：制作自解压包
使用7-Zip或WinRAR制作自解压exe：
1. 将整个目录打包成自解压文件
2. 设置解压后自动运行主程序
3. 用户双击后自动解压并运行

## 打包前准备

### 1. 添加应用图标

将图标文件放在 `build/` 目录：

- Windows: `build/icon.ico` (256x256)
- macOS: `build/icon.icns` (1024x1024)
- Linux: `build/icon.png` (512x512)

### 2. 检查环境变量

确保 `.env` 文件不包含敏感信息，或使用生产环境配置。

### 3. 清理旧构建

```bash
rm -rf release/
rm -rf dist/
```

## 版本检查

在应用中显示当前版本：

```typescript
// 在渲染进程中
const version = require('../../package.json').version;
console.log('当前版本:', version);
```

## 发布流程（完整）

1. 更新 `package.json` 中的版本号
2. 运行测试确保功能正常
3. 提交代码并创建版本标签
4. 运行打包命令
5. 测试安装包
6. 发布到GitHub Releases或分发平台

## 常见问题

### Q: 打包失败怎么办？
A: 确保先运行 `npm run build` 构建项目，然后检查 `dist/` 目录是否生成。

### Q: 如何自定义应用名称？
A: 修改 `package.json` 中 `build.productName` 字段。

### Q: 如何添加更多的文件到安装包？
A: 修改 `package.json` 中 `build.files` 字段，添加需要包含的文件或目录。

### Q: 打包后的应用无法启动？
A: 检查 `package.json` 中的 `main` 字段是否正确指向构建后的入口文件。
