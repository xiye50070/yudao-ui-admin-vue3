# 管理端 Slice 2 审查问题修复报告

## 修复结果

| 审查项 | 修复 |
| --- | --- |
| C1 写命令幂等 | `delivery.ts` 为创建交付、API、版本、完成任务、配置凭证、提交验收、处理问题和执行生命周期统一生成并传递 `Idempotency-Key`；生成值为 UUID，满足 OpenAPI 16–100 长度约束。 |
| C2 凭证授权并发控制 | `updateCredentialAuthorizations` 不再接受裸 ID/可选版本；只接受含 `id` 与 `lockVersion` 的服务端快照对象，并严格发送 `If-Match-Version`，包括版本 `0`。 |
| I1 假血缘 | 移除固定 `sourceId: 1`；页面要求操作员选择真实来源类型、来源 ID 和角色，未选择时不可提交。 |
| I2 API 版本校验 | 增加公开 HTTPS 地址、`/` 请求路径、四段说明、非空限流/网络策略、血缘和三份 JSON 的校验；服务端错误不再被误报为 JSON 解析错误。 |
| I3 密钥 DOM 生命周期 | 移除常驻 credential form 的 App Secret/password/show-password 输入。密钥只在 `v-if` 控制的一次性对话框中输入；取消、关闭和提交 finally 都清空，关闭时节点销毁。 |
| I4 契约测试 | 新增全部受 OpenAPI 强制幂等写命令的 header 断言、`If-Match-Version: 0`、以及 API 版本必填字段验证用例。 |

## TDD 证据

1. 修改 `delivery.spec.ts` 后先运行，5 个断言因缺失 `Idempotency-Key`/错误并发头失败。
2. 增加 `deliveryValidation.spec.ts` 后先运行，因验证模块不存在而失败。
3. 实现最小 adapter/验证逻辑后，定向单测通过；随后完成表单接线与格式化。

## 验证

- `pnpm typecheck:data-market`：通过。
- `pnpm test:unit`：5 文件、17 用例通过。
- `pnpm build:dev`：通过；构建输出有既存 legacy CSS `*zoom` 的 lightningcss 警告，未阻断构建。
- `pnpm lint`：未全绿，原因仅为既存且未修改的 `src/components/Verifition/src/Verify/VerifySlide.vue` 格式问题，以及 `src/types/auto-imports.d.ts` 的已有 unused-disable 警告；本次改动的 5 个文件以 `prettier --check` 验证通过。

## 安全边界

- 不持久化 App Secret；请求结束、取消和关闭均清空内存值。
- 前端仅提交公开 API 地址和受保护上游引用；后端仍负责真实密钥、状态、权限、幂等和最终校验。
