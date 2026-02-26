# ServiceNow MCP Server Comparison: Feature Gap & Improvement Analysis

Comparison of `@onlyflows/servicenow-mcp` (17 tools) against `now-sdk-ext-core` to identify missing functionality and areas for improvement.

---

## 1. Functionality We're Missing Entirely

### 1.1 Aggregate / Stats API (`sn_aggregate`)

**What it does**: Run aggregate queries (COUNT, AVG, MIN, MAX, SUM) with optional GROUP BY on any table.

**ServiceNow Endpoint**: `GET /api/now/stats/{table}`

**Why it's useful**: Enables analytics without pulling all records — e.g., "count open P1 incidents by assignment group", "average time to resolution", "total change requests this month". This is a first-class ServiceNow API that we don't expose at all.

**Example use cases**:
- Count active incidents by priority
- Average resolution time for a category
- Sum hours logged by team
- Max/min values for SLA tracking

**Implementation complexity**: Low — straightforward GET with query params (`sysparm_count`, `sysparm_avg_fields`, `sysparm_group_by`, etc.)

---

### 1.2 Instance Health Monitoring (`sn_health`)

**What it does**: Consolidated health check covering instance version, cluster node status, stuck scheduled jobs, active semaphores, and key operational stats (open incidents, P1 count, active changes, problems).

**ServiceNow Tables queried**:
- `sys_properties` — glide.war, glide.build.date, glide.build.tag
- `sys_cluster_state` — cluster node status
- `sys_trigger` — stuck jobs (state=0, next_action overdue by 30+ min)
- `sys_semaphore` — active semaphores
- `incident`, `change_request`, `problem` — operational counts

**Why it's useful**: Single call to assess instance health. Particularly valuable for CI/CD pipelines, monitoring dashboards, and pre-deployment checks. The stuck jobs and semaphore detection can catch issues before they become outages.

**Implementation complexity**: Low-medium — multiple Table API queries aggregated into a single response. Uses safe fallback pattern (return null on error per check, don't fail the whole health check).

---

### 1.3 CMDB Relationship Graph Traversal (`sn_relationships`)

**What it does**: Walk the CMDB relationship graph starting from a CI, with configurable depth (1-5), direction (upstream/downstream/both), and filters by relationship type and CI class. Supports impact analysis mode.

**ServiceNow Tables**:
- `cmdb_ci` — CI lookup by name or sys_id
- `cmdb_rel_ci` — Relationship records (parent/child with type)

**Why it's useful**: Impact analysis ("what depends on this server?"), dependency mapping ("what does this app need?"), and change risk assessment. This is a core CMDB use case that we have no support for.

**Key implementation details from their code**:
- Visited set to prevent infinite loops in circular dependencies
- Class lookup cache to minimize API calls during traversal
- Display value extraction handles both string and object formats
- Hard depth cap of 5 to prevent runaway queries

**Implementation complexity**: Medium — recursive BFS/DFS with caching and loop detection.

---

### 1.4 Table/App/Plugin Discovery (`sn_discover`)

**What it does**: Discover what exists on an instance — list tables, scoped apps, store apps, and plugins with name search and active filtering.

**ServiceNow Tables**:
- `sys_db_object` — table definitions (name, label, super_class, scope, is_extendable)
- `sys_app` — scoped applications
- `sys_store_app` — store applications
- `v_plugin` — plugins

**Why it's useful**: Our `SchemaDiscovery` handles field-level schema for a known table, but we have no way to answer "what tables exist?", "what plugins are active?", or "what scoped apps are installed?". This is foundational for exploration and automation.

**Implementation complexity**: Low — simple Table API queries on system tables.

---

### 1.5 Query-Based Batch Update/Delete (`sn_batch`)

**What it does**: Find records matching an encoded query, then bulk update or delete them. Includes a **dry-run mode** (default) that shows the match count before executing.

**Why it's useful**: Our `BatchOperations` handles sequential creates/updates from a predefined list, but doesn't support "update all incidents matching X" or "delete all test records matching Y". The dry-run safety pattern is particularly valuable.

**Their safety features**:
- Dry-run by default — shows matched count without executing
- Requires explicit `confirm: true` to execute
- Configurable limit cap (default 200, max 10,000)

**Implementation complexity**: Low — query for matching records, then loop PATCH/DELETE calls.

---

## 2. Areas Where They Arguably Do It Better

### 2.1 Destructive Operation Safety

**Their approach**: Multi-layer safety for destructive operations:
- Single delete requires `confirm: true`
- Batch operations default to dry-run mode
- Bulk deletes require both `confirm` and `force` flags
- Write operations via natural language require `execute: true`

**Our approach**: No safety gates — `BatchOperations.batchCreate/batchUpdate` execute immediately. `ServiceNowRequest.delete()` executes without confirmation.

**Recommendation**: Consider adding optional dry-run mode to batch operations and a confirmation pattern for bulk deletes.

---

### 2.2 Plugin-Free Code Search Fallback

**Their approach** (`sn_codesearch`): Queries script fields directly via Table API `LIKE` search across multiple tables:
- `sys_script` (Business Rules)
- `sys_script_include` (Script Includes)
- `sys_ui_script` (UI Scripts)
- `sys_script_client` (Client Scripts)
- `sys_ws_operation` (Scripted REST)

**Our approach**: Uses the dedicated `/api/sn_codesearch/code_search/search` API, which is more powerful (indexed, supports search groups) but **requires the Code Search plugin** (`sn_codesearch`) to be active.

**Recommendation**: Our approach is superior when the plugin is available, but a fallback method using direct Table API LIKE queries would work on instances without the plugin. Consider adding a `searchDirect()` fallback method.

---

### 2.3 Attachment Download

**Their approach**: `sn_attach` supports three actions: list, download (to local file), and upload. Download uses `/api/now/attachment/{id}/file` with binary response handling.

**Our approach**: `AttachmentManager` supports `listAttachments`, `getAttachment` (metadata only), and `uploadAttachment`. We don't support downloading attachment content.

**Recommendation**: Add a `downloadAttachment(sysId, outputPath)` method using `GET /api/now/attachment/{id}/file`.

---

### 2.4 Display Value Control

**Their approach**: Global `SN_DISPLAY_VALUE` config (default "true") plus per-request `display_value` override on every query tool. Uses `sysparm_display_value=true|false|all`.

**Our approach**: We don't consistently pass `sysparm_display_value` on Table API queries. This means consumers get raw sys_id references instead of human-readable display values by default.

**Recommendation**: Add `displayValue` option to `TableAPIRequest` methods and consider a global default.

---

### 2.5 ATF Multiple Endpoint Fallbacks

**Their approach** (`sn_atf`): Tries 2-3 different API endpoints for running tests, falling back on failure:
1. `POST /api/sn_atf/rest/test` (ATF REST API)
2. `POST /api/now/atf/test/{id}/run` (alternate endpoint)
3. `POST /api/now/table/sys_atf_test_result` with status=scheduled (table trigger)

**Our approach**: Uses a single `TestExecutorAjax` processor call for single tests and `/api/sn_cicd/testsuite/run` for suites. If the endpoint isn't available, it fails.

**Recommendation**: Add fallback endpoints for ATF execution for better cross-instance compatibility.

---

### 2.6 Syslog Time-Based Filtering

**Their approach**: Accepts a `since` parameter (minutes ago) and builds the query using `sys_created_on>=javascript:gs.minutesAgoStart({N})`. Also supports level, source, and message filters that compose into an encoded query.

**Our approach**: `SyslogReader.querySyslog()` accepts a raw encoded query string. The caller must construct time-based filters manually.

**Recommendation**: Add convenience parameters (level, source, since, message) to `querySyslog` that auto-build the encoded query, similar to their approach.

---

## 3. Summary Priority Matrix

| Feature | Value | Effort | Priority |
|---------|-------|--------|----------|
| Aggregate/Stats API | High | Low | **P1** |
| Instance Health Monitoring | High | Low | **P1** |
| CMDB Relationship Traversal | High | Medium | **P2** |
| Table/App/Plugin Discovery | Medium | Low | **P2** |
| Query-Based Batch Update/Delete | Medium | Low | **P2** |
| Attachment Download | Medium | Low | **P2** |
| Display Value Control | Medium | Low | **P3** |
| Plugin-Free Code Search Fallback | Low | Low | **P3** |
| Destructive Operation Safety | Medium | Low | **P3** |
| ATF Endpoint Fallbacks | Low | Low | **P3** |
| Syslog Convenience Filters | Low | Low | **P3** |

---

## 4. What We Have That They Don't

For context, here are significant capabilities in `now-sdk-ext-core` that `servicenow-mcp` lacks entirely:

- **Store Application Management** — search, install, update with progress tracking
- **Update Set Management** — create, clone, inspect, move records between sets
- **Workflow Creation** — full lifecycle (workflow, version, activities, transitions, conditions, publish)
- **Script Sync** — bidirectional file synchronization for script types
- **Background Script Execution** — REST-based execution (they require Playwright, currently unavailable)
- **Real-Time Messaging** — AMB/WebSocket/CometD client for live subscriptions
- **Batch App Installation** — multi-app install from definition file with validation
- **Code Search (full)** — indexed search via dedicated API with search groups
- **Syslog Tailing** — real-time log streaming with formatting and file output
- **Scope Management** — change active application scope programmatically
- **Catalog Validation** — validate catalog item configuration for issues
