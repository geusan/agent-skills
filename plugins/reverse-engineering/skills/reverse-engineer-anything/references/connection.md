# 연결과 복구

도구 부재나 호출 실패가 확인됐을 때만 읽는다. 스킬 설치는 MCP 등록·분석 엔진 설치와 별개다. 연결된 REA 또는 기존 CLI 중 가능한 경로를 사용한다.

| 관찰 | 다음 조치 |
|---|---|
| 활성 세션에 REA 도구 없음 | 기존 CLI 확인; MCP가 필요하면 등록 상태 확인 |
| 설정은 맞지만 도구 없음 | 재연결/새 세션과 시작 로그 확인 |
| `provider_unavailable` | 해당 작업의 진단·필수 엔진만 확인 |
| 셸에서 `rea`/Node를 못 찾음 | 실제 PATH·기존 설치 확인; MCP 오류와 구분 |
| 클라이언트 승인 거부 | 거부된 작업 보고; setup 반복·정책 수정·도구 우회 금지 |
| Computer Use 없음 | 호스트 브라우저 도구 확인; 스킬만으로 추가되지 않음 |

현재 CLI 도움말을 확인한 뒤 필요한 진단만 실행한다. Codex 등록 문제의 예:

```bash
rea doctor --client codex --json
rea setup --client codex --dry-run --json
```

변경이 필요하면 계획의 대상 파일·백업·등록·스킬 교체를 제시한다. 기존 승인 밖의 쓰기는 구체적 계획에 대한 승인 후 적용한다. 이 플러그인과 setup이 설치하는 동명 스킬의 중복을 확인한다. MCP만 설정할 경우 현재 CLI가 지원하는 `--skill=false`로 플러그인 스킬을 유지할 수 있다:

```bash
rea setup --client codex --skill=false --dry-run --json
# 위와 동일한 범위가 승인된 경우에만 적용
rea setup --client codex --skill=false --yes --json
```

Hopper 설치는 별도 요청/승인 범위에서 수행한다. Ghidra·IDA·JDK·JADX·Node·npm·Homebrew를 자동 설치·업그레이드하지 않는다. REA 획득이 허용되고 CLI가 없다면 `npx -y rea-agents@<선택한 버전>`을 사용할 수 있다. 지속 MCP 등록은 선택한 버전으로 고정한다. 저장소 main과 출시 패키지의 기능을 동일시하지 않는다.

## CLI로 계속하기

MCP 부재일 때 허용된 CLI로 같은 조사를 진행할 수 있다. 명시적 거부를 회피하는 대체 경로로 쓰지 않는다. JS 정적 분석은 native 엔진이 필요 없다:

```bash
rea analyze-javascript-application /absolute/path/to/app --json > app-evidence.json
```

실제 대상과 승인된 새 출력 경로로 바꾸며 기존 파일을 덮어쓰지 않는다. 큰 JSON은 전부 대화에 읽지 말고 현재 `inspect-analysis-view --help`에 맞는 inline Evidence 입력으로 필요한 뷰를 만든다. CLI 호출 간 retained ID가 유지된다고 가정하지 않는다.

복구 후 실제 도구 호출을 확인하고 원래 조사를 이어간다. doctor 성공은 활성 MCP 연결이나 실제 provider 분석 성공을 보증하지 않는다.
