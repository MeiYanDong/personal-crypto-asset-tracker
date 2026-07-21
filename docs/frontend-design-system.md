# 前端设计系统与迭代记录

这份文档不是一次性的视觉说明，而是个人资产追踪项目的设计判断、组件目录和评审记录。每一轮先研究和截图审计，再修改真实页面，最后用桌面与移动端截图复核。

## 产品方向

- 产品类型：个人加密资产金融操作台，不是营销网站。
- 核心任务：快速判断总资产、风险折价、资产归属、数据新鲜度，并完成钱包配置。
- 视觉语气：精密、克制、可信，接近专业账本和运营控制台。
- 记忆点：把“总资产 -> 稳定币 -> 波动资产 -> 保守折价”的关系直接可视化。
- 图标约束：只使用 Lucide icons，不使用 emoji。

## 参考来源

### tweakcn Dashboard

来源：https://tweakcn.com/editor/theme?p=dashboard

吸收：

- 颜色不是零散 hex，而是 background、foreground、card、muted、border、ring、chart、sidebar 等语义令牌。
- 应用导航、摘要指标、图表和数据表需要使用同一套间距与边框规则。

不照搬：

- 默认黑白 Dashboard 只是一种主题预览，不能替代产品领域判断。
- 大圆角和通用收入卡不适合高频扫描的钱包资产页面。

### shadcn/ui

来源：https://ui.shadcn.com/ 和 https://ui.shadcn.com/blocks?category=dashboard

吸收：

- 组件应该可组合且代码归项目所有，不依赖无法修改的黑盒组件库。
- Dashboard 的稳定骨架是：应用导航、页面标题、摘要区、视图切换、筛选工具条、数据表。
- 数据表的选择、筛选、行操作和列展示是领域能力，不应做成万能组件后丢失灵活性。

### Tailwind CSS

来源：https://tailwindcss.com/ 和 https://tailwindcss.com/docs/responsive-design

吸收：

- 设计令牌、响应式断点和容器尺寸应该明确，不靠页面逐处猜测。
- 响应式采用 mobile-first 思维；组件根据实际可用宽度变化，而不是只按整页视口变化。

当前项目继续使用原生 CSS。第一轮只吸收方法，不为了追随模板而迁移技术栈。

### Agent Skills

来源：https://github.com/anthropics/skills 和 https://skillsmp.com/

当前使用官方 `frontend-design` Skill 约束设计方向和反模板化评审。社区 Skill 只用于发现，安装前必须检查来源、脚本和权限。

## 设计原则 v1

1. 先任务，后装饰：总资产、风险折价、数据状态优先于钱包数和币种数。
2. 一屏一个主判断：总览页首先回答“现在值多少，保守算多少，为什么”。
3. 数字像账本：金额和地址使用等宽字体与 tabular numbers，标签使用无衬线字体。
4. 颜色有职责：绿色表示主资产或正常，金色表示折价与提醒，红色只表示错误或破坏性操作。
5. 空状态降权：空资产组可管理，但不能在统计页抢占主要资产的阅读顺序。
6. 控件成组：筛选、视图切换、批量操作分别进入 segmented control、toolbar、selection bar。
7. 小于 1U 只隐藏明细，不改变统计值。
8. 动效只表达状态变化，持续时间控制在 120-220ms，并尊重 `prefers-reduced-motion`。

## 组件目录

### Portfolio Summary Strip

状态：第一轮实现。

职责：在一个连续摘要带中展示总资产、保守估值、稳定币/波动资产构成、折价缓冲、钱包/币种/链数量。

### Asset Share Bar

状态：第一轮实现。

职责：在资产组金额旁显示其占总资产比例；不额外引入图表库。

### Segmented View Switcher

状态：第十五轮迁移为 Tabs 原子组件。

职责：切换按资产组、按链、按币种、按钱包四种互斥视图。

### Management Selection Bar

状态：已有，待第二轮强化。

职责：选择多个逻辑钱包后批量移动资产组，显示选择数量并提供明确提交动作。

### Expandable Wallet Row

状态：已有。

职责：默认保持钱包表可扫描，展开后编辑 EVM/SOL 地址、标签和配对关系。

### Management View Toolbar

状态：第二轮实现。

职责：显示当前筛选范围和结果数量，把搜索、排序、移动端全选放在同一视图工具栏；不混入尚未触发的批量动作。

### Contextual Selection Bar

状态：第二轮实现。

职责：只有选中钱包后才出现，持续显示已选数量、目标资产组、移动命令和清除选择；移动后自动退出选择状态。

### Responsive Wallet Row

状态：第二轮实现。

职责：桌面保持六列表格，窄屏把同一行重排为钱包身份、资产组、最近资产和状态三层，不渲染另一套功能残缺的数据。

### Refresh Integrity Rail

状态：第三轮实现。

职责：连续展示有效覆盖率、快照年龄、正常/旧数据/失败/跳过/缺失的钱包分布，并提供进入钱包状态视图的路径。

### Snapshot Trend Sparkline

状态：第三轮实现。

职责：使用云端保存的最多 30 次真实刷新摘要展示总资产变化；样本不足时明确显示“建立历史中”，不生成模拟数据。

### Chain Exposure Strip

状态：第四轮实现。

职责：在链视图顶部用连续分段条表达真实链上资产占比，并明确区分“有效链”与“扫描范围”。

### Chain Ledger Table

状态：第四轮实现。

职责：按链汇总总资产、保守估值、稳定币、钱包和主要持仓；继续使用账本表格承载精确值，移动端保留链、金额和钱包三个主判断。

### Coverage-aware Portfolio Total

状态：第五轮实现。

职责：根据当前筛选范围的有效钱包覆盖情况调整总额命名；覆盖不完整时使用“已覆盖资产”，并直接显示已计入钱包数，避免把局部快照表达成完整资产。

### Inactive Group Disclosure

状态：第五轮实现。

职责：主账本只展示已分配钱包的资产组；没有钱包和资产的组进入紧凑折叠区，保留配置入口但不与真实资产争夺阅读顺序。

### Atomic Control Layer

状态：第六轮实现。

职责：统一全站最小交互单元。业务页面不再直接创建原生 button、input、select、textarea 或 checkbox，而是组合以下项目内组件：

- `Button / IconButton`：primary、secondary、ghost、quiet、danger 五种命令层级，三档尺寸，统一 loading、disabled、focus 与图标间距；图标按钮同时提供可访问名称和悬停提示。
- `Input / Textarea / SearchField`：统一边框、焦点环、错误态和 placeholder；搜索框包含 Lucide Search 与按需出现的清除命令。
- `NativeSelect`：保留系统原生选择行为和移动端选择器，外层统一前置图标、下拉图标、焦点与尺寸。
- `Checkbox / Switch`：保留原生 input 语义，使用统一的可视控制面；checkbox 的透明原生输入覆盖完整点击区，批量选择支持 checked、unchecked、indeterminate 三态，二元刷新设置使用 switch。
- `Badge / StatusBadge`：用 success、warning、danger、neutral、accent、info、outline 表达语义，不以装饰颜色代替状态。
- `Notice / EmptyState`：统一成功、信息、警告、错误反馈以及加载、无数据、无搜索结果状态。
- `Tooltip`：为纯图标命令提供统一说明，通过 Portal 避免被表格和面板裁切，支持悬停、键盘焦点和 Escape 关闭。
- `Tabs / TabsList / TabsTrigger / TabsContent`：统一互斥视图切换、等宽分段布局、roving focus、自动激活和 tab/panel 语义关系。
- `Table / TableHeader / TableBody / TableRow / TableHead / TableCell / TableCaption`：保留原生 table 语义，统一响应式滚动容器、列头 scope、caption、数字列对齐和行状态；业务视图继续决定列结构、筛选和排序。

原子控件令牌集中在 `src/styles.css`：40px 桌面控件高度、42px 窄屏触控高度、34px 小尺寸、6px 圆角、语义边框、focus ring 和 120-140ms 状态过渡。

## 评审记录

### 2026-07-21 第一轮基线

观察：

- 五张同等权重的指标卡让“资产组数量”与“总资产”争夺注意力。
- 总资产和保守估值分散，用户需要自行理解稳定币、波动资产和 20% 折价的关系。
- 空资产组排在真实资产前面，主表首屏的信息价值低。
- 金额没有资产组占比，难以快速比较项目暴露。
- 字体依赖系统回退，数字对齐不稳定。

本轮动作：

- 合并摘要区并增加资产构成条。
- 资产组按资产金额降序排列，空组保留但降权。
- 引入 IBM Plex Sans Variable 与 IBM Plex Mono。
- 增加资产组占比条、空组管理路径和更严格的语义颜色。

复核结果：

- 1440 x 1000：总资产与保守估值成为首屏主判断，资产组首行直接呈现 100% 暴露和主要持仓。
- 390 x 844：摘要改为纵向账本结构；资产组表只保留资产组、总资产、状态三列，不再依赖横向滚动。
- 空资产组点击后进入钱包管理并自动筛选该组，可继续完成归类。
- 截图复核发现摘要曾显示“数据状态正常”，而表格显示 15 个钱包待检查；已统一为包含缺失快照的钱包异常口径。
- 浏览器控制台无 error，生产构建和依赖安全检查通过。

下一轮候选：

- 钱包管理表的列排序、列显隐和批量操作吸顶。
- 资产组历史变化与总资产刷新质量趋势。
- 暗色主题只有在夜间高频使用需求明确后再做，不为主题数量而做。

### 2026-07-21 第二轮基线

参考：

- shadcn Data Table：https://ui.shadcn.com/docs/components/base/data-table
- shadcn Sidebar：https://ui.shadcn.com/docs/components/radix/sidebar
- Tailwind Position：https://tailwindcss.com/docs/position
- TanStack Table Sorting：https://tanstack.com/table/latest/docs/guide/sorting

观察：

- 批量移动控件长期占据工具栏，但没有选中钱包时它只是不可用噪音。
- 桌面表格缺少明确的结果数量和排序入口，资产状态只能按固定顺序扫描。
- 移动端仍渲染最小宽度 850px 的表格，资产组、金额、状态和操作列被横向截断。
- 切换资产组后仍可能保留之前的选择，存在把不可见钱包一起移动的风险。

方法判断：

- 选择动作属于临时上下文，使用条件式 selection bar，不与常驻筛选工具混排。
- 排序状态由页面显式控制，默认仍为钱包顺序；几十个本地钱包不引入 TanStack Table。
- 桌面与移动端使用同一份表格语义和交互，通过 CSS 重排，而不是维护两套容易漂移的组件。
- 资产组筛选变化时清空选择，批量操作只作用于用户当前可见且明确选中的钱包。

本轮动作：

- 工具栏增加结果数量、当前资产组、钱包顺序/资产/名称三种排序和统一搜索。
- 批量目标资产组与移动命令改为选中后出现的深色 selection bar，支持一键清除选择。
- 桌面表格压缩纵向密度，保留六列和表头全选。
- 680px 以下将同一表格行重排为三层钱包条目，并为资产组与最近资产补充窄屏标签。
- 资产组筛选和钱包搜索变化时清空旧选择，避免批量操作作用到不可见钱包。

复核结果：

- 1440 x 1000：默认排序保持钱包 1 到钱包 16；切换“资产从高到低”后钱包 13 和 $260.15 正确置顶。
- 勾选钱包后 selection bar 正确出现，切换到空的 OKX Boost 后选择立即清空。
- 390 x 844：工具栏、资产组下拉、最近资产、状态和行操作均在视口内，无横向滚动。
- 移动端展开钱包 1 后，EVM/SOL 标签、完整地址、配对、编辑、复制和删除操作均可见。
- TypeScript/Vite 构建、依赖审计和浏览器控制台检查通过。

### 2026-07-21 第三轮基线

参考：

- shadcn Chart：https://ui.shadcn.com/docs/components/chart
- Tailwind Grid Template Columns：https://tailwindcss.com/docs/grid-template-columns
- WAI-ARIA Meter Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/meter/

观察：

- 当前摘要只显示“15 个钱包待检查”，没有区分数据过期、刷新失败、跳过和快照根本没有覆盖的钱包。
- “最后刷新 07/18 12:01”需要用户自己计算数据年龄，无法快速判断是否应该信任当前金额。
- 项目只保存最新快照，没有真实历史序列；直接添加趋势图会构成伪数据表达。
- 刷新异常提示只在 stale 数组非空时出现，缺失钱包不会形成同等清晰的质量反馈。

数据边界：

- 每次成功完成刷新后追加一个摘要点，只保存时间、总资产、保守估值、稳定币/波动资产和状态计数。
- 历史最多保留 30 个点，使用现有 Vercel Blob 或本地 JSON 持久化，不保存重复的完整持仓明细。
- 质量覆盖率按当前逻辑钱包计算；`ok` 与 `stale` 计入有可用金额，`error`、`skipped` 和缺失快照分别展示。
- 覆盖率使用 meter 语义，因为它是有明确 0-100 范围的质量度量，不是正在执行的加载进度。
- 趋势只比较相邻真实样本；一个样本只显示当前值和建立历史提示。

本轮动作：

- 在总资产摘要与资产表之间增加连续的刷新可信度带，显示相对更新时间、有效覆盖率和五种钱包状态。
- “查看钱包状态”直接切换到按钱包视图，避免用户拿到异常数量后仍需寻找入口。
- 新增 `/api/history`，每次刷新后把轻量摘要写入现有 Blob/本地持久化，最多保留 30 次。
- 使用无依赖 SVG sparkline 展示真实总资产序列；单样本状态只显示历史起点。

复核结果：

- 1440 x 1000：总资产仍保持首要视觉权重；3 天前、6% 覆盖、1 个正常与 15 个缺失能够在同一信息带内对应。
- 390 x 844：可信度带改为单栏，覆盖率图例与趋势均无横向溢出，资产主表仍能在继续滚动后出现。
- 点击“查看钱包状态”后正确切换到钱包视图，并保留全部资产组范围。
- `/api/history` 在只有旧快照时返回一个真实起点，读取接口不会创建历史文件；TypeScript/Vite 构建、依赖审计和浏览器控制台检查通过。

### 2026-07-21 第四轮基线

参考：

- tweakcn Dashboard：https://tweakcn.com/editor/theme?p=dashboard
- shadcn Tabs：https://ui.shadcn.com/docs/components/base/tabs
- shadcn Table：https://ui.shadcn.com/docs/components/base/table
- Tailwind Grid Template Columns：https://tailwindcss.com/docs/grid-template-columns

观察：

- 产品已经支持多链扫描，但总览只能按资产组、币种和钱包查看，没有真实的链资产入口。
- 摘要中的“查询链 10”表达的是刷新配置，不是实际存在资产的链，容易被理解为十条链均有持仓。
- 币种表中的链分布只回答单个币种在哪些链，无法比较 BSC、Base、Arbitrum、XLayer 等整条链的资产暴露。
- 再增加一排统计卡会重复总金额，并进一步拉长移动端首屏。

方法判断：

- “链”与资产组、币种、钱包是同层互斥观察维度，进入现有 tabs，而不是另起页面或嵌套卡片。
- 分段占比条只承担比较任务，精确金额继续交给表格；图表和表格使用同一份派生数据。
- 链汇总从当前资产组范围内的真实 holdings 即时计算，不把已选择但没有资产的扫描链补成零值数据。
- 小于 $1 的链和币种不进入明细视图，但其金额仍计入总资产与保守估值，沿用既有产品规则。

本轮动作：

- 新增“链”视图，按当前资产组范围汇总总资产、保守估值、稳定币、钱包、币种和主要持仓。
- 摘要中的“查询链”改为“有效链”，副信息显示扫描范围，明确区分资产事实与刷新配置。
- 新增链资产连续分段条，使用稳定网络色映射；低于 $1 的链不进入表格，只合并为“链上小额资产”占比。
- tabs 增加完整的 `tab` / `tabpanel` 关系、单一 tab stop 和方向键/Home/End 导航。
- 切换观察维度时清空旧搜索；搜索无结果与没有资产数据使用不同空状态文案。

复核结果：

- 1440 x 1000：BSC 76.9%、Base 22.0%、Arbitrum 0.4%、XLayer 0.4% 与 0.3% 链上小额资产形成完整分布，账本金额与总览一致。
- 390 x 844：四个视图等宽排列，分段条、五项图例和链/总资产/钱包三列表格无横向溢出。
- 选择空的 OKX Boost 后总览与链表同步归零；搜索 Base 只过滤链表，不篡改当前资产组的完整占比分布。
- 从带搜索的链视图用 ArrowRight 切到币种视图后，旧查询被清空且焦点进入币种 tab，真实币种数据正常显示。

### 2026-07-21 第五轮基线

参考：

- shadcn Collapsible：https://ui.shadcn.com/docs/components/radix/collapsible
- WAI-ARIA Disclosure Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- Tailwind Responsive Design：https://tailwindcss.com/docs/responsive-design
- tweakcn Dashboard：https://tweakcn.com/editor/theme?p=dashboard

观察：

- 刷新质量已经显示有效覆盖率只有 6%，但摘要仍把 $260.15 命名为“全部资产”，表达强度超过了数据证据。
- 资产组视图仍显示资产组筛选；筛选某组后顶部按该组汇总，但资产组表仍展示全部组，形成范围冲突。
- 四个没有钱包的预设资产组各占一整行，重复展示 $0.00、0 / 0、暂无持仓和空组，稀释真实账本。
- 资产组整行使用点击事件但没有原生交互语义，键盘用户无法稳定进入组内钱包。

方法判断：

- 金额标题必须描述已知事实；覆盖不完整时说“已覆盖资产”，不把缺失数据包装为完整总额。
- 当前观察维度是资产组时，资产组本身是比较对象，不能再用同一字段过滤自身；切回该维度应恢复全局范围。
- 空组属于配置状态而非资产事实，使用 progressive disclosure 降权；触发器和内容保持清晰的展开关系。
- 主账本的进入动作使用原生 button；折叠区使用原生 details/summary，获得 Enter、Space 与展开状态语义，不额外引入组件依赖。

本轮动作：

- 摘要根据当前范围计算有效钱包数；覆盖不足时显示“已覆盖资产”和“仅计入 x / y 个钱包”。
- 资产组 tab 隐藏资产组筛选，切换回来时清除旧范围，保证摘要与表格始终同口径。
- 筛选单个资产组时把历史质量带明确标为“全局刷新质量”，避免把全局历史误读为组内历史。
- 资产组主表只保留有钱包的组；空组收进“待配置资产组”折叠区，展开后可直接前往钱包管理。
- 资产组名称改为可聚焦按钮，空组折叠采用原生 disclosure 语义，并针对窄屏改为单列配置列表。

复核结果：

- 1440 x 1000：总额明确显示“已覆盖资产”和“仅计入 1 / 16 个钱包”；主账本只剩真实的未分类资产组，四个空组压缩为一条待配置 disclosure。
- 390 x 844：资产组、总资产和状态三列保持完整；折叠列表改为单列，收起时内容区按真实高度结束，不再留下固定大块空白。
- disclosure 在焦点位于 summary 时可用 Enter 展开、Space 收起；资产组按钮可用 Enter 进入对应的钱包视图。
- 在链视图筛选 OKX Boost 后切回资产组，范围自动恢复全部资产；选中单组时质量带明确显示“全局刷新质量”。
- 两个视口的页面宽度均等于视口宽度，浏览器控制台无 error 和 warning。

### 2026-07-21 第六轮基线

参考：

- shadcn Button：https://ui.shadcn.com/docs/components/base/button
- shadcn Input Group：https://ui.shadcn.com/docs/components/radix/input-group
- shadcn Native Select：https://ui.shadcn.com/docs/components/base/native-select
- shadcn Field：https://ui.shadcn.com/docs/components/base/field
- shadcn Badge：https://ui.shadcn.com/docs/components/radix/badge
- shadcn Item：https://ui.shadcn.com/docs/components/base/item

观察：

- 业务页面存在 34 个 button、11 个 input、5 个 select 和 1 个 textarea，按钮层级、尺寸、焦点、禁用态与图标间距由页面各自维护。
- 搜索框没有清除动作；checkbox 依赖浏览器默认外观；刷新风险设置与批量选择没有在控件类型上表达不同语义。
- `status`、`address-type`、`notice` 使用不同的颜色和高度规则，同一个含义在钱包管理和资产总览中表现不一致。
- 图标操作只有部分提供 title，危险操作与普通操作的边界不够稳定；移动端触控尺寸也由多个旧规则相互覆盖。

方法判断：

- 原子组件应该管理交互语义、状态和尺寸，页面组件只管理业务组合与布局。
- 选择器继续使用 native select，保留浏览器性能、键盘行为和移动端优化，不为了统一外观引入复杂弹层。
- checkbox 用于集合选择，switch 用于立即生效的二元设置；两者不能只因为外观相似而互换。
- 状态色必须集中映射；红色只用于错误和破坏性命令，绿色不承担普通装饰。

本轮动作：

- 新增 `src/components/ui/`，建立 Button、FormControls、Badge、Feedback 与 className 合并工具。
- 资产总览、刷新设置、四类视图、钱包管理、批量导入、资产组编辑、钱包配对和所有空状态全部迁移到新原子组件。
- 清理旧 `.primary-button`、`.icon-button`、`.notice`、`.status`、`.search` 等并行样式，避免高权重旧规则干扰新组件。
- 搜索加入一键清空；刷新按钮统一 loading；图标按钮补齐 tooltip；链选择补充 `aria-pressed`；展开按钮补充 `aria-expanded`。
- 480px 以下把钱包、币种、有效链三个事实指标改为同排三列，缩短摘要高度且保留全部说明。

复核结果：

- 1440 x 900：资产总览四个 tab、筛选搜索、链分布、钱包状态、钱包管理、展开详情和批量选择栏全部通过截图复核。
- 390 x 844：顶栏、刷新范围、三列事实指标、资产组侧栏、钱包卡片行和 EVM/SOL 展开详情均无横向溢出或文字遮挡。
- 业务页面中的原生 button、input、select、textarea 标签数量归零，只允许在 `src/components/ui/` 内实现原生语义。
- TypeScript 与 Vite 生产构建通过，`git diff --check` 无格式错误。

### 2026-07-21 第七轮基线

参考：

- shadcn Sidebar：https://ui.shadcn.com/docs/components/base/sidebar
- shadcn Sidebar Blocks：https://ui.shadcn.com/blocks/sidebar
- Tailwind Overflow：https://tailwindcss.com/docs/overflow

观察：

- 原子控件已经统一，但资产组仍以内联页面标记存在，钱包页同时承担分组导航、分组维护和钱包表格三种职责。
- 移动端完整展示五个资产组和新建表单，内容区顶部约在 770px，用户进入页面后看不到第一个钱包。
- 桌面侧栏每个资产组始终显示编辑和删除按钮，低频维护操作盖过了高频筛选任务。
- 资产组计数在渲染每一行时重新遍历钱包，组件边界和派生数据边界都不清晰。

方法判断：

- 桌面与移动端应共享同一份资产组数据，但保持独立的展开策略：桌面常驻，移动端默认收起。
- 移动端触发器要同时说明当前资产组和钱包数量，选择后立即收起，让结果成为下一视觉焦点。
- 侧栏分组操作使用 hover、focus-within 和 active 三种披露条件；触屏设备始终显示，不能依赖 hover。
- 响应式组合组件负责 disclosure 与导航语义，原子 Button、Input、Badge 继续负责控件状态和焦点。

本轮动作：

- 新增 `AssetGroupManager`，集中资产组导航、改名、删除、新建和移动端折叠行为。
- 资产组钱包数量改为一次 Map 聚合；`App` 只传入派生项与持久化回调。
- 移动端新增 66px 当前资产组触发器，面板默认收起并限制为最多 56vh 的内部滚动区。
- 选择资产组或创建资产组后，移动端自动关闭面板；改名输入支持 `Escape` 无保存退出。
- 桌面侧栏改为 sticky；非当前项的维护按钮仅在悬停或键盘聚焦时显示。

复核结果：

- 390 x 844：默认收起时内容区顶部从约 770px 提前到 412px，第一个钱包回到首屏；展开面板高度为 358px。
- 选择空的 OKX Boost 后面板自动收起，并立即显示该组的空状态；页面宽度保持 390px，无横向溢出。
- 1440 x 900：移动端触发器完全隐藏，侧栏高度由重复状态下的 436.5px 降到 396.5px。
- 桌面滚动 625px 后侧栏仍停在 14px；操作按钮默认 opacity 0 / pointer-events none，悬停后恢复为可操作。
- `Escape` 取消资产组编辑生效；浏览器控制台无 error/warning，TypeScript 与 Vite 生产构建通过。

### 2026-07-21 第八轮基线

参考：

- shadcn Table：https://ui.shadcn.com/docs/components/base/table
- shadcn Item：https://ui.shadcn.com/docs/components/radix/item
- shadcn Data Table：https://ui.shadcn.com/docs/components/base/data-table
- Tailwind Responsive Design：https://tailwindcss.com/docs/responsive-design

观察：

- 资产组和链表在窄屏只保留部分列，币种与钱包表仍维持 980px / 1180px 最小宽度，完整信息依赖横向滚动。
- 隐藏次要字段减少了拥挤，但用户无法在移动端核对数量、资产组、链分布、合约和刷新状态。
- 导出属于低频命令，独占一整行会挤压视图切换和筛选区域。
- `.asset-cell span` 与 `.chain-identity span` 等宽泛选择器会覆盖徽标组件的 grid 布局，导致钱包编号和链图标偏向左上角。

方法判断：

- 桌面表格与移动信息项是同一账本的两种信息形态，共享派生数据和筛选状态，但不强迫一个宽表承担所有断点。
- 移动资产项采用 media、content、actions、footer 组合，金额保持首层，事实字段和持仓明细依次展开，不隐藏业务数据。
- 当前数据量和交互复杂度不需要引入 TanStack Table；排序、筛选继续由页面状态控制。
- 资产身份徽标负责尺寸和居中，父级文本样式只能命中文本容器，不能覆盖徽标的 `display`、对齐或行高。

本轮动作：

- 新增 Item 原子组件和 LedgerItem 账本模式，统一媒体、标题、金额、事实字段、明细与操作的位置。
- 资产组、链、币种和钱包四个视图在 760px 以下切换为完整移动账本项，桌面继续使用语义化 table。
- 导出命令改为与视图 tabs 同排的 Lucide 图标按钮，保留可访问名称和 tooltip。
- 事实栏按 1 / 2 / 3 个字段动态分列；钱包状态、链色和资产组入口沿用已有业务语义。
- 收窄资产单元格与链身份的文本选择器，恢复钱包编号、链图标和分组图标的统一居中约束。

复核结果：

- 1440px：四个桌面账本保持完整表格层级，移动列表隐藏，搜索、筛选和导出不改变工具栏高度。
- 390px：四个视图均显示完整移动账本项，页面宽度等于视口；币种数量、链分布、合约和钱包状态无需横向滚动。
- 740px：桌面宽表隐藏、移动账本显示，断点与工具栏重排保持一致。
- 钱包编号在 40 x 40 徽标中居中；链图标在桌面 38 x 38 和移动 40 x 40 徽标中均为等距偏移。
- 资产组入口能切换到对应钱包，币种搜索能收敛结果；控制台、生产构建、依赖审计和格式检查通过。

### 2026-07-21 第九轮基线

参考：

- shadcn Dialog：https://ui.shadcn.com/docs/components/radix/dialog
- shadcn Sheet：https://ui.shadcn.com/docs/components/radix/sheet
- WAI-ARIA Modal Dialog Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- MDN dialog element：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog

观察：

- “刷新范围”以内联面板插入总览，桌面占高约 106px，并把资产摘要整体向下推。
- “批量导入”桌面面板高约 360px，移动端高约 425px；移动端钱包工作区被推到约 769px 后才出现。
- 导入输入为空时，行数错误回退为已有地址数量，实际显示“32 行”，混淆输入统计与钱包统计。
- 原生 `showModal()` 能提供 top layer、背景 inert 和 Escape，但实测从最后一个控件按 Tab 时焦点会短暂落到 body，未稳定满足直接循环要求。

方法判断：

- 页面导航、筛选和资产状态继续留在主界面；刷新配置与批量导入属于有明确开始、完成和取消边界的临时任务，使用 modal dialog。
- 对话框统一采用 header、scrollable body、sticky footer；桌面居中，680px 以下切换为贴底 Sheet，同一组件不分叉业务逻辑。
- 焦点进入标题，Tab 与 Shift+Tab 只能在对话框内循环，Escape 关闭，关闭后返回真实触发按钮；背景同时锁定滚动和交互。
- 刷新范围使用草稿状态，只有“应用范围”才更新真实配置；关闭、Escape 或路由切换都放弃未应用修改。
- 复杂焦点管理使用 shadcn 同源的 Radix Dialog，不继续扩展不完整的原生焦点补丁。

本轮动作：

- 新增 `Dialog`、`DialogHeader`、`DialogBody` 和 `DialogFooter` 原子组件，并引入 `@radix-ui/react-dialog`。
- 刷新范围迁入响应式 Dialog/Sheet；网络选择从带 X 的 toggle button 改为真实 checkbox，并规范 BSC、XLayer、zkSync 等名称。
- 批量导入迁入 Dialog/Sheet，正文获得稳定可用高度；行数使用真实输入，空输入禁用提交，校验错误在任务内部显示。
- 导入成功后自动关闭；页面按钮导航与浏览器前进/后退都会清理临时任务状态。
- 删除旧 refresh settings、management import、chain toggle 与未使用 selection 样式，避免新旧组件并行。

复核结果：

- 1440 x 1000：两个对话框均为 840px 宽的居中任务窗口，背景锁定，标题、表单与操作区层级清晰。
- 740 x 900：对话框左右各保留 16px，三列网络选择完整，无横向溢出。
- 390 x 844：对话框切换为 760px 高贴底 Sheet；批量输入区填满可用正文，操作区固定在底部。
- 390 x 667：刷新正文 `scrollHeight 507 > clientHeight 445`，只滚动正文，头部与操作区始终可见。
- Tab 从最后操作回到关闭按钮，Shift+Tab 反向回到最后操作；Escape 关闭并把焦点返回“刷新范围”或“批量导入”触发按钮。
- 修改 Linea 后按 Escape 再打开仍为默认 10 条网络；应用后可保留 11 条；浏览器回退会关闭对话框并恢复正确页面。

### 2026-07-21 第十轮基线

观察：

- 钱包编号和链图标的容器边界已经几何居中，但字符墨迹与 Lucide 路径的视觉重心仍显得偏左上。
- 钱包与链标识在桌面表格和移动账本中存在重复结构，单独修补某个视图容易再次产生偏差。

方法判断：

- 身份标识应拆成固定尺寸的外框和独立的图形层；外框处理边框与颜色，图形层处理 SVG、文字行高和光学校正。
- 光学校正属于原子组件约束，业务视图只提供内容与语义类名，不直接控制内部图形坐标。

本轮动作：

- 新增 `IdentityMark` 原子组件，统一钱包编号和链图标的内部结构。
- 图形层使用固定尺寸、块级 SVG、双轴 flex 居中，并向右下校正 1px；钱包编号启用等宽数字。
- 桌面钱包表、移动钱包列表、桌面链表和移动链列表全部迁移到同一组件。

复核结果：

- 1440px：钱包标识保持 40 x 40，链标识保持 38 x 38，内部图形统一相对几何中心向右下 1px。
- 390 x 844：钱包与链标识保持 40 x 40，内部图形偏移一致，页面无横向溢出。
- TypeScript 与 Vite 生产构建通过，CSS 格式检查通过。

### 2026-07-21 第十一轮基线

参考：

- shadcn Alert Dialog：https://ui.shadcn.com/docs/components/base/alert-dialog
- Radix Alert Dialog：https://www.radix-ui.com/primitives/docs/components/alert-dialog
- WAI-ARIA Alert Dialog Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
- WAI-ARIA Modal Dialog Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

观察：

- 删除资产组和钱包地址仍使用浏览器原生 `window.confirm`，视觉、影响说明、焦点顺序和关闭后的焦点落点无法由应用控制。
- 删除资产组后触发按钮会随对象消失，需要把焦点移到“未分类”或“全部钱包”；取消删除则应返回原触发按钮。
- 上轮对钱包与链标识使用了右下 1px 的光学校正，但实测与用户反馈表明这仍会形成可见偏移，不应覆盖几何中心。

方法判断：

- 不可逆操作使用专用 alert dialog，明确对象、影响和不会发生的副作用；默认焦点放在破坏性更低的取消操作上。
- 对话框关闭时优先返回原触发按钮；若对象已经删除，则按业务顺序寻找稳定的后备焦点。
- 身份标识内部层绝对铺满外框，以外框的完整 border box 为中心，不再使用经验性的 transform 偏移。

本轮动作：

- 新增 `ConfirmDialog` 原子组件，并引入 `@radix-ui/react-alert-dialog`；资产组和地址删除全部迁移，移除原生 confirm。
- 对话框补齐受影响钱包数、归类结果、地址类型、所属钱包和完整地址，危险操作统一使用 destructive 按钮。
- 增加原触发器与后备焦点恢复逻辑，初始焦点固定为取消；Escape 与键盘循环由 Radix 管理。
- `IdentityMark` 图形层改为 `position: absolute; inset: 0; place-items: center`，钱包文字和链 SVG 与外框中心完全重合。

复核结果：

- 1280 x 720 与 390 x 844：钱包文字、链图标、内部图形层和外框的中心坐标一致，transform 为 none。
- 390 x 844：两个删除对话框均无横向溢出，完整地址可换行，取消获得初始焦点，Escape 关闭后返回触发按钮。
- 未确认任何真实删除操作，钱包和资产组数据没有因视觉测试发生变化。

### 2026-07-21 第十二轮基线

参考：

- shadcn Sonner：https://ui.shadcn.com/docs/components/base/sonner
- shadcn Toast：https://ui.shadcn.com/docs/components/base/toast
- WAI-ARIA 1.2：https://www.w3.org/TR/wai-aria/
- WAI-ARIA Alert Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/alert/

观察：

- 保存成功提示以内联 Notice 插入页面流，持续存在并推动正文；刷新中的部分成功、登录提醒等警告也沿用成功样式。
- 本地状态更新后会立即显示保存成功，即使后续云端 PUT 失败，反馈也无法准确说明最终持久化结果。

方法判断：

- 短暂、非阻塞的操作结果使用 polite live-region toast；需要持续处理的错误和风险保留在页面内。
- toast 不抢夺焦点，提供可访问名称明确的关闭按钮；只有云端写入成功后才反馈云端保存成功。
- 旧 Toast 组件已被 shadcn 标记为 deprecated，本项目采用 Sonner，避免维护另一套通知状态机。

本轮动作：

- 新增统一 `ToastViewport`，补齐 success、info、warning、error、loading 图标、样式和关闭行为。
- 钱包名称、配对、资产组等持久化成功改为 toast；刷新部分完成、登录提醒和旧快照改为 warning toast。
- 移除会推动页面的临时成功 Notice；持久化失败继续使用页面内错误提示。

复核结果：

- 1280 x 720：通知固定在右下角，页面高度、滚动位置和标题坐标均不变化。
- 390 x 844：通知左右各保留 12px，页面 `clientWidth` 与 `scrollWidth` 同为 390px。
- live region 使用 `aria-live="polite"`，关闭按钮名称为“关闭通知”；浏览器控制台无 error/warning。

### 2026-07-21 第十三轮基线

观察：

- 钱包编号和链 SVG 的 DOM 边界与外框中心完全重合，但实际字形墨迹和图形视觉重心仍偏左上。
- 仅使用几何中心数据不能代替最终页面的视觉检查。

方法判断：

- 保持固定外框和表格行尺寸不变，在共享图形层使用光学校正。
- 钱包与链使用同一组偏移变量，桌面表格和移动账本不分别覆盖坐标。

本轮动作：

- `IdentityMark` 图形层增加可配置的 x/y 偏移变量。
- 钱包和链标识统一向右、向下校正 1px，其他图标组件不受影响。

复核结果：

- 1280 x 720：钱包编号、链图标视觉居中，外框尺寸和表格行高保持不变。
- 390 x 844：16 个可见钱包标识和 4 个可见链标识均应用同一校正，无裁切。
- 两个移动页面的 `clientWidth` 与 `scrollWidth` 同为 390px，无横向溢出。

### 2026-07-21 第十四轮基线

参考：

- shadcn Tooltip：https://ui.shadcn.com/docs/components/base/tooltip
- Radix Tooltip：https://www.radix-ui.com/primitives/docs/components/tooltip
- WAI-ARIA Tooltip Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/

观察：

- 图标按钮使用 CSS `::after` 和原生 `title` 同时显示说明，形成重复提示。
- 伪元素仍属于按钮所在的 overflow 容器，表格滚动区和内容面板可以裁掉提示。
- 手写提示没有完整表达 `role="tooltip"`、`aria-describedby`、焦点触发和 Escape 关闭关系。

方法判断：

- Tooltip 是说明而不是操作面板，内容不接收焦点，焦点始终留在触发按钮。
- 全站共用根级 Provider 的打开和连续浏览延迟；浮层通过 Portal 输出到 body，并启用边缘碰撞检测。
- 图标按钮只保留一个提示来源；禁用按钮使用外层触发区保留鼠标说明能力。

本轮动作：

- 新增 Radix 驱动的 `TooltipProvider` 和 `Tooltip` 原子组件，统一 450ms 首次延迟、120ms 连续浏览间隔和 7px 浮层距离。
- `IconButton` 全量接入 Tooltip，移除 `data-tooltip`、伪元素和重复原生 `title`。
- Tooltip 增加 Portal、箭头、视口碰撞、轻量进入动效，并沿用全局 reduced-motion 约束。

复核结果：

- 1280 x 720：钱包行操作提示完整显示在表格之外；浮层 DOM 不属于 `.content`，不受 overflow 裁切。
- 键盘聚焦会立即显示提示并建立 `aria-describedby`；Escape 关闭后焦点仍留在原按钮。
- 390 x 844：右侧编辑按钮提示边界为 265–347px，完全位于视口内；页面 `clientWidth` 与 `scrollWidth` 同为 390px。
- 当前页面 32 个图标按钮全部具有 `aria-label`，旧 `title`、`data-tooltip` 和无名称按钮数量均为 0；控制台无 error/warning。

### 2026-07-21 第十五轮基线

参考：

- shadcn Tabs：https://ui.shadcn.com/docs/components/base/tabs
- Radix Tabs：https://www.radix-ui.com/primitives/docs/components/tabs
- WAI-ARIA Tabs Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/tabs/

观察：

- 资产组、链、币种和钱包四个 tab 在页面内重复维护 role、选中态、tabIndex、方向键和焦点查询。
- 选项宽度由文字长度决定，“资产组”明显宽于其他三项，分段控制的节奏不稳定。
- 选中态使用大范围浮层阴影，与克制的运营账本语气不一致。

方法判断：

- 四个视图均使用已加载的本地数据，可以采用 automatic activation；方向键移动焦点时立即显示面板，不产生网络等待。
- Tabs 原子层负责 tablist、tab、tabpanel、roving focus、Arrow、Home/End 和首尾循环；页面只维护业务 value。
- Tab 面板首个内容不一定可聚焦，因此面板本身进入键盘顺序；导出命令仍按 DOM 顺序位于 tablist 与 panel 之间。

本轮动作：

- 新增 Radix 驱动的 `Tabs`、`TabsList`、`TabsTrigger` 和 `TabsContent` 原子组件。
- 移除页面内手写 `handleAssetViewKeyDown`、id、aria-controls、aria-selected 和 tabIndex；四个视图改由受控 Tabs 渲染。
- TabsList 根据子项数建立等宽网格；选中态阴影收敛为 1px 轻阴影，保留清晰边框和 focus ring。
- 四个面板使用各自 value 和自动生成的双向 ARIA 关联，并设置 `tabIndex=0`。

复核结果：

- 1280 x 720：四个 trigger 均为 83px，列表高 44px；选中态不再产生浮动卡片感。
- 真实 Tab 顺序从“查看钱包状态”进入当前 trigger，之后依次到导出按钮和 tabpanel。
- ArrowRight、Home、End 和首尾循环均同时移动焦点并自动切换面板；trigger 与 panel 的 ARIA id 双向匹配。
- 390 x 844：四个 trigger 均为 67px，列表宽 290px；页面 `clientWidth` 与 `scrollWidth` 同为 390px。
- 点击“链”后链分布与筛选工具立即显示；冷启动控制台无 error/warning，生产构建通过。

### 2026-07-21 第十六轮基线

参考：

- shadcn Checkbox：https://ui.shadcn.com/docs/components/base/checkbox
- MDN Checkbox：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/checkbox
- MDN `indeterminate`：https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/indeterminate
- WAI-ARIA Checkbox Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/

观察：

- checkbox 的原生 input 被压缩到 1px，可见方框覆盖在上层，鼠标直接点击时会被视觉层拦截。
- 批量选择部分钱包后，全选控件仍显示未选中，无法表达集合处于 mixed 状态；选中行与普通行也缺少视觉差异。
- 钱包与链身份标记使用统一右下 1px 光学校正，但 17px SVG 位于偶数尺寸外框中时仍落在半像素，图形看起来没有稳定居中。

方法判断：

- 保留原生 checkbox 语义和键盘行为，让透明 input 覆盖完整命中区；部分选中时同时设置 DOM `indeterminate` 属性和 `aria-checked="mixed"`。
- 身份标记使用共享中心锚点，不再按页面或图标类型叠加经验偏移；内部 SVG 采用偶数尺寸以落在完整 CSS 像素上。
- 钱包编号使用固定宽度等宽数字层，使一位和两位编号共享同一中心坐标。

本轮动作：

- checkbox 视觉层关闭 pointer events，原生 input 覆盖完整控件；全选控件增加 Minus 图标和 mixed 状态。
- 钱包选中行增加左侧强调线、背景、hover 和 focus-within 状态。
- `IdentityMark` 改为 `50% + translate(-50%, -50%)` 中心定位；钱包编号层固定为 20 x 18px，链 SVG 统一为 18 x 18px。

复核结果：

- 1280 x 720：钱包 40 x 40 外框与编号层中心坐标完全一致；链 38 x 38 外框与 SVG 中心坐标完全一致。
- 390 x 844：钱包与链标记中心坐标一致，页面 `clientWidth` 与 `scrollWidth` 同为 390px。
- 钱包 checkbox 可直接点击；部分选择后全选控件的 `indeterminate` 为 true、`aria-checked` 为 mixed，选中行反馈可见。

### 2026-07-21 第十七轮基线

参考：

- shadcn Table：https://ui.shadcn.com/docs/components/base/table
- shadcn Data Table：https://ui.shadcn.com/docs/components/base/data-table
- Tailwind Overflow：https://tailwindcss.com/docs/overflow
- WAI Tables Tutorial：https://www.w3.org/WAI/tutorials/tables/
- WAI Caption & Summary：https://www.w3.org/WAI/tutorials/tables/caption-summary/

观察：

- 钱包管理、资产组、链、币种和钱包五张表重复维护 table、thead、tbody、tr、th、td 与滚动包装层，没有共享组件契约。
- 表格没有 caption，屏幕阅读器的 Tables Mode 无法快速区分五张账本；列头虽使用 th，但没有显式 scope。
- 金额、数量和钱包数与普通文本全部左对齐，纵向比较时视线需要追踪不同数字宽度。
- 16 行钱包管理表随整页滚动，用户浏览后半段时会失去列头和管理工具的上下文。

方法判断：

- 表格原子层只负责结构语义、滚动和视觉令牌；每张数据表的排序、筛选、列定义与业务行为仍留在对应视图。
- 当前数据量和交互复杂度不需要引入 TanStack Table；只有出现分页、列显隐、表头排序等组合需求时再升级。
- caption 作为 table 的直接子元素并视觉隐藏；简单单层表头为每个 th 设置 `scope="col"`。
- 数字列的标题与单元格同时右对齐并使用 tabular numbers；窄屏继续使用既有移动账本或管理卡片行。

本轮动作：

- 新增 `Table` 原子组件族，统一响应式 overflow 容器、caption、header/body/row/head/cell 和 numeric 属性。
- 五张表全部迁移；每张表增加独立 caption，所有列头自动获得 column scope。
- 金额、数量、钱包数和地址数统一右对齐；操作列右对齐，表格行统一轻量 hover。
- 钱包管理表增加 420–680px 的视口自适应滚动区并保留粘性表头；980px 以下恢复完整文档流。

复核结果：

- 1280 x 720：管理表容器高 460px、内容高 1305px，滚动 220px 后表头与容器顶部坐标同为 254.875px。
- 五张表的 caption 均成为可访问名称，合计 32 个列头的 scope 均为 col，所有 numeric 标题和单元格计算样式均为右对齐。
- 钱包资产表六列实测宽度为 299 / 137 / 125 / 87 / 473 / 125px，主要持仓保留最大阅读空间。
- 390 x 844：管理表包装层宽 368px，clientWidth 与 scrollWidth 相同；资产桌面表隐藏、移动账本显示，页面无横向溢出。

### 2026-07-21 第十八轮基线

观察：

- `IdentityMark` 的外框、内部字形层和 SVG 边界框虽然几何中心完全重合，但可见墨迹仍会因字体边距、描边栅格化和半像素落点显得偏左上。
- 1280 x 720 的实际截图中，钱包编号的可见墨迹中心相对外框中心偏左 0.5px、偏上 1px；链图标分别偏左和偏上 0.5px。
- 之前只验证 DOM 边界框中心，无法覆盖用户真正看到的视觉重心。

方法判断：

- 外框继续使用严格几何中心作为稳定锚点，再通过组件级 CSS 变量提供小幅光学校正，避免在各业务页面写分散的 transform。
- 数字字形和 SVG 描边使用各自的实测值；校正只作用于钱包与链身份标记，不改变按钮、资产组和代币图标。
- 验收同时检查 DOM 几何中心、截图可见墨迹中心与桌面/移动布局，不能只依赖其中一种测量。

本轮动作：

- `IdentityMark` 的中心变换增加 `--identity-mark-optical-x` 与 `--identity-mark-optical-y`，默认仍为 0。
- 钱包编号向右 0.5px、向下 1px；链 SVG 向右和向下各 0.5px，使可见内容落在外框视觉中心。

复核结果：

- 1280 x 720：钱包编号和链 SVG 的截图可见墨迹中心相对外框偏差均从负值归零；内部定位层仍以同一 `50%` 锚点计算。
- 390 x 844：钱包与链标记分别保持对应光学校正值，页面 `clientWidth` 与 `scrollWidth` 同为 390px。
- 修正仅命中 `.wallet-badge` 与 `.chain-badge` 的内部 glyph，外框尺寸、表格列宽、资产组图标和代币图标均未变化。

### 2026-07-21 第十九轮基线

参考：

- shadcn Collapsible：https://ui.shadcn.com/docs/components/base/collapsible
- Radix Collapsible：https://www.radix-ui.com/primitives/docs/components/collapsible
- WAI-ARIA Disclosure Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- Tailwind Transition Property：https://tailwindcss.com/docs/transition-property

观察：

- 移动端资产组面板手写 `open` 条件渲染、`aria-expanded` 和点击切换；总览待配置资产组则使用原生 `details/summary`，同一种交互存在两套状态模型。
- 两处 chevron、展开文案和内容显隐依赖不同选择器，键盘和响应式行为只能分别维护。
- Collapsible 初次迁移时，业务层 `display: grid` 覆盖了原生 `hidden`，造成状态已经关闭但内容仍显示；仅检查 `data-state` 无法发现这种渲染冲突。

方法判断：

- Disclosure 由可聚焦 button 和受其控制的内容区组成；Enter 与 Space 切换，button 通过 `aria-expanded` 表达状态，并用稳定 `aria-controls` 指向内容 id。
- 原子层只封装 Root、Trigger、Content 和共享状态类；受控或非受控状态、触发文案与业务选择行为仍由使用方决定。
- 响应式侧栏继续由媒体查询同步受控 open：桌面常驻，移动折叠；选择资产组后仅在移动端自动收起。
- 共享 Content 必须显式保护 `[hidden] { display: none; }`，避免任何业务 display 覆盖语义显隐。

本轮动作：

- 新增 Radix 驱动的 `Collapsible`、`CollapsibleTrigger` 和 `CollapsibleContent` 原子组件。
- 移动端资产组侧栏与待配置资产组列表全部迁移；移除手写 click/expanded 逻辑及 `details/summary` 状态选择器。
- 两处 Trigger 与 Content 建立稳定 id 关联；chevron 和“查看/收起”文案统一读取 `data-state`。
- Content 使用 Radix 高度变量执行 160ms 展开动效，全局 reduced-motion 继续将动画压缩到 0.00001s。

复核结果：

- 1280 x 720：资产组侧栏状态为 open、内容高 320px 且始终可见；待配置资产组展开为三列命令区，页面无横向溢出。
- 390 x 844：资产组关闭态内容不可见；打开后内容高 358px，选择 Virtuals 后自动关闭并同步为 1 个钱包。
- 两个 Trigger 的 `aria-expanded`、`aria-controls` 与 Content id 一致；Space、Enter 均可切换，切换后焦点保持在 Trigger。
- 待配置区展开后显示 3 个命令项并把文案从“查看”切换为“收起”；桌面和移动页面的 `clientWidth` 与 `scrollWidth` 分别相同。
- 冷启动浏览器控制台无 error/warning，生产构建通过。

### 2026-07-21 第二十轮基线

参考：

- shadcn Progress：https://ui.shadcn.com/docs/components/base/progress
- Radix Progress：https://www.radix-ui.com/primitives/docs/components/progress
- WAI-ARIA Meter Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/meter/
- MDN Meter Role：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/meter_role
- Tailwind Flex Basis：https://tailwindcss.com/docs/flex-basis

观察：

- 资产占比、资产构成、刷新质量和链分布分别维护 track、segment、内联 width 与动画，共有四套相似实现。
- 只有刷新质量使用 `meter`；资产占比只是带 aria-label 的普通 div，资产构成只有“资产构成”四个字，无法让辅助技术理解各类别比例。
- 初次迁移后，72px 资产占比条在表格单元中被 flex 压缩到 66px；覆盖率视觉 segment 为 6.25%，但 aria-valuenow 被提前取整成 6。

方法判断：

- 已知上下限内的当前比例属于 meter，不是任务完成进度；`progressbar` 只用于加载、上传等任务过程。
- 原生 `meter` 通常优先，但当前条同时需要多段状态、极小段保留和统一主题，因此使用自定义 role，并完整提供 label、valuemin、valuemax、valuenow 与必要的 valuetext。
- 多类别构成不是单一标量，用带完整文本替代的 `img`；颜色段本身统一 `aria-hidden`，详细数据留在 label 和外部 legend。
- Track 负责尺寸、裁切和背景，Segment 只通过受控 CSS `flex-basis` 表达 0–100%；极小但非零的数据可以显式保留 1px。
- ARIA 数值保留真实小数，界面可按阅读需要取整；可访问语义必须和实际图形长度一致。

本轮动作：

- 新增 `MeterBar`、`DistributionBar` 和 `BarSegment` 原子组件，集中裁剪异常值、ARIA 范围、可读标签和宽度变量。
- 四处量化条全部迁移，移除业务组件中的内联 width；共享 200ms flex-basis 动效并继承 reduced-motion。
- 资产构成补充稳定币与波动资产百分比；刷新覆盖率补充“16 个钱包中 1 个有可用资产数据”。
- 桌面资产占比条固定 72px、移动账本固定 52px；链分布对非零小额段保留最小 1px。

复核结果：

- 1280 x 720：资产构成条 494.3 x 8px，稳定币/波动资产段为 76.7% / 23.3%；覆盖率语义值和视觉段均为 6.25%。
- 链分布条 1210 x 10px，五段实际宽度合计 1209.95px；可读标签完整包含 BSC、Base、Arbitrum、XLayer 与链上小额资产比例。
- 390 x 844：链分布宽 344px，小额资产段保持 1px；钱包占比条均为 52 x 4px，页面 `clientWidth` 与 `scrollWidth` 同为 390px。
- 可访问树将资产占比与覆盖率识别为 meter，将资产构成与链分布识别为带名称的 img；冷启动控制台无 error/warning。

### 2026-07-21 第二十一轮基线

参考：

- shadcn Badge：https://ui.shadcn.com/docs/components/base/badge
- shadcn Item：https://ui.shadcn.com/docs/components/base/item
- Tailwind Text Overflow：https://tailwindcss.com/docs/text-overflow
- Tailwind Flex Wrap：https://tailwindcss.com/docs/flex-wrap
- MDN Unordered List：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ul

观察：

- 资产组、链和钱包的桌面表格与移动账本共有 6 处“主要持仓”，都重复拼接图标、币种、数量、分隔点和市值。
- 原实现把量化持仓做成与普通 Badge 相似的浅色块，币种、数量和市值处于同一文字权重，扫描时难以快速定位市值。
- 多个持仓只是 flex 容器中的 span，没有 list/listitem 结构；超长币种或数量也没有明确的收缩优先级。

方法判断：

- Badge 用于状态、分类和短元数据；持仓是带图标、主标识和两组数值的内容项，应采用超紧凑 Item 结构，而不是继续扩展 Badge。
- 多个持仓的顺序不改变集合含义，使用 ul/li；列表允许自然换行，每个持仓项内部保持单行，避免数值被拆散。
- 市值是首要决策数据，保持完整且提高字重；数量次要并允许省略，币种只在异常长时截断。被视觉截断的原始文本仍保留在可访问树中。
- 图标使用固定 18 x 18px 槽位，槽位与图片几何中心必须一致；非交互持仓项不增加 hover、focus 或伪按钮反馈。

本轮动作：

- 新增 `HoldingList` 与 `HoldingItem` 原子组件，统一 list/listitem 语义、空状态、图标槽、数值标签和截断规则。
- 新增业务级 `TokenHoldingList` 渲染入口，资产组、链和钱包的桌面与移动持仓全部迁移，删除 `token-stack` 与 `token-pill` 临时样式。
- 币种、数量和市值拆为独立层级，使用细分隔线替代文本圆点；数量与市值采用 tabular numbers，市值使用更高对比和字重。

复核结果：

- 1280 x 720：链视图持仓项高度均为 26px；USDT、VIRTUAL、ETH 和 OKB 的实际宽度为 185.23 / 190.34 / 148.52 / 150.46px，表格保持原列宽且页面无横向溢出。
- 390 x 844：4 个可见持仓项右边界最大为 213.34px，页面 `clientWidth` 与 `scrollWidth` 同为 390px；代币图标与 18px 槽位的 x/y 中心偏差均为 0。
- 注入 20 位数量后，可见槽宽 66px、内容宽 144px，省略号生效且持仓项右边界为 227.95px，未造成页面溢出。
- 可访问快照将“主要持仓”识别为命名 list，每个代币识别为 listitem，并读出“数量”和“市值”；控制台无 error/warning。

### 2026-07-21 第二十二轮基线

参考：

- shadcn Chart：https://ui.shadcn.com/docs/components/base/chart
- W3C Use of Color：https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- Tailwind Flex Wrap：https://tailwindcss.com/docs/flex-wrap
- MDN Unordered List：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ul

观察：

- 资产构成、刷新质量和链分布分别维护三套色块、标签、数值与换行规则，DataBar 已经统一但配套图例仍会漂移。
- 资产构成图只有稳定币和波动资产两段，“折价缓冲”却使用与两个真实分段相同的实心色块，容易被误读为第三类资产。
- 刷新图例仅用普通 div/span，链图例的数值才使用等宽数字；三处可访问结构和视觉权重不一致。

方法判断：

- 图例配置应与图形结构解耦，原子层统一色块、可见名称、数值和密度，业务层只提供语义与颜色 token。
- 颜色不能成为唯一编码；每个色块始终与可见文字和值绑定，集合使用带名称的 ul/li 结构。
- 图形中的真实类别使用实心标记；不对应图形分段的估值调整使用空心标记，避免建立错误的数据映射。
- 图例项内部保持单行，图例容器自然换行；业务区域可通过 CSS 变量调节行列间距，不复制结构样式。

本轮动作：

- 新增 `LegendList` 与 `LegendItem` 原子组件，统一 list/listitem 语义、默认与 compact 密度、色块、标签和等宽数值。
- 资产构成、钱包刷新状态和链上资产分布全部迁移；删除三套 div/span/i 结构及重复尺寸规则。
- 折价缓冲改为空心方块；稳定币、波动资产、刷新状态与链色仍使用实心方块，并共享既有图表颜色 token。

复核结果：

- 1280 x 720：资产图例宽 494.31px、高 16px；刷新图例宽 532.94px、高 14px；两组资产色和五组状态色均与对应图形段完全匹配。
- 链视图 5 个图例色与 5 个分段逐项匹配，图例宽 1210px、高 16px；折价缓冲背景为透明，边框为独立中性色。
- 390 x 844：资产图例自然分为 2 行、状态图例 1 行、链图例 3 行，最大项右边界均在视口内，`clientWidth` 与 `scrollWidth` 同为 390px。
- 13 个可见图例色块与各自图例项的垂直中心偏差均为 0；可访问快照识别出 3 个命名 list 和对应 listitem，控制台无 error/warning。

### 2026-07-21 第二十三轮基线

参考：

- MDN Center an element：https://developer.mozilla.org/en-US/docs/Web/CSS/How_to/Layout_cookbook/Center_an_element
- MDN place-items：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/place-items
- MDN inset：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/inset
- Tailwind Place Items：https://tailwindcss.com/docs/place-items

观察：

- 钱包编号和链 SVG 共用 `IdentityMark`，但内部 glyph 只有 18px 高，再使用 `top/left: 50%` 、`translate(-50%)` 和分类像素偏移叠加定位。
- 旧规则实际将钱包内容中心移到 `(+0.5px, +1px)`，链图标中心移到 `(+0.5px, +0.5px)`；外框居中不等于内容居中。
- 手工光学补偿对特定字形可能有效，但不适合同时承载一位数、两位数和不同 SVG 的通用原子组件。

方法判断：

- 内层使用 `position: absolute; inset: 0`覆盖标识的完整内容盒，不再以一个局部 18px 行盒作为定位基准。
- `display: grid; place-items: center` 同时约束水平和垂直中心；数字与 SVG 使用同一套几何规则。
- 原子组件不再提供钱包或链级别的位移变量，避免响应式尺寸变化后重新校正。

本轮动作：

- 将 `.ui-identity-mark-glyph` 改为覆盖容器的全尺寸 Grid 居中层，行高统一为 1。
- 删除钱包 `0.5px / 1px` 和链 `0.5px / 0.5px` 的单独光学偏移，保留外框尺寸、色彩和业务结构不变。

复核结果：

- 1280 x 900：40px 钱包标识的文本框与外框 x/y 中心偏差均为 0；38px 链标识的 SVG 与外框 x/y 中心偏差均为 0。
- 390 x 844：16 个可见钱包编号的文本中心偏差全部为 0；4 个可见链图标的 SVG 中心偏差全部为 0。
- 移动页面 `clientWidth` 与 `scrollWidth` 同为 390px，无横向溢出；控制台 0 error / 0 warning。

### 2026-07-21 第二十四轮基线

参考：

- shadcn Item：https://ui.shadcn.com/docs/components/base/item
- shadcn Badge：https://ui.shadcn.com/docs/components/base/badge
- Tailwind Text Overflow：https://tailwindcss.com/docs/text-overflow
- MDN Code：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/code
- MDN Unordered List：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ul

观察：

- 钱包管理、钱包资产桌面表格和移动账本共有 3 套 `address-stack`，均将链类型、文本圆点与截断地址拼成普通 span。
- 展开详情另外维护 div 列表、类型 Badge、标签、完整地址、配对和操作四列；地址摘要与详情没有共享结构契约。
- 资产总览的钱包标题已显示 EVM/SOL Badge，新地址行再显示链类型后会造成连续重复。

方法判断：

- 钱包地址是技术标识符，使用等宽 `code`；链类型是稳定的索引列，不与地址拼成一段描述文本。
- 多个地址是一组同类项，使用命名 ul/li；紧凑摘要显示短地址，listitem 的可访问名称保留完整值。
- 展开详情是业务组合组件：统一列表和四个槽位，编辑、配对与删除状态仍由页面持有。
- 类型 Badge 在详情中用于短分类；紧凑摘要使用无边框的固定文本列，避免两行地址叠加过多徽章。

本轮动作：

- 新增 `WalletAddressList`、`WalletAddressDetailList` 和 `WalletAddressDetailItem`，集中短地址、完整值、列表语义、详情槽位和响应式重排。
- 钱包管理摘要、详情、资产总览桌面钱包和移动钱包全部迁移，删除旧 `address-stack` 与 `wallet-detail-*` 结构样式。
- 资产总览标题删除重复 EVM/SOL Badge，保留有额外来源意义的 OKX Badge。

复核结果：

- 1280 x 900：紧凑类型列与地址列间距固定为 6px；两个详情项均为 902 x 66px，完整 EVM/SOL 地址均无截断，配对和操作最右端与项容器对齐。
- 390 x 844：详情项宽 308px，完整地址在 260px 可见槽中省略；配对和操作自动移入第二列，最右边界为 367px。
- 移动钱包总览中地址列宽 192px、右边界 265px，卡片右边界 379px；页面 `clientWidth` 与 `scrollWidth` 同为 390px。
- 可访问快照将钱包摘要和地址详情识别为命名 list/listitem，并读取完整地址；控制台 0 error / 0 warning。

### 2026-07-21 第二十五轮基线

参考：

- shadcn Avatar：https://ui.shadcn.com/docs/components/base/avatar
- shadcn Item：https://ui.shadcn.com/docs/components/base/item
- Tailwind Width：https://tailwindcss.com/docs/width
- Tailwind Height：https://tailwindcss.com/docs/height
- MDN Color：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color

观察：

- 同一个资产组在钱包管理侧栏使用 30px 文件夹，在资产组总览使用 40px 文件夹，在钱包账本中却退化成 8px 圆点；移动端当前组还固定使用绿色图标，切换主题后身份色不随之变化。
- 文件夹图标由多处业务 JSX 直接拼装，尺寸和颜色由父按钮的通用 SVG 规则共同决定，无法保证不同上下文中的比例和几何中心一致。
- 圆点只能传递颜色，无法与“资产组 / 文件夹”的信息架构形成稳定视觉映射，也与总览和管理页的文件夹语义断裂。

方法判断：

- 资产组需要一个独立身份原子：外框负责固定尺寸、边框和底色，Lucide 图标只负责语义；业务组件不再直接组合文件夹图标和色彩类名。
- 使用 `xs / sm / md / lg` 四档尺寸分别服务紧凑标签、桌面侧栏、移动触发器和账本媒体，外框与图标尺寸都由组件数据属性驱动。
- `green / blue / violet / gold / gray / red` 由资产组数据决定；“全部钱包”使用中性 `all` 色调和 FolderKanban，未分类沿用中性 gray。
- 图标必须由 Grid `place-items: center` 居中；组件选择器应高于按钮通用 SVG 规则，但不使用 `!important`。

本轮动作：

- 新增 `AssetGroupMark` 与 `AssetGroupLabel`，集中 Lucide 图标、四档尺寸、七种色调和紧凑文本标签结构。
- 钱包管理侧栏、移动当前组触发器、资产组桌面表格、移动账本、待配置列表，以及钱包资产桌面/移动视图全部迁移到统一组件。
- 删除 `asset-group-icon`、`asset-group-dot`、`group-name-cell` 和 `asset-group-mobile-icon` 等旧实现；移动触发器现在会随当前资产组切换图标颜色。

复核结果：

- 1280 x 900：侧栏标记为 30 x 30px、图标 15 x 15px；总览标记为 40 x 40px、图标 18 x 18px；钱包标签标记为 18 x 18px、图标 10 x 10px。
- 390 x 844：当前资产组触发器为 36 x 36px、图标 17 x 17px；切换到 Virtuals 后色调从 `all` 变为 `violet`，折叠状态正确关闭。
- 桌面与移动端所有已测标记的 SVG 和外框 x/y 中心偏差均为 0；390px 页面根节点与 body 的 `scrollWidth` 均为 390px，移动账本越界项为 0。
- 桌面和移动可访问快照均保留资产组名称与按钮名称；浏览器控制台 0 error / 0 warning。

### 2026-07-21 第二十六轮基线

参考：

- shadcn Button：https://ui.shadcn.com/docs/components/base/button
- shadcn Spinner：https://ui.shadcn.com/docs/components/base/spinner
- MDN aria-busy：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-busy
- Tailwind Opacity：https://tailwindcss.com/docs/opacity

观察：

- Button 自己只会在 `loading` 时插入 Loader，刷新按钮必须由业务层手工隐藏 RefreshCw，才能避免同时显示两个图标；加载契约泄漏到了调用方。
- 按钮虽然会在加载时 disabled，但没有 `aria-busy`；辅助技术只能感知不可点击，无法区分“操作进行中”和普通禁用。
- 通用 disabled 透明度会把正在执行的主操作降到 48%，视觉上更像不可用按钮；Button、EmptyState 和 Toast 也分别直接引用不同 Loader。

方法判断：

- Spinner 是独立反馈原子：单独使用时提供 `role=status` 与可读标签，嵌套在已有名称的按钮、空状态或 Toast 中时作为装饰图标隐藏。
- 文字按钮的加载态保留动作名称，用 Spinner 自动替换原有直接子 SVG；图标按钮直接用 Spinner 替换 glyph，避免重复图标和尺寸变化。
- 加载期间继续使用原生 disabled 阻止重复提交，同时设置 `aria-busy=true`、`data-loading=true` 和 progress 光标；忙碌态保持原按钮对比度，不复用普通禁用透明度。
- 旋转只作用于固定尺寸 SVG，布局仍由按钮的 Flex/Grid 负责，动画不能改变控件的宽高或垂直中心。

本轮动作：

- 新增 `Spinner` 原子组件，统一 Lucide Loader、旋转类、独立状态标签和 decorative 模式。
- Button 增加组件内图标替换、`aria-busy`、`data-loading` 与忙碌态样式；IconButton 增加同一套 loading API，并保持 tooltip 与可访问名称。
- 刷新按钮不再读取 `refreshing` 决定是否渲染原图标；EmptyState 与 Sonner Toast 的 Loader 也迁移到统一 Spinner。

复核结果：

- 1280 x 720：刷新按钮加载前后均为 106 x 40px，宽高变化均为 0；原 RefreshCw 为 `display:none`，只有一个 Spinner 可见。
- Spinner CSS 尺寸为 16 x 16px，动画名为 `spin`，旋转后视觉边界的 y 中心与按钮中心偏差为 0；按钮 opacity 为 1、cursor 为 progress。
- 390 x 844：刷新按钮加载前后均为 118.66 x 42px，宽高变化均为 0；根节点和 body 的 `scrollWidth` 均为 390px。
- 加载按钮保留“刷新资产”可访问名称并输出 `aria-busy=true`；IconButton 服务端标记包含原名称、busy、disabled 和单个装饰 Spinner；控制台 0 error / 0 warning。

### 2026-07-21 第二十七轮基线

参考：

- shadcn Textarea：https://ui.shadcn.com/docs/components/base/textarea
- shadcn Field：https://ui.shadcn.com/docs/components/base/field
- MDN Textarea：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/textarea
- Tailwind Overflow：https://tailwindcss.com/docs/overflow

观察：

- 批量导入解析器会按“第 N 行”返回错误，但普通 Textarea 没有固定行号；地址较多时，错误信息和实际输入无法快速对应。
- 错误 Notice 位于输入字段上方，没有与 Textarea 建立 `aria-describedby` 关系；标签、行数和错误也没有统一字段容器。
- Solana 地址和带名称的导入行可能超过移动端宽度，需要在编辑器内部横向滚动，不能把页面整体撑宽。

方法判断：

- 行号只用于定位，不进入表单值或可访问树；行号层和 Textarea 共用行高，并由输入框的 `scrollTop` 驱动同步位移。
- 字段使用 Label、Control、Error 的固定顺序；无效状态同时落到字段容器和原生 `aria-invalid`，错误通过 `aria-describedby` 与输入关联。
- 地址输入关闭自动纠错、拼写检查和软换行；长地址保留为完整单行，在控件内部滚动。

本轮动作：

- 新增 `Field`、`FieldHeader`、`FieldLabel` 与 `FieldError` 原子组件，集中标签、描述、错误图标和无效状态。
- 新增 `LineTextarea`，提供不可交互的行号槽、纵向滚动同步、受控与非受控值支持，并保留标准 Textarea 事件和属性。
- 批量钱包导入迁移到新字段组件，示例改为“钱包 N 地址 / SOL N 地址”，逐行错误紧跟编辑器展示。

复核结果：

- 1280 x 900：空状态显示 3 行示例与 3 个行号；输入 25 行并滚动 120px 后，行号层同步为 `translateY(-120px)`。
- 两行无效输入会产生逐行错误；Textarea 输出 `aria-invalid=true` 和 `aria-describedby=wallet-import-error`，字段与编辑器外框同步进入错误态。
- 390 x 844：长地址的内容宽 1135px、可见宽 322px，可在编辑器内部横向滚动；页面根节点和 body 横向溢出均为 0。
- 桌面与移动端控制台 0 error / 0 warning。

### 2026-07-21 第二十八轮基线

参考：

- MDN Align Items：https://developer.mozilla.org/en-US/docs/Web/CSS/align-items
- MDN Justify Content：https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content
- MDN Transform：https://developer.mozilla.org/en-US/docs/Web/CSS/transform
- Tailwind Flex：https://tailwindcss.com/docs/flex

观察：

- `IdentityMark` 的内部 glyph 使用绝对定位并铺满整个外框；几何中心虽然为 0 偏差，小号钱包数字的实际墨迹和细线链 SVG 仍会显得靠左上。
- 钱包编号和链图标需要不同的内部槽尺寸与光学补偿；仅用同一全尺寸 Grid 无法同时兼顾文字基线和 SVG 轮廓。
- 移动账本会把链标记从 38px 覆盖为 40px，内部居中方式必须与外框尺寸解耦。

方法判断：

- 外框使用 Flex 双轴居中，glyph 作为正常流中的固定尺寸 Flex 项，不再依赖绝对定位和铺满定位层。
- 钱包文字使用 24px 内部槽，链图标使用 20px 内部槽和 18px SVG；槽位先几何居中，再按实际墨迹轻微向右下补偿。
- 光学补偿只作用于无交互 glyph，不改变外框、表格列宽、点击区域或响应式覆盖尺寸。

本轮动作：

- 将 `.ui-identity-mark` 和 `.ui-identity-mark-glyph` 改为嵌套 Flex 居中，删除绝对定位与全尺寸覆盖。
- 钱包编号统一使用 `1px / 2px` 光学补偿；链 SVG 使用 `1px / 1px`，并用自动 margin 固定 SVG 在 20px 槽内的位置。

复核结果：

- 1280 x 900：16 个钱包编号均使用 40px 外框和 24px glyph 槽；4 个链图标均使用 38px 外框、20px glyph 槽和 18px SVG。
- 390 x 844：移动链标记外框覆盖为 40px 后，20px 槽与 18px SVG 保持一致；钱包仍为 40px 外框和 24px槽。
- 桌面与移动端根节点和 body 横向溢出均为 0；控制台 0 error / 0 warning。

### 2026-07-22 第二十九轮基线

参考：

- shadcn Select：https://ui.shadcn.com/docs/components/base/select
- Radix Select：https://www.radix-ui.com/primitives/docs/components/select
- Tailwind Appearance：https://tailwindcss.com/docs/appearance
- tweakcn Dashboard Theme：https://tweakcn.com/editor/theme?p=dashboard

观察：

- 5 处原生 Select 由业务 JSX 各自拼接前置图标、原生下拉和尾部箭头，选中态、菜单层、勾选列和跨浏览器外观都无法统一。
- 原生选项没有固定指示器槽；迁移初版强制挂载 Radix ItemIndicator，虽然补齐了网格列，却把不受支持的 `forceMount` 属性泄漏到 DOM。
- 上一轮钱包与链标记使用手工 `translate` 做光学校正，用户复核仍认为内部图形偏左上；这种按内容猜偏移量的方式也无法覆盖未来图标。

方法判断：

- 选择器使用 Radix 的 Trigger、Value、Content、Viewport、Item 与 Indicator 组合，统一受控值、碰撞检测、焦点管理、方向键和 typeahead。
- 每个选项始终渲染 18px 指示器槽，槽内 Indicator 仍由 Radix 按选中状态挂载；不向 DOM 传递非标准属性。
- 身份标记采用固定外框、绝对铺满的内部 Grid 和 `place-items: center`；钱包文字、链 SVG 与外框共享同一中心，不再叠加内容专属 transform。

本轮动作：

- 新增统一 `Select` 原子组件，将资产组筛选、钱包排序、批量归类、单钱包归类和 EVM/SOL 配对 5 类入口全部迁移。
- 增加等宽弹出层、选中勾选、悬停/高亮/禁用状态、滚动按钮、视口碰撞边界、文本截断和开合动画。
- 重构 `IdentityMark` 布局，删除钱包 `1px / 2px` 与链 `1px / 1px` 的人工位移；内部 glyph 改为 `inset: 0` 的中心网格。

复核结果：

- 1280 x 900：资产组菜单与 166px 触发器等宽，5 个选项均有两列结构、一个选中项且未越出视口；配对菜单关闭后焦点回到触发器。
- 390 x 844：钱包排序的 3 个选项文本宽均为 84px，不再缩成单字；方向键可切换到“资产从高到低”，`V` typeahead 可定位 `Virtuals`。
- 桌面和移动端钱包外框/内部层中心偏差均为 0；链外框、内部层、SVG 的 x/y 中心偏差均为 0，且 computed transform 为 `none`。
- 两个视口的根节点和 body 横向溢出均为 0；新会话控制台 0 error / 0 warning。

### 2026-07-22 第三十轮基线

参考：

- shadcn Navigation Menu：https://ui.shadcn.com/docs/components/base/navigation-menu
- Radix Navigation Menu：https://www.radix-ui.com/primitives/docs/components/navigation-menu
- MDN aria-current：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current
- Tailwind Grid Template Columns：https://tailwindcss.com/docs/grid-template-columns

观察：

- 顶部“资产总览 / 钱包管理”是两个独立 URL，却使用 Button 和 click handler 模拟页面导航；元素没有 href，不能复制链接、修饰键打开或表达当前页面。
- 当前项只依赖 `.active` 视觉样式，没有 `aria-current`；辅助技术无法获得与视觉用户相同的当前位置。
- 重复点击当前按钮会持续执行 `history.pushState`；基线中连续点击两次将 History 长度从 2 增到 4，后退需要经过重复 URL。

方法判断：

- 页面目的地使用 nav、ul/li 和真实 anchor；页内面板切换才使用 tablist 与 aria-selected，二者不能只因外观相似而混用。
- 当前链接设置 `aria-current="page"`，且一个导航集合中只能有一个 current；视觉状态直接由该语义属性驱动。
- 普通左键和 Enter 拦截为 SPA 导航；Meta、Ctrl、Shift、Alt 或非左键保留浏览器行为，允许新标签页和链接菜单。
- 当前链接的普通点击只阻止默认刷新，不触发 onNavigate，避免同一路径重复写入 History。

本轮动作：

- 新增泛型 `RouteNavigation` 原子组件，集中路由项数据、链接语义、current 状态、图标槽、修饰键判断和等宽网格。
- 主导航从两个 Button 迁移为两个 anchor，删除业务页的 `.main-nav button.active` 结构和重复样式。
- 保留现有 navigate 中关闭临时面板、清空搜索、滚动到顶部和 pushState 的业务行为。

复核结果：

- 1280 x 900：两个链接均为 111 x 34px，只有当前链接输出 `aria-current=page`；导航、列表、列表项和链接语义完整。
- 当前页重复点击前后 History 均为 2；切到 `/wallets` 后为 3，再次点击仍为 3，浏览器后退一次回到 `/` 并同步 current 与副标题。
- Meta 点击在第二个标签打开 `/wallets`，原页面仍停留 `/`；键盘首个 Tab 聚焦当前链接，Tab + Enter 可切到钱包管理，焦点环为 3px。
- 390 x 844：导航宽 370px、两个链接各 178px，右边界 375px；根节点和 body 横向溢出均为 0，控制台 0 error / 0 warning。

### 2026-07-22 第三十一轮基线

参考：

- shadcn Checkbox：https://ui.shadcn.com/docs/components/base/checkbox
- Radix Checkbox：https://www.radix-ui.com/primitives/docs/components/checkbox
- W3C WCAG 2.2 Target Size：https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Tailwind Pointer Events：https://tailwindcss.com/docs/pointer-events

观察：

- 表头、钱包行和手机卡片的无标签 Checkbox 将外层 label、透明 input 和可见方框全部固定为 18 x 18px；视觉紧凑，但指针目标低于 WCAG 2.2 建议的 24 x 24px。
- 可见方框已有 checked 与 indeterminate 图标，但缺少独立 hover、pressed 和 invalid 反馈；密集列表中无法在点击前确认目标。
- Checkbox 内部持有 input ref 以同步原生 indeterminate，却没有向调用方转发该 ref，原子组件的聚焦和表单组合能力不完整。

方法判断：

- 视觉图形与交互目标分离：方框继续为 18px，外层和透明 input 扩大到 28px；业务表格不通过额外 padding 重复制造热区。
- 未选 hover 只改变边框与浅背景；已选或混合 hover 使用深绿色，pressed 仅缩放固定方框，不改变目标尺寸或行布局。
- 保留原生 input 的 checked、indeterminate、disabled、required 与 Space 键行为；原子层只负责视觉和 ref 组合，不重新实现状态机。
- invalid 同时作用于方框和有标签外框；disabled 降低内容对比度并关闭 pointer cursor。

本轮动作：

- 无标签 Checkbox 外层从 18 x 18px 扩为 28 x 28px，内部方框仍为 18 x 18px，并用 Grid 保证两个中心完全重合。
- 增加 hover、checked-hover、pressed、invalid 与 disabled 样式；过渡服从全局 reduced-motion 规则。
- Checkbox 改为 forwardRef，并通过 `useImperativeHandle` 安全暴露内部原生 input，同时继续在 effect 中同步 indeterminate。

复核结果：

- 1280 x 900：表头和钱包行目标均为 28 x 28px、方框均为 18 x 18px，x/y 中心偏差为 0；在方框外 3px、目标内点击可正常选中。
- 选择 1 个钱包后，表头输出 `indeterminate=true`、`aria-checked=mixed` 和减号；Space 可选中/取消，完成过渡后的焦点环为 3px。
- 全选后 16 个钱包全部进入 checked，批量条显示“已选 16 个钱包”；再次点击恢复 0 个，状态没有残留。
- 390 x 844：钱包目标为 28 x 28px、可见框仍为 18 x 18px；链选择项保持 179 x 44px 整项可点，根节点和 body 溢出均为 0，控制台 0 error / 0 warning。

### 2026-07-22 第三十二轮基线

参考：

- shadcn Switch：https://ui.shadcn.com/docs/components/base/switch
- Radix Switch：https://www.radix-ui.com/primitives/docs/components/switch
- MDN switch role：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/switch_role

观察：

- 刷新范围中的 Switch 虽然由 label 包裹、整行可以点击，但可见滑轨仅 36 x 20px，标题与说明排在滑轨右侧，整行没有稳定的设置项结构。
- 开启和关闭只依赖滑块位置及颜色；高影响的“包含风险/自定义 token”设置没有可直接扫描的文字状态。
- 焦点环只作用于小滑轨，外层 798px 的实际热区与视觉焦点范围不一致；组件也没有转发原生 input ref。

方法判断：

- 保留原生 checkbox 与 `role="switch"`，继续使用浏览器提供的 checked、disabled、required、表单和 Space 键行为，不在 React 中复制二元状态机。
- 采用“标题与说明在左、状态与开关在右”的两栏设置行；透明 input 覆盖整行，让视觉范围、点击范围和焦点范围一致。
- 状态文字使用 `aria-hidden`，避免与原生 switch 的 on/off 语义重复播报；可见文案仍明确显示“开启 / 关闭”。
- checked、hover、pressed、focus、invalid 和 disabled 都在原子组件层完整定义，业务页面只负责传递状态与文案。

本轮动作：

- Switch 改为 forwardRef，并新增可覆盖的 `onLabel` / `offLabel`；默认使用“开启 / 关闭”。
- 外层改为最小高度 60px 的两栏 Grid，增加边框、浅背景和整行焦点环；右侧状态与 40 x 22px 滑轨形成稳定控制组。
- 滑块从 14px 增至 16px，位移同步调整为 18px；整行增加 hover、pressed、checked、invalid 与 disabled 状态。

复核结果：

- 1280 x 900：Switch 热区为 798 x 60px，说明区与 72px 控制区重叠为 0；开启时显示“开启”、绿色滑轨和整行 3px 焦点环。
- 390 x 844：Switch 热区为 366 x 60px，透明 input 覆盖内部 364 x 58px；右边缘点击可以切换，Space 可以连续切换并恢复原状态。
- 两个视口的根节点和 body 横向溢出均为 0；新浏览器会话控制台 0 error / 0 warning。

### 2026-07-22 第三十三轮基线

参考：

- shadcn Badge：https://ui.shadcn.com/docs/components/base/badge
- MDN status role：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role
- Tailwind Text Overflow：https://tailwindcss.com/docs/text-overflow

观察：

- 普通计数、来源标签与钱包状态全部使用相同的 23px 高度和字号；资产组数量“5”与“未刷新”状态处于同一视觉层级。
- Badge 直接渲染 icon 与 children，没有固定图标槽和文字层；不同 Lucide 图形只能依赖自身 viewBox 与 flex 行盒对齐。
- children 没有稳定的最小宽度、单行和截断约束；状态文案变长时可能推动徽章高度和密集列表布局。
- 表格中的状态是静态事实，不应仅因组件名为 StatusBadge 就增加 `role="status"`；该角色会创建 polite live region。

方法判断：

- 普通 Badge 默认使用 20px 紧凑尺寸，StatusBadge 默认使用 24px 标准尺寸；利用密度区分元数据与状态，不扩大圆角或增加装饰。
- 图标进入固定 14 x 14px Grid 槽，所有 SVG 统一为 13 x 13px；文字进入可收缩的 label 层并保持单行省略。
- 图标槽统一 `aria-hidden`，状态文字继续作为可访问名称；静态状态不增加 live-region 角色。
- 保留 success、warning、danger、neutral、accent、info 与 outline 七种语义色，状态继续通过文字、颜色和图标三重表达。

本轮动作：

- Badge 改为 forwardRef，导出 `BadgeProps` 与 `BadgeSize`，新增 `sm / md`、`data-size`、`data-tone` 和固定图标/文字子结构。
- StatusBadge 默认使用 md，增加 `data-status`，继续集中 ok、stale、error、skipped 的 Lucide 图标和色调映射。
- 顶部“本地文件 / 云端已同步”从直接 children 图标迁移到 Badge 的 icon 槽，消除最后一个绕过原子结构的调用。

复核结果：

- 1280 x 900：资产组计数为 20 x 20px，钱包状态为 68 x 24px；状态 icon 与 14px 槽的 x/y 中心差均为 0，文字与徽章垂直中心差为 0。
- 390 x 844：顶部同步标签为 72 x 20px，钱包状态仍为 68 x 24px；两者的 icon 和文字中心差均为 0，根节点与 body 横向溢出均为 0。
- 92px 约束下的长状态仍保持 24px 高度，label 的 clientWidth / scrollWidth 为 57 / 220，computed overflow 为 hidden、white-space 为 nowrap。
- 真实数据中 1 个 ok 与 15 个 skipped 均保留正确文字、tone、隐藏图标和无 live-region role；资产总览 stale 状态映射保持 warning。新会话控制台 0 error / 0 warning。

### 2026-07-22 第三十四轮基线

参考：

- shadcn Alert：https://ui.shadcn.com/docs/components/base/alert
- MDN alert role：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role
- MDN status role：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role

观察：

- Notice 只有图标与一段内容，追踪范围、重新登录、旧数据和操作失败处于相同的信息层级，长文案不利于快速扫描。
- info、success 与 warning 默认都使用 `role="status"`，导致页面加载时存在把静态说明当作动态状态播报的风险。
- warning 与 danger 共用 AlertTriangle，无法在图形层区分“需要注意”和“操作失败”。
- 组件没有标题、操作区、显式 live 模式或 ref；图标槽也缺少独立背景与稳定的视觉锚点。

方法判断：

- 持久、静态的说明默认不创建 live region；只有动态、需要立即关注的错误默认使用 `role="alert"` 与 assertive。
- 采用“图标槽、标题、说明、可选操作”的 Alert 结构，让用户先识别结论，再阅读原因或下一步。
- warning 继续使用 AlertTriangle，danger 改用 CircleX；颜色之外再增加图形差异。
- 所有图形必须在固定尺寸槽位中几何居中；钱包与链继续复用 IdentityMark，避免文字基线或 SVG viewBox 影响位置。

本轮动作：

- Notice 改为 forwardRef，导出 `NoticeProps`、`NoticeTone` 与 `NoticeLive`，新增 title、action、live、`data-tone` 和 `data-live`。
- 内容重构为 28px 图标槽、标题/说明 copy 层和可选 action 列；四种 tone 增加 3px 左侧语义色标。
- 登录错误、操作错误、重新登录、旧数据和 Solana 追踪范围全部补齐明确标题。
- danger 默认映射到 CircleX、`role="alert"` 和 `data-live="assertive"`；其他 tone 默认不输出 role。

复核结果：

- 1280 x 900：info 为 1248 x 58px，warning 为 1248 x 64px；17px SVG 在 28px 图标槽中的 x/y 中心差均为 0。
- 390 x 844：info 为 370 x 72px，标题和说明正常换行，根节点与 body 横向溢出均为 0。
- 模拟登录过期时 warning 不输出 role/live；模拟空口令错误时 danger 输出 `role="alert"`、`data-live="assertive"`，错误图标中心差为 0。
- 钱包编号在桌面和手机端的 IdentityMark 内容中心差均为 x=0/y=0；BSC、Base、Arbitrum 等链 SVG 在两个视口也均为 x=0/y=0。全新浏览器会话控制台 0 error / 0 warning。

### 2026-07-22 第三十五轮基线

参考：

- shadcn Input：https://ui.shadcn.com/docs/components/base/input
- shadcn Input Group：https://ui.shadcn.com/docs/components/radix/input-group
- MDN searchbox role：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/searchbox_role
- WCAG 2.2 Target Size：https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

观察：

- SearchField 由图标、原生 input 和条件式清除按钮直接拼成三列，没有 Input Group 的稳定 control/addon 结构。
- 空值时末列为 0px，有值时突然变为 28px；输入宽度与图标/操作位置随清除按钮挂载发生变化。
- 点击清除后按钮立即卸载，实测焦点落到 BODY，键盘用户必须重新寻找搜索框。
- 输入控件继承全局 `input:focus-visible`，组级焦点环内部还出现一条被裁切的绿色 outline；只读取 DOM 尺寸无法发现。
- Input 没有转发 ref、disabled 数据状态或专用 invalid 焦点环；登录错误也没有关联到口令输入。
- 首次生产读回发现鼠标点击提交后，布局变化会让指针落到输入框上；高优先级 hover 覆盖 invalid 红色边框，焦点仍留在提交按钮。

方法判断：

- 搜索继续使用原生 `type="search"` 与可访问名称，不重复添加 searchbox role；SearchField 明确为受控字符串组件。
- Input Group 固定为“起始 addon、control、末端 addon”三槽；control 在 DOM 中优先，addon 在后，视觉位置由 Grid area 控制。
- 清除目标至少达到 WCAG 的 24 x 24px，并在鼠标或键盘触发后把焦点还给搜索输入。
- 组级组件只保留一层焦点环；内部原生 control 的 outline 必须显式移除，并通过截图检查裁切边缘。
- invalid 不只改变颜色，还要输出 `aria-invalid`；具体错误通过 `aria-describedby` 与输入建立关联。
- invalid 必须在 hover、focus 组合状态下仍然成立；表单校验失败后应把焦点送回可修正的输入，而不是停在提交按钮。

本轮动作：

- Input 改为 forwardRef，导出 InputProps，并统一输出 `data-disabled`、`data-invalid` 与原生 `aria-invalid`。
- SearchField 改为 forwardRef 和受控字符串 API，新增 `input-group`、`input-group-control`、双 addon 的 `data-slot` 结构。
- 两侧 addon 固定为 30px；末端槽始终保留，清除按钮增至 30 x 30px，避免输入内容和图标发生横向跳动。
- 清除动作在下一帧恢复 input 焦点；内层 control 的 focus/focus-visible outline 清零，仅保留组级 3px 焦点环。
- 登录口令输入在错误时输出 invalid，并用 `aria-describedby="auth-error"` 连接到 danger Notice。
- invalid 选择器补齐 hover 优先级；口令输入通过 ref 在空值错误更新后的下一帧恢复焦点。

复核结果：

- 1280 x 900：搜索框为 267 x 40px，三列稳定为 30 / 197 / 30px；搜索图标和清除按钮在各自槽位的 x/y 中心差均为 0。
- 清除前过滤结果为 8 行；鼠标点击以及 Tab 到清除按钮后按 Enter，均恢复 16 行并把焦点返回“搜索钱包”input，不再落到 BODY。
- 390 x 844：搜索框为 278 x 42px、control 为 208 x 40px、清除目标为 30 x 30px；根节点和 body 横向溢出均为 0。
- 资产总览搜索在桌面为 276 x 40px、手机为 340 x 42px；输入 Base 后仅保留 1 条 Base 链结果，筛选器、链分布和移动账本没有重叠。
- 钱包名称内联输入保持单一绿色焦点环；模拟空口令错误时口令输入为 312 x 42px，输出 `aria-invalid=true`、`data-invalid=true`，描述目标与 `auth-error` 一致，并显示单一红色焦点环。
- 鼠标提交空口令后，输入同时为 hover 和 active；250ms 状态过渡结束后边框为 `rgb(181, 60, 53)`、红色焦点环为 3px，证明 hover 不再覆盖 invalid。
- 全新浏览器会话控制台 0 error / 0 warning；TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第三十六轮基线

参考：

- shadcn Empty：https://ui.shadcn.com/docs/components/base/empty
- MDN aria-busy：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-busy
- MDN status role：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role

观察：

- EmptyState 只有 loading 布尔值，真实空数据、搜索无结果和加载中共享同一个视觉与语义结构。
- 搜索无结果仍显示“暂无钱包”“暂无链上资产”等初始空数据标题，无法区分“没有数据”与“筛选条件没有命中”。
- 所有空状态都没有恢复操作；清空搜索、返回全部钱包或开始导入只能回到页面其他位置寻找入口。
- 加载状态没有 `role`、`aria-busy` 或数据状态，辅助技术无法识别内容仍在更新。
- 改造前钱包管理空状态在 1280 x 900 下为 972 x 300px，图标槽 42 x 42px；role、aria-busy 均为空，操作数为 0。

方法判断：

- 采用 Empty 的“媒体、标题/说明、操作区”组合，但继续保持页面内的空状态无外框，避免在内容容器内再嵌套卡片。
- 把状态显式拆为 `empty`、`no-results`、`loading`；真实空数据保持静态，动态无结果只让文案区成为 polite status，操作按钮不放入 live region。
- loading 使用 `role="status"` 与 `aria-busy="true"`，不渲染操作按钮；无结果和真实空数据使用不同图标与色调。
- 恢复操作必须就地解决当前阻塞，并在清除搜索后把焦点交还对应搜索框。

本轮动作：

- EmptyState 改为 forwardRef，导出 EmptyStateProps 与 EmptyStateVariant，新增 data-state、默认 Inbox/SearchX 图标和 loading 语义。
- 图标槽统一为 48 x 48px，SVG 为 21 x 21px；copy 最大宽度 420px，标题、说明和 action 形成稳定三段布局。
- 钱包管理无匹配时提供“清除搜索”，空资产组提供“查看全部钱包”，全空时提供“批量导入”。
- 链、币种和钱包视图的搜索无结果统一为“没有匹配结果”，保留各自说明并提供“清除搜索”。
- 资产组总览全空时增加“管理钱包归类”，让空状态不再成为操作死路。

复核结果：

- 1280 x 900：钱包无结果区域保持 972 x 300px，操作按钮为 95 x 34px；标题、说明、状态和操作均与筛选条件一致。
- 390 x 844：操作按钮为 95 x 38px；根节点与 body 横向溢出均为 0，空状态图标在 48px 槽中的 x/y 中心差均为 0。
- 钱包管理点击“清除搜索”后恢复 16 行，焦点返回 `wallet-management-search`；资产总览恢复 4 条链，焦点返回 `overview-asset-search`。
- 链、币种、钱包分别输出对应无结果说明；copy 为 `role="status"`，操作按钮是 live region 的并列控件。
- 模拟配置请求挂起时 loading 输出 `data-state="loading"`、`role="status"`、`aria-busy="true"`，不渲染操作，Spinner 中心差为 0。
- 全新浏览器会话控制台 0 error / 0 warning；TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第三十七轮基线

参考：

- shadcn Button：https://ui.shadcn.com/docs/components/base/button
- MDN button：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button
- WCAG 2.2 Target Size：https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- tweakcn Dashboard：https://tweakcn.com/editor/theme?p=dashboard

观察：

- Button 与 IconButton 已具备尺寸、变体、焦点、禁用和加载样式，但没有导出状态类型，也没有统一的数据属性供表单、测试和调试读取。
- primary 与 destructive 的按下状态和 hover 基本相同；鼠标按住时没有位移或内阴影，缺少明确但克制的物理反馈。
- IconButton 加载时虽然禁用了交互并显示 Spinner，可访问名称和 Tooltip 仍可能停留在原命令，无法表达操作正在处理中。
- 加载态的内容替换已经保持按钮宽度稳定，因此不需要改写现有布局；本轮应集中补足状态语义，而不是重做按钮尺寸。

方法判断：

- 继续使用原生 button 的 type、disabled 与键盘语义；组件只补充可观测状态，不用 aria-disabled 模拟原生禁用。
- 所有按钮统一输出 variant、size、state 与 disabled 数据属性，状态优先级为 loading、disabled、idle。
- 按下反馈采用 1px translateY、较深背景和内阴影，不改变盒模型尺寸；ghost / quiet 保持更轻的反馈。
- 加载态保留原文字以稳定宽度，同时用 Spinner 替换起始图标；有明确 loadingLabel 时同步更新 aria-label，IconButton 同步更新 Tooltip。
- 移动端保留现有 42px 主按钮和 38px 图标按钮，并增加 touch-action 与透明 tap highlight，避免引入额外触摸延迟或系统高亮。

本轮动作：

- 导出 ButtonVariant、ButtonSize、ButtonProps、IconButtonVariant 与 IconButtonProps，Button / IconButton 新增 loadingLabel。
- 两类按钮统一输出 `data-state`、`data-size`、`data-variant`、`data-disabled` 与 `data-loading`，并集中计算原生 disabled。
- IconButton 加载时使用“处理中”的动态可访问名称和 Tooltip；“刷新资产”补充“正在刷新资产”的加载名称。
- primary、destructive、ghost、quiet、danger 与 secondary 补齐按下反馈；所有按钮 SVG 设为 block，继续由 flex 几何居中。

复核结果：

- 1280 x 900：批量导入为 106 x 40px，按下后 translateY 为 1px、背景变深并出现内阴影，宽高保持不变；未触发误点击。
- 编辑钱包名称 IconButton 为 34 x 34px，SVG 与按钮 x/y 中心差均为 0；Button 与 IconButton 均保留默认 `type="button"`。
- 批量导入弹窗的禁用提交按钮为 95 x 34px，保留 `type="submit"`、原生 disabled、不可聚焦，并输出 `data-state="disabled"`。
- 模拟慢刷新时按钮继续保持 106 x 40px，输出 `aria-label="正在刷新资产"`、`aria-busy="true"`、`data-state="loading"`，Spinner 数量为 1。
- 390 x 844：批量导入为 118.66 x 42px，编辑按钮为 38 x 38px；图标中心差为 0，按下宽高不变，页面横向溢出为 0。
- 全新浏览器会话控制台 0 error / 0 warning；TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第三十八轮基线

参考：

- shadcn Table：https://ui.shadcn.com/docs/components/base/table
- shadcn Data Table：https://ui.shadcn.com/docs/components/base/data-table
- Tailwind vertical-align：https://tailwindcss.com/docs/vertical-align
- WAI Tables with Two Headers：https://www.w3.org/WAI/tutorials/tables/two-headers/
- WAI Caption & Summary：https://www.w3.org/WAI/tutorials/tables/caption-summary/

观察：

- 五张表已有 caption、列 scope、数字右对齐和粘性表头，但 tbody 的第一识别列仍是普通 td，辅助技术只能逐格回查列头，不能直接得到当前资产组、链、币种或钱包名称。
- 普通账本单元格默认 `vertical-align: top`；资产组首行高 81px 时，42px 身份入口中心偏上 8.5px、金额主值偏上 20px、24px 状态偏上 17.5px，只有 58px 持仓列表接近行中心。
- 管理表选中状态由业务层直接写 `data-selected`，没有统一组件 API，也没有与 shadcn Data Table 一致的 `data-state="selected"`。
- checkbox 点击后 row 同时进入 selected 与 focus-within，旧的高优先级聚焦背景会覆盖选中背景；用户只能依靠左侧 3px 色线判断选择仍然存在。
- 列宽规则使用 `.table th:nth-child(...)`；如果把首列升级为行表头，这类选择器会错误命中 tbody 的 th，说明结构语义和表头布局尚未真正解耦。

方法判断：

- 当前数据量和交互仍不需要 TanStack Table；原子层继续负责原生 table 结构、状态与视觉，筛选、排序和业务动作留在页面层。
- 每行的业务标识使用 `th scope="row"`，顶部列标题继续使用 `th scope="col"`；caption 仍作为 table 的直接子元素。
- 普通单元格默认中线对齐，使金额、状态和短文本围绕由持仓列表决定的行高排列；确需从顶部开始的内容通过显式 vertical API 覆盖。
- selected、focus-within 和 hover 是可组合状态；选中行聚焦时必须同时保留选中色、左侧强调线和轻量内描边。
- 所有百分比列宽只允许作用于 `thead th`；tbody 的 row header 只继承单元格尺寸，不承担列宽定义。

本轮动作：

- Table 组件族导出完整 props 类型，增加 data-slot、TableFooter、TableRowHead 和 `middle / top` 垂直对齐 API。
- TableRow 新增 selected 属性，统一输出 `data-state="selected"` 与兼容的 `data-selected`；管理表移除业务层手写数据属性。
- 资产组、链、币种、钱包和钱包管理五张表的业务标识列全部迁移到 TableRowHead。
- 普通单元格默认改为中线对齐；全局补齐 focus-within、selected、selected + focus 与 selected + hover 状态，删除管理表和资产组表的重复规则。
- 所有列宽选择器限定到 thead；移动管理表改用 `.ui-table-cell` 选择器，使 td 与 row header 在同一 Grid 契约中布局。

复核结果：

- 1280 x 900：资产组首行继续保持 81px，高度没有变化；七列内容中心相对行中心均为 -0.5px，原先贴顶的金额、数量与状态已统一居中。
- 链表 4 行、币种表 4 行、资产组表 2 行和钱包表 1 行的首列均为 `TH scope="row"`；所有顶部列头继续为 `scope="col"`。
- 钱包表六列宽度仍为 299.03 / 137.05 / 124.59 / 87.22 / 473.48 / 124.63px，容器 clientWidth / scrollWidth 均为 1246px。
- 管理表选中行输出 `data-state="selected"`；聚焦时背景为 `rgb(232, 244, 237)`，同时保留 3px 左侧强调线和 1px 内描边；普通聚焦行获得独立内描边。
- 管理表滚动 220px 后，表头与容器顶部坐标差为 0；粘性表头行为未回归。
- 390 x 844：管理卡片行仍为 368 x 171px，六个 Grid 槽的位置和改造前一致；根节点与 body 横向溢出均为 0，桌面表隐藏、移动账本正常显示。
- 全新浏览器会话在资产总览与钱包管理均为 0 error / 0 warning；TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第三十九轮基线

参考：

- shadcn Item：https://ui.shadcn.com/docs/components/base/item
- MDN ARIA list role：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/list_role

观察：

- Item / ItemGroup 只在 div 上补 `role="list"` 与 `role="listitem"`；当前全部调用都是真实账本列表，使用原生 `ul / li` 可以直接表达结构。
- Item 子组件没有 ref、props 类型或 data-slot；媒体、尺寸、外观、Header 和 Separator 也没有稳定接口，复用时只能继续叠业务 class。
- LedgerItem 的金额标签和值使用 small / strong，仅存在视觉关系；操作按钮聚焦时只有按钮自身反馈，无法快速确认它属于哪一条账本。
- 390px 下四类账本均无横向溢出，金额列宽为 92px，现有密度无需重做；长内容风险集中在连续英文或地址文本。
- 钱包管理的移动卡片仍暴露桌面表头中的透明全选 checkbox，与移动端专用全选入口重复，并覆盖钱包 1 选择框的部分点击区域。

方法判断：

- ItemGroup / Item 迁移到原生 `ul / li`，不再模拟列表角色；其余子组件继续使用组合式结构，避免把整行错误建模成按钮或链接。
- 按 shadcn Item 的组合边界补齐 variant、size、media variant、Header、Footer、Separator、forwardRef 和 data-slot；业务层继续决定具体资产图标与内容。
- 金额使用单项 `dl / dt / dd`，同时保留现有视觉顺序；包含操作按钮的账本只在 focus-within 时高亮，不为不可点击的整行增加 hover 暗示。
- 标题和说明允许任意位置换行，金额列保持固定最小宽度；移动端隐藏桌面表头中的重复全选控件，保留表头其他语义和移动专用入口。

本轮动作：

- Item 组件族全部增加 forwardRef、导出 props 类型和 data-slot；新增 default / outline / muted、default / sm / xs、icon / image 等稳定接口。
- ItemGroup / Item 改为原生 `ul / li`，统一清除列表默认间距和项目符号；补齐 Header 与 Separator。
- LedgerItem 导出 props、支持 ref，输出 actionable、fact count、footer 等状态；金额结构改为 `dl / dt / dd`。
- 可操作账本行新增不改变尺寸的 focus-within 背景和 3px 内侧强调线；标题与说明增加连续文本断行保护。
- 移动钱包管理隐藏桌面表头里的重复全选 checkbox，消除与钱包 1 选择框的透明点击区域重叠。

复核结果：

- 390 x 844：资产组 2 行、链 4 行、币种 4 行、钱包 1 行全部输出 `UL > LI`；金额均为 `DL > DT + DD`，无页面或行级横向溢出。
- 四类账本自然内容行高与改造前一致：资产组 237 / 182px，链 197.19 / 198.19px，币种 235.19 / 236.19px，钱包 306.19px。
- 注入 49 字符连续英文的钱包名和长中文说明后，账本宽度 / scrollWidth 均为 368px，内容列为 145px，金额与操作列继续保持 139px，页面 scrollWidth 为 390px。
- “查看未分类”聚焦后，所属账本背景为 `rgb(247, 250, 247)`，并保留 3px accent 内侧线；按钮原有 focus ring 同时可见。
- 移动钱包管理可见控件重叠从 1 组降为 0；无障碍树只保留“全选当前”，点击钱包 1 后仅钱包 1 被选中。
- 1440 x 900：桌面账本正常显示、移动账本隐藏，main 和页面横向溢出均为 0；资产总览与钱包管理控制台均为 0 error / 0 warning。

### 2026-07-22 第四十轮基线

参考：

- shadcn Chart：https://ui.shadcn.com/docs/components/base/chart
- W3C WAI Complex Images：https://www.w3.org/WAI/tutorials/images/complex/
- MDN SVG polyline：https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/polyline

观察：

- 总资产历史只有 1 个点时，旧图把 0 和当前 `$260.15` 同时纳入范围，圆点被放到 SVG 顶边 `y=4`，基线留在底边 `y=40`，视觉上像一颗失去上下文的孤立点。
- 模拟 6 次 `$258.20–$261.00` 快照后，旧算法仍把所有折线点压在 `y=4.00–4.39`；真实的升降变化在 44px 图形中几乎不可见。
- 无历史时旧组件显示 `$0.00`，无法区分“尚无快照”和“资产确实为零”；单点统一显示“建立历史中”，没有告诉用户还需要什么数据。
- SVG 只有一句笼统 aria-label，没有最低、最高、最新和环比信息；视觉折线和文本结论没有形成完整替代关系。

方法判断：

- 历史图必须显式区分 empty、single、trend；空状态不伪造金额，单点状态不绘制折线，只表示时间序列的起点。
- 趋势图使用实际最小值和最大值，但设置“最新资产 2% 或 `$1`”的最小显示区间；既避免 0 基线压平变化，也避免把几分钱波动夸大为全幅涨跌。
- 单点放在时间轴左端和中线，提示未来数据会向右增长；多点使用精确 polyline，不增加平滑曲线，避免暗示不存在的中间值。
- 相邻的当前金额与环比承担可见摘要；SVG 通过 title + desc 补充状态、最低、最高、最新和环比，满足复杂图形需要短说明与完整文本表示的原则。
- 168 x 44px 的非交互 sparkline 不引入 Recharts；保留稳定尺寸和现有依赖边界，同时采用 shadcn Chart 的数据 / 配置分离和可访问层思路。

本轮动作：

- 将内部 Sparkline 升级为可复用的 `SnapshotSparkline`，导出 props 类型，并输出 point count 与 empty / single / trend 数据状态。
- 删除强制纳入 0 的范围算法；多点按实际区间、20% 余量和 2% 最小显示区间计算坐标，同时过滤非法时间和非数值金额。
- 空历史显示 `-- / 刷新后开始记录`；单点显示左侧起点和“再刷新 1 次生成趋势”；多点继续显示精确环比。
- SVG 增加 useId 驱动的 title、desc、aria-labelledby、不可聚焦属性和中线；折线补齐圆角端点，单点使用实心起点。

复核结果：

- 真实单点历史输出 `data-state="single"`、`data-point-count="1"`，不渲染 polyline；端点从旧坐标 `(84, 4)` 改为 `(4, 22)`，可见提示为“再刷新 1 次生成趋势”。
- 模拟 6 次历史后，折线 y 范围从旧 `4.00–4.39` 展开为 `12.31–31.69`；图形清楚显示先升、回落、上升再轻微回落，最新端点为 `(164, 18.16)`。
- 多点 SVG 文本说明为“最低 `$258.20`、最高 `$261.00`、最新 `$260.15`、较上次减少 `$0.55`”；可访问快照把标题与完整说明合并为一个命名 img。
- 独立空数据会话输出 `data-state="empty"`、0 个 polyline、0 个 circle，并显示 `-- / 刷新后开始记录`，控制台 0 error / 0 warning。
- 1440 x 900：刷新质量区继续保持 1408 x 139px，趋势 SVG 保持 168 x 44px，页面无横向溢出。
- 320 x 720：趋势文本宽 91px、SVG 宽 168px，两者不重叠；页面与面板横向溢出均为 0，钱包管理可见交互控件重叠为 0。

### 2026-07-22 第四十一轮基线

参考：

- MDN CSS `translate()`：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/transform-function/translate

观察：

- 钱包与链徽标的容器、内部 Grid 和 SVG 在几何测量上中心重合，但 12px 数字字形与 18px 线性图标在 38–40px 的小型有边框容器中仍呈现偏左上的光学重心。
- 钱包徽标与链徽标都使用共用 `IdentityMark`，适合在原子组件层提供可配置的光学校正，不应分别在桌面表格和移动账本中写死位置。

方法判断：

- 保留 Grid 的几何居中作为默认值，通过 CSS 自定义属性为特定身份徽标叠加 1px 二维平移；transform 只改变视觉坐标，不参与文档流，因此不会改变表格行高或移动卡片尺寸。
- 校正只应用于钱包和链徽标，不影响按钮、导航、币种图标与资产组图标；后续其他身份标记可以继续使用默认的 0px 偏移。

本轮动作：

- `ui-identity-mark-glyph` 增加 x / y 光学校正变量，并为 `.wallet-badge`、`.chain-badge` 统一设置向右、向下 1px。
- 保持外层 38–40px 尺寸、边框、SVG 尺寸和点击区域不变。

复核结果：

- 桌面钱包页的数字字形与桌面链列表的 SVG 均得到 `matrix(1, 0, 0, 1, 1, 1)`，可见内容中心相对容器从 `(0, 0)` 调整为 `(1, 1)`。
- 390 x 844：钱包和链页面的根节点 `scrollWidth` 均为 390px，徽标内部内容溢出数均为 0。
- 桌面与移动端截图复核后，钱包数字和链图形的视觉重心落在徽标正中，页面控制台均为 0 error / 0 warning。

### 2026-07-22 第四十二轮基线

参考：

- shadcn Badge：https://ui.shadcn.com/docs/components/radix/badge
- Carbon Design System Tag：https://carbondesignsystem.com/components/tag/usage/

观察：

- 1440px 资产组账本中，状态列宽 112.5px，扣除单元格内边距后 Badge 只有 84.5px；“14 个待检查”的标签可用宽度为 50px、实际需要 60px，“1 个待检查”也被静默省略。
- Badge 原子组件默认对所有标签启用 ellipsis，导致本应简洁且信息完整的短状态也被裁切；业务调用无法表达“这个长错误允许省略，但这个状态必须完整显示”。
- 钱包刷新错误可能是一整句诊断信息，不能简单取消全局截断，否则会撑宽桌面表格和移动账本。

方法判断：

- Badge 标题应遵循 Carbon 的“简洁且有信息量”原则；当业务文本已经足够短时，组件必须优先完整显示，而不是用省略号掩盖布局问题。
- 截断应是显式能力而非默认行为：普通 Badge 不收缩，只有系统生成的长详情传入 `truncate`；原始文本仍保留在 DOM 与 title 中。
- shadcn Badge 通过 variant、icon 与 data 属性保持轻量组合；本项目同样把截断状态沉到 Badge API，不在具体表格中覆盖内部 label 样式。

本轮动作：

- Badge 新增 `truncate` 属性、`data-slot="badge"` 与 `data-truncate` 状态；默认取消 max-width 和 label ellipsis，显式截断时才恢复受容器约束的省略行为。
- 钱包 stale / skipped / error 详情统一提供非空回退文本；长状态显式启用 truncate，并把完整诊断放入 title。
- 资产组桌面账本将主要持仓列从 32% 调整为 29%，状态列从 8% 调整为 11%，不改变其他数值列。

复核结果：

- 1440px：两个资产组状态 Badge 分别为 94.8px 与 88.2px，标签 `clientWidth / scrollWidth` 为 `60 / 60`、`53 / 53`，均不再截断。
- 1180px：账本在自身容器内保持 1180px 最小宽度，页面 `scrollWidth` 仍为 1180px；两个状态继续完整显示。
- 390px：页面 `scrollWidth` 为 390px，“14 个待检查”与“1 个待检查”完整显示，右边界分别为 357.1px 与 350.5px，没有越出移动账本。
- 注入长 RPC 错误后，钱包状态输出 `data-truncate="true"`，label 为 `55 / 412px` 并正确省略，title 保留完整诊断；页面没有新增横向溢出。

### 2026-07-22 第四十三轮基线

观察：

- 用户在真实使用中指出钱包数字与链图标仍然偏离中心，证明第四十一轮增加的光学校正并未解决问题。
- DOM 几何测量显示，`translate(1px, 1px)` 使钱包字形与链 SVG 的中心都相对外层容器偏离 1px，内层绝对定位和光学变量没有实际价值。

方法判断：

- 小型身份标识优先使用可量化的几何居中；只有在具体字形或图标有可复现的视觉证据时，才应引入局部光学校正。
- `IdentityMark` 的子层直接占满内容区并用 Grid 居中，钱包文字与链 SVG 共用同一条无 transform 的布局路径。

本轮动作：

- 删除 `.wallet-badge` 与 `.chain-badge` 的 `1px` x / y 光学偏移。
- 将 `.ui-identity-mark-glyph` 从绝对定位改为静态的 `100% x 100%` Grid 居中容器，保留原有外层尺寸、边框和 SVG 尺寸。

复核结果：

- 1440 x 900：钱包徽标的外层、内层和文字中心坐标完全相同；链徽标的外层与 SVG 中心坐标完全相同，`transform` 为 `none`。
- 390 x 844：移动钱包和链徽标均为 40 x 40px，内层中心与外层中心一致；两个页面的横向溢出均为 0。
- 资产总览与钱包管理页面控制台均为 0 error / 0 warning。

### 2026-07-22 第四十四轮基线

参考：

- shadcn Select：https://ui.shadcn.com/docs/components/radix/select
- Radix Select：https://www.radix-ui.com/primitives/docs/components/select

观察：

- 资产组在侧边栏和账本中有稳定的颜色与文件夹身份，但进入总览筛选、批量归类和单钱包归类 Select 后只剩纯文本，用户需要重新建立对应关系。
- 原 Select 没有导出 Props、Trigger ref 或稳定 data-slot；选项 API 无法表达图标身份，触发器中的值和菜单项只能分别追加业务样式。
- Radix 支持复杂 `ItemText` 并会默认把其内容映射到 Trigger；`textValue` 仍是 typeahead 的纯文本依据，因此视觉身份和键盘语义可以分离。

方法判断：

- 当一个业务对象已经有稳定的视觉身份，筛选和编辑控件也应继承它，不应在操作边界降级成无关联文本。
- 复杂选项把图标与标题放进 `ItemText`，让选中值自动复用同一结构；同时显式传入 `textValue={label}`，避免图标干扰键盘查找和可访问名称。
- 长文本保留完整 DOM 和 title，在可见宽度内省略；菜单继续使用 trigger 最小宽度、视口最大宽度和 Radix collision 约束，不硬编码业务宽度。
- 选项图标是对象身份，触发器的 leading icon 是控件功能；两者保持独立 API，避免在钱包排序和 EVM/SOL 配对中加入无意义图标。

本轮动作：

- `SelectOption` 新增可选 `icon`，`Select` 导出 Props并用 `forwardRef` 暴露 Trigger；Trigger、Value、Content、Viewport、Item、Indicator 和选项子层全部增加 data-slot。
- 用 `ItemText asChild` 组合图标和标题，新增 18px 稳定图标槽、标题省略和完整 title；Value 外增可控包装层，不直接为 Radix Value 本体写布局样式。
- 抽出 `assetGroupSelectOption`，让总览筛选、批量归类和单钱包归类统一复用 `AssetGroupMark`；全部资产组使用 `all` 身份。

复核结果：

- 1440 x 900：16 个行内资产组 Select 都含 1 个对应颜色标识；钱包排序仍只有 1 个功能 leading icon、0 个资产组标识，可见交互控件重叠数为 0。
- 批量归类菜单正确显示“移到 + 资产组”和对应颜色；总览筛选触发器显示 `all` 标识，菜单中 6 个选项均有身份标识。
- 390 x 844：16 个移动行内 Select 均正常显示图标，页面与 body 横向溢出均为 0；菜单宽度与 242px Trigger 一致，左右边界均位于视口内。
- 模拟 47 字符中英文长组名后，Trigger 标题 `clientWidth / scrollWidth` 为 `170 / 402px`，菜单标题为 `297 / 345px`，两处 title 都保留完整名称，页面溢出为 0。
- 菜单打开后输入 `v` 会聚焦 `Virtuals`；`Escape` 关闭后活动元素回到原 Trigger。资产总览与钱包管理控制台均为 0 error / 0 warning，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第四十五轮基线

参考：

- W3C WAI Modal Dialog Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- Radix Dialog：https://www.radix-ui.com/primitives/docs/components/dialog
- shadcn Dialog：https://ui.shadcn.com/docs/components/radix/dialog

观察：

- Dialog 统一把标题设为初始焦点，适合需要先理解多项设置的“刷新范围”，但“批量导入”打开后还要再移动一次焦点才能粘贴地址。
- Dialog、Header、Body 和 Footer 未导出 Props、未支持 ref，也没有稳定的 data-slot；业务层和自动化无法可靠定位结构或选择初始焦点策略。
- 现有桌面居中弹窗和移动底部面板在视觉、滚动和动作区布局上已经稳定，不需要重新设计外观。

方法判断：

- 初始焦点由任务性质决定：结构较多的设置弹窗先聚焦可读标题，单一输入任务优先聚焦正文中的首个可操作控件；显式 `data-dialog-initial-focus` 始终拥有最高优先级。
- 焦点策略属于 Dialog 组件契约，业务只声明 `heading` 或 `first-control`，不在具体页面写查询和延时逻辑。
- 继续由 Radix 提供焦点圈定、Escape 关闭和可访问 Title / Description；项目层只控制初始焦点和触发按钮回焦。
- 组件 API 改良不改变当前尺寸、层级和移动端面板布局，避免为了统一原子接口引入视觉回归。

本轮动作：

- Dialog 新增 `initialFocus="heading" | "first-control"`，默认保留标题焦点；批量导入显式使用 `first-control`，打开后直接进入地址文本区。
- Dialog、DialogHeader、DialogBody 和 DialogFooter 全部改为 `forwardRef`，导出 Props / Size / InitialFocus 类型。
- Overlay、Content、Layout、Header、Title、Description、Body、Footer 和动作子层增加稳定 data-slot；Content 同步输出 data-size。
- 初始焦点查找限定在 DialogBody 内的可用控件，找不到时回退到标题；关闭时继续回到仍存在的触发按钮。

复核结果：

- 1440 x 1000：“刷新范围”打开后活动元素为 `H2[data-slot="dialog-title"][tabindex="-1"]`，Tab 进入关闭按钮；Escape 关闭后回到“刷新范围”。
- 390 x 844：“批量导入”打开后活动元素直接为地址 textarea；Shift + Tab 从文本区进入关闭按钮，再次 Shift + Tab 仍圈定在弹窗内；Escape 后回到“批量导入”。
- 移动弹窗边界为 `0–390 x 84–844px`，Header / Body / Footer 依次衔接，文档横向溢出为 0，弹窗 `clientHeight / scrollHeight` 均为 759px。
- 注入更长标题和说明后，两者 `scrollWidth <= clientWidth`，标题区与关闭按钮不重叠，Header 与 Body 不重叠。
- 全新浏览器会话控制台为 0 error / 0 warning，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第四十六轮基线

参考：

- W3C WAI Alert Dialog Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
- W3C WAI Modal Dialog Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- Radix Alert Dialog：https://www.radix-ui.com/primitives/docs/components/alert-dialog
- shadcn Alert Dialog：https://ui.shadcn.com/docs/components/radix/alert-dialog

观察：

- `ConfirmDialog` 只在早期完成了视觉迁移，没有导出 Props、支持 ref 或提供稳定 data-slot，业务与自动化难以复用结构契约。
- 初始焦点通过下一帧延迟进入取消按钮，弹窗打开瞬间存在短暂的不确定状态；破坏性操作应在打开时直接聚焦风险最低的操作。
- 旧回焦只检查元素是否仍在 DOM 中。删除触发器被禁用，或桌面弹窗打开后切换到移动布局使触发器隐藏时，回退链可能失效并把焦点留在页面根节点。
- 当前弹窗的视觉层级、影响摘要和移动端按钮布局已经稳定，不需要为 API 升级重做外观。

方法判断：

- 不可逆或高风险操作默认聚焦取消按钮，由 Radix 继续提供 `alertdialog` 语义、焦点圈定和 Escape 关闭。
- 回焦目标必须同时满足：仍在文档中、未禁用、未隐藏或 inert、存在可见布局盒，并且调用 focus 后确实成为活动元素。
- 原触发器失效后按业务提供的 ID 顺序尝试逻辑回退；资产组流程同时覆盖移动端“当前资产组”、桌面“未分类”和“全部钱包”。
- 原子组件升级应保留现有视觉层级，同时暴露 ref、Props、data-slot 和有无正文状态，供组合组件、测试与后续样式扩展使用。

本轮动作：

- `ConfirmDialog` 改为 `forwardRef`，导出 Props，并为 Overlay、Content、Layout、Header、Icon、Heading、Title、Description、Body、Footer、Cancel 和 Action 增加稳定 data-slot。
- Content 输出 `data-has-body`；打开时同步聚焦取消按钮，不再等待 `requestAnimationFrame`。
- 新增严格的可见聚焦校验，复制保存 fallback ID 快照，并在关闭后依次尝试原触发器和逻辑回退目标。
- 资产组移动触发器增加稳定 ID，删除流程把它加入回焦链；业务调用删除重复的 Trash 图标声明，继续使用组件默认 Lucide 图标。

复核结果：

- 390 x 844 地址删除弹窗打开后焦点位于 Cancel，Tab 在 Cancel 与 Action 间循环；Escape 后回到原“删除地址”按钮，钱包统计仍为 16 个逻辑钱包、32 个链上地址。
- 1440 x 900 资产组删除弹窗中，将原触发器设为 disabled 后关闭，焦点会回到 `asset-group-button-unclassified`；没有执行删除。
- 从 1440px 打开资产组删除弹窗后切换到 320px，Escape 会把焦点交给可见的 `asset-group-mobile-trigger`，不再落到页面根节点。
- 320 x 720 注入 45 字符混合标题和长说明后，弹窗边界为 `12–308 x 188–532px`；标题与说明 `scrollWidth = clientWidth`，按钮各 129px 且互不重叠，页面横向溢出为 0。
- 全新浏览器会话控制台为 0 error / 0 warning，所有测试仅取消关闭弹窗，未执行真实删除。
