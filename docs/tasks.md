# LexOS 寮€鍙戦噷绋嬬锛圡ilestones锛?

| 瀛楁 | 鍐呭 |
|------|------|
| 鏂囨。鐗堟湰 | **2.0**锛圫OP 钀藉湴閲岀▼纰?路 2026-06-02锛?|
| 绮掑害 | **浠呮ā鍧楃骇澶х翰**锛涘師瀛愪换鍔″湪鍚?Milestone **鍚姩鏃?*鍐嶆媶瑙?|
| 鍏ㄥ眬鍩哄噯 | `docs/CONTEXT_SUMMARY.md` v2.0 路 `prd.md` v0.8.1 路 `architecture.md` v1.5 路 `database.md` v1.6.1 路 `ui_design.md` v1.1 |
| 鎵ц绾︽潫 | 鏍圭洰褰?`.cursorrules`锛堣鎽樿 鈫?瀛愭ā鍧楄鑼?鈫?娴嬭瘯 鈫?`git commit` 鍚庢柟鍙笅涓€瀛愪换鍔★級 |

---

## 浣跨敤璇存槑

1. 寮€鍙戜换鎰忎唬鐮佸墠**蹇呴』**鍏堣 `docs/CONTEXT_SUMMARY.md`锛屽啀璇诲綋鍓?Milestone 瀵瑰簲鐨?`architecture.md` / `database.md` / `ui_design.md` / `prd.md` 绔犺妭銆?
2. 鎸?Milestone **搴忓彿鍗囧簭**鎺ㄨ繘锛涘綋鍓?Milestone 楠屾敹閫氳繃骞跺畬鎴愮害瀹?`git commit` 鍚庯紝鏂瑰彲鍚姩涓嬩竴 Milestone銆?
3. 鏈枃**涓嶅寘鍚?*鍘熷瓙 checkbox锛涙媶瑙ｇ粨鏋滃啓鍏ュ悇 Milestone 鍚姩鏃剁殑瀛愪换鍔℃钀斤紙鎴栫嫭绔?`docs/tasks/m{N}.md`锛岀敱瀹炴柦鏃跺喅瀹氾級銆?

---

## Part A 鈥?鍩哄骇鑳藉姏锛圡0鈥揗9锛夈€愬凡瀹屾垚銆?

浠ヤ笅閲岀▼纰戝凡浜?**2026-05-31** 灏佺増楠屾敹锛堢粏鑺傝 git 鍘嗗彶 `feat/*` / `chore(release)/*` 鎻愪氦锛夈€?*绂佹**鍦ㄦ湭鑾锋槑纭寚浠ゆ椂閲嶅瀹炵幇鍩哄骇鍔熻兘銆?

| ID | 妯″潡 | 浜や粯鐗╂憳瑕?| 鐘舵€?|
|----|------|------------|------|
| **M0** | 鍩虹璁炬柦涓庢暟鎹簱杩佺Щ | Supabase CLI銆乵onorepo 楠ㄦ灦銆佹牳蹇冭〃/RLS/Storage銆乣seed` 鍐呯疆 admin | 宸插畬鎴?|
| **M1** | 璁よ瘉銆佷細璇濅笌涓汉涓績 | 铏氭嫙閭鐧诲綍銆佹敼瀵嗛棬绂併€乸rofile銆乄eb Guard | 宸插畬鎴?|
| **M2** | 绠＄悊鍛?鈥?鐢ㄦ埛绠＄悊 | `/api/admin/users/*`銆佺鐞嗙鐢ㄦ埛 CRUD/绂佺敤/閲嶇疆瀵嗙爜 | 宸插畬鎴?|
| **M3** | 绠＄悊鍛?鈥?AI 鍩虹璁炬柦 | 妯″瀷鍑瘉銆佸姛鑳芥槧灏勩€丳rompt銆佽繛閫氭€ф祴璇?| 宸插畬鎴?|
| **M4** | 璇煶杞啓 鈥?BFF 涓婁紶 | TUS init/complete銆佷换鍔″垪琛ㄣ€丱utbox 棣栬鍐欏叆 | 宸插畬鎴?|
| **M5** | 寮傛娴佹按绾?Worker锛圲3锛?| Postgres Outbox 浜旈樁娈点€丗Fmpeg/ASR/LLM銆丼talled Cron | 宸插畬鎴?|
| **M6** | 寰嬪笀绔?鈥?杞啓宸ヤ綔鍙?| 鏍″/缂栬緫鍙屾ā寮忋€両f-Match銆佸鍑恒€佺鍚嶄笅杞?| 宸插畬鎴?|
| **M7** | 涓汉浜戠洏涓庡叏鏂囨绱?| `drive_nodes` CRUD銆乣pg_trgm` 妫€绱€佺鍚嶄笅杞?| 宸插畬鎴?|
| **M8** | 瀹¤鏃ュ織涓庣郴缁熼厤缃?| `/api/admin/audit/*`銆乣/api/admin/settings/*`銆丄uditWriter | 宸插畬鎴?|
| **M9** | 闆嗘垚楠屾敹涓庣鏈夊寲灏辩华 | E2E 鍩哄缓銆乧ompliance 鑴氭湰銆乣DEPLOYMENT.md`銆乣OPEN_ISSUES.md` | 宸插畬鎴?|

**鍩哄骇渚濊禆绠€鍥?*锛堝彧璇诲弬鑰冿級锛?

```
M0 鈫?M1 鈫?M2 鈹€鈹啋 M3
              鈹溾啋 M4 鈫?M5 鈫?M6
              鈹斺啋 M7
M* 鈫?M9
```

---

## Part B 鈥?SOP 鏁板瓧娴佹按绾匡紙寰呭紑鍙戯級

**涓氬姟杈圭晫**锛堟憳鑷?`CONTEXT_SUMMARY.md` 搂6鈥撀?锛夛細妯℃澘鐗堟湰蹇収銆佹浠舵祦姘寸嚎銆佷骇鍑虹墿涔愯閿佷笌瀹氱琛€缂樸€佸洓绫?`sync_llm` / `async_deep_research` / `manual` 姝ラ銆乁3 闃舵 `sop.media.ocr` / `sop.deep_research` / `sop.pdf_export`銆乣exports` 妗?PDF銆佹樉寮?`close` 缁撴銆係OP 闇€姹傞」 `PRD-SOP-01锝?9` 宸茬鏀躲€?

**浠撳簱鐜扮姸**锛歚supabase/migrations` 涓?*灏氭棤** SOP 鐩稿叧杩佺Щ锛涘簲鐢ㄤ唬鐮?*灏氭棤** `/api/sops/*` 涓?U3 `sop.*` Handler銆?

**鍓嶇疆鏉′欢**锛歅art A锛圡0鈥揗9锛夊凡浜や粯锛汳3 AI 閰嶇疆琛ㄥ彲鎵╁睍 SOP 鍔熻兘鐐广€?

**浜哄伐楠屾敹**锛歁10鈥揗17 鍚?Milestone **瀹屾垚闂ㄧ**鏈熬鍧囧惈 **銆愪汉宸ラ粦鐩掋€?* 浠诲姟锛岀敱浜哄伐鍦ㄨ仈璋?棰勫彂鐜鎵ц锛涢』鍦?`docs/E2E_MANUAL_RUN_LOG.md` 瀹屾垚 **銆愪汉宸ラ粦鐩掗獙鏀剁鏀躲€?* 鍚庯紝鏂瑰彲 `git commit` 骞跺惎鍔ㄤ笅涓€ Milestone銆?

---

### Milestone 10锛歋OP 鍩虹璁炬柦涓庢暟鎹簱杩佺Щ锛圫upabase CLI锛?

**鐩爣**锛歋OP 涓撶敤 schema銆佹灇涓炬墿灞曘€丷LS銆丼torage `exports` 绛栫暐銆乣system_settings` 閿€丄I 鍔熻兘鐐圭瀛愯惤搴撱€?

**璁捐鍩哄噯**锛歚prd.md` 搂1.5銆伮?.4銆伮?.2锛圫OP 鐭╅樀锛夈€伮?.4.1锛圥rompt Studio 鏁版嵁渚濊禆锛夛紱`architecture.md` 搂3.2.6锛坄sop.*` stage銆乣aggregate_type=case_pipeline`锛夛紱`database.md` 搂1.2銆伮?.16銆伮?.12銆伮?.16.8銆?

**鍓嶇疆渚濊禆**锛歅art A **M0鈥揗9 宸插畬鎴?*锛坄profiles`銆丄I 閰嶇疆琛ㄣ€乣upload_sessions`銆乣outbox_events`銆乣exports` 妗躲€乣append_audit_log` 宸插瓨鍦級銆?

**楠屾敹闂ㄧ**锛歚supabase db push` 鎴愬姛锛沗assertMigrationsManifest(M10_MIGRATIONS)` 缁匡紱寰嬪笀 JWT 鏃犳硶璇讳粬浜?`case_pipelines`锛沗git commit` 鍚庤繘鍏?M11銆?

---

#### M10-A Supabase CLI 涓庤縼绉绘枃浠堕鏋?

- [x] 鎵ц `npx supabase migration new enums_sop`锛涘湪鐢熸垚鐨?`supabase/migrations/<timestamp>_enums_sop.sql` 鏂囦欢椤堕儴鍐欏叆娉ㄩ噴锛氬熀鍑?`database.md` 搂1.2銆乣搂3.16.3鈥撀?.16.5`
  - **渚濊禆**锛歅art A M0 宸插畬鎴?
- [x] 涓?`enums_sop.sql` 鏂板闈欐€佹祴璇?`packages/shared/src/migrations/m10-enums-sop.migration.test.ts`锛氭柇瑷€鏂囦欢鍚?`sop_execution_type`銆乣pipeline_artifact_status` 鍙婂洓鏉?`sop.` `ai_feature_key` 鎵╁睍
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鎵ц `npx supabase migration new audit_action_sop`锛涘垱寤虹┖杩佺Щ鏂囦欢渚?搂M10-B2 鍐欏叆
  - **渚濊禆**锛歁10-A 绗竴鏉?
- [x] 鏂板 `packages/shared/src/migrations/m10-audit-action-sop.migration.test.ts`锛氭柇瑷€杩佺Щ鏂囦欢鍚?`sop.template.publish`銆乣sop.artifact.verify`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鎵ц `npx supabase migration new tables_sop_templates`锛涘垱寤虹┖杩佺Щ鏂囦欢
  - **渚濊禆**锛歁10-B1 `enums_sop` 鏂囦欢宸插垱寤猴紙鍚屾壒娆″彲骞惰锛屽簲鐢ㄩ『搴忓湪 B1 涔嬪悗锛?
- [x] 鏂板 `packages/shared/src/migrations/m10-tables-sop-templates.migration.test.ts`锛氭柇瑷€鍚?`CREATE TABLE public.sop_templates`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鎵ц `npx supabase migration new tables_sop_template_versions`
  - **渚濊禆**锛歚tables_sop_templates` 杩佺Щ鏂囦欢宸插垱寤?
- [x] 鏂板 `packages/shared/src/migrations/m10-tables-sop-template-versions.migration.test.ts`锛氭柇瑷€鍚?`UNIQUE (template_id, version_number)`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鎵ц `npx supabase migration new tables_sop_steps`
  - **渚濊禆**锛歚tables_sop_template_versions` 杩佺Щ鏂囦欢宸插垱寤?
- [x] 鏂板 `packages/shared/src/migrations/m10-tables-sop-steps.migration.test.ts`锛氭柇瑷€鍚?`UNIQUE (template_version_id, step_code)`銆乣depends_on`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鎵ц `npx supabase migration new tables_case_pipelines`
  - **渚濊禆**锛歚tables_sop_steps` 杩佺Щ鏂囦欢宸插垱寤?
- [x] 鏂板 `packages/shared/src/migrations/m10-tables-case-pipelines.migration.test.ts`锛氭柇瑷€鍚?`case_pipeline_status`銆乣lawyer_id`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鎵ц `npx supabase migration new tables_pipeline_artifacts`
  - **渚濊禆**锛歚tables_case_pipelines` 杩佺Щ鏂囦欢宸插垱寤?
- [x] 鏂板 `packages/shared/src/migrations/m10-tables-pipeline-artifacts.migration.test.ts`锛氭柇瑷€鍚?`finalized_snapshot_raw`銆乣UNIQUE (pipeline_id, step_code)`銆乣pipeline_artifacts_set_updated_at`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鎵ц `npx supabase migration new upload_sessions_sop`
  - **渚濊禆**锛歚tables_case_pipelines` 杩佺Щ鏂囦欢宸插垱寤?
- [x] 鏂板 `packages/shared/src/migrations/m10-upload-sessions-sop.migration.test.ts`锛氭柇瑷€鍚?`pipeline_id` 鎴?`session_kind` 鍙?`task_id` 鍙┖绾︽潫锛堝嵎瀹?TUS 涓撶敤锛宍architecture.md` 搂3.2.6.8锛?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鎵ц `npx supabase migration new rls_sop`
  - **渚濊禆**锛氬叏閮?SOP 琛ㄨ縼绉绘枃浠跺凡鍒涘缓
- [x] 鏂板 `packages/shared/src/migrations/m10-rls-sop.migration.test.ts`锛氭柇瑷€鍚?`sop_templates`銆乣case_pipelines`銆乣pipeline_artifacts` 鐨?`ENABLE ROW LEVEL SECURITY`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鎵ц `npx supabase migration new storage_exports_sop_path`
  - **渚濊禆**锛歅art A `storage_buckets_policies` 宸插簲鐢?
- [x] 鏂板 `packages/shared/src/migrations/m10-storage-exports-sop-path.migration.test.ts`锛氭柇瑷€ `exports` 绛栫暐鏍￠獙璺緞鍚?`sops` 娈碉紙`database.md` 搂3.16.8锛?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鎵ц `npx supabase migration new seed_system_settings_sop`
  - **渚濊禆**锛歅art A `tables_audit_system` 宸插簲鐢?
- [x] 鏂板 `packages/shared/src/migrations/m10-seed-system-settings-sop.migration.test.ts`锛氭柇瑷€ `INSERT INTO public.system_settings` 涓?key 涓?`sop.deep_research_enabled`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M10-B SQL 杩佺Щ姝ｆ枃锛堟瘡鏉¤縼绉讳竴涓啓鍏ヤ换鍔?+ 涓€涓祴璇曚换鍔★級

- [x] 鍦?`enums_sop.sql` 涓啓鍏?`CREATE TYPE public.sop_execution_type AS ENUM ('sync_llm','async_deep_research','manual')`
  - **渚濊禆**锛歁10-A `enums_sop` 鏂囦欢宸插垱寤?
- [x] 鎵╁睍 `enums_sop.sql` 娴嬭瘯锛氭洿鏂?`m10-enums-sop.migration.test.ts` 鏂█ `sync_llm` 涓夊瓧闈㈠€煎潎瀛樺湪
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`enums_sop.sql` 涓啓鍏?`CREATE TYPE public.case_pipeline_status AS ENUM ('in_progress','completed','suspended')`
  - **渚濊禆**锛歁10-B1 绗竴鏉?
- [x] 鏂板鏂█ `case_pipeline_status` 鐨?`m10-enums-sop.migration.test.ts` 鐢ㄤ緥
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`enums_sop.sql` 涓啓鍏?`CREATE TYPE public.pipeline_artifact_status AS ENUM ('running','draft','failed','finalized')`
  - **渚濊禆**锛歁10-B2 绗竴鏉?
- [x] 鏂板鏂█鍥涙€?`pipeline_artifact_status` 鐨勬祴璇曠敤渚?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`enums_sop.sql` 涓啓鍏?`CREATE TYPE public.artifact_content_type AS ENUM ('markdown','html','json')`
  - **渚濊禆**锛歁10-B3 绗竴鏉?
- [x] 鏂板鏂█ `artifact_content_type` 鐨勬祴璇曠敤渚?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`enums_sop.sql` 涓墽琛?`ALTER TYPE public.ai_feature_key ADD VALUE IF NOT EXISTS 'sop.fact_extract'`锛堝叾浣欎笁鏉?SOP 鍊煎悓鐞嗭紝鍏卞洓娆★級
  - **渚濊禆**锛歁10-B4 绗竴鏉?
- [x] 鏇存柊 `m10-enums-sop.migration.test.ts`锛氭柇瑷€鍥涗釜 `ADD VALUE` 瀛愪覆鍧囧瓨鍦?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`audit_action_sop.sql` 涓墿灞?`audit_action`锛歚sop.template.publish`銆乣sop.prompt.update`銆乣sop.artifact.export_pdf`銆乣sop.artifact.verify`锛坄prd.md` 闄勫綍瀹¤琛級
  - **渚濊禆**锛歁10-A `audit_action_sop` 鏂囦欢宸插垱寤?
- [x] 杩愯 `m10-audit-action-sop.migration.test.ts` 鍏ㄧ豢
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`tables_sop_templates.sql` 涓啓鍏?`CREATE TABLE public.sop_templates`锛坄id`,`name`,`case_type`,`created_by`,`created_at` + FK/index锛?
  - **渚濊禆**锛歚enums_sop` 杩佺Щ**宸插啓鍏ョ鐩?*锛堟湰鍦?`migration up` 鍓嶅彲浠呬緷璧栨枃浠堕『搴忥級
- [x] 鏇存柊 `m10-tables-sop-templates.migration.test.ts` 鏂█ `case_type VARCHAR`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`tables_sop_template_versions.sql` 涓啓鍏?`CREATE TABLE public.sop_template_versions` 鍙?`UNIQUE (template_id, version_number)`
  - **渚濊禆**锛歚tables_sop_templates.sql` 姝ｆ枃宸插啓鍏?
- [x] 鏇存柊 `m10-tables-sop-template-versions.migration.test.ts` 鏂█ `is_published`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`tables_sop_steps.sql` 涓啓鍏?`CREATE TABLE public.sop_steps`锛堝惈 `input_schema`銆乣depends_on` 榛樿 `'[]'`銆乣requires_verification` 榛樿 `false`锛?
  - **渚濊禆**锛歚tables_sop_template_versions.sql` 姝ｆ枃宸插啓鍏?
- [x] 鏇存柊 `m10-tables-sop-steps.migration.test.ts` 鏂█ `execution_type` 鍒楃被鍨嬩负 `sop_execution_type`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`tables_case_pipelines.sql` 涓啓鍏?`CREATE TABLE public.case_pipelines`锛坄lawyer_id`銆乣template_version_id`銆乣status`銆乣current_step_code`锛?
  - **渚濊禆**锛歚tables_sop_steps.sql` 姝ｆ枃宸插啓鍏?
- [x] 鏇存柊 `m10-tables-case-pipelines.migration.test.ts` 鏂█ FK 鈫?`sop_template_versions`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`tables_pipeline_artifacts.sql` 涓啓鍏?`CREATE TABLE public.pipeline_artifacts`锛堝惈 `version` 榛樿 1銆乣finalized_snapshot_raw`锛?
  - **渚濊禆**锛歚tables_case_pipelines.sql` 姝ｆ枃宸插啓鍏?
- [x] 鍦?`tables_pipeline_artifacts.sql` 涓寕杞?`BEFORE UPDATE` 瑙﹀彂鍣?`pipeline_artifacts_set_updated_at` 鈫?`public.set_updated_at()`
  - **渚濊禆**锛氫笂涓€鏉?
- [x] 鏇存柊 `m10-tables-pipeline-artifacts.migration.test.ts` 鏂█ `linked_drive_node_id` FK 鈫?`drive_nodes`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`upload_sessions_sop.sql` 涓柊澧?`pipeline_id UUID NULL REFERENCES public.case_pipelines(id)`锛涘皢 `task_id` 鏀逛负 **NULLABLE**锛涘鍔?`CHECK`锛坄task_id` 涓?`pipeline_id` 鎭版湁涓€涓潪绌猴級
  - **渚濊禆**锛歚tables_case_pipelines.sql` 姝ｆ枃宸插啓鍏?
- [x] 鏇存柊 `m10-upload-sessions-sop.migration.test.ts` 鏂█ `upload_sessions_task_or_pipeline_chk`锛堟垨绛変环绾︽潫鍚嶏級
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`rls_sop.sql` 涓负 `sop_templates` / `sop_template_versions` / `sop_steps` 鍐欏叆 **admin CRUD** 绛栫暐锛坄is_admin()`锛?
  - **渚濊禆**锛歋OP 涓夎〃杩佺Щ姝ｆ枃宸插啓鍏?
- [x] 涓轰笂杩颁笁琛ㄥ啓鍏?**lawyer SELECT** 绛栫暐锛氫粎 `is_published = true` 鐨勭増鏈強鍏舵楠わ紙`database.md` 搂3.16.6锛?
  - **渚濊禆**锛氫笂涓€鏉?
- [x] 鏇存柊 `m10-rls-sop.migration.test.ts` 鏂█ `sop_template_versions` 寰嬪笀绛栫暐鍚?`is_published`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`rls_sop.sql` 涓负 `case_pipelines` / `pipeline_artifacts` 鍐欏叆寰嬪笀 **CRUD** 绛栫暐锛歚lawyer_id = auth.uid()`锛堢粡 `case_pipelines` 杩炴帴锛?
  - **渚濊禆**锛歁10-B12 绗笁鏉?
- [x] 鏇存柊 `m10-rls-sop.migration.test.ts` 鏂█ `case_pipelines` 鏃?`is_admin()` 璇诲緥甯堜笟鍔℃暟鎹瓥鐣?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`storage_exports_sop_path.sql` 涓?**鏇挎崲鎴栧琛?* `exports` 鐨?`INSERT` 绛栫暐锛氳矾寰勯』鍖归厤 `{uuid}/sops/{uuid}/{uuid}.pdf`锛坄database.md` 搂3.16.8锛涗繚鐣欓娈?`auth.uid()`锛?
  - **渚濊禆**锛歅art A `storage_buckets_policies` 宸插簲鐢?
- [x] 杩愯 `m10-storage-exports-sop-path.migration.test.ts` 鍏ㄧ豢
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`seed_system_settings_sop.sql` 涓?`INSERT ... ON CONFLICT` 鍐欏叆 `sop.deep_research_enabled` = `true`锛圝SONB 甯冨皵锛?
  - **渚濊禆**锛歚system_settings` 琛ㄥ凡瀛樺湪
- [x] 杩愯 `m10-seed-system-settings-sop.migration.test.ts` 鍏ㄧ豢
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏈湴鎵ц `npx supabase db push`锛堟垨 `migration up`锛夊簲鐢?M10-B 鍏ㄩ儴杩佺Щ锛涚‘璁ゆ棤 SQL 閿欒
  - **渚濊禆**锛歁10-B1锝濨16 鍏ㄩ儴 SQL 宸插啓鍏?
- [x] 鏂板 `packages/shared/src/db/m10-migrations-applied.integration.test.ts`锛氭煡璇?`information_schema.tables` 鏂█浜斿紶 SOP 琛ㄥ瓨鍦紙`skip` 鏃?`SUPABASE_DB_URL`锛?
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M10-C `packages/shared` 鈥?SOP 鏋氫妇锛堟瘡涓灇涓炬枃浠朵竴瀵逛换鍔★級

- [x] 鏂板 `packages/shared/src/enums/sop-execution-type.ts`锛氬鍑?`SopExecutionType` 甯搁噺瀵硅薄涓?`isSopExecutionType()`
  - **渚濊禆**锛氭棤锛堝彲涓庤縼绉诲苟琛岋紝鍚堝苟鍓嶉』涓?DB 鏋氫妇涓€鑷达級
- [x] 鏂板 `packages/shared/src/enums/sop-execution-type.test.ts`锛氳鐩栦笁鍊间笌闈炴硶瀛楃涓?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/enums/case-pipeline-status.ts`锛氬鍑?`CasePipelineStatus` 涓?`isCasePipelineStatus()`
  - **渚濊禆**锛氭棤
- [x] 鏂板 `packages/shared/src/enums/case-pipeline-status.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/enums/pipeline-artifact-status.ts`锛氬鍑?`PipelineArtifactStatus`锛坄running|draft|failed|finalized`锛?
  - **渚濊禆**锛氭棤
- [x] 鏂板 `packages/shared/src/enums/pipeline-artifact-status.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/enums/artifact-content-type.ts`锛氬鍑?`ArtifactContentType`
  - **渚濊禆**锛氭棤
- [x] 鏂板 `packages/shared/src/enums/artifact-content-type.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鎵╁睍 `packages/shared/src/enums/ai-feature-key.ts`锛氳拷鍔?`SOP_FACT_EXTRACT` 绛夊洓涓父閲忥紱鎵╁睍 `AI_FEATURE_KEY_VALUES`
  - **渚濊禆**锛氭棤
- [x] 鏇存柊 `packages/shared/src/enums/ai-feature-key.test.ts`锛氭柇瑷€ `isAiFeatureKey('sop.fact_extract')` 涓?true
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/enums/sop-ai-feature-keys.ts`锛氬鍑?`SOP_AI_FEATURE_KEY_VALUES` 鍙鏁扮粍锛堝洓鍔熻兘鐐癸級
  - **渚濊禆**锛歚ai-feature-key.ts` 宸叉墿灞?
- [x] 鏂板 `packages/shared/src/enums/sop-ai-feature-keys.test.ts`锛氶暱搴︽亽涓?4
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M10-D `packages/shared` 鈥?閿欒鐮併€丱utbox 闃舵銆佺郴缁熻缃敭

- [x] 鍦?`packages/shared/src/api/error-code.ts` 鐨?`ErrorCode` 涓柊澧?`CONTEXT_LIMIT_EXCEEDED`
  - **渚濊禆**锛氭棤
- [x] 鍦?`error-code.ts` 鐨?`ERROR_CODE_HTTP_STATUS` 涓负 `CONTEXT_LIMIT_EXCEEDED` 鏄犲皠 **422**
  - **渚濊禆**锛氫笂涓€鏉?
- [x] 鏇存柊 `packages/shared/src/api/error-code.test.ts`锛氭柇瑷€ 422 鏄犲皠涓?`isErrorCode` 璇嗗埆
  - **渚濊禆**锛氫笂涓ゆ潯

- [x] 鏂板 `packages/shared/src/constants/sop-pipeline-stages.ts`锛氬鍑?`SOP_STAGE_MEDIA_OCR`銆乣SOP_STAGE_DEEP_RESEARCH`銆乣SOP_STAGE_PDF_EXPORT` 鍙?`SOP_PIPELINE_STAGES`
  - **渚濊禆**锛氭棤
- [x] 鏂板 `packages/shared/src/constants/sop-pipeline-stages.test.ts`锛氭柇瑷€ `isSopPipelineStage()` 涓?`architecture.md` 搂3.2.6.2 涓夊瓧闈㈠€间竴鑷?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鎵╁睍 `packages/shared/src/constants/pipeline-stages.ts`锛氬鍑鸿仈鍚堢被鍨?`PipelineStage | SopPipelineStage` 鐨?`ALL_WORKER_STAGES`锛堣浆鍐欎簲闃舵 + SOP 涓夐樁娈碉級
  - **渚濊禆**锛歚sop-pipeline-stages.ts` 宸插瓨鍦?
- [x] 鏇存柊 `packages/shared/src/constants/pipeline-stages.test.ts`锛氭柇瑷€ `ALL_WORKER_STAGES` 闀垮害涓?8
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/constants/sop-system-settings-keys.ts`锛氬鍑?`SOP_DEEP_RESEARCH_ENABLED_KEY = 'sop.deep_research_enabled'`
  - **渚濊禆**锛氭棤
- [x] 鏂板 `packages/shared/src/constants/sop-system-settings-keys.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/types/sop-outbox-payload.ts`锛氬畾涔?`SopOutboxPayload`锛坄stage` + `pipeline_id` + `step_code` + `artifact_id` 鍙€夊瓧娈碉級
  - **渚濊禆**锛歚sop-pipeline-stages.ts` 宸插瓨鍦?
- [x] 鏂板 `packages/shared/src/types/sop-outbox-payload.test.ts`锛氭柇瑷€ `aggregate_type` 鏂囨。娉ㄩ噴涓?`case_pipeline`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`packages/shared/src/index.ts` 涓?re-export M10-C銆丮10-D 鏂板妯″潡
  - **渚濊禆**锛歁10-C銆丮10-D 鍏ㄩ儴婧愭枃浠跺凡瀛樺湪
- [x] 鏂板 `packages/shared/src/index.m10-exports.test.ts`锛氶潤鎬?import 鏂█ `SOP_PIPELINE_STAGES`銆乣ErrorCode.CONTEXT_LIMIT_EXCEEDED` 鍙В鏋?
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M10-E `packages/shared` 鈥?杩佺Щ manifest锛圡10 鐧昏锛?

- [x] 鍦?`packages/shared/src/migrations/manifest.ts` 涓柊澧炲鍑烘暟缁?`M10_MIGRATIONS`锛堝惈 `enums_sop`锝瀈seed_system_settings_sop` 鍏?11 椤?`requiredSnippets`锛?
  - **渚濊禆**锛歁10-B 鍚勮縼绉?SQL 姝ｆ枃宸插啓鍏?
- [x] 鏂板 `packages/shared/src/migrations/manifest.m10.test.ts`锛氳皟鐢?`assertMigrationsManifest(M10_MIGRATIONS)`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`manifest.ts` 涓柊澧炲嚱鏁?`listExpectedM10MigrationNames(): readonly string[]`
  - **渚濊禆**锛歚M10_MIGRATIONS` 宸插畾涔?
- [x] 涓?`listExpectedM10MigrationNames` 鏂板鍗曞厓娴嬭瘯锛氳繑鍥為暱搴?11 涓斿惈 `rls_sop`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M10-F 鐜鍙橀噺妯℃澘锛圫OP Worker 闄愰锛?

- [x] 鍦?`.env.example` 涓拷鍔?`SOP_PDF_MAX_CONCURRENT=1`銆乣SOP_DEEP_RESEARCH_MAX_CONCURRENT=2`銆乣SOP_DEEP_RESEARCH_TIMEOUT_MS=1800000`锛堟敞閲婂紩鐢?`architecture.md` 搂3.2.6.3銆伮?.2.6.9锛?
  - **渚濊禆**锛氭棤
- [x] 鏂板 `packages/shared/src/config/sop-worker-runtime-env.test.ts`锛氭枃妗ｅ寲鏂█涓夊彉閲忓悕瀛樺湪浜?`.env.example` 鏂囨湰锛堣鏂囦欢锛屼笉杩炵綉锛?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/config/sop-worker-runtime-env.ts`锛氬鍑?`loadSopWorkerRuntimeEnvFromProcess()` 瑙ｆ瀽涓婅堪涓夊彉閲忛粯璁ゅ€?
  - **渚濊禆**锛氭棤
- [x] 鏂板 `packages/shared/src/config/sop-worker-runtime-env.parse.test.ts`锛氱己鐪?env 鏃?PDF=1銆丏R=2銆乼imeout=1800000
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`packages/shared/src/config/worker-runtime-env.ts` 涓悎骞?`loadSopWorkerRuntimeEnvFromProcess()` 杩斿洖鍊煎埌 `WorkerRuntimeEnvConfig`
  - **渚濊禆**锛歚sop-worker-runtime-env.ts` 宸插瓨鍦?
- [x] 鏇存柊 `packages/shared/src/config/worker-runtime-env.test.ts`锛氭柇瑷€鍚堝苟鍚庡瓧娈靛瓨鍦?
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M10-G Seed 鈥?SOP AI 鍔熻兘鐐规槧灏勫崰浣?

- [x] 鍦?`supabase/seed.sql`锛堟垨鐙珛 `supabase/seeds/sop_ai_mappings.sql` 骞剁敱 config 寮曠敤锛変腑缂栧啓娉ㄩ噴鍧楋細鍥?SOP `feature_key` 椤绘寚鍚戝凡瀛樺湪 `ai_model_credentials.id` 鐨勫箓绛?`INSERT` 妯℃澘
  - **渚濊禆**锛歁10-B `enums_sop` 宸?push锛汳3 鑷冲皯涓€鏉℃ā鍨?seed 瀛樺湪銆愭棤妯″瀷鍒欒烦杩?INSERT 浠呬繚鐣欐敞閲娿€?
- [x] 鏂板 `packages/shared/src/seed/sop-ai-mappings-seed.test.ts`锛氳В鏋?seed 鏂囦欢鏂█鍚洓涓?`sop.` feature_key 瀛楅潰閲?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/seed/run-sop-ai-mappings-seed-cli.ts`锛欳LI 鍦ㄥ瓨鍦ㄩ粯璁ゆā鍨嬫椂瀵瑰洓鍔熻兘鐐?`INSERT ... ON CONFLICT DO NOTHING`
  - **渚濊禆**锛歚sop-ai-mappings-seed.test.ts` 宸茬豢
- [x] 鏂板 `packages/shared/src/seed/run-sop-ai-mappings-seed-cli.test.ts`锛歁ock DB锛涙柇瑷€涓嶇‖缂栫爜 API Key
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M10-H RLS 闆嗘垚娴嬭瘯鍩哄缓锛堝緥甯堥殧绂伙級

- [x] 鏂板 `packages/shared/src/rls/case-pipelines-rls.ts`锛氬鍑?`fetchCasePipelineAsUser(pipelineId, accessToken)` 灏佽 Supabase 瀹㈡埛绔煡璇?
  - **渚濊禆**锛歁10-B `rls_sop` 宸?push
- [x] 鏂板 `packages/shared/src/rls/case-pipelines-rls.test.ts`锛歁ock 瀹㈡埛绔紱鏂█浣跨敤 `case_pipelines` 琛ㄥ悕
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/rls/case-pipelines-rls.integration.test.ts`锛氬緥甯?A JWT 鏃犳硶 `SELECT` 寰嬪笀 B 鐨?`case_pipelines` 琛岋紙`skip` 鏃犺仈璋?env锛?
  - **渚濊禆**锛歚case-pipelines-rls.ts` 宸插瓨鍦紱鑱旇皟搴撳凡鏈変袱鍚嶅緥甯?seed
- [x] 鏂板 `packages/shared/src/rls/case-pipelines-rls.integration.test.ts` 绗簩鐢ㄤ緥锛氬緥甯堟棤娉?`SELECT` 浠栦汉 `pipeline_artifacts`锛堢粡 `pipeline_id`锛?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/rls/sop-templates-rls.integration.test.ts`锛氬緥甯?JWT 鍙?`SELECT` `is_published=true` 鐨?`sop_template_versions`锛涗笉鍙?`INSERT` `sop_templates`
  - **渚濊禆**锛歁10-B `rls_sop` 宸?push锛涜仈璋冨簱瀛樺湪涓€鏉″凡鍙戝竷鐗堟湰 seed銆愭祴璇曟暟鎹彲鍦ㄧ敤渚?`beforeAll` 鐢?service_role 鎻掑叆銆?
- [x] 涓?`sop-templates-rls.integration.test.ts` 澧炲姞 admin JWT 鍙?`INSERT sop_templates` 鏂█
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M10-I Milestone 10 瀹屾垚闂ㄧ

- [x] 杩愯 `npm run test --workspace=@lexos/shared`锛堟垨浠撳簱绛変环鍛戒护锛夎鐩?M10-C锝濵10-H 鏂板娴嬭瘯锛涜繛缁け璐?**>2** 娆″垯鍋滄骞舵眹鎶?
  - **渚濊禆**锛歁10-A锝濵10-H 鍏ㄩ儴 checkbox 宸插畬鎴?
- [x] 鎵ц `npx supabase migration list`锛涗汉宸ユ牳瀵?M10 鐨?11 涓縼绉诲潎涓?**applied**
  - **渚濊禆**锛歚db push` 宸叉垚鍔?

**浜哄伐榛戠洅楠屾敹**锛堢敱浜哄伐鍦ㄨ仈璋?棰勫彂鐜鎵ц锛屼笉閫氳繃涓嶅緱 `git commit`锛夛細

- [x] **銆愪汉宸ラ粦鐩掋€?* 鍦?Supabase Studio 鎴?psql 纭浜斿紶 SOP 琛紙`sop_templates`銆乣sop_template_versions`銆乣sop_steps`銆乣case_pipelines`銆乣pipeline_artifacts`锛夊瓨鍦ㄤ笖 RLS 宸插惎鐢?
  - **渚濊禆**锛歚db push` 鎴愬姛
- [x] **銆愪汉宸ラ粦鐩掋€?* 浣跨敤涓ゅ悕寰嬪笀娴嬭瘯璐﹀彿 JWT锛氬緥甯?A **鏃犳硶** `SELECT` 寰嬪笀 B 鐨?`case_pipelines` / `pipeline_artifacts` 琛?
  - **渚濊禆**锛歁10-H RLS 闆嗘垚娴嬪凡缁挎垨鑱旇皟 seed 涓ゅ悕寰嬪笀
- [x] **銆愪汉宸ラ粦鐩掋€?* Storage锛歚exports` 妗跺凡鍒涘缓锛涚瓥鐣ヨ姹傚璞¤矾寰勪互 `{owner_id}/` 寮€澶达紙鎶芥煡涓€鏉＄瓥鐣ユ枃妗堟垨璇曚紶杩濊璺緞琚嫆缁濓級
  - **渚濊禆**锛歁10-F Storage 杩佺Щ
- [x] **銆愪汉宸ラ粦鐩掋€?* `system_settings`锛堟垨绛変环閰嶇疆锛夊瓨鍦?`sop.deep_research_enabled` 涓旈粯璁ゅ€间负 `true`
  - **渚濊禆**锛歁10-G seed
- [x] **銆愪汉宸ラ粦鐩掗獙鏀剁鏀躲€?* 鍦?`docs/E2E_MANUAL_RUN_LOG.md` 杩藉姞 **M10** 灏忚妭锛氶獙鏀朵汉銆佹棩鏈熴€佺幆澧冦€佷笂杩伴」閫氳繃/澶辫触澶囨敞
  - **渚濊禆**锛氫笂鍒楅粦鐩掗」鍧囬€氳繃

- [x] 鎵ц `git commit`锛歚feat(db): sop schema enums rls storage seed and shared types`
  - **渚濊禆**锛氭祴璇曞叏缁匡紱**浜哄伐榛戠洅楠屾敹绛炬敹**锛沗git status` 鏃犳湭鎻愪氦 M10 鍙樻洿
- [x] 灏嗕笅鏂硅繘搴﹁〃 **M10** 鐘舵€佹洿鏂颁负銆屽凡瀹屾垚銆?
  - **渚濊禆**锛歚git commit` 鎴愬姛

**M10 鏄庣‘寤跺悗锛堝綊灞?M11+锛?*锛歚AiOrchestrationService` SOP 璋冪敤瀹炵幇銆丮ustache 鎻掓Ы娓叉煋銆乣/api/admin/sops/*` 璺敱銆乁3 `sop.*` Handler 娉ㄥ唽銆丄dmin/寰嬪笀 SOP 鍓嶇椤甸潰銆?

---

### Milestone 11锛欰I 鑳藉姏鎵╁睍锛圫OP 鍔熻兘鐐逛笌缂栨帓鍩哄骇锛?

**鐩爣**锛氬湪鏃㈡湁 M3 AI 鏍堜笂鎺ュ叆 SOP 鍥涘姛鑳界偣锛沀2/U3 鍏辩敤缂栨帓閫昏緫锛汼OP LLM **寮哄埗** `temperature: 0`锛汿oken 瓒呴檺 **422** `CONTEXT_LIMIT_EXCEEDED`锛堢姝㈡埅鏂級锛沗ai_invocation_logs` 鏀寔 `task_id=NULL` + `metadata.pipeline_id`/`step_code`銆?

**璁捐鍩哄噯**锛歚prd.md` 搂1.4 A8銆伮?.3鈥撀?.4.1銆伮?.2.2鈥撀?.2.4锛圓I-06锝?8銆丼OP L1鈥揕4锛夛紱`architecture.md` 搂3.2.6.11銆伮?.3.3.1銆伮?.2.5锛沗database.md` 搂3.10 `metadata` 绾﹀畾銆?

**鍓嶇疆渚濊禆**锛?*Milestone 10 宸插畬鎴?*锛圫OP 鏋氫妇銆乣CONTEXT_LIMIT_EXCEEDED`銆乣SOP_AI_FEATURE_KEY_VALUES`銆乣system_settings.sop.deep_research_enabled` 绉嶅瓙锛夈€?

**楠屾敹闂ㄧ**锛欰dmin 鍦?`/admin/ai` 鍙负鍥?SOP 鍔熻兘鐐归厤缃槧灏勪笌 Prompt锛沗SopAiOrchestration` 鍗曟祴瑕嗙洊 fallback脳1銆乼emperature=0銆乀oken _guard 鎶?422锛沇orker/API 鍐欏叆 `ai_invocation_logs.metadata`锛沗git commit` 鍚庤繘鍏?M12銆?

**M11 鏄庣‘涓嶅湪姝?Milestone**锛歚/api/admin/sops/*` 妯℃澘 CRUD锛圡12锛夈€佸緥甯?`execute`/`finalize` 璺敱锛圡13锛夈€乁3 `sop.*` Handler锛圡14锛夈€丳rompt Studio 涓撳睘椤甸潰锛圡15锛夈€?

---

#### M11-A 鏁版嵁搴撹縼绉?鈥?`ai_invocation_logs.metadata`

- [x] 鎵ц `npx supabase migration new ai_invocation_logs_sop_metadata`锛涘垱寤虹┖杩佺Щ鏂囦欢
  - **渚濊禆**锛歁10 宸插畬鎴?
- [x] 鏂板 `packages/shared/src/migrations/m11-ai-invocation-logs-metadata.migration.test.ts`锛氭柇瑷€杩佺Щ鏂囦欢鍚?`metadata JSONB`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦ㄨ縼绉?SQL 涓?`ALTER TABLE public.ai_invocation_logs ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
  - **渚濊禆**锛歁11-A 绗竴鏉?
- [x] 鏇存柊 `m11-ai-invocation-logs-metadata.migration.test.ts`锛氭柇瑷€ `DEFAULT '{}'::jsonb`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦ㄥ悓杩佺Щ SQL 涓垱寤?GIN 绱㈠紩 `ai_invocation_logs_metadata_gin_idx ON public.ai_invocation_logs USING gin (metadata jsonb_path_ops)`锛坄database.md` 搂3.10锛?
  - **渚濊禆**锛歁11-A 绗笁鏉?
- [x] 涓?GIN 绱㈠紩鏂板 `m11-ai-invocation-logs-metadata.migration.test.ts` 鐢ㄤ緥
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鎵ц `npx supabase db push` 搴旂敤 M11-A 杩佺Щ
  - **渚濊禆**锛歁11-A 鍏ㄩ儴 SQL 宸插啓鍏?
- [x] 鏂板 `packages/shared/src/db/m11-ai-invocation-metadata.integration.test.ts`锛歚SELECT metadata` 鍒楀瓨鍦紙`skip` 鏃?DB锛?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`packages/shared/src/migrations/manifest.ts` 鐨?`M10_MIGRATIONS` 鏃佹柊澧?`M11_MIGRATIONS` 鏁扮粍锛堝惈 `ai_invocation_logs_sop_metadata`锛?
  - **渚濊禆**锛氳縼绉绘枃浠跺凡钀界洏
- [x] 鏂板 `packages/shared/src/migrations/manifest.m11.test.ts`锛歚assertMigrationsManifest(M11_MIGRATIONS)`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M11-B `packages/shared` 鈥?鍙厤缃姛鑳界偣闆嗗悎锛圓dmin AI锛?

- [x] 鏂板 `packages/shared/src/ai/is-sop-ai-feature-key.ts`锛氬鍑?`isSopAiFeatureKey(value: string): boolean`锛堝鐓?`SOP_AI_FEATURE_KEY_VALUES`锛?
  - **渚濊禆**锛歁10 `sop-ai-feature-keys.ts` 宸插瓨鍦?
- [x] 鏂板 `packages/shared/src/ai/is-sop-ai-feature-key.test.ts`锛氬洓 SOP 閿负 true锛沗llm_transcript_polish` 涓?false
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/ai/admin-configurable-feature-keys.ts`锛氬鍑?`ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES`锛堣浆鍐欎笁娲昏穬 + 鍥?SOP锛?*涓嶅惈** `asr_semantic`锛?
  - **渚濊禆**锛歚is-sop-ai-feature-key.ts` 宸插瓨鍦?
- [x] 鏂板 `packages/shared/src/ai/admin-configurable-feature-keys.test.ts`锛氶暱搴?7銆佸惈 `sop.deep_research`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/ai/is-admin-configurable-feature-key.ts`锛氬鍑?`isAdminConfigurableFeatureKey()`
  - **渚濊禆**锛歚admin-configurable-feature-keys.ts` 宸插瓨鍦?
- [x] 鏂板 `packages/shared/src/ai/is-admin-configurable-feature-key.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`packages/shared/src/index.ts` re-export M11-B 妯″潡
  - **渚濊禆**锛歁11-B 婧愭枃浠堕綈鍏?
- [x] 鏂板 `packages/shared/src/index.m11-ai-exports.test.ts`锛氶潤鎬?import `ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M11-C `packages/shared` 鈥?Mustache 鎻掓Ы涓?Prompt 涓婁笅鏂囩被鍨?

- [x] 鏂板 `packages/shared/src/sop/step-code-to-mustache-token.ts`锛氬鍑?`stepCodeToMustacheArtifactPrefix(stepCode: string): string`锛坄artifact_{normalized}_` 瑙勫垯锛宍prd.md` 搂2.4锛?
  - **渚濊禆**锛氭棤
- [x] 鏂板 `packages/shared/src/sop/step-code-to-mustache-token.test.ts`锛歚01-A` 鈫?`artifact_01_A_`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/sop/extract-mustache-slot-names.ts`锛氬鍑?`extractMustacheSlotNames(template: string): readonly string[]`
  - **渚濊禆**锛氭棤
- [x] 鏂板 `packages/shared/src/sop/extract-mustache-slot-names.test.ts`锛氳В鏋?`{{artifact_01_A_fact}}` 涓庡弻鑺辨嫭鍙峰彉浣?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/sop/render-mustache-template.ts`锛氬鍑?`renderMustacheTemplate(template, context: Record<string, string>): string`锛?*绂佹** HTML 杞箟浠ュ鐨勬埅鏂級
  - **渚濊禆**锛氭棤
- [x] 鏂板 `packages/shared/src/sop/render-mustache-template.test.ts`锛氱己閿繚鐣欏師鍗犱綅鎴栨姏 `VALIDATION_FAILED`銆愪笌瀹炵幇瀵归綈鍐欐涓€绉嶃€?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/sop/validate-mustache-slots-in-depends-on.ts`锛氬鍑?`assertMustacheSlotsCoveredByDependsOn(slots, dependsOn: string[]): void`
  - **渚濊禆**锛歚extract-mustache-slot-names.ts` 宸插瓨鍦?
- [x] 鏂板 `packages/shared/src/sop/validate-mustache-slots-in-depends-on.test.ts`锛氭湭鍒楀叆 `depends_on` 鐨?`step_code` 鈫?鎶涢敊
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/types/sop-prompt-context.ts`锛氬畾涔?`SopPromptContext`锛坄finalizedArtifacts`銆乣formValues`銆乣sopMediaExtractedText`锛?
  - **渚濊禆**锛氭棤
- [x] 鏂板 `packages/shared/src/types/sop-prompt-context.test.ts`锛氱被鍨嬪畧鍗?`isSopPromptContext` 鏈€灏忓瓧娈垫牎楠?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/types/sop-ai-invocation-metadata.ts`锛氬畾涔?`SopAiInvocationMetadata`锛坄pipeline_id`銆乣step_code`锛?
  - **渚濊禆**锛氭棤
- [x] 鏂板 `packages/shared/src/types/sop-ai-invocation-metadata.test.ts`锛欽SON 搴忓垪鍖?round-trip
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M11-D `packages/shared` 鈥?Token 棰勪及涓?LLM Payload锛坱emperature 閿佸畾锛?

- [x] 鏂板 `packages/shared/src/ai/estimate-token-count.ts`锛氬鍑?`estimateTokenCount(text: string): number`锛堝瓧绗﹀惎鍙戝紡鎴?tiktoken 鍙€夈€愭棤鏂颁緷璧栧垯鐢?chars/4銆戯級
  - **渚濊禆**锛氭棤
- [x] 鏂板 `packages/shared/src/ai/estimate-token-count.test.ts`锛氱┖涓?0锛涢暱鏂囨湰鍗曡皟澧?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/ai/assert-context-within-model-window.ts`锛氬鍑?`assertContextWithinModelWindow(totalTokens, contextWindow: number): void`锛涜秴闄愭姏甯?`ErrorCode.CONTEXT_LIMIT_EXCEEDED` 鐨?`AppError` 绫绘垨鍏变韩 `LexosError`
  - **渚濊禆**锛歁10 `ErrorCode.CONTEXT_LIMIT_EXCEEDED` 宸插瓨鍦?
- [x] 鏂板 `packages/shared/src/ai/assert-context-within-model-window.test.ts`锛氳秴绐楁姏 `CONTEXT_LIMIT_EXCEEDED`锛涚瓑浜庣獥涓嶆姏
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/ai/build-openai-chat-completion-body.ts`锛氬鍑?`buildOpenAiChatCompletionBody(messages, options)` 绾璞℃瀯寤?
  - **渚濊禆**锛氭棤
- [x] 鏂板 `packages/shared/src/ai/build-openai-chat-completion-body.test.ts`锛氶粯璁や笉鍚?`temperature` 瀛楁
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `packages/shared/src/ai/apply-sop-llm-temperature.ts`锛氬鍑?`applySopLlmTemperature(body, featureKey): typeof body`锛圫OP 鍔熻兘鐐瑰己鍒?`temperature: 0`锛宍prd.md` 搂1.4 A8锛?
  - **渚濊禆**锛歚is-sop-ai-feature-key.ts` 宸插瓨鍦?
- [x] 鏂板 `packages/shared/src/ai/apply-sop-llm-temperature.test.ts`锛歚sop.fact_extract` 鈫?`temperature===0`锛沗llm_transcript_polish` 涓嶄慨鏀?
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M11-E `apps/api` 鈥?SOP Prompt 缁勮锛圲2 鍓嶇疆锛屾棤 HTTP 璺敱锛?

- [x] 鏂板 `apps/api/src/domain/sop/build-mustache-context-from-artifacts.ts`锛氬鍑?`buildMustacheContextFromArtifacts(artifacts: readonly { stepCode; contentRaw }[]): Record<string, string>`
  - **渚濊禆**锛歁11-C `step-code-to-mustache-token.ts`
- [x] 鏂板 `apps/api/src/domain/sop/build-mustache-context-from-artifacts.test.ts`锛氫粎 `finalized` 琛岃繘鍏?context銆愬叆鍙傚凡杩囨护銆?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `apps/api/src/services/sop-prompt-assembler.service.ts`锛氬鍑?`assembleUserPrompt(systemTemplate, context: SopPromptContext): string`锛堝悎骞惰〃鍗?+ `{{sop_media_extracted_text}}` + Mustache锛?
  - **渚濊禆**锛歁11-C `render-mustache-template.ts`銆乣SopPromptContext`
- [x] 鏂板 `apps/api/src/services/sop-prompt-assembler.service.test.ts`锛氭敞鍏?`sop_media_extracted_text` 鍗犱綅绗﹁鏇挎崲
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `apps/api/src/services/sop-token-limit-guard.service.ts`锛氬鍑?`assertSopPromptWithinModelWindow(assembledPrompt, systemPrompt, contextWindow): void`锛堣皟鐢?shared `estimateTokenCount` + `assertContextWithinModelWindow`锛?
  - **渚濊禆**锛歁11-D Token 宸ュ叿宸插瓨鍦?
- [x] 鏂板 `apps/api/src/services/sop-token-limit-guard.service.test.ts`锛氳秴绐?鈫?`AppHttpError`/`CONTEXT_LIMIT_EXCEEDED` 422
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M11-F `apps/api` 鈥?AI 缂栨帓锛圲2 路 `SopAiOrchestrationService`锛?

- [x] 鏂板 `apps/api/src/repositories/ai-invocation-log.repository.ts`锛氬鍑?`insertInvocationLog(input)` 鏀寔 `taskId: null` 涓?`metadata: SopAiInvocationMetadata`
  - **渚濊禆**锛歁11-A `metadata` 鍒楀凡 push
- [x] 鏂板 `apps/api/src/repositories/ai-invocation-log.repository.test.ts`锛歁ock SQL锛涙柇瑷€ `task_id` 缁戝畾涓?`null` 鏃朵紶 `NULL`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `apps/api/src/repositories/sop-ai-config.repository.ts`锛氬鍑?`resolveModelsForFeature(featureKey)`銆乣findPublishedPrompt(featureKey)`锛堝鐢?M3 琛ㄧ粨鏋勶紱**绂佹**鏃ュ織杈撳嚭 `apiKey`锛?
  - **渚濊禆**锛歁3 `ai-model.repository` 妯″紡宸插瓨鍦?
- [x] 鏂板 `apps/api/src/repositories/sop-ai-config.repository.test.ts`锛歁ock Supabase锛涙槧灏勭己澶辨姏 `AI mapping not found`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `apps/api/src/adapters/ai/llm-completion-http.adapter.ts`锛氬鍑?`postChatCompletion(credentials, body)`锛團etch锛沚ody 缁?`applySopLlmTemperature`锛?
  - **渚濊禆**锛歁11-D `apply-sop-llm-temperature.ts`
- [x] 鏂板 `apps/api/src/adapters/ai/llm-completion-http.adapter.test.ts`锛歁ock `fetch`锛涙柇瑷€ SOP 璇锋眰 JSON 鍚?`"temperature":0`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `apps/api/src/services/sop-ai-orchestration.service.ts`锛氬鍑?`invokeSopLlm(input)`锛堜富妯″瀷 鈫?fallback **1 娆?*锛涘啓 `ai_invocation_logs`锛沗idempotency_key` 鐢?`sha256(pipeline_id:step_code:attempt)` 鐢熸垚锛?
  - **渚濊禆**锛歁11-E `sop-token-limit-guard`銆乣sop-prompt-assembler`锛汳11-F repository + adapter
- [x] 鏂板 `apps/api/src/services/sop-ai-orchestration.service.test.ts`锛氫富澶辫触鍏滃簳鎴愬姛 鈫?`is_fallback=true`锛涙槧灏勭己澶?鈫?鎶涢敊
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`sop-ai-orchestration.service.ts` 涓彁鍙栫鏈夊嚱鏁?`logSopInvocationSuccess(...)`锛堝崟鑱岃矗锛氬啓鎴愬姛鏃ュ織锛?
  - **渚濊禆**锛歚sop-ai-orchestration.service.ts` 楠ㄦ灦宸插瓨鍦?
- [x] 涓?`logSopInvocationSuccess` 鏂板 `sop-ai-orchestration.service.logging.test.ts`锛氭柇瑷€ `metadata.pipeline_id` / `step_code` 鍏ュ簱
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`sop-ai-orchestration.service.ts` 涓彁鍙栫鏈夊嚱鏁?`logSopInvocationFailure(...)`
  - **渚濊禆**锛氭垚鍔熸棩蹇楀嚱鏁板凡瀛樺湪
- [x] 涓?`logSopInvocationFailure` 鏂板娴嬭瘯锛氬け璐ヨ矾寰?`outcome=failure` 涓?`task_id` 涓?NULL
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M11-G `apps/api` 鈥?Admin AI 鍒楄〃/鍐欏叆鎵╁睍锛堟棤鏂拌矾鐢憋級

- [x] 淇敼 `apps/api/src/services/ai-feature-mapping-list.service.ts`锛氬皢 `AI_ACTIVE_FEATURE_KEY_VALUES` 鏇挎崲涓?`ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES`
  - **渚濊禆**锛歁11-B `admin-configurable-feature-keys.ts`
- [x] 鏇存柊 `apps/api/src/services/ai-feature-mapping-list.service.test.ts`锛氳繑鍥?items 闀垮害 **7** 涓斿惈 `sop.visual_charting`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 淇敼 `apps/api/src/services/ai-feature-mapping-upsert.service.ts`锛氬皢 `isAiActiveFeatureKey` 鏇挎崲涓?`isAdminConfigurableFeatureKey`
  - **渚濊禆**锛歁11-B `is-admin-configurable-feature-key.ts`
- [x] 鏇存柊 `apps/api/src/services/ai-feature-mapping-upsert.service.test.ts`锛氬 `sop.fact_extract` upsert 涓嶅啀 `OPERATION_NOT_ALLOWED`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 淇敼 `apps/api/src/services/ai-prompt-create.service.ts`锛氬厑璁?`feature_key` 涓哄洓 SOP 鍊硷紙鏍￠獙鏀圭敤 `isAdminConfigurableFeatureKey` 鎴?`isSopAiFeatureKey`锛?
  - **渚濊禆**锛歁11-B
- [x] 鏇存柊 `apps/api/src/services/ai-prompt-create.service.test.ts`锛氬垱寤?`sop.strategy_gen` Prompt 鎴愬姛
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `apps/api/src/services/system-setting-read.service.ts`锛氬鍑?`isDeepResearchEnabled(): Promise<boolean>`锛堣 `system_settings` 閿?`sop.deep_research_enabled`锛岄粯璁?`true`锛宍prd.md` 搂4.2.4 SOP L4锛?
  - **渚濊禆**锛歁10 `system_settings` 绉嶅瓙
- [x] 鏂板 `apps/api/src/services/system-setting-read.service.test.ts`锛歁ock repo锛沗false` 鏃惰繑鍥?false
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `apps/api/src/services/sop-deep-research-guard.service.ts`锛氬鍑?`assertDeepResearchEnabled()`锛涘叧闂椂鎶?`OPERATION_NOT_ALLOWED`锛堜緵 M13 `execute` 璋冪敤锛屾湰 Milestone 浠?Service锛?
  - **渚濊禆**锛歚system-setting-read.service.ts`
- [x] 鏂板 `apps/api/src/services/sop-deep-research-guard.service.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M11-H `workers/pipeline` 鈥?Worker 渚?SOP 缂栨帓瀵归綈

- [x] 淇敼 `workers/pipeline/src/repositories/worker-ai.repository.ts` 鐨?`insertInvocationLog`锛氬鍔?`metadata?: Record<string, unknown>` 鍙傛暟锛汼QL 鍐欏叆 `metadata` 鍒楋紱`taskId` 鍏佽 `null`
  - **渚濊禆**锛歁11-A 杩佺Щ宸?push
- [x] 鏇存柊 `workers/pipeline/src/repositories/worker-ai.repository.test.ts`锛堣嫢鏃犲垯鏂板缓锛夛細鏂█ INSERT 鍚?`metadata` 缁戝畾
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 淇敼 `workers/pipeline/src/adapters/ai/fetch-worker-ai.client.ts` 鐨?`complete`锛氳姹?body 缁?shared `applySopLlmTemperature`锛堜紶鍏?`featureKey` 鏂板弬鏁帮級
  - **渚濊禆**锛歁11-D `apply-sop-llm-temperature.ts`锛沇orker 鍙?import `@lexos/shared`
- [x] 鏇存柊 `workers/pipeline/src/adapters/ai/fetch-worker-ai.client.test.ts`锛堣嫢鏃犲垯鏂板缓锛夛細SOP featureKey 鏃?`temperature: 0`
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鎵╁睍 `workers/pipeline/src/services/ai-orchestration.service.ts` 鐨?`AiOrchestrationInvokeInput`锛氭柊澧炲彲閫?`sop?: { pipelineId; stepCode }`锛沗taskId` 鏀逛负鍙€夛紙SOP 鏃剁渷鐣ワ級
  - **渚濊禆**锛歁11-H repository 宸叉敮鎸?null taskId
- [x] 鏇存柊 `workers/pipeline/src/services/ai-orchestration.service.test.ts`锛歋OP 鍏ュ弬鍐欐棩蹇?`metadata` Mock 鏂█
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鍦?`ai-orchestration.service.ts` 鐨?`logSuccess` / `logFailure` 鍒嗘敮锛氬綋 `input.sop` 瀛樺湪鏃朵紶 `taskId: null` 涓?`metadata`
  - **渚濊禆**锛氫笂涓€鏉?
- [x] 鏂板 `ai-orchestration.service.sop-metadata.test.ts`锛氫笓娴?SOP metadata 鍐欏叆璺緞
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 鏂板 `workers/pipeline/src/services/sop-llm-orchestration.service.ts`锛氳杽灏佽 `AiOrchestrationService.invoke`锛堝浐瀹?`llmUserPrompt` 宸茬敱 U2 缁勮锛涙湰绫讳粎 Worker 澶嶇敤 Deep Research 鍐?LLM 瀛愭楠ゆ椂鐢級
  - **渚濊禆**锛歁11-H orchestration 鎵╁睍瀹屾垚
- [x] 鏂板 `workers/pipeline/src/services/sop-llm-orchestration.service.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M11-I 鍓嶇 鈥?Admin `/admin/ai` 灞曠ず鍥?SOP 鍔熻兘鐐?

- [x] 淇敼 `apps/web/src/components/admin/ai/feature-labels.ts`锛氫负 `sop.fact_extract` / `sop.strategy_gen` / `sop.deep_research` / `sop.visual_charting` 澧炲姞涓枃鏍囩锛坄prd.md` 搂3.3 琛級
  - **渚濊禆**锛歁11-B `AiFeatureKey` 绫诲瀷宸插惈鍥?SOP 鍊硷紙M10锛?
- [x] 鏂板 `apps/web/src/components/admin/ai/feature-labels.test.ts`锛氬洓 SOP 閿潎鏈夐潪绌?label
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 淇敼 `apps/web/src/components/admin/ai/AiFeatureMappingsPanel.tsx`锛氬皢 `AI_ACTIVE_FEATURE_KEY_VALUES` 鏀逛负 `ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES`
  - **渚濊禆**锛歁11-B shared 瀵煎嚭
- [x] 鏂板 `apps/web/src/components/admin/ai/AiFeatureMappingsPanel.test.tsx`锛氭覆鏌?7 琛岋紙Mock API锛?
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 淇敼 `apps/web/src/components/admin/ai/ai-prompt-editor-dialog.tsx` 鐨?`featureKey` `Select` 閫夐」婧愶細鍖呭惈鍥?SOP 鍔熻兘鐐?
  - **渚濊禆**锛歚feature-labels.ts` 宸叉墿灞?
- [x] 鏂板 `apps/web/src/components/admin/ai/ai-prompt-editor-dialog.sop.test.tsx`锛氫笅鎷夊惈 `sop.deep_research` 閫夐」
  - **渚濊禆**锛氫笂涓€鏉?

- [x] 淇敼 `apps/web/src/components/admin/ai/AiPromptsPanel.tsx`锛歚AI_FEATURE_LABELS` 灞曠ず SOP 琛屾椂鏍囩姝ｇ‘锛堟棤 `undefined`锛?
  - **渚濊禆**锛歚feature-labels.ts` 宸叉墿灞?
- [x] 鏂板 `apps/web/src/components/admin/ai/AiPromptsPanel.test.tsx`锛氬垪琛?Mock 鍚?`sop.visual_charting` 琛屾覆鏌撻€氳繃
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M11-J 闆嗘垚涓?Milestone 11 瀹屾垚闂ㄧ

- [x] 鏂板 `apps/api/src/__tests__/sop-ai-orchestration.integration.test.ts`锛歚invokeSopLlm` Mock HTTP 鎴愬姛 鈫?DB `ai_invocation_logs` 琛?`task_id IS NULL` 涓?`metadata->>'pipeline_id'` 闈炵┖锛坄skip` 鏃犺仈璋?env锛?
  - **渚濊禆**锛歁11-F銆丮11-A
- [x] 鏂板 `apps/api/src/__tests__/admin-sop-feature-mapping.integration.test.ts`锛歛dmin `PUT /api/admin/ai/mappings/sop.fact_extract` 杩斿洖 200锛坄skip` 鏃?env锛?
  - **渚濊禆**锛歁11-G

- [x] 杩愯 `npm run test`锛堟垨 workspace 绛変环锛夎鐩?M11-A锝濵11-I锛涜繛缁け璐?**>2** 娆″垯鍋滄姹囨姤
  - **渚濊禆**锛歁11 鍏ㄩ儴寮€鍙?checkbox 宸插畬鎴?

**浜哄伐榛戠洅楠屾敹**锛堢敱浜哄伐鎵ц锛屼笉閫氳繃涓嶅緱 `git commit`锛夛細

- [ ] **銆愪汉宸ラ粦鐩掋€?* admin 鐧诲綍 Web 鈫?`/admin/ai`锛氬洓涓?SOP 鍔熻兘鐐癸紙`sop.fact_extract` / `sop.strategy_gen` / `sop.deep_research` / `sop.visual_charting`锛夊湪鍔熻兘鏄犲皠涓?Prompt 鍒楄〃涓?*鍧囧彲瑙?*
  - **渚濊禆**锛歁11-I Admin UI 鎵╁睍
- [ ] **銆愪汉宸ラ粦鐩掋€?* 涓鸿嚦灏戜竴涓?SOP 鍔熻兘鐐逛繚瀛樻ā鍨嬫槧灏勫苟鎵ц銆岃繛閫氭€ф祴璇曘€嶏細鐣岄潰鏄剧ず鎴愬姛鎴栧け璐ワ紙闈?500 鐧藉睆锛?
  - **渚濊禆**锛氫笂涓€鏉?
- [ ] **銆愪汉宸ラ粦鐩掋€?* 鑱旇皟搴撴煡璇?`ai_invocation_logs`锛堟垨瑙﹀彂 M11 闆嗘垚娴嬪悗浜哄伐鏌ヨ〃锛夛細SOP 璋冪敤琛?`task_id IS NULL` 涓?`metadata` 鍚?`pipeline_id`銆乣step_code`銆愯嫢灏氭棤娴佹按绾垮彲浠呮煡闆嗘垚娴嬩骇鐢熺殑琛屻€?
  - **渚濊禆**锛歁11-F 缂栨帓宸查儴缃?
- [ ] **銆愪汉宸ラ粦鐩掋€?* 鍏抽棴 `system_settings.sop.deep_research_enabled` 鍚庯紝鍐嶆鎵撳紑 Admin 璁剧疆椤电‘璁ゅ紑鍏崇姸鎬佹寔涔呭寲
  - **渚濊禆**锛歁11 deep research guard 鐩稿叧閰嶇疆
- [ ] **銆愪汉宸ラ粦鐩掗獙鏀剁鏀躲€?* 鍦?`docs/E2E_MANUAL_RUN_LOG.md` 杩藉姞 **M11** 灏忚妭
  - **渚濊禆**锛氫笂鍒楅粦鐩掗」鍧囬€氳繃

- [x] 鎵ц `git commit`锛歚feat(ai): sop feature keys orchestration temperature zero and invocation metadata`
  - **渚濊禆**锛氭祴璇曞叏缁匡紱**浜哄伐榛戠洅楠屾敹绛炬敹**
- [x] 灏嗕笅鏂硅繘搴﹁〃 **M11** 鐘舵€佹洿鏂颁负銆屽凡瀹屾垚銆?
  - **渚濊禆**锛歚git commit` 鎴愬姛

---

### Milestone 12锛氱鐞嗗憳 鈥?SOP 妯℃澘涓?Prompt Studio锛圲2 API锛?

**鐩爣**锛氭ā鏉垮叏鐢熷懡鍛ㄦ湡锛堝垱寤洪€昏緫妯℃澘銆佽崏绋跨紪杈戙€佸彂甯冦€佸凡鍙戝竷鍙銆佹柊寤虹増鏈崏绋匡級銆佹楠?DAG/`depends_on`/JSON Schema銆丳rompt 缁戝畾銆佸彂甯冨墠鏍￠獙銆丄dmin 娌欑洅璇曡窇銆?

**璁捐鍩哄噯**锛歚prd.md` 搂2.1锛坅dmin 妯℃澘 CRUD锛夈€伮?.4銆伮?.4.1銆伮?.9.1銆伮?.10锛沗architecture.md` 搂5.1銆乣搂7` `/api/admin/sops/*`锛沗database.md` 搂3.16銆?

**鍓嶇疆渚濊禆**锛?*Milestone 10鈥?1 宸插畬鎴?*锛圫OP 琛ㄣ€丮ustache 宸ュ叿銆乣SopAiOrchestrationService`銆乣validate-mustache-slots-in-depends-on`锛夈€?

**濂戠害璺敱**锛坄prd.md` 搂3.9.1 + 鍙戝竷/鍒涘缓闅愬惈鑳藉姏锛夛細

| 鏂规硶 | 璺緞 |
|------|------|
| GET | `/api/admin/sops` |
| POST | `/api/admin/sops/templates` |
| GET | `/api/admin/sops/templates/:template_id` |
| GET | `/api/admin/sops/template-versions/:version_id` |
| PUT | `/api/admin/sops/template-versions/:version_id/prompts` |
| POST | `/api/admin/sops/template-versions/:version_id/publish` |
| POST | `/api/admin/sops/templates/:template_id/versions` |
| POST | `/api/admin/sops/preview-pipeline` |

**楠屾敹闂ㄧ**锛氫粎 `admin` 鍙啓锛沗is_published=true` 鏃?`PUT .../prompts` 鈫?**422** `OPERATION_NOT_ALLOWED`锛涘彂甯冩牎楠屽け璐ワ紙鐜?澶氬叆鍙?缂烘槧灏勶級鈫?**422**锛沗preview-pipeline` **涓?*鍐?`case_pipelines`锛涘緥甯堣皟鐢?admin 璺敱 鈫?**403**锛沗git commit` 鍚庤繘鍏?M13銆?

**M12 鏄庣‘涓嶅湪姝?Milestone**锛氬緥甯堢 API锛圡13锛夈€丄dmin SOP 鍓嶇椤甸潰锛圡15锛夈€乁3 Handler锛圡14锛夈€?

---

#### M12-A `packages/shared` 鈥?DTO 涓庣被鍨嬶紙姣忔潯涓€涓枃浠讹級

- [ ] 鏂板 `packages/shared/src/dto/admin-sop-template-create.dto.ts`锛氬鍑?zod schema `name`銆乣caseType`銆佸彲閫夊垵濮?`steps[]`
  - **渚濊禆**锛歁10 SOP 鏋氫妇宸插瓨鍦?
- [ ] 鏂板 `packages/shared/src/dto/admin-sop-template-create.dto.test.ts`锛氶潪娉曠┖ `name` 鈫?鏍￠獙澶辫触
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/dto/admin-sop-step-upsert.dto.ts`锛氬崟姝ュ瓧娈?`stepCode`銆乣name`銆乣executionType`銆乣aiFeatureKey?`銆乣promptTemplateId?`銆乣inputSchema`銆乣dependsOn[]`銆乣requiresVerification`
  - **渚濊禆**锛歁10 `SopExecutionType` 绛夋灇涓?
- [ ] 鏂板 `packages/shared/src/dto/admin-sop-step-upsert.dto.test.ts`锛歚manual` 鏃?`aiFeatureKey` 鍙┖锛沗sync_llm` 蹇呭～ `aiFeatureKey`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/dto/admin-sop-version-prompts-upsert.dto.ts`锛氬鍑?`{ steps: AdminSopStepUpsert[] }` zod schema锛堟暣鍖呮浛鎹㈣崏绋挎楠わ級
  - **渚濊禆**锛歚admin-sop-step-upsert.dto.ts`
- [ ] 鏂板 `packages/shared/src/dto/admin-sop-version-prompts-upsert.dto.test.ts`锛歚depends_on` 鍚噸澶?`stepCode` 鈫?澶辫触
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/dto/admin-sop-create-version.dto.ts`锛氬彲閫?`sourceVersionId`锛堢己鐪佸彇鏈€鏂板凡鍙戝竷鐗堬級
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `packages/shared/src/dto/admin-sop-create-version.dto.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/dto/admin-sop-preview-pipeline.dto.ts`锛歚templateVersionId`銆乣stepCode`銆佹矙鐩?`formValues`銆乣finalizedArtifacts` 妯℃嫙鏁版嵁
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `packages/shared/src/dto/admin-sop-preview-pipeline.dto.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/types/admin-sop-template-list-item.ts`锛氬垪琛ㄨ锛坄templateId`銆乣name`銆乣caseType`銆乣versions[]` 鎽樿锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `packages/shared/src/types/admin-sop-template-list-item.test.ts`锛氱被鍨嬫瀯閫?smoke
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/types/admin-sop-template-version-detail.ts`锛氱増鏈鎯呭惈 `steps` 鍏ㄥ瓧娈?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `packages/shared/src/types/admin-sop-template-version-detail.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`packages/shared/src/index.ts` re-export M12-A DTO/绫诲瀷
  - **渚濊禆**锛歁12-A 婧愭枃浠堕綈鍏?
- [ ] 鏂板 `packages/shared/src/index.m12-exports.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M12-B `apps/api` 鈥?棰嗗煙瑙勫垯锛堢函鍑芥暟锛屾瘡鏉′竴涓枃浠讹級

- [ ] 鏂板 `apps/api/src/domain/sop/assert-template-version-editable.ts`锛氬鍑?`assertTemplateVersionEditable(isPublished: boolean): void`锛涘凡鍙戝竷鎶?`OPERATION_NOT_ALLOWED`锛坄prd.md` 搂3.4.1锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/api/src/domain/sop/assert-template-version-editable.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/domain/sop/detect-depends-on-cycle.ts`锛氬鍑?`detectDependsOnCycle(steps): string | null`锛堣繑鍥炵幆涓?`step_code` 鎴?null锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/api/src/domain/sop/detect-depends-on-cycle.test.ts`锛氫笁鑺傜偣鐜彲妫€娴?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/domain/sop/assert-single-dag-entry.ts`锛氬鍑?`assertSingleDagEntry(steps): void`锛堝叆搴︿负 0 鐨勮妭鐐规暟蹇呴』 = 1锛宍prd.md` 搂3.4.1 Edge锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/api/src/domain/sop/assert-single-dag-entry.test.ts`锛氬弻鍏ュ彛鎶涢敊
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/domain/sop/assert-step-codes-resolved.ts`锛氬鍑?`assertDependsOnReferencesExist(steps): void`锛坄depends_on` 寮曠敤瀛樺湪锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/api/src/domain/sop/assert-step-codes-resolved.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/domain/sop/assert-publish-readiness.ts`锛氬鍑?`assertPublishReadiness(steps, promptsByStep, mappingsExist: fn): void`锛坄sync_llm`/`async_deep_research` 椤?`prompt_template_id`+鏄犲皠锛汳ustache 鎻掓Ы 鈯?`depends_on`锛?
  - **渚濊禆**锛歁11 `validate-mustache-slots-in-depends-on`锛坰hared锛?
- [ ] 鏂板 `apps/api/src/domain/sop/assert-publish-readiness.test.ts`锛氱己鏄犲皠鎶?`VALIDATION_FAILED`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/domain/sop/compute-next-version-number.ts`锛氬鍑?`computeNextVersionNumber(existingMax: number): number`锛堝彂甯冩椂 `max+1`锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/api/src/domain/sop/compute-next-version-number.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M12-C `apps/api` 鈥?`AdminSopRepository`锛坄service_role`锛屽崟鏂规硶鍗曚换鍔★級

- [ ] 鏂板 `apps/api/src/repositories/admin-sop.repository.ts`锛氱被楠ㄦ灦 + `service_role` 瀹㈡埛绔敞鍏?
  - **渚濊禆**锛歁10 SOP 琛ㄥ凡杩佺Щ
- [ ] 鏂板 `apps/api/src/repositories/admin-sop.repository.test.ts`锛歁ock 瀹㈡埛绔紱绂佹娉勬紡 `service_role`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`admin-sop.repository.ts` 瀹炵幇 `listTemplatesWithVersions(limit, cursor)`锛氳仈缁?`sop_templates` + `sop_template_versions`锛涘垎椤?50
  - **渚濊禆**锛歊epository 楠ㄦ灦
- [ ] 涓?`listTemplatesWithVersions` 鏂板 `admin-sop.repository.list.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `insertTemplateWithInitialDraft(actorId, dto)`锛氫簨鍔℃彃鍏?`sop_templates` + `sop_template_versions`锛坄version_number=0` 鎴?1 鑽夌銆乣is_published=false`锛? 鍙€?`sop_steps`
  - **渚濊禆**锛歁12-C 绗竴鏉?
- [ ] 鏂板 `admin-sop.repository.insert-template.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `findTemplateById(templateId)` 涓?`findTemplateVersionById(versionId)`锛堝惈 steps 鎺掑簭 `step_code`锛?
  - **渚濊禆**锛歊epository 楠ㄦ灦
- [ ] 鏂板 `admin-sop.repository.find.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `replaceDraftSteps(versionId, steps[])`锛氬垹闄ゆ棫 `sop_steps` 鍐嶆壒閲?INSERT锛堜粎 `is_published=false` 鐢?Service 鍓嶇疆鏂█锛?
  - **渚濊禆**锛歚findTemplateVersionById`
- [ ] 鏂板 `admin-sop.repository.replace-steps.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `copyVersionToNewDraft(templateId, sourceVersionId, actorId)`锛欼NSERT 鏂?`sop_template_versions` + 澶嶅埗 `sop_steps`锛坄prd.md` 搂3.9.1 POST versions锛?
  - **渚濊禆**锛歚findTemplateVersionById`
- [ ] 鏂板 `admin-sop.repository.copy-version.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `publishVersion(versionId, nextVersionNumber, publishedAt)`锛歚UPDATE is_published=true, version_number=..., published_at=now()`
  - **渚濊禆**锛歚findTemplateVersionById`
- [ ] 鏂板 `admin-sop.repository.publish.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M12-D `apps/api` 鈥?Service 灞傦紙姣忔潯 Service 涓€涓枃浠?+ 娴嬭瘯锛?

- [ ] 鏂板 `apps/api/src/services/admin-sop-list.service.ts`锛氬鍑?`list(query)` 鈫?鍒嗛〉 DTO
  - **渚濊禆**锛歁12-C `listTemplatesWithVersions`
- [ ] 鏂板 `apps/api/src/services/admin-sop-list.service.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/services/admin-sop-template-create.service.ts`锛氬垱寤烘ā鏉?+ 鍒濆鑽夌锛涘璁?**涓嶅啓**锛堝垱寤烘ā鏉块潪 PRD 寮哄埗瀹¤椤癸級鎴栦粎 `user.update` 璺宠繃
  - **渚濊禆**锛歚insertTemplateWithInitialDraft`锛汳12-B `detectDependsOnCycle` 绛夋牎楠?
- [ ] 鏂板 `apps/api/src/services/admin-sop-template-create.service.test.ts`锛氶潪娉?DAG 鈫?`VALIDATION_FAILED`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/services/admin-sop-template-get.service.ts`锛氬鍑?`getTemplate(templateId)`
  - **渚濊禆**锛歚findTemplateById`
- [ ] 鏂板 `apps/api/src/services/admin-sop-template-get.service.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/services/admin-sop-version-get.service.ts`锛氬鍑?`getVersion(versionId)`
  - **渚濊禆**锛歚findTemplateVersionById`
- [ ] 鏂板 `apps/api/src/services/admin-sop-version-get.service.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/services/admin-sop-version-prompts-upsert.service.ts`锛氳皟鐢?`assertTemplateVersionEditable` 鈫?DAG 鏍￠獙 鈫?`replaceDraftSteps`锛沗append_audit_log('sop.prompt.update')`
  - **渚濊禆**锛歁12-B 棰嗗煙鍑芥暟锛汳12-C `replaceDraftSteps`锛沗AuditWriterService`
- [ ] 鏂板 `apps/api/src/services/admin-sop-version-prompts-upsert.service.test.ts`锛氬凡鍙戝竷鐗堟湰 鈫?`OPERATION_NOT_ALLOWED`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/services/admin-sop-version-create.service.ts`锛氭柊寤鸿崏绋跨増鏈紱澶嶅埗姝ラ
  - **渚濊禆**锛歚copyVersionToNewDraft`
- [ ] 鏂板 `apps/api/src/services/admin-sop-version-create.service.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/services/admin-sop-version-publish.service.ts`锛歚assertPublishReadiness` 鈫?`publishVersion`锛沗append_audit_log('sop.template.publish')`
  - **渚濊禆**锛歁12-B `assert-publish-readiness`锛汳12-C `publishVersion`
- [ ] 鏂板 `apps/api/src/services/admin-sop-version-publish.service.test.ts`锛氭湭閰嶇疆 `prompt_template_id` 鈫?422
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/services/admin-sop-preview-pipeline.service.ts`锛氱粍瑁呮矙鐩?`SopPromptContext` 鈫?`SopTokenLimitGuard` 鈫?`SopAiOrchestrationService.invokeSopLlm`锛?*绂佹** INSERT `case_pipelines`/`pipeline_artifacts`
  - **渚濊禆**锛歁11 缂栨帓涓?Prompt 缁勮鏈嶅姟
- [ ] 鏂板 `apps/api/src/services/admin-sop-preview-pipeline.service.test.ts`锛氭柇瑷€ Repository **鏈?*璋冪敤 `insertPipeline`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M12-E `apps/api` 鈥?Controller 灞傦紙姣忔潯 HTTP 璺敱鐙珛鏂囦欢锛?

- [ ] 鏂板 `apps/api/src/controllers/admin-sops-list.controller.ts`锛氬鐞?`GET /api/admin/sops`
  - **渚濊禆**锛歚admin-sop-list.service`
- [ ] 鏂板 `apps/api/src/controllers/admin-sops-list.controller.test.ts`锛歭awyer 鈫?`AUTH_FORBIDDEN`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/admin-sops-template-create.controller.ts`锛氬鐞?`POST /api/admin/sops/templates`
  - **渚濊禆**锛歚admin-sop-template-create.service`
- [ ] 鏂板 `apps/api/src/controllers/admin-sops-template-create.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/admin-sops-template-get.controller.ts`锛氬鐞?`GET /api/admin/sops/templates/:template_id`
  - **渚濊禆**锛歚admin-sop-template-get.service`
- [ ] 鏂板 `apps/api/src/controllers/admin-sops-template-get.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/admin-sops-version-get.controller.ts`锛氬鐞?`GET /api/admin/sops/template-versions/:version_id`
  - **渚濊禆**锛歚admin-sop-version-get.service`
- [ ] 鏂板 `apps/api/src/controllers/admin-sops-version-get.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/admin-sops-version-prompts-upsert.controller.ts`锛氬鐞?`PUT .../template-versions/:version_id/prompts`
  - **渚濊禆**锛歚admin-sop-version-prompts-upsert.service`
- [ ] 鏂板 `apps/api/src/controllers/admin-sops-version-prompts-upsert.controller.test.ts`锛氬凡鍙戝竷 鈫?422
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/admin-sops-version-create.controller.ts`锛氬鐞?`POST .../templates/:template_id/versions`
  - **渚濊禆**锛歚admin-sop-version-create.service`
- [ ] 鏂板 `apps/api/src/controllers/admin-sops-version-create.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/admin-sops-version-publish.controller.ts`锛氬鐞?`POST .../template-versions/:version_id/publish`
  - **渚濊禆**锛歚admin-sop-version-publish.service`
- [ ] 鏂板 `apps/api/src/controllers/admin-sops-version-publish.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/admin-sops-preview-pipeline.controller.ts`锛氬鐞?`POST /api/admin/sops/preview-pipeline`
  - **渚濊禆**锛歚admin-sop-preview-pipeline.service`
- [ ] 鏂板 `apps/api/src/controllers/admin-sops-preview-pipeline.controller.test.ts`锛氬搷搴?200 涓?body 鍚?LLM 鏂囨湰鎽樿
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M12-F `apps/api` 鈥?璺敱鎸傝浇涓庨泦鎴?

- [ ] 鏂板 `apps/api/src/routes/admin-sops.routes.ts`锛氬鍑?`handleAdminSopsRoute`锛涜矾寰勫垎鍙戜笂杩?8 鏉¤矾鐢憋紱浠?`admin` 瑙掕壊
  - **渚濊禆**锛歁12-E 鍏ㄩ儴 Controller
- [ ] 鏂板 `apps/api/src/routes/admin-sops.routes.test.ts`锛氭湭鐧诲綍 401锛沴awyer 403
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`apps/api/src/app.ts` 娉ㄥ唽 `handleAdminSopsRoute`锛涢摼锛歚auth.middleware` 鈫?`password-change-gate` 鈫?`requireRoles('admin')`
  - **渚濊禆**锛歚admin-sops.routes.ts`
- [ ] 鏂板 `apps/api/src/__tests__/admin-sops-route-mount.test.ts`锛歁ock 璇锋眰 `GET /api/admin/sops` 鍛戒腑澶勭悊鍣?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/__tests__/admin-sop-publish-flow.integration.test.ts`锛氬垱寤烘ā鏉?鈫?缂栬緫 prompts 鈫?鍙戝竷 鈫?鍐?PUT prompts 鏈熸湜 422锛坄skip` 鏃犺仈璋?env锛?
  - **渚濊禆**锛歁12-F 鎸傝浇瀹屾垚
- [ ] 鏂板 `apps/api/src/__tests__/admin-sop-preview-pipeline.integration.test.ts`锛歱review 鍚?`case_pipelines` 琛屾暟涓嶅彉锛坄skip` 鏃?env锛?
  - **渚濊禆**锛歁12-D preview service

---

#### M12-G Milestone 12 瀹屾垚闂ㄧ

- [ ] 杩愯 `apps/api` 鐩稿叧娴嬭瘯鍏ㄧ豢锛涜繛缁け璐?**>2** 娆″垯鍋滄姹囨姤
  - **渚濊禆**锛歁12-A锝濵12-F 鍏ㄩ儴 checkbox 宸插畬鎴?

**浜哄伐榛戠洅楠屾敹**锛堢敱浜哄伐缁?HTTP 瀹㈡埛绔垨涓存椂鑴氭湰鎵ц锛屼笉閫氳繃涓嶅緱 `git commit`锛夛細

- [ ] **銆愪汉宸ラ粦鐩掋€?* admin Token锛歚POST` 鍒涘缓妯℃澘 鈫?`PUT` 鑽夌鐗堟湰 prompts 鈫?`POST` 鍙戝竷 鈫?鍐嶆 `PUT` prompts 鏈熸湜 **422** `OPERATION_NOT_ALLOWED`
  - **渚濊禆**锛歁12 API 宸叉寕杞?
- [ ] **銆愪汉宸ラ粦鐩掋€?* admin Token锛歚POST /api/admin/sops/preview-pipeline` 鎴愬姛鍚庯紝鏁版嵁搴?`case_pipelines` 琛屾暟**涓嶅彉**
  - **渚濊禆**锛歁12 preview 璺敱
- [ ] **銆愪汉宸ラ粦鐩掋€?* lawyer Token锛氳闂?`GET /api/admin/sops` 鎴栦换鎰?admin SOP 鍐欒矾鐢?鈫?**403**
  - **渚濊禆**锛歁12 璺敱 `requireRoles('admin')`
- [ ] **銆愪汉宸ラ粦鐩掋€?* 鍙戝竷鏍￠獙锛氭晠鎰忛厤缃?DAG 鐜垨缂?Prompt 鏄犲皠鍚?`POST` 鍙戝竷 鈫?**422** 涓斿搷搴斾綋鍚彲璇荤殑鏍￠獙閿欒淇℃伅
  - **渚濊禆**锛歁12 鍙戝竷鏍￠獙鏈嶅姟
- [ ] **銆愪汉宸ラ粦鐩掗獙鏀剁鏀躲€?* 鍦?`docs/E2E_MANUAL_RUN_LOG.md` 杩藉姞 **M12** 灏忚妭
  - **渚濊禆**锛氫笂鍒楅粦鐩掗」鍧囬€氳繃

- [ ] 鎵ц `git commit`锛歚feat(admin-sop): template versions prompts publish and preview api`
  - **渚濊禆**锛氭祴璇曞叏缁匡紱**浜哄伐榛戠洅楠屾敹绛炬敹**
- [ ] 灏嗕笅鏂硅繘搴﹁〃 **M12** 鐘舵€佹洿鏂颁负銆屽凡瀹屾垚銆?
  - **渚濊禆**锛歚git commit` 鎴愬姛

---

### Milestone 13锛氬緥甯堢 鈥?SOP 娴佹按绾夸笟鍔?API锛圲2锛?

**鐩爣**锛氬緥甯堝垱寤?鎺ㄨ繘/缁撴娴佹按绾匡紱鍗峰畻 TUS锛堢嫭绔?init锛夛紱姝ラ `execute`/`finalize`锛涗骇鍑虹墿涔愯閿侊紱寮傛 Deep Research **202**锛涗汉宸?[Verified]锛汬TML 瀹氱瑙﹀彂 `sop.pdf_export` Outbox銆?

**璁捐鍩哄噯**锛歚prd.md` 搂1.5銆伮?.3鈥撀?.4銆伮?.5.1锛堝嵎瀹楅檺棰濓級銆伮?.8.1鈥撀?.8.6銆伮?.9.2鈥撀?.9.3銆伮?.10锛沗architecture.md` 搂3.2.6銆伮?.7銆伮?.6.2銆伮? `/api/sops/*`銆?

**鍓嶇疆渚濊禆**锛?*Milestone 10鈥?2 宸插畬鎴?*锛圫OP 琛ㄣ€丮11 缂栨帓/Token 瀹堝崼銆丮12 宸插彂甯冩ā鏉匡級銆?

**濂戠害璺敱**锛坄prd.md` 搂3.9.2鈥撀?.9.3 + 鍗峰畻 complete + 浜哄伐鏍￠獙锛夛細

| 鏂规硶 | 璺緞 |
|------|------|
| GET | `/api/sops/templates` |
| POST | `/api/sops/uploads/init` |
| POST | `/api/sops/uploads/complete` |
| POST | `/api/sops/pipelines` |
| GET | `/api/sops/pipelines/:id/status` |
| POST | `/api/sops/pipelines/:id/resume` |
| POST | `/api/sops/pipelines/:id/close` |
| POST | `/api/sops/pipelines/:id/steps/:code/execute` |
| POST | `/api/sops/pipelines/:id/steps/:code/finalize` |
| POST | `/api/sops/artifacts/:id/verify` |
| GET | `/api/sops/artifacts/:id` |
| PATCH | `/api/sops/artifacts/:id` |
| POST | `/api/sops/artifacts/:id/regenerate-pdf` |

**楠屾敹闂ㄧ**锛氬緥甯?A 涓嶅彲璇诲啓寰嬪笀 B 娴佹按绾?浜у嚭鐗╋紱`async_deep_research` 鈫?**202** + 鍚屼簨鍔?Outbox锛沗sync_llm` 鈮?0s锛沗finalize` 鏈?Verified 鈫?**422**锛沗git commit` 鍚庤繘鍏?M14銆?

**M13 鏄庣‘涓嶅湪姝?Milestone**锛歎3 Handler 瀹炵幇锛圡14锛夈€佸緥甯?Admin 鍓嶇锛圡16/M15锛夈€乣suspended` 鎸傝捣 API锛圥RD 浠呭畾涔?`resume`锛屾寕璧风敱杩愮淮/浜屾湡锛夈€?

---

#### M13-A `packages/shared` 鈥?DTO 涓庣被鍨?

- [ ] 鏂板 `packages/shared/src/dto/sop-pipeline-create.dto.ts`锛歚templateVersionId`锛圲UID zod锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `packages/shared/src/dto/sop-pipeline-create.dto.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/dto/sop-step-execute.dto.ts`锛歚formValues`锛坄Record<string, unknown>`锛夈€佸彲閫?`mediaObjectKeys[]`
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `packages/shared/src/dto/sop-step-execute.dto.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/dto/sop-artifact-patch.dto.ts`锛歚contentRaw: string`
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `packages/shared/src/dto/sop-artifact-patch.dto.test.ts`锛氱┖涓叉槸鍚﹀厑璁搞€愪笌 PRD 瀵归綈鍐欐柇瑷€銆?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/dto/sop-upload-init.dto.ts`锛歚pipelineId`銆乣fileName`銆乣mimeType`銆乣sizeBytes`銆乣durationSec?`锛堥檺棰濆悓 `transcription-limits`锛?
  - **渚濊禆**锛歁4 `transcription-limits` 宸插瓨鍦?
- [ ] 鏂板 `packages/shared/src/dto/sop-upload-init.dto.test.ts`锛氳秴 1GB 鈫?鏍￠獙澶辫触
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/dto/sop-upload-complete.dto.ts`锛歚uploadSessionId`
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `packages/shared/src/dto/sop-upload-complete.dto.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/types/sop-published-template-item.ts`锛歚templateVersionId`銆乣templateName`銆乣caseType`銆乣versionNumber`
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `packages/shared/src/types/sop-published-template-item.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/types/sop-pipeline-status-response.ts`锛歚pipelineId`銆乣status`銆乣currentStepCode`銆乣steps: { stepCode, artifactStatus }[]`
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `packages/shared/src/types/sop-pipeline-status-response.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/types/sop-async-execute-accepted.ts`锛歚pipelineId`銆乣stepCode`銆乣artifactId`锛?02 鍝嶅簲浣擄紝`architecture.md` 搂3.2.6.6锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `packages/shared/src/types/sop-async-execute-accepted.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`packages/shared/src/index.ts` re-export M13-A
  - **渚濊禆**锛歁13-A 婧愭枃浠堕綈鍏?
- [ ] 鏂板 `packages/shared/src/index.m13-exports.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M13-B `apps/api` 鈥?棰嗗煙瑙勫垯锛堢函鍑芥暟锛?

- [ ] 鏂板 `apps/api/src/domain/sop/assert-pipeline-actionable.ts`锛氬鍑?`assertPipelineActionable(status)`锛沗completed`/`suspended` 绂佹 execute/finalize锛坄suspended` 椤诲厛 resume锛?
  - **渚濊禆**锛歁10 `CasePipelineStatus`
- [ ] 鏂板 `apps/api/src/domain/sop/assert-pipeline-actionable.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/domain/sop/find-dag-entry-step-code.ts`锛氬鍑?`findDagEntryStepCode(steps)`锛堝敮涓€鍏ュ害 0 鑺傜偣锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/api/src/domain/sop/find-dag-entry-step-code.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/domain/sop/assert-depends-on-finalized.ts`锛氬鍑?`assertDependsOnFinalized(pipelineId, step, artifactsByCode)`锛涙湭瀹氱 鈫?`OPERATION_NOT_ALLOWED`
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/api/src/domain/sop/assert-depends-on-finalized.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/domain/sop/assert-artifact-not-running.ts`锛氬鍑?`assertArtifactNotRunning(status)`锛沗running` 鏃舵嫆缁濈浜屾 execute
  - **渚濊禆**锛歁10 `PipelineArtifactStatus`
- [ ] 鏂板 `apps/api/src/domain/sop/assert-artifact-not-running.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/domain/sop/assert-artifact-editable.ts`锛氬鍑?`assertArtifactEditable(status)`锛沗finalized` 绂佹 PATCH
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/api/src/domain/sop/assert-artifact-editable.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/domain/sop/build-sop-storage-key-prefix.ts`锛氬鍑?`buildSopMediaStorageKeyPrefix(ownerId, pipelineId)` 鈫?`{ownerId}/sops/{pipelineId}/`
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/api/src/domain/sop/build-sop-storage-key-prefix.test.ts`锛氶娈电瓑浜?`ownerId`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/domain/sop/build-sop-deep-research-outbox-payload.ts`锛氬鍑?`buildSopDeepResearchOutboxPayload(...)`锛坄stage=sop.deep_research`锛?
  - **渚濊禆**锛歁10 `SOP_STAGE_DEEP_RESEARCH`
- [ ] 鏂板 `apps/api/src/domain/sop/build-sop-deep-research-outbox-payload.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/domain/sop/build-sop-pdf-export-outbox-payload.ts`锛氬鍑?`buildSopPdfExportOutboxPayload(...)`锛坄stage=sop.pdf_export`锛?
  - **渚濊禆**锛歁10 `SOP_STAGE_PDF_EXPORT`
- [ ] 鏂板 `apps/api/src/domain/sop/build-sop-pdf-export-outbox-payload.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/domain/sop/build-sop-media-ocr-outbox-payload.ts`锛氬鍑?`buildSopMediaOcrOutboxPayload(...)`锛坄stage=sop.media.ocr`锛?
  - **渚濊禆**锛歁10 `SOP_STAGE_MEDIA_OCR`
- [ ] 鏂板 `apps/api/src/domain/sop/build-sop-media-ocr-outbox-payload.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M13-C `apps/api` 鈥?Repository锛堝緥甯?JWT 路 鍗曟柟娉曪級

- [ ] 鏂板 `apps/api/src/repositories/sop-template-read.repository.ts`锛氬鍑?`listPublishedTemplates(accessToken, pagination)`
  - **渚濊禆**锛歁10 RLS锛堝緥甯堜粎 `is_published=true`锛?
- [ ] 鏂板 `apps/api/src/repositories/sop-template-read.repository.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/repositories/case-pipeline.repository.ts`锛氶鏋?+ 鐢ㄦ埛 JWT 瀹㈡埛绔?
  - **渚濊禆**锛歁10 `case_pipelines` 琛?
- [ ] 鏂板 `apps/api/src/repositories/case-pipeline.repository.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `case-pipeline.repository.ts` 鐨?`createPipeline(accessToken, templateVersionId, lawyerId, entryStepCode)`
  - **渚濊禆**锛歁13-C 绗簩鏉?
- [ ] 鏂板 `case-pipeline.repository.create.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `findPipelineForLawyer(accessToken, pipelineId)` 涓?`updatePipelineStatus(...)`
  - **渚濊禆**锛歊epository 楠ㄦ灦
- [ ] 鏂板 `case-pipeline.repository.find.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/repositories/pipeline-artifact.repository.ts`锛氶鏋?
  - **渚濊禆**锛歁10 `pipeline_artifacts`
- [ ] 鏂板 `apps/api/src/repositories/pipeline-artifact.repository.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `upsertArtifactForStep(...)`銆乣findArtifactByStep(...)`銆乣patchContentRaw(expectedVersion, ...)`
  - **渚濊禆**锛歛rtifact repository 楠ㄦ灦
- [ ] 鏂板 `pipeline-artifact.repository.upsert-patch.test.ts`锛氱増鏈啿绐佽繑鍥?0 琛?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `setArtifactStatus(...)`銆乣setFinalizedSnapshot(...)`
  - **渚濊禆**锛歶psert 宸插疄鐜?
- [ ] 鏂板 `pipeline-artifact.repository.status.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/repositories/sop-step-snapshot.repository.ts`锛氭寜 `template_version_id` 璇?`sop_steps`锛堝彧璇诲揩鐓э級
  - **渚濊禆**锛歁10 `sop_steps`
- [ ] 鏂板 `apps/api/src/repositories/sop-step-snapshot.repository.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/repositories/sop-upload-session.repository.ts`锛氭墿灞?`upload_sessions`锛坄pipeline_id` 闈炵┖銆乣task_id` 绌猴級鍒涘缓/瀹屾垚
  - **渚濊禆**锛歁10 `upload_sessions_sop` 杩佺Щ
- [ ] 鏂板 `apps/api/src/repositories/sop-upload-session.repository.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鎵╁睍 `apps/api/src/repositories/outbox.repository.ts`锛氭柊澧?`insertSopOutboxInTransaction(client, { aggregateType: 'case_pipeline', stage, ...})`
  - **渚濊禆**锛歁4 `outbox.repository` 宸插瓨鍦?
- [ ] 鏂板 `apps/api/src/repositories/outbox.repository.sop.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/repositories/sop-verified.repository.ts`锛氬鍑?`hasAutoVerification(pipelineId, stepCode)`锛堟煡 `ai_invocation_logs`锛夛紱`hasManualVerification(artifactId)`锛堟煡 `audit_logs` `sop.artifact.verify`锛?
  - **渚濊禆**锛歁11 metadata 鍒楋紱M10 audit_action 鎵╁睍
- [ ] 鏂板 `apps/api/src/repositories/sop-verified.repository.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M13-D `apps/api` 鈥?Service锛氭ā鏉夸笌娴佹按绾跨敓鍛藉懆鏈?

- [ ] 鏂板 `apps/api/src/services/sop-published-templates-list.service.ts`锛氬鍑?`list(actor, query)`
  - **渚濊禆**锛歁13-C `listPublishedTemplates`
- [ ] 鏂板 `apps/api/src/services/sop-published-templates-list.service.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/services/sop-pipeline-create.service.ts`锛氭牎楠?`template_version_id` 宸插彂甯?鈫?鍒涘缓 `case_pipelines` + `current_step_code` 鍏ュ彛锛?*涓?*鍐?Outbox锛坄prd.md` 搂3.8.1锛?
  - **渚濊禆**锛歁13-B `find-dag-entry-step-code`锛汳13-C create/find
- [ ] 鏂板 `apps/api/src/services/sop-pipeline-create.service.test.ts`锛氭湭鍙戝竷鐗堟湰 鈫?`OPERATION_NOT_ALLOWED`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/services/sop-pipeline-status.service.ts`锛氱粍瑁?`SopPipelineStatusResponse`
  - **渚濊禆**锛歱ipeline + artifacts 鏌ヨ
- [ ] 鏂板 `apps/api/src/services/sop-pipeline-status.service.test.ts`锛氬緥甯堣秺鏉?鈫?`AUTH_FORBIDDEN`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/services/sop-pipeline-resume.service.ts`锛歚suspended` 鈫?`in_progress`锛堟牎楠屽彲鎭㈠锛?
  - **渚濊禆**锛歁13-B `assert-pipeline-actionable`
- [ ] 鏂板 `apps/api/src/services/sop-pipeline-resume.service.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/services/sop-pipeline-close.service.ts`锛氭樉寮忕粨妗?鈫?`completed`锛?*绂佹**鑷姩缁撴
  - **渚濊禆**锛歱ipeline repository
- [ ] 鏂板 `apps/api/src/services/sop-pipeline-close.service.test.ts`锛歚in_progress` 澶栫姸鎬?鈫?422
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M13-E `apps/api` 鈥?Service锛氬嵎瀹?TUS锛坕nit / complete锛?

- [ ] 鏂板 `apps/api/src/services/sop-upload-init.service.ts`锛氭牎楠岄檺棰濓紱`upload_sessions` + 鍓嶇紑 `{ownerId}/sops/{pipelineId}/`锛涜繑鍥?TUS 鍙傛暟锛?*绂佹**璧拌浆鍐?init锛?
  - **渚濊禆**锛歁13-B `build-sop-storage-key-prefix`锛汳13-C upload session repo锛汳4 Storage adapter
- [ ] 鏂板 `apps/api/src/services/sop-upload-init.service.test.ts`锛氬緥甯?B 鏃犳硶涓哄緥甯?A 鐨?`pipelineId` init
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/services/sop-upload-complete.service.ts`锛氭牎楠?Storage 鍓嶇紑 鈫?鏍囪 session 瀹屾垚 鈫?**鍚屼簨鍔?*鎻掑叆 Outbox `sop.media.ocr`锛坄prd.md` 搂3.8.4锛?
  - **渚濊禆**锛歁13-B `build-sop-media-ocr-outbox-payload`锛沷utbox repository
- [ ] 鏂板 `apps/api/src/services/sop-upload-complete.service.test.ts`锛氬畬鎴愬悗鏈熸湜鏈彂甯?Outbox 琛屽瓨鍦?
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M13-F `apps/api` 鈥?Service锛歚execute`锛堟寜鍒嗘敮鎷嗗嚱鏁帮級

- [ ] 鏂板 `apps/api/src/services/sop-step-execute.service.ts`锛氱紪鎺掑叆鍙?`execute(actor, pipelineId, stepCode, body)`
  - **渚濊禆**锛歁13-B 鍓嶇疆鏍￠獙锛汳13-C repos锛汳11 缂栨帓
- [ ] 鏂板 `apps/api/src/services/sop-step-execute.service.test.ts`锛氬墠缃湭瀹氱 鈫?`OPERATION_NOT_ALLOWED`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`sop-step-execute.service.ts` 鎻愬彇 `executeManualStep(...)`锛氬啓 `content_type=json`銆乣status=draft`
  - **渚濊禆**锛歟xecute 楠ㄦ灦
- [ ] 鏂板 `sop-step-execute.service.manual.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鎻愬彇 `executeSyncLlmStep(...)`锛氱粍瑁?Prompt 鈫?`SopTokenLimitGuard` 鈫?`SopAiOrchestrationService`锛?0s锛夆啋 `draft`/`failed`
  - **渚濊禆**锛歁11锛汳13-F 楠ㄦ灦
- [ ] 鏂板 `sop-step-execute.service.sync-llm.test.ts`锛歁ock 瓒呮椂 鈫?`failed`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鎻愬彇 `executeAsyncDeepResearchStep(...)`锛歚assertDeepResearchEnabled` 鈫?artifact `running` 鈫?鍚屼簨鍔?Outbox 鈫?杩斿洖 **202** body
  - **渚濊禆**锛歁11 `sop-deep-research-guard`锛汳13-B outbox payload
- [ ] 鏂板 `sop-step-execute.service.async.test.ts`锛氬搷搴?status 202 涓斿惈 `artifact_id`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鎻愬彇 `updateCurrentStepCodeAfterExecute(...)`锛氭洿鏂?`case_pipelines.current_step_code`
  - **渚濊禆**锛歟xecute 鍒嗘敮宸插疄鐜?
- [ ] 鏂板 `sop-step-execute.service.current-step.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M13-G `apps/api` 鈥?Service锛氫骇鍑虹墿銆佸畾绋裤€佹牎楠屻€丳DF 閲嶈瘯

- [ ] 鏂板 `apps/api/src/services/sop-artifact-get.service.ts`
  - **渚濊禆**锛歁13-C artifact repo
- [ ] 鏂板 `apps/api/src/services/sop-artifact-get.service.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/services/sop-artifact-patch.service.ts`锛氳В鏋?`If-Match`锛沗assertArtifactEditable`锛沗version++`
  - **渚濊禆**锛歁13-B `assert-artifact-editable`
- [ ] 鏂板 `apps/api/src/services/sop-artifact-patch.service.test.ts`锛氶檲鏃?version 鈫?`RESOURCE_CONFLICT` 409
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/services/sop-artifact-verify.service.ts`锛歚append_audit_log('sop.artifact.verify')`锛涗粎鏈寰嬪笀
  - **渚濊禆**锛歁13-C verified repo锛沗AuditWriterService`
- [ ] 鏂板 `apps/api/src/services/sop-artifact-verify.service.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/services/sop-step-finalize.service.ts`锛歚assertVerifiedIfRequired` 鈫?`finalized` + `finalized_snapshot_raw`锛沗html` 姝ラ鍚屼簨鍔?Outbox `sop.pdf_export`
  - **渚濊禆**锛歁13-C verified锛汳13-B pdf outbox payload
- [ ] 鏂板 `apps/api/src/services/sop-step-finalize.service.test.ts`锛氭湭 Verified 鈫?422
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`sop-step-finalize.service.ts` 鎻愬彇 `assertVerifiedIfRequired(...)` 绉佹湁鍑芥暟锛堣嚜鍔ㄦ棩蹇?OR 浜哄伐瀹¤锛?
  - **渚濊禆**锛歠inalize 楠ㄦ灦
- [ ] 鏂板 `sop-step-finalize.service.verified.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/services/sop-artifact-regenerate-pdf.service.ts`锛氫粎 `finalized`锛涘叆闃?`sop.pdf_export` Outbox
  - **渚濊禆**锛歁13-B pdf payload锛沷utbox repo
- [ ] 鏂板 `apps/api/src/services/sop-artifact-regenerate-pdf.service.test.ts`锛歚draft` 鐘舵€?鈫?422
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M13-H `apps/api` 鈥?Controller锛堟瘡鏉¤矾鐢变竴涓枃浠讹級

- [ ] 鏂板 `apps/api/src/controllers/sop-templates-list.controller.ts`锛歚GET /api/sops/templates`
  - **渚濊禆**锛歚sop-published-templates-list.service`
- [ ] 鏂板 `apps/api/src/controllers/sop-templates-list.controller.test.ts`锛歛dmin 鍙皟 lawyer 璺敱銆愯嫢绂佹 admin 鍒?403銆?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/sop-uploads-init.controller.ts`锛歚POST /api/sops/uploads/init`
  - **渚濊禆**锛歚sop-upload-init.service`
- [ ] 鏂板 `apps/api/src/controllers/sop-uploads-init.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/sop-uploads-complete.controller.ts`锛歚POST /api/sops/uploads/complete`
  - **渚濊禆**锛歚sop-upload-complete.service`
- [ ] 鏂板 `apps/api/src/controllers/sop-uploads-complete.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/sop-pipelines-create.controller.ts`锛歚POST /api/sops/pipelines`
  - **渚濊禆**锛歚sop-pipeline-create.service`
- [ ] 鏂板 `apps/api/src/controllers/sop-pipelines-create.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/sop-pipelines-status.controller.ts`锛歚GET /api/sops/pipelines/:id/status`
  - **渚濊禆**锛歚sop-pipeline-status.service`
- [ ] 鏂板 `apps/api/src/controllers/sop-pipelines-status.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/sop-pipelines-resume.controller.ts`锛歚POST .../resume`
  - **渚濊禆**锛歚sop-pipeline-resume.service`
- [ ] 鏂板 `apps/api/src/controllers/sop-pipelines-resume.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/sop-pipelines-close.controller.ts`锛歚POST .../close`
  - **渚濊禆**锛歚sop-pipeline-close.service`
- [ ] 鏂板 `apps/api/src/controllers/sop-pipelines-close.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/sop-step-execute.controller.ts`锛歚POST .../steps/:code/execute`锛坅sync 鏃?`res.status(202)`锛?
  - **渚濊禆**锛歚sop-step-execute.service`
- [ ] 鏂板 `apps/api/src/controllers/sop-step-execute.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/sop-step-finalize.controller.ts`锛歚POST .../steps/:code/finalize`
  - **渚濊禆**锛歚sop-step-finalize.service`
- [ ] 鏂板 `apps/api/src/controllers/sop-step-finalize.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/sop-artifact-get.controller.ts`锛歚GET /api/sops/artifacts/:id`
  - **渚濊禆**锛歚sop-artifact-get.service`
- [ ] 鏂板 `apps/api/src/controllers/sop-artifact-get.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/sop-artifact-patch.controller.ts`锛歚PATCH` + `If-Match` 澶存牎楠?
  - **渚濊禆**锛歚sop-artifact-patch.service`
- [ ] 鏂板 `apps/api/src/controllers/sop-artifact-patch.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/sop-artifact-verify.controller.ts`锛歚POST /api/sops/artifacts/:id/verify`
  - **渚濊禆**锛歚sop-artifact-verify.service`
- [ ] 鏂板 `apps/api/src/controllers/sop-artifact-verify.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/controllers/sop-artifact-regenerate-pdf.controller.ts`锛歚POST .../regenerate-pdf`
  - **渚濊禆**锛歚sop-artifact-regenerate-pdf.service`
- [ ] 鏂板 `apps/api/src/controllers/sop-artifact-regenerate-pdf.controller.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M13-I `apps/api` 鈥?璺敱鎸傝浇涓庨泦鎴?

- [ ] 鏂板 `apps/api/src/routes/sops.routes.ts`锛氬鍑?`handleSopsRoute`锛涘垎鍙?M13-H 鍏ㄩ儴璺緞锛沗requireRoles('lawyer')`锛坅dmin **涓嶅彲**璇诲緥甯堜笟鍔℃暟鎹紝杞啓璺敱鍚岀悊鍒欐嫆缁濓級
  - **渚濊禆**锛歁13-H Controllers
- [ ] 鏂板 `apps/api/src/routes/sops.routes.test.ts`锛氭湭鐧诲綍 401锛沘dmin 璁块棶寰嬪笀 SOP 鈫?403
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`apps/api/src/app.ts` 鎸傝浇 `/api/sops`锛歚auth` + `password-change-gate` + `lawyer`
  - **渚濊禆**锛歚sops.routes.ts`
- [ ] 鏂板 `apps/api/src/__tests__/sops-route-mount.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/__tests__/sop-pipeline-lawyer-isolation.integration.test.ts`锛氬緥甯?A 鏃犳硶 `GET status` 寰嬪笀 B 娴佹按绾匡紙`skip` 鏃?env锛?
  - **渚濊禆**锛歁13-I 鎸傝浇
- [ ] 鏂板 `apps/api/src/__tests__/sop-execute-async-202.integration.test.ts`锛欴eep Research 姝ラ 鈫?202 + Outbox 琛岋紙`skip` 鏃?env锛?
  - **渚濊禆**锛歁13-F async 鍒嗘敮

- [ ] 鏂板 `apps/api/src/__tests__/sop-context-limit.integration.test.ts`锛氳秴澶?Prompt 缁勮 鈫?422 `CONTEXT_LIMIT_EXCEEDED`锛圡ock锛?
  - **渚濊禆**锛歁11 Token guard
- [ ] 鏂板 `apps/api/src/__tests__/sop-upload-prefix.integration.test.ts`锛歩nit 杩斿洖鍓嶇紑浠?`auth.uid()` 寮€澶达紙`skip` 鏃?env锛?
  - **渚濊禆**锛歁13-E

---

#### M13-J Milestone 13 瀹屾垚闂ㄧ

- [ ] 杩愯 `apps/api` M13 鐩稿叧娴嬭瘯鍏ㄧ豢锛涜繛缁け璐?**>2** 娆″垯鍋滄姹囨姤
  - **渚濊禆**锛歁13-A锝濵13-I 鍏ㄩ儴 checkbox 宸插畬鎴?

**浜哄伐榛戠洅楠屾敹**锛堢敱浜哄伐缁?BFF/HTTP 鎵ц锛屼笉閫氳繃涓嶅緱 `git commit`锛夛細

- [ ] **銆愪汉宸ラ粦鐩掋€?* lawyer Token锛歚GET /api/sops/templates` 浠呰繑鍥?`is_published=true` 鐨勬ā鏉跨増鏈?
  - **渚濊禆**锛歁12 宸插彂甯冭嚦灏戜竴鏉℃ā鏉?
- [ ] **銆愪汉宸ラ粦鐩掋€?* lawyer Token锛歚POST /api/sops/pipelines` 鍒涘缓瀹炰緥 鈫?`GET .../status` 杩斿洖鍚堟硶 `currentStepCode` 涓庢楠ょ姸鎬?
  - **渚濊禆**锛氫笂涓€鏉?
- [ ] **銆愪汉宸ラ粦鐩掋€?* 瀵?`manual` 鎴?`sync_llm` 姝ラ锛歚POST .../execute` 鈫?`POST .../finalize`锛涙湭瀹氱鍓嶇疆姝ラ鏃?execute 鈫?**422**
  - **渚濊禆**锛氭ā鏉垮惈澶氭 DAG
- [ ] **銆愪汉宸ラ粦鐩掋€?* 瀵?`async_deep_research` 姝ラ锛堣嫢妯℃澘鍚級锛歚POST .../execute` 鍝嶅簲 **202** 涓?Body 鍚?`pipeline_id`銆乣step_code`銆乣artifact_id`
  - **渚濊禆**锛歁11 DR 宸插惎鐢?
- [ ] **銆愪汉宸ラ粦鐩掋€?* 寰嬪笀 A Token 璁块棶寰嬪笀 B 鐨?`GET .../status` 涓?`PATCH /api/sops/artifacts/:id` 鈫?**403/404**
  - **渚濊禆**锛氳仈璋冨簱涓ゅ悕寰嬪笀
- [ ] **銆愪汉宸ラ粦鐩掋€?* `POST /api/sops/uploads/init` 杩斿洖 Storage 鍓嶇紑浠ュ綋鍓?`auth.uid()` 寮€澶达紱**涓嶅緱**浣跨敤杞啓 `uploads/init` 璺緞
  - **渚濊禆**锛歁13-E
- [ ] **銆愪汉宸ラ粦鐩掋€?* `requires_verification=true` 姝ラ锛氭湭 verify 鐩存帴 finalize 鈫?**422**锛沗POST .../artifacts/:id/verify` 鍚庡啀 finalize 鈫?**200**
  - **渚濊禆**锛歁13 verify/finalize
- [ ] **銆愪汉宸ラ粦鐩掗獙鏀剁鏀躲€?* 鍦?`docs/E2E_MANUAL_RUN_LOG.md` 杩藉姞 **M13** 灏忚妭
  - **渚濊禆**锛氫笂鍒楅粦鐩掗」鍧囬€氳繃

- [ ] 鎵ц `git commit`锛歚feat(sop): lawyer pipeline execute finalize uploads and artifacts api`
  - **渚濊禆**锛氭祴璇曞叏缁匡紱**浜哄伐榛戠洅楠屾敹绛炬敹**
- [ ] 灏嗕笅鏂硅繘搴﹁〃 **M13** 鐘舵€佹洿鏂颁负銆屽凡瀹屾垚銆?
  - **渚濊禆**锛歚git commit` 鎴愬姛

---

### Milestone 14锛氬紓姝?Worker 鈥?SOP 闃舵澶勭悊鍣紙U3锛?

**鐩爣**锛氬湪 `workers/pipeline` 鍐呮敞鍐?`sop.media.ocr` / `sop.deep_research` / `sop.pdf_export` 涓夐樁娈?Handler锛涘叡浜?`WORKER_MAX_CONCURRENCY=5` + 鍒?stage 淇″彿閲忥紱`service_role` 鍐欏簱鍓?RLS 绛変环鏍￠獙锛涘け璐ュ啓 `pipeline_artifacts.status=failed`锛圥DF 澶辫触淇濇寔 `finalized`锛夈€?

**璁捐鍩哄噯**锛歚prd.md` 搂3.8.4鈥撀?.8.6銆伮?.10锛沗architecture.md` 搂3.2.6銆伮?.2.5銆伮?.7銆伮?.6.1鈥撀?.6.2锛沗database.md` 搂3.16.8锛坄exports` 璺緞锛夈€?

**鍓嶇疆渚濊禆**锛?*Milestone 10鈥?3 宸插畬鎴?*锛圫OP Outbox 杞借嵎鐢?U2 鍐欏叆銆丮11 缂栨帓銆丮13 `regenerate-pdf` / upload complete锛夈€?

**闃舵涓庨檺娴?*锛坄architecture.md` 搂3.2.6.3锛夛細

| `stage` | 鍓綔鐢?| 骞跺彂 |
|---------|--------|------|
| `sop.media.ocr` | Storage 鍗峰畻 鈫?ASR 鏂囨湰鎷兼帴 `{{sop_media_extracted_text}}` | 鍏变韩 `WORKER_MAX_CONCURRENCY` |
| `sop.deep_research` | LLM锛堝彲閫夊缃?Tool锛夆啋 artifact `draft`/`failed` | 鈮?`SOP_DEEP_RESEARCH_MAX_CONCURRENT`锛?锛?|
| `sop.pdf_export` | Playwright HTML鈫扨DF 鈫?`exports` 妗讹紱鍥炲啓 `linked_drive_node_id` | 鈮?`SOP_PDF_MAX_CONCURRENT`锛?锛?|

**楠屾敹闂ㄧ**锛歁ock 闆嗘垚娴嬶細閲嶅 `outbox_event_id` 璺宠繃锛汥R 瓒呮椂 30min 鈫?`failed`锛涘緥甯?`disabled` 涓嶅啓搴擄紱`git commit` 鍚庤繘鍏?M15銆?

**M14 鏄庣‘涓嶅湪姝?Milestone**锛氬緥甯?Admin 鍓嶇锛圡15/M16锛夛紱Playwright 瀹夎鏂囨。鍙啓鍏?`DEPLOYMENT.md` 浣嗕笉闃诲 Handler 鍗曟祴锛圡ock锛夈€?

---

#### M14-A `packages/shared` 鈥?SOP Outbox 杞借嵎瑙ｆ瀽

- [ ] 鏂板 `packages/shared/src/types/sop-outbox-payload.ts`锛氬畾涔?`SopOutboxPayload`锛坄stage` 涓?SOP 涓夐樁娈典箣涓€銆乣pipelineId`銆乣lawyerId`銆乣stepCode?`銆乣artifactId?`銆乣storageKeyPrefix?`锛?
  - **渚濊禆**锛歁10 `SOP_PIPELINE_STAGES` 甯搁噺
- [ ] 鏂板 `packages/shared/src/types/sop-outbox-payload.test.ts`锛氬繀濉瓧娈电己澶辨姏閿?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/types/parse-sop-outbox-payload.ts`锛氬鍑?`parseSopOutboxPayload(unknown): SopOutboxPayload`
  - **渚濊禆**锛歚sop-outbox-payload.ts`
- [ ] 鏂板 `packages/shared/src/types/parse-sop-outbox-payload.test.ts`锛氬悎娉?`sop.deep_research` 鏍蜂緥閫氳繃
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/types/parse-worker-outbox-payload.ts`锛氬鍑?`parseWorkerOutboxPayload(unknown): PipelineStageOutboxPayload | SopOutboxPayload`锛堟寜 `stage` 鍓嶇紑/闆嗗悎鍒嗘祦锛?
  - **渚濊禆**锛歚parsePipelineStageOutboxPayload`锛堟棦鏈夛級銆乣parseSopOutboxPayload`
- [ ] 鏂板 `packages/shared/src/types/parse-worker-outbox-payload.test.ts`锛氳浆鍐?`media.extract` 浠嶈В鏋愪负杞啓杞借嵎
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/types/is-sop-pipeline-stage.ts`锛氬鍑?`isSopPipelineStage(stage: string): boolean`
  - **渚濊禆**锛歁10 `sop-pipeline-stages.ts`
- [ ] 鏂板 `packages/shared/src/types/is-sop-pipeline-stage.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`packages/shared/src/index.ts` re-export M14-A
  - **渚濊禆**锛歁14-A 婧愭枃浠堕綈鍏?
- [ ] 鏂板 `packages/shared/src/index.m14-exports.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M14-B `workers/pipeline` 鈥?鍩虹璁炬柦锛堝苟鍙戙€佸鐞嗗櫒鍒嗘敮锛?

- [ ] 鏂板 `workers/pipeline/src/infra/sop-pdf-concurrency-limiter.ts`锛氬鍑?`runWithSopPdfSlot(fn)`锛坄p-limit(SOP_PDF_MAX_CONCURRENT)`锛?
  - **渚濊禆**锛歁11 `loadSopWorkerRuntimeEnvFromProcess`
- [ ] 鏂板 `workers/pipeline/src/infra/sop-pdf-concurrency-limiter.test.ts`锛氬苟鍙?2 浠诲姟浠?1 鍚屾椂鎵ц锛圥DF=1锛?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `workers/pipeline/src/infra/sop-deep-research-concurrency-limiter.ts`锛氬鍑?`runWithSopDeepResearchSlot(fn)`
  - **渚濊禆**锛歁11 SOP env
- [ ] 鏂板 `workers/pipeline/src/infra/sop-deep-research-concurrency-limiter.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `workers/pipeline/src/infra/sop-worker-concurrency-guard.ts`锛氬鍑?`runWithGlobalWorkerSlot(fn)`锛堝鐢?`getWorkerConcurrencyLimiter`锛汼OP 涓庤浆鍐欏叡浜?5 妲斤紝`architecture.md` 搂3.2.6.10锛?
  - **渚濊禆**锛歚worker-concurrency.ts`
- [ ] 鏂板 `workers/pipeline/src/infra/sop-worker-concurrency-guard.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 淇敼 `workers/pipeline/src/repositories/outbox-event.repository.ts`锛堟垨 `outbox.repository`锛夛細鏂板 `parseWorkerPayload(event)` 璋冪敤 shared `parseWorkerOutboxPayload`
  - **渚濊禆**锛歁14-A
- [ ] 鏂板 `workers/pipeline/src/repositories/outbox-event.repository.sop-parse.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 淇敼 `workers/pipeline/src/services/outbox-poller.service.ts`锛歚parseWorkerPayload` 鏇挎崲浠呰浆鍐欒В鏋愶紱鏃ュ織鍖哄垎 `pipelineId` / `taskId`
  - **渚濊禆**锛歳epository 瑙ｆ瀽宸叉墿灞?
- [ ] 鏇存柊 `workers/pipeline/src/services/outbox-poller.service.test.ts`锛歋OP 杞借嵎涓嶆姏 `Invalid taskId`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 淇敼 `workers/pipeline/src/services/pipeline-stage-processor.service.ts`锛氬垎鏀鐞?`SopOutboxPayload`锛堝箓绛?`task_id` 鍒楀啓鍏?`pipelineId`锛涜矾鐢?`SopStageRouter`锛?
  - **渚濊禆**锛歁14-A锛汳14-H Handler 宸叉敞鍐?
- [ ] 鏂板 `workers/pipeline/src/services/pipeline-stage-processor.service.sop.test.ts`锛歁ock Sop handler锛涢噸澶?outbox 璺宠繃
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M14-C `workers/pipeline` 鈥?棰嗗煙绾嚱鏁?

- [ ] 鏂板 `workers/pipeline/src/domain/sop/format-media-filename-header.ts`锛氬鍑?`formatMediaFilenameHeader(fileName: string): string`锛坄--- ${fileName} ---`锛宍prd.md` 搂3.8.4锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `workers/pipeline/src/domain/sop/format-media-filename-header.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `workers/pipeline/src/domain/sop/concat-sop-media-text.ts`锛氬鍑?`concatSopMediaText(chunks: readonly { fileName; text }[]): string`
  - **渚濊禆**锛歚format-media-filename-header.ts`
- [ ] 鏂板 `workers/pipeline/src/domain/sop/concat-sop-media-text.test.ts`锛氬鏂囦欢椤哄簭鎷兼帴
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `workers/pipeline/src/domain/sop/build-exports-pdf-storage-key.ts`锛氬鍑?`buildExportsPdfStorageKey(ownerId, pipelineId, artifactId)` 鈫?`{ownerId}/sops/{pipelineId}/{artifactId}.pdf`
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `workers/pipeline/src/domain/sop/build-exports-pdf-storage-key.test.ts`锛氶娈典负 `ownerId`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `workers/pipeline/src/domain/sop/is-external-search-available.ts`锛氬鍑?`isExternalSearchAvailable(): Promise<boolean>`锛堟帰娴嬮厤缃鐐癸紱澶辫触鈫?false锛宍architecture.md` 搂3.2.6.7锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `workers/pipeline/src/domain/sop/is-external-search-available.test.ts`锛歁ock fetch 瓒呮椂杩斿洖 false
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M14-D `workers/pipeline` 鈥?Repository锛坄service_role`锛?

- [ ] 鏂板 `workers/pipeline/src/repositories/worker-case-pipeline.repository.ts`锛氶鏋讹紙`pg` + Supabase service_role锛?
  - **渚濊禆**锛歁10 `case_pipelines`
- [ ] 鏂板 `workers/pipeline/src/repositories/worker-case-pipeline.repository.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `assertLawyerPipelineWritable(pipelineId)`锛氭牎楠?`lawyer_id` 瀵瑰簲 `profiles.status=enabled`锛坄architecture.md` 搂5.6.2 / `prd.md` 搂2.3锛?
  - **渚濊禆**锛歊epository 楠ㄦ灦
- [ ] 鏂板 `worker-case-pipeline.repository.assert-writable.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `findPipelineWithLawyer(pipelineId)`銆乣updateCurrentStepCode(...)`
  - **渚濊禆**锛歛ssert 宸插疄鐜?
- [ ] 鏂板 `worker-case-pipeline.repository.find.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `workers/pipeline/src/repositories/worker-pipeline-artifact.repository.ts`锛氶鏋?
  - **渚濊禆**锛歁10 `pipeline_artifacts`
- [ ] 鏂板 `workers/pipeline/src/repositories/worker-pipeline-artifact.repository.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `findArtifactById`銆乣setArtifactStatus`銆乣setContentRaw`銆乣setLinkedDriveNodeId`
  - **渚濊禆**锛歛rtifact repo 楠ㄦ灦
- [ ] 鏂板 `worker-pipeline-artifact.repository.mutations.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `loadFinalizedSnapshotHtml(artifactId)`锛堣 `finalized_snapshot_raw` 鎴?`content_raw`锛?
  - **渚濊禆**锛歠ind 宸插疄鐜?
- [ ] 鏂板 `worker-pipeline-artifact.repository.load-html.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `workers/pipeline/src/repositories/worker-sop-media.repository.ts`锛氬垪鍑?`storageKeyPrefix` 涓嬪璞￠敭锛坄media` 妗讹級
  - **渚濊禆**锛歚WorkerStorageAdapter`
- [ ] 鏂板 `workers/pipeline/src/repositories/worker-sop-media.repository.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `workers/pipeline/src/repositories/worker-system-settings.repository.ts`锛氳 `sop.deep_research_enabled`
  - **渚濊禆**锛歁10 seed
- [ ] 鏂板 `workers/pipeline/src/repositories/worker-system-settings.repository.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M14-E `workers/pipeline` 鈥?Service锛歚sop.media.ocr`锛堟寜鍑芥暟鎷嗗垎锛?

- [ ] 鏂板 `workers/pipeline/src/services/sop-media-ocr.service.ts`锛氱被楠ㄦ灦 `SopMediaOcrService`
  - **渚濊禆**锛歁14-D repos锛汳14-C concat
- [ ] 鏂板 `workers/pipeline/src/services/sop-media-ocr.service.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鎻愬彇 `downloadMediaObjectToTemp(storageKey, localPath)` 绉佹湁鏂规硶
  - **渚濊禆**锛歴ervice 楠ㄦ灦
- [ ] 鏂板 `sop-media-ocr.service.download.test.ts`锛圡ock storage锛?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鎻愬彇 `transcribeMediaFile(localPath): Promise<string>`锛堝鐢?`AiOrchestrationService` + `asr_physical`锛?
  - **渚濊禆**锛歞ownload 鏂规硶
- [ ] 鏂板 `sop-media-ocr.service.transcribe.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鎻愬彇 `persistSopMediaExtractedText(pipelineId, stepCode, text)`锛氬啓鍏ユ楠や笂涓嬫枃瀛樺偍銆怐B 鍒?JSON 瀛楁绛栫暐涓?M13 瀵归綈锛屽 `pipeline_artifacts` 鎴栦笓鐢?KV銆?
  - **渚濊禆**锛歵ranscribe 宸插疄鐜?
- [ ] 鏂板 `sop-media-ocr.service.persist.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `run(payload: SopOutboxPayload)`锛氱紪鎺掍笂杩版楠わ紱鎴愬姛 `markPublished`锛涘け璐ユ姏閿?
  - **渚濊禆**锛氬叏閮ㄥ瓙鍑芥暟
- [ ] 鏇存柊 `sop-media-ocr.service.test.ts` 绔埌绔?Mock
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M14-F `workers/pipeline` 鈥?Service锛歚sop.deep_research`

- [ ] 鏂板 `workers/pipeline/src/services/sop-deep-research.service.ts`锛氶鏋?
  - **渚濊禆**锛歁11 `SopLlmOrchestration` 鎴?`AiOrchestrationService` SOP 璺緞
- [ ] 鏂板 `workers/pipeline/src/services/sop-deep-research.service.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鎻愬彇 `assertDeepResearchEnabled()`锛氳 `worker-system-settings`锛沠alse 鏃?artifact `failed` 骞惰繑鍥烇紙Worker 闃插尽锛孶2 宸叉嫤锛?
  - **渚濊禆**锛歴ervice 楠ㄦ灦
- [ ] 鏂板 `sop-deep-research.service.settings.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鎻愬彇 `runWithTimeout(promise, SOP_DEEP_RESEARCH_TIMEOUT_MS)` 鍖呰
  - **渚濊禆**锛歁11 env
- [ ] 鏂板 `sop-deep-research.service.timeout.test.ts`锛氳秴鏃?鈫?`failed`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鎻愬彇 `runExternalSearchOrSkip()`锛氬缃戜笉鍙敤鍒欓檷绾?LLM-only锛坄is-external-search-available`锛?
  - **渚濊禆**锛歁14-C
- [ ] 鏂板 `sop-deep-research.service.degrade.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鎻愬彇 `writeDraftArtifact(artifactId, markdown)` / `writeFailedArtifact(...)`
  - **渚濊禆**锛歸orker-pipeline-artifact repo
- [ ] 鏂板 `sop-deep-research.service.artifact-status.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `run(payload)`锛氱粍瑁?Prompt锛堣姝ラ妯℃澘蹇収锛夆啋 缂栨帓 LLM 鈫?鏇存柊 artifact锛涘啓 `ai_invocation_logs`锛坄task_id` null + metadata锛?
  - **渚濊禆**锛氫笂杩板瓙鍑芥暟
- [ ] 鏇存柊 `sop-deep-research.service.test.ts` 涓昏矾寰?Mock
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M14-G `workers/pipeline` 鈥?Service锛歚sop.pdf_export`锛圥laywright锛?

- [ ] **缁忕敤鎴锋巿鏉冨悗**鍦?`workers/pipeline/package.json` 娣诲姞 `playwright` 渚濊禆锛堟垨鏂囨。鍖栫郴缁?`npx playwright install chromium`锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `workers/pipeline/src/services/sop-pdf-export.service.deps.test.ts`锛氭柇瑷€ `package.json` 鍚?playwright銆愭垨 skip 鑻ョ函 Mock銆?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `workers/pipeline/src/services/sop-pdf-export.service.ts`锛氶鏋?
  - **渚濊禆**锛歁14-D锛汳14-C `build-exports-pdf-storage-key`
- [ ] 鏂板 `workers/pipeline/src/services/sop-pdf-export.service.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鎻愬彇 `renderHtmlToPdfBuffer(html: string): Promise<Buffer>`锛圥laywright `page.setContent` + `pdf()`锛?
  - **渚濊禆**锛歴ervice 楠ㄦ灦
- [ ] 鏂板 `sop-pdf-export.service.render.test.ts`锛歁ock Playwright API
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鎻愬彇 `uploadPdfToExports(buffer, storageKey)`
  - **渚濊禆**锛歚WorkerStorageAdapter`
- [ ] 鏂板 `sop-pdf-export.service.upload.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鎻愬彇 `linkPdfToDriveNode(pipelineId, artifactId, storageKey)`锛堝垱寤?鏇存柊 `drive_nodes` + `linked_drive_node_id`锛?
  - **渚濊禆**锛歚WorkerDriveRepository` 鎴栨柊 `worker-sop-drive.repository.ts`
- [ ] 鏂板 `sop-pdf-export.service.drive-link.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `run(payload)`锛氬け璐?*涓?*鍥炴粴 `finalized`锛涗粎鏃ュ織 + 鍙噸璇?Outbox锛坄publish_attempts` 閫掑锛宍prd.md` 搂3.8.5锛?
  - **渚濊禆**锛氫笂杩板瓙鍑芥暟
- [ ] 鏇存柊 `sop-pdf-export.service.test.ts`锛氬け璐ユ椂 `status` 浠嶄负 `finalized`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M14-H `workers/pipeline` 鈥?Handler 涓庨敊璇鐞嗭紙姣忔潯涓€涓枃浠讹級

- [ ] 鏂板 `workers/pipeline/src/handlers/sop-stage-handler.ts`锛氬畾涔?`SopStageHandlerContext`锛坄SopOutboxPayload`锛変笌 `SopStageHandler` 鎺ュ彛
  - **渚濊禆**锛歁14-A
- [ ] 鏂板 `workers/pipeline/src/handlers/sop-stage-handler.test.ts`锛氱被鍨?smoke
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `workers/pipeline/src/handlers/sop-media-ocr.handler.ts`锛氬疄鐜?`SopStageHandler`锛涘唴璋?`SopMediaOcrService.run`
  - **渚濊禆**锛歁14-E
- [ ] 鏂板 `workers/pipeline/src/handlers/sop-media-ocr.handler.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `workers/pipeline/src/handlers/sop-deep-research.handler.ts`锛氬寘瑁?`runWithSopDeepResearchSlot` + `runWithGlobalWorkerSlot`
  - **渚濊禆**锛歁14-F锛汳14-B limiters
- [ ] 鏂板 `workers/pipeline/src/handlers/sop-deep-research.handler.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `workers/pipeline/src/handlers/sop-pdf-export.handler.ts`锛氬寘瑁?`runWithSopPdfSlot` + `runWithGlobalWorkerSlot`
  - **渚濊禆**锛歁14-G锛汳14-B limiters
- [ ] 鏂板 `workers/pipeline/src/handlers/sop-pdf-export.handler.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `workers/pipeline/src/handlers/sop-stage-error.handler.ts`锛歋OP 澶辫触鏃?`pipeline_artifacts.status=failed`锛?*涓?*璋冪敤 `transition_task_status`锛?
  - **渚濊禆**锛歁14-D artifact repo
- [ ] 鏂板 `workers/pipeline/src/handlers/sop-stage-error.handler.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 淇敼 `workers/pipeline/src/services/stage-router.ts`锛氭敮鎸?`PipelineStage | SopPipelineStage` 鑱斿悎璺敱锛堟垨鏂板 `SopStageRouter` 绫伙級
  - **渚濊禆**锛氫笁 Handler 宸插瓨鍦?
- [ ] 鏂板 `workers/pipeline/src/services/sop-stage-router.test.ts`锛氳В鏋?`sop.pdf_export` 杩斿洖瀵瑰簲 Handler
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M14-I `workers/pipeline` 鈥?Bootstrap 瑁呴厤涓庡畬鎴?Outbox

- [ ] 淇敼 `workers/pipeline/src/bootstrap/create-pipeline-deps.ts`锛氬疄渚嬪寲 SOP Services/Handlers 骞舵敞鍐屽埌 `SopStageRouter` / 鎵╁睍 `StageRouter`
  - **渚濊禆**锛歁14-H
- [ ] 鏂板 `workers/pipeline/src/bootstrap/create-pipeline-deps.sop.test.ts`锛氬鍑?processor 鍚?8 涓?stage 閿?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`Sop*Handler` 鎴愬姛璺緞璋冪敤 `WorkerOutboxRepository.markPublished`锛堜笌杞啓 Handler 涓€鑷达級
  - **渚濊禆**锛歜ootstrap 宸叉帴绾?
- [ ] 鏂板 `workers/pipeline/src/__tests__/sop-handler-marks-published.test.ts`锛歁ock DB 鏂█ `published_at` 闈炵┖
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 淇敼 `workers/pipeline/src/index.ts` 鍚姩鏃ュ織锛氳緭鍑?`SOP_PDF_MAX_CONCURRENT`銆乣SOP_DEEP_RESEARCH_MAX_CONCURRENT`
  - **渚濊禆**锛歁11 worker env 鍚堝苟
- [ ] 鏂板 `workers/pipeline/src/index.sop-env-log.test.ts`锛堝彲閫夛細鎹曡幏 console锛?
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M14-J 闆嗘垚娴嬭瘯涓?Milestone 14 瀹屾垚闂ㄧ

- [ ] 鏂板 `workers/pipeline/src/__tests__/sop-outbox-idempotency.integration.test.ts`锛氬悓涓€ `outbox_event_id` 澶勭悊涓ゆ 鈫?绗簩娆?`skipped_duplicate`
  - **渚濊禆**锛歁14-I
- [ ] 鏂板 `workers/pipeline/src/__tests__/sop-deep-research-disabled-lawyer.integration.test.ts`锛歞isabled 寰嬪笀 鈫?涓嶅啓 artifact锛圡ock锛?
  - **渚濊禆**锛歁14-F assert

- [ ] 鏂板 `workers/pipeline/src/__tests__/sop-pdf-export-path.integration.test.ts`锛氫笂浼?key 鍖归厤 `{ownerId}/sops/{pipelineId}/{artifactId}.pdf`锛圡ock storage锛?
  - **渚濊禆**锛歁14-G

- [ ] 鍦?`docs/DEPLOYMENT.md` 澧炲姞銆孲OP Worker銆嶅皬鑺傦細`playwright install`銆佷笁 stage 鐜鍙橀噺锛?*涓?*鏀瑰叾浠?Milestone 鏂囦欢浠ュ鍐呭鑻ョ敤鎴锋湭瑕佹眰鈥旀湰鏉′负閮ㄧ讲璇存槑鍗曟锛?
  - **渚濊禆**锛歁14-G
- [ ] 鏂板 `tools/compliance/no-u2-sync-sop-pdf.test.ts`锛氭壂鎻?`apps/api` 绂佹 `playwright` 鐢熶骇 import锛坄architecture.md` U2 绂佹鏃犲ご PDF锛?
  - **渚濊禆**锛氭棤

- [ ] 杩愯 `workers/pipeline` 娴嬭瘯鍏ㄧ豢锛涜繛缁け璐?**>2** 娆″垯鍋滄姹囨姤
  - **渚濊禆**锛歁14-A锝濵14-I 瀹屾垚

**浜哄伐榛戠洅楠屾敹**锛堢敱浜哄伐鍚姩 U1/U2/U3 鑱旇皟鏍堟墽琛岋紝涓嶉€氳繃涓嶅緱 `git commit`锛夛細

- [ ] **銆愪汉宸ラ粦鐩掋€?* 鍚姩 `worker:pipeline`锛涘緥甯堝畬鎴愬嵎瀹?`uploads/complete` 鍚庯紝瑙傚療 `outbox_events` 鍑虹幇 `stage=sop.media.ocr` 涓旀渶缁堣娑堣垂锛坄published_at` 闈炵┖锛?
  - **渚濊禆**锛歁13 鍗峰畻 complete锛汳14 OCR Handler
- [ ] **銆愪汉宸ラ粦鐩掋€?* 瀵瑰惈 `async_deep_research` 鐨勬祦姘寸嚎锛歟xecute 202 鍚庯紝杞 `pipeline_artifacts.status` 鐢?`running` 鍙樹负 `draft` 鎴?`failed`锛?*绂佹** U2 杩涚▼闀挎椂闂撮樆濉烇級
  - **渚濊禆**锛歁14-F DR Handler
- [ ] **銆愪汉宸ラ粦鐩掋€?* 瀵?`html` 姝ラ finalize 鍚庯細Outbox 鍑虹幇 `sop.pdf_export`锛涙垚鍔熸椂 `exports` 妗跺彲瑙?`{owner_id}/sops/{pipeline_id}/{artifact_id}.pdf` 鎴?`linked_drive_node_id` 鍥炲啓
  - **渚濊禆**锛歁14-G PDF Handler锛汸laywright 宸插畨瑁?
- [ ] **銆愪汉宸ラ粦鐩掋€?* 閲嶅鎶曢€掑悓涓€ Outbox 浜嬩欢锛堟垨闆嗘垚娴嬫ā鎷燂級锛氫笉浜х敓閲嶅 ASR/LLM 鍓綔鐢紙`pipeline_job_runs` 骞傜瓑锛?
  - **渚濊禆**锛歁14-J 闆嗘垚娴嬫垨浜哄伐閲嶆斁
- [ ] **銆愪汉宸ラ粦鐩掋€?* 绂佺敤寰嬪笀璐﹀彿鍚庯細Worker 涓嶅啀涓鸿寰嬪笀鍐欏叆鏂?artifact锛堟垨鏍囪澶辫触锛夛紝鏃犺法鐢ㄦ埛鏁版嵁娉勯湶
  - **渚濊禆**锛歁14-F `assertLawyerEnabled`
- [ ] **銆愪汉宸ラ粦鐩掗獙鏀剁鏀躲€?* 鍦?`docs/E2E_MANUAL_RUN_LOG.md` 杩藉姞 **M14** 灏忚妭
  - **渚濊禆**锛氫笂鍒楅粦鐩掗」鍧囬€氳繃

- [ ] 鎵ц `git commit`锛歚feat(worker): sop outbox handlers media ocr deep research pdf export`
  - **渚濊禆**锛氭祴璇曞叏缁匡紱**浜哄伐榛戠洅楠屾敹绛炬敹**
- [ ] 灏嗕笅鏂硅繘搴﹁〃 **M14** 鐘舵€佹洿鏂颁负銆屽凡瀹屾垚銆?
  - **渚濊禆**锛歚git commit` 鎴愬姛

---

### Milestone 15锛氱鐞嗗憳 鈥?SOP 閰嶇疆鍓嶇

**鐩爣**锛欰dmin Prompt Studio 涓?SOP 妯℃澘鐗堟湰绠＄悊 UI锛涘鎺?M12 `/api/admin/sops/*`锛涘凡鍙戝竷鐗堟湰鍙锛涜崏绋垮彲缂栬緫姝ラ/Prompt 缁戝畾锛涘彂甯冧笌鏂板缓鐗堟湰鑽夌锛涙矙鐩掕瘯璺戙€?

**璁捐鍩哄噯**锛歚prd.md` 搂3.4.1銆伮?.9.1锛沗architecture.md` 搂7锛沗ui_design.md` 搂2鈥撀?銆伮?.1銆伮?.5锛堥珮瀵嗗害琛級锛沗CONTEXT_SUMMARY.md` 搂11銆?

**鍓嶇疆渚濊禆**锛?*Milestone 12 宸插畬鎴?*锛圓dmin SOP API 鍙敤锛夛紱M11锛圓I 閰嶇疆椤靛凡灞曠ず鍥?SOP 鍔熻兘鐐癸紝渚涙楠ょ粦瀹?`prompt_template_id`锛夈€?

**椤甸潰璺敱锛堝缓璁級**锛?

| 璺緞 | 鐢ㄩ€?|
|------|------|
| `/admin/sops` | 妯℃澘鍒楄〃 + 鏂板缓妯℃澘 |
| `/admin/sops/templates/[templateId]` | 鐗堟湰鏃堕棿绾裤€佽繘鍏ョ増鏈紪杈?|
| `/admin/sops/template-versions/[versionId]` | 姝ラ/Prompt 缂栬緫銆佸彂甯冦€侀瑙堟矙鐩?|

**楠屾敹闂ㄧ**锛欰dmin 瀹屾垚銆屾柊寤烘ā鏉?鈫?缂栬緫鑽夌姝ラ 鈫?鍙戝竷 鈫?鏂板缓鐗堟湰鑽夌 鈫?鍐嶅彂甯冦€嶏紱宸插彂甯冪増鏈帶浠剁鐢ㄤ笖淇濆瓨杩斿洖 422 Toast锛沗git commit` 鍚庤繘鍏?M16銆?

**M15 鏄庣‘涓嶅湪姝?Milestone**锛氬緥甯堢 SOP UI锛圡16锛夛紱Monaco/HTML 鍙屾爮锛圡16锛夛紱Mermaid/鍥捐〃搴撱€?

---

#### M15-A Shadcn 缁勪欢寮曞叆锛堟瘡鏉″懡浠や竴椤癸級

- [ ] 鎵ц `npx shadcn@latest add scroll-area`锛堟楠ょ紪杈戝尯闀垮垪琛紱鑻?M6 宸插紩鍏ュ垯璺宠繃骞跺嬀閫夛級
  - **渚濊禆**锛歁1 Shadcn 鍩哄缓宸插瓨鍦?
- [ ] 鎵ц `npx shadcn@latest add accordion`锛堢増鏈姌鍙犻潰鏉匡紝鑻ュ凡瀛樺湪鍒欒烦杩囷級
  - **渚濊禆**锛氭棤
- [ ] 鎵ц `npx shadcn@latest add textarea`锛圝SON Schema / Mustache 璇存槑锛涜嫢宸插瓨鍦ㄥ垯璺宠繃锛?
  - **渚濊禆**锛氭棤

---

#### M15-B `apps/web` 鈥?API 瀹㈡埛绔紙姣忔潯鍑芥暟涓€涓换鍔?+ 娴嬭瘯锛?

- [ ] 鏂板 `apps/web/src/lib/admin-sops-api.ts`锛氭枃浠堕鏋?+ 澶嶇敤 `apiFetch` / `ApiSuccess` 绫诲瀷
  - **渚濊禆**锛歁12 API 宸查儴缃叉垨 Mock 鑱旇皟
- [ ] 鏂板 `apps/web/src/lib/admin-sops-api.types.ts`锛氬畾涔?`AdminSopTemplateListItem`銆乣AdminSopVersionDetail` 绛夛紙瀵归綈 M12 shared 绫诲瀷鎴栨湰鍦版槧灏勶級
  - **渚濊禆**锛氫笂涓€鏉?
- [ ] 鏂板 `apps/web/src/lib/admin-sops-api.types.test.ts`锛氱被鍨嬫瀯閫?smoke
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`admin-sops-api.ts` 瀹炵幇 `listAdminSops(query?)` 鈫?`GET /api/admin/sops`
  - **渚濊禆**锛歵ypes 宸插畾涔?
- [ ] 鏂板 `apps/web/src/lib/admin-sops-api.list.test.ts`锛歁ock `fetch` 瑙ｆ瀽 `items` 鏁扮粍
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `createAdminSopTemplate(body)` 鈫?`POST /api/admin/sops/templates`
  - **渚濊禆**锛歚listAdminSops`
- [ ] 鏂板 `admin-sops-api.create-template.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `getAdminSopTemplate(templateId)` 鈫?`GET /api/admin/sops/templates/:id`
  - **渚濊禆**锛歝reate 宸插疄鐜?
- [ ] 鏂板 `admin-sops-api.get-template.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `getAdminSopTemplateVersion(versionId)` 鈫?`GET /api/admin/sops/template-versions/:id`
  - **渚濊禆**锛歡et template 宸插疄鐜?
- [ ] 鏂板 `admin-sops-api.get-version.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `upsertAdminSopVersionPrompts(versionId, body)` 鈫?`PUT .../prompts`
  - **渚濊禆**锛歡et version 宸插疄鐜?
- [ ] 鏂板 `admin-sops-api.upsert-prompts.test.ts`锛?22 鏃舵姏鍑?`ApiClientError`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `publishAdminSopTemplateVersion(versionId)` 鈫?`POST .../publish`
  - **渚濊禆**锛歶psert 宸插疄鐜?
- [ ] 鏂板 `admin-sops-api.publish.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `createAdminSopTemplateVersion(templateId, body?)` 鈫?`POST .../templates/:id/versions`
  - **渚濊禆**锛歱ublish 宸插疄鐜?
- [ ] 鏂板 `admin-sops-api.create-version.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `previewAdminSopPipeline(body)` 鈫?`POST /api/admin/sops/preview-pipeline`
  - **渚濊禆**锛歝reate version 宸插疄鐜?
- [ ] 鏂板 `apps/web/src/lib/admin-sops-api.preview.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M15-C `apps/web` 鈥?灞曠ず杈呭姪锛堟爣绛?寰界珷锛屽崟鏂囦欢锛?

- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-execution-type-label.ts`锛氬鍑?`executionTypeLabel(type)`锛坄sync_llm` / `async_deep_research` / `manual`锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-execution-type-label.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-version-status-badge.tsx`锛氬凡鍙戝竷/鑽夌 Badge锛堜护鐗岃壊锛岀姝?hex锛?
  - **渚濊禆**锛歋hadcn `badge`
- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-version-status-badge.test.tsx`锛氭覆鏌撱€屽凡鍙戝竷銆?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-published-readonly-banner.tsx`锛歚isPublished` 鏃堕《閮?Alert 鏂囨銆屽凡鍙戝竷鍙锛岃鏂板缓鐗堟湰鑽夌銆?
  - **渚濊禆**锛歋hadcn `alert`
- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-published-readonly-banner.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M15-D `apps/web` 鈥?瀵艰埅涓庤矾鐢卞畧鍗?

- [ ] 鍦?`apps/web/src/lib/menus.ts` 澧炲姞 `{ href: "/admin/sops", label: "SOP 妯℃澘", allowedRoles: ["admin"] }`锛坄ui_design.md` 搂5.1锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/web/src/lib/menus.sop.test.ts`锛歛dmin 瑙掕壊鍙璇ラ」
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 纭 `middleware.ts` / `router-guard`锛歚/admin/sops` 浠?`admin`锛坙awyer 鈫?`/unauthorized`锛?
  - **渚濊禆**锛歮enus 宸叉洿鏂?
- [ ] 鏂板 `apps/web/src/lib/router-guard.sop.test.ts`锛堣嫢椤圭洰鏈?guard 鍗曟祴锛涘惁鍒欒鍏?M17 E2E锛?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/app/(app)/admin/sops/page.tsx`锛氭寕杞?`AdminSopsPagePanel`锛汼keleton/Error/Empty
  - **渚濊禆**锛歁15-E 闈㈡澘
- [ ] 鏂板 `apps/web/src/app/(app)/admin/sops/page.test.tsx`锛氬鍑洪粯璁ょ粍浠?smoke
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/app/(app)/admin/sops/templates/[templateId]/page.tsx`锛氱増鏈垪琛ㄩ〉
  - **渚濊禆**锛歁15-F 鏃堕棿绾跨粍浠?
- [ ] 鏂板 `apps/web/src/app/(app)/admin/sops/templates/[templateId]/page.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/app/(app)/admin/sops/template-versions/[versionId]/page.tsx`锛氱増鏈紪杈戦〉
  - **渚濊禆**锛歁15-G 缂栬緫澹?
- [ ] 鏂板 `apps/web/src/app/(app)/admin/sops/template-versions/[versionId]/page.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M15-E `apps/web` 鈥?妯℃澘鍒楄〃椤电粍浠?

- [ ] 鏂板 `apps/web/src/components/admin/sops/AdminSopsPagePanel.tsx`锛欶lex 鍒楋紱宸ュ叿鏍?+ 琛ㄦ牸锛坄ui_design.md` 搂6.5锛?
  - **渚濊禆**锛歁15-B `listAdminSops`
- [ ] 鏂板 `apps/web/src/components/admin/sops/AdminSopsPagePanel.test.tsx`锛歀oading 鏄剧ず Skeleton
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/admin/sops/admin-sops-templates-table.tsx`锛氬垪锛氭ā鏉垮悕銆乣case_type`銆佹渶鏂扮増鏈€佹槸鍚﹀凡鍙戝竷銆佹搷浣?
  - **渚濊禆**锛歅anel 楠ㄦ灦
- [ ] 鏂板 `apps/web/src/components/admin/sops/admin-sops-templates-table.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/admin/sops/create-sop-template-dialog.tsx`锛欴ialog + Form锛坄name`銆乣caseType`锛夛紱鎻愪氦 `createAdminSopTemplate`
  - **渚濊禆**锛歁15-B create API
- [ ] 鏂板 `apps/web/src/components/admin/sops/create-sop-template-dialog.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M15-F `apps/web` 鈥?鐗堟湰鏃堕棿绾匡紙妯℃澘璇︽儏椤碉級

- [ ] 鏂板 `apps/web/src/components/admin/sops/AdminSopTemplateDetailPanel.tsx`锛氬姞杞?`getAdminSopTemplate`锛涘睍绀虹増鏈垪琛?
  - **渚濊禆**锛歁15-B get template
- [ ] 鏂板 `apps/web/src/components/admin/sops/AdminSopTemplateDetailPanel.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-template-versions-table.tsx`锛氬垪锛歚version_number`銆乣is_published`銆乣published_at`銆佹搷浣溿€岀紪杈?鏌ョ湅銆?
  - **渚濊禆**锛欴etailPanel
- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-template-versions-table.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/admin/sops/create-sop-version-dialog.tsx`锛歚AlertDialog` 纭鍚?`createAdminSopTemplateVersion`
  - **渚濊禆**锛歁15-B create version API
- [ ] 鏂板 `apps/web/src/components/admin/sops/create-sop-version-dialog.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M15-G `apps/web` 鈥?鐗堟湰缂栬緫澹筹紙鍙鎬侊級

- [ ] 鏂板 `apps/web/src/components/admin/sops/AdminSopVersionEditorShell.tsx`锛欸rid 甯冨眬锛堜晶鏍忔楠ゅ垪琛?+ 涓诲尯锛夛紱鎸傝浇 `SopPublishedReadonlyBanner`
  - **渚濊禆**锛歁15-C banner锛沗ui_design.md` 搂3 Grid
- [ ] 鏂板 `apps/web/src/components/admin/sops/AdminSopVersionEditorShell.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-version-editor-toolbar.tsx`锛氭寜閽€屼繚瀛樻楠ゃ€嶃€屽彂甯冦€嶃€屾柊寤虹増鏈崏绋裤€嶃€岄瑙?Prompt銆嶏紱`isPublished` 鏃剁鐢ㄤ繚瀛?鍙戝竷
  - **渚濊禆**锛欵ditorShell
- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-version-editor-toolbar.test.tsx`锛氬凡鍙戝竷鏃朵繚瀛樻寜閽?`disabled`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`AdminSopVersionEditorShell` 鍐呰皟鐢?`getAdminSopTemplateVersion(versionId)` 鍔犺浇鏁版嵁
  - **渚濊禆**锛歁15-B锛涘瓙缁勪欢楠ㄦ灦
- [ ] 鏂板 `AdminSopVersionEditorShell.load.test.tsx`锛欵rror 鏃?Toast
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M15-H `apps/web` 鈥?姝ラ鍒楄〃涓?DAG `depends_on` 缂栬緫

- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-steps-list.tsx`锛氬乏渚ф楠?`step_code` 鍒楄〃锛涢€変腑楂樹寒
  - **渚濊禆**锛欵ditorShell
- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-steps-list.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-step-editor-form.tsx`锛歊HF + zod锛歚stepCode`銆乣name`銆乣executionType` Select銆乣requiresVerification` Switch
  - **渚濊禆**锛歋hadcn `form`/`select`/`switch`
- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-step-editor-form.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`sop-step-editor-form.tsx` 澧炲姞 `aiFeatureKey` Select锛堥€夐」鏉ヨ嚜 `ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES` 涓洓涓?`sop.*`锛?
  - **渚濊禆**锛歁11 shared 瀵煎嚭
- [ ] 鏂板 `sop-step-editor-form.ai-feature.test.tsx`锛歚manual` 鏃堕殣钘?AI 瀛楁
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`sop-step-editor-form.tsx` 澧炲姞 `promptTemplateId` Select锛坄listPrompts` 杩囨护瀵瑰簲 `featureKey`锛?
  - **渚濊禆**锛歚admin-ai-api.ts` `listPrompts`
- [ ] 鏂板 `sop-step-editor-form.prompt-template.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-depends-on-multi-select.tsx`锛氬閫夊墠缃?`step_code`锛堢姝㈤€夎嚜韬級
  - **渚濊禆**锛氭楠ゅ垪琛ㄦ暟鎹?
- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-depends-on-multi-select.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-mustache-hint.tsx`锛氶潤鎬佽鏄?`{{artifact_{step_code}_*}}` 椤诲垪鍏?`depends_on`锛坄prd.md` 搂2.4锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-mustache-hint.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M15-I `apps/web` 鈥?JSON Schema 缂栬緫鍣紙`input_schema`锛?

- [ ] 鏂板 `apps/web/src/lib/validate-json-schema-text.ts`锛氬鍑?`validateJsonSchemaText(text): { ok, error? }`锛坄JSON.parse` + 鏈€灏忓璞℃牎楠岋級
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/web/src/lib/validate-json-schema-text.test.ts`锛氶潪娉?JSON 杩斿洖閿欒
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-input-schema-editor.tsx`锛歚Textarea` 缁戝畾 `input_schema`锛涗繚瀛樺墠鏍￠獙
  - **渚濊禆**锛歷alidate 宸ュ叿
- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-input-schema-editor.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦ㄥ伐鍏锋爮銆屼繚瀛樻楠ゃ€嶇偣鍑绘椂鑱氬悎鍏ㄩ儴姝ラ涓?`upsertAdminSopVersionPrompts` body
  - **渚濊禆**锛歴tep form + schema editor + depends_on
- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-save-version-prompts.test.tsx`锛歁ock API 琚皟鐢ㄤ竴娆?
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M15-J `apps/web` 鈥?鍙戝竷涓庢柊寤虹増鏈氦浜?

- [ ] 鏂板 `apps/web/src/components/admin/sops/publish-sop-version-alert-dialog.tsx`锛氫簩娆＄‘璁?鈫?`publishAdminSopTemplateVersion`锛涙垚鍔?Toast
  - **渚濊禆**锛歁15-B publish API
- [ ] 鏂板 `apps/web/src/components/admin/sops/publish-sop-version-alert-dialog.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`publish-sop-version-alert-dialog` 澶勭悊 API 422锛歍oast 灞曠ず鍙戝竷鏍￠獙閿欒锛堢己鏄犲皠/DAG锛?
  - **渚濊禆**锛歞ialog 楠ㄦ灦
- [ ] 鏂板 `publish-sop-version-alert-dialog.error.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 灏?`create-sop-version-dialog` 鍦ㄥ凡鍙戝竷鐗堟湰宸ュ叿鏍忔寕杞斤紱鎴愬姛鍚?`router.push` 鏂?`versionId`
  - **渚濊禆**锛歁15-F dialog锛汵ext router
- [ ] 鏂板 `create-sop-version-dialog.navigate.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M15-K `apps/web` 鈥?Prompt 娌欑洅棰勮

- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-preview-pipeline-dialog.tsx`锛欴ialog锛涜〃鍗?`stepCode` + 妯℃嫙 `formValues` JSON + 鍙€変笂娓?artifact 鏂囨湰
  - **渚濊禆**锛歁15-B `previewAdminSopPipeline`
- [ ] 鏂板 `apps/web/src/components/admin/sops/sop-preview-pipeline-dialog.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦ㄩ瑙?Dialog 灞曠ず LLM 杈撳嚭鍙 `ScrollArea`锛?*绂佹** Mermaid/鍥捐〃搴撴覆鏌擄級
  - **渚濊禆**锛歞ialog 楠ㄦ灦
- [ ] 鏂板 `sop-preview-pipeline-dialog.result.test.tsx`锛歁ock 杩斿洖 markdown 鏂囨湰娓叉煋涓?`<pre>`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M15-L Milestone 15 瀹屾垚闂ㄧ

**浜哄伐榛戠洅楠屾敹**锛堢敱浜у搧鍦ㄦ祻瑙堝櫒涓墽琛岋紝涓嶉€氳繃涓嶅緱 `git commit`锛夛細

- [ ] **銆愪汉宸ラ粦鐩掋€?* admin 鐧诲綍 鈫?`/admin/sops` 鏂板缓妯℃澘 鈫?杩涘叆鐗堟湰缂栬緫 鈫?娣诲姞 2 姝?DAG锛堝惈 `depends_on`锛夆啋 淇濆瓨 鈫?鍙戝竷 鈫?鏂板缓鑽夌鐗堟湰 鈫?鍐嶇紪杈戝苟鍙戝竷
  - **渚濊禆**锛歁15-A锝濵15-K 瀹屾垚
- [ ] **銆愪汉宸ラ粦鐩掋€?* 宸插彂甯冪増鏈墦寮€缂栬緫椤碉細淇濆瓨/鍙戝竷鎸夐挳 **disabled**锛汥evTools 寮哄埗璋冪敤淇濆瓨 API 鏃剁晫闈?Toast 灞曠ず 422 鍙嬪ソ鏂囨
  - **渚濊禆**锛氫笂涓€鏉?
- [ ] **銆愪汉宸ラ粦鐩掋€?* lawyer 璐﹀彿璁块棶 `/admin/sops` 鈫?`/unauthorized` 鎴栫瓑浠锋嫆缁濋〉
  - **渚濊禆**锛歁15-D guard
- [ ] **銆愪汉宸ラ粦鐩掋€?* Prompt 娌欑洅棰勮锛氳緭鍏ユā鎷熻〃鍗曚笌涓婃父鏂囨湰锛岄瑙堝尯浠呭睍绀虹函鏂囨湰/Markdown锛?*鏃?* Mermaid/鍥捐〃搴撴覆鏌?
  - **渚濊禆**锛歁15-K
- [ ] **銆愪汉宸ラ粦鐩掗獙鏀剁鏀躲€?* 鍦?`docs/E2E_MANUAL_RUN_LOG.md` 杩藉姞 **M15** 灏忚妭
  - **渚濊禆**锛氫笂鍒楅粦鐩掗」鍧囬€氳繃

- [ ] 鎵ц `git commit`锛歚feat(web): admin sop prompt studio and template versioning ui`
  - **渚濊禆**锛?*浜哄伐榛戠洅楠屾敹绛炬敹**
- [ ] 灏嗕笅鏂硅繘搴﹁〃 **M15** 鐘舵€佹洿鏂颁负銆屽凡瀹屾垚銆?
  - **渚濊禆**锛歚git commit` 鎴愬姛

---

### Milestone 16锛氬緥甯堢 鈥?SOP 娴佹按绾垮墠绔?

**鐩爣**锛氬緥甯堜粠宸插彂甯冩ā鏉垮垱寤烘祦姘寸嚎 鈫?鍗峰畻 TUS 鈫?姝ラ `execute`/`finalize` 鈫?HTML 浜у嚭鐗╁弻鏍忕紪杈?鈫?鏄惧紡缁撴锛涘鎺?M13 `/api/sops/*`锛涚姸鎬?HTTP 杞 **鈮?s**銆?

**璁捐鍩哄噯**锛歚prd.md` 搂3.8.1鈥撀?.8.6銆伮?.9.2鈥撀?.9.3銆伮?.10锛沗architecture.md` 搂3.2.6.5鈥撀?.2.6.7銆伮?锛沗ui_design.md` 搂2鈥撀?銆伮?.3锛圱US 绂诲紑纭锛夛紱`CONTEXT_SUMMARY.md` 搂6銆伮?1銆?

**鍓嶇疆渚濊禆**锛?*Milestone 13 宸插畬鎴?*锛堝緥甯?SOP API锛夛紱**Milestone 14 宸插畬鎴?*锛坄sop.media.ocr` / `sop.deep_research` / `sop.pdf_export` 鍙杞鎰熺煡锛夛紱M6锛坄AppShell`銆乀oast銆佽浆鍐?TUS 鍩哄缓鍙鐢級銆?

**椤甸潰璺敱锛堝缓璁級**锛?

| 璺緞 | 鐢ㄩ€?|
|------|------|
| `/sops` | 宸插彂甯冩ā鏉块€夋嫨 + 鍒涘缓娴佹按绾匡紙**棣栨湡鏃?*銆屾垜鐨勬祦姘寸嚎鍒楄〃銆岮PI锛?|
| `/sops/pipelines/[pipelineId]` | 姝ラ鐪嬫澘銆佸綋鍓嶆楠ゆ搷浣溿€佷骇鍑虹墿缂栬緫銆佺粨妗?|

**楠屾敹闂ㄧ**锛氬緥甯堝畬鎴愩€岄€夋ā鏉?鈫?寤哄疄渚?鈫?鍗峰畻涓婁紶 鈫?sync 姝ラ execute/finalize 鈫?async 姝ラ 202 鍚庤疆璇?running鈫抎raft/failed 鈫?HTML 鍙屾爮 PATCH 瀹氱 鈫?鏄惧紡缁撴銆嶏紱`deep_research` 鍏抽棴鏃?UI 绂佺敤瀵瑰簲姝ラ锛沗git commit` 鍚庤繘鍏?M17銆?

**M16 鏄庣‘涓嶅湪姝?Milestone**锛欰dmin Prompt Studio锛圡15锛夛紱E2E/鍚堣鍏ㄩ噺锛圡17锛夛紱WebSocket/閭欢杩涘害锛汳ermaid/鍥捐〃搴擄紱涓婃父宸插畾绋?break-glass 鏀圭鍏ュ彛銆?

---

#### M16-A `apps/web` 渚濊禆涓?Shadcn锛堝崟鍖?鍗曞懡浠や竴椤癸級

- [ ] 鍦?`apps/web/package.json` 澧炲姞 `@monaco-editor/react` 渚濊禆锛圚TML 婧愮爜缂栬緫锛宍prd.md` 搂3.8.5锛?
  - **渚濊禆**锛氭棤
- [ ] 鍦?`apps/web/package.json` 澧炲姞 `@rjsf/core`銆乣@rjsf/utils`銆乣@rjsf/validator-ajv8`锛坄input_schema` 鍔ㄦ€佽〃鍗曪紝`prd.md` 搂3.8.4锛?
  - **渚濊禆**锛氭棤
- [ ] 鍦?`apps/web/package.json` 澧炲姞 `isomorphic-dompurify`锛堥潪 iframe 鍦烘櫙鐨?HTML 鐗囨灞曠ず锛宍prd.md` 搂3.10锛?
  - **渚濊禆**锛氭棤
- [ ] 鎵ц `npm install`锛坵orkspace 鏍圭洰褰曪級骞剁‘璁?lockfile 鏇存柊
  - **渚濊禆**锛氫笂涓夋潯 package.json 鍙樻洿
- [ ] 鎵ц `npx shadcn@latest add progress`锛堟楠?涓婁紶杩涘害锛涜嫢宸插瓨鍦ㄥ垯璺宠繃锛?
  - **渚濊禆**锛歁1 Shadcn 鍩哄缓
- [ ] 鎵ц `npx shadcn@latest add toggle`锛圚TML 棰勮榛戠櫧妯″紡鍒囨崲锛宍prd.md` 搂3.8.5锛?
  - **渚濊禆**锛氭棤

---

#### M16-B `apps/web` 鈥?API 瀹㈡埛绔紙姣忔潯鍑芥暟涓€涓换鍔?+ 娴嬭瘯锛?

- [ ] 鏂板 `apps/web/src/lib/lawyer-sops-api.ts`锛氭枃浠堕鏋?+ 澶嶇敤 `apiFetch` / `ApiClientError`
  - **渚濊禆**锛歁13 API 鍙仈璋?
- [ ] 鏂板 `apps/web/src/lib/lawyer-sops-api.types.ts`锛氬畾涔?`SopPublishedTemplateItem`銆乣SopPipelineStatusResponse` 绛夛紙瀵归綈 `@lexos/shared` 鎴?M13 鍝嶅簲锛?
  - **渚濊禆**锛氫笂涓€鏉?
- [ ] 鏂板 `apps/web/src/lib/lawyer-sops-api.types.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`lawyer-sops-api.ts` 瀹炵幇 `listSopTemplates(query?)` 鈫?`GET /api/sops/templates`
  - **渚濊禆**锛歵ypes 宸插畾涔?
- [ ] 鏂板 `apps/web/src/lib/lawyer-sops-api.list-templates.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `createSopPipeline(body)` 鈫?`POST /api/sops/pipelines`锛圔ody `templateVersionId`锛?
  - **渚濊禆**锛歭ist 宸插疄鐜?
- [ ] 鏂板 `lawyer-sops-api.create-pipeline.test.ts`锛氭湭鍙戝竷鐗堟湰 Mock 422
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `getSopPipelineStatus(pipelineId)` 鈫?`GET /api/sops/pipelines/:id/status`
  - **渚濊禆**锛歝reate 宸插疄鐜?
- [ ] 鏂板 `lawyer-sops-api.get-status.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `resumeSopPipeline(pipelineId)` 鈫?`POST .../resume`
  - **渚濊禆**锛歡et status 宸插疄鐜?
- [ ] 鏂板 `lawyer-sops-api.resume.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `closeSopPipeline(pipelineId)` 鈫?`POST .../close`
  - **渚濊禆**锛歳esume 宸插疄鐜?
- [ ] 鏂板 `lawyer-sops-api.close.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `initSopUpload(body)` 鈫?`POST /api/sops/uploads/init`
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `lawyer-sops-api.init-upload.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `completeSopUpload(body)` 鈫?`POST /api/sops/uploads/complete`
  - **渚濊禆**锛歩nit 宸插疄鐜?
- [ ] 鏂板 `lawyer-sops-api.complete-upload.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `executeSopStep(pipelineId, stepCode, body)` 鈫?`POST .../steps/:code/execute`锛堣В鏋?200/202锛?
  - **渚濊禆**锛歴tatus API 宸插疄鐜?
- [ ] 鏂板 `lawyer-sops-api.execute.test.ts`锛?02 鏃惰繑鍥?`artifactId`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `finalizeSopStep(pipelineId, stepCode)` 鈫?`POST .../steps/:code/finalize`
  - **渚濊禆**锛歟xecute 宸插疄鐜?
- [ ] 鏂板 `lawyer-sops-api.finalize.test.ts`锛氭湭 Verified Mock 422
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `getSopArtifact(artifactId)` 鈫?`GET /api/sops/artifacts/:id`
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `lawyer-sops-api.get-artifact.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `patchSopArtifact(artifactId, version, body)` 鈫?`PATCH` + Header `If-Match`
  - **渚濊禆**锛歡et artifact 宸插疄鐜?
- [ ] 鏂板 `lawyer-sops-api.patch-artifact.test.ts`锛?09 `RESOURCE_CONFLICT`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `verifySopArtifact(artifactId)` 鈫?`POST .../verify`
  - **渚濊禆**锛歱atch 宸插疄鐜?
- [ ] 鏂板 `lawyer-sops-api.verify-artifact.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 瀹炵幇 `regenerateSopArtifactPdf(artifactId)` 鈫?`POST .../regenerate-pdf`
  - **渚濊禆**锛歷erify 宸插疄鐜?
- [ ] 鏂板 `lawyer-sops-api.regenerate-pdf.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M16-C `apps/web` 鈥?绾嚱鏁颁笌 Hook锛堝崟瀵煎嚭鍗曟枃浠讹級

- [ ] 鏂板 `apps/web/src/lib/sop-pipeline-poll-interval-ms.ts`锛氬鍑哄父閲?`SOP_PIPELINE_POLL_INTERVAL_MS = 2000`锛坄prd.md` 搂3.8.1銆乣architecture.md` 搂3.2.6.5锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/web/src/lib/sop-pipeline-poll-interval-ms.test.ts`锛氭柇瑷€ `>= 2000`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/hooks/use-sop-pipeline-status-poll.ts`锛氬鍑?`useSopPipelineStatusPoll(pipelineId, { enabled })`锛涘唴閮?`setInterval` 璋冪敤 `getSopPipelineStatus`锛涘嵏杞芥竻鐞?
  - **渚濊禆**锛歁16-B锛汳16-C 甯搁噺
- [ ] 鏂板 `apps/web/src/hooks/use-sop-pipeline-status-poll.test.ts`锛歁ock 涓ゆ杞闂撮殧 鈮?000ms锛坒ake timers锛?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/hooks/use-debounced-value.ts`锛氬鍑?`useDebouncedValue<T>(value, delayMs)`锛堥€氱敤 500ms 渚?iframe 鍒锋柊锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/web/src/hooks/use-debounced-value.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/lib/build-iframe-srcdoc.ts`锛氬鍑?`buildIframeSrcdoc(html: string): string`锛堝寘瑁规渶灏?HTML 鏂囨。锛?*涓?*娉ㄥ叆 script锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/web/src/lib/build-iframe-srcdoc.test.ts`锛氳緭鍑轰笉鍚?`<script`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/lib/sanitize-sop-html-snippet.ts`锛氬鍑?`sanitizeSopHtmlSnippet(html)`锛圖OMPurify锛岀姝?`script`/`on*`锛?
  - **渚濊禆**锛歚isomorphic-dompurify` 宸插畨瑁?
- [ ] 鏂板 `apps/web/src/lib/sanitize-sop-html-snippet.test.ts`锛氬墺绂?`<script>alert(1)</script>`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M16-D `apps/web` 鈥?TUS 鍗峰畻涓婁紶 Hook锛堢嫭绔嬩簬杞啓锛?

- [ ] 鍦?`apps/web/src/contexts/active-upload-context.tsx` 鎵╁睍 `ActiveUploadState`锛氬鍔犲彲閫?`kind: 'transcription' | 'sop'` 涓?`pipelineId?`
  - **渚濊禆**锛歁4 `ActiveUploadProvider` 宸插瓨鍦?
- [ ] 鏂板 `apps/web/src/contexts/active-upload-context.sop.test.tsx`锛歚kind=sop` 鏃?`hasActiveUpload` 涓?true
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/hooks/use-sop-tus-upload.ts`锛氬鍑?`uploadSopMedia(file, { pipelineId, fileName, ... })`锛涜皟鐢?`initSopUpload` 鈫?`buildTusUploadOptions` 鈫?TUS 鈫?`completeSopUpload`锛?*绂佹**璋冪敤 `transcription-api`锛?
  - **渚濊禆**锛歁16-B init/complete锛沗tus-upload.ts`锛沗active-upload-context`
- [ ] 鏂板 `apps/web/src/hooks/use-sop-tus-upload.test.ts`锛歁ock 鏈皟鐢?`initUpload`锛堣浆鍐欒矾寰勶級
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`use-sop-tus-upload.ts` 娉ㄥ唽 `registerUpload({ kind: 'sop', pipelineId, fileName })` 涓?`beforeunload` 鎻愮ず锛堝鐢ㄨ浆鍐?搂6.3.4 妯″紡锛?
  - **渚濊禆**锛欻ook 楠ㄦ灦
- [ ] 鏂板 `use-sop-tus-upload.register.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M16-E `apps/web` 鈥?灞曠ず杈呭姪锛堟爣绛?寰界珷锛?

- [ ] 鏂板 `apps/web/src/components/sops/sop-pipeline-status-label.ts`锛氬鍑?`pipelineStatusLabel(status)`锛坄in_progress` / `completed` / `suspended`锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/web/src/components/sops/sop-pipeline-status-label.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/sops/sop-artifact-status-badge.tsx`锛歚running` / `draft` / `failed` / `finalized` Badge
  - **渚濊禆**锛歋hadcn `badge`
- [ ] 鏂板 `apps/web/src/components/sops/sop-artifact-status-badge.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/sops/sop-execution-type-hint.tsx`锛氭寜 `executionType` 灞曠ず銆屽悓姝?LLM 鈮?0s銆嶃€屽紓姝ユ绱€嶃€屼汉宸ヨ〃鍗曘€嶈鏄?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/web/src/components/sops/sop-execution-type-hint.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/sops/sop-deep-research-offline-banner.tsx`锛氬浐瀹氭枃妗堛€屽缃戞绱笉鍙敤锛屽够瑙夐闄╀笂鍗囥€嶏紙`architecture.md` 搂3.2.6.7锛?
  - **渚濊禆**锛歋hadcn `alert`
- [ ] 鏂板 `apps/web/src/components/sops/sop-deep-research-offline-banner.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M16-F `apps/web` 鈥?瀵艰埅涓庤矾鐢?

- [ ] 鍦?`apps/web/src/lib/menus.ts` 澧炲姞 `{ href: "/sops", label: "SOP 娴佹按绾?, allowedRoles: ["lawyer"] }`
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/web/src/lib/menus.sops-lawyer.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 纭 `router-guard.ts`锛歚/sops` 浠?`lawyer`锛沗admin` 璁块棶 鈫?`/unauthorized`锛坅dmin **涓嶅彲**璇诲緥甯?SOP 鏁版嵁锛宍prd.md` 搂2.3锛?
  - **渚濊禆**锛歮enus 宸叉洿鏂?
- [ ] 鏂板 `apps/web/src/lib/router-guard.sops-lawyer.test.ts`锛堣嫢椤圭洰鏃?guard 鍗曟祴鍒欒鍏?M17 E2E锛?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/app/(app)/sops/page.tsx`锛氭寕杞?`LawyerSopsEntryPanel`
  - **渚濊禆**锛歁16-G 鍏ュ彛闈㈡澘
- [ ] 鏂板 `apps/web/src/app/(app)/sops/page.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/app/(app)/sops/pipelines/[pipelineId]/page.tsx`锛氭寕杞?`LawyerSopPipelineWorkspace`
  - **渚濊禆**锛歁16-H 宸ヤ綔鍖哄３
- [ ] 鏂板 `apps/web/src/app/(app)/sops/pipelines/[pipelineId]/page.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M16-G `apps/web` 鈥?妯℃澘閫夋嫨涓庡垱寤烘祦姘寸嚎

- [ ] 鏂板 `apps/web/src/components/sops/LawyerSopsEntryPanel.tsx`锛欶lex 鍒楋紱璋冪敤 `listSopTemplates`锛涜〃鏍?+銆屾柊寤烘祦姘寸嚎銆?
  - **渚濊禆**锛歁16-B list API
- [ ] 鏂板 `apps/web/src/components/sops/LawyerSopsEntryPanel.test.tsx`锛歀oading Skeleton
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/sops/sop-published-templates-table.tsx`锛氬垪锛歚templateName`銆乣caseType`銆乣versionNumber`銆佹搷浣?
  - **渚濊禆**锛欵ntryPanel
- [ ] 鏂板 `apps/web/src/components/sops/sop-published-templates-table.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/sops/create-pipeline-from-template-dialog.tsx`锛歚AlertDialog` 纭 鈫?`createSopPipeline` 鈫?`router.push(/sops/pipelines/:id)`
  - **渚濊禆**锛歁16-B create API
- [ ] 鏂板 `apps/web/src/components/sops/create-pipeline-from-template-dialog.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M16-H `apps/web` 鈥?娴佹按绾垮伐浣滃尯澹充笌姝ラ鐪嬫澘

- [ ] 鏂板 `apps/web/src/components/sops/LawyerSopPipelineWorkspace.tsx`锛欸rid锛堜晶鏍忔楠?+ 涓诲尯锛夛紱鎸傝浇 `useSopPipelineStatusPoll`锛沗suspended` 鏃跺睍绀烘仮澶嶆潯
  - **渚濊禆**锛歁16-C poll锛汳16-I 鎭㈠鏉?
- [ ] 鏂板 `apps/web/src/components/sops/LawyerSopPipelineWorkspace.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/sops/sop-pipeline-steps-board.tsx`锛氭寜 `status.steps` 娓叉煋姝ラ琛?+ `SopArtifactStatusBadge`锛涢珮浜?`currentStepCode`
  - **渚濊禆**锛歱oll 鏁版嵁褰㈢姸
- [ ] 鏂板 `apps/web/src/components/sops/sop-pipeline-steps-board.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/sops/sop-pipeline-resume-banner.tsx`锛歚status=suspended` 鏃躲€屾仮澶嶆祦姘寸嚎銆嶁啋 `resumeSopPipeline`
  - **渚濊禆**锛歁16-B resume
- [ ] 鏂板 `apps/web/src/components/sops/sop-pipeline-resume-banner.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/sops/sop-pipeline-close-dialog.tsx`锛氭樉寮忋€岀粨妗堛€嶁啋 `closeSopPipeline`锛?*绂佹**鑷姩缁撴锛宍prd.md` 搂3.8.3锛?
  - **渚濊禆**锛歁16-B close
- [ ] 鏂板 `apps/web/src/components/sops/sop-pipeline-close-dialog.test.tsx`锛歚completed` 鍚庢寜閽殣钘?
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M16-I `apps/web` 鈥?JSON Schema 鍔ㄦ€佽〃鍗曪紙`manual` / `execute` 鍓嶇疆锛?

- [ ] 鏂板 `apps/web/src/components/sops/sop-json-schema-form.tsx`锛氭帴鏀?`inputSchema` + `onSubmit`锛沗@rjsf` 娓叉煋锛涙牎楠屽け璐ラ樆姝㈡彁浜?
  - **渚濊禆**锛歁16-A RJSF 渚濊禆
- [ ] 鏂板 `apps/web/src/components/sops/sop-json-schema-form.test.tsx`锛氬繀濉己澶辨椂涓嶈皟鐢?`onSubmit`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/lib/coerce-sop-form-values.ts`锛氬鍑?`coerceSopFormValues(formData)` 鈫?`Record<string, unknown>`锛坋xecute Body锛?
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `apps/web/src/lib/coerce-sop-form-values.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M16-J `apps/web` 鈥?鍗峰畻 TUS 涓婁紶鍖?

- [ ] 鏂板 `apps/web/src/components/sops/sop-media-upload-zone.tsx`锛氭嫋鎷?閫夋嫨鏂囦欢锛涜皟鐢?`useSopTusUpload`锛涘睍绀?`Progress`锛涢檺棰濇彁绀猴紙1GB/5h 鍚岃浆鍐欙級
  - **渚濊禆**锛歁16-D Hook
- [ ] 鏂板 `apps/web/src/components/sops/sop-media-upload-zone.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`sop-media-upload-zone.tsx` 涓婁紶杩涜涓寕杞借矾鐢辩寮€ `AlertDialog`锛堝鐢?`active-upload-context` + 鐜版湁 Guard 缁勪欢锛?
  - **渚濊禆**锛歾one 楠ㄦ灦锛汳4 璺敱 Guard
- [ ] 鏂板 `sop-media-upload-zone.leave-guard.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M16-K `apps/web` 鈥?姝ラ鎵ц涓庡畾绋挎搷浣?

- [ ] 鏂板 `apps/web/src/components/sops/sop-step-action-panel.tsx`锛氳仛鍚堝綋鍓嶆楠?UI 瀹瑰櫒锛堣〃鍗?+ 涓婁紶 + 鎸夐挳鍖猴級
  - **渚濊禆**锛歁16-I/J锛涙楠ょ湅鏉块€変腑鎬?
- [ ] 鏂板 `apps/web/src/components/sops/sop-step-action-panel.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/sops/sop-execute-step-button.tsx`锛氭敹闆?`formValues` 鈫?`executeSopStep`锛沗sync_llm` Loading锛沗async` 鏀跺埌 202 鍚?Toast銆屽凡鎻愪氦锛岃绛夊緟杞銆?
  - **渚濊禆**锛歁16-B execute
- [ ] 鏂板 `apps/web/src/components/sops/sop-execute-step-button.test.tsx`锛歁ock 202 涓嶆竻闄よ疆璇?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`sop-execute-step-button.tsx` 澶勭悊 `OPERATION_NOT_ALLOWED` / `CONTEXT_LIMIT_EXCEEDED` Toast 鏂囨
  - **渚濊禆**锛氭寜閽鏋?
- [ ] 鏂板 `sop-execute-step-button.errors.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/sops/sop-finalize-step-button.tsx`锛歚AlertDialog` 纭 鈫?`finalizeSopStep`锛涙垚鍔熷悗鍒锋柊 poll
  - **渚濊禆**锛歁16-B finalize
- [ ] 鏂板 `apps/web/src/components/sops/sop-finalize-step-button.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 褰?`execution_type=async_deep_research` 涓旂郴缁熻缃叧闂椂锛岀鐢ㄦ墽琛屾寜閽苟 Tooltip锛堣 `GET /api/admin/settings` 鎴?BFF 鍏紑鍙 flag銆愪笌 M8 settings 瀵归綈銆戯級
  - **渚濊禆**锛歟xecute 鎸夐挳锛汳8 璁剧疆 API 瀛楁 `sop.deep_research_enabled`
- [ ] 鏂板 `sop-execute-step-button.dr-disabled.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M16-L `apps/web` 鈥?浜у嚭鐗╃紪杈戯紙JSON / HTML 鍒嗘敮锛?

- [ ] 鏂板 `apps/web/src/components/sops/sop-artifact-json-viewer.tsx`锛歚content_type=json` 鍙/鍙紪杈?`Textarea`锛沗PATCH` 淇濆瓨 draft
  - **渚濊禆**锛歁16-B patch
- [ ] 鏂板 `apps/web/src/components/sops/sop-artifact-json-viewer.test.tsx`锛歚finalized` 鏃跺彧璇?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/sops/sop-artifact-editor-shell.tsx`锛氭寜 `contentType` 鍒囨崲 JSON 缂栬緫鍣?vs HTML 鍙屾爮
  - **渚濊禆**锛歁16-L json viewer锛汳16-M html editor
- [ ] 鏂板 `apps/web/src/components/sops/sop-artifact-editor-shell.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`sop-artifact-editor-shell.tsx` 瀹炵幇涔愯閿侊細淇濆瓨鏃跺甫 `If-Match`锛?09 鏃?Toast銆岀増鏈啿绐侊紝璇峰埛鏂般€?
  - **渚濊禆**锛歴hell 楠ㄦ灦
- [ ] 鏂板 `sop-artifact-editor-shell.conflict.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M16-M `apps/web` 鈥?Monaco + iframe 娌欑洅棰勮锛坄content_type=html`锛?

- [ ] 鏂板 `apps/web/src/components/sops/sop-monaco-html-editor.tsx`锛歚dynamic(() => import('@monaco-editor/react'), { ssr: false })`锛沗language=html`
  - **渚濊禆**锛歁16-A Monaco
- [ ] 鏂板 `apps/web/src/components/sops/sop-monaco-html-editor.test.tsx`锛歁ock Monaco 娓叉煋 textarea 鍗犱綅
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/sops/sop-html-iframe-preview.tsx`锛歚<iframe sandbox="allow-same-origin">` **绂佹** `allow-scripts`锛沗srcDoc={buildIframeSrcdoc(debouncedHtml)}`
  - **渚濊禆**锛歁16-C debounce + buildIframeSrcdoc
- [ ] 鏂板 `apps/web/src/components/sops/sop-html-iframe-preview.test.tsx`锛氭柇瑷€ sandbox 灞炴€т笉鍚?`allow-scripts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/sops/sop-html-preview-toolbar.tsx`锛歍oggle 榛戠櫧妯″紡锛坄filter: grayscale(100%)`锛夛紱A3/A4 绾稿紶姣斾緥瀹瑰櫒 + 绾㈣壊铏氱嚎鍑鸿妗嗭紙绾?CSS Grid/Flex锛宍prd.md` 搂3.8.5锛?
  - **渚濊禆**锛歩frame 棰勮缁勪欢
- [ ] 鏂板 `apps/web/src/components/sops/sop-html-preview-toolbar.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 缁勮 `apps/web/src/components/sops/sop-artifact-html-split-pane.tsx`锛氬乏 Monaco + 鍙?iframe + 宸ュ叿鏍忥紱Debounce **500ms** 鍒锋柊棰勮
  - **渚濊禆**锛歁16-M 瀛愮粍浠?
- [ ] 鏂板 `apps/web/src/components/sops/sop-artifact-html-split-pane.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M16-N `apps/web` 鈥?骞昏鏍￠獙闂ㄧ涓?PDF 閲嶈瘯

- [ ] 鏂板 `apps/web/src/components/sops/sop-artifact-verify-button.tsx`锛氬睍绀?[Verified] 鐘舵€侊紱浜哄伐 鈫?`verifySopArtifact`
  - **渚濊禆**锛歁16-B verify锛沗requires_verification` 鏉ヨ嚜 status/姝ラ鍏冩暟鎹€愯嫢 status 鏈惈鍒欎粠 GET artifact 鎺ㄦ柇銆?
- [ ] 鏂板 `apps/web/src/components/sops/sop-artifact-verify-button.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`sop-finalize-step-button.tsx` 鏈?Verified 鏃剁鐢ㄥ苟 Tooltip锛坄prd.md` 搂3.8.3锛?
  - **渚濊禆**锛歷erify 鎸夐挳锛沠inalize 鎸夐挳
- [ ] 鏂板 `sop-finalize-step-button.verify-gate.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/sops/sop-regenerate-pdf-button.tsx`锛氫粎 `finalized` 鏄剧ず 鈫?`regenerateSopArtifactPdf`锛汿oast 宸插叆闃?
  - **渚濊禆**锛歁16-B regenerate
- [ ] 鏂板 `apps/web/src/components/sops/sop-regenerate-pdf-button.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/web/src/components/sops/sop-pdf-link-status.tsx`锛氬睍绀?`linked_drive_node_id` 绌?闈炵┖锛涘紩瀵艰嚦浜戠洏璺緞锛堝彧璇婚摼鎺ワ紝涓嶅啓 Supabase锛?
  - **渚濊禆**锛歛rtifact GET 瀛楁
- [ ] 鏂板 `apps/web/src/components/sops/sop-pdf-link-status.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M16-O `apps/web` 鈥?寮傛姝ラ杞 UX

- [ ] 鍦?`LawyerSopPipelineWorkspace` 涓細褰撲换涓€姝ラ `artifactStatus=running` 鏃跺己鍒?`enabled=true` 杞锛堥棿闅?`SOP_PIPELINE_POLL_INTERVAL_MS`锛?
  - **渚濊禆**锛歁16-C poll锛汳16-H workspace
- [ ] 鏂板 `LawyerSopPipelineWorkspace.running-poll.test.tsx`锛歚running` 鏃?poll 鍑芥暟璋冪敤 鈮? 娆?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 褰撴楠?`running鈫抎raft` 鏃?Toast銆屾楠ゅ凡瀹屾垚锛岃瀹￠槄瀹氱銆嶏紱`鈫抐ailed` 鏃?Toast 閿欒锛?*绂佹** WebSocket锛宍prd.md` 搂4.2.4 SOP L3锛?
  - **渚濊禆**锛歸orkspace poll 鍓綔鐢?
- [ ] 鏂板 `LawyerSopPipelineWorkspace.status-transition.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`async_deep_research` 姝ラ鎵ц鍚庡睍绀?`SopDeepResearchOfflineBanner`锛堝彲鐢?BFF 璁剧疆鎴?status 鎵╁睍瀛楁椹卞姩锛涚己鐪佷笉灞曠ず锛?
  - **渚濊禆**锛歁16-E banner锛沞xecute 202 娴佺▼
- [ ] 鏂板 `sop-step-action-panel.dr-banner.test.tsx`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M16-P Milestone 16 瀹屾垚闂ㄧ

**浜哄伐榛戠洅楠屾敹**锛堢敱浜у搧鍦ㄦ祻瑙堝櫒涓墽琛岋紝涓嶉€氳繃涓嶅緱 `git commit`锛夛細

- [ ] **銆愪汉宸ラ粦鐩掋€?* lawyer 鐧诲綍 鈫?`/sops` 閫夊凡鍙戝竷妯℃澘 鈫?鍒涘缓娴佹按绾?鈫?鍗峰畻 TUS 涓婁紶瀹屾垚 鈫?`sync_llm`/`manual` 姝ラ execute 鈫?finalize
  - **渚濊禆**锛歁16-A锝濵16-O 瀹屾垚锛汳13鈥揗14 鑱旇皟鏍堝湪绾?
- [ ] **銆愪汉宸ラ粦鐩掋€?* `async_deep_research` 姝ラ锛歟xecute 鍚?UI Toast銆屽凡鎻愪氦銆嶏紱闂撮殧 **鈮?s** 杞鐩磋嚦姝ラ `draft` 鎴?`failed`锛堣瀵?Network 鏃?WebSocket锛?
  - **渚濊禆**锛氫笂涓€鏉?
- [ ] **銆愪汉宸ラ粦鐩掋€?* HTML 浜у嚭鐗╋細Monaco 淇敼婧愮爜 鈫?绾?**500ms** 鍚?iframe 棰勮鏇存柊锛涙鏌?iframe `sandbox` **涓嶅惈** `allow-scripts`
  - **渚濊禆**锛歁16-M
- [ ] **銆愪汉宸ラ粦鐩掋€?* PATCH 淇濆瓨 draft 鍚庡畾绋匡紱鏄惧紡鐐瑰嚮銆岀粨妗堛€嶁啋 娴佹按绾?`completed`锛?*绂佹**鑷姩缁撴锛?
  - **渚濊禆**锛歁16-N close dialog
- [ ] **銆愪汉宸ラ粦鐩掋€?* `admin` 璁块棶 `/sops` 鈫?鎷掔粷锛涘緥甯?A 鐩存帴鎵撳紑寰嬪笀 B 鐨?`/sops/pipelines/:id` 鈫?403/404 鎴栫┖鎬?
  - **渚濊禆**锛歁16-F guard
- [ ] **銆愪汉宸ラ粦鐩掋€?* TUS 涓婁紶杩涜涓細娴忚鍣ㄥ埛鏂板嚭鐜?`beforeunload` 鎻愮ず锛汼PA 璺敱绂诲紑鍑虹幇 `AlertDialog`
  - **渚濊禆**锛歁16-D/J
- [ ] **銆愪汉宸ラ粦鐩掋€?* `system_settings.sop.deep_research_enabled=false` 鏃讹紝Deep Research 姝ラ鎵ц鎸夐挳绂佺敤涓?Tooltip 鍙
  - **渚濊禆**锛歁16-K
- [ ] **銆愪汉宸ラ粦鐩掗獙鏀剁鏀躲€?* 鍦?`docs/E2E_MANUAL_RUN_LOG.md` 杩藉姞 **M16** 灏忚妭
  - **渚濊禆**锛氫笂鍒楅粦鐩掗」鍧囬€氳繃

- [ ] 鎵ц `git commit`锛歚feat(web): lawyer sop pipeline ui tus polling and html sandbox`
  - **渚濊禆**锛?*浜哄伐榛戠洅楠屾敹绛炬敹**
- [ ] 灏嗕笅鏂硅繘搴﹁〃 **M16** 鐘舵€佹洿鏂颁负銆屽凡瀹屾垚銆?
  - **渚濊禆**锛歚git commit` 鎴愬姛

---

### Milestone 17锛歋OP 闆嗘垚楠屾敹涓庡熀绾垮洖褰?

**鐩爣**锛氬湪 M10鈥揗16 浜や粯鍚庯紝琛ラ綈 **璺ㄥ眰** 闆嗘垚/E2E/鍚堣鎵弿锛涚‘璁?M1鈥揗9 鍩哄骇鏃犲洖褰掞紱鏇存柊浜哄伐楠屾敹鏂囨。锛涜交閲忛獙璇?SOP `execute` 璁″叆鍏ㄧ珯 **QPS 鈮?10**锛坄OPEN_ISSUES.md` PRD-SOP-46锛夈€?

**璁捐鍩哄噯**锛歚prd.md` 搂3.8鈥撀?.10銆伮?.2.1銆伮?.2.4锛圫OP L1鈥揕4锛夛紱`architecture.md` 搂3.2.6锛圲2 鍚屾杈圭晫銆?02 杞銆乁3 涓?stage銆佺姝?U2 鏃犲ご PDF锛夛紱`OPEN_ISSUES.md` 搂8锛圫OP 宸茬鏀堕」涓嶅緱鍦ㄦ湰 Milestone  reopen锛夈€?

**鍓嶇疆渚濊禆**锛?*Milestone 10鈥?6 鍏ㄩ儴瀹屾垚**锛堝惈 M14 `no-u2-sync-sop-pdf` 鍚堣椤广€丮15 Admin UI銆丮16 Lawyer UI锛夈€?

**鑼冨洿璇存槑**锛歁10鈥揗16 宸插垪 **鍗曟ā鍧?* 鍗曟祴/闆嗘垚娴嬶紱M17 **涓嶉噸澶嶅疄鐜?* 鐩稿悓鏂█锛屼粎鏂板 **缂栨帓绾?* 鐢ㄤ緥銆丳laywright銆佸悎瑙勬墿灞曘€佸熀绾垮洖褰掕剼鏈笌鏂囨。銆?

**楠屾敹闂ㄧ**锛歚npm run test` + `npm run test:compliance` + `npm run test:sop`锛堟湰 Milestone 鏂板锛夌豢锛汸laywright SOP 鐢ㄤ緥鍦ㄥ叿澶?`E2E_*` 鐜鏃剁豢鎴栧悎鐞?`skip`锛沗docs/E2E_MANUAL_CHECKLIST.md` 搂10 宸插～锛涗骇鍝佸０鏄庯細**闈?SOP** `OPEN_ISSUES` 寰呯‘璁ら」涓嶉樆濉?SOP 鍙戝竷锛沗git commit` 鍚?Part B 灏佺増銆?

---

#### M17-A `tools/compliance` 鈥?SOP 鏋舵瀯绾㈢嚎鎵弿锛堟瘡鏉¤鍒欎竴涓祴璇曟枃浠?+ fixture 娴嬶級

- [ ] 鏂板 `tools/compliance/no-u2-sync-sop-deep-research.test.ts`锛氭壂鎻?`apps/api/src`锛堟帓闄?`__tests__`锛夌姝?`await` 璋冪敤 `SopDeepResearch`/`deep_research` 鍚屾瀹屾垚璺緞锛坄architecture.md` 搂3.2.6.4锛?
  - **渚濊禆**锛歁14 宸插疄鐜?U3 Handler锛沗scan-helpers.ts` 宸插瓨鍦?
- [ ] 鏂板 `tools/compliance/fixtures/violation-u2-sync-dr.ts`锛氭晠鎰忚繚瑙勬牱渚嬪瓧绗︿覆锛堜粎琚?fixture 娴嬭瘯寮曠敤锛?
  - **渚濊禆**锛氫笂涓€鏉℃壂鎻忚鍒欏畾涔夊畬鎴?
- [ ] 鏂板 `tools/compliance/no-u2-sync-sop-deep-research.fixture.test.ts`锛氬 fixture 鏂囦欢鎵弿搴?鈮? 鍛戒腑
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 纭 `tools/compliance/no-u2-sync-sop-pdf.test.ts`锛圡14-J锛夊凡鍚堝苟涓?`npm run test:compliance` 鍖呭惈锛涜嫢缂哄け鍒欒ˉ寤?
  - **渚濊禆**锛歁14-J
- [ ] 鏂板 `tools/compliance/no-u2-sync-sop-pdf.smoke.test.ts`锛氭柇瑷€ `no-u2-sync-sop-pdf.test.ts` 鏂囦欢瀛樺湪
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `tools/compliance/no-sop-websocket.test.ts`锛氭壂鎻?`apps/web` 绂佹 `WebSocket`/`socket.io` 鐢ㄤ簬 SOP 杩涘害锛坄prd.md` 搂4.2.4 SOP L3锛?
  - **渚濊禆**锛歁16 杞瀹炵幇
- [ ] 鏂板 `tools/compliance/fixtures/violation-sop-websocket.ts`
  - **渚濊禆**锛氫笂涓€鏉?
- [ ] 鏂板 `tools/compliance/no-sop-websocket.fixture.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?fixture

- [ ] 鏂板 `tools/compliance/no-sop-mermaid-in-web.test.ts`锛氭壂鎻?`apps/web/src/components/sops` 绂佹 `mermaid`/`@mermaid` import锛坄prd.md` 搂3.10 / M15/M16 绾㈢嚎锛?
  - **渚濊禆**锛歁16 缁勪欢鐩綍瀛樺湪
- [ ] 鏂板 `tools/compliance/no-sop-mermaid-in-web.fixture.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `tools/compliance/sop-iframe-sandbox-no-allow-scripts.test.ts`锛氭壂鎻?`apps/web/src/components/sops` 涓?`sandbox=` 涓嶅緱鍚?`allow-scripts`锛坄prd.md` 搂3.8.5锛?
  - **渚濊禆**锛歁16-M iframe 缁勪欢
- [ ] 鏂板 `tools/compliance/sop-iframe-sandbox-no-allow-scripts.fixture.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `tools/compliance/sop-poll-interval-min-2s.test.ts`锛氭壂鎻?`apps/web` 涓?`setInterval`/`poll` 鐩稿叧甯搁噺涓嶅緱 `< 2000`锛坄prd.md` 搂3.8.1銆乣architecture.md` 搂3.2.6.5锛?
  - **渚濊禆**锛歚SOP_PIPELINE_POLL_INTERVAL_MS` 宸插畾涔夛紙M16-C锛?
- [ ] 鏂板 `tools/compliance/sop-poll-interval-min-2s.fixture.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鎵╁睍 `tools/compliance/no-business-supabase-writes.test.ts`锛氬皢 `apps/web/src/components/sops/**` 绾冲叆鎵弿璺緞锛堜笌杞啓/浜戠洏鍚岃鍒欙級
  - **渚濊禆**锛歁16 缁勪欢宸茶惤鍦?
- [ ] 鏂板 `tools/compliance/no-business-supabase-writes.sops-scope.test.ts`锛歁ock 杩濊 `supabase.from('case_pipelines')` 鍦?sops 鐩綍搴旇妫€鍑?
  - **渚濊禆**锛氫笂涓€鏉℃墿灞?

- [ ] 鏂板 `tools/compliance/sop-lawyer-api-no-transcription-upload-init.test.ts`锛氭壂鎻?`apps/web/src/hooks/use-sop-tus-upload.ts` 涓?`lawyer-sops-api.ts` 涓嶅緱 import `transcription-api` 鐨?`initUpload`
  - **渚濊禆**锛歁16-D
- [ ] 鏂板 `tools/compliance/sop-lawyer-api-no-transcription-upload-init.fixture.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M17-B 闆嗘垚娴嬭瘯鍩哄缓锛坄packages/shared` / `apps/api` 杈呭姪锛屽崟鏂囦欢鍗曞鍑猴級

- [ ] 鏂板 `packages/shared/src/testing/sop-integration-env.ts`锛氬鍑?`requireSopIntegrationEnv(): { apiUrl, adminToken, lawyerToken }`锛堣 `SOP_INT_*` / 澶嶇敤鐜版湁 `SUPABASE_*`锛?
  - **渚濊禆**锛歁0 鑱旇皟 env 绾﹀畾
- [ ] 鏂板 `packages/shared/src/testing/sop-integration-env.test.ts`锛氱己 env 鏃?`skip` 璋撹瘝涓?true
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/testing/sop-integration-seed.ts`锛氬鍑?`seedMinimalPublishedSopTemplate(serviceClient)`锛坰ervice_role 鎻掑叆鏈€灏忔ā鏉?鍗曟 `manual` 宸插彂甯冿級
  - **渚濊禆**锛歁10 琛紱M12 鍙戝竷瑙勫垯
- [ ] 鏂板 `packages/shared/src/testing/sop-integration-seed.test.ts`锛歁ock client 鏂█ SQL 琛ㄥ悕
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/__tests__/helpers/sop-integration-http.ts`锛氬鍑?`adminFetch(path, init)` / `lawyerFetch(path, init)`锛圔earer + JSON锛?
  - **渚濊禆**锛歁17-B env
- [ ] 鏂板 `apps/api/src/__tests__/helpers/sop-integration-http.test.ts`锛歁ock `fetch` 娉ㄥ叆 Authorization
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M17-C `apps/api` 鈥?缂栨帓绾ч泦鎴愭祴璇曪紙姣忔潯鍦烘櫙涓€涓枃浠讹紱`skip` 鏃犺仈璋?env锛?

- [ ] 鏂板 `apps/api/src/__tests__/sop-full-path-admin-to-close.integration.test.ts`锛歛dmin 鍙戝竷妯℃澘 鈫?lawyer `POST /pipelines` 鈫?`manual` execute 鈫?finalize 鈫?`POST .../close` 鈫?status=`completed`
  - **渚濊禆**锛歁12鈥揗13锛汳17-B seed
- [ ] 涓?`sop-full-path-admin-to-close.integration.test.ts` 澧炲姞绗簩鐢ㄤ緥锛氭湭 finalize 鐩存帴 close 鈫?422
  - **渚濊禆**锛氫笂涓€鏉℃枃浠跺凡瀛樺湪

- [ ] 鏂板 `apps/api/src/__tests__/sop-sync-llm-execute-finalize.integration.test.ts`锛歚sync_llm` 姝ラ Mock LLM 鈫?`draft` 鈫?PATCH 鈫?finalize 鈫?涓嬫父鍙锛坄prd.md` 搂3.8.2鈥撀?.8.3锛?
  - **渚濊禆**锛歁11 缂栨帓 Mock锛汳13 execute/finalize
- [ ] 鏂板 `apps/api/src/__tests__/sop-sync-llm-execute-finalize.integration.test.ts` 鐢ㄤ緥锛歚depends_on` 鏈弧瓒?鈫?execute 422
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/__tests__/sop-async-deep-research-status.integration.test.ts`锛歛sync 姝ラ execute 鈫?**202** 鈫?杞 status 鐩磋嚦 `draft` 鎴?`failed`锛圡ock U3 鎴?stub Outbox 娑堣垂锛?
  - **渚濊禆**锛歁13 async锛汳14 Handler 鍙?Mock
- [ ] 鏂板 `apps/api/src/__tests__/sop-async-deep-research-status.integration.test.ts` 鐢ㄤ緥锛歚running` 鏃剁浜屾 execute 鈫?422
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/__tests__/sop-html-finalize-pdf-outbox.integration.test.ts`锛歚content_type=html` finalize 鈫?鏂█ Outbox 琛?`stage=sop.pdf_export`锛圖B 鏌ヨ锛?
  - **渚濊禆**锛歁13 finalize锛汳14 payload 鏋勫缓
- [ ] 鏂板 `apps/api/src/__tests__/sop-html-finalize-pdf-outbox.integration.test.ts` 鐢ㄤ緥锛歅DF 澶辫触 artifact 浠?`finalized`锛圡ock U3 澶辫触锛?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/__tests__/sop-artifact-verify-then-finalize.integration.test.ts`锛歚requires_verification=true` 鈫?鏃?verify finalize 422 鈫?`POST .../verify` 鍚?finalize 200
  - **渚濊禆**锛歁13 verify/finalize
- [ ] 鏂板 `apps/api/src/__tests__/sop-artifact-verify-then-finalize.integration.test.ts` 鐢ㄤ緥锛氳嚜鍔?Verified锛圡ock `ai_invocation_logs` success锛夋棤闇€浜哄伐 verify
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/__tests__/sop-regenerate-pdf.integration.test.ts`锛歚finalized` 鈫?`regenerate-pdf` 鈫?鏂?Outbox 琛?
  - **渚濊禆**锛歁13 regenerate
- [ ] 鏂板 `apps/api/src/__tests__/sop-regenerate-pdf.integration.test.ts` 鐢ㄤ緥锛歚draft` regenerate 鈫?422
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/__tests__/sop-suspended-resume-guards.integration.test.ts`锛歚suspended` 绂佹 execute 鈫?`resume` 鍚庡彲 execute
  - **渚濊禆**锛歁13 resume銆愭寕璧峰啓鍏ユ柟寮忥細娴嬭瘯 `beforeAll` 鐢?service_role 鏇存柊 status銆?
- [ ] 鏂板 `apps/api/src/__tests__/sop-suspended-resume-guards.integration.test.ts` 鐢ㄤ緥锛歳esume 鍚庝粛椤绘弧瓒?depends_on
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `apps/api/src/__tests__/baseline-transcription-api-smoke.integration.test.ts`锛歭awyer `GET /api/transcription/tasks` 浠?200锛圡1鈥揗9 鍥炲綊锛?
  - **渚濊禆**锛氳仈璋冨簱瀛樺湪寰嬪笀锛涜浆鍐?seed
- [ ] 鏂板 `apps/api/src/__tests__/baseline-admin-cannot-read-lawyer-tasks.integration.test.ts`锛歛dmin JWT `GET /api/transcription/tasks` 鈫?403锛坄prd.md` 搂2.3锛?
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M17-D `workers/pipeline` 鈥?SOP 涓庤浆鍐欏叡瀛樺洖褰?

- [ ] 鏂板 `workers/pipeline/src/__tests__/sop-transcription-outbox-fifo-order.integration.test.ts`锛氭贩鍚堟彃鍏ヨ浆鍐?Outbox 涓?`sop.media.ocr` 琛?鈫?娑堣垂椤哄簭鎸?`created_at` FIFO锛圡ock Handler 璁板綍椤哄簭锛?
  - **渚濊禆**锛歁14 stage-router锛汳5 Outbox 鍩哄缓
- [ ] 鏂板 `workers/pipeline/src/__tests__/sop-transcription-outbox-fifo-order.integration.test.ts` 鐢ㄤ緥锛歋OP PDF 鍗犵敤 `SOP_PDF_MAX_CONCURRENT=1` 鏃朵笉闃诲杞啓 `asr` 妲戒綅銆怣ock 淇″彿閲忋€?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `workers/pipeline/src/__tests__/sop-deep-research-timeout-marks-failed.integration.test.ts`锛歁ock 瓒呮椂 鈫?artifact `failed`锛坄SOP_DEEP_RESEARCH_TIMEOUT_MS`锛宍architecture.md` 搂3.2.6.9锛?
  - **渚濊禆**锛歁14-F Handler
- [ ] 鏂板 `workers/pipeline/src/__tests__/sop-deep-research-timeout-marks-failed.integration.test.ts` 鐢ㄤ緥锛氳秴鏃跺悗 `ai_invocation_logs` 鏈夎褰?
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M17-E 闈欐€佸璁′笌鏋氫妇鍥炲綊锛堝崟鏂囦欢锛?

- [ ] 鏇存柊 `apps/api/src/__tests__/audit-coverage.static.test.ts`锛氫负 `sop.artifact.verify` 澧炲姞 `ACTION_ALIASES`锛堣嫢 M10 宸插叆鏋氫妇锛?
  - **渚濊禆**锛歁10 audit_action 鎵╁睍锛汳13 verify service
- [ ] 鏂板 `apps/api/src/__tests__/audit-coverage.sop-actions.test.ts`锛氭柇瑷€ `sop.template.publish` 鍦?`services`/`controllers` 婧愮爜涓嚭鐜?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `packages/shared/src/milestones/m10-m17-sop-exports.test.ts`锛氭柇瑷€ `@lexos/shared` 瀵煎嚭 SOP 鐩稿叧 DTO/鏋氫妇锛坄sop-pipeline-create` 绛夛級
  - **渚濊禆**锛歁13-A exports
- [ ] 鏂板 `packages/shared/src/milestones/m10-m17-sop-exports.test.ts` 绗簩鐢ㄤ緥锛氬鍑?`SOP_PIPELINE_POLL_INTERVAL_MS` 鎴栨枃妗ｅ寲鐢?web 甯搁噺鎵挎媴銆愪笌瀹炵幇涓€鑷村嵆鍙€?
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M17-F `e2e/fixtures` 鈥?SOP 涓撶敤锛堝崟鍑芥暟/鍗曟枃浠讹級

- [ ] 鏂板 `e2e/fixtures/sop-env.ts`锛氬鍑?`hasSopE2eEnv()`锛坄E2E_ADMIN_*` + `E2E_LAWYER_*` + API healthy锛?
  - **渚濊禆**锛歚e2e/fixtures/env.ts`
- [ ] 鏂板 `e2e/fixtures/sop-env.test.ts`锛歏itest 杩愯浜?Node锛涚己鍙橀噺鏃?`hasSopE2eEnv` 涓?false
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `e2e/fixtures/sop-tus-mock.ts`锛氬鍑?`mockSopTusRoutes(page)`锛堝鐢ㄨ浆鍐?TUS Mock 妯″紡锛岃矾寰?`**/storage/v1/upload/**`锛?
  - **渚濊禆**锛歚transcription-upload-happy-path.spec.ts` 妯″紡
- [ ] 鏂板 `e2e/fixtures/sop-tus-mock.test.ts`锛歁ock 鍑芥暟杩斿洖 Promise锛坰moke锛?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `e2e/fixtures/sop-api.ts`锛氬鍑?`createPipelineViaApi(request, templateVersionId)`锛圔FF `POST /api/sops/pipelines`锛?
  - **渚濊禆**锛歚loginViaBff`
- [ ] 鏂板 `e2e/fixtures/sop-api.test.ts`锛氱己 token 鏃舵姏閿?
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M17-G Playwright E2E锛堟瘡鏉?spec 涓€涓富鍦烘櫙 + 鍓嶇疆 skip锛?

- [ ] 鏂板 `e2e/admin-sop-publish-template.spec.ts`锛歛dmin 鐧诲綍 鈫?`/admin/sops` 鈫?鏂板缓妯℃澘 鈫?缂栬緫鑽夌 鈫?鍙戝竷鎴愬姛 Toast
  - **渚濊禆**锛歁15 UI锛汳12 API锛沗hasSopE2eEnv()`
- [ ] 鍦?`admin-sop-publish-template.spec.ts` 澧炲姞鏂█锛氬凡鍙戝竷鐗堟湰淇濆瓨鎸夐挳 `disabled`
  - **渚濊禆**锛氫笂涓€鏉?spec 楠ㄦ灦

- [ ] 鏂板 `e2e/lawyer-sop-create-pipeline.spec.ts`锛歭awyer 鈫?`/sops` 鈫?閫夋ā鏉?鈫?鍒涘缓 鈫?璺宠浆 `/sops/pipelines/:id`
  - **渚濊禆**锛歁16 UI锛汳17-F fixtures
- [ ] 鏂板 `e2e/lawyer-sop-create-pipeline.spec.ts` 鐢ㄤ緥锛氬垱寤哄悗鐪嬫澘鍙 `currentStepCode` 楂樹寒
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `e2e/lawyer-sop-media-upload-mock.spec.ts`锛氬嵎瀹?TUS Mock 涓婁紶 鈫?杩涘害鏉″畬鎴愶紙涓嶇瓑寰呯湡瀹?OCR锛?
  - **渚濊禆**锛歁17-F `mockSopTusRoutes`锛汳16-J
- [ ] 鏂板 `e2e/lawyer-sop-media-upload-mock.spec.ts` 鐢ㄤ緥锛氫笂浼犱腑瑙﹀彂璺敱绂诲紑鍑虹幇 `AlertDialog`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `e2e/lawyer-sop-pipeline-close.spec.ts`锛氬畬鎴愭渶灏?manual 姝ラ鍚庢樉寮忋€岀粨妗堛€嶁啋 鐘舵€?`completed`
  - **渚濊禆**锛歁16 close dialog锛涜仈璋冩垨 UI Mock execute
- [ ] 鏂板 `e2e/lawyer-sop-pipeline-close.spec.ts` 鐢ㄤ緥锛氭湭缁撴鍓?close 鎸夐挳鍙敤銆佺粨妗堝悗绂佺敤
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `e2e/admin-cannot-access-lawyer-sops.spec.ts`锛歛dmin 璁块棶 `/sops` 鈫?`/unauthorized` 鎴?403 椤?
  - **渚濊禆**锛歁16-F guard
- [ ] 鏂板 `e2e/lawyer-cannot-access-admin-sops.spec.ts`锛歭awyer 璁块棶 `/admin/sops` 鈫?鎷掔粷
  - **渚濊禆**锛歁15 璺敱

- [ ] 鏂板 `e2e/sop-pipeline-status-poll.spec.ts`锛氱粡 BFF 杞 `GET /api/sops/pipelines/:id/status` 闂撮殧 鈮?s锛坄E2E_SOP_PIPELINE_ID` 鍙€?env锛?
  - **渚濊禆**锛歁17-F锛涙ā寮忓悓 `transcription-pipeline-completed.spec.ts`
- [ ] 鏂板 `e2e/sop-pipeline-status-poll.spec.ts` 鐢ㄤ緥锛氫袱娆¤姹傛椂闂村樊 鈮?000ms
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `e2e/sop-html-editor-sandbox.spec.ts`锛氭墦寮€ html 浜у嚭鐗╅〉 鈫?妫€鏌?iframe `sandbox` 鏃?`allow-scripts`锛汳onaco 杈撳叆鍚庨瑙堟洿鏂帮紙鍙€?`E2E_SOP_HTML_PIPELINE_ID`锛?
  - **渚濊禆**锛歁16-M锛涢暱鑰楁椂 `test.setTimeout`
- [ ] 鏂板 `e2e/sop-html-editor-sandbox.spec.ts` 鐢ㄤ緥锛氶瑙堝尯 Toggle 榛戠櫧妯″紡鍙
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M17-H 鏍硅剼鏈?鈥?SOP 娴嬭瘯鑱氬悎涓庡熀绾垮洖褰?

- [ ] 鍦ㄦ牴 `package.json` 澧炲姞 script `"test:sop"`锛歚vitest run` 鍖归厤 `sop` 鐩稿叧璺緞锛坄apps/api/**/sop*.test.ts`銆乣admin-sop*.test.ts`銆乣workers/pipeline/**/sop*.test.ts`銆乣packages/shared/**/sop*.test.ts`銆乣packages/shared/**/rls/*sop*`锛?
  - **渚濊禆**锛歁17-C/D 娴嬭瘯鏂囦欢宸插垱寤?
- [ ] 鏂板 `scripts/verify-test-sop-script.test.ts`锛氳鍙?`package.json` 鏂█ `test:sop` 瀛樺湪涓旈潪绌?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦ㄦ牴 `package.json` 澧炲姞 script `"test:regression"`锛氶『搴忔墽琛?`npm run test:compliance` && `npm run test:sop` && `npm run test:integration`锛堟枃妗ｅ寲涓嶈姹傚崟娆?vitest 鍏ㄩ噺锛?
  - **渚濊禆**锛歚test:sop` 宸叉坊鍔?
- [ ] 鏂板 `scripts/verify-test-regression-script.test.ts`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏂板 `scripts/run-baseline-regression.mjs`锛欳LI 渚濇 spawn `npm run test`銆乣npm run test:regression`銆乣npm run test:e2e`锛坋2e 澶辫触涓嶉樆濉炴椂鍔?`--continue` 寮€鍏炽€愰粯璁や弗鏍笺€戯級
  - **渚濊禆**锛氫笂鍒?scripts
- [ ] 鏂板 `scripts/run-baseline-regression.test.ts`锛歁ock spawn 鏂█璋冪敤椤哄簭鍚?`test:compliance`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M17-I 杞婚噺鍘嬫祴 鈥?SOP `execute` QPS 鎶芥牱锛圥RD-SOP-46锛?

- [ ] 鏂板 `scripts/sop-execute-qps-sample.mjs`锛氬 `POST .../execute`锛坄sync_llm` 鎴?`manual`锛夊湪 **10s** 鍐呭彂閫?**N鈮?0** 娆¤姹傦紱缁熻瀹為檯 QPS锛?*鏂█宄板€?鈮?10** 鎴栬緭鍑烘姤鍛婁緵浜哄伐绛炬敹
  - **渚濊禆**锛歁13 execute 鍙敤锛沗SOP_QPS_SAMPLE_BASE_URL` env
- [ ] 鏂板 `scripts/sop-execute-qps-sample.test.ts`锛氱函鍑芥暟 `computeQps(count, durationMs)` 鍗曞厓娴?
  - **渚濊禆**锛氫笂涓€鏉¤剼鏈唴鑱斿嚱鏁板彲鎻愬彇鍒?`scripts/lib/compute-qps.ts` 鏃跺崟鐙祴

- [ ] 鏂板 `scripts/lib/compute-qps.ts`锛氬鍑?`computeQps(requestCount, durationMs)`
  - **渚濊禆**锛氭棤
- [ ] 鏂板 `scripts/lib/compute-qps.test.ts`锛?0 娆?/ 1s 鈫?QPS=10
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M17-J 鏂囨。涓庣鏀讹紙鍗曡妭/鍗曡〃涓€椤癸級

- [ ] 鍦?`docs/E2E_MANUAL_CHECKLIST.md` 鏂板 **搂10 SOP 鏁板瓧娴佹按绾?* 琛細鍚?admin 鍙戝竷銆佸緥甯堝缓瀹炰緥銆佸嵎瀹椾笂浼犮€乻ync/async 姝ラ銆丠TML 鍙屾爮銆佹樉寮忕粨妗堛€乺egenerate-pdf銆乤dmin 涓嶅彲璁块棶 `/sops`
  - **渚濊禆**锛歁15鈥揗16 鍔熻兘宸插疄鐜?
- [ ] 鍦?`docs/E2E_MANUAL_CHECKLIST.md` 搂10 澧炲姞琛岋細`iframe` 鏃?`allow-scripts`銆佽疆璇㈤棿闅斾綋鎰?鈮?s
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏇存柊 `docs/E2E_MANUAL_RUN_LOG.md`锛氬鍔?M17 鎵ц璁板綍妯℃澘锛坄test:sop` / Playwright SOP / compliance 缁撴灉鍒楋級
  - **渚濊禆**锛毬?0 宸插啓鍏?
- [ ] 鏂板 `docs/E2E_MANUAL_RUN_LOG.m17-template.test.ts`锛氳鍙?markdown 鍚?`搂10` 涓?`test:sop` 鍏抽敭瀛椼€愭枃妗ｇ粨鏋?smoke銆?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`docs/DEPLOYMENT.md` 楠屾敹绔犺妭澧炲姞 bullet锛歚npm run test:sop`銆乣npm run test:regression`銆丳laywright `e2e/admin-sop-*.spec.ts` / `e2e/lawyer-sop-*.spec.ts`
  - **渚濊禆**锛歁17-H scripts
- [ ] 鏂板 `docs/DEPLOYMENT.sop-regression.test.ts`锛氳鍙?`DEPLOYMENT.md` 鍚?`test:sop`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦?`docs/OPEN_ISSUES.md` 搂5 M9 鍚庡鍔?**搂5.1 M17 SOP 闆嗘垚绛炬敹** 琛細璁板綍 M17 閫氳繃鏃ユ湡锛?*鏄庣‘** 搂1鈥撀? 闈?SOP 寰呯‘璁ら」浠?open銆佷笉闃诲 SOP
  - **渚濊禆**锛歁17 娴嬭瘯鍏ㄧ豢
- [ ] 鏂板 `docs/OPEN_ISSUES.m17-section.test.ts`锛氭柇瑷€ `OPEN_ISSUES.md` 鍚?`M17`
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鏇存柊 `docs/CONTEXT_SUMMARY.md` 搂12 杩涘害锛歁10鈥揗17 鐘舵€佹敼涓恒€屽凡浜や粯銆嶃€愪粎褰撴湰 Milestone 楠屾敹閫氳繃鍚庡嬀閫夈€?
  - **渚濊禆**锛歁17-L **浜哄伐榛戠洅楠屾敹绛炬敹**
- [ ] 鏂板 `docs/CONTEXT_SUMMARY.m17-progress.test.ts`锛氭柇瑷€鏂囦欢鍚?`M17`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M17-K `packages/shared` 鈥?Milestone 17 闂ㄧ CLI

- [ ] 鏂板 `packages/shared/src/milestones/run-m17-gate-cli.ts`锛氶『搴忔鏌?`test:compliance` 閫€鍑虹爜銆佹彁绀鸿繍琛?`test:sop` / `test:e2e`锛堝彲 `--skip-e2e`锛?
  - **渚濊禆**锛歁17-H scripts
- [ ] 鏂板 `packages/shared/src/milestones/run-m17-gate-cli.test.ts`锛歁ock `execSync`锛沗--dry-run` 涓嶆姏閿?
  - **渚濊禆**锛氫笂涓€鏉?

- [ ] 鍦ㄦ牴 `package.json` 澧炲姞 `"verify:m17-gate": "tsx packages/shared/src/milestones/run-m17-gate-cli.ts"`
  - **渚濊禆**锛欳LI 宸插疄鐜?
- [ ] 鏂板 `packages/shared/src/milestones/verify-m17-gate-script.test.ts`锛氭柇瑷€鏍?`package.json` 鍚?`verify:m17-gate`
  - **渚濊禆**锛氫笂涓€鏉?

---

#### M17-L Milestone 17 瀹屾垚闂ㄧ

- [ ] 杩愯 `npm run test:compliance` 鍏ㄧ豢锛堝惈 M17-A 鏂板瑙勫垯 + M14 `no-u2-sync-sop-pdf`锛?
  - **渚濊禆**锛歁17-A 瀹屾垚
- [ ] 杩愯 `npm run test:sop` 鍏ㄧ豢锛坄skip` 鐢ㄤ緥椤绘湁鏄庣‘ env 璇存槑锛?
  - **渚濊禆**锛歁17-C/D
- [ ] 杩愯 `npm run test` 鍏ㄧ豢锛堝惈 M1鈥揗9 + M10鈥揗16 鍏ㄩ噺鍗曟祴锛?
  - **渚濊禆**锛歁10鈥揗16 宸插畬鎴?
- [ ] 杩愯 `npm run test:e2e`锛歋OP spec 鍦ㄥ叿澶?`E2E_*` 鏃堕€氳繃锛涘惁鍒欒褰?`skip` 鍘熷洜浜?`E2E_MANUAL_RUN_LOG.md`
  - **渚濊禆**锛歁17-G
- [ ] 杩愯 `node scripts/sop-execute-qps-sample.mjs`锛堣仈璋?env锛夊苟璁板綍 QPS 鈮?0 鎴栦汉宸ョ鏀朵緥澶?
  - **渚濊禆**锛歁17-I

**浜哄伐榛戠洅楠屾敹**锛堢敱浜у搧/娴嬭瘯璐熻矗浜烘墽琛岋紝浣滀负 **Part B SOP 鏈€缁堥獙鏀?*锛涗笉閫氳繃涓嶅緱灏佺増 commit锛夛細

- [ ] **銆愪汉宸ラ粦鐩掋€?* 鎸?`docs/E2E_MANUAL_CHECKLIST.md` **搂10 SOP 鏁板瓧娴佹按绾?* 鍏ㄨ〃閫愰」鎵ц骞跺～鍐欍€岄€氳繃/澶辫触/璺宠繃銆?
  - **渚濊禆**锛歁15鈥揗16 UI 宸查儴缃诧紱U1/U2/U3 鑱旇皟鏍?
- [ ] **銆愪汉宸ラ粦鐩掋€?* 绔埌绔富璺緞锛堥粦鐩掞級锛欰dmin 鍙戝竷鍚?sync + async + html 鐨勬ā鏉?鈫?Lawyer 寤哄疄渚?鈫?鍗峰畻 鈫?鍚勬 execute/finalize 鈫?HTML 瀹氱 鈫?PDF锛堝彲寮傛绛夊緟锛夆啋 鏄惧紡缁撴
  - **渚濊禆**锛氫笂涓€鏉?
- [ ] **銆愪汉宸ラ粦鐩掋€?* 鍩哄骇鍥炲綊锛堥粦鐩掞級锛歚docs/E2E_MANUAL_CHECKLIST.md` **搂3** 浠婚€変竴棰橈紙灏忔枃浠惰浆鍐欎笂浼狅級纭 M1鈥揗9 鑳藉姏鏈洖閫€
  - **渚濊禆**锛氳浆鍐?Worker 鍙敤
- [ ] **銆愪汉宸ラ粦鐩掋€?* 瑙掕壊闅旂锛堥粦鐩掞級锛歛dmin 涓嶅彲瑙佸緥甯?`/sops` 涓氬姟鏁版嵁锛沴awyer 涓嶅彲瑙?`/admin/sops`锛涘弻寰嬪笀涓嶅彲浜掕瀵规柟 `pipelineId`
  - **渚濊禆**锛歁16/M15 璺敱
- [ ] **銆愪汉宸ラ粦鐩掋€?* 鍦?`docs/OPEN_ISSUES.md` 搂5.1 濉啓 M17 绛炬敹琛岋細澹版槑 **搂1鈥撀? 闈?SOP 寰呯‘璁ら」涓嶉樆濉?* SOP 鍙戝竷
  - **渚濊禆**锛氫笂鍒楅粦鐩掍笌鑷姩鍖栨祴璇曢€氳繃
- [ ] **銆愪汉宸ラ粦鐩掗獙鏀剁鏀躲€?* 鍦?`docs/E2E_MANUAL_RUN_LOG.md` 杩藉姞 **M17 / Part B 灏佺増** 姹囨€伙細楠屾敹浜恒€佹棩鏈熴€佺幆澧冦€伮?0 閫氳繃椤规暟銆佸凡鐭ラ仐鐣?
  - **渚濊禆**锛氫笂鍒楅粦鐩掗」鍧囬€氳繃鎴栧凡鏂囨。鍖栦緥澶?

- [ ] 濉啓 `docs/E2E_MANUAL_CHECKLIST.md` 搂10 鍏ㄩ儴琛岋紙鍏佽鏍囨敞銆岀敱 Playwright 瑕嗙洊銆嶏紱椤讳笌榛戠洅鎵ц缁撴灉涓€鑷达級
  - **渚濊禆**锛歁17-J锛?*銆愪汉宸ラ粦鐩掋€懧?0 宸叉墽琛?*
- [ ] 鎵ц `git commit`锛歚test(sop): integration e2e compliance and m17 regression gate`
  - **渚濊禆**锛氫笂鍒楄嚜鍔ㄥ寲鍛戒护閫氳繃鎴栧凡鏂囨。鍖?skip锛?*浜哄伐榛戠洅楠屾敹绛炬敹**
- [ ] 灏嗕笅鏂硅繘搴﹁〃 **M10鈥揗17** 鐘舵€佹洿鏂颁负銆屽凡瀹屾垚銆?
  - **渚濊禆**锛歚git commit` 鎴愬姛

---

## Part B 渚濊禆鍏崇郴锛堢畝鍥撅級

```
M10 (SOP DB/RLS/Storage)
  鈫?M11 (AI 鍥涘姛鑳界偣)
  鈫?M12 (Admin SOP API)
  鈫?M13 (Lawyer SOP API) 鈹€鈹€鈫?M14 (U3 sop.*)
        鈹?                       鈹?
        鈹斺攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹?
                   鈻?
         M15 (Admin UI) 鈭?M16 (Lawyer UI)   鈫?M14 鍙笌 M13 閮ㄥ垎骞惰锛屼絾 M16 渚濊禆 M14
                   鈻?
                 M17 (闆嗘垚楠屾敹)
```

**骞惰璇存槑**锛歁15 涓?M16 鍙湪 M13 API 绋冲畾鍚庡苟琛岋紱M16 寮傛/PDF 鐩稿叧浜や簰渚濊禆 M14 宸插彲鑱旇皟銆?

---

## 褰撳墠杩涘害锛圥art B锛?

| Milestone | 鍚嶇О | 鐘舵€?|
|-----------|------|------|
| M10 | SOP 鍩虹璁炬柦涓庢暟鎹簱杩佺Щ | **宸插畬鎴?* |
| M11 | AI 鑳藉姏鎵╁睍锛圫OP 鍔熻兘鐐癸級 | **宸插畬鎴?* |
| M12 | 绠＄悊鍛?SOP 妯℃澘涓?Prompt Studio API | 鏈紑濮?|
| M13 | 寰嬪笀绔?SOP 娴佹按绾夸笟鍔?API | 鏈紑濮?|
| M14 | 寮傛 Worker SOP 闃舵澶勭悊鍣?| 鏈紑濮?|
| M15 | 绠＄悊鍛?SOP 閰嶇疆鍓嶇 | 鏈紑濮?|
| M16 | 寰嬪笀绔?SOP 娴佹按绾垮墠绔?| 鏈紑濮?|
| M17 | SOP 闆嗘垚楠屾敹涓庡熀绾垮洖褰?| 鏈紑濮?|

| Milestone | 鍚嶇О | 鐘舵€?|
|-----------|------|------|
| M0鈥揗9 | 鍩哄骇鑳藉姏锛圥art A锛?| **宸插畬鎴?* |

---

## 闄勫綍锛氬巻鍙插師瀛愪换鍔?

M0鈥揗9 鐨勫師瀛愮骇 checkbox 鎷嗚В宸查殢 **tasks.md v1.2** 灏佺増鎻愪氦浜?git 鍘嗗彶銆傝嫢闇€鏌ラ槄閫愰」楠屾敹璁板綍锛岃鎵ц锛?

```bash
git log --oneline -- docs/tasks.md
git show <commit>:docs/tasks.md
```

**绂佹**鍦ㄦ湭鎺堟潈鎯呭喌涓嬪皢 v1.2 鍏ㄦ枃閲嶆柊鍚堝苟鍥炴湰鏂囦欢锛屼互鍏嶄笌 Part B 澶х翰鍐茬獊銆?
