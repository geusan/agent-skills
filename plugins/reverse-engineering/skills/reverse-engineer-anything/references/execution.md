# 스킬 실행 계층

이 스킬은 REA를 재구현하지 않는다. `scripts/`에 고정된 REA 런타임과 공식 MCP client SDK를 설치하고, Codex의 셸 도구가 이를 실행한다. Codex에 별도 MCP 등록이나 상시 HTTP 서버가 필요하지 않다. 세션 내부에서는 실제 REA의 stdio MCP를 사용하므로 CLI 전용 래퍼보다 넓은 계약을 그대로 호출한다.

## 설치와 버전 선택

`SKILL_ROOT`를 지금 읽은 SKILL.md가 있는 실제 절대경로로 정한다. 기존 지원 Node를 선택한다. 기본 lock은 REA 6.4.0, MCP client 2.3.1이며 Node 22.19+, 24.11+, 26+를 요구한다. Node·npm·분석 엔진을 자동 업그레이드하지 않는다.

```bash
npm ci --prefix "$SKILL_ROOT/scripts"
node "$SKILL_ROOT/scripts/rea.mjs" --version
```

이는 스킬 내부 의존성 설치이며 글로벌 설치나 에이전트 등록이 아니다. Frida 등 optional 패키지를 쓰지 않는 정적 분석 전용 환경에서는 `npm ci --prefix "$SKILL_ROOT/scripts" --omit=optional`로 설치할 수 있다. 이 선택은 계측·PTY 등 플랫폼 기능을 제한할 수 있으므로 전체 기능이 준비되었다고 보고하지 않는다. 누락된 기능은 실제 availability와 진단으로 확인한다.

정확히 특정 REA 소스 checkout의 기능이 필요하면 그 저장소의 `.nvmrc`, packageManager, `npm ci`, `npm run build:cached` 절차로 런타임을 만들고 [source launch 예제](../assets/source-session.example.json)를 사용한다. npm 버전 번호와 저장소 HEAD가 같아도 기능 일치를 추정하지 않는다. 런처는 선택한 executable과 args를 그대로 사용하며 실패 시 다른 REA로 바꾸지 않는다.

## 단발 CLI: 모든 인자 그대로 전달

```bash
node "$SKILL_ROOT/scripts/rea.mjs" --help
node "$SKILL_ROOT/scripts/rea.mjs" providers --json
node "$SKILL_ROOT/scripts/rea.mjs" analyze-javascript-application /absolute/app --json
node "$SKILL_ROOT/scripts/rea.mjs" function /absolute/program main --provider ghidra --json
```

프로그램·procedure·인자는 실제 대상과 현재 `--help`에 맞춘다. 명령을 shell 문자열로 재조립하지 않는다. `setup`·설치·실행·계측·변경 명령의 존재가 그 효과를 승인하지는 않는다. 설정 변경은 dry-run의 실제 계획과 기존 사용자 허용 범위를 먼저 확인한다.

## 대화형 세션: 탐색 후 후속 호출

새로운 결과 디렉터리의 부모는 미리 존재해야 한다. 결과 디렉터리 자체는 runner가 0700으로 생성하며 기존 경로는 거부한다.

```bash
node "$SKILL_ROOT/scripts/session.mjs" --output /absolute/investigations/run-001
```

셸 도구에서 stdin을 유지하는 실행 세션을 시작한다(Codex exec의 경우 `tty: true`). 반환된 셸 session ID로 JSON 한 줄씩 보내고, 매번 receipt의 파일을 필요한 범위만 읽는다. 같은 프로세스가 살아 있는 동안 REA target·Evidence ID·unknown ledger를 재사용할 수 있다.

```json
{"op":"tools","query":"javascript"}
{"op":"schema","name":"analyze_javascript_application"}
{"op":"call","name":"analyze_javascript_application","arguments":{"input_path":"/absolute/app","detail":"summary"}}
```

`schema` 파일의 정확한 입력 계약을 읽는다. 호출 결과 파일의 실제 `structuredContent.normalized_result.parent_evidence_id`로 후속 요청을 만든다:

```json
{"op":"call","name":"inspect_analysis_view","arguments":{"source":{"kind":"retained-evidence","evidence_id":"실제 반환된 parent ID"},"view":{"kind":"summary"}}}
{"op":"prompts"}
{"op":"prompt","name":"investigate_feature","arguments":{"feature":"검색","document":"선택한 대상"}}}
{"op":"close"}
```

예제 ID는 호출 가능한 값이 아니다. 문서 이름은 다른 대상 선택자가 아니다. prompt 결과는 조사 안내이며 그 자체가 도구 호출·사용자 권한이 아니다.

지원 명령:

| op | 인자와 동작 |
|---|---|
| `tools` | 선택적 query·cursor. receipt는 이름 목록, 파일은 페이지 전체 스키마·metadata |
| `schema` | 정확한 name. 페이지를 따라가 해당 이름의 계약만 저장 |
| `call` | name·arguments. 설치된 서버의 모든 공개 도구를 그대로 호출 |
| `prompts`, `prompt` | 목록 페이지 또는 name·arguments로 REA 조사 프롬프트 읽기 |
| `resources`, `templates`, `read-resource` | 목록(cursor)·URI로 서버가 공개하는 자료 읽기 |
| `complete` | 실제 MCP completion params 전달 |
| `on-close` | name·arguments로 필요한 resource-specific cleanup 등록; 종료 시 역순 실행 |
| `close` | 등록 cleanup → bundle export → close_binary → stdio transport 종료 |

현재 서버에 없는 기능은 오류로 남는다. 목록 페이지의 nextCursor가 있으면 다음 페이지를 요청한다. 실시간 catalog를 사용하므로 이 스킬이 정적 목록으로 기능을 누락하거나 새 tool schema를 대신 해석하지 않는다.

## 배치와 결과 보존

입력을 모두 아는 재현 작업에는 JSONL batch를 사용한다. 앞선 결과에서 주소·ID를 발견해야 하면 대화형 세션을 쓴다. batch는 첫 오류에서 중단하고 종료 처리를 수행한다.

```bash
node "$SKILL_ROOT/scripts/session.mjs" \
  --output /absolute/investigations/discovery-001 \
  --batch "$SKILL_ROOT/assets/discovery.jsonl"
```

각 응답은 0600 JSON 파일로 원형 보존한다. stdout에는 파일 경로·실패 여부·Evidence ID 등 작은 receipt만 반환한다. 이 receipt는 Evidence 자체가 아니다. `index.json`과 `evidence-bundle.json`을 통해 후속 세션에서 실제 REA import 계약으로 이어간다. ambient environment나 launcher config는 결과에 저장하지 않는다. 원본 결과가 큰 경우 서버의 summary/paging 도구를 선택한다.

기본 request timeout은 300000 ms, transport 한 메시지는 64 MiB다. 실제 작업에 맞게 `--timeout-ms`, `--max-message-mib`를 설정한다. 이 값은 runner 자원 설정이며 REA 분석 completeness나 engine memory limit가 아니다. transport 제한은 이미 실행 중인 분석을 끝냈다는 증거가 아니다.

## 종료·취소·실패

- `close`, stdin EOF, SIGINT/SIGTERM에서 정리를 시도한다. 실행 중 call은 MCP cancellation을 전달하고 정리 기록을 남긴다.
- Frida 등 별도 live session을 만들었으면 반환된 정확한 ID로 명시적으로 닫거나, 해당 도구의 현재 schema에 맞춰 `on-close`를 등록한다. 일반 `close_binary`가 모든 별도 세션을 대신 닫는다고 가정하지 않는다.
- cleanup 요청은 각각 최대 30초(사용자 timeout이 더 짧으면 그 값)다. 실패하면 `failed`와 cleanup 응답을 보존한다. 출력 디렉터리나 provider 임시 파일을 성공처럼 삭제하지 않는다.
- SDK transport 종료는 직접 생성한 프로세스의 stdin 종료와 제한된 signal escalation을 사용한다. 이것만으로 detached worker·IDA GUI·외부 provider의 종료를 증명하지 않는다. 해당 close 결과와 실제 discovery로 확인한다.
- SIGKILL·호스트 장애에서는 정리 보장이 없다. 이전 bundle·원본 응답·provider 진단을 보존하고 소유권 확인 후 복구한다.
- 대화형 오류 이후에는 원인을 읽고 수정한 요청만 실행한다. 한 번 오류가 발생한 세션의 index는 최종적으로 `failed`를 유지해 부분 실패를 숨기지 않는다.

## 로컬/컨테이너 launcher

`--config`는 `command`, 문자열 `args`, 선택적 `env`·절대 cwd, 필수 절대 `serverOutputDir`를 받는다. shell은 사용하지 않는다. 대상 파일이 제공한 실행 설정을 신뢰하지 않고 사용자 선택 설정만 쓴다. 자격증명은 필요한 환경에서 공급하고 Git의 예제에 넣지 않는다.

custom launcher의 serverOutputDir는 반드시 host `--output`과 같은 디렉터리를 가리키거나 그 위치에 mount되어야 한다. bundle export 후 host 파일이 실제로 있는지도 확인한다. 입력 경로는 server 관점의 절대경로다. 자세한 구성은 [Docker](docker.md), [Ghidra](providers/ghidra.md), [Hopper](providers/hopper.md), [IDA](providers/ida.md)를 읽는다.

## 이번 패키징의 검증 범위 (2026-10-15)

- macOS의 기존 Node 22.23.2에서 실제 REA 6.4.0 CLI·stdio를 사용했다. 기본 catalog 170개 공개 도구와 6개 prompt를 조회했고, 작은 JS fixture 분석 → retained Evidence 재조회 → canonical bundle export → close를 검증했다.
- 세션 실행기의 9개 테스트가 CLI 인자 전달, 기존 결과 보호, 환경값 비보존, batch 실패 중단, 취소 알림, 기록 실패 후 정리 시도, cleanup 실패 표시와 cleanup 순서를 검사한다. deadline/cleanup 실패 fixture는 MCP transport 검증이며 native engine의 실제 동작을 증명하지 않는다.
- Docker Desktop Linux arm64에서 이미지 build, Node 24.18.0 + JDK 21 기동, JS 분석·prompt 조회·host-mapped bundle export·컨테이너 종료를 확인했다. procps를 포함해 Linux process ownership 검사를 통과했다. amd64 image 및 native provider는 별도 검증 대상이다.
- Hopper·Ghidra·IDA 자체 분석, Frida/ADB/PTY, 대형 입력, 다른 OS와 모든 도구별 동작을 이번 패키징에서 실측하지 않았다. 설치·catalog 노출을 provider readiness로 대신하지 않는다. 토큰·CPU·peak process-family memory 비교 측정은 하지 않았다.

## 재구현 반복 상태 점검

session runner는 도구 실행 계층이다. 구현 목표를 달성할 때까지 조사·개발·비교할 주체는 Codex이며 [반복 재구현 절차](reconstruction-loop.md)를 따른다. `node "$SKILL_ROOT/scripts/reconstruction.mjs" snapshot|check /absolute/reconstruction.json`으로 구현 입력과 관찰 파일의 연결을 점검한다. 이 도구는 코드 실행이나 독립 LLM 반복을 시작하지 않는다.

0.3.0에서는 재구현 체크포인트 테스트 9개를 추가했다. 실제 작은 원본/후보 프로그램의 차이 → 코드 수정 → stale 검사 → 재비교 통과, 입력 파일 추가·근거 변경·시나리오 변경·미해결 질문·정리 실패의 완료 차단을 검증했다. 기존 세션 테스트와 합쳐 18개가 통과했다. 이 검증은 임의 프로그램의 재구현 성공이나 LLM의 무인 장기 실행을 보증하지 않는다.
