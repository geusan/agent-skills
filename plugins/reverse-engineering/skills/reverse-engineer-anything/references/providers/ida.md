# IDA 실행 경로

REA의 IDA adapter는 기존 IDA MCP에 연결한다. Codex 쪽에 MCP 등록이 없어도 스킬 session runner가 이를 사용할 수 있지만, 내부 IDA bridge까지 없어지는 것은 아니다. IDA·decompiler·license와 upstream bridge는 별도 공급한다.

## 호환성부터 확인

기준 REA는 attached legacy GUI 1.4.0 또는 headless supervisor(idb_open/idb_list/idb_close 및 database 인자) 계약을 검사한다. upstream main 2.0.0은 이 계약과 다르다. 무조건 최신 브리지를 설치하지 않는다.

기준 원본의 headless 검증 commit은 `c133c3853faa111a9b00ee615c013b720d0c4acd`다. 실제 도구 schema를 확인하며, 다른 commit·IDA 버전의 호환성은 별도로 검증한다. Windows x64와 macOS arm64의 기록이 Linux에서의 실제 성공을 증명하지 않는다.

## Headless

기존 설치에서 작동하는 idalib-mcp 경로로 JSON registration을 만든다. 자격증명은 넣지 않는다.

```json
{
  "command": "/absolute/venv/bin/idalib-mcp",
  "args": ["--stdio", "--max-workers", "1"],
  "mode": "headless",
  "env": {"IDADIR": "/absolute/ida"}
}
```

```bash
export REA_IDA_MCP_CONFIG=/absolute/ida-mcp.json
export REA_ANALYSIS_PROVIDER=ida
node "$SKILL_ROOT/scripts/rea.mjs" providers --json
node "$SKILL_ROOT/scripts/rea.mjs" function /absolute/program main --provider ida --json
```

REA와 supervisor는 같은 filesystem과 native path syntax를 보아야 한다. Docker에서는 같은 컨테이너에 두거나 private workspace까지 정확히 공유해야 한다. local Streamable HTTP supervisor도 설정할 수 있지만 real HTTP provider 검증은 별도다. registration의 timeoutMs 및 runner deadline을 초기 auto-analysis에 맞춘다.

REA는 원본 복사본을 private workspace에 만들고 owned database worker를 연다. 요청에 실제 database ID를 붙여 target/path를 확인한다. 1 REA session은 1 database를 소유한다. close는 save:false로 release하고 discovery에서 사라졌는지 확인한다. 불명확하면 workspace를 남긴다. 엔진 전체 메모리 상한은 REA가 제공하지 않는다.

## Attached GUI

원하는 원본 바이너리를 IDA GUI에서 열고 upstream plugin의 분석 완료를 기다린다. 기존 proxy registration의 정확한 command/args를 사용한다. 예:

```json
{
  "command": "/absolute/python",
  "args": ["/absolute/ida_pro_mcp/server.py", "--ida-rpc", "http://127.0.0.1:13337"]
}
```

REA에는 `.idb`/`.i64` 대신 원본 입력 바이너리를 전달한다. digest로 GUI target과 일치를 검증한다. legacy GUI의 내부 /mcp RPC endpoint를 Streamable HTTP endpoint로 오인하지 않는다. 분석은 읽기 전용이며 연결된 GUI DB를 저장하거나 닫지 않는다. 일부 assembly/pseudocode 조회는 active view를 이동시킬 수 있다.

## IDA Free/native bridge

별도 ida-free-mcp native plugin의 attached 경로는 IDAPython/idalib 경로와 다르다. 다음 registration의 실제 endpoint를 사용한다:

```json
{
  "mode": "attached",
  "protocol": "native",
  "url": "http://127.0.0.1:13337/mcp"
}
```

 기준 문서의 protocol 설정을 사용하고 headless와 혼합하지 않는다. 1.1.2의 all-interface listener와 view-navigation 제한이 있으므로 실제 bind·수정 release를 확인한다. REA의 loopback URL 검사가 외부 plugin의 listen 주소를 바꾸지는 않는다. 원본 native profile·검증 범위는 아래 문서에서 확인한다.

## 분석·복구

- open_binary(provider_id=ida) 후 schema와 binary_session의 operation availability를 따른다. binary_overview를 가정하지 않는다.
- search_procedures/strings → analyze_function 또는 focused pseudocode/assembly → xrefs/callees로 조사한다. 미지원 callers·metadata는 unknown으로 유지한다.
- missing tool은 bridge 계약 불일치다. provider timeout은 auto-analysis/health/timeout을 확인한다. 다른 engine으로 조용히 바꾸지 않는다.
- headless close 실패, 취소·timeout 중 worker 상태가 불명확하면 upstream inventory와 private workspace 진단을 보존한다. proxy를 종료했다고 worker release 완료로 표시하지 않는다.
- live GUI 결과를 옛 snapshot에서 현재 상태처럼 replay하지 않는다. 변경 권한·원본 보존·GUI 수명은 선택한 profile을 따른다.

출처: [REA IDA provider 전체 계약·검증 범위](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/ida-provider.md).
