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

状态：已有，第一轮统一尺寸和选中态。

职责：切换按资产组、按币种、按钱包三种互斥视图。

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
- `Checkbox / Switch`：保留原生 input 语义，使用统一的可视控制面；批量选择使用 checkbox，二元刷新设置使用 switch。
- `Badge / StatusBadge`：用 success、warning、danger、neutral、accent、info、outline 表达语义，不以装饰颜色代替状态。
- `Notice / EmptyState`：统一成功、信息、警告、错误反馈以及加载、无数据、无搜索结果状态。

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
