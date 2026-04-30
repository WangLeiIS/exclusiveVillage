# 应用图标

请将应用图标放在此目录中：

## 图标规格

### Windows
- 文件名: `icon.ico`
- 尺寸: 256x256 像素
- 格式: ICO格式，包含多种尺寸

### macOS
- 文件名: `icon.icns`
- 尺寸: 1024x1024 像素
- 格式: ICNS格式

### Linux
- 文件名: `icon.png`
- 尺寸: 512x512 像素
- 格式: PNG格式，支持透明度

## 图标生成工具

- 在线工具: https://icoconvert.com/
- macOS: 使用 `iconutil` 命令行工具
- Linux: 使用 `ImageMagick`

## 快速生成

如果你有一个 1024x1024 的 PNG 图标，可以使用以下命令：

```bash
# Linux/macOS
convert icon.png -define icon:auto-resize=256,128,64,32,16 icon.ico
```

注意：如果没有提供图标，electron-builder 会使用默认图标。
