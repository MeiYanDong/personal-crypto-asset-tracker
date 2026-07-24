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

状态：第一轮实现，第八十七轮重整范围信息层级。

职责：在一个连续摘要带中展示总资产、保守估值、稳定币/波动资产构成、折价缓冲、钱包/币种/链数量，并将常态链范围收纳到对应事实而非 Alert。

### Asset Share Bar

状态：第一轮实现。

职责：在资产组金额旁显示其占总资产比例；不额外引入图表库。

### Segmented View Switcher

状态：第十五轮迁移为 Tabs 原子组件。

职责：切换按资产组、按链、按币种、按钱包四种互斥视图。

### Management Selection Bar

状态：第二轮强化，已迁移为按选择状态出现的 Contextual Selection Bar。

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

- `Button / IconButton`：primary、secondary、ghost、quiet、danger 五种命令层级，三档尺寸，统一 loading、disabled、focus 与图标间距；需要解释的禁用命令保留在焦点顺序中并通过 `disabledReason` 说明原因，图标按钮同时提供可访问名称和悬停提示。
- `Input / Textarea / LineTextarea / SearchField`：统一边框、焦点环、错误态和 placeholder；批量输入提供与逻辑行同步的行号，搜索框包含 Lucide Search、按需出现的清除命令和保留焦点的 Escape 清空行为。
- `Select / DropdownMenu`：使用 Radix 提供键盘导航、焦点托管、Portal 与碰撞处理；两类浮层共享 popover 语义令牌、边框、阴影、高亮与禁用状态。
- `Checkbox / Switch / ColorSwatchGroup`：使用统一的可视控制面；checkbox 的透明原生输入覆盖完整点击区，760px 以下未标注 checkbox 使用 32px 紧凑触控目标，批量选择支持 checked、unchecked、indeterminate 三态，二元刷新设置使用 switch，必选颜色使用 Radix Radio Group、可见颜色名称和选中图标。
- `Badge / StatusBadge`：用 success、warning、danger、neutral、accent、info、outline 表达语义，不以装饰颜色代替状态。
- `Notice / EmptyState`：统一成功、信息、警告、错误反馈以及加载、无数据、无搜索结果状态。
- `Tooltip`：为纯图标命令提供统一说明，通过 Portal 避免被表格和面板裁切，支持悬停、键盘焦点和 Escape 关闭。
- `Dialog / ConfirmDialog`：统一受控打开、标题描述关系、初始焦点、关闭返回焦点、遮罩和破坏性确认语义。
- `Collapsible / DisclosureIconButton`：统一显隐内容、受控开合、动态名称、aria-expanded / aria-controls 关系和单一 Chevron 旋转；不能由 Radix Root 直接包裹的 table disclosure 仍复用相同触发器契约。
- `InputGroup / InlineEdit / ButtonGroup / Pagination`：分别承载字段内嵌动作、可组合脏状态的就地编辑、相邻命令和长列表翻页，业务层只组合状态与领域命令。
- `RouteNavigation`：以真实 `nav / ul / a` 组成页面级导航，当前页面使用 `aria-current="page"`；保留新标签页、下载和组合键等浏览器链接行为，不把跨页面导航伪装成 Tabs。
- `CurrencyValue / QuantityValue / PercentageValue / TimeValue / CountValue / CountPair / MeterBar / DistributionBar`：统一金额、数量、比例、时间、计数与范围的可扫描表达、机器可读值、完整值辅助信息、等宽数字和占比可视化；业务视图提供原始值，不自行拼接币种、精度、相对时间、范围与缩写。
- `Tabs / TabsList / TabsTrigger / TabsContent`：统一互斥视图切换、等宽分段布局、roving focus、自动激活和 tab/panel 语义关系。
- `Table / TableHeader / TableBody / TableRow / TableHead / TableCell / TableCaption`：保留原生 table 语义，统一响应式滚动容器、列头 scope、caption、数字列对齐和行状态；业务视图继续决定列结构、筛选和排序。

原子控件令牌集中在 `src/styles.css`：40px 桌面控件高度、44px 移动端高频控件与表单高度、34px 小尺寸、6px 圆角、语义边框、focus ring 和 120-140ms 状态过渡；桌面高密度界面继续保留紧凑尺寸，移动端通过真实目标盒而不是视觉图标尺寸保证命中面积。

### Semantic Theme Layer

状态：第八十五轮实现。

职责：以 `background / foreground`、`card`、`popover`、`primary`、`secondary`、`muted`、`destructive`、`border / input / ring`、`radius` 和共享 shadow 组成主题契约；现有 `ink / surface / accent / line` 作为兼容别名，避免主题迁移改变当前视觉。

### Actionable Metadata List

状态：第九十三轮实现。

职责：用紧凑的 label / value / icon / action 插槽承载链分布、合约地址和风险信息；元数据本身保持可扫描，需要操作的条目复用项目级异步 IconButton，而不是把整个信息标签伪装成按钮。

### Copyable Wallet Address List

状态：第九十五轮实现，第九十七轮补齐极窄屏 Item 重排。

职责：在钱包管理表与钱包资产账本中统一展示 EVM/SOL 类型、压缩地址和末端复制动作；地址仍是信息项，CopyButton 独立承担 Clipboard、Tooltip、焦点与成功/失败状态，不要求用户先展开钱包。管理 Item 在内容宽度不足时将徽标/标题/操作与地址说明拆成两层，不能通过缩小触控目标换取表面紧凑。

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

### 2026-07-22 第四十七轮基线

参考：

- W3C WAI Tabs Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- Radix Tabs：https://www.radix-ui.com/primitives/docs/components/tabs
- shadcn Tabs：https://ui.shadcn.com/docs/components/radix/tabs
- Tailwind Flex Basis：https://tailwindcss.com/docs/flex-basis

观察：

- 320px 视口中，Tab 列表只有 220px，四个等宽 Trigger 各 49.5px；“资产组”的按钮 `clientWidth` 为 48px、内容 `scrollWidth` 为 52px，图标左边界比按钮左边界多越出 3.75px。
- Tab 列表右侧还有 42px 的导出按钮，不能简单扩大列表；第一次改为内容感知 Flex 后，列表受默认 `min-width: auto` 影响扩到 258px，导出按钮被父容器裁掉。
- 原组件已经使用 Radix，方向键自动切换正确，但 Props 未导出，也没有布局变体、图标/标签结构和稳定 data-slot。
- 桌面四段各 83px 的等宽节奏清晰，不应为了窄屏问题改变所有视口的视觉结构。

方法判断：

- 即时本地内容适合保留自动激活；继续由 Radix 提供 Arrow、Home、End、循环、role、aria-selected、aria-controls 和面板关联。
- 相邻工具栏控件的完整可见性与 Tab 内部文字同等重要；不能用 `overflow: hidden` 掩盖列表挤压导出按钮的问题。
- `adaptive` 在桌面保留等宽 Grid，在移动端切换为内容感知 Flex；列表本身允许收缩，Trigger 按文字长度获得不同宽度。
- 文字与 Lucide 图标都承担快速识别，不在窄屏隐藏其中一项；360px 及以下使用可计算的紧凑密度，361px 起恢复常规移动间距。

本轮动作：

- 导出 `TabsProps`、`TabsListProps`、`TabsTriggerProps`、`TabsContentProps` 与 `TabsListLayout`，保留所有 Radix 原生能力。
- `TabsList` 新增 `equal / content / adaptive` 布局；Root、List、Trigger、Icon、Label 和 Content 增加稳定 data-slot，Trigger 新增独立 `icon` 属性。
- 列表增加 `min-width: 0`；移动端 `adaptive` 使用 Flex 内容分配，360px 及以下把 Trigger 间距与左右内边距收紧为 2px。
- 资产汇总视图改用 `layout="adaptive"`，四个 Lucide 图标由 Trigger 的图标槽统一承载。

复核结果：

- 320 x 720：Tab 列表保持 220px，导出按钮保持 42px，两者间距 8px；四个标签 `scrollWidth <= clientWidth`，图标与文字均位于各自按钮边界内，页面横向溢出为 0。
- 320px 下四段宽度按内容分配为 61.5 / 37.5 / 49.5 / 49.5px，“资产组”不再与其他短标签争夺相同宽度。
- 360px 使用 2px 紧凑间距，361px 自动恢复 5px 图标间距与 6px 左右内边距；两个断点的文字都完整显示且无页面溢出。
- 1440 x 900：Tab 列表继续为 354px，四段均为 83px；End、Home 和 ArrowRight 会同步更新焦点、选中状态与对应面板，Tab 离开列表后进入导出按钮。
- 面板继续通过 `aria-labelledby` 关联活动 Trigger；全新浏览器会话控制台为 0 error / 0 warning，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第四十八轮基线

参考：

- W3C WAI Tooltip Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
- Radix Tooltip：https://www.radix-ui.com/primitives/docs/components/tooltip
- shadcn Tooltip：https://ui.shadcn.com/docs/components/radix/tooltip
- MDN aria-disabled：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled

观察：

- 启用的 IconButton 已支持 hover、键盘焦点、`aria-describedby` 与 Escape，基础 Tooltip 行为稳定。
- 禁用 IconButton 使用原生 `disabled` 并把 Tooltip Trigger 移到外层 `span`；鼠标能看到命令标签，但键盘会跳过按钮，可访问描述也没有关联到按钮本身。
- “导出资产快照”不可用时只重复显示命令名称，没有告诉用户需要先刷新资产，无法帮助用户恢复操作。
- SearchField 的 Escape 已能清空内容、隐藏清除按钮并保留输入焦点，本轮不为形式统一重复改写已经正确的交互。

方法判断：

- 普通禁用继续使用原生 `disabled`，保持浏览器阻止交互和移出 Tab 顺序的默认语义。
- 只有用户需要发现且存在明确恢复条件的重要操作，才使用 `disabledReason` 进入可解释禁用：保留 button 焦点，以 `aria-disabled` 表达状态，并由组件阻止所有 click 默认行为和业务回调。
- 可解释禁用的 Tooltip 内容优先显示恢复条件；hover 与键盘 focus 都能打开，Escape 只关闭 Tooltip 且不移动焦点，Trigger 通过 `aria-describedby` 关联内容。
- `aria-disabled` 不是原生行为替代品。组件必须同步提供禁用视觉、排除 hover / active 反馈，并通过事件守卫保证表单和业务动作都不会执行。

本轮动作：

- Tooltip 导出 Provider / Root Props，支持 Root 原生受控属性、Content ref、collisionPadding，并为 Trigger、Content 和 Arrow 增加稳定 data-slot。
- IconButton 新增 `disabledReason`；该属性只在 Tooltip 开启、业务 disabled 且非 loading 时启用可解释禁用，其他禁用和加载状态仍使用原生 disabled。
- 可解释禁用按钮输出 `aria-disabled="true"`，直接作为 Radix Trigger，点击、Enter、Space 和程序化 click 均由组件拦截。
- “导出资产快照”增加“刷新资产后即可导出资产快照”的恢复说明；CSS 为 aria-disabled 补齐透明度、禁止光标，并排除 hover / active 样式。

复核结果：

- 320 x 720：从活动 Tab 按 Tab 会进入禁用导出按钮；Tooltip 文案为“刷新资产后即可导出资产快照”，按钮的 `aria-describedby` 与 Tooltip ID 一致。
- Tooltip 边界为 x=153–312px，保持 8px 视口留白；`clientWidth / scrollWidth` 均为 159px，页面与 body 横向溢出均为 0。
- Escape 关闭 Tooltip 后焦点仍在按钮；Enter、Space 与程序化 click 的导出 URL 创建次数均为 0，hover 仍能再次显示相同原因。
- 恢复真实快照后按钮回到 `idle`，没有 `aria-disabled`；焦点 Tooltip 继续显示“导出资产快照”，Escape 与描述关联没有回归。
- 1440 x 900 与 390 x 844 均无横向溢出；全新浏览器会话控制台为 0 error / 0 warning，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第四十九轮基线

参考：

- shadcn Item：https://ui.shadcn.com/docs/components/radix/item
- W3C WAI Content Structure：https://www.w3.org/WAI/tutorials/page-structure/content/
- MDN ul：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ul

观察：

- `HoldingList` 有内容时输出带 `aria-label="主要持仓"` 的 `ul / li`，空内容时却提前返回普通 `span`，同一个组件的根元素和可访问结构随数据变化。
- 空状态分支没有转发 className、aria 属性或其他调用方属性，也无法支持 ref；真实页面中的“暂无持仓”不在任何列表内，`aria-label` 已经丢失。
- `HoldingListProps` 与 `HoldingItemProps` 未导出，两个组件都没有 ref、data-slot 或可观测状态；业务与测试只能依赖内部 class。
- 现有紧凑持仓视觉已经稳定，空提示为 12px 字号、14px 实际高度；本轮不需要扩大项目、增加卡片或引入交互。

方法判断：

- 数据数量不应改变组件的语义根节点。持仓集合始终使用原生 `ul`，内容项和空提示都使用直接 `li`，调用方属性始终落到同一个列表元素。
- WAI 用列表为相关信息提供方向，MDN 明确 `ul` 拥有隐式 list 角色并允许零个或多个 `li`；本项目用一个静态空状态项同时保留可见说明和集合边界。
- 空提示是当前数据事实，不是异步操作结果，不增加 live region；持仓是静态内容，也不进入 Tab 顺序。
- 组件升级优先补齐组合契约和状态可观测性，视觉只修正因元素类型变化产生的行高差异。

本轮动作：

- `HoldingList` 改为 `forwardRef` 并导出 `HoldingListProps`；无论是否有数据都输出 `ul`，增加 `data-slot="holding-list"` 与 `data-empty`。
- 空提示改为 `li[data-slot="holding-empty"]`，继续使用原文案和弱化色；明确 14px 行高，防止语义升级撑高移动卡片。
- `HoldingItem` 改为 `forwardRef` 并导出 `HoldingItemProps`，增加 `data-slot="holding-item"` 与 `data-has-balance`。
- 图标、币种、数量和市值增加稳定 data-slot；原有“数量 / 市值”屏幕阅读器标签和视觉结构保持不变。

复核结果：

- 1440 x 900：可见 2 个 `ul[aria-label="主要持仓"]`，其中 1 个为 `data-empty=true`；所有直接子节点均为 `li`，列表内部可聚焦元素数量为 0。
- 从活动资产组 Tab 按 Tab 仍直接进入导出按钮，静态持仓列表没有改变键盘顺序。
- 390 x 844：同样保留 2 个命名列表和 1 个空状态项；空提示高度为 14px，页面与 body 横向溢出均为 0。
- 链视图的所有可见持仓项都输出 `data-has-balance=true`，子槽依次包含图标、币种、数量和市值，可访问文本继续包含两组数值标签。
- 完整重载和全新浏览器会话均正常；控制台为 0 error / 0 warning，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第五十轮基线

参考：

- shadcn Field：https://ui.shadcn.com/docs/components/base/field
- W3C WAI Labeling Controls：https://www.w3.org/WAI/tutorials/forms/labels/
- W3C WAI Grouping Controls：https://www.w3.org/WAI/tutorials/forms/grouping/
- MDN `group` role：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/group_role

观察：

- `Field` 为单个 textarea 默认输出未命名的 `role="group"`；批量导入的可见标签是“名称与地址”，控件却用 `aria-label` 覆盖为“批量导入钱包地址”。
- 错误提示已经通过 `aria-describedby` 与 `role="alert"` 关联，但提交无效内容后焦点仍留在按钮，用户需要再寻找出错输入。
- Field 组件族没有导出 Props、ref 和稳定 data-slot；认证密码输入也缺少浏览器识别当前密码所需的 autocomplete。

方法判断：

- 单个显式标注的控件不额外创建 group；真正的相关控件组使用 `fieldset / legend`，或显式命名的 `role="group"`。
- 可见标签应同时成为控件的可访问名称，不用不同的 `aria-label` 覆盖；错误状态同时提供容器状态、控件状态、说明关系和焦点修正。
- 结构契约沉到组件层，业务只负责错误文案和无效状态；密码字段使用原生 autocomplete token。

本轮动作：

- Field、Header、Label、Description 和 Error 全部改为 `forwardRef`，导出 Props，并增加 `field-*` data-slot。
- Field 默认恢复为普通布局容器；FieldError 默认保留可覆盖的 `role="alert"`。
- 批量导入移除覆盖标签的 `aria-label`，增加 textarea ref；校验失败后下一帧把焦点送回输入。
- 认证密码输入增加 `autoComplete="current-password"`。

复核结果：

- 正常状态不再出现未命名 group，textarea 的可见标签和可访问名称均为“名称与地址”。
- 无效内容提交后，Field 为 `data-invalid=true`，textarea 保持 `aria-invalid=true`、正确关联错误 ID，并重新获得焦点；错误图标和文本槽完整。
- 390 x 844 错误弹窗完全位于视口内，textarea 与错误提示不重叠，文档无横向溢出。
- 模拟 401 认证入口后，密码输入为 `type="password"`、`autocomplete="current-password"` 并自动聚焦；正常本地会话控制台为 0 error / 0 warning。

### 2026-07-22 第五十一轮基线

参考：

- MDN CSS Box Alignment：https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_alignment
- MDN CSS `translateY()`：https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/translateY

观察：

- 钱包与链徽标的 DOM 外框中心一直与内部 Grid 中心重合，但 12px 编号和 18px 线性 SVG 在真实截图中仍显得小且偏向左上；只测元素边界无法代表可见墨迹。
- `.asset-cell span` 仍会以更高选择器优先级把钱包徽标颜色覆盖为弱化灰色，降低对比度后进一步放大视觉偏移感。
- 元素截图会受实际像素栅格影响：移动 40px 徽标输出 40 x 41px 图像，桌面 38px 徽标输出 38 x 39px；统一平移会修正一端并弄偏另一端。

方法判断：

- 身份标记显式区分 `text / icon` 内容类型，并在固定尺寸槽内完成一次 Flex 居中；业务页面不再猜内部字形尺寸。
- 先提高有效图形面积和对比度，再按元素截图的可见墨迹边界做最小补偿；不同外框尺寸不能共享未经验证的光学偏移。
- 父级文本样式只命中文本容器的直接子层，不允许宽泛 descendant selector 穿透身份组件。

本轮动作：

- `IdentityMark` 增加必填 `kind`、导出 Props / Kind、支持 ref，并输出 `identity-mark` 与 `identity-mark-glyph` data-slot。
- 内部改为单一 24 x 24 Flex 内容槽；钱包编号使用 14px IBM Plex Sans 和更清晰字重，链 SVG 放大到 20px。
- 将 `.asset-cell span` 收窄为 `.asset-cell > div > span`，恢复钱包徽标的棕色身份层级。
- 桌面 38px 链徽标保持零偏移；仅移动账本的 40px 变体通过组件变量向下校正 1px。

复核结果：

- 390 x 844：链图标可见墨迹边界为 `x=11–28 / y=12–28`，中心 `(19.5, 20)` 与 40 x 41px 外框中心完全一致。
- 1440 x 900：链图标边界为 `x=10–27 / y=11–27`，中心 `(18.5, 19)` 与 38 x 39px 外框中心完全一致。
- 钱包 1 / 9 / 10 / 16 覆盖一位数、不同字形和两位数；24px 内容槽与外框中心重合，颜色恢复为 `rgb(118, 83, 24)`。
- 桌面和移动页面均无横向溢出；全新浏览器会话中钱包与链标记数量、kind 和槽结构正确，控制台为 0 error / 0 warning。

### 2026-07-22 第五十二轮基线

参考：

- shadcn Chart：https://ui.shadcn.com/docs/components/base/chart
- W3C WAI Complex Images：https://www.w3.org/WAI/tutorials/images/complex/
- MDN CSS Box Alignment：https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_alignment

观察：

- 资产构成、刷新质量和链分布都依赖同一个图例原子，但原组件没有导出 Props、ref 或稳定子槽；6px 紧凑色块和 10px 文字在 320px 下识别成本偏高。
- 分布条通过一段很长的 `aria-label` 重复全部明细，旁边已经存在的可见图例却没有与图形建立说明关系。
- 第五十一轮按元素截图的可见墨迹做了移动端 `translateY(1px)` 补偿。用户复核仍感到钱包和链标记中的内容偏向左上，说明依赖栅格截图的尺寸特例不能替代统一的组件中心契约。

方法判断：

- 图形只保留短名称，可见原生列表承担详细文本替代，并通过 `aria-describedby` 建立关联；标签和颜色配置与数据本身分离。
- 图例是静态说明，不增加交互或卡片。保持 `ul / li`，提高最小字号、色块尺寸和行高，在窄屏自然换行。
- 身份标记的外框、glyph 层和 SVG 必须共享同一个几何中心；内部层铺满内容盒，位置不再按视口或外框尺寸补偿。

本轮动作：

- `LegendList` 与 `LegendItem` 改为 `forwardRef`，导出密度、色块变体和 Props，并为列表、项目、色块、标签和值增加稳定 data-slot。
- `DataBar` 导出三类 Props，补充 `meter / distribution` 类型、数值状态和 segment 槽；资产构成、有效覆盖率和链分布都用 `aria-describedby` 关联对应图例。
- 紧凑图例统一为 11px 字号和 7px 色块，默认色块为 8px；项目增加稳定最小高度和行高。
- `IdentityMark` 外层与 glyph 改为 `grid + place-items:center`，glyph 使用 100% 宽高，SVG 显式锁定同一网格中心；删除移动链标记的 1px 位移。

复核结果：

- 320 x 720：钱包 40px 外框与 38px glyph 中心偏差为 `(0, 0)`；链 40px 外框、38px glyph 和 20px SVG 的中心偏差均为 `(0, 0)`，页面横向溢出为 0。
- 1440 x 900：钱包 40px 外框与 glyph 中心偏差为 `(0, 0)`；链 38px 外框与 glyph、SVG 中心偏差均为 `(0, 0)`。
- 页面共 3 个命名图例；所有直接子项均包含 swatch / label 槽，三条图形说明关系都能解析到真实图例 ID，桌面和移动端均无横向溢出。
- 全新浏览器会话控制台为 0 error / 0 warning，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第五十三轮基线

参考：

- W3C WAI Disclosure Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- W3C WAI Disclosure Navigation Example：https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/
- Radix Collapsible：https://www.radix-ui.com/primitives/docs/components/collapsible
- shadcn Collapsible：https://ui.shadcn.com/docs/components/radix/collapsible

观察：

- 原 `Collapsible` 只是 Radix 的薄封装，没有导出 Props、稳定子槽或共享状态图标，两个业务入口各自维护 Chevron 和旋转 CSS。
- `CollapsibleTrigger asChild` 会把 `data-state="open / closed"` 传给 Button，但 Button 又将它覆盖为 `idle / loading / disabled`；实际出现 `aria-expanded=true`，按钮却仍显示“查看”且箭头不旋转。
- 移动钱包侧栏通过读取 Root 状态碰巧维持视觉正确，停用资产组则直接读取 Trigger 状态；同一缺陷因此表现不一致。
- 原通用 reduced-motion 规则把动画压缩到极短时间，但没有显式取消折叠内容动画和方向图标过渡。

方法判断：

- Disclosure 的视觉必须与 `aria-expanded` 同步；Radix 的 `data-state` 保留给 Primitive 自身动画和状态观察，不能被子组件占用。
- 复合组件通过 `asChild` 注入的 `data-state` 与 `data-slot` 优先于按钮默认值；按钮自身的业务状态独立放在 `data-status`。
- 展开图标统一为一个 Lucide 原子，通过 `right / down` 方向变体决定展开后的 90° / 180° 旋转，不在业务组件重复编写 SVG 状态规则。
- 减少动态效果时必须明确取消内容动画和图标过渡，同时保留展开后的最终方向与可见状态。

本轮动作：

- `Collapsible`、Trigger 和 Content 导出 Props、ref，并增加稳定 `data-slot` 与 `data-collapsible-part`；新增共享 `CollapsibleChevron`。
- Button 与 IconButton 保留外层 Primitive 注入的 `data-state` 和 `data-slot`，新增 `data-status` 表达自身 idle、loading、disabled 状态。
- 停用资产组文案改由 `aria-expanded` 控制；停用资产组和移动钱包侧栏都改用共享 Chevron，删除两套局部旋转规则。
- reduced-motion 下显式取消 Collapsible 内容动画和 Chevron 过渡。

复核结果：

- 390 x 844：停用资产组展开后 Trigger 同时为 `aria-expanded=true`、`data-state=open`、`data-status=idle`，只显示“收起”，右向 Chevron 旋转 90°。
- 390 x 844：移动钱包侧栏使用 Space 关闭、Enter 打开后焦点都留在 Trigger；内容 hidden 状态与 aria-expanded 同步，向下 Chevron 展开后旋转 180°。
- 两个 Trigger 的 `aria-controls` 都指向真实 Content ID；Root、Trigger、Content 的 part 和 slot 可被稳定观察，页面横向溢出为 0。
- reduced-motion 下内容动画为 none、Chevron 过渡为 0s；1440 x 900 桌面布局无回归，Tooltip 组合状态正常，全新会话控制台为 0 error / 0 warning，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第五十四轮基线

观察：

- 钱包编号和链 SVG 的元素边界虽然与徽标外框保持几何同心，但实际界面中的可见字形与笔画仍显得偏向左上。
- 前一轮删除所有光学校正后，组件测试只能证明盒模型对齐，不能代表用户最终看到的视觉重心。

方法判断：

- 固定尺寸标记应把布局居中与光学居中分开：外框继续用 Grid 保证结构稳定，内部 glyph 独立承担像素级视觉补偿。
- 光学校正不能移动外框，否则会改变表格与移动账本的对齐；校正值应通过组件级 CSS 变量统一管理，并允许特殊图形覆盖。

本轮动作：

- `IdentityMark` 外框保持原尺寸和几何中心不变，内部 glyph 统一向右、向下移动 1px。
- 新增 `--ui-identity-mark-optical-x / y` 变量，钱包文字与链图标使用同一默认值，调用方无需重复样式。

复核结果：

- 1440 x 900：钱包标记外框保持 40px，链标记外框保持 38px；内部 glyph 与 Network SVG 的中心相对外框均为 `(1px, 1px)`，表格行高未改变。
- 390 x 844：钱包和链标记外框均为 40px，内部内容使用相同的 `(1px, 1px)` 光学校正；页面与 body 的 `clientWidth / scrollWidth` 均为 390px。
- Lucide SVG 继续保持 20px 尺寸、stroke 和无障碍属性；桌面与移动真实截图确认编号和链图形不再偏向左上。
- TypeScript、Vite 本地生产构建和 Vercel 生产构建均通过。

### 2026-07-22 第五十五轮基线

参考：

- shadcn Sonner：https://ui.shadcn.com/docs/components/base/sonner
- Sonner Toaster：https://sonner.emilkowal.ski/toaster
- Sonner Toast：https://sonner.emilkowal.ski/toast
- Sonner Styling：https://sonner.emilkowal.ski/styling
- W3C WAI Alert Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/alert/

观察：

- 原 `ToastViewport` 是不可组合的固定函数：不导出 Props、不支持 ref，也无法合并调用方的 class、图标、位置与 toastOptions。
- 所有通知默认完全展开；连续操作会形成较高的遮挡层。Sonner 默认采用三条可见、最新一条在前的紧凑队列，并允许用户通过 `Alt+T` 临时展开。
- 动作、取消、加载图标没有项目级样式；长地址文案缺少明确断行约束，关闭按钮只有 26px，动作按钮与关闭按钮在窄屏存在碰撞风险。
- 移动端通过覆盖固定宽度抵消 Sonner 自己的布局计算，未覆盖安全区。`Alt+T` 能进入通知区，但 `Escape` 收起后焦点仍停在通知列表。

方法判断：

- 通知继续使用 `aria-live="polite"` 的非打断式反馈，不主动抢焦点；键盘用户需要时通过 Sonner 热键进入通知区。
- 默认折叠队列只展示最新内容，最多保留三条可见通知；hover、焦点或热键负责临时展开，降低对资产表格的遮挡。
- 组件默认值和调用方覆盖分层合并，尤其保留 icons 与 toastOptions.classNames 的嵌套合并能力；ref 必须落到真实通知 viewport。
- `Escape` 关闭临时展开状态后应回到进入通知区前的控件，避免用户在页面键盘顺序中失去位置。

本轮动作：

- `ToastViewport` 改为 `forwardRef` 并导出 `ToastViewportProps`；className、icons、offset、mobileOffset 与 toastOptions.classNames 都支持增量覆盖。
- 默认改为紧凑三层队列，保留 `Alt+T` 热键，增加左右 / 向下滑动关闭，并将方向改为自动读取文档方向。
- 桌面与移动 offset 接入 safe-area；图标槽固定为 18px 居中网格，标题和说明支持任意长串断行。
- 为 action、cancel、loader 和 30px 关闭按钮补齐项目样式、hover 与 focus-visible 状态。
- viewport 记录外部进入焦点；通知区内按 `Escape` 后在下一帧将焦点恢复到原控件，同时继续执行 Sonner 自身的收起逻辑。

复核结果：

- 1440 x 900 长文案通知为 356 x 128.5px；标题与说明 `scrollWidth = clientWidth`，动作按钮与关闭按钮间距 4px，页面横向溢出为 0。
- 390 x 844 通知左右各留 12px，宽 366px；动作按钮、关闭按钮和长地址均无重叠，document / body 的 `clientWidth / scrollWidth` 都为 390px。
- 三条队列默认依次缩放为 1 / 0.95 / 0.9；`Alt+T` 后全部变为 `data-expanded=true` 并纵向分离，`Escape` 后收起且焦点从通知列表回到“搜索钱包”。
- 项目级 reduced-motion 规则和 Sonner 自身规则都明确取消通知 transition / animation；全新 1280 x 720 会话为 0 error / 0 warning。
- 临时测试入口已经移除，钱包 1 名称与页面数据未改变；TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第五十六轮基线

参考：

- tweakcn Dashboard Theme：https://tweakcn.com/editor/theme?p=dashboard
- shadcn Navigation Menu：https://ui.shadcn.com/docs/components/radix/navigation-menu
- W3C Navigation Landmark：https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html
- MDN aria-current：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current

观察：

- 第三十轮已经把主导航改为正确的 `nav + ul/li + a`，但 `RouteNavigationProps` 未导出，组件不支持 ref，也没有稳定 data-slot；业务和自动化仍只能依赖内部 class。
- 导航项只能传入 href、标签和图标，无法声明 target、rel、download 或先执行调用方 onClick；浏览器行为保护只覆盖鼠标按键和修饰键。
- 当前页主要依赖白底和较大的悬浮阴影，与普通项的视觉差异在低对比屏幕上较弱，也没有显式的高对比度模式处理。
- 桌面基线为 236 x 44px、单链接 111 x 34px；移动基线为 370 x 44px、单链接 178 x 34px，语义与响应式宽度已经正确，不需要改造成 Sidebar、Tabs 或菜单角色。

方法判断：

- 跨 URL 的应用主入口继续使用真实链接；Tabs 只用于同一页面内的面板切换，菜单模式只用于需要展开子层级的导航。
- 视觉当前态必须直接由 `aria-current="page"` 驱动，并保证一个导航集合只有一个 current；data-state 只作为可观察的组件状态补充。
- SPA 只接管无修饰键、左键、当前窗口且非下载的普通导航。defaultPrevented、修饰键、非左键、target 和 download 都交还浏览器。
- 工作型工具的主导航保持紧凑；当前页使用一条稳定的品牌色定位线和图标色，不通过更大的阴影或动画制造层级。

本轮动作：

- `RouteNavigationProps` 正式导出；泛型组件增加 HTMLElement ref，并把调用方 style 与内部 `--ui-route-count` 合并到根节点。
- 导航项增加 target、rel、download 和 onClick；调用方可以阻止导航，原生新窗口与下载行为不会被 SPA 拦截。
- 根、列表、项目、链接、图标和标签增加稳定 data-slot；项目与链接同步输出 idle / current data-state 和 data-current。
- 链接高度从 34px 调整为 36px；当前项改为 2px 绿色内定位线、绿色图标和更轻阴影，普通项增加按下态，focus-visible 独立提升层级。
- forced-colors 下当前链接改用系统 Highlight 色和 currentColor 定位线。

复核结果：

- 1440 x 900：导航为 236 x 46px，两个链接均为 111 x 36px；只有“钱包管理”为 `aria-current=page / data-state=current`，当前图标为深绿色，页面横向溢出为 0。
- 390 x 844：导航为 370 x 46px，两个链接均为 178 x 36px，右侧边界为 375px；document / body 的 `clientWidth / scrollWidth` 都为 390px。
- 当前链接普通点击后路径保持 `/wallets`；“资产总览”普通点击切换到 `/`，Meta 点击没有触发 SPA 路由，原页仍停留 `/`。
- Tab 可将焦点送到“钱包管理”，focus-visible 为 3px 品牌色焦点环；可访问快照保留 navigation、list、link 与唯一 current 语义。
- 桌面和移动实图无文字、图标或当前线重叠；控制台为 0 error / 0 warning，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第五十七轮基线

参考：

- shadcn Spinner：https://ui.shadcn.com/docs/components/base/spinner
- shadcn Alert：https://ui.shadcn.com/docs/components/base/alert
- shadcn Empty：https://ui.shadcn.com/docs/components/base/empty
- W3C Alert Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/alert/
- MDN status role：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role

观察：

- Spinner 已统一应用于 Button、EmptyState 和 Toast，但 Props 未导出、不能转发 SVG ref，也没有稳定 data-slot；独立使用时尺寸依赖 Lucide 默认值。
- Notice 根节点承担 alert / status 角色，同时 action 也位于根节点内部；带按钮的 danger Notice 会把交互控件放进 alert live region。
- Notice 的 live 属性只通过默认 role 间接生效；调用方显式传入自定义 role 时，polite / assertive 不会转成真实 aria-live。
- Notice 与 EmptyState 已有正确视觉层级，却缺少 media、copy、title、description、content、action 等稳定组合槽位和 has-action / has-title 状态。
- 390 x 844 真实无结果基线为 368 x 300px，48px 图标、320px 文案区和 95 x 38px 清除操作均无溢出；本轮不需要重新设计已稳定的空状态骨架。

方法判断：

- Spinner 独立出现时是 `role=status` 且必须有可读名称；嵌入已有名称的 Button、Toast 或 EmptyState 时是 decorative SVG，不制造重复 live region。
- `status` 用于非紧急、礼貌播报的信息，`alert` 只用于重要且时间敏感的文字；两者都不主动移动焦点。
- 带操作的提示将 live region 限定在标题和正文，按钮保持为同级交互元素；这样既能播报问题，也不会把可操作控件误当成 alert 文本。
- 视觉状态与可访问状态分开：tone 控制颜色，live 控制播报优先级，data-state / data-slot 负责组件观察和样式组合。

本轮动作：

- Spinner 改为 forwardRef，导出 SpinnerProps；增加 spinner slot、loading state、decorative state 与 `focusable=false`，默认 CSS 尺寸固定为 16px且允许父组件覆盖。
- Notice 为根、图标、copy、标题、内容和 action 增加稳定 data-slot，并输出 has-action、has-title 与 live-target。
- 带操作的 live Notice 把 alert / status 移到 copy；action 保持同级。自定义非 live role 配合 live 时显式输出 aria-live 和 aria-atomic。
- EmptyState 为根、media、copy、标题、说明和 action 增加稳定 data-slot 与组合状态；说明容器改为 div，安全承载任意 ReactNode。
- Notice 与 EmptyState 增加长字符串断行；600px 以下带操作 Notice 改为两列，action 在文案下方独立占位。

复核结果：

- 390 x 844 测试面板中的四种 Notice 均为 346px 宽；带长地址和“重试”的 danger Notice 高 120.1px，按钮位于文案下方且不在 `role=alert` 内。
- polite Notice 根节点为 status；assertive + action Notice 的 copy 为 alert，根节点无 live role，actionInsideLive 为 false。
- loading EmptyState 为 346 x 300px、`role=status`、`aria-busy=true`；内部 Spinner 为 decorative、aria-hidden 且无独立 role。
- 真实无搜索结果的根节点无 role，copy 为 status；media、copy、title、description、action 槽位完整，点击清除后焦点回到“搜索钱包”。
- SSR 契约验证确认：自定义 region + polite 输出 aria-live 与 aria-atomic；独立 Spinner 输出 `role=status` 和自定义标签。
- 测试面板已移除，页面横向溢出为 0；控制台为 0 error / 0 warning，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第五十八轮基线

参考：

- shadcn Input：https://ui.shadcn.com/docs/components/base/input
- shadcn Textarea：https://ui.shadcn.com/docs/components/base/textarea
- shadcn Checkbox：https://ui.shadcn.com/docs/components/base/checkbox
- shadcn Switch：https://ui.shadcn.com/docs/components/base/switch
- W3C WAI Checkbox Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
- W3C WAI Switch Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/switch/
- MDN disabled attribute：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/disabled

观察：

- Input 已有 ref、invalid 与 disabled 契约，Textarea 却只是一个普通函数；相同字段状态因此无法用同一种方式组合和测试。
- LineTextarea 已有可靠的行号与滚动同步，但根容器不能单独接收 className，也没有稳定的 gutter、lines、line 与 control 插槽。
- Textarea 没有禁用态 CSS；批量输入一旦被业务设置为 disabled，浏览器语义会生效，但视觉仍接近可编辑状态。
- SearchField、Checkbox 与 Switch 的当前操作结构已经可用，不需要更改尺寸；缺口主要是公开 Props、组合状态和内部插槽不统一。
- 原生 checkbox 和 textarea 已覆盖所需语义；继续保留原生控件，比重新实现键盘交互与表单行为更稳妥。

方法判断：

- 同类原子必须共享 ref、disabled、invalid、aria-invalid 和 data-slot 契约；调用方不应因为单行或多行字段而改变组合方式。
- 复合输入的外框状态由根节点承载，真实表单语义仍落在 input 或 textarea；结构插槽只服务于组合、样式和自动化，不替代原生语义。
- Checkbox 的 indeterminate 是独立的原生 DOM 状态；Switch 继续使用 native checkbox 加 role=switch，避免维护第二套焦点与 Space 键逻辑。
- 组件契约升级不应顺带放大控件或改变页面密度；本轮保持现有刷新范围和批量导入的成熟视觉基线。

本轮动作：

- Input 增加 input slot；Textarea 改为 forwardRef，正式导出 TextareaProps，并同步 invalid、disabled、aria-invalid 与数据状态。
- LineTextarea 正式导出 LineTextareaProps，增加 containerClassName、line-count、disabled / invalid 状态及完整结构插槽。
- SearchField 增加 search-field 组件标识、搜索图标与清除按钮插槽，保留清除后回焦输入框的既有行为。
- Checkbox 与 Switch 正式导出 Props；为根、原生控件、标签、状态文本、轨道和滑块补齐稳定插槽与组合状态。
- Textarea 与 LineTextarea 增加明确禁用视觉；Switch 长说明允许在紧凑宽度内安全断行。

复核结果：

- 组件服务端结构契约检查覆盖 10 个关键属性：input / textarea / line-textarea / search / checkbox / switch 插槽、两行计数、mixed 状态与 switch role 均正确输出。
- 390 x 844：批量导入弹窗的 document 与 body 均为 clientWidth 390 / scrollWidth 390；LineTextarea 实际输出 3 行、gutter 和 control 插槽。
- 刷新范围实际输出 14 个 checkbox 与 1 个 switch；原生 checked 状态可切换，关闭弹窗后未应用的修改不会写入配置。
- 1440 x 900 与 390 x 844 的批量输入、刷新范围布局均无文字、控件或底部操作重叠；现有控件尺寸与页面密度未回归。
- TypeScript、Vite 生产构建与 git diff 检查通过。

### 2026-07-22 第五十九轮基线

参考：

- shadcn Item：https://ui.shadcn.com/docs/components/base/item
- shadcn Avatar：https://ui.shadcn.com/docs/components/base/avatar
- shadcn Badge：https://ui.shadcn.com/docs/components/base/badge
- Tailwind Overflow Wrap：https://tailwindcss.com/docs/overflow-wrap
- MDN overflow-wrap：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-wrap
- MDN code element：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/code

观察：

- AssetGroupMark 与钱包编号、链标记同属固定尺寸身份图形，却仍直接渲染 Lucide SVG，没有复用 IdentityMark 的 glyph 层和光学校正。
- AssetGroupMark、AssetGroupLabel、WalletAddressList 和地址详情组件的 Props 没有全部导出，也不能转发 ref；业务原子仍落后于通用 UI 原子的组合契约。
- 紧凑钱包摘要用首尾截断是正确的，但用户主动展开详情后，移动端仍只显示地址前缀；完整地址只能通过复制按钮获取，无法直接逐字符核对。
- 地址详情的类型、标签、代码、配对和操作已经形成稳定内容结构，但缺少可供样式与自动化独立定位的组合插槽。

方法判断：

- 同一类身份图形应共享外框、glyph 和光学校正路径；尺寸差异通过 CSS 变量输入，而不是重新编写 SVG 后代选择器。
- 摘要层优先扫描效率，允许首尾压缩；详情层优先可核验性，技术标识符必须完整显示，并允许长串在容器内安全换行。
- 链上地址继续使用 code 元素和等宽字体；低对比底色只标识“这是可核验的技术值”，不把每个字段重新包装成卡片。
- 业务原子和通用原子遵循同一契约：公开 Props、转发真实 DOM ref、稳定 data-slot，并保留原生 ul/li/code 语义。

本轮动作：

- AssetGroupMark 改为组合 IdentityMark，四档尺寸通过 `--ui-identity-mark-icon-size` 控制；删除独立的 SVG 尺寸选择器。
- AssetGroupMark 与 AssetGroupLabel 改为 forwardRef 并导出 Props；Label 增加 tone、title、根和文本插槽，长名称可通过原生 title 查看。
- WalletAddressList、WalletAddressDetailList 和 WalletAddressDetailItem 全部改为 forwardRef 并导出 Props。
- 地址摘要增加 count / empty / kind 状态与 list、item、kind、value 插槽；键改为 kind + address，避免不同链同值时冲突。
- 地址详情增加 copy、label、value、pairing、actions 插槽；完整地址改为可换行、可全选的低对比 code 条带。

复核结果：

- 390 x 844：EVM 42 字符与 SOL 44 字符地址都在 260px 宽的 code 区显示为两行，高 44.8px；scrollWidth 258px，页面 clientWidth / scrollWidth 均为 390px。
- 1280px 桌面：两条完整地址分别为 317.4px 和 331.9px 宽、27.4px 高，保持单行；配对控件和三个操作按钮无重叠。
- AssetGroupMark 的 xs / sm / md / lg 外框分别为 18 / 30 / 36 / 40px，SVG 分别为 10 / 15 / 17 / 18px；四档可见图标中心都使用 `(1px, 1px)` 光学校正。
- 组件服务端结构契约覆盖 10 个关键属性：身份 mark/glyph、长名称 title、地址数量、紧凑值和详情五个组合槽均正确输出。
- 全新页面会话可正常渲染；TypeScript、Vite 生产构建和 git diff 检查通过。

### 2026-07-22 第六十轮基线

参考：

- tweakcn Dashboard Theme：https://tweakcn.com/editor/theme?p=dashboard
- shadcn Chart：https://ui.shadcn.com/docs/components/base/chart
- shadcn Item：https://ui.shadcn.com/docs/components/base/item
- shadcn Avatar：https://ui.shadcn.com/docs/components/base/avatar
- MDN meter role：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/meter_role
- MDN SVG title：https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/title

观察：

- AssetShareBar、ChainIdentity 和 SnapshotSparkline 已经跨资产组、链表格和移动账本复用，但仍是不可转发 ref 的固定函数，且缺少公开 Props 与稳定业务插槽。
- AssetShareBar 的百分比读数没有稳定宽度；相邻行从 100.0% 切换到 0.4% 时，读数起点会移动，不利于纵向比较。
- ChainIdentity 已复用 IdentityMark，却没有 mark、content、name、meta 级业务契约；超长链名也没有明确的单行收缩边界。
- 只有一条快照时，SnapshotSparkline 把唯一端点画在 `x=4` 的左边缘，视觉上像一条被截断的趋势，而不是“尚未形成趋势”的单点状态。
- 多点折线只有线条和终点，没有方向状态或面积层；下降趋势仍使用品牌绿，颜色语义与旁边的负向变化文案不一致。

方法判断：

- 占比属于有明确 0–100 上下限的静态量，继续使用 meter；可访问名称包含百分比，外部可见读数保持 aria-hidden，避免重复播报。
- 小型趋势不引入完整图表依赖；保留可组合的原生 SVG，并用 title、desc、方向状态和结构插槽提供足够的可访问与测试契约。
- 单点图没有方向，端点应位于图形中心；只有两个及以上有效点时才绘制折线和轻量面积层，避免凭一个点暗示走势。
- 身份原子遵循 mark + content + name + meta 结构；图形尺寸仍由 IdentityMark 负责，业务组件只处理链色、文字收缩和数据标识。
- 数据组件必须对 NaN、Infinity 和无效总数降级为 0 状态，不把无效值泄漏成 `NaN%` 文案或属性。

本轮动作：

- AssetShareBar 改为 forwardRef 并导出 AssetShareBarProps；增加自定义 label、empty / partial / full 状态、归一化 share 数据、根与读数插槽。
- 百分比读数增加 4ch 稳定列宽；meter 保留完整可访问名称，小于 0.1% 的有效份额继续使用最小可见线段。
- ChainIdentity 改为 forwardRef 并导出 ChainIdentityProps；支持替换 icon，增加 chain、tone、mark、content、name、meta 契约与原生 title。
- 链名称和元数据增加单行省略边界，IdentityMark 的 38px 外框、20px glyph 和既有光学校正保持不变。
- SnapshotSparkline 改为 forwardRef；增加自定义可访问标题/说明、外部 aria-label / aria-labelledby 支持，以及 chart、guide、area、line、endpoint 插槽。
- 单点横坐标从 4 调整为 84；多点状态增加轻量面积层和 unknown / flat / up / down 方向，下降与持平分别使用风险色和中性色。

复核结果：

- 服务端结构契约覆盖 13 个关键属性：占比根/状态/小额文案/异常值、链 content/tone、单点中心/状态、多点方向/面积/折线和外部 SVG 标签均正确输出。
- 1280 x 800：链身份块为 196.27 x 38px，mark 为 38px、glyph 为 20px，光学中心继续相对外框为 `(1px, 1px)`；占比组件为 121.52 x 13px。
- 单点图为 168 x 44px，端点中心相对图表中心偏差为 `(0px, 0px)`；可访问快照继续读出“总资产历史起点”和完整说明。
- 390 x 844 与 320 x 780 的 document / body clientWidth 与 scrollWidth 分别完全相等；320px 下四个可见占比组件宽 83–89px，无金额、读数或持仓碰撞。
- 全新浏览器会话为 0 error / 0 warning；TypeScript、Vite 生产构建和 git diff 检查通过。

### 2026-07-22 第六十一轮基线

参考：

- shadcn Avatar：https://ui.shadcn.com/docs/components/base/avatar
- shadcn Item：https://ui.shadcn.com/docs/components/base/item
- tweakcn Dashboard Theme：https://tweakcn.com/editor/theme?p=dashboard
- MDN img：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img
- MDN object-fit：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/object-fit
- WAI Decorative Images：https://www.w3.org/WAI/tutorials/images/decorative/

观察：

- TokenIcon、TokenHoldingList、图标地址表和回退生成器都留在 App.tsx，代币身份没有形成可独立复核的业务原子。
- 代币图片使用 cover；当上游图片不是正方形或带有安全留白时会被裁切，图形视觉中心无法保持稳定。
- 远程图片失败后虽然会切换回退图，但 symbol 或 iconUrl 更新时失败状态不会复位；无效数值也可能泄漏为 NaN 或 Infinity。
- 钱包编号和链图标已经通过 Grid 居中，IdentityMark 却又统一叠加 translate(1px, 1px)；用户真实复核仍认为偏位，几何测量也证明内容中心没有与外框中心重合。

方法判断：

- 代币身份采用 image + deterministic fallback 组合；远程图片加载失败时切换本地生成图，身份变化时恢复首选来源。
- 相邻文字已经提供币种名称，因此图片使用空 alt，避免屏幕阅读器重复播报同一个身份。
- 代币图片使用 contain 保留完整图形和宽高比；回退图采用纯色圆形、内描边和居中缩写，不使用装饰渐变。
- 钱包、链和资产组的固定尺寸身份图形只使用一次 Grid 几何居中。全局经验位移不能覆盖所有数字、SVG 和视口，除非有单个图形的可复现像素证据，否则不再叠加光学校正。

本轮动作：

- 新增 TokenIdentity 业务原子，集中图标来源、币种标准化、生成回退、TokenIcon 和 TokenHoldingList。
- TokenIcon 增加 sm / md 尺寸、ready / fallback 状态、remote / generated 来源、稳定 data-slot、错误回调和身份变化复位。
- TokenHoldingList 继续组合 HoldingList / HoldingItem，增加 token 数量、币种标识、完整 title 和无效数值归零。
- 代币图片从 cover 改为 contain；远程来源失败时使用无渐变的本地圆形图标。
- 删除 IdentityMark 的全局 x/y 位移变量和 transform，让钱包文字、链 SVG、资产组 SVG 的 glyph 中心与外框中心直接重合。

复核结果：

- 1280px 桌面：4 个链标记为 38 x 38px、SVG 为 20 x 20px，glyph 与 SVG 相对外框中心偏差均为 (0px, 0px)；16 个钱包编号的 glyph 偏差全部为 (0px, 0px)。
- 390 x 844：4 个链标记为 40 x 40px，SVG 中心偏差全部为 (0px, 0px)；6 个首屏钱包编号的文字横向中心偏差为 0，页面 clientWidth / scrollWidth 均为 390px。
- 桌面与移动端 4 个可见代币图标均为 40 x 40px 外框、38 x 38px 图片，图片中心偏差为 (0px, 0px)，object-fit 为 contain，远程图片全部完整加载。
- 服务端结构契约覆盖 12 个关键属性：图标尺寸、状态、来源、空 alt、列表计数、币种标识、异常数值归零和纯色回退图均正确输出。
- TypeScript、Vite 生产构建和 git diff 检查通过。

### 2026-07-22 第六十二轮基线

参考：

- shadcn Item：https://ui.shadcn.com/docs/components/base/item
- shadcn Badge：https://ui.shadcn.com/docs/components/base/badge
- Tailwind Text Overflow：https://tailwindcss.com/docs/text-overflow
- MDN ul：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ul
- MDN code：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/code

观察：

- 币种表格和移动账本各自重复拼装链分布与合约，共有四段几乎相同的 div / span / code JSX。
- 链与合约属于无顺序的同类项目集合，旧实现却没有 list / listitem 语义、可访问名称或稳定业务插槽。
- 链最多显示 4 条、合约最多显示 3 个，旧实现直接 slice；用户无法判断是否还有数据被隐藏。
- 合约视觉上只显示首尾缩写，完整地址没有进入可访问名称；(native) 也没有说明它代表原生代币而不是缺失数据。
- 1280px 基线中 ETH 的 3 条链分布在 179.66px 列内占 84px 高；390px 中同一内容有 344px 可用宽度，但两种视图仍由不同 JSX 维护。

方法判断：

- 同类、无排序含义的元数据使用 ul / li；CSS 负责取消项目符号和实现紧凑换行，不用无语义 div 模拟列表。
- 元数据条目采用 label + value 组合，分隔线属于装饰样式；金额继续通过文本表达，不依赖颜色区分。
- 技术标识符使用 code 语义和等宽字体；界面可显示首尾缩写，但完整地址必须保留在 title 与可访问名称中。
- 显示上限是信息密度策略，不是数据删除；超过上限必须显示 +N，并在属性和可访问名称中说明隐藏数量。
- 风险状态使用 Lucide 图标、文字和警示色三重表达；不使用 emoji，也不把静态状态做成伪按钮。

本轮动作：

- 新增 MetadataList 与 MetadataItem 原子，支持 empty、default、code、overflow、warning、icon、label 和 value 组合。
- 新增 TokenChainBreakdownList 与 TokenContractList，集中金额格式化、地址缩写、去重、上限、溢出计数和风险状态。
- 桌面币种表格和移动 LedgerDetail 全部改用同一业务组件，删除旧 breakdown / contracts 样式与 shortAddress 页面工具函数。
- 链条目把名称与金额分为两个稳定槽；合约条目保留 code 语义，完整地址进入 title 和 aria-label；原生代币使用明确说明。

复核结果：

- 真实桌面数据输出 8 个可见 ul；每个根都有链分布或合约名称，子项全部为 li，完整 EVM 合约地址进入 code 可访问名称。
- 1280px：链和合约列宽约 179.67px，所有条目 scrollWidth 均不超过 clientWidth；ETH 三条链仍保持 84px 稳定行高。
- 390 x 844：元数据列表宽 344px，ETH 三条链在同一行完整显示，页面 clientWidth / scrollWidth 均为 390px。
- 320 x 780：列表宽 274px，ETH 三条链自然换成两行、总高 54px；所有条目右边界不超过 297px，document 与 body scrollWidth 均为 320px。
- 服务端结构契约覆盖 15 项：ul / li、列表名称、实际数量、+N、风险数、warning 状态、完整地址、空状态和异常金额归零均正确输出。
- TypeScript、Vite 生产构建和 git diff 检查通过。

### 2026-07-22 第六十三轮基线

参考：

- shadcn Item：https://ui.shadcn.com/docs/components/base/item
- Tailwind White Space：https://tailwindcss.com/docs/white-space
- Tailwind Text Overflow：https://tailwindcss.com/docs/text-overflow
- MDN dl：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dl
- MDN white-space：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/white-space

观察：

- 320px 移动端中，VIRTUAL 的 `89.07836576` 与 USDT 的 `199.0957225` 会把最后一位单独换到第二行，账本事实区因此出现不一致的行高。
- 事实区本质是键值元数据，但数字和文本共用 `overflow-wrap: anywhere`；状态文字需要自然换行，数值则需要保持扫描连续性。
- LedgerItem 内部直接拼装 dl，金额、事实和详情没有完整稳定插槽，也无法单独复用事实网格。

方法判断：

- 事实区继续使用 dl / dt / dd，保留描述列表语义；每个术语与定义组使用 div 包裹，便于稳定布局。
- 数值事实使用等宽数字、单行省略和完整 title；文本事实继续允许自然换行，不用同一溢出策略处理两类内容。
- 复用边界放在 LedgerFactGrid，而不是把每个事实做成独立卡片；紧凑账本只需要一个稳定的事实网格原子。

本轮动作：

- 新增 LedgerFactGrid 与 LedgerFactValueKind，支持 1–3 列、number / text 类型、完整 title 和稳定根、条目、标签、值插槽。
- LedgerItem 的金额、事实与详情改用稳定插槽；LedgerDetail 改为 forwardRef，补齐根、标签和内容结构。
- 钱包、链、币种和资产组中的所有数值事实显式标注为 number；数值采用 IBM Plex Mono、tabular nums、nowrap 与 ellipsis。

复核结果：

- 320 x 780：四个可见事实网格均为 274px 宽、50.84px 高；所有数值为单行，完整值保留在 title，document / body 均无横向溢出。
- 服务端结构契约覆盖事实根、数量、类型、完整值、详情内容和账本组合等关键属性。
- TypeScript、Vite 生产构建和 git diff 检查通过。

### 2026-07-22 第六十四轮基线

参考：

- MDN align-items：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/align-items
- MDN justify-content：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/justify-content
- MDN position：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position
- MDN translate：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/transform-function/translate

观察：

- 钱包编号和链 SVG 的边界盒虽已几何居中，但普通网格流仍让字体行盒、SVG 留白和亚像素栅格共同参与视觉结果，实际观察仍有偏左上的重心感。
- 钱包文字与链图标的视觉重量不同，不能重新引入一个覆盖所有 IdentityMark 使用方的全局经验位移。
- 资产组图标同样复用 IdentityMark，居中机制调整必须确保它不被钱包和链的局部光学校正带偏。

方法判断：

- IdentityMark 外层只负责固定尺寸和定位上下文；glyph 使用 absolute + inset: 0 铺满，再由 flex 的双轴 center 提供稳定几何中心。
- SVG 作为不参与基线的固定尺寸 flex item；字体恢复自身 line-height，避免图标与文字共用同一种行盒。
- 光学校正必须限定在有实际观察依据的业务标记上，并通过 CSS 变量输入：链为 `(0.5px, 0.5px)`，钱包文字为 `(0.5px, 1px)`；资产组保持 `(0px, 0px)`。

本轮动作：

- IdentityMark 从双层 grid 改为 relative inline-flex + absolute glyph；glyph 使用 flex 双轴居中、line-height: 0 和中心 transform-origin。
- 链 SVG 设置为固定 flex item，消除基线和自动收缩；钱包文字保留独立 line-height。
- 为 wallet-badge 与 chain-badge 增加局部视觉重心变量，不影响 TokenIcon、AssetGroupMark 和其他图标原子。

复核结果：

- 320 x 780：链列表的 4 个 40px 标记内，20px SVG 均使用 `(0.5px, 0.5px)` 局部校正；钱包编号在 40px 标记内使用 `(0.5px, 1px)`，视觉上不再贴近左上。
- 1280 x 720：4 个桌面链标记与钱包标记均保持固定尺寸和一致中心；资产组标记继续为 `(0px, 0px)`，页面 clientWidth / scrollWidth 为 `1280 / 1280`。
- 浏览器没有 error；组件服务端结构契约 10 / 10、TypeScript、Vite 生产构建和 git diff 检查通过。

### 2026-07-22 第六十五轮基线

参考：

- shadcn Sidebar：https://ui.shadcn.com/docs/components/base/sidebar
- shadcn Item：https://ui.shadcn.com/docs/components/base/item
- shadcn Field：https://ui.shadcn.com/docs/components/base/field
- shadcn Button Group：https://ui.shadcn.com/docs/components/base/button-group
- Tailwind Hover / Focus States：https://tailwindcss.com/docs/hover-focus-and-other-states
- React useId：https://react.dev/reference/react/useId
- MDN nav：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/nav

观察：

- AssetGroupManager 是业务组件中唯一没有公开 Props、forwardRef 和稳定根契约的组合件，却同时承担选择、计数、编辑、删除和新增。
- 折叠面板使用固定 `asset-group-manager-panel` ID；如果页面出现两个实例，trigger 的 aria-controls 会指向重复 ID。
- 资产组导航直接在 nav 下放置 Button 和 div，没有 ul / li 菜单结构；侧栏也没有明确拆分可滚动 content 与新增 footer。
- 资产组、钱包名称和地址标签三处编辑各自拼装输入和保存按钮；保存路径不一致，触屏用户都没有可见取消动作。
- 首次接入统一编辑器后，320px 钱包行仍把名称编辑器压到 98px、输入框仅 27px，说明移动表格的操作列必须在编辑态让位。

方法判断：

- Sidebar 采用 header / scrollable content / footer 结构；导航项继续保持紧凑，但新增入口不随长列表滚走。
- 菜单主按钮、计数和操作按钮属于同一 li 的不同角色；主选择保持 aria-current，编辑/删除动作使用带名称的 `role=group`。
- 内联编辑是一段短生命周期表单：Enter 提交，Escape 和可见取消按钮都应退出；保存与取消用 Lucide 图标，不把删除等无关动作留在编辑态。
- 关联 trigger 与 panel 的 ID 使用 React useId；业务 slot 必须允许穿过 Badge、Input 和 Radix Collapsible 等底层原子。
- 移动钱包行在编辑态隐藏行级操作并让名称单元跨到操作列，优先保证输入，不用进一步缩小按钮或文字。

本轮动作：

- 新增 InlineEdit 原子，包含 form、Input、带 role=group 的保存/取消动作、Enter 提交、Escape 取消、公开 Props、forwardRef 和完整 slots。
- 资产组名称、钱包名称、地址标签三处统一接入 InlineEdit；编辑期间隐藏删除、展开等无关动作，取消后恢复原值和原操作。
- AssetGroupManager 改为 forwardRef 并导出 Props；使用 useId 连接 trigger / panel，补齐根、header、trigger、content、nav、list、item、select、count、actions 和 footer 契约。
- 资产组导航改为 nav > ul > li；内容区独立滚动，新增资产组表单成为 footer，侧栏最大高度受视口约束。
- Badge、Input、Collapsible Root / Trigger / Content 支持调用方覆盖 data-slot；默认插槽保持兼容。
- 移动钱包行增加 editing 状态：名称单元跨列、行级操作隐藏，保存/取消后恢复常规布局。

复核结果：

- 320 x 780：资产组编辑器宽 220px，输入区 149px；钱包名称输入区从 27px 提升到 117px；地址标签输入区 119px，三处页面 clientWidth / scrollWidth 均为 320 / 320。
- Escape 可退出资产组编辑；将名称改为“临时名称”后点击取消会恢复 `OKX Boost`，未触发持久化。
- 390 x 844：资产组侧栏为 370 x 424px，nav 和 footer 分区稳定；trigger / panel 的 controls 与 labelledby 一一对应，6 个直接子项全部为 li。
- 1280 x 720：260px 侧栏编辑输入区 115px，nav 为 overflow-y: auto，footer 保持可见；页面 clientWidth / scrollWidth 为 1280 / 1280。
- 服务端结构契约 21 / 21，覆盖 InlineEdit slots、按钮类型、动作组、两个管理器的唯一 ID、nav / ul / li 和 footer；TypeScript、Vite 生产构建与 git diff 检查通过。

### 2026-07-22 第六十六轮基线

参考：

- shadcn Collapsible：https://ui.shadcn.com/docs/components/base/collapsible
- WAI-ARIA Disclosure Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- MDN details：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details
- Tailwind Responsive Design：https://tailwindcss.com/docs/responsive-design

观察：

- 320 x 780 的概览页中，刷新质量完整面板位于资产账本之前，资产视图入口被推到页面约 1115px；用户必须先越过 350px 的诊断面板才能开始查看持仓。
- 资产摘要已经同时给出最后刷新时间和有效钱包覆盖缺口，刷新质量属于可追溯的二级诊断，不应重复占据主任务之前的阅读顺序。
- 桌面资产账本把 tabpanel 和资产组账本都固定为最小 500px；真实内容只到约 252px，剩余区域成为空白并继续把诊断面板推到首屏之外。
- RefreshHealth 使用固定标题 ID 且没有公开 Props、forwardRef 或业务插槽，多实例复用时存在重复 ID 风险。

方法判断：

- DOM 阅读顺序服从主要任务：资产摘要之后立即进入资产账本，刷新质量放在账本之后；不能只用 CSS order 改视觉顺序而保留错误的键盘和读屏顺序。
- Disclosure 适用于用户按需展开的附加信息，但资产账本本身不是附加信息；本轮不为修复层级而引入折叠状态，避免把主要任务藏起来或复制桌面/移动 DOM。
- 数据账本可以设置较小的最低高度来减轻视图切换跳动，但最低高度不能远高于真实内容；数据超过基线时继续按内容自然增长。
- 组合业务组件遵循与原子相同的公开契约：forwardRef、可继承 section 属性、唯一 useId 标题关联、稳定 data-slot 和可观测 data-quality 状态。

本轮动作：

- 概览 DOM 调整为 PortfolioSummary → Tabs 资产账本 → RefreshHealth，完整诊断数据仍保留且不做视觉隐藏。
- 移动资产摘要收紧 padding、总资产字号和区块间距，总高从 419px 降到 385px，不删除任何资产事实。
- 桌面 overview-content 从 560px 降到 370px，tabpanel 与 asset-group-ledger 从 500px 降到 300px；链、币种等内容较多的视图继续自然增高。
- RefreshHealth 改为公开 forwardRef 组件，导出 RefreshCounts 与 RefreshHealthProps；使用 useId 连接内部标题，允许外部 aria-label / aria-labelledby 覆盖，并补齐 overview、distribution、trend 插槽和 quality 状态。

复核结果：

- 320 x 780：资产工具栏从约 1098px 前移到 702px，底部为 771px，完整进入首屏；资产账本从 771px 开始露出，document / viewport 宽度为 320 / 320。
- 390 x 844 钱包管理：页面无横向溢出；抽样 17px、10px 链图标相对 36px、18px IdentityMark 的几何中心偏差均为 `(0px, 0px)`。
- 1280 x 720：资产账本总高由 571px 收束到 371px，刷新质量从 903px 前移到 703px；资产组、链、币种和钱包四个 tabpanel 分别为 300px、382px、334.5px、300px，全部按内容正确增长。
- RefreshHealth 服务端结构契约 8 / 8，覆盖根和三个区域插槽、partial 状态、className 与外部可访问名称；TypeScript、Vite 生产构建和 git diff 检查通过。

### 2026-07-22 第六十七轮基线

参考：

- shadcn Data Table：https://ui.shadcn.com/docs/components/base/data-table
- shadcn Badge：https://ui.shadcn.com/docs/components/base/badge
- React useId：https://react.dev/reference/react/useId
- React forwardRef：https://react.dev/reference/react/forwardRef
- MDN aria-labelledby：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-labelledby

观察：

- 钱包批量选择初看像是缺少持续操作上下文，但代码和滚动验证显示选择条已经 sticky，Checkbox 也已有 28px 点击层、混合态、焦点环和禁用态；不能仅凭截图重复实现已有组件。
- PortfolioSummary、ChainExposure 和 StatusBadge 是当前高频组件中仍未公开 Props 或未转发 ref 的少数组件，调用方不能稳定挂载行为、测试选择器或自定义 section 属性。
- ChainExposure 使用固定 `chain-allocation-title`，单实例没有问题，但同页复用会产生重复 ID，aria-labelledby 也无法由外部命名接管。
- 摘要、链分布和状态徽标已有成熟视觉，不需要为了组件化再改变配色、尺寸或布局。

方法判断：

- 组件审计先验证 DOM、计算尺寸和交互状态，再决定是否修改；存在实现证据时取消原假设，避免把重构当作产出指标。
- React 18 组件继续沿用当前 forwardRef 约定，让调用方获得真实根节点；公开 Props 继承对应 HTML 元素属性，并排除组件不接受的 children。
- 组件内部关联使用 useId；如果调用方传入 aria-label 或 aria-labelledby，内部默认命名应让位，不能同时制造多个竞争名称。
- data-slot 表达结构角色，data-state / data-status / data-coverage 表达有限状态；业务数据使用独立 data 属性，不把状态编码进 className。

本轮动作：

- StatusBadge 导出 StatusBadgeStatus 与 StatusBadgeProps，改为 forwardRef，并默认使用 status-badge 插槽；调用方仍可覆盖 data-slot。
- PortfolioSummary 导出 Props 并改为 forwardRef；根支持 className、section 属性和 data-slot，新增 empty / partial / complete 覆盖状态及 total、valuation、facts、fact 等稳定区域插槽。
- ChainExposure 导出 Props 并改为 forwardRef；固定标题 ID 改为 useId，外部 aria-label / aria-labelledby 可覆盖默认标题关联，新增 chain-count 和 heading、title、summary 插槽。
- 保持现有 CSS 不变，仅增强组件契约和可观察结构。

复核结果：

- 服务端组件契约 18 / 18：两个 ChainExposure 实例的标题与 labelledby ID 各自唯一且一一对应，外部 aria-label 正确接管命名。
- 390 x 844：链分布保持 368 x 134.5px，摘要保持 370 x 385px，coverage 为 partial，标题 ID 与 labelledby 一致，页面无横向溢出。
- 1280 x 720：摘要保持 1248 x 158.5px，三个 fact 插槽完整；钱包管理页 16 个状态徽标全部输出 status-badge 与 skipped 状态，页面无横向溢出。
- TypeScript、Vite 生产构建和 git diff 检查通过。

### 2026-07-22 第六十八轮基线

参考：

- shadcn Progress：https://ui.shadcn.com/docs/components/base/progress
- shadcn Chart：https://ui.shadcn.com/docs/components/base/chart
- Tailwind Data Attributes：https://tailwindcss.com/docs/hover-focus-and-other-states#data-attributes
- MDN data attributes：https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/Use_data_attributes

观察：

- DataBar 和 Legend 已有默认结构插槽，但调用方不能稳定覆盖，业务组件只能依赖通用 data-bar、legend-list 选择器。
- Meter 与 Segment 的空值通过 data-empty 表达，却没有 partial / full 有限状态，自动化无法直接区分正常占比和满值。
- PortfolioSummary、ChainExposure 与 RefreshHealth 都需要可追踪的业务插槽，同时必须保持现有视觉和可访问语义。

方法判断：

- 原子组件保留稳定默认 slot，并允许业务组件传入更具体的 slot；结构角色与业务角色都不编码进 className。
- 连续数值先限制到合法范围，再映射为 empty / partial / full 有限状态；data-empty 继续保留为兼容信号。
- 分布图使用 role=img 与图例关联，进度值使用 role=meter；状态增强不改变原有标签和值文本。

本轮动作：

- MeterBar、DistributionBar、BarSegment、LegendList 与 LegendItem 支持调用方覆盖 data-slot。
- MeterBar 与 BarSegment 增加 empty / partial / full 的 data-state，并统一在钳制后的数值上计算状态。
- 资产构成、链分布、刷新覆盖率、图例和资产占比增加独立业务插槽。

复核结果：

- 服务端数据可视化契约 20 / 20，覆盖自定义插槽、空值、部分值、满值、越界钳制和三个业务组件。
- 390 x 844：摘要保持 370 x 385px，链分布条宽 344px，刷新覆盖率为 partial，页面无横向溢出。
- TypeScript、Vite 生产构建和 git diff 检查通过。

### 2026-07-22 第六十九轮基线

参考：

- MDN place-items：https://developer.mozilla.org/en-US/docs/Web/CSS/place-items
- MDN CSS grid layout：https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout
- Lucide accessibility guide：https://lucide.dev/guide/advanced/accessibility

观察：

- 钱包编号和链 SVG 共用 IdentityMark，但第六十四轮为钱包增加 `(0.5px, 1px)`、为链增加 `(0.5px, 0.5px)` 的人工光学位移。
- 用户实际观察仍认为标记内容偏向左上；人工经验值既不能证明正中，也会在整数尺寸容器中制造亚像素位置。
- 资产组图标没有额外位移且保持居中，说明问题应在 IdentityMark 的统一几何模型和两类局部变量中解决。

方法判断：

- 本轮废止第六十四轮的钱包与链光学位移，以可重复测量的容器中心和内容中心重合为验收标准。
- IdentityMark 外层与 glyph 都使用 grid 的双轴 place-items: center；glyph 铺满容器，SVG 固定占据同一网格单元。
- 钱包文字和链 SVG 使用同一几何规则，不再为业务类型维护不可验证的像素偏移。

本轮动作：

- 移除 wallet-badge 和 chain-badge 的 optical-x / optical-y 变量。
- IdentityMark 与 glyph 改为全尺寸 grid 居中；SVG 显式使用中心网格单元并保持固定尺寸。
- 保留文字独立 line-height、SVG line-height: 0 和不可交互 glyph 层，不改变徽标尺寸、颜色或页面布局。

复核结果：

- 390 x 844：前 8 个可见钱包徽标的横纵中心偏差全部为 `(0px, 0px)`，页面 clientWidth / scrollWidth 为 `390 / 390`。
- 390 x 844：4 个可见链徽标中 20px SVG 相对 40px 标记的横纵中心偏差全部为 `(0px, 0px)`。
- 1280 x 720：4 个链徽标与前 10 个钱包徽标的中心偏差全部为 `(0px, 0px)`，页面 clientWidth / scrollWidth 为 `1280 / 1280`。

### 2026-07-22 第七十轮基线

参考：

- shadcn Input Group：https://ui.shadcn.com/docs/components/radix/input-group
- MDN KeyboardEvent.key：https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
- WAI-ARIA aria-keyshortcuts：https://www.w3.org/TR/wai-aria-1.3/#aria-keyshortcuts
- WAI Keyboard Interface：https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/

观察：

- 搜索框已有稳定的 control / addon / clear 组合，复选框、选择器、字段和开关也已有完整尺寸与状态，不应为了轮次重复改写成熟原子。
- 历史文档曾记录 SearchField 可用 Escape 清空，但当前组件和两个业务入口都没有对应键盘处理；实测按下 Escape 后查询值仍保留，文档与运行状态不一致。
- 当前应用的桌面和移动搜索都属于高频过滤操作；鼠标用户有清除按钮，键盘用户却必须选中并删除全部文本。

方法判断：

- Input Group 的 DOM 保持 control 在 addon 之前，通过 CSS 调整视觉位置，确保焦点顺序仍按实际控件排列。
- Escape 只在搜索有值、存在 onClear 且控件未禁用时成为可用命令；空值时继续向父级传播，使弹窗等上层界面仍可处理 Escape。
- 先调用业务传入的 onKeyDown，并尊重 preventDefault；输入法处于 composition 时不清空，避免中文组字被误当成取消搜索。
- aria-keyshortcuts 只暴露已经由脚本真实实现的快捷键；如果调用方还有其他快捷键，合并并去重而不是覆盖。

本轮动作：

- SearchField 在有效状态下处理 Escape：阻止重复默认行为、停止向父级传播、调用 onClear，并在下一帧把焦点保留在搜索输入。
- 输入法组字、禁用、空值、无 onClear 和调用方已处理事件全部跳过内部清空路径。
- 根 data-slot 支持业务覆盖；输入框按动作可用状态动态增加或移除 aria-keyshortcuts="Escape"。

复核结果：

- 修复前实测：输入 `wallet-search-audit` 后按 Escape，值仍存在、清除按钮仍显示；修复后值变为空、焦点保留、清除按钮消失。
- 有值时快捷键属性为 Escape，清空后属性移除；服务端结构契约 11 / 11，覆盖业务 slot、合并快捷键、空值和禁用状态。
- 390 x 844：搜索根为 278 x 42px、输入区 208px，清空后页面 clientWidth / scrollWidth 为 `390 / 390`。
- 1280 x 720：钱包搜索保持 40px 高，页面 clientWidth / scrollWidth 为 `1280 / 1280`；TypeScript、Vite 生产构建和 git diff 检查通过。

### 2026-07-22 第七十一轮基线

参考：

- shadcn Skeleton：https://ui.shadcn.com/docs/components/radix/skeleton
- Tailwind Animation：https://tailwindcss.com/docs/animation
- WAI-ARIA aria-busy：https://www.w3.org/TR/wai-aria/#aria-busy

观察：

- 移动端导入 Dialog 已具备底部抽屉布局、固定 footer、正确初始焦点和无溢出 textarea；排序 Select 的触发器、选项尺寸和选中态也已完整，本轮没有为了统一轮次重写成熟组件。
- 首次读取资产时，账本区域会显示加载状态，但 PortfolioSummary 仍以未完成的数据渲染 `$0`、`0 个钱包`和 `--` 时间；这些占位值看起来像真实资产结果。
- 顶部“重新载入”按钮没有绑定 loading，用户无法确认请求是否正在执行，也可以在请求期间重复触发。
- 手动重新载入时已有旧快照可用；如果重新显示整块骨架，会把有效数据替换成占位内容并制造不必要的页面闪烁。

方法判断：

- Skeleton 只用于没有旧数据的首次读取，并严格复用最终 PortfolioSummary 的三段网格和响应式尺寸；它表达几何占位，不表达业务数据。
- 骨架元素统一 `aria-hidden=true`，真实加载公告继续由账本 EmptyState 提供，避免读屏重复播报大量无意义占位块。
- 手动重新载入保留现有摘要和账本，只让触发按钮进入 loading、disabled、aria-busy 状态；请求完成后继续原位更新快照。
- 骨架使用低对比度 pulse，系统 reduced-motion 设置会禁用持续动画；暗色总资产区使用半透明白色占位，其余区域使用中性灰绿色。

本轮动作：

- 新增公开 Skeleton 原子，支持 forwardRef、className、HTML 属性和调用方 data-slot，固定输出 loading 状态及装饰性语义。
- 新增 PortfolioSummarySkeleton，保留 total、valuation、facts 三段结构和 19 个细粒度占位块，并公开稳定根插槽。
- 概览页仅在 `loading && !snapshot` 时渲染摘要骨架；已有快照的重新载入不会替换真实资产数据。
- “重新载入”按钮绑定 loading 和明确的加载名称，复用 Button 现有 Spinner、aria-busy、禁用及状态契约。

复核结果：

- 暂时延迟本地数据接口后捕获到真实初始状态：重新载入按钮输出 spinner、`aria-busy=true`、disabled、`data-status=loading` 和“正在重新载入资产数据”可访问名称。
- 390 x 844：骨架总宽高为 370 x 385px，与最终摘要完全一致；total / valuation / facts 分别为 136px、157px、90px，页面 clientWidth / scrollWidth 为 `390 / 390`。
- 1280 x 720：骨架为 1248 x 158px，最终摘要约为 1248 x 158.5px；三列宽度保持 334.7px、539.3px、371.9px，页面 clientWidth / scrollWidth 为 `1280 / 1280`。
- 服务端结构契约 14 / 14，覆盖 Skeleton 原子、摘要骨架层级、19 个占位块和 Button 加载语义；TypeScript、Vite 生产构建与 git diff 检查通过。

### 2026-07-22 第七十二轮基线

参考：

- shadcn Button：https://ui.shadcn.com/docs/components/radix/button
- shadcn Tooltip：https://ui.shadcn.com/docs/components/base/tooltip
- MDN Clipboard writeText：https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
- WAI role=status：https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22.html
- Tailwind Data Attributes：https://tailwindcss.com/docs/hover-focus-and-other-states#data-attributes
- Tailwind Transition Duration：https://tailwindcss.com/docs/transition-duration

观察：

- 钱包地址详情的复制按钮直接执行 `navigator.clipboard.writeText`，没有等待 Promise、捕获权限错误或呈现成功状态；实测点击后按钮和页面都没有反馈。
- Clipboard writeText 只在安全上下文可用，并可能因权限返回 NotAllowedError；忽略 Promise 会把失败表现成“已经复制”。
- 复制属于频繁、短暂且局部的微命令；使用全局长时 toast 会让反馈远离触发点，并可能与读屏状态播报重复。
- 地址行已经有紧凑的编辑、复制、删除动作组，复制反馈不能改变 34px / 38px 按钮尺寸或推动相邻命令。

方法判断：

- CopyButton 复用 IconButton 的尺寸、Tooltip、focus 和 disabled 契约，只新增 idle / copying / copied / error 四态，不把 Clipboard 业务塞回通用按钮。
- 按钮的可访问名称稳定保留为“复制地址”；视觉图标与 Tooltip 可以随状态变化，成功和失败文本由预先存在的 `role=status`、`aria-atomic=true` 容器礼貌播报。
- Promise 未完成时使用 Spinner、aria-busy 与保持可聚焦的 aria-disabled；成功使用 Lucide Check 与绿色确认面，失败使用 CircleX 与红色错误面，1.8 秒后自动复位。
- 组件用 operation token 忽略文本变化或卸载后的旧 Promise，并清理复位定时器，避免异步结果写入错误地址按钮。
- copied / error 通过有限 `data-state` 暴露；160ms 图标进入动画遵循全局 reduced-motion 规则。

本轮动作：

- 新增 CopyButton 原子和可单测的 writeClipboardText helper；支持自定义标签、状态文案、复位时间、回调、尺寸、变体、ref 与业务 data-slot。
- 地址详情移除直接 Clipboard 调用，统一接入 CopyButton；不增加占空间的正文或全局通知。
- 增加复制成功和失败状态色、图标进入动效；复制图标、Check 和 CircleX 全部来自 Lucide。

复核结果：

- 真实 Clipboard 成功路径：按钮从 idle 进入 copied，状态区输出“地址已复制”，1.8 秒后恢复 idle 并清空状态文本。
- 1280 x 720：按钮在状态变化前后均为 34 x 34px，地址详情动作组和表格没有位移，页面 clientWidth / scrollWidth 为 `1280 / 1280`。
- 390 x 844：按钮在状态变化前后均为 38 x 38px，地址详情行为 308px、操作区 260px，页面 clientWidth / scrollWidth 为 `390 / 390`。
- copied 状态的 16px Check 相对 38px 按钮中心偏差为 `(0px, 0px)`；焦点不因图标替换而迁移。
- 服务端与 helper 契约 14 / 14，覆盖成功写入、权限拒绝、Clipboard API 缺失、业务插槽、稳定名称、初始状态和预置 status live region；TypeScript、Vite 生产构建与 git diff 检查通过。

### 2026-07-22 第七十三轮基线

参考：

- shadcn Button：https://ui.shadcn.com/docs/components/radix/button
- MDN HTML anchor download：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a
- MDN File API object URL：https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications
- MDN URL.revokeObjectURL：https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static
- Tailwind Data Attributes：https://tailwindcss.com/docs/hover-focus-and-other-states#data-attributes
- Tailwind Transition Delay：https://tailwindcss.com/docs/transition-delay

观察：

- 资产快照导出使用未挂载到文档的临时 anchor，并在 click 后立即回收 object URL；浏览器完成读取前就释放资源存在竞态。
- 导出没有 pending、success、error 或状态播报，用户点击后无法判断文件是否已开始生成；自动化等待 download 事件也没有收到可用回执。
- 复制与下载都是短时异步图标命令，状态、焦点、复位和错误处理规则相同，但业务图标、状态名和 live-region 插槽不同。
- React 组件文件同时导出工具函数会触发 Vite Fast Refresh 不兼容警告，纯逻辑需要保持在组件模块之外。

方法判断：

- AsyncIconButton 只管理 idle / pending / success / error、operation token、定时复位和可访问播报；复制和下载仍由各自组件定义动作、图标、文案与业务状态名。
- 下载动作必须在原始 click 调用栈内同步启动，保留浏览器 user activation；临时 anchor 先挂载到 body，click 后移除节点，并延迟 1 秒回收 object URL。
- pending 使用 aria-busy 与保持焦点的 aria-disabled，不使用会让焦点消失的原生 disabled；按钮可访问名称和外框尺寸始终稳定。
- 文件名使用快照 generatedAt 的可读 UTC 时间，不使用执行时的毫秒整数；真实文件落盘和 JSON 可解析证据优先于按钮颜色或自动化事件。
- 纯 Clipboard 与 Blob 下载 helper 独立成无 React 导出的模块，避免 Fast Refresh 把工具导出误判为组件边界。

本轮动作：

- 新增 AsyncIconButton 基础原子，统一 Spinner、Check、CircleX、aria-busy、aria-disabled、状态插槽、回调、复位时间和有限 data-action-state。
- CopyButton 迁移到 AsyncIconButton，保留 copying / copied 业务状态、copy-button / copy-status 插槽和原有 1.8 秒反馈契约。
- 新增 DownloadButton 和 Blob 下载 helper；资产总览导出改用可读文件名、DOM anchor、延迟 URL 清理及本地成功或失败反馈。
- 复制与下载的纯 helper 分离到 clipboard.ts 和 download.ts，清除开发环境 Fast Refresh 警告。

复核结果：

- Chrome 实际生成 `asset-snapshot-2026-07-18T04-01-37Z.json`，大小 13,480 bytes，JSON 可解析且 generatedAt 与总资产字段有效；下载事件未回传不影响文件级验收。
- 1280 x 720：导出按钮成功态为 started，状态区输出“资产快照导出已开始”，保持焦点和 40 x 40px；1.8 秒后恢复 idle 并清空状态文本。
- 地址复制成功态保持 copied、copy-status 与“地址已复制”，按钮保持焦点和 34 x 34px；1.8 秒后恢复 idle。
- 390 x 844：导出按钮为 42 x 42px，视图 Tabs 为 290 x 44px，两者均在 390px 视口内，页面 clientWidth / scrollWidth 为 `390 / 390`。
- 组件与 helper 契约通过，覆盖三个状态插槽、时间文件名、延迟回收、click 抛错清理、Clipboard 成功及不可用路径；浏览器警告与错误为 0，TypeScript、Vite 生产构建和 git diff 检查通过。

### 2026-07-22 第七十四轮基线

参考：

- shadcn Input：https://ui.shadcn.com/docs/components/radix/input
- WAI Developing a Keyboard Interface：https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
- WCAG 2.4.3 Focus Order：https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html
- MDN HTMLElement.focus：https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus
- MDN Client-side form validation：https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation
- Tailwind ARIA states：https://tailwindcss.com/docs/hover-focus-and-other-states#aria-states

观察：

- InlineEdit 初始值未修改时仍允许保存；实测点击后执行持久化并显示“钱包名称已更新并保存”，但数据没有发生有效变化。
- 按 Escape 取消或保存后，正在编辑的 input 和按钮组卸载，焦点直接落到 body；键盘用户失去当前钱包位置。
- 三个业务入口都要求非空并在保存前 trim，但这些一致规则分散在业务函数中，原子组件不能提前表达 invalid 或 unchanged。
- 资产组重名属于业务层同步校验；失败时编辑器必须保留，不能按成功路径尝试离开当前编辑上下文。

方法判断：

- 内联编辑采用 invalid / unchanged / dirty 三态；只有 dirty 才能提交，空必填值和 trim 后未变化值都不会触发持久化。
- required 继续使用原生 HTML 约束，同时由 input 输出 aria-invalid、form 输出有限 data-state；视觉沿用现有输入框错误边框和按钮禁用样式。
- 不可保存的 Check 按钮复用 IconButton 的可发现禁用模式，Tooltip 分别解释“请输入内容后保存”或“修改内容后保存”。
- Escape 作为真实实现的键盘命令合并进 aria-keyshortcuts；取消或成功保存后使用 `focus({ preventScroll: true })` 返回原编辑按钮。
- 保存回调以 false 表示业务校验失败；此时编辑器不卸载，并把焦点留在 input，只有成功路径才返回触发器。

本轮动作：

- InlineEdit 新增 originalValue、returnFocusId、invalid / unchanged / dirty 状态、空值和未修改提交保护、键盘快捷键合并及返回焦点逻辑。
- 保存回调支持成功布尔值；钱包名称、地址标签和资产组名称的业务保存函数显式返回 true / false。
- 三类编辑按钮增加稳定 ID，三个调用入口传入原值与对应返回焦点目标，不在业务页面复制校验和焦点代码。

复核结果：

- 修复前：未修改保存按钮可用并产生成功通知；Escape 和保存后焦点均落到 body。修复后 unchanged 按钮 aria-disabled，按 Enter 不提交，编辑器和 input 焦点保持。
- 清空必填钱包名称后状态为 invalid，data-empty / data-invalid / aria-invalid 全部为 true；输入新内容后切换为 dirty 并恢复保存能力。
- 真实保存临时钱包名称后焦点返回 `wallet-group-edit-wallet-001`；随后已恢复原名称“钱包 1”，最终数据没有测试残留。
- 地址标签取消后焦点返回对应 `wallet-address-edit-*`；资产组取消后返回 `asset-group-edit-okx-boost`。
- 将 OKX Boost 改为已有的 42 Space 时，重名提示出现，编辑器继续存在且 input 保持焦点，没有错误退出编辑模式。
- 390 x 844：钱包名称编辑器为 244.5 x 42px，input 为 173.5 x 42px，两个动作均为 32 x 32px，页面 clientWidth / scrollWidth 为 `390 / 390`。
- 服务端结构契约通过，覆盖 invalid / unchanged / dirty、可发现禁用和快捷键去重；TypeScript、Vite 生产构建和 git diff 检查通过。

### 2026-07-22 第七十五轮基线

参考：

- Radix Avatar：https://www.radix-ui.com/primitives/docs/components/avatar
- MDN HTMLImageElement：https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement
- MDN HTMLImageElement.complete：https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/complete
- Tailwind Transition Duration：https://tailwindcss.com/docs/transition-duration
- Tailwind Data Attributes：https://tailwindcss.com/docs/hover-focus-and-other-states#data-attributes

观察：

- TokenIcon 只按 URL 类型判断状态；任何远程 URL 在图片发起请求前就输出 ready，服务端结构契约也会把未加载图片标记为可用。
- 首次访问或慢网时，18px 图标容器在图片完成前只有边框和背景，形成空白圆圈；缓存命中会掩盖这一问题。
- 现有 onError 能切换生成 SVG，但没有 loading 状态、底层 fallback 或 onLoad 回执，样式和自动化都无法区分请求中与真正可见。
- `HTMLImageElement.complete` 在成功和失败时都可能为 true，不能单独作为图片可用证据，还需要 naturalWidth 或 load 事件。

方法判断：

- 采用 Avatar 的 image + fallback 双层模型：缩写占位始终位于底层，远程图片只有被证明可用后才覆盖占位。
- 远程图标使用 loading / ready，生成图标使用 fallback；data-source 继续区分 remote / generated，不把来源和加载结果混为一个状态。
- ready 由 onLoad 或 `complete && naturalWidth > 0` 驱动；onError 清除加载回执并切换现有生成图标。
- loading 占位使用代币缩写、相同边框和固定尺寸，不增加 Spinner 或布局变化；图片与占位只做 120-140ms opacity 过渡，并服从全局 reduced-motion。
- 整个图标继续 aria-hidden，代币名称仍由相邻 symbol 提供；占位缩写只是视觉连续性，不制造重复读屏文本。

本轮动作：

- TokenIcon 新增 loadedSrc、image ref、onImageLoad 回调与缓存完成检查，并在图标参数变化时重置失败和加载状态。
- 根节点增加 data-fallback-label，真实输出 loading / ready / fallback；远程错误继续复用 generatedTokenIconUrl。
- CSS 增加稳定缩写底层和图片淡入，分别适配 40px 与 18px 尺寸；未改变持仓行、资产表格或移动卡片几何。

复核结果：

- 修复前服务端渲染远程无效 URL 直接输出 remote / ready；修复后同一契约输出 remote / loading 和缩写 AU。
- 本地延迟 1.5 秒图片：请求中为 loading、naturalWidth 0、占位 opacity 1、图片 opacity 0；完成后为 ready、naturalWidth 1、占位 opacity 0、图片 opacity 1。
- 远程 404 路径自动进入 generated / fallback，生成图标 naturalWidth 150，40 x 40px 容器完整显示 AU。
- 真实 USDT、VIRTUAL、ETH、OKB 图标均为 remote / ready，naturalWidth 分别为 150 或 250；桌面持仓胶囊没有尺寸变化。
- 390 x 844：4 个可见持仓图标均为 18 x 18px，页面 clientWidth / scrollWidth 为 `390 / 390`，主要持仓两列没有重叠。
- 服务端结构契约覆盖 remote loading、known remote 与 generated fallback；浏览器三态验证、TypeScript、Vite 生产构建和 git diff 检查通过。

### 2026-07-22 第七十六轮基线

参考：

- Radix Alert Dialog：https://www.radix-ui.com/primitives/docs/components/alert-dialog
- shadcn Alert Dialog：https://ui.shadcn.com/docs/components/radix/alert-dialog
- WAI-ARIA Alert Dialog Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
- Tailwind Data Attributes：https://tailwindcss.com/docs/hover-focus-and-other-states#data-attributes

观察：

- ConfirmDialog 使用 Radix Action；确认按钮一经点击就关闭弹窗，无法等待资产组或钱包地址的异步持久化完成。
- 操作进行期间没有 busy 状态、重复提交保护或明确的加载名称；异步拒绝也只能离开确认上下文后通过页面错误查看。
- Radix 官方异步示例要求使用受控 open，在 Promise 完成后再关闭；当前实现与该契约不一致。

方法判断：

- 确认弹窗采用 idle / pending / error 有限状态；pending 由 onConfirm 返回的 Promise 驱动，只有成功或显式 void 才关闭。
- pending 时保留当前焦点和弹窗内容，确认按钮使用 Spinner、aria-busy、aria-disabled 与专用 loadingLabel，取消和 Escape 暂时不可用，防止中途关闭或重复操作。
- onConfirm 返回 false 或抛错时保留弹窗；错误在确认按钮附近使用 role=alert 原位呈现，用户无需重新定位即可重试。
- 异步操作使用 operation token 忽略弹窗关闭后的旧结果；关闭后重置状态，继续沿用原有触发器和 fallback ID 返回焦点规则。

本轮动作：

- ConfirmDialog 支持同步或异步 onConfirm、pendingLabel、failureMessage、idle / pending / error 状态及稳定数据插槽。
- 移除会立即关闭的 Radix Action 包装，改为受控成功关闭；pending 时阻止 Cancel、Escape 和重复确认。
- Button 增加可选 preserveFocusOnLoading 模式；确认按钮加载时保持可聚焦并拦截点击，不使用会把焦点移出操作上下文的原生 disabled。
- 钱包地址和资产组删除改为返回持久化 Promise，确认弹窗会等本地保存与云端同步尝试结束后再关闭。
- 新增紧凑错误带与 Lucide CircleX；不改变标题、影响摘要、按钮顺序或移动端双列 footer。

复核结果：

- 700ms 慢成功路径保持 pending 与 aria-busy，确认按钮为 aria-disabled 而非原生 disabled，活动焦点保持在 confirm-action；按钮事件守卫阻止重复确认。
- pending 时按 Escape 后弹窗继续存在；成功后 calls / completed 为 1 / 1，弹窗关闭并把焦点返回原触发按钮。
- Promise 拒绝后保持 error 状态，role=alert 输出原始错误“模拟保存失败”，确认按钮恢复可用且继续持有焦点；返回 false 时输出自定义 failureMessage，取消后焦点返回对应触发器。
- 390 x 844：错误态弹窗和移动端双列 footer 完整，页面 clientWidth / scrollWidth 为 `390 / 390`；1280 x 720：弹窗为 460 x 203px，错误带 366 x 34px，按钮保持 40px 高。
- 临时隔离验证页已删除；Button 服务端结构契约、TypeScript、Vite 生产构建和 git diff 检查通过。

### 2026-07-22 第七十七轮基线

参考：

- shadcn Button Group：https://ui.shadcn.com/docs/components/base/button-group
- MDN ARIA group role：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/group_role
- Tailwind Border Width / Dividing Children：https://tailwindcss.com/docs/border-width#dividing-children

观察：

- 资产组编辑/删除、钱包编辑/展开、地址编辑/复制/删除和内联编辑保存/取消都属于相关命令组，但分别手写 role、aria-label、display 和 gap。
- 34px 地址动作使用三个独立圆角框，总宽 110px；内联编辑两个 28px 动作为 58px。视觉上更像散落按钮，不像一个可扫描的操作单元。
- 现有按钮的 Tooltip、焦点、危险色和异步反馈已经成熟，不应为了成组而重写按钮本身或引入 roving focus。

方法判断：

- ButtonGroup 只负责相关命令的集合语义、方向和边界组合；每个按钮继续保留独立 Tab 停靠点、名称和状态。
- 连接模式折叠相邻 1px 边框，仅保留首尾外侧圆角；hover、focus-visible 和 open 状态提升层级，保证焦点环及强调边框不被相邻按钮覆盖。
- 默认要求 aria-label，输出 role=group；操作命令使用 ButtonGroup，具有单一状态选择语义的控件继续使用 Tabs、Select 或 Toggle，不混淆模式。
- ButtonGroup 不固定子按钮尺寸；资产组 28px、钱包/地址 34px 和移动端 38px 继续由 IconButton 原子与响应式规则决定。

本轮动作：

- 新增 ButtonGroup 原子，支持 horizontal / vertical、attached / detached、ref、业务 className、可覆盖 slot 和稳定 data 属性。
- 资产组、钱包行、地址行和 InlineEdit 四类操作统一接入 ButtonGroup，移除调用方重复的 role=group 拼装。
- 增加逻辑方向圆角、边框折叠和焦点层级规则；保留现有行级对齐、hover 显示、Tooltip、复制状态和危险操作颜色。

复核结果：

- 服务端结构契约 8 / 8，覆盖 role、必填名称、默认/自定义 slot、连接/分离和水平/垂直方向。
- 1280 x 720：钱包双按钮组为 67 x 34px，地址三按钮组由 110px 收敛为 100 x 34px，内联编辑双按钮组由 58px 收敛为 55 x 28px；每个点击目标尺寸保持不变。
- InlineEdit unchanged 状态继续让保存按钮 aria-disabled，输入保持焦点；首尾按钮分别保留 5px 外侧圆角，中间边界为 0px 圆角。
- 地址复制进入 success 后组尺寸保持 100 x 34px，焦点留在“复制地址”，copy-status 输出“地址已复制”，危险色和三个独立按钮名称保持不变。
- 390 x 844：钱包组为 75 x 38px、地址组为 112 x 38px，移动资产组按钮为 32 x 32px；页面 clientWidth / scrollWidth 为 `390 / 390`。
- 320 x 780：钱包与地址组保持 75px / 112px 宽，相邻点击区域没有实质重叠，页面 clientWidth / scrollWidth 为 `320 / 320`。
- 桌面真实页面挂载 23 个 ButtonGroup，缺失 role / aria-label / orientation 均为 0；浏览器无 warning/error，TypeScript、Vite 生产构建与 git diff 检查通过。

### 2026-07-22 第七十八轮基线

观察：

- 钱包编号与链 SVG 的布局边界已经几何居中，但实际图形仍会受字体墨迹、Lucide 描边和像素栅格影响，在徽标内显得偏左上。
- 资产组图标同样复用 `IdentityMark`，不能用全局位移修正钱包与链，否则会把原本居中的图标一起带偏。

方法判断：

- 外框和全尺寸 glyph 继续使用 Grid 保证结构中心稳定；光学校正由 glyph 独立承担，不改变徽标尺寸、表格行高或移动卡片布局。
- 校正变量默认值保持 `0px`，仅钱包与链徽标设置右下 `1px`；资产组、按钮和代币图标不继承该偏移。

本轮动作：

- `IdentityMark` glyph 增加 `--ui-identity-mark-optical-x / y` 可配置位移。
- `.wallet-badge` 与 `.chain-badge` 统一设置 `1px / 1px` 光学校正，桌面表格和移动账本复用同一规则。

复核结果：

- 1280 x 720：钱包徽标保持 40 x 40px，链徽标保持 38 x 38px；两类 glyph 均为 `(1px, 1px)` 局部补偿，外框尺寸和表格行高未变化。
- 390 x 844：钱包与链徽标均为 40 x 40px，内部补偿一致；页面 clientWidth / scrollWidth 为 `390 / 390`，无横向溢出。
- 同页资产组 IdentityMark 的实际 transform 仍为 `(0px, 0px)`，局部规则没有影响资产组图标。
- CSS 局部规则契约、TypeScript、Vite 生产构建和 git diff 检查均通过。

### 2026-07-22 第七十九轮基线

参考：

- Radix Switch：https://www.radix-ui.com/primitives/docs/components/switch
- shadcn Switch：https://ui.shadcn.com/docs/components/radix/switch
- WAI-ARIA Switch Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/switch/
- MDN aria-describedby：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby

观察：

- 刷新范围弹窗中的 Switch 已有 60px 整行点击区域、可见开关状态和焦点环，但输入被完整 label 包裹。
- 浏览器因此把“包含风险/自定义 token”和整段说明合并成开关名称，说明没有作为独立描述暴露。
- WAI-ARIA 要求开关名称在状态变化时保持不变；补充静态文本应由 aria-describedby 关联，Radix 示例也使用显式 aria-labelledby。

方法判断：

- 保留原生 checkbox、role=switch 和整行 label 点击模型，不为已经稳定的交互引入新的状态库。
- 组件内部生成 control、label、description 三个稳定 ID；可见标题负责名称，说明负责描述。
- 调用方显式提供 aria-label 或 aria-labelledby 时尊重外部名称；外部 aria-describedby 与内部说明 ID 合并并去重。

本轮动作：

- Switch 使用 useId 建立显式名称/描述关系，输入始终获得稳定 id。
- 说明从隐式 label 文本拆分为 aria-describedby；无说明时不输出悬空引用。
- 新增 IDREF 合并去重，保留 disabled、invalid、受控/非受控输入与原有视觉结构。

复核结果：

- 真实弹窗的无障碍树由原来的“名称 + 整段说明”收敛为名称“包含风险/自定义 token”；说明 ID 可解析到完整说明文本，页面重复 ID 为 0。
- 点击和受控状态回归可在 false / true 间切换，焦点保持在原生 switch-control；输入继续使用 native checkbox，因此保留 Space 键语义。
- 服务端结构契约 10 / 10，覆盖自动 label/description ID、显式 aria-label、显式 aria-labelledby、外部描述合并去重、无悬空描述、role 与 input type。
- 1280 x 720：开关整行为 798 x 60px；390 x 844：移动底部面板中的开关为 366 x 60px，状态变化不改变尺寸，页面 clientWidth / scrollWidth 为 `390 / 390`。
- TypeScript、Vite 生产构建和 git diff 检查通过。

### 2026-07-22 第八十轮基线

参考：

- shadcn Input Group：https://ui.shadcn.com/docs/components/radix/input-group
- MDN Password input：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/password
- WAI-ARIA Button Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/button/

观察：

- 访问口令仍使用裸 Input，没有字段身份图标和显示/隐藏控制，是认证流程中唯一尚未形成完整输入组契约的高频字段。
- 认证页直接用 `.auth-panel input` 覆盖边框、背景和内边距；接入复合输入组后会污染内部 control，形成双边框和错位。
- 密码明文切换属于动作命令：显示时应宣布“隐藏访问口令”，隐藏时应宣布“显示访问口令”，不应同时使用名称变化和 `aria-pressed` 两套状态表达。

方法判断：

- 新增 PasswordField，原生 input 在 DOM 中位于附加图标和操作按钮之前，保留自然表单与辅助技术顺序；CSS Grid 仅负责视觉排列。
- 左侧 KeyRound 标识字段身份，右侧 Eye / EyeOff 使用原生 button；动态可访问名称表达下一步动作，`aria-controls` 关联受控输入。
- 指针点击显示按钮时阻止 mousedown 转移焦点，让用户查看口令后能继续输入；键盘仍可独立 Tab 到按钮并用 Enter / Space 激活。
- 禁用、错误、悬停和焦点状态沿用 InputGroup 语义，认证页只约束外层控件高度，不再直接装饰内部 input。

本轮动作：

- PasswordField 支持自动/显式 ID、错误与禁用状态、浏览器密码自动填充、自定义显示/隐藏文案及透传 input 属性。
- 访问口令替换为 PasswordField；输入组增加专用 action 的 hover、focus、active、disabled 和 visible 状态。
- 保持字距为 0，使用等宽字体改善明文口令字符辨识；不改变认证表单宽度、提交逻辑或错误提示关系。

复核结果：

- 显示后 input type 由 password 切换为 text，值 `demo-value` 保持不变，按钮名称变为“隐藏访问口令”，根节点和按钮分别进入 revealed / visible；再次点击完整恢复。
- 指针点击切换按钮后活动焦点仍在 password-field-control；按钮 type 为 button，不触发表单提交。输入、切换按钮、提交按钮保持自然 DOM 顺序，三者 tabIndex 均为 0。
- 1280 x 720：输入组为 374 x 42px；390 x 844：输入组为 312 x 42px；320 x 780：输入组为 242 x 42px。切换按钮三档均为 30 x 30px，页面 clientWidth / scrollWidth 分别为 `1280 / 1280`、`390 / 390` 和 `320 / 320`。
- 服务端结构契约 10 / 10，覆盖原生密码类型、名称、自动/显式 ID、aria-controls、动作名称、无 aria-pressed、身份图标、错误/禁用/自动填充和外部描述透传。
- 临时隔离验证页已删除；TypeScript、Vite 生产构建和 git diff 检查通过。
- Vercel 生产认证页复核通过：错误态继续关联 `auth-error` 并输出 `aria-invalid=true`；显示/隐藏不丢值、不移走输入焦点。390 x 844 错误态表单为 358px 宽、输入组为 312 x 42px，页面 clientWidth / scrollWidth 为 `390 / 390`。

### 2026-07-22 第八十一轮基线

参考：

- shadcn Input Group：https://ui.shadcn.com/docs/components/radix/input-group
- Tailwind Border Width：https://tailwindcss.com/docs/border-width
- MDN required attribute：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/required
- WAI-ARIA Button Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/button/

观察：

- 搜索清除和口令显示都属于输入框内动作，但分别维护 `ui-field-clear` 与 `ui-input-group-action` 两套裸 button、hover、focus 和 SVG 规则。
- 资产组新建把 Input 与 40px IconButton 放进 `1fr + 34px` 网格，按钮实际尺寸大于轨道；两个独立边框也弱化了“输入后提交”的单一任务关系。
- 空资产组名称仍可点击提交并进入浏览器 required 校验；动作不可用的原因没有通过按钮本身暴露。

方法判断：

- 抽取 InputGroup、InputGroupInput、InputGroupAddon 与 InputGroupButton；Input 始终先于 addon 出现在 DOM，align 只控制视觉位置。
- InputGroupButton 组合现有 IconButton，不复制 Tooltip、aria-disabled、disabledReason、键盘按钮语义或焦点环。
- 搜索、口令和资产组创建共享同一个 30px 内嵌动作几何；资产组创建使用 FolderPlus 建立字段身份，Plus 保留为提交命令。
- 空值创建采用可发现禁用：按钮仍可聚焦，输出 aria-disabled 并显示“输入名称后添加”；required 继续保留原生表单约束。

本轮动作：

- 新增四个 InputGroup 组合原子，支持 ref、业务 className、原生属性、错误/禁用状态、inline-start / inline-end 和稳定 data-slot。
- SearchField 与 PasswordField 迁移到共享组合；清除和显示按钮改为 InputGroupButton，删除两套私有按钮样式。
- 资产组创建合并为单一输入组；空值时提交按钮进入可发现禁用，非空时恢复 primary 动作。

复核结果：

- 资产组创建空值时按钮 `aria-disabled=true`、native disabled=false，浏览器无障碍树标记为 disabled；输入“测试资产组”后 aria-disabled 移除并进入 ready，重新载入后资产组数量未变化，没有测试数据落盘。
- 搜索“钱包 13”后清除按钮名称为“清除搜索钱包”，input 输出 `aria-keyshortcuts=Escape`；点击清除后值归零、按钮卸载、快捷键移除，焦点留在搜索 input。
- 1440 x 900：资产组创建输入组为 232 x 40px、搜索输入组为 280.8 x 40px；390 x 844：创建输入组为 344 x 42px；320 x 780：创建输入组为 274 x 42px。三档内嵌按钮均为 30 x 30px，页面 clientWidth / scrollWidth 分别为 `1440 / 1440`、`390 / 390` 和 `320 / 320`。
- 服务端结构契约 14 / 14，覆盖根状态、自定义插槽、addon 对齐、可发现禁用、原生 input 禁用、input-first 顺序、搜索类型/快捷键/清除名称以及口令类型/控制关系/动作名称。
- TypeScript、Vite 生产构建和 git diff 检查通过。
- Vercel 生产认证页复核通过：共享按钮保留 `input-group-button` 插槽与 30 x 30px 尺寸；显示后 input 由 password 切换为 text，值和输入焦点保持，按钮进入 visible 色态并改名为“隐藏访问口令”。390 x 844 下表单为 358px、输入组为 312 x 42px，页面 clientWidth / scrollWidth 为 `390 / 390`。

### 2026-07-22 第八十二轮基线

观察：

- 第七十八轮为钱包编号与链图标添加了右下 `1px / 1px` 光学校正，但真实页面仍被用户明确感知为没有居中。
- 浏览器坐标复核确认该规则让 glyph 中心相对外框中心产生 `(1px, 1px)` 偏移；业务类对共享原子注入位移也会让不同尺寸下的对齐依据不一致。

方法判断：

- 身份徽标优先保证可验证的几何中心，不再按钱包、链或资产组分别维护经验位移。
- `IdentityMark` 外框作为唯一定位基准；glyph 使用 `position: absolute; inset: 0; display: grid; place-items: center`，业务样式只负责尺寸、颜色和边框。
- 链 SVG 继续显式 `place-self: center` 并保持固定尺寸；钱包文本、链 SVG 和资产组 SVG 都必须相对外框中心得到 `(0, 0)`。

本轮动作：

- 删除 `.wallet-badge` 与 `.chain-badge` 的 `--ui-identity-mark-optical-x / y` 覆盖。
- 删除 glyph 的可配置 translate 和冗余 `width / height: 100%`，由四边 inset 和 Grid 直接确定居中区域。
- 不改变徽标外框、表格行高、移动账本尺寸或颜色体系。

复核结果：

- 1440 x 900：16 个钱包徽标保持 40 x 40px，4 个链徽标保持 38 x 38px；钱包 glyph、链 glyph 与链 SVG 的中心差值全部为 `(0, 0)`，computed transform 为 `none`。
- 390 x 844：钱包和链徽标均为 40 x 40px，glyph / SVG 中心差值为 `(0, 0)`；页面 clientWidth / scrollWidth 为 `390 / 390`。
- 320 x 780：4 个移动链徽标的 SVG 中心差值继续为 `(0, 0)`；页面 clientWidth / scrollWidth 为 `320 / 320`。
- 同页资产组图标保持 `(0, 0)`，共享原子修正没有破坏其他身份标记；TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第八十三轮基线

参考：

- shadcn Pagination：https://ui.shadcn.com/docs/components/radix/pagination
- MDN aria-current：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current
- WAI-ARIA Button Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/button/
- Tailwind Responsive Design：https://tailwindcss.com/docs/responsive-design

观察：

- 钱包管理表在桌面与移动端一次渲染全部 16 个逻辑钱包；移动端页面总高达到 3308px，定位后半段钱包需要长距离滚动。
- 表格现有筛选、排序、资产组范围和批量选择都作用于完整结果，分页只能改变可见窗口，不能把“全选当前筛选结果”悄悄缩成“全选当前页”。
- 显式翻页会替换整组表格行；如果焦点仍留在被卸载的翻页按钮或页面根节点，键盘用户会失去当前操作位置。

方法判断：

- 新增 button 驱动的 Pagination 原子；这是客户端状态，不伪造 URL 链接。页码组合沿用 previous / page / ellipsis / next 结构。
- 每页展示 8 个钱包；搜索、资产组筛选、排序和批量选择继续基于完整筛选结果，分页只切分渲染数组。
- 当前页只输出一个 `aria-current="page"`；首尾翻页采用可聚焦的 `aria-disabled` 与原因提示，保留按钮键盘语义。
- 用户显式翻页后将表格滚动归零并聚焦新页首个钱包复选框；搜索、排序与资产组变化静默回到第一页，不抢走当前控件焦点。

本轮动作：

- 新增 Pagination、页码压缩算法、区间播报、首尾状态、更多页标识和 `aria-controls` 关系。
- 钱包管理接入 8 条分页窗口、隐藏 caption 的当前区间说明和稳定的钱包选择框 ID。
- 分页作为表格下方未套卡片的 footer band；600px 以下纵向排列区间与控件，页码和箭头统一为 32 x 32px。

复核结果：

- 服务端结构契约 10 / 10，覆盖短页码、首段、中段、尾段、省略号、当前页、首尾可发现禁用、控制关系和单页隐藏。
- 1440 x 900：第一页显示钱包 1-8，第二页显示钱包 9-16；区间分别为“显示 1-8，共 16 个钱包”和“显示 9-16，共 16 个钱包”。翻到第二页后焦点落到“选择 钱包 9”，表格容器 scrollTop 为 0。
- 跨页返回后仍显示“已选 1 个钱包”；在第二页搜索“钱包 13”后只保留对应行、分页隐藏、焦点留在搜索框，清除搜索后回到第一页；第二页切换排序也回到第一页。
- 390 x 844 与 320 x 780 均显示 8 行，分页高度 82px，四个按钮统一为 32 x 32px；页面 clientWidth / scrollWidth 分别为 `390 / 390`、`320 / 320`，页面总高由 3308px 收束到 2030px。
- TypeScript、Vite 生产构建和 git diff 检查通过。

### 2026-07-22 第八十四轮基线

参考：

- shadcn Dropdown Menu：https://ui.shadcn.com/docs/components/radix/dropdown-menu
- Radix Dropdown Menu：https://www.radix-ui.com/primitives/docs/components/dropdown-menu
- WAI-ARIA Menu Button Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/

观察：

- 390 x 844 的总览顶部高 194.375px；同步状态单占一行，重新载入、刷新范围和刷新资产再占一行，首屏近四分之一用于品牌、导航与命令。
- 总览的“重新载入、刷新范围”是低频次级命令，“刷新资产”是当前页主命令；小屏继续平铺三者会降低层级而非提升效率。
- 从菜单项打开受控 Dialog 时，菜单项会先卸载；Dialog 只记录瞬时活动元素会导致关闭后焦点落回页面根节点。

方法判断：

- 引入 Radix Dropdown Menu 2.1.21，复用其 menu button 角色、焦点托管、方向键、Esc、typeahead 和碰撞处理，不手写弹层键盘模型。
- 共享原子提供 Trigger、Content、Item、Label 与 Separator；Item 统一图标、加载、禁用、高亮和无图标紧凑布局。
- 桌面继续直接展示三个命令；680px 以下仅保留刷新主按钮，两个次级命令进入“更多资产操作”，同步状态、主按钮和菜单触发器组成单行三列。
- Dialog 增加 fallbackFocusIds；原触发器已卸载时，按顺序选择仍在布局中的备用触发器恢复焦点。

本轮动作：

- 新增 DropdownMenu 原子及与 Select 一致的边框、阴影、4px 项圆角、36px 行高和 origin-aware 入场动画。
- 总览小屏增加 MoreHorizontal 菜单，重新载入支持 loading/disabled 状态，刷新范围继续打开原设置弹窗。
- 顶部操作区按 data-page 建立明确网格；钱包页为同步状态 + 两个命令，总览页为同步状态 + 主命令 + 菜单，避免依赖 DOM 自动排布。
- 刷新范围 Dialog 配置桌面按钮与移动菜单按钮两个备用返回焦点 ID。

复核结果：

- 390 x 844：顶部高度由 194.375px 降到 167.375px，操作区由 70px 两行收束为 42px 单行；同步状态 72px、刷新资产 242px、菜单触发器 42px，clientWidth / scrollWidth 为 `390 / 390`。
- 320 x 780：同步状态 72px、刷新资产 172px、菜单触发器 42px，clientWidth / scrollWidth 为 `320 / 320`；钱包页两个命令各 107px，同样保持单行。
- 1440 x 900：移动菜单 display=none，重新载入、刷新范围、刷新资产继续为三个 106 x 40px 按钮，顶部高度保持 49.375px。
- Enter 打开菜单后触发器输出 aria-haspopup=menu、aria-expanded=true，焦点位于第一个 menuitem；ArrowDown 移至“刷新范围”，Esc 关闭并返回触发器。
- 从菜单打开“刷新范围”后焦点进入 dialog-title；关闭弹窗后回到 mobile-overview-action-menu-trigger。320px 下菜单为 190 x 110px，左右边界 120-310px，无碰撞或溢出。
- TypeScript、Vite 生产构建、npm audit 与 git diff 检查通过。

### 2026-07-22 第八十五轮基线

参考：

- TweakCN Theme Editor：https://tweakcn.com/editor/theme?p=dashboard
- shadcn Theming：https://ui.shadcn.com/docs/theming
- Tailwind Theme Variables：https://tailwindcss.com/docs/theme

观察与方法：

- 根样式仍以零散 legacy token 和硬编码白色为主；Select 与 DropdownMenu 重复维护相同的浮层背景、边框、阴影、高亮和禁用色。
- 建立与 TweakCN / shadcn 对齐的语义主题层，但保持当前颜色不变；旧令牌改为兼容别名，让后续主题调整只修改一处契约。
- 将按钮、弹窗、遮罩、InputGroup、Select 和 DropdownMenu 的高频颜色迁移到语义令牌，业务组件结构与交互不变。

复核结果：

- `card / surface`、`primary / accent`、`border / line`、`input / control-border`、`radius / control-radius` 五组运行时计算值完全相同。
- Select 与移动 DropdownMenu 的背景、边框、文字、6px 圆角和双层阴影逐项一致；TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第八十六轮基线

观察与方法：

- 用户在真实页面中明确指出钱包编号和链图标虽然几何中心重合，视觉重心仍偏左上；直接视觉反馈优先于只看 DOM 边界的判断。
- 保留 `IdentityMark` 的绝对铺满 Grid 中心作为结构基准，仅为 `.wallet-badge` 与 `.chain-badge` 的内部 glyph 增加右下 `1px` 光学校准；资产组、代币和按钮图标保持默认 `0px`。

复核结果：

- 1440 x 900：钱包徽标保持 40 x 40px，链徽标保持 38 x 38px；两类 glyph 的计算 transform 均为 `matrix(1, 0, 0, 1, 1, 1)`，资产组 glyph 仍为 `(0, 0)`。
- 390 x 844：钱包与链徽标均为 40 x 40px，内部校准一致，页面横向溢出为 0；桌面与移动截图复核无布局变化。

### 2026-07-22 第八十七轮基线

参考：

- shadcn Alert：https://ui.shadcn.com/docs/components/aria/alert
- shadcn Item：https://ui.shadcn.com/docs/components/aria/item
- Tailwind Responsive Design：https://tailwindcss.com/docs/responsive-design

观察：

- “Solana 追踪范围”是长期常态信息，却以 72.1px Alert 占据 320px 首屏；Alert 的注意力级别与信息性质不匹配。
- 同一屏的“钱包”事实只显示地址总数，链范围没有归入与它语义最接近的位置。
- 正常状态的长句在窄屏折成三行，并把摘要、视图切换和第一条资产组整体向下推移。

方法判断：

- Alert 只保留给需要用户注意或处理的状态；正常范围信息进入摘要事实，沿用 Item 的“标题 / 值 / 描述”内容层级。
- 移动端先提供可扫描的紧凑文案“32 地址 · SOL 16”，完整配对与独立钱包统计通过屏幕阅读器文本和 title 保留。
- 当刷新范围包含 Solana 但没有地址时，继续显示 warning Notice，并提供“管理钱包”动作；这才是需要注意的异常。

本轮动作：

- PortfolioSummary 增加可选 walletMeta / walletMetaLabel，钱包事实同时承载地址总数和当前范围内的 Solana 地址数。
- 按当前资产组范围重新计算 Solana 地址、EVM/SOL 配对组和独立 Solana 钱包，避免全局数字混入局部摘要。
- 正常状态移除常驻 Notice；关闭 Solana 范围时恢复普通“32 个地址”，不输出重复隐藏文本。

复核结果：

- 320 x 780：摘要从 y=277.5px 前移至 y=195.4px，第一条资产组从 y=744.5px 前移至 y=662.4px，页面总高从 1633px 降至 1551px，净减少 82.1px。
- 320px 下“32 地址 · SOL 16”在 79px 可用宽度内完整显示；完整说明为“共 32 个链上地址；Solana 16 个，其中 EVM/SOL 配对 16 组，独立 Solana 钱包 0 个”。
- 关闭 Solana 后可见文本恢复“32 个地址”、隐藏补充数量为 0；恢复范围后紧凑文本与完整说明重新出现，两次关闭弹窗焦点均返回“刷新范围”。
- 320 / 390 / 1440px 的横向溢出均为 0，可见交互控件实质重叠均为 0；TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第八十八轮基线

参考：

- shadcn Textarea：https://ui.shadcn.com/docs/components/radix/textarea
- shadcn Field：https://ui.shadcn.com/docs/components/radix/field
- Tailwind Height：https://tailwindcss.com/docs/height

观察：

- 移动端共享 Dialog 使用 92dvh，刷新范围的 14 个网络选项刚好填满；批量导入复用同一高度后，320px 下弹窗高 717.6px、空输入区高 466.8px，任务内容与容器高度不匹配。
- 三条 placeholder 使用完整长地址且 LineTextarea 必须保持 wrap=off 才能让行号对应逻辑行，导致输入格式示例在 252px 可用宽度内被横向裁切。
- 全局缩短 Dialog 会破坏刷新范围；打开软换行又会让一个逻辑地址占据多条视觉行，行号失真。

方法判断：

- Textarea 继续与 FieldLabel、错误态和原生表单语义组合；只调整批量导入任务的容器尺寸，不改共享 Dialog 或 LineTextarea 的行为。
- 使用动态视口单位让 Sheet 跟随移动浏览器可用高度，导入任务采用 82dvh、最高 680px；长内容继续在输入框内部滚动。
- placeholder 只负责示范语法，不作为可提交数据；地址使用首尾缩写，让“名称 地址”与 EVM / Solana 两种形式在窄屏一眼可读。

本轮动作：

- 批量导入 Dialog 增加 wallet-import-dialog 任务类；680px 以下使用 `height: min(82dvh, 680px)`，内部三段布局继续占满自身高度。
- 示例收敛为“钱包 1 0xef49...dd50”“钱包 2 0x3521...cc30”“SOL 1 AvJUE...HoVZ”，保留三行和行号。
- 刷新范围继续使用默认 92dvh，不改变网络选择、footer、初始焦点或返回焦点。

复核结果：

- 320 x 780：导入 Sheet 从 717.6px 降至 639.6px，Textarea 从 466.8px 降至 388.8px；placeholder 的 scrollWidth / clientWidth 为 252 / 252px。
- 320 x 568：Sheet 为 465.8px、Textarea 为 236.6px，footer 与弹窗底边均为 y=568px；20 行、970 字符输入输出 20 个行号，页面横向溢出为 0。
- 390 x 844：Sheet 命中 680px 上限、Textarea 为 445.1px；1440 x 900 保持桌面 Dialog，Textarea 为 338px。
- 同一 320 x 780 视口中的刷新范围仍为 717.6px；导入打开后焦点位于 textarea，Escape 关闭后返回“批量导入”。TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第八十九轮基线

参考：

- MDN `place-items`：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/place-items
- MDN `translate()`：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/transform-function/translate
- Tailwind `place-items`：https://tailwindcss.com/docs/place-items

观察：

- 钱包编号与链 SVG 已经位于全尺寸 Grid 中，但业务样式仍统一设置 `translate(1px, 1px)`；这会让 glyph 的几何中心相对外框固定偏移 1px。
- 同一位移同时应用于数字字形和 Lucide SVG，没有可复现的共同光学依据；截图中的可见墨迹也会随数字和图标轮廓变化，不能由一个全局经验值修正。
- `IdentityMark` 原子已经提供 `position: absolute; inset: 0` 的稳定定位区域，继续保留可配置 transform 只会产生第二套互相冲突的居中机制。

方法判断：

- 固定尺寸身份徽标只保留一条布局契约：外框建立定位上下文，glyph 铺满内容区并通过 Grid `place-items: center` 同时沿块轴和行内轴居中。
- 不再给钱包、链或其他身份徽标设置全局光学位移。只有单个图形经过像素证据验证且不能修正源 SVG 时，才允许在该图形自身处理，不进入共享原子。
- 验收同时检查外框、glyph、SVG 的中心坐标和最终截图，避免只凭代码结构或主观微调反复切换实现。

本轮动作：

- 删除 `.wallet-badge` 与 `.chain-badge` 的 `--ui-identity-mark-optical-x / y` 覆盖。
- 删除 `identity-mark-glyph` 的可配置 `translate()`；钱包文字、链 SVG 与资产组图标统一复用无 transform 的中心 Grid。
- 保留徽标尺寸、颜色、边框、表格行高和移动账本结构，修正不扩大布局影响范围。

复核结果：

- 1440 x 900：前 8 个钱包徽标 glyph 与 4 个链徽标 SVG 的横纵中心差全部为 `(0px, 0px)`，computed transform 为 `none`。
- 390 x 844 与 320 x 780：钱包和链徽标中心差继续全部为 `(0px, 0px)`；页面 `clientWidth / scrollWidth` 分别为 `390 / 390`、`320 / 320`。
- 桌面与移动截图确认图形位于外框正中，资产组和代币图标未受影响。

### 2026-07-22 第九十轮基线

参考：

- shadcn Select：https://ui.shadcn.com/docs/components/radix/select
- Radix Select：https://www.radix-ui.com/primitives/docs/components/select
- Tailwind Width：https://tailwindcss.com/docs/width
- Tailwind Min Width：https://tailwindcss.com/docs/min-width

观察：

- 钱包排序业务样式声明 166px，但后出现的 `.ui-select-trigger { width: 100% }` 以相同层级覆盖它；1440px 下 Trigger 因此扩张到 740px。
- 320px 下排序控件与“全选当前”平分一行，Trigger 宽 133px；18px 图标、18px 箭头、两处 7px 间距和左右 padding 之后，标签槽只有 62px，而“钱包顺序”实际需要 64px。
- Select 原子同时承担交互语义和默认布局，但具体 Trigger 宽度属于使用场景输入。shadcn 示例也在调用处为 Trigger 指定宽度，而不是把所有 Select 固定为同一个尺寸。

方法判断：

- 原子组件保留 `width: 100%` 与 7px 间距作为默认值，同时通过 CSS 自定义属性开放宽度和内部列间距；业务组件不再依赖选择器出现顺序覆盖原子。
- 钱包排序桌面输入 166px，760px 以下输入 100%；紧凑三列布局使用 5px 间距，给短标签保留完整空间。
- 长选项仍允许在菜单或极端容器中省略，但常用短标签不得因为原子固定装饰空间而被误截断。

本轮动作：

- `.ui-select-trigger` 改为 `width: var(--ui-select-width, 100%)`、`gap: var(--ui-select-gap, 7px)`。
- `.management-sort` 通过 `--ui-select-width` 声明桌面 166px、移动 100%，并通过 `--ui-select-gap: 5px` 输入紧凑间距。
- 删除钱包排序中已被原子高优先级规则覆盖的直接 `width / gap / padding-left`，避免样式表继续表达错误契约。

复核结果：

- 320 / 390 / 760px：排序 Trigger 分别为 131 / 131 / 132.2px，“钱包顺序”的 `clientWidth / scrollWidth` 分别为 `64 / 64`、`64 / 64`、`65 / 65`。
- 980px 下控件随工具栏压缩到 140.1px且标签完整；1440px 下恢复为 166px，搜索框保持 390px，两者间距 9px。
- 320px 菜单宽 131px，三项标签均为 `80 / 80px`；ArrowDown、Enter、焦点返回和恢复默认“钱包顺序”通过。
- 其他钱包资产组 Select 继续使用默认 7px 间距和 100% 宽度；320 / 390 / 760 / 980 / 1440px 页面横向溢出均为 0。

### 2026-07-22 第九十一轮基线

参考：

- shadcn Badge：https://ui.shadcn.com/docs/components/aria/badge
- shadcn Spinner：https://ui.shadcn.com/docs/components/base/spinner
- Lucide Circle Question Mark：https://lucide.dev/icons/circle-question-mark
- Lucide Circle Minus：https://lucide.dev/icons/circle-minus
- W3C WCAG 1.4.1 Use of Color：https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html

观察与方法：

- 钱包表格把没有任何摘要的“未刷新”和刷新时因链范围不兼容而“跳过”合并为同一个 `skipped` 状态；两种事实无法从组件契约中区分。
- `CircleDashed` 与项目真实 Spinner 都是断续圆形轮廓，即使没有旋转，也容易被理解为仍在加载。
- shadcn 明确把普通图标徽标与 Spinner 徽标分开；W3C 要求状态不能只依赖颜色。状态原子因此同时使用明确文字、不同轮廓和语义色，而不是让中性色承担全部解释。

本轮动作：

- `StatusBadgeStatus` 增加 `missing`：使用当前项目 Lucide 版本中的 `CircleHelp` 表达尚无结果；该图标在新版 Lucide 文档中名为 `CircleQuestionMark`，可见文案继续显示“未刷新”。
- `skipped` 改用 `CircleMinus`，表格短文案改为“已跳过”；详细状态继续展示服务端提供的真实跳过原因。
- 钱包管理表格显式区分 `ok / stale / error / skipped / missing` 五条分支，不再用最终 fallback 混合业务状态。

复核结果：

- 1440 x 900 与 390 x 844：钱包行“未刷新”显示 `CircleHelp` 问号圆形，徽标均为 68 x 24px；14px 图标容器与 13px SVG 的中心坐标完全一致。
- 320 x 780：标签 `clientWidth / scrollWidth` 为 `33 / 33px`，SVG 的 computed animation 为 `none`，页面 `clientWidth / scrollWidth` 为 `320 / 320px`。
- 代码分支与生产构建确认 `skipped` 使用 `CircleMinus` 和“已跳过”，`missing` 使用 `CircleHelp` 和“未刷新”；两者都不再使用虚线圆环。

### 2026-07-22 第九十二轮基线

参考：

- shadcn Table：https://ui.shadcn.com/docs/components/base/table
- shadcn Item：https://ui.shadcn.com/docs/components/radix/item
- Tailwind Responsive Design：https://tailwindcss.com/docs/responsive-design

观察与方法：

- 四种总览账本的桌面表格最小宽度均为 1180px，但原切换点只有 760px；在 980px 视口中，表格容器 `clientWidth / scrollWidth` 为 `946 / 1180px`，主要持仓被截断，状态列整体位于初始可见范围之外。
- 横向滚动能保留原生 table 语义，但 macOS 覆盖式滚动条不会持续提示还有关键列；状态、估值和资产构成不应成为只有滑动后才能发现的信息。
- 项目已经为四种视图实现完整 `LedgerItem`，包含身份、总额、关键事实、详情和动作。按 Tailwind 的响应式方法，断点应由内容开始失效的位置决定，而不是复用“手机 760px”这一设备标签。

本轮动作：

- 将 `.desktop-ledger-table / .mobile-ledger-list` 的表示切换点从 760px 提升到 1200px；1200px 及以下使用完整 Item 账本，1201px 起使用高密度桌面表格。
- 继续保留同一份领域数据和交互回调，不复制业务逻辑，也不删除宽表的横向滚动兜底。
- 修正组件目录中已过期的 Management Selection Bar 状态说明。

复核结果：

- 980 x 900：资产组、链、币种、钱包四个视图分别渲染 2 / 4 / 4 / 1 条 Item，桌面表格 display=none，页面 `clientWidth / scrollWidth` 为 `980 / 980px`。
- 1200px 下 Item 账本保持显示；1201px 起桌面表格恢复，状态徽标边界为 `1081.2-1176.0px`，完整位于容器右边界 `1184px` 内。
- 320 x 780：资产组 Item 保持 298px 宽，页面 `clientWidth / scrollWidth` 为 `320 / 320px`；1440 x 900 桌面表格容器为 `1406 / 1406px`，没有内部滚动。
- 980px 下 ArrowRight 依次切换链、币种、钱包，Home 返回资产组；四个 tab 均自动激活正确面板。

### 2026-07-22 第九十三轮基线

参考：

- MDN Clipboard `writeText()`：https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
- shadcn Tooltip：https://ui.shadcn.com/docs/components/aria/tooltip
- shadcn Message Accessibility：https://ui.shadcn.com/docs/components/base/message
- W3C WCAG 4.1.3 Status Messages：https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html

观察与方法：

- 代币账本把合约缩写为 `0x55d3...7955`，完整地址只存在于 title 和无障碍名称中；条目没有操作控件，用户无法直接取得链上查询所需的真实合约。
- 钱包地址已经通过 `CopyButton` 处理 Clipboard Promise、权限失败、四态图标、Tooltip 和 `role=status`，合约不应重新实现一套点击与反馈逻辑。
- 信息标签与命令语义保持分离：`MetadataItem` 新增可选 action 插槽，只有真实合约渲染带目标名称的原生按钮；`(native)` 继续表达“没有合约”，不提供无意义动作。

本轮动作：

- `MetadataItem` 增加 `action`，输出 `data-has-action` 和 `metadata-action` 插槽；原有 label、value、icon 与空状态契约不变。
- `TokenContractList` 为非原生合约接入 ghost `CopyButton`，按钮名称包含缩写目标，成功和失败文案分别为“合约地址已复制”“无法复制合约地址”。
- 动作区使用固定尺寸并收紧条目右侧 padding，保留代码字体、完整 title 和元数据边框。

复核结果：

- 390 x 844：真实合约条目为 140.6 x 38px，复制按钮为 32 x 32px；`(native)` 保持 73.6 x 24px 且按钮数为 0，页面 `clientWidth / scrollWidth` 为 `390 / 390px`。
- 1440 x 900：真实合约条目为 136.6 x 34px，复制按钮为 28 x 28px；四条代币记录完整显示，页面 `clientWidth / scrollWidth` 为 `1440 / 1440px`。
- 真实 Clipboard 成功路径写入完整合约，按钮保持焦点并进入 success，状态区输出“合约地址已复制”，1.8 秒后恢复 idle；验证结束后还原原剪贴板。
- Clipboard helper 的 mock 成功与拒绝传播均通过；TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第九十四轮基线

参考：

- MDN Center an element：https://developer.mozilla.org/en-US/docs/Web/CSS/How_to/Layout_cookbook/Center_an_element
- MDN `translate`：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/translate

观察与方法：

- 用户在真实页面中再次指出钱包编号和链 SVG 的可见内容偏向左上；浏览器几何测量虽然显示外框、glyph 和 SVG 中心重合，但盒子中心不能代表字体墨迹和描边的光学重心。
- 钱包编号、Lucide 链 SVG 与资产组图标是三类不同图形，不再共享“零位移即视觉居中”或统一整数偏移；外框只负责 Flex 双轴居中，内部 glyph 通过组件变量承担局部光学校正。
- 钱包编号使用 IBM Plex Mono，降低一位数和两位数不同边距造成的视觉漂移；钱包使用 `0.5px / 0.75px`、链 SVG 使用 `0.5px / 0.5px`，资产组与其他 IdentityMark 保持 `0px`。

本轮动作：

- `IdentityMark` 从绝对铺满 Grid 改为正常流中的嵌套 Flex；glyph 继续占满内容区，但对齐不再依赖绝对定位。
- 新增 `--ui-identity-mark-font / optical-x / optical-y` 三个局部令牌；钱包和链分别输入自己的字体与位移，业务表格和移动账本继续复用同一组件。
- 删除链徽标重复的 Grid 布局声明，SVG 保持固定 20px、块级渲染和零 margin。

复核结果：

- 1440 x 900：8 个首屏钱包和第 2 页 `9-16` 均保持 40 x 40px；glyph 实际字体为 IBM Plex Mono，一位数与两位数的可见文本中心统一落在外框右下约 `0.5px`。
- 桌面 4 个链徽标保持 38 x 38px、SVG 为 20 x 20px，SVG 中心相对外框为 `(+0.5px, +0.5px)`；390px 移动账本外框为 40 x 40px且使用相同校正。
- 资产组 glyph 的 computed translate 仍为 `0px`；390px 与 1440px 页面 `clientWidth / scrollWidth` 分别为 `390 / 390`、`1440 / 1440`。TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第九十五轮基线

参考：

- shadcn Item：https://ui.shadcn.com/docs/components/radix/item
- shadcn Tooltip：https://ui.shadcn.com/docs/components/aria/tooltip
- Tailwind Hover, Focus and Other States：https://tailwindcss.com/docs/hover-focus-and-other-states
- MDN Clipboard `writeText()`：https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText

观察与方法：

- 三处 `WalletAddressList` 都显示压缩后的 EVM/SOL 地址，但没有直接操作；用户必须展开管理行后才能复制，资产总览中的钱包地址则没有同等入口。
- shadcn Item 将内容和 `ItemActions` 分离；同理，地址行保持 listitem 和代码文本语义，复制使用独立的原生按钮，不能把整个地址行伪装成命令。
- 桌面密集表格中的重复动作需要降噪，默认降低 opacity，在父级 hover、focus-within 或异步状态期间强化；触屏端没有可靠 hover，因此保持可见并提供稳定点击区。

本轮动作：

- `WalletAddressList` 增加默认开启的 `copyable` 契约；每条地址接入共享 `CopyButton`，按钮名称包含链类型和压缩目标，成功/失败文案区分 EVM 与 SOL。
- 地址行改为类型、地址、动作三列；桌面 CopyButton 为 24 x 24px、默认 opacity `0.52`，聚焦和异步状态提升到 `1`。
- 760px 以下动作改为 32 x 32px、opacity `0.72`；`copyable=false` 时恢复两列布局，不留下空动作列。

复核结果：

- 1440 x 900：首屏 8 个钱包共 16 个地址动作，地址行 151.8 x 24px、按钮 24 x 24px；钱包管理页 `clientWidth / scrollWidth` 为 `1440 / 1440px`。
- 390 x 844：地址行 159.8 x 32px、按钮 32 x 32px，EVM/SOL 压缩地址均为 `clientWidth / scrollWidth = 86 / 86px`；钱包管理和资产钱包账本均无横向溢出。
- 真实 Clipboard 路径写入完整 `0xef49...dd50` 地址，按钮保持焦点、进入 success、状态区输出“EVM 地址已复制”；桌面聚焦/成功时 opacity 为 `1`，测试后还原原剪贴板。TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第九十六轮基线

参考：

- MDN Center an element：https://developer.mozilla.org/en-US/docs/Web/CSS/How_to/Layout_cookbook/Center_an_element
- MDN `translate`：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/translate

观察与方法：

- 上轮使用全尺寸 Flex glyph 和 `0.5px / 0.75px` 小数位移；外框与 glyph 的盒模型虽接近中心，但 1x 屏幕上的文字和描边会落在半像素，用户仍明确感知钱包编号与链图标偏向左上。
- 身份标记需要把外框、内容槽和光学校准分开：外框维持固定尺寸，内容槽只包裹真实文字或 SVG，再由单一的 `50% / 50%` 锚点定位。
- 钱包文字与链 SVG 使用整数像素校准；资产组图标没有同样的视觉问题，继续保持零位移，避免扩大修正范围。

本轮动作：

- `IdentityMark` 外框改为带定位上下文的中心 Grid；glyph 改为绝对定位的 `max-content` 槽，不再铺满整个内容区。
- glyph 以 `top / left: 50%` 和自身 `-50%` translate 建立唯一中心点，再叠加组件级 optical 变量。
- 钱包编号和链 SVG 的 optical 值统一收敛为整数 `1px / 1px`，消除上一版半像素位移造成的模糊和漂移。

复核结果：

- 1440 x 900：首屏 `1-8` 与第 2 页 `9-16` 的钱包外框均为 40 x 40px；一位数和两位数 glyph 分别为 8.4px 与 16.8px 宽，中心校准都稳定为 `(+1px, +1px)`。
- 桌面 4 个链徽标保持 38 x 38px、SVG 为 20 x 20px；390 x 844 移动账本外框为 40 x 40px，两处 SVG 校准都为 `(+1px, +1px)`。
- 资产组图标继续保持 `(0px, 0px)`；320px 钱包页与 390px 链账本的 `clientWidth / scrollWidth` 分别为 `320 / 320px`、`390 / 390px`。

### 2026-07-22 第九十七轮基线

参考：

- shadcn Item：https://ui.shadcn.com/docs/components/radix/item
- Tailwind Responsive design：https://tailwindcss.com/docs/responsive-design

观察与方法：

- 320px 钱包管理卡片中，身份单元与 75px 操作组共占首行，两条地址只能获得 103px；扣除类型、间距和 32px CopyButton 后，代码文本仅剩 29px，而压缩地址实际需要约 85.8px。
- shadcn Item 将 media、content 和 actions 作为独立槽位；钱包徽标/标题/操作应组成首层，地址属于说明层，不能继续与操作组争抢同一条横向内容带。
- 响应式断点由内容可读性反推：361-375px 的原布局仍只有 70-84px 地址宽度，380px 才完整容纳 86px，因此只在 379px 以下重排。

本轮动作：

- 379px 以下将管理表身份单元改为两列 Grid；钱包徽标与标题占首行，`WalletAddressList` 横跨两列成为第二行，业务 DOM、桌面表格和 380px 以上布局保持不变。
- 地址行收敛为 `28px / minmax / 32px` 三列和 3px 间距；CopyButton 继续保持 32 x 32px，编辑/展开操作组继续保持 75 x 38px。
- 选择框与操作组从整个 110px 身份块的垂直中心移到 40px 首行，分别以 6px / 1px 顶部补偿和徽标、标题对齐。

复核结果：

- 320 x 780：地址行从 103px 增至 153px，代码区从 29px 增至 87px，压缩地址文本实测 85.8px；钱包卡片从 202px 增至 223px，页面 `clientWidth / scrollWidth` 为 `320 / 320px`。
- 361 / 375 / 379px 均使用两层 Item，代码区分别为 128 / 142 / 146px；380 / 390px 自动回到原 Flex 行，地址区保持 86px，桌面 1440px 行高继续为 92px、CopyButton 为 24 x 24px。
- 真实 Clipboard 成功复制完整 EVM 地址并保持按钮焦点；展开/收起地址后详情行数量按 `0 -> 1 -> 0` 变化，焦点返回触发按钮。
- 编辑态输入框自动聚焦，188 x 42px 表单与 238 x 66px 地址列表无重叠；Escape 取消后焦点返回“编辑钱包名称”，全程无横向溢出。

### 2026-07-22 第九十八轮基线

参考：

- shadcn Checkbox：https://ui.shadcn.com/docs/components/radix/checkbox
- W3C WCAG 2.5.8 Target Size (Minimum)：https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

观察与方法：

- 移动资产组选择器在 390px 展开后为 424px 高，6 个条目完整占用 272px 导航区，52px 新增入口稳定留在底部，没有内嵌滚动、截断或横向溢出；该候选审视通过，不做无证据改动。
- 改用真实交互目标扫描后，320px 资产总览只剩“查看钱包状态”为 132 x 28px；钱包管理页 8 个未标注选择框均为 28 x 28px。它们达到 WCAG 2.5.8 的 24px 最低标准，但低于项目既有的 32px 紧凑移动令牌。
- “查看钱包状态”此前只改变钱包 Tab 状态，用户仍停留在页面底部的刷新质量区；命令缺少可见目的地与焦点反馈。

本轮动作：

- 760px 以下未标注 Checkbox 的透明原生 input 与 label 点击区统一为 32 x 32px，可视方框继续保持 18px，不用放大图形换取命中面积。
- 移动钱包行首列从 26px 改为 32px，列间距从 10px 改为 7px、纵向间距保持 10px；379px 以下复选框顶部补偿从 6px 调整为 4px，保持 40px 标题行居中。
- 刷新质量动作在 760px 以下使用 32px 高度；触发后切换到钱包视图，并将焦点与视口移动到 active tabpanel。

复核结果：

- 320px 钱包选择框和原生 input 均为 32 x 32px；选中后行状态变为 selected、批量栏显示“已选 1 个钱包”，再次点击取消且焦点保留。
- 320px 地址行仍为 153px，代码区 87px 大于 85.8px 文本宽度，卡片保持 223px；390px 地址区仍为 86px，页面均无横向溢出。
- “查看钱包状态”在 320 / 600 / 760px 为 132 x 32px，761px 与 1440px 恢复 126 x 28px 桌面密度。
- 点击刷新质量动作后钱包 Tab 激活，钱包 tabpanel 获得焦点并滚动到视口顶部约 28px；320px 资产总览与钱包管理页重新扫描后，低于 32px 的可见交互目标均为 0。

### 2026-07-22 第九十九轮基线

参考：

- shadcn Button：https://ui.shadcn.com/docs/components/radix/button
- MDN `aria-disabled`：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled
- Tailwind Hover, Focus and Other States：https://tailwindcss.com/docs/hover-focus-and-other-states

观察与方法：

- 移动端选择钱包 1 后，目标资产组默认仍为该钱包所在的“未分类”，但“移动”命令保持可用；点击会进行无意义持久化并给出虚假的成功反馈。
- 原生 `disabled` 会把按钮移出 Tab 顺序；对于“命令重要但当前无效”的情况，MDN 建议使用 `aria-disabled` 保留可发现性，同时由应用代码显式阻止执行。
- 禁用原因不能只放在 hover tooltip 中；触屏用户首先需要从按钮文案理解状态，因此同组目标直接显示“已在此组”，tooltip 和可访问名称再提供完整原因。

本轮动作：

- 共享 `Button` 增加 `disabledReason`：有原因的禁用按钮使用 `aria-disabled`、保留焦点和 Tooltip，点击路径在组件内被阻止；没有原因的普通禁用按钮继续使用原生 `disabled`。
- 所有 Button 的 hover / active 选择器排除 `aria-disabled=true`，并把该状态纳入统一的禁用透明度和 `not-allowed` 光标，避免禁用命令悬停时重新显得可用。
- 批量移动根据所选钱包与目标资产组计算实际可移动数量；全部已在目标组时显示 CheckCircle2 和“已在此组”，底层 `assignWalletGroups` 再过滤未变化项，避免绕过界面的空写入。
- 379px 以下将目标资产组选择器独占一行，“已在此组”和清除命令位于下一行；380px 以上继续保持单行密集布局。

复核结果：

- 钱包 1 位于“未分类”且目标相同时，DOM 暴露 `aria-disabled` 按钮，可访问名称为“已选钱包都在‘未分类’中，无需移动。”，可见文案为“已在此组”。
- 目标切到 Virtuals 后按钮恢复为“移动”；真实移动提示“1 个钱包已移到‘Virtuals’”，恢复测试提示“1 个钱包已移到‘未分类’”，钱包配置已回到测试前状态。
- 320px 与 379px 使用两行操作区，目标“移到 未分类”完整显示；380px 与 390px 使用单行操作区，按钮、选择器和清除命令均无重叠或横向截断。
- TypeScript 与 Vite 生产构建通过；移动和桌面测试结束后均清除了临时选择状态。

### 2026-07-22 第一百轮基线

参考：

- MDN `Intl.NumberFormat()`：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
- shadcn Table：https://ui.shadcn.com/docs/components/radix/table
- Tailwind `font-variant-numeric`：https://tailwindcss.com/docs/font-variant-numeric

观察与方法：

- 同一 USDT 余额在钱包持仓中显示为 `199.096`，币种事实区却显示 `199.0957225`；VIRTUAL 同样分别显示 `89.078` 与 `89.07836576`，扫描密度和数值层级不一致。
- 表格与移动账本需要先服务比较和排序，因此可见值应控制长度；完整链上数量仍属于有效信息，不能因视觉取整而从辅助技术和桌面悬停路径中消失。
- `Intl.NumberFormat` 的 `maximumFractionDigits / maximumSignificantDigits / notation: compact` 分别适合常规余额、小数余额和大额缩写；规则必须集中，否则组件会再次漂移。

本轮动作：

- 新增共享 `QuantityValue`：非有限值归零，绝对值不低于一百万时使用最多 3 位小数的 compact；不低于 1 时保留最多 3 位小数；小于 1 时保留最多 6 个有效数字。
- 完整数值使用最多 15 个有效数字，对应 JavaScript Number 的可信精度；可见值通过 `aria-hidden` 与辅助文本分层，取整时 `title` 提供“完整数量”。
- 币种桌面表、移动 LedgerItem 事实区和 `TokenHoldingList` 全部接入同一组件，删除 App 与 TokenIdentity 内两套重复 formatter；组件统一使用 tabular nums 和 nowrap。

复核结果：

- USDT 从 `199.0957225` 收敛为 `199.096`，VIRTUAL 从 `89.07836576` 收敛为 `89.078`；ETH 仍显示 `0.00143748`，完整辅助值保留为 `0.001437480948`。
- 边界函数实测：`1e-13 -> 0.0000000000001`、`1,234,567.89 -> 1.235M`，NaN 与 Infinity 均回退为 `0`；常见浮点尾噪不会进入完整值。
- 320 / 390 / 1440px 币种视图的 `clientWidth / scrollWidth` 分别为 `320 / 320`、`390 / 390`、`1440 / 1440px`；桌面币种表和钱包持仓标签均无截断或重叠。
- TypeScript 与 Vite 生产构建通过，四个资产视图完成移动审视，资产组、链和钱包结构没有发现需要强改的新问题。

### 2026-07-22 第一百零一轮基线

参考：

- MDN `Intl.NumberFormat.formatToParts()`：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/formatToParts
- shadcn Data Table Cell Formatting：https://ui.shadcn.com/docs/components/base/data-table#cell-formatting
- Tailwind `font-variant-numeric`：https://tailwindcss.com/docs/font-variant-numeric

观察与方法：

- 美元金额在 App、PortfolioSummary、TokenIdentity、TokenMetadata 与 RefreshHealth 中分别维护一套 `currency()`；规则虽然暂时相同，但任何精度、无效值或视觉调整都必须同步五处。
- shadcn 的金额列使用统一 formatter、右对齐与中等字重；Tailwind 的账单示例进一步使用 tabular numerals，使不同位数在扫描和比较时保持稳定宽度。
- `formatToParts()` 可以在不拼接字符串的情况下区分 currency、integer、group、decimal 与 fraction。货币符号和小数可以在视觉上降权，但完整金额仍必须作为连续文本提供给辅助技术。

本轮动作：

- 新增共享 `CurrencyValue`、`formatCurrency` 与 `formatExactCurrency`：非有限值和负零归零，绝对值低于 1000 时显示美分，不低于 1000 时显示整数美元；发生可见舍入时通过 title 和隐藏文本保留两位小数的完整金额。
- 可见金额使用 `formatToParts()` 输出，货币符号为主字号的 0.78、小数位为 0.88；整体使用 IBM Plex Mono、lining nums、tabular nums 和 nowrap，不让局部字号改变列宽或基线。
- 资产摘要、资产组/链/币种/钱包四类账本、主要持仓、链分布与刷新历史全部接入共享组件；只有图表描述和 title 等纯文本路径调用共享 formatter。
- `LegendItem` 明确排除原生 `li.value` 后再接受 ReactNode，修复复合金额值被原生属性类型错误收窄的组件契约。

复核结果：

- 1440px 下资产组、链、币种、钱包视图分别渲染 26 / 38 / 26 / 16 个共享金额实例；币种视图同时保留 8 个 `QuantityValue`，四个视图页面宽度均为 1440 / 1440px。
- 320px 钱包视图与 390px 资产组视图页面宽度分别为 320 / 320px、390 / 390px；390px 的 26 个金额实例均为 `scrollWidth <= clientWidth`，没有局部截断。
- 主金额在 320px 下为 36px，符号 28.08px、小数 31.68px；隐藏精确值保持 1 x 1px，不参与布局。`$1,234.56` 的大额样例可见为 `$1,235`，title 与辅助文本仍为 `$1,234.56`。
- 格式边界验证覆盖 0、负零、正负值、999.999、1000、1234.56、NaN 与 Infinity；浏览器控制台无 warning/error，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第一百零二轮基线

参考：

- MDN `<time>` element：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/time
- MDN `Intl.RelativeTimeFormat`：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat
- shadcn Tooltip：https://ui.shadcn.com/docs/components/radix/tooltip
- Tailwind `font-variant-numeric`：https://tailwindcss.com/docs/font-variant-numeric

观察与方法：

- 资产摘要通过 App 内的 `formatDate()` 输出绝对时间，刷新质量通过组件内的 `ageDetails()` 输出相对时间；两条路径分别决定无效值、精度和中文间距，无法保证一致。
- “07/18 12:01”和“4 天前”都只是普通 span 文本，没有机器可读 `datetime`，相对文本也没有直接关联到精确到秒的时间。
- MDN 要求时间数据使用 `<time datetime>` 提供无歧义机器值；`Intl.RelativeTimeFormat` 负责本地化“5分钟前 / 4天前 / 1个月前”，不应在业务组件里手拼单位。
- shadcn Tooltip 依赖 hover 或键盘焦点。时间是信息而不是命令，不为了显示完整时间给普通文本增加额外 Tab 停靠点；精确值使用 title，页面本身继续保留可见的绝对时间。

本轮动作：

- 新增共享 `TimeValue`、`formatDateTime`、`formatExactDateTime` 与 `relativeTimeDetails`；有效值渲染 `<time datetime="ISO">`，无效值回退普通 span 和“尚未刷新”。
- `absolute` 模式显示 `MM/DD HH:mm`，`relative` 模式使用 `Intl.RelativeTimeFormat`；两种模式的 title 都保留本地精确到秒的完整时间。
- 相对时间继续输出 fresh / aging / stale 三档语义：8 小时内新鲜、3 天内老化、之后过期；超过 30 天和 365 天分别自动切换为月和年，未来时间使用“分钟后”等正确方向。共享分钟级时钟会让长期打开的页面自动推进文案和状态色，没有时间值时不启动定时器。
- PortfolioSummary 改为接收原始 `updatedAt`，RefreshHealth 删除本地 age formatter，钱包旧数据详情改用共享绝对时间 formatter；时间统一使用 lining nums、tabular nums 和 nowrap。

复核结果：

- 当前快照同时渲染两个共享时间实例：绝对时间 `07/18 12:01`、相对时间 `4天前`；两者的 `datetime` 都是 `2026-07-18T04:01:37.990Z`，title 都是本地精确时间 `2026/07/18 12:01:37`。
- 320 / 390 / 1440px 页面宽度分别与视口一致；绝对时间约 69px、相对时间约 29px，均没有截断或改变摘要高度。
- 固定时钟边界验证覆盖空值、30 秒、5 分钟、9 小时、2 / 4 / 45 / 400 天和未来 5 分钟；输出依次覆盖刚刚、分钟、小时、天、月、年、未来方向以及三档 freshness tone。
- 静态渲染确认有效值输出 `time + datetime + title`，无效值输出普通 span；浏览器控制台无 warning/error，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第一百零三轮基线

参考：

- MDN `place-items`：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/place-items
- MDN `inset`：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/inset
- Lucide React：https://lucide.dev/guide/react

观察与方法：

- 钱包编号与链图标已经复用 `IdentityMark`，但内部 glyph 仍以 `50% / 50%` 锚点定位，再叠加业务级 `(1px, 1px)` translate；外框、内容槽和图形因此没有共享同一个几何中心。
- 同一个经验位移同时作用于 IBM Plex Mono 数字与 Lucide SVG，无法形成稳定的跨图形规则。固定尺寸身份标记应先保证可重复测量的双轴几何居中，单个源图形确有不对称时再在图形自身处理。
- `inset: 0` 为绝对定位内容建立完整可用区域，Grid 的 `place-items: center` 同时沿块轴与行内轴居中，可以只保留一条定位路径。

本轮动作：

- `identity-mark-glyph` 改为绝对铺满身份标记内容区的 Grid，宽高固定为 100%，由 `place-items: center` 统一承载文字和 SVG。
- 删除 wallet-badge 与 chain-badge 的 x / y 光学位移变量，同时删除 glyph 的 translate 计算；资产组继续复用同一 IdentityMark，不增加旁路样式。
- Lucide SVG 继续使用固定尺寸、块级显示和零 transform，避免基线、行盒或二次变换重新参与定位。

复核结果：

- 1440px 桌面页：8 个可见钱包标记的 40px 外框与 38px glyph 中心差均为 `(0px, 0px)`；4 个链标记的 38px 外框、36px glyph 与 20px SVG 中心差均为 `(0px, 0px)`。
- 390px 移动链账本的 4 个可见链标记均为 40px，glyph 与 SVG 中心差为 `(0px, 0px)`；390px 与 320px 钱包页的可见钱包标记同样保持零偏差。
- 320 / 390 / 1440px 页面 `clientWidth` 与 `scrollWidth` 分别一致，没有新增横向溢出；资产组图标中心差仍为 `(0px, 0px)`。
- 浏览器控制台无 warning/error，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第一百零四轮基线

参考：

- MDN `Intl.NumberFormat()`：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
- WAI-ARIA APG Meter Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/meter/
- WAI-ARIA Range Properties：https://www.w3.org/WAI/ARIA/apg/practices/range-related-properties/
- Tailwind `font-variant-numeric`：https://tailwindcss.com/docs/font-variant-numeric

观察与方法：

- PortfolioSummary 与 ChainExposure 分别维护一套 `percentage()` 和 `<0.1 / toFixed(1)`，RefreshHealth 又使用 `Math.round()`；同一页面因此同时出现 `100.0%`、`22.0%` 和 `6%` 三种精度策略。
- 资产占比属于已知 0–100 范围内的标量，适合 meter；WAI-ARIA 要求 `aria-valuenow` 保留范围内的当前小数值。可见文字可以为了扫描取整，但不能反向覆盖 meter 的真实值。
- `Intl.NumberFormat` 的 percent style、最大小数位和 formatToParts 可以集中处理尾零、数字片段与百分号；比例列使用 lining / tabular nums，避免不同位数造成水平跳动。

本轮动作：

- 新增共享 `PercentageValue`、`formatPercentage`、`formatExactPercentage`、`clampPercentage` 与 `percentageOf`；输入统一使用百分比点并裁剪到 0–100，非法值和无效分母回退为 0。
- 默认可见精度为一位小数且自动移除无意义尾零；非零小值显示 `<0.1%`。最小可见阈值随精度变化，整数模式下非零小值显示 `<1%`，不会误写成 `0%`。
- 组件通过 formatToParts 分离整数、小数和百分号，百分号与小数位适度降权；发生取整时 title 保留最多 9 位小数的完整比例，并输出 rounded / threshold / precision 数据状态。
- 资产组与链的 AssetShareBar、链分布图例和刷新有效覆盖率全部接入共享组件；MeterBar 继续接收未格式化小数，覆盖率的 aria-valuetext 继续说明“总钱包数 / 可用钱包数”。

复核结果：

- 资产组占比从 `100.0%` 收敛为 `100%`；链视图显示 `76.9% / 22% / 0.4% / 0.4%`，去除 `22.0%` 的冗余尾零；刷新覆盖率保持 `6%`。
- 四个链 meter 的可见标签完成统一，但 `aria-valuenow` 仍分别保留 `76.9431316464708`、`21.987980269145538`、`0.4128666133608977` 与 `0.39464790580747633`；覆盖率继续保留 `6.25` 和钱包数 valueText。
- 边界函数验证覆盖 NaN、负值、0、0.0001、0.04、0.1、0.3946、6.25、22、76.943、100 与 101；默认和整数模式分别正确输出 `<0.1%` 与 `<1%`，范围外值均被裁剪。
- 320 / 390 / 1440px 页面宽度分别与视口一致，所有可见 PercentageValue 均为 `scrollWidth <= clientWidth`；浏览器控制台无 warning/error，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第一百零五轮基线

参考：

- MDN `<data>` element：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/data
- MDN `Intl.NumberFormat()`：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
- shadcn Data Table：https://ui.shadcn.com/docs/components/base/data-table
- Tailwind `font-variant-numeric`：https://tailwindcss.com/docs/font-variant-numeric

观察与方法：

- 钱包、币种、链和状态计数此前散落在摘要、资产账本、刷新健康、钱包管理与分页中，由业务组件直接插值；单个计数没有机器可读值，`1 / 16`、`1 / 30` 与 `1-8` 也没有稳定的分隔符权重和基线规则。
- MDN 的 `<data value>` 可以把可见内容关联到机器可读值；计数仍保留自然语言上下文，既不额外制造可聚焦控件，也不把读屏文案藏进 title。
- `Intl.NumberFormat` 负责整数分组，lining / tabular nums 负责纵向扫描时的数字宽度；成对计数使用同一个内联布局，分隔符只做视觉降权，不改变文本顺序。

本轮动作：

- 新增共享 `CountValue`：非有限值回退为 0，输入四舍五入并裁剪为非负整数，以 `en-US` 分组格式渲染 `<data value>`，同时暴露 zero / positive 状态。
- 新增 `CountPair`：组合两个 `CountValue`，统一 `/` 和分页范围 `–` 的间距、字号、字重与基线；首尾原值写入 data 属性，业务组件不再手拼范围。
- 资产摘要、资产组、链、币种、钱包、刷新健康、钱包管理和 Pagination 的可见计数接入共享原子；纯通知、aria-label 与 tooltip 中的自然语言数字继续保持文本，不为了复用组件破坏语义。

复核结果：

- 静态渲染确认 `1,234,567` 输出 `<data value="1234567">`，`1 / 30` 输出两个独立 `<data>` 与一个低权重分隔符；NaN、Infinity、负数和负零均回退为 0，1.4 / 1.5 分别取整为 1 / 2。
- 320px 钱包管理、390px 资产组与链视图、1440px 四类总览和钱包管理均无横向溢出；移动链卡片的 `1 / 1` 钱包/币种事实保持同一基线，分页范围和摘要覆盖率没有挤压相邻内容。
- 浏览器 DOM 确认所有共享计数保留 `value`、first / second 与 zero / positive 状态；控制台无 warning/error，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第一百零六轮基线

参考：

- shadcn Toggle Group：https://ui.shadcn.com/docs/components/radix/toggle-group
- WAI-ARIA APG Radio Group Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/radio/
- Tailwind Hover, Focus, and Other States：https://tailwindcss.com/docs/hover-focus-and-other-states
- tweakcn Dashboard Theme Editor：https://tweakcn.com/editor/theme?p=dashboard

观察与方法：

- 资产组已经支持创建、重命名、删除和钱包归类，但颜色只能按索引自动分配；用户无法建立稳定的主题色记忆，同色冲突也只能被动接受。
- shadcn 的 single Toggle Group 提供了紧凑的成组控制视觉，但资产组颜色始终必须有一个有效值，不应允许再次点击后清空选择；WAI radio group 的“一组最多一个 checked”语义和原生方向键行为更符合这个约束。
- 颜色不能成为唯一状态信号。每个 swatch 需要可访问名称、fieldset legend、原生 checked 状态和非颜色的 Lucide Check；hover、active 与 focus-visible 只强化交互，不代替选择状态。

本轮动作：

- 新增共享 `ColorSwatchGroup`：使用 fieldset、legend 和受控 native radio，提供 sm / md 两档尺寸、六色 data token、中文名称、选中 Check、焦点环、按压反馈和禁用态。
- 创建资产组时可以先选择颜色，创建成功后自动推进到下一建议色；编辑资产组时名称和颜色在一个编辑面板中预览并一次保存，文件夹标记实时反映待保存颜色。
- `InlineEdit` 新增 `externallyDirty` 契约；文本未变但颜色已变时仍进入 dirty 状态并允许保存，纯名称编辑的原有 unchanged / invalid / dirty 规则保持不变。
- 编辑色板使用 25px 目标与 4px 间距，在 178px 内容列中六色单行；创建色板使用 28px 目标，保留更宽的直接操作面积。

复核结果：

- 静态渲染确认色板输出 fieldset、可见 legend、具名 radio 和唯一 checked；`InlineEdit` 在相同文本下由 `externallyDirty` 正确从 unchanged / aria-disabled 切换到 dirty / 可保存。
- 真实交互中，创建色板从绿切到红后表单进入 ready；编辑色板从绿切到蓝时文件夹预览同步变化，取消后恢复绿并将焦点返回编辑按钮。
- 只修改颜色后保存，提示“资产组已更新。”；整页重载后 OKX Boost 仍为蓝色，随后恢复绿色并再次重载确认，未留下测试状态。
- 1440px 编辑列六色为一行，320 / 390px 展开面板和编辑器均无横向溢出；25 / 28px radio 目标均不低于 24px，320px 编辑器宽 272px、高 85px。
- 浏览器控制台无 warning/error，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第一百零七轮基线

参考：

- shadcn Sheet：https://ui.shadcn.com/docs/components/radix/sheet
- WAI-ARIA APG Modal Dialog Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- MDN `align-items`：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/align-items
- MDN `justify-content`：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/justify-content

观察与方法：

- 颜色选择加入资产组侧栏后，320 / 390px 的内联折叠面板会把钱包列表整体向下推，并同时承担导航、编辑和创建三类任务；窄屏更适合把补充管理任务放进不改变页面流的 Sheet。
- shadcn Sheet 复用 Dialog 语义承载补充内容；WAI 模态模式要求背景不可交互、焦点圈定在弹层内、Escape 关闭，并在关闭后把焦点交还触发控件。
- 钱包编号、链图标和资产组图标虽然共用 IdentityMark，但内部居中仍依赖 Grid 简写。用户再次明确感知 glyph 偏左上后，原子层需要把横轴和纵轴约束写成可直接从 computed style 复核的规则。

本轮动作：

- 980px 以下的资产组管理从内联 Collapsible 迁入现有 Radix Dialog：680px 以下使用 78dvh 底部 Sheet，681-980px 使用最大 520 x 720px 的居中 Dialog；页面只保留显示当前资产组和钱包数的入口。
- 导航区在 DialogBody 内独立滚动，创建表单固定在内容底部；桌面继续渲染 260px sticky 侧栏，同一时刻只存在桌面或移动一份表单和 ID。
- 新增 `useMediaQuery` 响应式原子，删除 App 中让面板随断点自动开合的重复监听；路由切换、浏览器返回和资产组选择都会关闭移动弹层。
- Dialog 显式输出 `aria-modal=true`，沿用标题初始焦点、Radix 焦点圈定、Escape 关闭和触发按钮焦点返回。
- IdentityMark 的直属 glyph 改为全尺寸 Flex，显式使用 `align-items: center` 与 `justify-content: center`；文字和 Lucide SVG 均清除 margin / padding / transform，钱包、链和资产组不再维护各自的定位旁路。

复核结果：

- 1440px 桌面钱包标记的 40px 外框与 38px glyph 中心差为 `(0px, 0px)`；资产组 30px 外框与 15px SVG 中心差同样为 `(0px, 0px)`。链标记复用同一个 IdentityMark icon 路径。
- 390 x 844 打开 Sheet 前后，首个钱包行 y 坐标均为 531.875px；Sheet 为 390 x 658.31px，初始焦点位于“资产组管理”标题，Escape 关闭后回到触发按钮。
- 320 x 720 的 Sheet 为 320 x 561.59px，导航与创建区重叠为 0，列表为单列；768 x 900 的 Dialog 为 520 x 720px，列表为双列，页面均无横向溢出。
- 移动端选择 OKX Boost 后 Dialog 自动关闭，入口和钱包列表摘要同步为该资产组；1440px 只保留一份桌面内容，不渲染移动触发器或 Dialog。
- 浏览器控制台无 warning/error，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第一百零八轮基线

参考：

- shadcn Collapsible：https://ui.shadcn.com/docs/components/radix/collapsible
- WAI-ARIA APG Disclosure Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- Tailwind Transition Property：https://tailwindcss.com/docs/transition-property

观察与方法：

- 资产总览、320px Tabs、390px 批量操作条和移动触控目标均通过当前审视；批量操作条已使用 sticky，视口内没有低于 32px 的交互目标，因此不为了轮次重构成熟组件。
- 钱包地址展开按钮只有 `aria-expanded`，没有稳定的 `aria-controls` 目标；开合时替换 ChevronRight / ChevronDown 两个 SVG，也没有复用已有 Collapsible 的方向与 reduced-motion 规则。
- WAI disclosure 由原生 button 和受控内容构成，button 通过 `aria-expanded` 表达状态并可用 `aria-controls` 指向内容；shadcn Collapsible 同样把 Root、Trigger、Content 和受控 open 状态分层。

本轮动作：

- 新增共享 `DisclosureIconButton`，组合 IconButton 与 CollapsibleChevron，集中 collapsed / expanded 名称、受控目标、状态数据、方向和单一 Lucide Chevron。
- 每个钱包详情行获得稳定 ID，并在关闭态继续留在 DOM 中使用 hidden 隐藏；触发器与目标不再只在展开后短暂建立关系。
- 详情按钮名称加入钱包名，例如“展开钱包 1地址 / 收起钱包 1地址”，避免同表多个无上下文的重复按钮名称。
- 单一右向 Chevron 在 open 时旋转 90°；详情内容使用 160ms、4px 的轻量进入动画，全局 prefers-reduced-motion 规则继续把动画和 transition 压缩到近零。

复核结果：

- 关闭态共有 8 个 Disclosure 按钮、8 个唯一 controls ID 和 8 个真实目标，重复 ID 为 0；所有详情行 display=none，且不出现在无障碍快照中。
- 1440px 鼠标展开后按钮保持焦点，aria-expanded 变为 true，名称变为“收起钱包 1地址”，Chevron 矩阵为 90°，详情行 display=table-row 并显示 2 个地址；再次关闭后目标恢复 hidden。
- 390 x 844：按钮保持 38 x 38px，详情行为 368px 宽，内容与页面没有横向溢出；320 x 720：详情目标 clientWidth / scrollWidth 为 298 / 298px，两个地址项均为 238 / 238px。
- 组件继续输出原生 button，不增加自定义键盘状态机，保留 Enter / Space 默认激活语义；浏览器控制台无 warning/error，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第一百零九轮基线

参考：

- MDN `hidden` global attribute：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden
- Tailwind CSS Display：https://tailwindcss.com/docs/display
- Tailwind CSS Visibility：https://tailwindcss.com/docs/visibility

观察与方法：

- 390px 钱包管理中，详情按钮处于 `aria-expanded=false` 且详情行带有 `hidden`，但移动断点仍把所有详情行显示为 `block`；第一屏已经泄漏首个钱包的地址编辑面板。
- MDN 明确说明，作者 CSS 修改 `display` 会覆盖浏览器对 `hidden` 的默认隐藏；Tailwind 也把 `hidden` 定义为 `display: none`，并区分保留布局空间的 `visibility`。
- 隐藏是组件状态，不是某一业务详情行的装饰样式。Table 原子必须保证 `hidden` 的语义优先于桌面 `table-row`、移动 `block` 或未来任何响应式展示模式。

本轮动作：

- 将钱包专用 `.wallet-detail-row[hidden]` 规则上移为共享 `.ui-table-row[hidden]` 契约，覆盖所有通过 TableRow 渲染的可折叠、分页或条件行。
- 共享规则使用窄范围 `!important`，只保护原生 `hidden` 状态，避免更高 specificity 或更晚出现的响应式 `display` 再次把隐藏内容渲染出来。
- 详情行打开时仍由移动端 `display: block` 和桌面表格布局分别接管；关闭时继续保留稳定 ID，保证 disclosure 的 `aria-controls` 目标存在。

复核结果：

- 390px 与 320px 关闭态详情行均保持 `hidden=true`、`display=none`，页面不再显示地址编辑面板；8 个触发器仍各自关联 8 个唯一目标。
- 点击首个触发器后，390px 详情行切换为 `display=block`、按钮变为 `aria-expanded=true`，再次关闭恢复 `display=none`；桌面打开态继续使用 `display=table-row`。
- 320 / 390 / 1440px 均无横向溢出，浏览器控制台无 warning/error，TypeScript 与 Vite 生产构建通过。

### 2026-07-22 第一百一十轮基线

参考：

- shadcn Tabs：https://ui.shadcn.com/docs/components/base/tabs
- Tailwind CSS Animation：https://tailwindcss.com/docs/animation
- MDN `prefers-reduced-motion`：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion

观察与方法：

- 320 / 390 / 1440px 的总览与钱包管理均没有横向溢出，移动操作菜单能把低频命令收进 190px 宽的具名 menu，现有成熟结构不需要为了轮次重排。
- 资产组、链、币种和钱包已经使用 Radix Tabs 的 Root、List、Trigger、Content 分层，焦点与 selected 状态正确；但 active 面板的 computed `animation-name` 为 `none`，切换后整块数据直接替换，缺少轻量的状态反馈。
- 业务后台的 motion 应服务于位置连续性，而不是制造表演性。只使用 opacity 和极短距离 translate，不使用缩放、弹跳或会触发布局重排的属性。

本轮动作：

- 为共享 `.ui-tabs-content[data-state="active"]` 增加 150ms 的进入动画，从 0.72 opacity 和 3px 下移恢复到自然状态。
- 动画只在 Radix 把面板标记为 active 时执行，不给 Trigger 增加重复动效，也不把不可见面板保留在视觉层。
- 延续全局 `prefers-reduced-motion` 契约：系统要求减少动态效果时，动画时长被压缩到近零，不依赖 JavaScript读取偏好。

复核结果：

- 点击链、币种和钱包 Tab 后，active panel 的 animationName 均为 `ui-tabs-content-enter`、duration 为 0.15s，选中状态与焦点继续留在对应原生 tab。
- 320 / 390 / 1440px 切换期间与结束后页面宽度均等于视口宽度，面板没有横向溢出或布局位移；移动操作菜单的尺寸和定位保持不变。
- 样式审计确认全局 `prefers-reduced-motion: reduce` 规则仍以 `animation-duration: 0.01ms !important` 覆盖该动画；浏览器控制台无 warning/error，TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百一十一轮基线

参考：

- shadcn Avatar：https://ui.shadcn.com/docs/components/radix/avatar
- W3C WAI Images Tutorial：https://www.w3.org/WAI/tutorials/images/
- MDN `<img>`：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img

观察与方法：

- TokenIcon 虽然已经有远程图片失败后的生成图兜底，但加载态仍通过 `::before { content: attr(data-fallback-label) }` 输出 US、VI、ET、OK 等缩写；总览快照会在 USDT、VIRTUAL 等真实名称之外重复暴露这些文本。
- shadcn Avatar 把 Image 与 Fallback 作为同一原子的两个显式层；W3C 和 MDN 要求邻近文本已经提供名称时，装饰图片使用空 `alt`，避免把视觉标识重复读成内容。
- 代币标识需要同时满足“首帧不空白、远程失败可恢复、名称不重复”。把生成 SVG 保持在底层，再让远程图片在成功后淡入，比伪元素文字和替换单一 src 更稳定。

本轮动作：

- TokenIcon 改为显式双层图片：始终渲染生成 SVG fallback，仅在有远程来源且未失败时渲染覆盖层；远程图加载成功后以 140ms opacity 过渡显现。
- 两层图片都使用 `alt=""`，外层继续 `aria-hidden=true`；代币名称仍由相邻 HoldingItem、表格标题或 LedgerItem 提供，不让图形重复参与命名。
- 删除 `data-fallback-label` 与所有 `::before` 文字占位样式；远程失败时卸载覆盖层并继续显示已在底层的生成图，不再发生空白切换。

复核结果：

- 静态渲染中，已知远程币种输出 fallback + remote 两个空 alt 图片，未知币种只输出一个 fallback 图片；组件不再包含 `data-fallback-label` 或可读伪元素文字。
- 当前 USDT、VIRTUAL、ETH、OKB 均进入 ready / remote 状态；移动端快照不再在真实币种名称之外出现 US、VI、ET、OK 文本，四个图标仍完整显示。
- 320 / 390 / 1440px 的图标中心、持仓 chip 高度和页面宽度保持不变；浏览器控制台无 warning/error，TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百一十二轮基线

参考：

- shadcn Table：https://ui.shadcn.com/docs/components/base/table
- Tailwind CSS Overflow：https://tailwindcss.com/docs/overflow
- MDN Positioning：https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Positioning
- Tailwind CSS Height：https://tailwindcss.com/docs/height

观察与方法：

- SearchField 已具备 Escape 清空、焦点回归、动态清除按钮和 42px 移动输入高度；320px 清除按钮为 30px，分页四个按钮均为 32px，继续修改只会增加无效 churn。
- 1440 x 600px 的钱包管理存在更实际的扫描问题：页面最大滚动 296px，滚到底部时表格容器 top 和 sticky 表头 top 都为 -42px，用户查看钱包 4-8 时无法再看到列名。
- MDN 指出 sticky 相对最近的 scrolling mechanism 生效；Table 为横向响应式而设置的 overflow 同时成为纵向滚动祖先。因此正确方向不是把表头粘到 viewport，而是让该容器获得适合当前动态视口的内部高度，并减少外层页面的额外高度。

本轮动作：

- 删除 management-content 的 680px 强制最小高度，让钱包工作区由工具栏、表格和分页的真实内容决定高度。
- management-table-container 继续使用 `calc(100dvh - 260px)`，但 clamp 下限从 420px 调整为 280px；低高度桌面优先收缩内部可滚动表格，高视口仍保留 680px 上限。
- 680px 以下仍使用现有移动卡片布局和 `max-height: none; overflow: visible`，不引入嵌套滚动；本轮只改变桌面/平板数据表视口。

复核结果：

- 1440 x 600px 页面最大滚动从 296px 降至 75px；滚到底部后表格容器与 sticky 表头 top 均保持 178.875px，列名始终与钱包行同时可见。
- 内部表格可滚动距离为 447px；滚到底部后表头仍固定在容器顶端，分页保持在工作区底部，钱包 8 可完整操作。
- 1440 x 900px 继续使用 640px 表格高度；320 / 390px 仍为自然高度卡片列表，搜索清空、分页和详情展开行为不变，所有视口无横向溢出。
- 浏览器控制台无 warning/error，TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百一十三轮基线

参考：

- shadcn Sheet：https://ui.shadcn.com/docs/components/radix/sheet
- WAI-ARIA APG Modal Dialog Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- WCAG 2.2 Target Size (Minimum)：https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum

观察与方法：

- 刷新范围已经使用 Radix Dialog 的标题、描述、焦点约束和固定底部操作区；320 x 720px 打开时初始焦点位于标题，弹层宽度等于视口且没有横向溢出。
- 该尺寸下正文可视高度为 494px、实际内容高度为 545px，只多出 51px；最后一项“包含风险/自定义 token”因此被底部操作区截断，且短距离滚动没有明显提示。
- WCAG 2.2 的最低目标尺寸为 24 x 24 CSS px。本轮不缩小 Checkbox 控件本身，只在移动断点把每个链选项从 44px 调整为 40px，并压缩网格与段落留白。

本轮动作：

- 680px 以下把刷新范围正文段落间距从 18px 调整为 14px，链网格间距从 8px 调整为 6px。
- 链选项保持两列，把最小高度从 44px 调整为 40px、水平内边距从 11px 调整为 9px；可点击目标仍显著高于 24px 最低要求。
- 设置分隔区顶部留白从 17px 调整为 12px。所有改动限定在移动断点，桌面三列网格、44px 选项和原有间距不变。

复核结果：

- 320 x 720px 下 14 个链选项、“包含风险/自定义 token”和固定底部操作区全部同时可见，不再需要为最后 51px 内容滚动；弹层宽度等于视口，页面无横向溢出。
- 390 x 844px 同样完整显示所有设置；1440 x 900px 继续保持三列链网格、44px 选项和居中 Dialog，移动端紧凑规则没有影响桌面。
- 初始焦点仍位于“刷新范围”标题；移动端按 Escape 后焦点回到“更多资产操作”，桌面点击关闭按钮后焦点回到“刷新范围”入口。
- 浏览器控制台无 warning/error，TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百一十四轮基线

参考：

- shadcn Dropdown Menu：https://ui.shadcn.com/docs/components/base/dropdown-menu
- Radix Dropdown Menu：https://www.radix-ui.com/primitives/docs/components/dropdown-menu
- WAI-ARIA APG Menu Button Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/

观察与方法：

- 本轮先实测 Checkbox、Select、批量操作条、空结果和删除确认：移动钱包 Checkbox 已有 32px 命中区，Select 选项、320px 两行批量操作条、空状态和 AlertDialog 均无截断或交互缺口，不重复改写成熟原子。
- 桌面资产组行仍有明显的可发现性问题：非活动行的编辑和删除按钮只有 hover / focus-within 时才出现；移动 Sheet 又永久并列两个小图标，两个布局表达同一组次级命令却不一致。
- shadcn 将相关命令组合到 Dropdown Menu，并为不可逆命令提供 destructive 变体；Radix 遵循 menu button 模式，负责 `aria-haspopup / aria-expanded`、菜单焦点、方向键和 Escape 返回。

本轮动作：

- 每个可管理资产组改为一个始终可见的 Lucide MoreHorizontal 图标按钮；菜单内用图标与文字提供“编辑资产组”和“删除资产组”，系统资产组只显示允许的编辑命令。
- 共享 DropdownMenuItem 新增 `default / destructive` 变体和稳定 `data-variant`，删除命令使用红色文字与浅红高亮，不再由业务组件临时覆盖菜单内部样式。
- 导出桌面和移动布局共用的资产组选择按钮、操作按钮 ID 生成器；ConfirmDialog 的 fallbackFocusIds 优先指向原资产组操作入口，删除成功导致入口卸载时再回退到“未分类”或“全部钱包”。

复核结果：

- 320 / 390px Sheet 中 5 个资产组各保留一个 32px 更多按钮，菜单宽 160px，编辑与删除命令完整显示；1440px 侧栏同样永久显示 5 个入口，不再要求用户猜测悬停位置。
- 菜单拥有具名 menu 和 menuitem；Escape 关闭菜单后焦点回到触发器，选择编辑后输入框自动聚焦，取消编辑再次回到同一更多按钮。
- 桌面和移动端从菜单进入删除确认后，取消均精确返回原资产组操作入口；菜单正常关闭，移动资产组 Sheet 保持打开。
- 320 / 390 / 1440px 的 document 与 body 宽度均等于视口宽度；浏览器控制台无 warning/error，TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百一十五轮基线

参考：

- Tailwind CSS `place-items`：https://tailwindcss.com/docs/place-items
- MDN `place-items`：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/place-items

观察与方法：

- `IdentityMark` 外框和全尺寸 glyph 已通过双轴居中保证盒模型中心重合，但用户在真实页面中仍明确看到钱包数字与 Lucide 链图形的可见重心偏向左上。
- 几何中心继续作为结构基准；字形墨迹和 SVG 描边造成的光学偏差只在有实际观察依据的业务标记上修正，不能全局移动资产组、代币或按钮图标。
- 使用整数像素校准，避免 1x 屏幕上的半像素栅格让描边变虚；位移只作用于内部 glyph，不改变徽标外框、表格列宽或行高。

本轮动作：

- 为 `.wallet-badge` 与 `.chain-badge` 分别设置 `--ui-identity-mark-optical-x / y: 1px`，将钱包数字和链图形统一向右、向下校准一个像素。
- 共享 `identity-mark-glyph` 读取局部校准变量，默认仍为 `0px / 0px`；资产组与其他 IdentityMark 保持原始几何中心。
- 保留现有 Flex 双轴中心和 SVG 固定尺寸，不再叠加新的定位层或改变 Lucide viewBox。

复核结果：

- 1440 x 900 的钱包表和链表中，40px 钱包徽标与 38px 链徽标都保持原尺寸；内部 glyph 使用 `(1px, 1px)` 校准，外框、表格列宽和行高没有变化。
- 320 x 780 与 390 x 844 的移动钱包卡片、链卡片继续使用 40px 标记；编号和链图形采用同一整数像素校准，内容完整且没有横向截断。
- 资产组 IdentityMark 没有设置校准变量，文件夹图标保持 `(0px, 0px)`；局部修正没有扩散到其他身份标记。
- 浏览器控制台无 warning/error，TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百一十六轮基线

参考：

- shadcn Select：https://ui.shadcn.com/docs/components/radix/select
- Radix Select：https://www.radix-ui.com/primitives/docs/components/select
- WAI-ARIA APG Listbox Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/listbox/

观察与方法：

- Radix Select 负责受控值、焦点、键盘导航和 typeahead；业务层仍必须保证选项集合包含所有真实可达状态，组件可访问并不等于任务可完成。
- 钱包 1 的 EVM 地址既是成员 ID，也是配对组 ID。旧逻辑用“当前组 ID 不等于成员 ID”判断能否拆分，因此 EVM 主地址只显示当前钱包一个选项；即使传入独立值，它也会写回同一组 ID。
- 仅移动被选地址会留下引用已迁移成员的旧组键；仅更新钱包配置又会让当前资产快照继续把 EVM/SOL 聚合在一起，造成管理页已经拆分而总览仍未拆分的状态冲突。

本轮动作：

- 新增纯函数配对转换：按当前组实际成员数决定能否拆分；拆出 EVM 主地址时为剩余 SOL 建立稳定组，拆出 SOL 时同步把剩余 EVM 标记为独立。
- 原逻辑钱包名称继续跟随 EVM 主钱包；SOL 独立组使用自己的地址标签。“独立”由单成员组状态派生展示，不写入用户名称，避免拆分时丢失自定义命名。
- 拆分后的两个逻辑钱包继承原资产组；重新配对时统一采用 EVM 主钱包名称和所选目标资产组，清理已消失的旧 assignment，并拒绝同组或同链类型的无效移动。
- 新增快照重组原子，钱包配置变化后立即按新组键拆分或合并 holdings、金额、状态和主要持仓，不要求等待下一次链上刷新才能看到一致结果。
- 配对 Select 在实际组内有两个地址时固定提供带 Lucide Unlink 的“设为独立钱包”；当前组继续作为选中项，选项文字表达结果而不是暴露内部 `__new__` 值。
- 新增 `check:wallet-pairing`，覆盖 EVM 主地址拆分、SOL 拆分、重新配对、同链冲突、资产组继承，以及快照拆分与合并；该检查进入生产构建前置步骤。

复核结果：

- 1440 x 900：EVM 1 和 SOL 1 的 Select 均可显示“钱包 1”与“设为独立钱包”，菜单与触发器左边缘对齐，Unlink 图标和文字完整显示；Escape 关闭时没有触发数据写入。
- 320 x 780 与 390 x 844：详情布局、完整地址、三项地址操作和两项配对菜单均可用；弹出层保持在视口内，未遮断选项文字。
- 回归脚本验证拆分后两组都存在且都保留原资产组，合并后只保留目标 assignment；模拟快照金额 `100 + 50` 可拆为两组并重新合并为 `150`，没有资产丢失。
- 浏览器控制台无 warning/error，配对回归、TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百一十七轮基线

参考：

- MDN `white-space`：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/white-space
- Tailwind CSS `white-space`：https://tailwindcss.com/docs/white-space
- shadcn Badge：https://ui.shadcn.com/docs/components/radix/badge

观察与方法：

- 320px 刷新质量卡把“1 / 30 次”拆成两行：`CountPair` 自身虽然不换行，但单位仍是外部普通文本，布局可以在数字对与单位之间断开。
- 紧凑计数的原子边界应包含数字和单位；外层句子仍可正常换行，不能为整段说明统一设置 `nowrap`。
- `.health-section-heading span` 会命中标题内所有后代 `span`，把数字原子的内部对齐和间距一起覆盖。容器样式应只约束直接子元素，避免选择器泄漏。

本轮动作：

- 新增共享 `CountWithUnit`：接收任意 `CountValue` 或 `CountPair` 与单位，使用 `inline-flex`、baseline 对齐、`min-width: max-content` 和 `white-space: nowrap` 保持一个不可拆分的内联整体。
- 首批迁移刷新质量的有效覆盖与历史次数、资产摘要覆盖缺口、移动资产组计数和分页总数；不改变外层文本的自然换行能力。
- 把刷新质量标题选择器收紧为 `.health-section-heading > span`，内部数字对继续使用自己的 baseline 和分隔间距。

复核结果：

- 320px 的“1 / 30 次”恢复为单行；390px 实测原子宽 40.7px，数字与单位位于同一行，computed `display` 为 `inline-flex`、`white-space` 为 `nowrap`。
- 320 / 390px 刷新质量卡没有横向溢出，覆盖计数和趋势区域保持原有层级；1440px 卡片仍为三段横向布局，没有增加无意义的徽章底色。
- 浏览器控制台无 warning/error，钱包配对回归、TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百一十八轮基线

参考：

- shadcn Table：https://ui.shadcn.com/docs/components/base/table
- Tailwind CSS `color`：https://tailwindcss.com/docs/color
- MDN `aria-hidden`：https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden

观察与方法：

- 钱包管理把 `summary?.totalUsd || 0` 直接交给货币组件，导致“没有快照”和“已确认资产为零”都显示 `$0.00`；未知数据被伪装成精确数字，是比颜色不统一更严重的数据语义问题。
- `.amount` 对所有金额统一使用品牌绿，`CurrencyValue` 已有的 `data-sign="zero / positive / negative"` 没有参与视觉状态；零值因此看起来像正向结果。
- 响应式表格应保持金额列稳定，但缺失值需要独立表达。视觉占位符可以简短，辅助技术仍应获得“暂无资产数据”等完整原因；装饰性的长横线不应被重复朗读。

本轮动作：

- 新增共享 `ValuePlaceholder`：默认显示等宽长横线，使用 `aria-hidden` 隐藏装饰符号，并通过 `sr-only` 文本保留调用方提供的缺失原因；hover title 使用同一说明。
- 钱包没有 summary 时改为“暂无资产数据”，不再构造 `$0.00`；刷新质量没有历史点时也复用同一原子显示“暂无资产快照”。
- 金额容器读取 `CurrencyValue[data-sign]`：真实零值使用 muted foreground，负值使用 danger 色，正值继续继承资产强调色；只在表格和 Ledger 金额上下文生效，不污染深色总资产摘要。

复核结果：

- 320 / 390 / 1440px 钱包管理第一页均有 8 个缺失值原子，无障碍快照读取“暂无资产数据”，页面不再出现 `$0.00 未刷新`；长横线保持金额列对齐且没有横向溢出。
- 390px 总览中的 Virtuals 是已存在的真实零值，继续显示 `$0.00`，但颜色由品牌绿变为中性灰；未分类的正资产 `$260.15` 仍保留绿色强调，三种状态可以直接区分。
- 浏览器控制台无 warning/error，钱包配对回归、TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百一十九轮基线

参考：

- shadcn Skeleton：https://ui.shadcn.com/docs/components/radix/skeleton
- Tailwind CSS Animation：https://tailwindcss.com/docs/animation
- WAI-ARIA APG Accessible Names：https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/

观察与方法：

- 钱包管理首次读取 API 时先渲染了“0 个逻辑钱包”“0 个链上地址”和“还没有钱包”，把尚未返回的数据误报成真实空状态；这类短暂错误信息比单纯的页面闪动更容易误导操作。
- 首次加载和后台重新载入是两种状态：前者没有可信数据，需要与最终布局同构的 Skeleton；后者已经有可读数据，应保留原内容，只在触发按钮上反馈进度。
- Skeleton 应表达页面几何层级，不应模拟可被理解为真实余额或钱包数量的业务值；辅助技术只需要一个简洁、稳定的加载状态名称。
- 钱包配置返回前，批量导入、刷新范围和刷新资产都依赖尚未确定的配置。首次加载态必须同时冻结这些操作，避免并发写入或扫描错误范围。

本轮动作：

- 新增 `WalletManagementHeadingSkeleton` 和 `WalletManagementSkeleton`，复用共享 Skeleton 原子；桌面端对应资产组侧栏、工具栏和钱包表，移动端对应资产组入口、工具栏和三张钱包卡片。
- 新增 `isInitialLoading = loading && persistence === null` 作为首次读取判据；总览摘要和钱包管理只在该状态使用 Skeleton，后台重新载入继续展示现有快照和钱包列表。
- 骨架根节点使用具名 `status`、`aria-live="polite"` 与 `aria-busy="true"`，视觉占位全部设为装饰性；页面不再朗读伪造的零数量或空钱包提示。
- 首次载入期间禁用批量导入、刷新范围和刷新资产；桌面文字按钮通过 `disabledReason` 提供原因，移动端操作菜单保持原生禁用语义。
- 响应式骨架在 980px 切换为移动资产组入口，在 680px 切换为钱包卡片；沿用全局 reduced-motion 规则压缩 pulse 动画。

复核结果：

- 立即读取 `/wallets` 时只出现一个“正在载入钱包与资产组”状态，不再出现“0 个逻辑钱包”或“还没有钱包”；初始操作入口保持禁用。
- 320 / 390 / 1440px 下 `scrollWidth` 均等于 `clientWidth`，移动钱包骨架与桌面表格骨架没有横向溢出。
- 后台重新载入时继续显示 16 个钱包；总览继续显示 `$260.15`，没有回退到 Skeleton 或空状态，只有触发按钮显示 loading。
- 浏览器控制台无 warning/error，钱包配对回归、TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百二十轮基线

参考：

- shadcn Radio Group：https://ui.shadcn.com/docs/components/radix/radio-group
- Radix Radio Group：https://www.radix-ui.com/primitives/docs/components/radio-group
- WCAG 2.2 Target Size (Minimum)：https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- Tailwind CSS Width / Size：https://tailwindcss.com/docs/width

观察与方法：

- 本轮先检查 320 / 1440px 的主页面交互目标与文字裁切：高频总览、钱包表和搜索区域没有低于 24px 的可见目标，也没有缺少解释的截断，不为了制造变化而重写成熟原子。
- 资产组配置是更明确的薄弱点：移动编辑态连续六个颜色目标仅 25px，新建态为 28px；虽然达到 WCAG 2.2 的 24px 下限，但密集相邻色块仍要求较高点击精度。
- 当前颜色名称只存在于原生 `title` 和无障碍标签中，触屏用户无法直接确认“这个色块叫什么”；颜色本身不应成为唯一的可见状态信息。
- 原生 radio 隐藏在自定义色块下时，实测方向键没有推进受控值。Radio Group 的完整性不仅是 `role`，还包括单一 Tab 入口、方向键切换、受控状态和表单值回传。

本轮动作：

- `ColorSwatchGroup` 迁移到 Radix Radio Group；根节点输出具名 `radiogroup`，每个色块输出具名 `radio`、`data-state` 与 roving focus，继续通过 Radix bubble input 写入表单 `name / value / checked`。
- 颜色组标题增加当前值文字，例如“资产组颜色 · 紫色”；该文字作为视觉冗余，radio 自身继续提供准确名称，避免只依赖色相辨识。
- 默认色块从 28px 调整为 30px；桌面紧凑编辑继续使用 25px，保证六个色块在 230px 编辑行内保持单行。
- 680px 以下的资产组弹层把编辑和新建色块统一提升到 32px，行内名称输入提升到 36px；新建输入组的尾部添加按钮同步扩大到 32px。
- 所有尺寸变化限定在颜色组件和资产组弹层，不改变总览、钱包表、全局表单密度或页面结构。

复核结果：

- 320px：编辑与新建两组共 12 个色块均为 32 x 32px，名称输入为 36px 高；页面 `clientWidth / scrollWidth` 均为 320，没有换行或横向溢出。
- Radix 颜色组可从“紫色”按 ArrowRight 切换到“金色”，选中名称同步更新；新建资产组表单仍生成六个隐藏 radio，绿色项带正确 `name`、`value=green` 和 `checked`。
- 390px：弹层保持两组 32px 色块，文档宽度等于视口；1440px：紧凑编辑色块为 25px 且六项单行，侧栏 `scrollWidth` 不超过自身宽度。
- 浏览器控制台无 warning/error，钱包配对回归、TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百二十一轮基线

参考：

- W3C CSS Box Alignment Level 3：https://www.w3.org/TR/css-align-3/
- MDN `place-items`：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/place-items

观察与方法：

- 钱包编号与链 SVG 虽然共用 `IdentityMark`，内部 glyph 仍绝对铺满内容区，并由钱包和链各自叠加 `translate(1px, 1px)`；外框中心、内容槽中心与业务光学校准形成三套定位依据。
- 用户需要的是每个徽标内部图形的稳定正中位置。CSS Box Alignment 已定义 `place-items` 同时约束块轴和行内轴，因此固定尺寸外框只需要一个 Grid 对齐上下文，字形使用自身尺寸作为唯一 Grid item。
- 全局经验位移无法同时适配等宽数字和 Lucide SVG。共享原子先保证可测量的几何中心；若单个源图形未来确有不对称，只能在该图形自身处理，不能重新移动整个钱包或链类别。

本轮动作：

- `IdentityMark` 外框收敛为单层 `inline-grid + place-items: center`；直属 glyph 改为正常流中的 intrinsic-size Grid item，删除绝对铺满定位。
- icon glyph 明确占用设计令牌给出的 20px 方形，内部 SVG 使用 `width / height: 100%`；文字 glyph 保留自身 14px 行盒，不再模拟整块 38px 内容区。
- 删除钱包与链的 `1px / 1px` optical 变量，并显式清除 glyph 的 `transform` 与 `translate`，防止业务样式再次叠加第二套中心。

复核结果：

- 1440 x 900：前 8 个钱包的 40px 外框与文字 glyph 中心差全部为 `(0px, 0px)`；4 个链的 38px 外框、20px glyph 和 20px SVG 中心差全部为 `(0px, 0px)`。
- 390 x 844 与 320 x 780：移动钱包和链徽标均为 40 x 40px，文字或 SVG 的横纵中心差继续为 `(0px, 0px)`；两档页面 `clientWidth` 与 `scrollWidth` 完全一致。
- 钱包管理与资产总览链视图截图确认徽标尺寸、表格列宽和移动卡片布局未变化；钱包配对回归、TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百二十二轮基线

参考：

- WCAG 2.2 Status Messages：https://www.w3.org/WAI/WCAG22/Understanding/status-messages
- WAI-ARIA 1.2 `alert` / `status`：https://www.w3.org/TR/wai-aria/#alert
- shadcn Sonner：https://ui.shadcn.com/docs/components/radix/sonner

观察与方法：

- 复制与导出的成功反馈已经完整：命令保持稳定名称，绿色 Check 不改变按钮尺寸，结果通过 `role=status` 播报，并在 1.8 秒后恢复；成熟路径不需要改成全局 Toast。
- 错误却与成功共用同一个 1.8 秒计时器，用户看清 CircleX 后几乎没有处理时间；错误文案也进入礼貌级 `role=status`，没有与普通成功确认区分优先级。
- WCAG 对成功或结果建议使用 `role=status`，对不改变上下文的错误警告建议使用 `role=alert`；WAI-ARIA 将 alert 定义为原子、assertive live region。两类消息应使用各自稳定的语义区域，而不是在同一节点同时切换角色和内容。
- 快速复制通常不会留下可见 pending 帧，继续依赖按钮的 `aria-busy / aria-disabled` 即可，避免额外 live region 让读屏过度播报；Tooltip 仍提供处理中说明。

本轮动作：

- `AsyncIconButton` 增加独立 `errorResetDelay`，默认 4 秒；成功继续使用原有 `resetDelay=1800`。同步抛错与 Promise rejection 都进入错误计时器。
- 复位时间统一经过 finite-number 归一化：负数压到 0，`NaN / Infinity` 回退默认值，避免异常配置被浏览器当成立即复位。
- 成功继续写入预置的 `role=status`；错误发生时创建独立的 `role=alert` 和 `${statusSlot}-error` 插槽，idle 页面不堆积空 alert 节点。
- `CopyButton` 的 pending 文案从“复制……中”改为“正在复制……”，下载的“正在准备……”语言保持一致。

复核结果：

- 1280 x 720：钱包复制进入 success 后 `copy-status` 输出“EVM 地址已复制”，alert 数为 0；1.9 秒后恢复 idle 并清空 status。
- 390 x 844：复制成功按钮保持原有行布局；导出按钮保持 42 x 42px，`download-status` 输出“资产快照导出已开始”；两页 `clientWidth / scrollWidth` 均为 `390 / 390`。
- idle 钱包页保留 32 个预置 success status，与 32 个 CopyButton 一一对应，空 alert 数为 0；错误只在真实失败期间加入无障碍树。
- 浏览器控制台无 warning/error，钱包配对回归、TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百二十三轮基线

参考：

- Vite Static Asset Handling：https://vite.dev/guide/assets.html
- MDN `HTMLImageElement.complete`：https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/complete
- MDN `HTMLImageElement.naturalWidth`：https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/naturalWidth

观察与方法：

- 页面中的已知代币图标虽然能够加载，但运行时仍依赖 GitHub、CoinGecko 和 GeckoTerminal；任一外部域名限流、改址或网络波动都会让用户看到临时字母图标。
- `complete` 在图片加载失败时也可能为真，不能单独作为成功判据；图像就绪状态继续要求 `complete && naturalWidth > 0`，并保留 `onError` 回退。
- 本地图标与 API 返回图标必须有明确优先级：已知 symbol 使用应用内权威图标，未知 symbol 才采用 API 的远程地址，二者都不可用时生成稳定的字母图标。
- 资源来源状态不能把所有非生成图标统称为 remote；调试属性应准确区分 `bundled / remote / generated`，否则离线与失败回归会得到错误结论。

本轮动作：

- 将 19 份有效图标资源纳入 `src/assets/token-icons`，覆盖 24 个已知 symbol 及其包装币别名；由 Vite 处理内联或带内容哈希的构建产物。
- `knownTokenIconUrl` 改为静态资源映射；`tokenIconUrl` 对已知 symbol 优先返回打包资源，未知 symbol 继续尊重 API 图标。
- 新增内部图标来源解析，`TokenIcon` 的 `data-source` 现在准确输出 `bundled / remote / generated`；打包图片和远程图片共用自然尺寸就绪检测与错误回退。
- 补充 Vite 客户端类型声明，让 PNG、JPG 和 SVG 静态导入经过 TypeScript 与生产构建完整校验。

复核结果：

- 320 x 780：当前 8 个可见代币图标全部为 `bundled / ready`，自然宽度为 150 或 250；图像和 40px 外框的横纵中心差均为 `(0px, 0px)`，页面宽度为 `320 / 320`。
- 冷载入资源记录中 GitHub、CoinGecko 和 GeckoTerminal 图标请求均为 0；已知代币不再依赖外部图标服务。
- 1440 x 900：代币图标继续全部为 `bundled / ready`；钱包编号和链 glyph 的横纵中心差仍为 `(0px, 0px)`，没有破坏上一轮居中基线。
- 浏览器控制台无 warning/error，钱包配对回归、TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百二十四轮基线

参考：

- MDN `justify-content`：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/justify-content
- MDN CSS Grid box alignment：https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Box_alignment
- Tailwind CSS `grid-template-columns`：https://tailwindcss.com/docs/grid-template-columns

观察与方法：

- 390px 钱包工具栏的卡片内容宽度为 344px，但摘要、操作组和搜索框都停在 270px，右侧留下没有用途的空白；子控件声明 `width: 100%` 也只能填满已经收缩的父轨道。
- 工具栏在桌面使用 Flex 和 `justify-content: space-between`，680px 以下只把 `display` 改成 Grid。遗留的 `space-between` 会在 Grid 的 inline axis 分配轨道外空间，隐式 `auto` 单列因此保持 max-content 宽度。
- 响应式切换布局模型时，必须重新审计 `justify-content / align-content / flex / grid-template-*`；这些属性即使语法仍有效，在另一种布局模型里的作用对象已经改变。
- Tailwind 的单列网格同样使用 `minmax(0, 1fr)`。显式轨道既占满可用空间，也允许长内容收缩到 0，适合工具栏、表单行和响应式筛选区。
- 审计期间无障碍快照列出了 Radix 的 bubble input，但实际 DOM 中这些 input 均为 `aria-hidden=true`、`tabindex=-1`；确认原生属性后保留，不因工具摘要的表象重构正确组件。

本轮动作：

- 680px 以下的 `.management-toolbar` 显式设置 `grid-template-columns: minmax(0, 1fr)`，把摘要、操作组和搜索区约束到同一条可收缩的全宽轨道。
- 同一断点把 `justify-content` 重置为 `stretch`，清除桌面 Flex 分布策略对移动 Grid 的语义泄漏。
- 保留操作组内部两条等宽轨道；全选和排序继续并排，搜索框继续跨越全部列，不改变组件顺序或交互。

复核结果：

- 390px：工具栏内容、摘要和操作组宽度由 270px 恢复到 344px，搜索输入使用完整内容宽度；页面 `clientWidth / scrollWidth` 为 `390 / 390`。
- 320px 与 680px：工具栏内容宽度分别为 274px 和 634px，两条操作轨道分别为 `133px + 133px` 与 `313px + 313px`，没有裁切或横向溢出。
- 681px 与 1440px：继续使用原有 Flex 工具栏；桌面搜索框保持 390px，未改变成熟布局。
- 320px 实测搜索“钱包 16”只保留对应钱包，清除按钮恢复空查询；浏览器控制台无 warning/error，钱包配对回归、TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百二十五轮基线

参考：

- WCAG 2.2 Contrast Minimum：https://www.w3.org/TR/WCAG22/#contrast-minimum
- W3C Technique G18：https://www.w3.org/WAI/WCAG22/Techniques/general/G18
- shadcn Theming：https://ui.shadcn.com/docs/theming

观察与方法：

- 对资产总览和钱包管理的 390px 首屏做可见叶子文字扫描后，唯一低于 4.5:1 的正常文字是顶部非当前路由：`#687169` 位于 `#e7ebe5` 上仅为 `4.19:1`。
- 非当前路由仍是可操作的导航入口，不属于 WCAG 可以豁免的 inactive UI component；“视觉弱化”不能依赖低对比实现，应由表面、边框、字体权重和当前态标记共同表达层级。
- shadcn 推荐用语义 CSS 变量维持组件与主题之间的契约。原 `muted-foreground` 在白色表面上合格，但放到更深的导航底色上不足；不应因此把全站 muted 一次性调深。
- 同一种信息层级可能需要适配不同表面。设计令牌需要表达用途和强度，而不是只保存一个叫 gray 的色值。

本轮动作：

- 新增 `--muted-foreground-strong: #5f6961` 和兼容别名 `--muted-strong`，用于带底色、仍需满足正文可读性的低强调文字。
- `RouteNavigation` 的非当前文字改用 strong muted；当前路由继续使用 foreground、白色表面、品牌色底边和阴影，层级表达没有依赖色差单点。
- hover、active、focus-visible 与 forced-colors 规则保持原样，避免为对比度修复破坏已有交互反馈。

复核结果：

- 新令牌在导航底色上的计算对比度为 `4.73:1`，高于 WCAG AA 普通文字的 `4.5:1`；调整前为 `4.19:1`。
- 从钱包管理切换到资产总览后，非当前项由“资产总览”正确变为“钱包管理”，两条路由都输出同一 strong muted 令牌。
- 320 / 390 / 1440px 的导航高度均为 36px，页面 `clientWidth / scrollWidth` 分别完全一致；移动首屏复扫没有低于 4.5:1 的可见正常文字。
- 浏览器控制台无 warning/error，钱包配对回归、TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百二十六轮基线

参考：

- shadcn Field：https://ui.shadcn.com/docs/components/aria/field
- shadcn Input：https://ui.shadcn.com/docs/components/aria/input
- WCAG 2.2 Error Identification：https://www.w3.org/WAI/WCAG22/Understanding/error-identification

观察与方法：

- 资产组、钱包名称和地址标签都使用共享 `InlineEdit`。必填值被清空时，组件已有红色边框、`aria-invalid=true` 和不可保存状态，却没有任何可见或可关联的错误文本。
- 颜色只能作为错误的辅助线索；WCAG 3.3.1 要求自动识别的输入错误以文本说明。shadcn 的 Field 模式同样把 `aria-invalid` 放在输入上，并在控件后渲染独立 `FieldError`。
- 紧凑编辑器不需要引入完整纵向 Field 布局，但必须保留同一契约：输入状态、可见错误、程序关联和恢复路径四者一致。
- 错误文案应指出具体对象，而不是统一写“输入错误”。钱包名称、资产组名称和地址标签分别给出可直接修正的说明。

本轮动作：

- `InlineEdit` 新增 `emptyMessage`，必填值为空时在输入和操作组下方渲染共享错误原子；默认文案为“请输入内容后保存”。
- 错误原子使用 Lucide `CircleAlert`、destructive 色和 `role=alert / aria-atomic=true`，不使用 emoji，也不只依赖红色边框。
- 通过稳定的 `useId` 生成错误 ID，将其与调用方已有 `aria-describedby` 合并后关联到输入；错误消失时同步移除引用和 alert 节点。
- 三个业务入口分别配置“钱包名称不能为空”“资产组名称不能为空”“地址标签不能为空”。保存禁用、Escape/取消和焦点回收逻辑保持原样。

复核结果：

- 390px 钱包名称清空后，输入输出 `aria-invalid=true`，`aria-describedby` 指向“钱包名称不能为空”的 alert；编辑器宽 241.5px、高 59.5px，卡片和页面均无横向溢出。
- 移动资产组弹层的空名称错误保持在输入下方，六个 32px 色块顺序不变；编辑卡宽 364px，没有覆盖相邻资产组。
- 地址标签在 390px 与 1440px 分别保持 260px 与 320px 编辑宽度；错误文本位于地址前，配对 Select 和三个地址操作没有位移重叠。
- 输入有效值后 `aria-invalid / aria-describedby / alert` 同步移除；三类取消路径继续把焦点还给原编辑入口。浏览器控制台无 warning/error，钱包配对回归、TypeScript 与 Vite 生产构建通过。

### 2026-07-23 第一百二十七轮基线

参考：

- shadcn Dialog：https://ui.shadcn.com/docs/components/radix/dialog
- shadcn Field：https://ui.shadcn.com/docs/components/radix/field
- WCAG 2.2 Headings and Labels：https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels

观察与方法：

- 钱包管理只有一个“批量导入”入口。它准确描述了实现方式，却没有直接描述用户的主任务“添加钱包地址”；用户需要额外询问如何添加钱包，说明功能可见不等于意图可识别。
- WCAG 2.4.6 要求标题和标签描述主题或目的。操作命名应优先使用用户想完成的结果，把单个或批量、粘贴或输入等实现方式放进 Dialog 描述和 Field 帮助。
- shadcn Dialog 使用 Title、Description、Content、Footer 建立从任务到操作的层级；现有弹层结构已经符合该模式，不需要为了换词重做布局。
- shadcn Field 将帮助和错误视为同一个控件上下文：正常态呈现 `FieldDescription`，错误态在控件后呈现 `FieldError`，并由输入的 `aria-describedby` 指向当前有效说明。
- 批量入口仍需即时显示作用范围。非空行数既是输入反馈，也是主按钮的提交摘要；计数、按钮和实际解析必须使用同一个 `walletImportLineCount`。

本轮动作：

- 页面主操作与空状态操作由“批量导入”改为“添加钱包”；Dialog 标题改为“添加钱包地址”，描述明确支持单个输入或批量粘贴。
- Field 标签由“名称与地址”改为“钱包名称与地址”，计数由抽象的“行”改为“个地址”；主按钮根据输入同步输出“添加地址”或“添加 N 个地址”。
- 正常态新增可见 `FieldDescription`，说明同编号 EVM/SOL 的自动配对规则，并通过 `aria-describedby` 关联到 textarea。
- 提交错误时继续用原位置的 `FieldError` 替换帮助说明；错误消失后恢复帮助 ID。成功反馈由“已导入”统一改为“已添加”，与入口动词保持一致。
- 保留内部导入解析、重复跳过、同链冲突和持久化逻辑，不把用户任务命名调整扩散成无关的数据层重构。

复核结果：

- 390 x 844：弹层稳定尺寸为 390 x 680px，页面 `clientWidth / scrollWidth` 为 `390 / 390`；标题、描述、帮助说明和粘贴区均无裁切。
- 输入两行后，Field 计数和主按钮同步显示“2 个地址”与“添加 2 个地址”；输入为空时按钮恢复“添加地址”并保持禁用。
- 两行无效内容提交后，textarea 输出 `aria-invalid=true`，`aria-describedby=wallet-import-error`，错误节点为 `role=alert`，焦点继续停留在输入；再次编辑后错误移除并恢复 `wallet-import-description`。
- 1440 x 900：弹层宽 840px，页面无横向溢出；取消后焦点回到“添加钱包”，Dialog 数量归零。浏览器控制台无 warning/error。

### 2026-07-23 第一百二十八轮基线

参考：

- MDN `<time>` element：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/time
- MDN `Intl.RelativeTimeFormat`：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat
- WCAG 2.2 Use of Color：https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html

观察与方法：

- 本轮先审计钱包 Pagination 的高页数压缩、320px 控件宽度和首尾状态；现有五槽算法、区间播报和固定按钮尺寸均已覆盖，不为了制造变化重写成熟原子。
- 320px 资产总览首屏的 10 个可见交互目标均不低于 34px，也没有文字裁切。真正的缺口是数据新鲜度：首屏只显示绝对时间“07/18 12:01”，已经 5 天未更新这一风险要到页面底部才以“5天前”出现。
- 相对时间降低日期换算成本，绝对时间保留审计精度；两者应该属于同一个时间事实，而不是渲染两个重复 `<time>` 节点。
- `<time datetime>` 继续提供机器可读 ISO 时间，`Intl.RelativeTimeFormat` 继续负责中文方向和单位。颜色只用于增强 aging / stale，真正的新鲜度仍由“9小时前 / 4天前”等文本表达，符合不只依赖颜色传递信息的要求。
- 审计截图曾产生“桌面总览垂直居中”的错觉；DOM 实测 topbar 顶部为 18px、shell 顶部为 0px，因此不根据缩放截图的主观印象修改页面定位。

本轮动作：

- `TimeValueMode` 新增 `hybrid`；有效值在单一 `<time>` 中输出“相对时间 · MM/DD HH:mm”，继续保留 `datetime` 和精确到秒的 title。
- relative / hybrid 模式新增 `data-tone=fresh|aging|stale`，absolute 模式不输出 tone；无效值分支保持普通 span 和“尚未刷新”。
- `PortfolioSummary` 使用共享分钟时钟驱动 hybrid 时间，长期打开页面时相对文案会自动推进，不需要刷新整个资产快照。
- 摘要中的 aging / stale 时间使用已有金色警示色和中等字重；Clock 图标、文字内容和精确时间不变，颜色不是唯一状态线索。

复核结果：

- 当前快照首屏输出单一 `<time>`：“5天前 · 07/18 12:01”，`datetime=2026-07-18T04:01:37.990Z`、`data-mode=hybrid`、`data-tone=stale`，title 保留“2026/07/18 12:01:37”。
- 320px 下时间宽 110.8px，父行宽 266px；390px 下父行宽 336px、摘要高 364px；1440px 下摘要继续为 160px。三档页面 `clientWidth` 均等于 `scrollWidth`。
- 固定时钟静态渲染分别输出“5分钟前 · 07/23 19:55”/fresh、“9小时前 · 07/23 11:00”/aging、“4天前 · 07/19 20:00”/stale；三者都只有一个 `<time datetime>`。
- 320px 截图确认新鲜度在第一屏直接可读，金额、覆盖警告和摘要事实没有换行位移；浏览器控制台无 warning/error。

### 2026-07-23 第一百二十九轮基线

参考：

- shadcn Popover：https://ui.shadcn.com/docs/components/radix/popover
- Radix Popover：https://www.radix-ui.com/primitives/docs/components/popover
- WAI-ARIA Dialog Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

观察与方法：

- 钱包列表、移动资产组抽屉和批量移动条已经具备稳定层级与完整状态，本轮不为了增加改动重写成熟路径。
- “保守估值”原先只有结果、资产构成和折价缓冲，用户无法在当前上下文核对“稳定币完整计入、波动资产按 80% 计入”的公式。金融摘要需要按需解释，不能要求用户记住产品规则。
- Tooltip 只适合简短标签，且触屏发现性有限；包含标题、解释、公式和三行数据的富内容应由按钮触发 Popover。Radix Popover提供 portal、碰撞定位、焦点管理、Escape 关闭和触发器焦点回收。
- 说明面板使用非模态 dialog：它补充当前指标，不阻断页面任务。触发按钮输出 `aria-haspopup=dialog / aria-expanded / aria-controls`，内容由可见标题和说明提供 `aria-labelledby / aria-describedby`。
- 行项目金额显示到美分，底层计算仍可能含更多小数；用显示值手算可能相差 1 美分。因此总计使用“约等于”，不把展示层四舍五入伪装成精确等式。

本轮动作：

- 新增共享 `Popover` 原子，封装 Trigger、Close、Portal、Content、Arrow、默认边距和碰撞留白；新增 `InfoPopover` 组合组件，统一 Lucide `CircleHelp / X`、标题、说明、关闭操作和数据插槽。
- 保守估值标题加入 28px 桌面、32px 移动帮助按钮；点击或 Enter 打开计算说明，Escape、关闭按钮或外部交互关闭。
- 面板展示“稳定币 + 波动资产 × 80%”以及当前稳定币、波动资产和保守估值三行金额；折价比例直接引用共享 `conservativeVolatileFactor`，避免 UI 公式与服务端计算漂移。
- Popover 使用 320px 上限和 12px 视口留白，搭配 6px 硬朗圆角、单层阴影和金色公式带；保持工具型资产产品的克制层级。
- 引入 `@radix-ui/react-popover` 后主 JS 由 481.49 kB 增至 517.16 kB（gzip 148.72 kB 至 160.81 kB），超过 Vite 默认 500 kB 提示线；保留警告作为后续分包审计信号，不通过调高阈值掩盖。

复核结果：

- 390 x 844：Popover 为 320 x 229.9px，边界 `left=58 / right=378 / bottom=618.9`；触发按钮为 32px，页面 `clientWidth / scrollWidth=390 / 390`。
- 320 x 780：碰撞定位自动收缩为 296px，左右各保留 12px，面板底部 624.9px；公式、三行金额和关闭按钮均无裁切。
- 1440 x 900：Popover 保持 320 x 229.4px，触发按钮为 28px，资产摘要高度与表格起始位置未改变，页面宽度为 `1440 / 1440`。
- Enter 打开后焦点进入关闭按钮；Escape 关闭后内容节点移除、`aria-expanded=false`，焦点回到说明触发器。Dialog 标题、说明和触发器控制关系均可从 DOM 读取。
- 浏览器页面自身无 warning/error，钱包配对回归、TypeScript 与 Vite 生产构建通过；Vite 只保留上述包体积提示。

### 2026-07-23 第一百三十轮基线

参考：

- Vite 6 Building for Production：https://v6.vite.dev/guide/build
- Vite 6 Build Options：https://v6.vite.dev/config/build-options
- Rollup `output.manualChunks`：https://rollupjs.org/configuration-options/#output-manualchunks
- web.dev Code-split JavaScript：https://web.dev/learn/performance/code-split-javascript

观察与方法：

- 上轮加入 Popover 后，唯一 JS 入口为 517.16 kB（Vite gzip 160.81 kB），超过 Vite 6 默认 500 kB 单块提示线。`chunkSizeWarningLimit` 比较未压缩大小，因为它与执行成本有关；直接提高阈值只会隐藏信号。
- Vite 6 通过 `build.rollupOptions.output.manualChunks` 交给 Rollup 分包。Rollup 将对象形式描述为更简单、更安全的手工分组；函数形式更强，但默认会吸收依赖，并警告副作用模块可能因执行时序变化而改变行为。
- 第一次尝试把 React 单独分组时，Radix 依赖先吸收 React，生成了空 `vendor-react`。空块虽然不触发 500 kB 警告，却是错误的产物边界，因此删除该方案。
- 最终依赖族按变化频率和职责拆分：React、Radix、Sonner 合并为 `vendor-interface`，Lucide 单独为 `vendor-icons`，业务源码保留在入口。业务修改不会让稳定 UI 运行时和图标块一起失效缓存。
- 这三个块都由首页静态引用，并由 Vite 写入 `modulepreload`；因此本轮优化的是单块解析/执行边界与长期缓存，不声称减少首次总下载。减少首载字节仍需要将页面代码抽出后使用动态 `import()`。
- 单块变小不能成为总体积膨胀的遮羞布。预算必须同时约束最大块、块数量、总未压缩体积和总 gzip 体积。

本轮动作：

- `vite.config.ts` 使用对象形式 `manualChunks`，生成 `vendor-interface`、`vendor-icons` 和业务 `index` 三个稳定块；没有提高 `chunkSizeWarningLimit`。
- 新增 `check:bundle-budget`，在每次生产构建后读取 `dist/assets/*.js` 并计算真实文件大小与 Node gzip 大小。
- 当前预算为：单块不超过 500 kB、JS 块不超过 6 个、总 JS 不超过 550 kB、总 gzip 不超过 175 kB；任一超限直接让构建失败。
- `npm run build` 顺序调整为钱包配对回归、TypeScript、Vite 构建、包体预算检查，确保产物预算而不是源码猜测成为门禁。

复核结果：

- 最终产物：业务入口 165.75 kB / gzip 49.85 kB，`vendor-interface` 325.49 kB / gzip 103.13 kB，`vendor-icons` 26.59 kB / gzip 6.75 kB；没有空块，也没有单块警告。
- 预算脚本实测为 3 个块、总计 517.84 kB、gzip 159.73 kB、最大块 325.49 kB，四项均在预算内。
- `dist/index.html` 只包含一个业务 module script，并为两个 vendor 块输出 modulepreload；生产预览中三个 JS 文件分别返回 200 和与构建一致的字节数。
- 320 x 780 生产预览：总览 Popover 可打开并用 Escape 关闭；切换 `/wallets` 后添加钱包 Dialog 正常打开并关闭，页面宽度为 `320 / 320`。
- 生产预览页面自身无 warning/error，钱包配对回归、TypeScript、Vite 构建和新增包体预算全部通过。

### 2026-07-24 第一百三十一轮基线

参考：

- shadcn Field：https://ui.shadcn.com/docs/components/radix/field
- shadcn Item：https://ui.shadcn.com/docs/components/radix/item
- WCAG 2.2 Error Identification：https://www.w3.org/WAI/WCAG22/Understanding/error-identification
- WCAG 2.2 Status Messages：https://www.w3.org/WAI/WCAG22/Understanding/status-messages

观察与方法：

- 上轮已经把入口改为用户任务语言“添加钱包”，但批量录入仍只显示输入行数。重复、无效格式、同组同链冲突和 EVM/SOL 配对结果都要到提交后才知道；主按钮甚至可能写“添加 4 个地址”，实际只保存 2 个。
- 多行配置的验证结果属于提交前决策信息，不应只在失败后用 Toast 概括。Field 模式要求控件、帮助和错误保持同一上下文；结构化结果则适合用独立内容面板展示，不把统计数字和逐行问题塞进 FieldError。
- 预览不能另写一套近似规则。输入预览、主按钮数量和最终持久化必须消费同一个分析结果，否则界面与数据层会在重复地址或配对冲突上漂移。
- 动态统计是不会移动焦点的状态消息，使用单一、礼貌级 `role=status` 文本摘要；可见统计本身对辅助技术隐藏，避免同一数字被重复朗读。真正提交失败仍由现有 FieldError 文本和 `aria-invalid` 处理。
- 问题必须同时指出行号和原因。“红色数字”不是错误说明；“第 3 行：地址已存在，将跳过”同时满足定位、原因和结果三个信息需求。

本轮动作：

- 抽取 `analyzeWalletImport`，统一计算非空行、可添加钱包、重复或格式问题以及本次新增配对；提交函数删除原有重复解析循环，直接使用同一分析契约。
- 新增 `WalletImportReview` 业务组件，使用 Lucide `ScanSearch / CheckCircle2 / Link2 / CircleAlert` 展示可添加、新配对和需处理三项统计，并列出前三条逐行问题与剩余数量。
- Field 计数改为准确的“输入行”，主按钮改为实际“可添加地址”数量；没有任何有效地址时按钮禁用，部分有效时明确保留可添加数量和将跳过的问题。
- Dialog 在桌面使用编辑器加预检的双栏工作区，680px 以下切换上下布局；360px 以下单独降低编辑器最小高度，让三条问题摘要完整出现，不通过横向滚动或裁切换取信息密度。
- Textarea 的 `aria-describedby` 同时关联格式帮助和预检状态；关闭与 Escape 仍由 Radix Dialog 回收焦点，测试过程没有触发保存。

复核结果：

- 混合四行输入稳定输出“2 个地址可添加、1 个新配对、2 行需要处理”，问题明确为“第 3 行：地址已存在，将跳过”和“第 4 行：未找到有效地址”；主按钮显示“添加 2 个地址”。
- 两行全部无效时预检为 `0 / 0 / 2`，主按钮禁用；两行有效配对时预检为 `2 / 1 / 0`，问题区切换为“格式与冲突检查通过”。
- 五行无效输入在 320 x 780 下保留 150px 编辑区，前三条问题和“另有 2 行需要处理”完整可见；Dialog 宽度为 320px，页面 `clientWidth / scrollWidth` 为 `320 / 320`。
- 390px 弹层保持上下布局，1440px 弹层为 840px 双栏；两档都没有文字或统计裁切。Escape 关闭后 Dialog 数量归零，焦点回到“添加钱包”。

### 2026-07-24 第一百三十二轮基线

参考：

- shadcn Field：https://ui.shadcn.com/docs/components/radix/field
- W3C Grouping Controls：https://www.w3.org/WAI/tutorials/forms/grouping/
- MDN `<fieldset>`：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/fieldset
- Tailwind `grid-template-columns`：https://tailwindcss.com/docs/grid-template-columns

观察与方法：

- “刷新范围”原先把 14 条网络放在一个无标题关系的扁平复选框网格中；最后四项默认未选中，却没有解释它们与前十项的差异，状态看起来像任意缺失。
- 一组相关复选框应由 `<fieldset>` 和 `<legend>` 建立整体问题语义。常用与扩展只是同一问题的视觉子区，不需要再嵌套 fieldset；用带标题的 section 保持层级即可。
- 链选择不只是布尔状态，还需要快速识别对象。名称前增加共享 IdentityMark，把网络图标、链色和文字绑定成稳定原子，同时沿用统一的 glyph 居中规则。
- 选择数是理解范围的关键信息：整体、常用和扩展三层计数都从同一份草稿状态派生，避免标题、选项和提交结果不一致。
- 响应式网格继续使用 `repeat(n, minmax(0, 1fr))`，让长链名可以收缩但不会撑破轨道；移动端用两列和固定选择项高度，在 320px 下仍能完整呈现全部控制。

本轮动作：

- `Field` 组件族新增 `FieldSet / FieldLegend / FieldGroup`，统一清除浏览器 fieldset 默认边距和边框，并保留原生表单分组语义。
- 新增 `ChainChoice`，集中维护 14 条扫描网络的展示名称、链色、Lucide `Network` 图标和选择态；图标通过共享 `IdentityMark` 的双层 grid 契约保持几何居中。
- 刷新范围拆为“常用网络”和“扩展网络”，分别显示 `已选 / 总数`；顶部继续显示整体选择数，默认范围的来源因此可见。
- “重置默认”改为带 Lucide `RotateCcw` 的“恢复常用”，动词和恢复目标都更明确；风险资产 Switch 和“应用范围”提交路径保持原有行为。
- 桌面使用三列，680px 以下切换两列；移动端压缩区间间距和标识尺寸，不通过横向滚动或隐藏网络换取可见范围。

复核结果：

- 320 x 780：Dialog 中 14 条网络、风险资产 Switch 和底部操作完整可见；内容区 `clientHeight / scrollHeight = 549 / 549`，页面 `clientWidth / scrollWidth = 320 / 320`。
- 1440 x 900：Dialog 为 840 x 694.4px，内容区 `clientHeight / scrollHeight = 552 / 552`；常用网络三列、扩展网络三列，均无横向溢出。
- DOM 输出 group“扫描网络”、region“常用网络”和 region“扩展网络”；勾选 Linea 后计数由 `10 / 14` 更新为 `11 / 14`、扩展由 `0 / 4` 更新为 `1 / 4`，恢复常用后同步回退。
- 逐项测量 14 个 IdentityMark，图标相对容器中心的 `dx / dy` 全部为 `0 / 0`；Space 可切换聚焦复选框，Escape 关闭后焦点返回“刷新范围”。

### 2026-07-24 第一百三十三轮基线

参考：

- shadcn Sonner：https://ui.shadcn.com/docs/components/base/sonner
- Sonner：https://github.com/emilkowalski/sonner
- WCAG 2.2 Status Messages：https://www.w3.org/WAI/WCAG22/Understanding/status-messages
- WCAG 2.2 Focus Order：https://www.w3.org/WAI/WCAG22/Understanding/focus-order

观察与方法：

- 手动“重新载入”结束后只有按钮停止 loading，没有完成状态；添加钱包成功后虽然有保存 Toast，但用户仍要自己返回总览寻找“刷新资产”。两个流程都缺少从完成结果到下一任务的明确连接。
- 状态通知不应自动抢走焦点。WCAG 4.1.3 要求成功、结果和等待状态可由辅助技术感知，但不要求改变上下文；Toast 可以保留当前任务，同时提供由用户主动触发的后续操作。
- 后续操作必须消费刚载入或刚添加的钱包集合。只调用闭包中的旧 `wallets` 会出现“提示已添加，刷新仍漏掉新地址”的竞态，因此刷新函数需要接受显式钱包参数。
- Sonner 的 `Alt+T` 会直接聚焦通知容器。异步按钮在 loading 时被禁用后，浏览器可能把焦点退回 `body`，单靠 `focusin.relatedTarget` 无法可靠恢复原触发器。
- 窄屏 Toast 不能通过缩小字号容纳操作按钮。正文和操作竞争同一行时，应在临界宽度把动作移到第二行，并继续与正文起点对齐。

本轮动作：

- 新增共享 `ToastActionLabel`，统一 Toast 操作按钮中的 Lucide 图标、文字间距、尺寸和居中契约；不使用 emoji。
- 手动重新载入成功后显示“资产配置已重新载入”、已读取地址数和“刷新资产”操作；添加钱包保存成功后复用同一操作，点击时先进入资产总览再刷新。
- `refresh` 新增显式 `activeWallets` 参数，API 请求和快照回填使用同一集合；添加钱包 action 使用云端同步返回并规范化后的钱包，普通顶部按钮继续默认使用当前状态。
- ToastViewport 在 `pointerdown / focusin` 阶段记录最近的可交互控件，在 Sonner 热键捕获阶段保留它，并在 Escape 时恢复；`body` 等不可操作节点不会覆盖焦点来源。
- 360px 以下让带 action 的 Toast 换为两行：首行保留图标与完整状态文案，第二行操作按钮与正文左边缘对齐；390px 和桌面继续使用紧凑单行布局。

复核结果：

- 390 x 844：Toast 为 366 x 59.49px，操作按钮 85 x 30px；图标与文字中心差 `dy = 0`，页面 `clientWidth / scrollWidth = 390 / 390`。
- 320 x 780：Toast 为 296 x 97.49px，正文宽 210px；标题和地址数各保持完整一行，操作按钮位于第二行且 `left = 55px`，与正文起点一致。
- 1440 x 900：Toast 为 356 x 61.49px，操作按钮保持 85 x 30px；没有改变桌面钱包表格的尺寸或位置。
- `Alt+T` 将焦点送入“操作通知”，Escape 后焦点从通知容器返回“重新载入”按钮，通知仍保留供继续阅读或操作。
- 浏览器验收只触发只读的重新载入，没有点击“刷新资产”或提交钱包变更；钱包添加 action 由同一共享反馈结构、显式钱包参数和 TypeScript 构建覆盖。

### 2026-07-24 第一百三十四轮基线

参考：

- shadcn Chart：https://ui.shadcn.com/docs/components/aria/chart
- Tailwind CSS Grid Template Columns：https://tailwindcss.com/docs/grid-template-columns
- WCAG 2.2 Use of Color：https://www.w3.org/WAI/WCAG22/Understanding/use-of-color

观察与方法：

- 保守估值原先只有“稳定币”和“波动资产”两个条段，却在同一图例中列出第三项“折价缓冲”。移动端实测条段为 `76.75% + 23.25%`，图例却同时显示 `$199.66 / $60.49 / $12.10`，图形与图例不是一一对应关系。
- 折价缓冲不是资产构成中的第三份资产，而是波动资产中不进入保守估值的 20%。图表必须先回答业务问题，再决定条段：此处应表达“哪些市值计入估值、哪些被扣除”，而不是继续沿用原资产构成。
- shadcn Chart 将人类可读标签、颜色和数据键作为同一配置关系；本项目的轻量 CSS 图也应保持相同契约，不需要为三段横条引入 Recharts。
- WCAG 1.4.1 要求不能只用颜色区分信息。每个条段都需要对应的可见名称、金额和计入规则；整条图还需要完整的程序化文本替代。
- `repeat(3, minmax(0, 1fr))` 让三列在 320px 到桌面间共享剩余宽度；金额、标签和规则分层后，不需要缩小正文或产生横向滚动。
- 零值状态也属于图表契约。宽度为 0 的缓冲段如果仍保留 1px 边界，会伪造“存在微小折价”的视觉信号，空段必须完全不可见。
- 生产数据超过 `$1,000` 后，通用金额组件会自适应省略分币；这适合摘要，却不适合计算明细。可复核算式必须显示精确到分的来源、结果和总计。

本轮动作：

- 把保守估值横条改为“稳定币全额计入 + 波动资产按 80% 计入 + 折价缓冲未计入”三个真实条段；三段仍以原总资产为分母，合计为 100%。
- 用三列 `dl` 估值桥替换普通 Legend：稳定币显示原额和“全额计入”，波动资产显示折价后金额和“计入 80%”，折价缓冲显示负值和“未计入”。
- 图形的可访问名称同时包含三项金额、计入比例、缓冲状态和最终保守估值；颜色只作为扫描辅助。
- 计算说明 Popover 直接展示波动资产折价后的结果，并新增负值折价缓冲行，不再要求用户在脑中计算 `$60.49 × 80%`。
- 缓冲段在 `data-empty` 时移除左边界，零资产范围中的三个条段宽度均严格为 0。
- `CurrencyValue` 新增默认不破坏现有界面的 `precision="exact"` 模式；估值计算 Popover 和图形文本替代使用精确分币，摘要和窄屏三列继续使用自适应紧凑金额。

复核结果：

- 当前 `$260.15` 样本的三段分别为 `76.7482% / 18.6014% / 4.6504%`，对应 `$199.66 / $48.39 / -$12.10`，前两项合计 `$248.06` 保守估值。
- 320 x 780：估值桥宽 266px，三列各约 88.66px，所有列 `scrollWidth = clientWidth`；页面 `clientWidth / scrollWidth = 320 / 320`。
- 390 x 844：三项名称、金额和计入规则保持独立行，灰色缓冲段与“未计入”文字同时可见；没有依赖颜色单独传意。
- 1440 x 900：摘要宽 1408px，估值区宽 608.57px，三列各约 187.85px；摘要高度为 166.14px，没有挤压后续账本。
- `$0.00` 资产组中三个条段的 `data-state` 均为 `empty`，宽度与左边界均为 0；图形名称和三列数值仍明确输出 `$0.00`。
- 生产样本精确输出 `$1,915.13 + $2,653.40 = $4,568.53`，并单列 `-$663.35` 缓冲；不会再因千元金额省略分币而出现可见算式差 1 美元。
- 钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算均通过；最终产物为 3 个 JS chunk、526.65 kB，gzip 161.69 kB。

### 2026-07-24 第一百三十五轮基线

参考：

- shadcn Data Table：https://ui.shadcn.com/docs/components/base/data-table
- shadcn Badge：https://ui.shadcn.com/docs/components/radix/badge
- WCAG 2.2 Reflow：https://www.w3.org/WAI/WCAG22/Understanding/reflow.html

观察与方法：

- 币种总额已经按 `$1` 阈值过滤，但链分布仍逐条展示 `$0.86`、`$0.51` 甚至 `$0.00`，让本应辅助定位资产来源的元数据重新变成噪声。
- 展示阈值不能下沉到聚合数据。币种总额、持仓数、钱包数、链数量和合约集合仍需消费完整数据；只有链分布的可见明细应用 `$1` 阈值。
- Data Table 的单元格可以按上下文决定信息密度；低价值链不需要占用与主要链相同的标记，但不能无提示消失。用一个紧凑的 `小额 +N` 次级标记保留遗漏事实，比逐条列零值或完全隐藏更可核查。
- 桌面表格和移动账本必须共享同一个过滤组件，不能在断点两侧分别实现。移动端的“链”统计继续显示完整链数，详情区只收起低价值条目。
- 320px 回流不依赖横向滚动。主要链与小额摘要都使用既有 MetadataItem 原子，必要时自然换行，不缩小文字或裁掉计数。

本轮动作：

- `TokenChainBreakdownList` 新增 `minimumUsd` 契约，先从完整链列表派生可见链和小额链，再对可见链应用既有的最多四项规则。
- 桌面与移动币种视图统一传入全局 `minVisibleUsd`；总额、数量、钱包、完整链数和合约逻辑保持不变。
- 低于阈值的链合并为 `小额 +N`，可访问名称与原生 title 明确说明“价值低于 `$1.00`，明细已省略”；超过四条的有效链仍独立使用 `+N` 溢出摘要。
- 组件保留完整条目数、可见链数、小额链数和布局项数四类诊断属性，避免把摘要标记误算成真实链。

复核结果：

- 本地 ETH 样本总额 `$2.65`、完整链数 `3` 保持不变；链分布只显示 `Arbitrum · $1.07` 与 `小额 +2`，两条低价值链不再逐项占位。
- 320 x 900：移动账本的“链”仍为 `3`，详情与桌面使用相同摘要；页面 `clientWidth / scrollWidth = 320 / 320`，Dialog 和展开详情均为 0。
- 1440 x 900：币种表格保持原有列宽和行高，低价值摘要与主要链在同一元数据层级，不引入额外卡片或新色彩。
- 钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算全部通过；最终产物为 3 个 JS chunk、527.13 kB，gzip 161.86 kB。

### 2026-07-24 第一百三十六轮基线

参考：

- shadcn Data Table：https://ui.shadcn.com/docs/components/base/data-table
- WCAG 2.2 Focus Order：https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html
- W3C Technique C27：https://www.w3.org/WAI/WCAG22/Techniques/css/C27

观察与方法：

- 钱包管理表在桌面是标准六列表格，680px 以下通过 CSS Grid 把每行重排为卡片。原 DOM 顺序仍把“操作”放在最后，视觉却把编辑和展开按钮放到标题右侧。
- 320px 实测的顺序是：选择 `y=549`、复制 EVM `y=589`、复制 SOL `y=623`、资产组 `y=665`，然后突然回到编辑与展开 `y=546`。控件都能操作，但键盘用户需要反复重新定位当前焦点。
- W3C 2.4.3 不要求焦点机械复制每个像素位置，但要求顺序保持意义和可操作性，并明确提醒避免看起来随机跳动；C27 推荐让 DOM 顺序与视觉顺序一致。
- shadcn Data Table 把行操作定义为具体业务表格的一部分，而不是强制所有断点共用同一个列结构。响应式表格可以保留同一业务动作，但在移动卡片中把它放回标题上下文。
- 不使用正 `tabindex` 修补源代码顺序，也不同时渲染两套带重复 id 的按钮。断点状态决定唯一一套操作控件位于钱包标题单元还是桌面操作列。
- 审计证据要分级：颜色选择器在语义快照中看似出现重复 radio，但 DOM 检查确认第二份是 Radix 用于表单冒泡的 `aria-hidden` 原生 input，因此没有基于弱证据改写正常组件。

本轮动作：

- 抽取 `WalletManagementActions`，统一编辑与展开两个 Lucide 图标按钮的 id、名称、展开状态和事件契约。
- 新增 680px 断点感知：桌面继续输出六个表格单元和独立操作列；移动端输出五个单元，并把唯一的操作组放进钱包 `rowheader`、名称之后、地址列表之前。
- 移动卡片的资产单元统一为三列网格：序号标记、钱包名称、操作组占首行，地址列表占第二行；复制按钮同时自然对齐到地址行右侧。
- 地址详情的 `colSpan` 随断点从六列切换为五列，展开内容继续覆盖整张移动卡片；名称编辑时操作组暂时移除，取消后由原有 InlineEdit 契约恢复焦点。

复核结果：

- 真实 Tab 操作依次到达“选择钱包 1 → 编辑钱包名称 → 展开钱包 1 地址 → 复制 EVM 地址”；不再从卡片底部跳回顶部。
- 取消名称编辑后，焦点准确回到 `wallet-group-edit-wallet-001`；没有触发保存或钱包配置变更。
- 320 x 900：移动行高保持 `223px`，地址详情 `colSpan=5`，详情宽度与表格同为 `298px`，页面 `clientWidth / scrollWidth = 320 / 320`。
- 390 x 844：操作组、两条地址、资产组和状态保持原有视觉层级，单行仍为 `223px`，没有为修复焦点顺序增加卡片高度。
- 1440 x 900：表头和每行仍为六个单元，八组桌面操作可见、移动操作为 0，既有列宽和分页位置不变。
- 钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算全部通过；最终产物为 3 个 JS chunk、527.54 kB，gzip 162.02 kB。

### 2026-07-24 第一百三十七轮基线

参考：

- shadcn Dropdown Menu：https://ui.shadcn.com/docs/components/radix/dropdown-menu
- Radix Popover：https://www.radix-ui.com/primitives/docs/components/popover
- WCAG 2.2 Target Size (Minimum)：https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- WCAG 2.2 Target Size (Enhanced)：https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced

观察与方法：

- 资产总览的移动“更多资产操作”菜单项实测只有 36px 高，触发按钮为 42px；保守估值说明的触发和关闭按钮为 32px。它们都超过 WCAG 2.5.8 的 24px 最低值，不能误报为 AA 失败，但在窄屏触控场景仍明显偏小。
- W3C 同时说明更大的目标能降低误触，增强标准使用 44 x 44px。这里采用 44px 作为移动工具界面的工程目标，不把它伪装成所有场景都必须满足的最低合规线。
- Radix Popover 和 Dropdown Menu 已经正确处理 Portal、碰撞定位、键盘导航、Escape 关闭和触发器焦点回收；运行态也验证这些行为无误。本轮保留原语义与行为，只优化可点击面积和视觉层级。
- 覆盖层中的按钮属于交互后出现的新内容，仍需要独立考虑目标尺寸。说明关闭按钮不能因为浮层本身非模态就继续沿用桌面密度。
- 共享原子优先于业务补丁：移动资产操作和资产组行操作都消费同一个 DropdownMenu，统一提升菜单项比只改首页两行 CSS 更能减少后续漂移。

本轮动作：

- 680px 以下把默认控制高度从 42px 提升为 44px，小号控制从 38px 提升为 40px；桌面令牌保持不变。
- 移动 DropdownMenu 使用 44px 菜单项、13px 标签、20px 图标轨道和 6px 内容留白；首页菜单宽度从 190px 提升为 208px，资产组紧凑菜单继续保留业务宽度。
- InfoPopover 的移动触发与关闭按钮提升为 44 x 44px，说明正文提升为 12px；桌面触发和关闭仍分别为 28px。
- InfoPopover 标题新增 28px 的 Lucide `CircleHelp` 标识区，使用 grid + `place-items:center` 统一图标居中；可见标题继续作为 `aria-labelledby` 来源，装饰图标对辅助技术隐藏。
- 没有新增交互状态、重复触发器或自定义焦点脚本；现有 Radix 行为继续作为唯一交互契约。

复核结果：

- 320 x 900：估值触发和关闭按钮均为 44px，浮层为 296 x 270.8px，内部 `clientWidth / scrollWidth = 294 / 294`，页面为 `320 / 320`；标题图标相对容器中心 `dx / dy = 0 / 0`。
- 390 x 844：浮层保持 320px 宽，左右边界为 `58 / 378`，内容和页面都无横向溢出；触发与关闭按钮继续为 44px。
- 首页移动菜单触发为 44 x 44px，两项菜单操作均为 44px 高，菜单宽 208px；资产组管理中的编辑与删除复用项也均为 44px 高。
- 两类菜单和 InfoPopover 都能用 Escape 关闭并把焦点返回原触发器；资产组管理 Dialog 关闭后也返回“当前资产组”按钮，没有触发编辑、删除或保存。
- 1440 x 900：说明触发与关闭仍为 28px，浮层宽 320px，摘要高度保持 166.14px，页面为 `1440 / 1440`。
- 钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算全部通过；最终产物为 3 个 JS chunk、527.77 kB，gzip 162.04 kB。

### 2026-07-24 第一百三十八轮基线

参考：

- shadcn Select：https://ui.shadcn.com/docs/components/radix/select
- Radix Select：https://www.radix-ui.com/primitives/docs/components/select
- WCAG 2.2 Target Size (Enhanced)：https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced
- Tailwind CSS Min Height：https://tailwindcss.com/docs/min-height

观察与方法：

- 共享 Select 的移动触发器已经随控制令牌提升到 44px，但弹出选项仍为 34px；320px 实测出现“打开前符合触控密度、打开后选项突然变密”的断层。
- 34px 选项高于 WCAG 2.5.8 的 24px 最低值，不属于 AA 失败；本轮继续采用 44 x 44px 增强目标作为移动触控工程标准，并明确限制在 680px 以下。
- Radix Select 已经提供 ListBox 语义、托管焦点、完整键盘导航、typeahead、Portal 和碰撞定位。改良应保留这些交互契约，不重写为自制菜单。
- 移动选项不仅需要更高，还要同步扩大图标和选中标记的布局轨道。只增加 `min-height` 会让 18px 轨道在更宽松的行内显得偏斜，统一使用 20px 轨道更稳定。
- 320 x 240 压力测试发现：若把 Radix 上下滚动按钮也提升为 44px，它们会在只有约 85px 可用高度时吞掉整个列表并越过视口边界。移动端应让列表视口直接承担触摸滚动和键盘自动滚动，桌面继续保留滚动按钮。
- 桌面钱包管理属于重复操作密集界面，不应机械套用移动触控尺寸。断点外继续保持 40px 触发器和 34px 选项，以免降低扫描效率。

本轮动作：

- 680px 以下把 Select 选项提升为 44px，标签提升为 13px，左右图标与选中标记轨道统一为 20px，选项图标保持 16px。
- 移动 Select 视口留白由 4px 提升为 6px，弹层最大高度限制为可用高度与 360px 的较小值；不通过固定高度制造空白。
- 移动端隐藏 Radix 上下滚动按钮，保留 `.ui-select-viewport` 的原生 `overflow-y:auto`、触摸滚动和 Radix 键盘自动滚动；桌面样式不变。
- 没有修改 Select 的 React 结构、值提交、Portal、碰撞定位、焦点恢复或业务选项配置，改动集中在共享响应式原子层。

复核结果：

- 320 x 900：钱包排序触发器 44px，三项各 44px，列表为 138 x 146px；资产组触发器 44px，五项各 44px，列表为 169 x 234px。
- 钱包排序使用 ArrowDown 后活动项从“钱包顺序”移动到“资产从高到低”；Escape 关闭列表、值保持“钱包顺序”，焦点返回“钱包排序”。
- 五个资产组 Lucide 图标相对各自 IdentityMark 的中心偏差 `dx / dy` 全部为 `0 / 0`；320px 页面 `clientWidth / scrollWidth = 320 / 320`。
- 320 x 240：弹层高度 85.125px 且底部停在 232.125px，滚动视口 `clientHeight / scrollHeight = 83 / 232`、`overflow-y:auto`；ArrowUp 移动到“Robinhood”后 `scrollTop` 从 149 调整为 138，隐藏的滚动按钮没有覆盖选项。
- 390 x 844：资产组触发器宽 239px、高 44px，五项均为 44px，页面 `clientWidth / scrollWidth = 390 / 390`。
- 1440 x 900：钱包排序触发器继续为 40px，三项继续为 34px，页面 `clientWidth / scrollWidth = 1440 / 1440`；移动规则没有改变桌面密度。
- 钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算全部通过；最终产物仍为 3 个 JS chunk、527.77 kB，gzip 162.04 kB。

### 2026-07-24 第一百三十九轮基线

参考：

- shadcn Tabs：https://ui.shadcn.com/docs/components/radix/tabs
- Radix Tabs：https://www.radix-ui.com/primitives/docs/components/tabs
- WCAG 2.2 Target Size (Enhanced)：https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced
- Tailwind CSS Min Height：https://tailwindcss.com/docs/min-height

观察与方法：

- 资产汇总 Tabs 在 320px 和 390px 下的外层标签条已经是 44px，但四个真实 Tab 触发器仍各为 34px；容器看起来足够高，实际命中区域却没有消费其中的上下留白。
- 移动触控目标不一定要通过抬高整个工具栏实现。把外层 4px padding 转换为触发器自身高度，可以在不挤压后续内容、不改变旁边导出按钮尺寸的前提下扩大真实命中面。
- shadcn 的 Tabs 继续使用 `Root → List → Trigger → Content` 组合；Radix 默认提供 automatic activation、循环和完整键盘导航。本轮保留这些语义，不把视图切换改造成普通按钮组。
- W3C 的 44 x 44px 是 Level AAA 增强目标，不应误报为当前 34px 触发器违反 AA；这里将它作为频繁使用的移动分段控件工程标准。
- 桌面资产台强调扫描效率，四个 34px 标签与 40px 导出按钮已经形成稳定紧凑层级。触控规则只在 680px 及以下生效，避免全局放大。

本轮动作：

- 680px 以下让 `layout="adaptive"` 的 TabsList 移除 4px padding 和实体边框，使用不占尺寸的 inset 描边保留分段容器边界。
- 移动 TabsTrigger 提升为 44px，四项继续按内容与剩余宽度自适应分配；标签、Lucide 图标和可见文字均保留。
- 移动分段间距收紧为 2px，触发器圆角调整为 7px，使活动项覆盖完整高度时仍与 8px 外框协调。
- 没有修改 React 结构、活动视图状态、tabpanel、焦点脚本或动画；Radix 仍是唯一交互状态来源。

复核结果：

- 320 x 900：TabsList、四个触发器和导出按钮高度均为 44px，列表宽 218px；四个 Lucide 图标相对图标轨道中心的 `dx / dy` 全部为 `0 / 0`。
- 390 x 844：TabsList 宽 288px，四个触发器和导出按钮继续为 44px；页面 `clientWidth / scrollWidth = 390 / 390`。
- ArrowRight 从“资产组”移动到“链”时焦点与 `aria-selected` 同步切换；ArrowLeft 可恢复“资产组”，automatic activation 行为保持不变。
- 680px 边界四个触发器均为 44px，681px 后恢复为 34px；两侧页面都没有横向溢出。
- 1440 x 900：TabsList 保持 44px，四个触发器保持 34px，导出按钮保持 40px；桌面布局和信息密度没有变化。
- 钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算全部通过；最终产物仍为 3 个 JS chunk、527.77 kB，gzip 162.04 kB。

### 2026-07-24 第一百四十轮基线

参考：

- shadcn Pagination：https://ui.shadcn.com/docs/components/base/pagination
- WAI-ARIA 1.2 `aria-current`：https://www.w3.org/TR/wai-aria/#aria-current
- WCAG 2.2 Target Size (Enhanced)：https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced
- Tailwind CSS Responsive Design：https://tailwindcss.com/docs/responsive-design

观察与方法：

- 钱包管理分页在 320px 和 390px 下的上一页、数字页码与下一页均为 32 x 32px；高于 WCAG 2.5.8 的 24px 最低值，但低于项目已经采用的 44px 移动触控工程目标。
- 直接把现有最多七个分页单元全部放大到 44px，会在 320px 页面中至少需要 332px，还没有计入外层留白；触控尺寸和无横向滚动不能靠单纯放大同时满足。
- shadcn Pagination 明确提供只保留上一页与下一页的 Icons Only 形态，适合数据表格；本项目还需要保留页数定位，因此在两个方向按钮之间增加非交互的当前页进度。
- WAI-ARIA 规定分页集合中的当前页使用 `aria-current="page"`，并且一个集合只应标记一个当前项。移动进度与桌面数字页码通过 CSS 互斥显示，辅助技术只接收当前断点的可见结构。
- 当前显示范围已经使用 `aria-live="polite"`。翻页后继续由“显示 9–16，共 16 个钱包”报告数据变化，当前页进度只提供稳定定位，不重复增加 live region。
- 钱包管理在桌面是重复操作密集的工作台，28px 数字分页与 52px 页脚已有稳定密度。响应式结构只在统一的 680px 移动断点生效。

本轮动作：

- 共享 `Pagination` 新增移动页进度单元，显示“第 X / Y 页”，使用 `aria-current="page"` 和完整可访问名称；数字页码继续保留在同一 DOM 结构中供桌面显示。
- 680px 以下隐藏数字页码，只显示上一页、当前页进度和下一页；三个单元高度统一为 44px，方向按钮宽度也为 44px。
- 移动分页条高度从 82px 调整为 94px，范围摘要与操作区间距为 10px；操作区固定为 44 + 92 + 44px，并使用 6px 间距，不随总页数增长。
- 桌面继续显示 `paginationTokens` 生成的数字与省略号；没有修改页码算法、业务分页状态、每页数量、焦点转移或 Tooltip 禁用原因。
- 响应式互斥通过正常 CSS 层叠和更具体的子项选择器实现，不使用 `!important`，也不在 React 中引入重复的方向按钮或媒体查询状态。

复核结果：

- 320 x 900：上一页与下一页均为 44 x 44px，进度单元为 92 x 44px，操作区总宽 192px；两个 Lucide 图标相对按钮中心的 `dx / dy` 均为 `0 / 0`，页面 `clientWidth / scrollWidth = 320 / 320`。
- 390 x 844：分页条宽 368px、高 94px，三个单元继续保持 44px 触控高度；页面 `clientWidth / scrollWidth = 390 / 390`。
- 点击下一页后，表格范围从 `1–8` 更新为 `9–16`，进度从“第 1 / 2 页”更新为“第 2 / 2 页”，焦点移动到“选择 钱包 9”；返回上一页后焦点移动到“选择 钱包 1”。
- 680px 边界继续使用 44px 的紧凑三段分页；681px 恢复四个 28px 桌面控件和数字页码，两侧页面均无横向溢出。
- 1440 x 900：分页条继续为 52px 高，上一页、两个数字页码和下一页均为 28px；移动进度不占布局尺寸，桌面工作台密度没有变化。
- 浏览器警告与错误日志为空；钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算全部通过，最终产物为 3 个 JS chunk、528.13 kB，gzip 162.13 kB。

### 2026-07-24 第一百四十一轮基线

参考：

- shadcn Checkbox：https://ui.shadcn.com/docs/components/base/checkbox
- Radix Checkbox：https://www.radix-ui.com/primitives/docs/components/checkbox
- WAI Form Labels：https://www.w3.org/WAI/tutorials/forms/labels/
- WCAG 2.2 Target Size (Enhanced)：https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced

观察与方法：

- 钱包管理移动卡片的独立 Checkbox 使用 18px 可见方块和 32 x 32px 原生 input/label 命中区域；顶部“全选当前”因为带可见标签，外层已经约为 133 x 44px。
- 18px 可见方块适合高密度账本，不应为了触控尺寸把视觉标记机械放大。W3C 的 44px 增强目标约束真实命中区域；用包裹原生 input 的 label 承担更大点击面，可以同时保留紧凑视觉。
- shadcn 的表格示例把 Checkbox 作为独立选择列；Radix 明确三态、Space 键和 Indicator 契约。本项目继续使用原生 checkbox，不重写状态机、键盘行为或表单语义。
- 钱包选择需要 checked、unchecked 和 indeterminate 三态。图标过渡必须同时覆盖 Lucide `Check` 与 `Minus`，不能只美化普通选中态。
- 刷新范围中的带标签 Checkbox 原先在移动端被单独压缩为 40px；整行都是 label 命中区域，因此应与钱包行统一回到 44px。
- 扩大钱包行命中区域会占用 Grid 第一列，真实表格、移动加载骨架和内容列必须同步调整，避免加载完成时出现横向跳动。

本轮动作：

- 680px 以下把无文字共享 Checkbox 的外层 label 与原生 input 提升到 44 x 44px，18px 可见方块继续由 `place-items:center` 居中。
- 钱包移动卡片的选择列从 32px 提升到 44px；加载骨架使用相同列宽，并把 18px 骨架方块在该列中居中。
- 刷新范围的 `chain-choice` 最小高度从 40px 提升为 44px；两列网络布局、可见标签、IdentityMark 和选择数量保持不变。
- Lucide 勾选与半选图标在未选中时使用 `opacity:0 + scale(0.72)`，进入 checked 或 indeterminate 时过渡到 `opacity:1 + scale(1)`；全局 reduced-motion 规则继续关闭实际动画时长。
- 桌面 Checkbox 的 28px 命中区域、18px 可见方块、原生 input、隐式 label、`aria-label`、`aria-checked="mixed"` 和既有 focus ring 均未修改。

复核结果：

- 320 x 900：钱包 1 Checkbox 从 32 x 32px 提升为 44 x 44px，可见方块仍为 18 x 18px，方块相对命中区域中心 `dx / dy = 0 / 0`；卡片行高保持 225px，页面 `clientWidth / scrollWidth = 320 / 320`。
- 320 x 900 的刷新范围：14 个链选项均为 44px 高，Ethereum 外层为 145.5 x 44px；Dialog 为 320 x 760px，正文 `clientHeight / scrollHeight = 589 / 589`，所有网络和固定页脚仍完整可见。
- 选择 Linea 后计数从 `10 / 14` 更新为 `11 / 14`；取消后图标回到 `opacity:0` 和 `scale(0.72)`，没有提交“应用范围”或改变持久化配置。
- 选择钱包 1 后，该控件保持 44px 命中面积并获得 checked 状态，顶部“全选当前”同步为 `aria-checked="mixed"`；Check 与 Minus 相对各自 18px 方块的 `dx / dy` 均为 `0 / 0`。
- 390 x 844：钱包选择列为 44px，卡片行继续为 368 x 225px，页面 `clientWidth / scrollWidth = 390 / 390`。
- 680px 边界使用 44px Checkbox 与卡片 Grid；681px 恢复 32px 表格 Checkbox，1440 x 900 继续为 28px，桌面行高保持 92px。
- 浏览器警告与错误日志为空；钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算全部通过，最终产物为 3 个 JS chunk、528.13 kB，gzip 162.13 kB。

### 2026-07-24 第一百四十二轮基线

参考：

- shadcn Radio Group：https://ui.shadcn.com/docs/components/radix/radio-group
- Radix Radio Group：https://www.radix-ui.com/primitives/docs/components/radio-group
- WCAG 2.2 Use of Color：https://www.w3.org/WAI/WCAG22/Understanding/use-of-color
- WCAG 2.2 Target Size (Enhanced)：https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced

观察与方法：

- 资产组颜色选择器已经使用 Radix Radio Group，具备单选语义、方向键移动、Space 选择和 roving tabindex；颜色名称、当前值文字与 Lucide Check 也保证颜色不是唯一状态信号。
- 移动资产组弹窗的真实 Radio 目标原为 32 x 32px，低于项目统一采用的 44px 移动触控工程目标；桌面 30px 新增色块与 25px 编辑色块则符合高密度配置面板。
- 单纯把六个色块放大后继续使用 flex-wrap，会在 242px 的窄编辑区形成 5 + 1 的散乱换行；把三列平均拉满整个 602px 平板编辑区，又会产生过大的视觉间距。
- 本轮按“控件所需最小宽度”而不是设备名称决定列数：六个 44px 色块加五个 5px 间距需要 289px，低于该宽度时切换为紧凑 3 x 2，高于该宽度时恢复单行六列。
- W3C 的 44 x 44px 是 Level AAA 增强目标，不应误报为原 32px 控件违反 AA；这里继续将其作为频繁使用的移动配置控件工程标准。

本轮动作：

- 680px 以下把资产组弹窗内新增与编辑色块的真实 Radio 目标统一提升为 44 x 44px；色块内部颜色面、焦点环和 14px Lucide Check 继续占满或居中于同一按钮。
- 移动色块列表改为稳定 Grid：新增区始终为六列 44px，间距 5px，总宽 289px，不随较宽弹窗被拉散。
- 编辑区在 367px 及以上使用同样的六列单行布局；366px 及以下切换为三列 44px、8px 间距的 3 x 2 布局，总宽 148px。
- 681px 及以上恢复共享组件原有 flex 布局和桌面尺寸；没有修改 Radix 状态、颜色数据、表单提交、资产组持久化或业务回调。

复核结果：

- 320 x 900：新增区六个色块均为 44 x 44px，列表为 289 x 44px；编辑区为 3 x 2，列表为 148 x 96px；页面 `clientWidth / scrollWidth = 320 / 320`。
- 366px 边界继续使用 3 x 2；367px 编辑区恰好容纳 289px 的六列单行布局，页面没有横向溢出。
- 390 x 844 与 680 x 900：新增和编辑色块均保持六列单行、44px 触控目标和 5px 间距，不再把色块分散到整行宽度。
- 681px 后新增与编辑色块分别恢复约 30px 和 25px；1440 x 900 桌面值精确为 30px 和 25px，原有面板密度未改变。
- 点击“蓝色”后当前值和 `data-state` 同步更新；ArrowRight 可继续移动到“紫色”，选中 Check 相对 Radio 中心的 `dx / dy = 0 / 0`。
- 测试过程没有保存或创建资产组，关闭弹窗后编辑态已清理；钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算全部通过，最终产物为 3 个 JS chunk、528.13 kB，gzip 162.13 kB。

### 2026-07-24 第一百四十三轮基线

参考：

- shadcn Button：https://ui.shadcn.com/docs/components/radix/button
- WCAG 2.2 Target Size (Minimum)：https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- WCAG 2.2 Target Size (Enhanced)：https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced

观察与方法：

- 钱包管理每个 EVM/SOL 地址末尾都有共享 `CopyButton`。组件已经使用原生 button、完整可访问名称、异步 pending/success/error 状态和 `role=status` 播报，但 320–680px 的真实按钮只有 32 x 32px。
- 32px 高于 WCAG 2.5.8 的 24px Level AA 最低目标，不能误报为无障碍失败；它低于项目为高频移动操作采用的 44px 工程目标，也低于 WCAG 2.5.5 Level AAA 增强尺寸。
- 复制按钮位于卡片右侧边缘，每个逻辑钱包通常连续出现两个；W3C 特别建议为高频、触屏和边缘位置使用更大目标，本轮具备明确的改良证据。
- shadcn Button 提供 `icon-xs` 等视觉尺寸，但按钮变体不应决定所有响应式命中面积。业务列表应根据输入方式调整真实按钮盒，同时保留桌面高密度尺寸。
- 纯展示地址没有复制命令，不需要为了视觉一致被同步增高；命中尺寸规则只应作用于 `data-copyable=true` 的地址列表。
- 资产总览的移动 `LedgerItem` 原先把地址限制在标题中间列，320px 下只有 122px。直接放大操作列会把 `0xfe3e...a596` 压缩为 `0xfe...`，因此还必须解除旧布局约束。

本轮动作：

- 680px 以下把可复制地址行的操作列和最小高度从 32px 提升到 44px，共享 `CopyButton` 的真实按钮同步提升为 44 x 44px。
- 移动 Lucide Copy、Check 和错误状态图标从 12px 提升为 14px，默认可见度从 `0.72` 调整为 `0.8`；图标继续由 `place-items:center` 双轴居中。
- 总览钱包 `LedgerItem` 增加明确业务类；680px 以下让标题、钱包编号与金额保留在首行，地址描述独占第二行并横跨卡片三列。
- 不可复制地址行继续使用原有 32px 展示密度；681px 及以上继续使用 24px 按钮与 12px 图标。
- 没有修改复制文本、Clipboard API、异步状态机、状态播报、重置时间、Tooltip 或按钮可访问名称。

复核结果：

- 320 x 900：两个地址行和复制按钮均为 44px 高，地址列表为 223 x 90px；14px Lucide 图标相对按钮中心 `dx / dy = 0 / 0`。
- 第一张移动钱包卡从 225px 增至 249px，两个地址获得更清晰的垂直节奏；卡片仍为 298px 宽，页面 `clientWidth / scrollWidth = 320 / 320`。
- 320px 总览钱包卡的地址行从 122px 扩到 274px，地址值获得 188px 可用宽度，完整缩写 `0xfe3e...a596` 恢复显示；标题和金额仍在同一首行。
- 390 x 844 与 680 x 900：复制按钮继续为 44 x 44px，地址文本、资产组 Select 和状态行没有裁切或横向溢出。
- 681px 边界立即恢复 24px 按钮和 12px 图标；1201px 后恢复桌面表格，1440 x 900 原有表格密度没有变化。
- 浏览器可访问树继续暴露“复制 EVM 地址 …”与“复制 SOL 地址 …”名称；钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算全部通过，最终产物为 3 个 JS chunk、528.16 kB，gzip 162.14 kB。

### 2026-07-24 第一百四十四轮基线

参考：

- shadcn Button Group：https://ui.shadcn.com/docs/components/radix/button-group
- WAI-ARIA APG Disclosure Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- WCAG 2.2 Target Size (Enhanced)：https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced

观察与方法：

- 钱包管理移动卡片右上角的编辑与地址展开命令使用共享 `ButtonGroup`，具有 `role=group` 和完整组名；两个真实按钮在 320–680px 为 40 x 40px。
- 40px 已高于 WCAG 2.5.8 的 24px Level AA 最低值，但低于项目对高频移动命令采用的 44px 工程目标；它们位于卡片边缘，属于 W3C 建议扩大目标的场景。
- 原按钮组使用附着样式，以 `margin-inline-start:-1px` 合并边框，总宽 79px。编辑与展开是两个不同命令，W3C 又明确不同目标的重叠区域不应计入目标尺寸，因此移动端不应继续依赖重叠边界。
- shadcn Button Group 用于聚合执行动作的按钮，组保持 `role=group`、具名并让 Tab 逐个导航；它不要求所有场景都采用附着视觉，按钮尺寸也应由子按钮控制。
- 地址展开已经符合 APG Disclosure：原生 button 提供 `aria-controls`、`aria-expanded` 和随状态变化的名称，Chevron 是装饰性状态提示。本轮不重写这套交互。

本轮动作：

- `WalletManagementActions` 根据布局复用现有尺寸令牌：移动按钮使用 `md`，桌面按钮继续使用 `sm`，没有新增像素级 CSS 特例。
- 移动 ButtonGroup 改为 `attached=false`，两个 44px 按钮之间保留 4px 间距并恢复各自完整圆角；桌面继续使用附着式 34px 按钮。
- 编辑与 Disclosure 继续共享同一个具名 ButtonGroup；Lucide Edit3、Chevron、Tooltip、焦点顺序和业务回调均保持不变。

复核结果：

- 320 x 900：编辑和展开按钮均为 44 x 44px，16px Lucide 图标相对按钮中心 `dx / dy = 0 / 0`；按钮组为 92 x 44px、间距 4px。
- 第一张钱包卡从 249px 增至 253px，标题仍有 71px 可用宽度；钱包名称、两个地址、资产组 Select、状态和页面宽度均无裁切，`clientWidth / scrollWidth = 320 / 320`。
- 390 x 844 与 680 x 900：移动组继续为两个 44px 按钮和 4px 间距；681px 立即恢复附着式桌面组，两个按钮为 34px、总宽 67px。
- 展开钱包 1 后按钮切换为“收起钱包 1地址”、`aria-expanded=true`、`data-state=open`，Chevron 旋转 90°且详情行可见；收起后状态和隐藏属性完整恢复。
- 点击编辑后焦点进入“编辑钱包 1钱包名称”输入框，取消后输入框移除并恢复钱包操作组；测试没有保存名称或改动持久化数据。
- 钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算全部通过，最终产物为 3 个 JS chunk、528.20 kB，gzip 162.18 kB。

### 2026-07-24 第一百四十五轮基线

参考：

- shadcn Navigation Menu：https://ui.shadcn.com/docs/components/radix/navigation-menu
- Tailwind CSS Min Height：https://tailwindcss.com/docs/min-height
- WCAG 2.2 Target Size (Minimum)：https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- WCAG 2.2 Target Size (Enhanced)：https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced

观察与方法：

- 页面顶部的 `RouteNavigation` 已使用真实 `nav / ul / a`、`aria-current="page"` 和标准 `href`，并保留下载、新标签页与组合键点击；它是跨页面导航，不应为了分段外观改成 Tabs。
- 320–680px 下两个主导航链接原为 36px 高，外层列表以 4px 内边距形成 46px 总高度。36px 已超过 WCAG 2.5.8 的 24px Level AA 最低值，但低于项目对高频移动命令采用的 44px 工程目标。
- W3C 对 44px 增强目标特别建议用于频繁使用、靠近屏幕边缘和连续任务中的控件；一级导航同时具备这三个特征。
- Tailwind 的 `min-height` 方法也说明最小高度应属于真实交互元素。扩大外层分段容器而继续保留 36px 链接，不能扩大实际可点击目标。
- 本轮把既有容器内边距重新分配给链接，不增加总高度；视觉密度、页面首屏位置和桌面工作台均不需要为触控尺寸让步。

本轮动作：

- 680px 以下将 `.ui-route-nav-list` 的 4px 内边距调整为 0，让两个链接直接占据分段容器内部。
- 移动 `.ui-route-nav-link` 最小高度提升为 44px；外层导航仍为 46px 高、4px 分段间距和原有 7px 圆角。
- 681px 及以上继续使用 4px 内边距和 36px 链接；没有修改 `RouteNavigation` React 结构、路由状态、点击处理、焦点样式或业务回调。

复核结果：

- 320 x 900：导航保持 300 x 46px，两个链接由 143 x 36px 提升为 147 x 44px；两个 16px Lucide 图标相对图标轨道中心 `dx / dy = 0 / 0`。
- 390 x 844：两个链接均为 182 x 44px；680 x 900 为 327 x 44px，页面 `clientWidth / scrollWidth` 始终相等。
- 681px 边界立即恢复 111 x 36px 链接和 4px 内边距；1440 x 900 保持相同桌面导航尺寸，原有顶栏密度不变。
- 点击“资产总览”后路径切换为 `/` 且其 `aria-current="page"` 生效；点击“钱包管理”后路径恢复 `/wallets` 且当前状态同步，两个页面均无横向溢出。
- 钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算全部通过，最终产物为 3 个 JS chunk、528.20 kB，gzip 162.18 kB。

### 2026-07-24 第一百四十六轮基线

参考：

- shadcn Tabs：https://ui.shadcn.com/docs/components/base/tabs
- shadcn Button：https://ui.shadcn.com/docs/components/radix/button
- WCAG 2.2 Target Size (Enhanced)：https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced

观察与方法：

- 本轮不再只抽查首屏，而是在 320px 下扫描资产总览整页所有可见 `button / link / input / tab / checkbox / combobox / switch` 的真实边界盒，再排除隐藏控件和行内文本。
- 扫描发现三个独立命令仍不足 44 x 44px：短标签“链”为 41 x 44px，资产组账本的打开按钮为 40 x 40px，刷新质量中的“查看钱包状态”为 132 x 32px。
- 三者都高于 WCAG 2.5.8 的 24px Level AA 最低值，不能误报为无障碍失败；它们也都不属于行内链接或浏览器原生控件，因此适合继续采用项目的 44px 移动工程目标。
- shadcn Tabs 的 `TabsList / TabsTrigger / TabsContent` 组合负责互斥面板状态；扩大最短 Trigger 的宽度不应改写 Radix 选择、焦点和自动激活逻辑。
- shadcn Button 明确由按钮自身的 size 控制真实尺寸。账本 Item 外框、刷新质量面板或图标大小不能代替独立 Button 的命中面积。

本轮动作：

- 680px 以下为 adaptive `TabsTrigger` 增加 44px 最小宽度；已有 44px 最小高度、图标、文字和 flex 分配继续保留。
- 680px 以下把所有移动账本中的 `sm` 图标动作提升为 44 x 44px；16px Lucide 图标继续由共享 `IconButton` 双轴居中。
- 680px 以下把刷新质量的 `xs` 异常入口提升到 44px 高；透明 quiet 外观、双图标、文字和回调均不变。
- 681px 及以上继续使用 34px Tab、34px 账本动作和既有 28–32px 刷新入口；没有修改资产数据、筛选、路由或持久化逻辑。

复核结果：

- 320 x 900：四个 Tab 分别为 64 / 44 / 52 / 52px 宽且统一 44px 高；资产组打开按钮为 44 x 44px，刷新异常入口为 132 x 44px。
- 两个资产组打开按钮中的 16px Lucide Chevron 相对按钮中心 `dx / dy = 0 / 0`；页面 `clientWidth / scrollWidth = 320 / 320`。
- 同一整页目标扫描在改良后返回 0 个小于 44 x 44px 的可见独立交互控件；390 x 844 和 680 x 900 同样无横向溢出。
- 681px 边界立即恢复 34px 的 Tab 与账本动作、32px 刷新入口；1201px 恢复桌面资产组表格，1440 x 900 的桌面尺寸和布局均未改变。
- 点击“链”后选中 Tab 与可见 panel 同步，恢复“资产组”后状态复原；“查看未分类”进入该组钱包视图，“查看钱包状态”进入钱包视图并聚焦问题面板。
- 钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算全部通过，最终产物为 3 个 JS chunk、528.20 kB，gzip 162.18 kB。

### 2026-07-24 第一百四十七轮基线

参考：

- WCAG 2.2 Contrast (Minimum)：https://www.w3.org/TR/WCAG22/#contrast-minimum
- W3C Understanding Contrast (Minimum)：https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum
- shadcn Input Group：https://ui.shadcn.com/docs/components/radix/input-group
- shadcn Theming：https://ui.shadcn.com/docs/theming
- Tailwind CSS Colors：https://tailwindcss.com/docs/colors

观察与方法：

- 搜索、普通输入、Textarea、批量行输入和 Select placeholder 原先共享硬编码 `#8b948d`；在白色控件背景上的对比度约为 3.13:1。
- W3C 明确说明 SC 1.4.3 适用于 placeholder 文本；普通大小文字与背景至少需要 4.5:1。placeholder 不是不可用控件，也不能按 incidental text 豁免。
- placeholder 仍然不能替代 Label。本项目搜索框保留可访问名称，批量钱包输入和资产组名称保留可见 Field/区域语义，本轮只处理视觉层。
- shadcn 把 placeholder、说明和空状态归入 `muted-foreground` 语义，而不是为每个输入发明不同灰色；项目已有 `--muted-foreground: #687169`。
- `#687169` 在白底约为 5.05:1，在项目近白卡片底色约为 4.91:1；它比正文色弱，但不再依赖低对比度表达“尚未输入”。

本轮动作：

- `Input / Textarea / InputGroupInput` 的 `::placeholder` 从硬编码 `#8b948d` 改为共享 `var(--muted)`。
- Radix Select 的 placeholder value 同步使用 `var(--muted)`，让表单原子遵循同一主题契约。
- 没有改变字体、字号、控件高度、Field Label、可访问名称、输入值颜色、Focus Ring 或业务状态。

复核结果：

- 320 x 900：钱包搜索和批量钱包 Textarea 的计算色均为 `rgb(104, 113, 105)`，背景为 `rgb(255, 255, 255)`；尺寸继续为 204 x 42px 与 252 x 235.72px。
- 移动资产组管理中的“新资产组名称”同步使用新语义色，六个色块、创建按钮和底部布局没有位移或裁切。
- 输入“钱包 13”后实际值保持 `rgb(25, 33, 29)`，仅保留匹配钱包；按 Escape 后值清空、清除按钮卸载、placeholder 恢复且焦点仍在搜索框。
- 1440 x 900：资产组名称输入与钱包搜索分别保持 162 x 38px 和 320 x 38px，桌面钱包表格与侧栏尺寸均无变化。
- 页面在移动和桌面均无横向溢出；钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算全部通过，最终产物为 3 个 JS chunk、528.20 kB，gzip 162.18 kB。

### 2026-07-24 第一百四十八轮基线

参考：

- WCAG 2.2 Non-text Contrast：https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast
- shadcn Theming：https://ui.shadcn.com/docs/theming
- Tailwind CSS Border Color：https://tailwindcss.com/docs/border-color

观察与方法：

- 输入框、Textarea、InputGroup、Select 与批量行输入原先共享 `--control-border: #cfd6cf`；它在白底上的对比度约为 1.48:1，在页面底色 `#f3f5f2` 上约为 1.35:1。
- WCAG SC 1.4.11 要求用于识别输入控件及其状态的视觉信息与相邻颜色至少达到 3:1；只在 hover 或 focus 时增强，不能弥补默认状态边界不可辨识。
- 原 `--input` 又被普通 Button、IconButton 与 Dialog 边框复用。直接加深它会让所有命令和容器一起变重，说明令牌虽然有主题命名，但组件职责仍然耦合。
- shadcn 的主题契约把 `input` 用于表单边界、`border` 用于通用分隔、`ring` 用于焦点反馈；本项目进一步沿用已有 `popover-border` 管理 Dialog 外框。
- 三态层级采用默认 `#849187`、hover `#6f7d73`、focus `#0d7658`。默认色在白底为 3.29:1、页面底色为 3.00:1，hover 分别为 4.32:1 和 3.94:1。

本轮动作：

- `--input` 改为 `#849187`，新增 `--input-hover: #6f7d73`；Input、Textarea、InputGroup、Select 与 LineTextarea 统一消费这两个表单令牌。
- `--control-border` 固定保留原 `#cfd6cf`，普通 Button、IconButton、Badge 和分页继续维持轻边界，不随表单对比度一起加重。
- Dialog 从 `--input` 改用 `--popover-border`；焦点仍使用既有 `--accent` 与 `--focus-ring`，禁用、错误和业务逻辑均未改变。

复核结果：

- 390 x 844 与 320 x 800：搜索框、排序和钱包资产组 Select 的默认边界更清晰；320px 页面 `clientWidth / scrollWidth = 320 / 320`，没有挤压地址、状态或操作按钮。
- 钱包搜索获得焦点后计算边框为 `rgb(13, 118, 88)`，外环为 3px `rgba(13, 118, 88, 0.18)`；资产组 Select 展开后列表、选中态与触发器层级完整。
- 680 x 900：添加钱包继续是底部 Sheet，宽 680px、右边框为 0；681 x 900：立即恢复居中 Dialog，宽 649px、四边使用 `popover-border`，两个断点均无横向溢出。
- 1440 x 900：输入框和重复 Select 形成一致可编辑边界，普通按钮与弹窗仍保持较轻容器边界；页面无 Dialog、Listbox 或运行时 warning/error 残留。
- 钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算全部通过，最终产物为 3 个 JS chunk、528.20 kB，gzip 162.18 kB。

### 2026-07-24 第一百四十九轮基线

参考：

- WCAG 2.2 Non-text Contrast：https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast
- shadcn Checkbox：https://ui.shadcn.com/docs/components/radix/checkbox
- shadcn Switch：https://ui.shadcn.com/docs/components/radix/switch
- WAI-ARIA APG Checkbox Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
- WAI-ARIA APG Switch Pattern：https://www.w3.org/WAI/ARIA/apg/patterns/switch/

观察与方法：

- 未选 Checkbox 的 18px 方框和关闭 Switch 的轨道边框原为 `#aeb8b0`，对白底约为 2.00:1；Switch 轨道填充 `#dfe4df` 与白色滑块约为 1.28:1。
- W3C 把 2.7:1 的空 Checkbox 灰色边框直接列为失败示例，并要求开关内部滑块与轨道、轨道与外部背景都能辨识；默认状态不能等到 hover 后才满足要求。
- Checkbox 与 Switch 已使用真实原生 checkbox，Switch 额外提供 `role="switch"`、稳定标签和说明；Space、checked、disabled、invalid 语义不需要重写。
- ColorSwatch Radio 的六种实色对白色均达到 3.85:1 以上，选中勾号本身合格；但原 58% 透明绿色焦点轮廓合成后约为 2.49:1。
- 选择卡片外框有文本和内部状态控件共同标识，不需要全部改为重边框；本轮只增强承担“存在、状态、焦点”信息的最小视觉单元。

本轮动作：

- Checkbox 默认方框改用共享 `--input: #849187`；键盘焦点时方框和 ChainChoice 外框切换为实色 `--accent`，既有柔和 Focus Ring 继续作为补充。
- Switch 关闭轨道的边框与填充统一使用 `--input`，让轨道对白底、白色滑块对轨道都达到 3.29:1；hover 使用 `--input-hover`，开启态继续使用绿色 `--accent`。
- ColorSwatch Radio 的焦点轮廓从透明绿色改为实色 `--accent`；色块、勾号、箭头键模型和创建资产组逻辑保持不变。

复核结果：

- 刷新范围默认状态中，未选 Checkbox 与关闭 Switch 轨道计算色均为 `rgb(132, 145, 135)`；Switch 开启后轨道为 `rgb(13, 118, 88)`，滑块位移 18px，文字从“关闭”切换为“开启”。
- Linea Checkbox 获得键盘焦点时，方框和选择卡片边框均为绿色；选中后方框与卡片背景同步切换，测试结束前恢复草稿，没有应用刷新范围。
- ColorSwatch 使用 ArrowRight 后焦点移至“蓝色”，`data-state="checked"` 同步，轮廓为 2px `rgb(13, 118, 88)`；没有创建或修改资产组。
- 320 x 800、390 x 844：刷新 Sheet 保持两列网络布局，钱包列表的无标签 Checkbox 同步增强，页面 `clientWidth / scrollWidth` 始终相等。
- 680 x 900 继续使用 680px 底部 Sheet；681 x 900 恢复 649px 居中 Dialog；1440 x 900 钱包表格的 10 个可见 Checkbox 统一使用新边界，所有断点均无横向溢出或运行时 warning/error。
- 钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算全部通过，最终产物为 3 个 JS chunk、528.20 kB，gzip 162.18 kB。

### 2026-07-24 第一百五十轮基线

参考：

- WCAG 2.2 Focus Visible：https://www.w3.org/WAI/WCAG22/Understanding/focus-visible
- WCAG 2.2 Focus Appearance：https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance
- WCAG 2.2 Non-text Contrast：https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast
- Tailwind CSS Ring Offset Width：https://tailwindcss.com/docs/ring-offset-width
- Tailwind CSS Outline Style：https://tailwindcss.com/docs/outline-style

观察与方法：

- 原 `--ring` 为 18% 透明绿色，Tabs、主导航、Button、IconButton、Input、Checkbox 与 Switch 都把浏览器轮廓取消后只显示这层阴影；Tabs 实测焦点阴影约为 `rgba(13, 118, 88, 0.17)`。
- 未被组件覆盖的全局轮廓是 58% 透明绿色，合成到白底后约为 `#73b09e`、2.49:1；键盘焦点虽存在，但在浅色工作台中很难快速定位。
- WCAG 2.4.7 Level AA 要求每个键盘可操作元素具有持续可见的焦点指示；2.4.13 Level AAA 进一步提供至少等效 2px 周长面积和 3:1 变化对比度，可作为项目工程目标。
- Tailwind 的 ring-offset 方法使用一层与父背景一致的实色阴影模拟间隔，再绘制外圈；这种结构能让同一个焦点指示同时适配白色输入框、浅灰导航和绿色主按钮。
- Toast 原规则把完整 `box-shadow` 令牌再次写入 `0 0 0 3px var(...)`，最终声明无效；关闭按钮实际依赖浏览器剩余轮廓，不符合共享组件契约。

本轮动作：

- `--ring` 改为实色 `#0d7658`，`--focus-ring` 统一为 2px 白色 offset 加 2px 绿色外圈；绿色对白底约为 5.60:1，满足项目采用的面积与对比工程目标。
- 新增同结构的 `--focus-ring-danger`，错误 Input、Textarea、InputGroup、Checkbox 与 Switch 使用红色外圈，不再用 16% 透明红色模糊表达焦点。
- Button、IconButton、Tabs、主导航、Input、Select、Checkbox、Switch 与 Toast 继续消费共享令牌；全局原生轮廓和 TabPanel 内嵌轮廓同步改为实色 `--ring`。
- ChainChoice 只保留整张可点击卡片的焦点外圈，内部 Checkbox 仅切换绿色边界，避免父子双重外圈。
- 增加 `forced-colors: active` 回退：共享命令、输入、Tabs、复合选择控件和 Toast 使用系统 `Highlight` 轮廓，避免 box-shadow 在强制颜色模式中消失。

复核结果：

- Tabs 使用 ArrowRight 后，“链”成为活动焦点，计算阴影为白色 2px 加 `rgb(13, 118, 88)` 4px 外沿；主导航与“刷新资产”主按钮得到相同结构。
- 钱包搜索获得焦点时保留绿色输入边界，再增加白色间隔和绿色外圈；没有改变输入值、筛选或清除行为。
- Linea ChainChoice 的卡片显示共享外圈，内部 18px 方框 `box-shadow: none`；钱包表格无标签 Checkbox 仍在自身方框上显示完整外圈。
- 真实“资产配置已重新载入”Toast 中，“关闭通知”按钮计算出共享双层阴影，原无效声明已消除；测试只重新读取本地配置，没有刷新或写入资产。
- 320 x 800：顶部“添加钱包”按钮和 44px Tabs 外圈均未被屏幕边缘裁切，页面 `clientWidth / scrollWidth = 320 / 320`。
- 390 x 844：刷新 Sheet 中 Linea 卡片宽 180.5px、左距 12px，4px 外圈完整可见；1440 x 900 的导航、主按钮、表单和账本布局均无位移。
- 页面无残留 Dialog、Menu 或运行时 warning/error；钱包配对检查、TypeScript、Vite 生产构建和 bundle 预算全部通过，最终产物为 3 个 JS chunk、528.20 kB，gzip 162.18 kB。
