# 管理端 Slice 2 只读审查

审查对象：`3a83a726ab3800a0a66312e62d2548ee6d96e3cb`（`feat(data-market): add delivery management workbench`）。

## 结论：FAIL，不能验收或合入

提交补上了申请详情、交付/API/版本/运行绑定/凭证/统一验收/验收问题/生命周期的管理页和 API 适配层，也修正了数据集发布请求与 access-clearances 的版本头。但核心交付写接口没有遵守 OpenAPI 强制幂等契约，且凭证授权的乐观锁头仍不正确；重试、网络抖动或重复点击会导致后端拒绝请求或重复产生交付对象。

## 对 Slice 1 Critical/Important 的关闭情况

| 原类别 | 状态 | 本次核查证据 |
| --- | --- | --- |
| 发布请求完整性与幂等 | 部分关闭 | `publishDataset` 现发送完整的 `DatasetPublishReq` 与 `Idempotency-Key`；对应 API 测试存在。 |
| access-clearances 乐观锁 | 已关闭 | `updateAccessClearances` 已改用必填 `If-Match-Version`，并有精确测试。 |
| 管理申请/交付/验收功能缺口 | 部分关闭 | 页面、权限指令和读取/创建/提交入口已出现；但写请求的 OpenAPI 强制头未完成，不能作为可用闭环验收。 |
| 管理交付契约与安全边界 | 未关闭 | 见下列 Critical/Important；既有 `admin-slice-1-review.md` 不在此独立仓或该提交内，故无法逐字复核其编号，只能对本次可见修复和当前阻塞项作结论。 |

## Critical

### C1. 八个管理写端点遗漏必填 `Idempotency-Key`

OpenAPI 将 `Idempotency-Key`（长度 16–100）列为必填 header：创建交付、创建 API、创建 API 版本、完成阶段、配置凭证、提交统一验收、处理验收问题和执行生命周期。`src/api/dataMarket/delivery.ts:25-65` 的这些请求均只发 `url/data`，没有 header；相同问题也意味着实际后端会按契约拒绝，或在契约放宽时无法安全重试。

运行绑定和授权更新不在该幂等集合；其余八类 POST 均应由 adapter 生成/接受单次复用 key，并在测试逐条断言。

### C2. 凭证授权使用了错误且可省略的并发控制头

OpenAPI 的 `/management/credentials/{credentialId}/authorizations` 要求 `If-Match-Version`。`delivery.ts:47-56` 将 version 设为可选，且发送 `If-Match`；这与文档和已修复的 access-clearances 写法不一致，服务端无法获得必需版本。应把参数改为必填，发送 `If-Match-Version: String(version)`，并覆盖 `0`。

## Important

### I1. API 版本血缘被前端虚构为数据集 ID 1

`deliveryWorkbench/index.vue:133-147` 默认固定 `lineage: [{ sourceId: 1, ... }]`，界面没有选择真实数据集/加工项或从申请/交付上下文带入。该值会把任意新 API 绑定到错误来源，既不满足 `ApiVersionCreateReq.lineage` 的实际业务含义，也会污染审计与影响分析；须改为服务端可选来源并禁止无选择提交。

### I2. 交付页面缺少 OpenAPI 必填字段的前端验证

`createVersion` 只校验 API ID 和 JSON 可解析，却允许空 `publicBaseUrl`、四段必填描述和默认空策略提交（`deliveryWorkbench/index.vue:174-183`）。OpenAPI 对 URI、路径和描述均有约束；当前 catch 又把服务端错误伪装为“OpenAPI 文档必须是合法 JSON”。应做表单规则、分别显示服务端错误，且让 lineage 可编辑。

### I3. 凭证输入允许直接展示 Secret，和页面安全声明不一致

页面声明“不会展示、缓存或伪造密钥”，但 `show-password` 在 `deliveryWorkbench/index.vue:78` 可明文显示正在输入的 App Secret。虽然提交后 `finally` 会清空内存字段，这是正向处理，但不应提供展示开关；同时仍需要确保 axios/错误日志不记录请求体。

### I4. 测试未覆盖上述强制头、乐观锁和拒绝路径

`tests/dataMarket/delivery.spec.ts` 只断言 URL/body，未断言 `Idempotency-Key`，且没有 `updateCredentialAuthorizations` 测试；因此 14 个现有相关单测通过仍无法证明真实 OpenAPI 契约。应增加每个 mutation 的 header 与 `version=0` 用例，并测试 409/校验错误不显示成功提示。

## OpenAPI 对照

端点路径本身与草案一致：申请管理 `GET /management/applications`、详情、创建交付，交付/API/版本/运行绑定、凭证、整包验收、问题处理和生命周期执行都定位到相应 management 路径。申请时间线使用 portal 的 `GET /applications/{id}/timeline`，该路径同样存在于草案；是否允许管理端读取属于后端权限设计，不能由前端路径替代验证。

重点不一致是 headers：OpenAPI 第 1023–1269 行逐个声明了写端点的 `IdempotencyKey`，第 1175–1194 行声明授权更新的 `IfMatchVersion`，参数定义第 1353–1371 行明确为 `Idempotency-Key` 与 `If-Match-Version`。

## 已执行的只读验证

- `pnpm test:unit -- tests/dataMarket/delivery.spec.ts tests/dataMarket/api.spec.ts`：4 文件、14 用例通过。
- 未运行构建或修改任何管理端业务源码；测试通过不改变上述静态契约结论。
