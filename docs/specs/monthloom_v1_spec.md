# Monthloom v1 需求规格说明

## 1. 背景与目标

Monthloom 是一个自用的台历月历生成工具。

目前台历主要使用 Figma 设计。真正耗时且容易出错的不是背景、插画、月份视觉等创作工作，而是每年反复进行的月历数据填写、日期检查和重复排版：

- 每个月的日期分布不同
- 月份可能横跨 4、5 或 6 周
- Main View 需要显示上下月补齐日期
- 需要同时处理中国、日本两国的节假日
- 中国还有调休补班信息
- 相同的视觉设计需要手工重复应用到每个月

Monthloom 的核心目标是：

> 像在 Figma 中一样设计好一套 Main 月历模板和一套 Mini 月历模板，然后由程序根据年份和节假日数据自动生成所有月份。

Monthloom 不试图替代 Figma。

最终工作流仍然是：

```text
Monthloom
    ↓
生成准确且排版完成的月历 SVG
    ↓
Figma
    ↓
加入月份视觉、背景、装饰等内容
    ↓
完成最终台历
```

核心原则：

> 自动化日历，不自动化创作。

---

# 2. 基本使用流程

以制作 2027 年台历为例：

1. 选择目标年份 `2027`
2. 导入中国、日本节假日 JSON
3. 配置 Main Template
4. 配置 Mini Template
5. 可选上传背景图
6. 在页面下方查看 13 页全年预览
7. 调整模板
8. 所有月份实时应用新的模板配置
9. 批量生成 SVG
10. 将 SVG 导入 Figma
11. 在 Figma 中完成最终台历设计

---

# 3. 输出范围

设目标年份为 `Y`。

## 3.1 Main View

生成：

```text
Y-1
Y-2
...
Y-12
Y+1-1
```

共 **13 个 Main SVG**。

例如目标年份为 2027：

```text
2027-1
...
2027-12
2028-1
```

---

## 3.2 Mini View

生成：

```text
Y-1 年 12 月
Y-1
...
Y-12
Y+1-1
```

共 **14 个 Mini SVG**。

例如：

```text
2026-12
2027-1
...
2027-12
2028-1
```

月份数字均不补零。

---

# 4. Main View

## 4.1 基本结构

Main View 本质上是一个 7 列的月历表格。

```text
Sun   Mon   Tue   Wed   Thu   Fri   Sat

┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│     │     │     │     │     │     │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│                                             │
│               Date Grid                     │
│                                             │
└─────────────────────────────────────────────┘
```

它由两部分组成：

1. Weekday Row
2. Date Grid

---

## 4.2 Weekday Row

固定显示：

```text
Sun Mon Tue Wed Thu Fri Sat
```

特点：

- 7 列
- 无 border
- Weekday Row 高度可配置
- 所有月份使用相同 Weekday Row 高度
- 字体、字号、颜色、位置等可配置
- Sun 默认红色
- Sat 默认蓝色
- 其他默认黑色

Weekday 文字也是 Cell 内 Element，使用与其他元素相同的 Anchor + Offset 定位机制。

---

# 5. Main Date Grid

## 5.1 行数

月份可能横跨：

```text
4 周
5 周
6 周
```

程序根据月份自动判断实际行数。

用户不逐行配置 Date Row 高度。

Date Grid 自动占满 Main View 中除 Weekday Row 外的剩余高度：

```text
dateGridHeight
=
mainViewHeight
-
weekdayRowHeight
```

日期行等高：

```text
dateRowHeight
=
dateGridHeight
/
weekCount
```

因此无论一个月是 4、5 还是 6 行：

> Date Grid 都始终撑满配置好的 Main View 尺寸。

---

## 5.2 日期格式

日期显示：

```text
1
2
3
...
31
```

不补零。

---

# 6. Main 日期颜色

日期数字颜色按照以下规则决定：

1. 日本节假日 → 红色
2. 周日 → 红色
3. 周六 → 蓝色
4. 其他 → 默认颜色，默认黑色

例如：

```text
Saturday + Japanese Holiday
→ red

Saturday
→ blue
```

这些颜色均可配置。

---

# 7. Main 上下月补齐日期

Main View 使用上下月日期补齐完整 Calendar Grid。

例如：

```text
26 27 28 29 30  1  2
 3  4  5  6  7  8  9
...
31  1  2  3  4  5  6
```

上下月补齐日期和当月日期采用**完全相同的内容和样式规则**。

例如补齐日期如果是：

- 周日 → 仍然红色
- 周六 → 仍然蓝色
- 日本节假日 → 仍然红色
- 中国假期 → 仍然显示 Marker 和节假日名称
- 中国补班 → 仍然显示补班 Marker
- 日本节假日 → 仍然显示日本节假日名称

唯一差别是：

```text
adjacentMonthOpacity
```

例如：

```text
60%
```

因此：

```text
Japanese Holiday
+
Adjacent Month
=
Red
+
60% opacity
```

而不是变成灰色。

Adjacent Month 的 opacity 应作用于该日期所属的内容元素：

- Date
- China Holiday Marker
- China Holiday Name
- Japan Holiday Name

Grid border 不因此降低透明度。

---

# 8. 中国节假日 — Main

中国节假日包含两种主要日期状态：

```text
假
班
```

内部可以统一表达为：

```ts
"holiday" | "workday"
```

---

## 8.1 假 / 班 Marker

Marker 位于日期数字附近，默认视觉上位于日期右侧。

但它不是固定的绝对位置，而是一个独立的 Cell Element。

位置可以配置：

```ts
anchor
offsetX
offsetY
```

Marker 支持两种方式：

```ts
"text"
"image"
```

因此既可以使用：

```text
假
班
```

也可以替换成用户自行设计的图片。

假、班可以分别配置对应资源。

图片 Marker 的：

- 尺寸
- 位置
- 相对偏移

均可配置。

---

# 9. 中国节假日名称 — Main

中国节假日名称显示在日期数字下方。

例如：

```text
1 [假]
劳动节
```

中国节假日名称本身是一个独立 Element。

它并不真正绑定在 Date Element 上，而是和 Date 一样：

> 相对于当前 Cell 进行定位。

默认通过：

```text
top-left anchor
+
offset
```

使它视觉上出现在日期数字下方。

可配置：

- 字体
- 字号
- 字重
- 颜色
- 位置
- X / Y Offset
- 透明度等排版属性

默认颜色可以为红色。

Monthloom **不处理节假日名称文字溢出问题**。

不进行：

- 自动缩小字体
- 自动换行
- 自动截断

如果文字放不下，由用户调整模板中的字体、字号或位置。

---

# 10. 日本节假日 — Main

日本节假日有两个视觉效果。

## 10.1 日期数字

日本节假日日期：

```text
Date → red
```

优先于 Saturday 的蓝色规则。

---

## 10.2 日本节假日名称

日本节假日名称显示在 Date Cell 底部。

例如：

```text
┌──────────────────────┐
│ 3                    │
│                      │
│                      │
│ 憲法記念日            │
└──────────────────────┘
```

默认定位：

```ts
anchor: "bottom-left"
offsetX: ...
offsetY: ...
```

它始终相对于 Cell 定位。

因此即使月份从 5 行变成 6 行，Cell 高度发生变化，日本节假日名称仍然保持在 Cell 底部附近。

---

# 11. 中国与日本节假日同时存在

中国和日本节假日是两个完全独立的内容层。

典型 Main Cell：

```text
┌────────────────────────────┐
│ 3  [中国假/班 Marker]       │
│ 中国节假日名称              │
│                            │
│ 日本节假日名称              │
└────────────────────────────┘
```

默认：

- Date：顶部区域
- 中国 Marker：日期附近
- 中国节假日名称：日期下方
- 日本节假日名称：Cell 底部

各自位置均由模板独立配置。

---

# 12. Mini View

Mini View 是一套独立模板。

它并不是 Main View 按比例缩小。

Main 和 Mini：

- 使用相同 Calendar Data
- 使用相同 Grid / Cell / Element Layout Engine
- 使用完全独立的模板配置

---

# 13. Mini 基本结构

Mini View：

```text
2027-5

S   M   T   W   T   F   S

    1   2   3   4   5   6
7   8   9  10  11  12  13
...
```

包含三部分：

1. Month Row
2. Weekday Row
3. Date Grid

Mini View 默认所有区域均：

```text
无 border
```

---

# 14. Mini Month Row

默认月份文字格式：

```text
YYYY-M
```

例如：

```text
2027-5
```

月份不补零。

默认左对齐。

Month Row 可以视为一个横跨 7 列的 Cell。

月份文字默认：

```ts
anchor: "center-left"
```

但不是写死。

用户可以配置为：

- 左
- 中
- 右
- 上下不同 Anchor
- X Offset
- Y Offset

Month Row 高度也属于模板布局参数，可配置。

---

# 15. Mini Weekday Row

固定：

```text
S M T W T F S
```

默认：

- S（Sunday）红色
- S（Saturday）蓝色
- 其他黑色
- Cell 内居中

Weekday Row 高度可配置。

---

# 16. Mini Date Grid

Mini Date Grid：

- 7 列
- 自动计算 4 / 5 / 6 行
- 所有 Date Row 等高
- 自动撑满 Month Row、Weekday Row 之外的剩余空间
- 无 border

Mini Date 默认在 Cell 中居中。

---

# 17. Mini 上下月日期

Mini **不显示上下月补齐日期**。

用于维持星期位置的 Cell 仍然存在，但内容为空。

---

# 18. Mini 日期颜色

Mini 日期沿用同样的基础日期颜色逻辑：

1. 日本节假日 → 红色
2. 周日 → 红色
3. 周六 → 蓝色
4. 其他 → 黑色

颜色仍然属于模板配置。

---

# 19. Mini 日本节假日

Mini 中：

- 日本节假日日期显示为红色
- 不显示日本节假日名称

---

# 20. Mini 中国假 / 班

Mini 不显示中国节假日文字名称。

中国假 / 班通过 Date Cell 右上方的小圆点表示。

默认：

```text
假 → 红色圆点
班 → 蓝色圆点
```

圆点默认：

```ts
anchor: "top-right"
```

并支持：

```ts
offsetX
offsetY
```

以下均可配置：

- Dot Size
- Holiday Dot Color
- Workday Dot Color
- Position
- Offset

---

# 21. 统一布局模型

Monthloom 的核心布局模型是：

```text
Grid
  ↓
Cell
  ↓
Element
```

Main 和 Mini 都基于这个模型。

---

# 22. Grid

Grid 负责：

- Width
- Height
- Columns
- Rows
- Row Height
- Border
- Cell Geometry

日历固定：

```text
columns = 7
```

不提供不同星期列宽。

---

# 23. Cell

Cell 是 Element 的定位坐标系。

v1 不额外引入 Padding 层。

因此：

```text
Cell
  ↓
Anchor
  ↓
Offset
  ↓
Element
```

而不是：

```text
Cell
↓
Padding
↓
Content Box
↓
Element
```

这样避免多个参数共同决定一个简单位置。

---

# 24. Element Anchor

所有 Cell Element 使用统一的九点 Anchor：

```text
↖   ↑   ↗

←   •   →

↙   ↓   ↘
```

对应：

```ts
type Anchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
```

并配合：

```ts
offsetX: number
offsetY: number
```

因此 Element 的位置表达为：

> Anchor + Offset

而不是某一个月份中的 Canvas 绝对坐标。

---

# 25. 为什么不能保存绝对坐标

不能把：

```text
2027-5-3
x = 427
y = 192
```

作为模板。

模板应该保存：

```text
Date
anchor = top-left
offsetX = 14
offsetY = 10
```

这样当月份从：

```text
4 rows
→
6 rows
```

Cell 高度发生变化时，模板依然成立。

---

# 26. Border

Main Date Grid 有 border。

以下属性必须可配置：

- Border Width
- Border Color

Weekday Row：

```text
border: none
```

Mini：

```text
border: none
```

Border 不只是视觉样式，也必须参与尺寸计算。

SVG 的 stroke 默认跨在线条两侧，因此 Renderer 需要正确处理：

```text
strokeWidth / 2
```

带来的边界尺寸问题。

相邻 Cell 共享的 Grid Line 应只绘制一次，不能通过两个 Cell 重复叠加同一条线。

目标是：

> 用户配置的 View / Grid 尺寸，就是最终 SVG 的实际尺寸。

---

# 27. 模板可配置性

Monthloom 的核心诉求之一是：

> 尽量让用户能够把自己原本在 Figma 中会调整的月历排版参数，都在模板中配置好。

包括但不限于：

### View

- Width
- Height

### Row / Grid

- Weekday Row Height
- Month Row Height
- Border Width
- Border Color

### Position

- Anchor
- Offset X
- Offset Y

### Typography

- Font
- Font Size
- Font Weight
- Font Style
- Color
- Opacity
- 其他必要文字排版属性

### Date States

- Sunday Color
- Saturday Color
- Japanese Holiday Color
- Adjacent Month Opacity

### Marker

- Text / Image
- Image
- Width
- Height
- Color
- Position
- Offset

Main 和 Mini 的这些配置相互独立。

---

# 28. 语义 Element

Monthloom 不需要任意图层系统。

Main 的主要语义 Element：

```text
Weekday
Date
China Holiday Marker
China Holiday Name
Japan Holiday Name
Grid
```

Mini：

```text
Month Label
Weekday
Date
China Holiday Dot
```

编辑的是这些“模板元素”，而不是某一个具体日期。

---

# 29. Template Editor

网页顶部是模板编辑区域。

编辑体验目标：

> 有 Figma 的直接操作感，但只实现日历模板真正需要的能力。

---

# 30. Semantic Selection

例如用户点击：

```text
17
```

选择的不是：

```text
2027-5-17
```

而是：

```text
Date
```

修改 Date Font Size 后：

> 所有月份所有日期统一变化。

类似：

```text
点击 Sun
→ Weekday

点击 劳动节
→ China Holiday Name

点击 憲法記念日
→ Japan Holiday Name

点击 Marker
→ China Holiday Marker
```

---

# 31. Drag to Position

用户可以直接拖动 Cell 中的 Element。

拖动并不是修改绝对 Canvas 坐标，而是修改：

```text
Anchor + Offset
```

Element 始终属于对应的 Cell。

不能通过拖动把 Date Element 变成一个脱离 Calendar Cell 的任意图层。

---

# 32. Inspector

模板编辑区域提供 Inspector。

拖动用于快速视觉调整。

Inspector 用于精确设置。

例如：

```text
Position
  Anchor
  X
  Y

Typography
  Font
  Size
  Weight
  Color

Appearance
  Opacity
```

原则：

> Drag 负责直觉，Inspector 负责精确。

---

# 33. Anchor 可视化

选中 Element 时，可以看到九点 Anchor。

用户能够直接选择对应 Anchor。

例如 Mini Month Label 默认：

```text
center-left
```

Mini Date 默认：

```text
center
```

Mini Dot 默认：

```text
top-right
```

Main Japan Holiday Name 默认：

```text
bottom-left
```

---

# 34. Row Height 操作

Weekday Row Height：

- Inspector 中可输入精确值
- 可以通过拖动对应分隔位置进行快速调整

Date Row 不允许逐行独立调整。

其高度始终由：

```text
剩余高度 / 实际周数
```

自动计算。

---

# 35. Undo / Redo

模板编辑器支持：

```text
Cmd + Z
Cmd + Shift + Z
```

---

# 36. v1 不做的编辑器能力

Monthloom 不做通用 Figma。

v1 不需要：

- 任意创建 Shape
- 任意图层
- 钢笔
- Vector 编辑
- Mask
- Component
- Auto Layout
- Multi-select
- 框选
- Smart Guide
- 自由 resize 任意元素
- 通用图形编辑能力

文字字号通过 Inspector 修改。

图片 Marker 可以配置尺寸。

---

# 37. 模板作用范围

模板样式是全局规则。

不提供：

```text
只修改 2027-5 的 Date Font Size
```

如果修改：

```text
Date Font Size
```

所有月份同时变化。

Monthloom 的目的正是避免重新退化成：

> 每个月单独人工调整一次。

月份之间真正不同的是：

> Calendar Data

而不是 Template。

---

# 38. 字体

不同语义内容可以使用不同字体。

至少包括：

- English / Weekday
- Number / Date
- Chinese Holiday
- Japanese Holiday
- Mini Month Label

字体相关属性独立配置。

---

# 39. 在线字体

支持使用在线字体库，优先考虑 Google Fonts。

用户可以选择：

```text
Font Family
Font Weight
Font Style
```

Template 应记录实际字体信息，而不仅仅记录一个模糊的显示名称。

Preview 和最终 SVG 应尽可能使用相同的实际字体资源。

---

# 40. 字体定位一致性

Monthloom 的目标不是简单依赖 SVG 默认 baseline 来放文字。

不同字体：

- Ascender
- Descender
- Bounding Box

可能不同。

因此在：

```text
anchor + offset
```

计算最终文字位置时，应考虑字体实际 Metrics。

目标是：

> 用户更换字体后，同一个 Anchor + Offset 仍然具有稳定、可理解的视觉含义。

---

# 41. SVG 导出模式

支持两种模式。

## 41.1 Outlined SVG

默认模式。

将文字转换为 Vector Path。

优点：

- 最大限度保证视觉一致
- 不依赖 Figma 是否安装对应字体
- 不依赖另一台电脑的字体环境
- 更符合 Monthloom “设计好后作为定稿素材进入 Figma”的工作方式

缺点：

- 文字进入 Figma 后不再是可编辑文本

---

## 41.2 Editable SVG

保留 SVG `<text>`。

适用于：

> 希望导入 Figma 后继续尝试编辑文字。

这种模式不承诺：

> 在所有字体和 Figma 环境下与 Monthloom Preview 100% 完全一致。

---

# 42. SVG 自包含

最终 SVG 不应依赖外部在线资源。

例如中国假 / 班使用图片 Marker 时：

不应该：

```text
SVG
→ https://example.com/holiday.png
```

而应该将图片资源包含在 SVG 中。

这样 SVG 放入 Figma 后不会因为外部资源失效而改变。

---

# 43. 节假日数据输入

v1 使用用户提供的 JSON。

参考兼容格式：

## 日本

```text
https://holidays-jp.github.io/api/v1/date.json
```

基本形态：

```json
{
  "2026-05-03": "憲法記念日"
}
```

## 中国

```text
https://timor.tech/api/holiday/year/{year}/
```

其中包含：

- 日期
- holiday true / false
- 节假日名称
- 调休补班等数据

---

# 44. Holiday Adapter

Renderer 不直接依赖第三方 JSON 结构。

流程：

```text
User JSON
    ↓
Holiday Adapter
    ↓
Monthloom Holiday Data
    ↓
Calendar Core
    ↓
Renderer
```

这样未来替换节假日数据来源不会影响模板和 SVG Renderer。

---

# 45. 内部 Holiday Data

内部数据至少需要表达：

```ts
type CalendarDayHoliday = {
  china?: {
    type: "holiday" | "workday"
    name?: string
  }

  japan?: {
    name: string
  }
}
```

Monthloom 使用用户提供的数据进行渲染，不自行猜测或生成节假日信息。

---

# 46. 节假日数据覆盖范围

虽然目标年份是 `Y`，实际需要的节假日数据范围更大。

原因包括：

- `Y-1` Main 的前置补齐日期可能位于上一年
- `Y+1-1` Main 的尾部补齐日期可能进入 `Y+1-2`
- 全年 Preview 的最后一页 `Y+1-1` 需要显示下一月 Mini，即 `Y+1-2`

因此用户提供的数据必须覆盖：

> 实际参与渲染的所有日期。

程序需要检测数据覆盖是否不足，并明确提示。

不能在节假日数据缺失时悄悄把相关日期当作普通日期而不告诉用户。

---

# 47. 全年 Page Preview

Template Editor 下方是全年预览区域。

不是 Month Switcher，也不是缩略图 Grid。

而是：

> 13 页完整页面预览，单列垂直平铺。

结构：

```text
2027-1
[ Page Preview ]

2027-2
[ Page Preview ]

2027-3
[ Page Preview ]

...

2028-1
[ Page Preview ]
```

用户直接向下滚动检查全年。

---

# 48. 每页 Preview 内容

每页近似最终台历：

```text
Background
+
Main View
+
Previous Month Mini
+
Next Month Mini
```

目标是能够看到约 80% 的最终视觉效果。

Monthloom 不需要在这里实现最终的左上角月份艺术设计。

这部分仍然交给 Figma。

---

# 49. 13 页 Preview 与 Mini Export 的边界

Mini 正式导出范围仍然保持已经确定的 **14 个月**：

```text
Y-1-12
→
Y+1-1
```

但第 13 个 Page Preview 是：

```text
Y+1-1
```

它的 Next Mini 是：

```text
Y+1-2
```

因此：

> Monthloom 可以在预览阶段临时计算 `Y+1-2` Mini，仅用于最后一页 Preview。

它不进入 14 个正式 Mini SVG 的批量输出范围。

这样同时满足：

- 13 页完整预览
- 每页都有 Prev / Next Mini
- 正式 Mini 输出仍然只有 14 个

---

# 50. Page Preview Layout

Page Preview v1 保持简单。

不做完整 Page Editor。

页面基本结构参考现有台历：

```text
┌────────────────────────────────────────────┐
│                                            │
│ Left column          Main View             │
│                                            │
│ [month design]       ┌──────────────────┐  │
│                      │                  │  │
│ Prev Mini            │                  │  │
│                      │                  │  │
│ Next Mini            │                  │  │
│                      └──────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

默认视觉目标：

- 左侧约占页面宽度 1/3
- Main View 使用剩余右侧主要区域
- 左右区域之间存在 Gap
- Mini 宽度约等于左侧区域宽度
- Mini 高度约为页面高度 1/3
- 两个 Mini 之间有可配置 Gap
- 页面四周可配置间距

由于：

```text
1/3 + 3/4 > 1
```

因此 Main 不严格写死成页面宽度 3/4。

实际规则为：

```text
Main Width
=
Content Width
-
Left Column Width
-
Column Gap
```

达到视觉上“左侧约三分之一、右侧占主要区域”的效果。

---

# 51. Page Preview 配置

至少包括：

```text
Page Width
Page Height

Page Padding

Left Column Ratio
Column Gap

Mini Height Ratio
Mini Gap
```

这部分暂时通过参数配置即可。

不需要像 Main / Mini Template 那样做复杂的自由拖拽 Page Editor。

---

# 52. Background

用户可以上传一张背景图用于 Page Preview。

v1 采用简单规则：

- 保持图片宽高比
- 等比缩放
- 居中
- 默认 Cover 页面
- 超出页面的部分裁切
- 不拉伸

这张背景用于 13 页成品预览。

Background 不属于 Main / Mini SVG。

因此正式 Main / Mini SVG 导出时不包含背景。

---

# 53. Preview Scaling

13 页预览保持真实页面宽高比例。

网页中根据可用宽度进行整体等比缩放。

缩放只影响网页 Preview 的显示大小。

不会改变：

- Template Size
- SVG Size
- Font Size
- Layout Data

---

# 54. 实时预览

Template 中任何相关配置改变时：

```text
Main Template
Mini Template
Font
Color
Position
Border
Opacity
Marker
```

页面下方的 13 页 Preview 应同步更新。

全年 Preview 是 Monthloom 的核心检查方式之一。

---

# 55. 模板复用

Main Template 和 Mini Template 描述的是：

> 设计规则。

而不是某一年的最终日期坐标。

因此同一套 Template 可以与不同年份的 Calendar Data 组合。

例如：

```text
Template
+
2027 Holiday Data
→
2027 Calendar

Template
+
2028 Holiday Data
→
2028 Calendar
```

模板配置应能够被保存并再次加载，以支持后续年份继续使用。

v1 不需要账号系统或云端同步。

---

# 56. Calendar Core

Calendar Core 独立于 UI 和 SVG Renderer。

负责：

- 每个月天数
- 每月第一天星期
- 4 / 5 / 6 周判断
- Main 上下月补齐日期
- Mini 空白 Cell
- Weekday
- 中日 Holiday Data 合并

Renderer 不自行计算日历。

---

# 57. Layout Engine

Layout Engine 负责：

```text
Grid
Cell
Row Height
Border
Anchor
Offset
Font Metrics
```

同一套 Layout 结果同时服务：

- Editor Preview
- 13 Page Preview
- SVG Export

避免 Preview 和 Export 各自实现一套布局逻辑。

---

# 58. SVG Renderer

SVG Renderer 负责：

- Main SVG
- Mini SVG
- Editable Text
- Text Outline
- Image Marker Embed
- 精确尺寸输出

目标：

> Preview 和 Export 使用同一套 Calendar Data、Layout 和字体逻辑。

---

# 59. 建议的内部模块边界

```text
holiday-adapters
       ↓
holiday-data
       ↓
calendar-core
       ↓
layout-engine
       ↓
svg-renderer
       ↓
template-editor
       ↓
page-preview
```

各层保持职责独立。

---

# 60. v1 不处理文字溢出

Monthloom 不负责自动解决：

```text
中国节假日名称太长
日本节假日名称太长
```

不提供：

- Auto Fit Font Size
- Auto Wrap
- Auto Truncate

如果出现：

```text
文字放不下一行
```

由用户调整该模板元素的：

```text
Font
Font Size
Position
```

---

# 61. v1 非目标

v1 不实现：

- 完整 Figma 替代能力
- 最终整页台历设计器
- 任意 Page Layer
- 任意 Shape
- 云端账号
- 多用户
- 模板市场
- 自动节假日文字排版
- 自动处理文字溢出
- 针对单个月份的样式 Override
- 最终 PNG 台历设计流程
- PDF 排版系统

v1 的最终正式输出仍然是：

> Main / Mini SVG。

---

# 62. 核心设计原则

## 62.1 Template，而不是具体月份

错误：

```text
May 3
x = 420
y = 190
```

正确：

```text
Date
anchor = top-left
offset = ...
```

---

## 62.2 Grid → Cell → Element

这是整个 Monthloom Layout Model 的核心。

---

## 62.3 Element 相对于 Cell

所有文字、Marker：

> 相对于对应 Cell 定位。

不建立大量特殊的 Date-relative、Holiday-relative 定位规则。

---

## 62.4 Anchor + Offset

位置由：

```text
Anchor
+
Offset
```

表达。

从而适应不同高度的 4 / 5 / 6 行月份。

---

## 62.5 Layout 和 Calendar Data 分离

Calendar Data 决定：

```text
今天是几号
星期几
是不是日本节假日
是不是中国假期
是不是补班
```

Template 决定：

```text
这些东西应该长什么样、放在哪里。
```

---

## 62.6 状态可以叠加

例如：

```text
Japanese Holiday
+
Saturday
+
Adjacent Month
```

最终可以得到：

```text
Japanese Holiday Color
+
Adjacent Month Opacity
```

不能为所有状态组合编写独立硬编码样式。

---

## 62.7 设计全局统一

允许每一天：

> 数据不同。

不允许每个月：

> 模板样式不同。

这正是 Monthloom 能够消除重复工作的基础。

---

## 62.8 尽量可配置，但不做通用设计器

Monthloom 应允许调整所有真正影响月历设计的参数。

但这些能力始终围绕：

```text
Calendar Grid
Calendar Cell
Calendar Element
```

而不是向通用 Figma 演化。

---

## 62.9 Preview 与 Export 一致

Monthloom 最重要的技术质量要求之一：

> 网页中看到的结果，应尽可能就是最终导入 Figma 后看到的结果。

Outlined SVG 是默认保障手段。

---

# 63. v1 完成标准

当以下完整流程能够稳定完成时，可以认为 Monthloom v1 达到目标：

1. 用户选择年份
2. 导入符合支持格式的中国节假日 JSON
3. 导入符合支持格式的日本节假日 JSON
4. 程序正确生成 Calendar Data
5. 正确计算每个月 4 / 5 / 6 行
6. Main 正确生成上下月补齐日期
7. Mini 正确隐藏上下月日期
8. 正确应用 Sunday / Saturday 颜色
9. 正确应用日本节假日日期颜色
10. Main 正确显示中国假 / 班 Marker
11. Main 正确显示中国节假日名称
12. Main 正确显示日本节假日名称
13. Mini 正确显示中国假 / 班 Dot
14. Mini 正确显示日本节假日日期状态
15. Main / Mini 尺寸可配置
16. Weekday Row Height 可配置
17. Main Border Width / Color 可配置
18. 主要文字字体、字号、颜色可配置
19. 不同语义文字可使用不同字体
20. 支持在线字体
21. Element 支持九点 Anchor
22. Element Offset 可调整
23. 支持直接拖动 Element 调整位置
24. Inspector 可以进行精确调整
25. 4 / 5 / 6 行月份使用同一 Template 正确布局
26. Adjacent Month 只额外叠加透明度
27. 支持图片形式的中国假 / 班 Marker
28. SVG 中图片资源自包含
29. 默认可以导出 Outlined SVG
30. 可以选择 Editable SVG
31. 批量生成 13 个 Main SVG
32. 批量生成 14 个 Mini SVG
33. 用户可以上传 Background
34. 页面下方垂直显示 13 页完整 Preview
35. 每页包含 Background + Main + Prev Mini + Next Mini
36. Preview 随 Template 修改实时更新
37. 模板能够保存并在以后重新使用
38. 最终 SVG 能够作为高保真素材进入 Figma 完成最终设计

最终 Monthloom 所解决的问题可以概括为：

> **我只设计一次月历规则，Monthloom 负责把这套设计准确地应用到所有月份。**