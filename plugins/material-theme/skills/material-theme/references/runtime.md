# 런타임과 출력 형식

## 실행 계약

이 플러그인은 `material-theme-mcp` 1.0.0의 TypeScript 소스 16개, 도우미용 API 진입점, npm lockfile과 미리 빌드한 MCP 서버를 포함한다. 원본 로컬 프로젝트에서 2026-10-18에 가져온 snapshot이며 별도 npm 배포나 원본 checkout이 필요하지 않다. 원본 생성 엔진과 MCP 서버 소스는 그대로 유지한다. `scripts/run-tool.mjs`는 같은 Zod 스키마와 함수를 호출하는 단발 실행 도우미다.

사용자 컴퓨터에는 Node.js 22+가 PATH에 있으면 된다. `scripts/bundle/server.cjs`와 `tools.cjs`에 런타임 의존성이 포함되어 npm, node_modules, TypeScript 빌드, API 키가 필요하지 않다. 생성·변환은 로컬에서 실행되고 프레임워크 판별은 지정한 프로젝트의 설정 파일을 읽는다. 설치할 플러그인을 가져오는 데에는 저장소 접근이 필요하지만 실행 중 추가 패키지를 다운로드하지 않는다.

```bash
node "$SKILL_ROOT/scripts/run-tool.mjs" <<'JSON'
{"tool":"detect_framework","arguments":{"project_path":"/absolute/path/to/app"}}
JSON
```

`generate_theme`와 `export_theme`의 `harmony_mode` 기본값은 `default`다. `analogous`는 보조색 hue에 +30°/+60°, `triadic`은 +120°/+240°를 적용한다. `convert_color`의 유사색은 기준색 양쪽 ±30°이므로 테마의 보조색과 같다고 가정하지 않는다.

도우미는 JSON 객체 하나만 받는다. 필드는 `tool`과 `arguments`이며 도구별 arguments 검증은 원본 스키마를 따른다. 출력은 원본 함수의 JSON 결과이고 파일 생성·덮어쓰기는 수행하지 않는다. 셸 리다이렉션으로 대상 파일을 쓰기 전에 경로와 기존 내용을 확인한다.

## 출력 적용

현재 exporter는 대상 프로젝트 버전을 입력받지 않는다. 아래 특성을 확인해 기존 앱에 맞게 병합한다.

| 형식 | 적용 시 확인할 점 |
|---|---|
| `css` | HEX 변수다. `var(--primary)`로 사용한다. `.dark` selector는 기존 다크 모드 방식에 맞춘다. |
| `css-hsl` | 함수 없는 HSL 채널 값이다. `hsl(var(--primary))`처럼 감싸 사용한다. |
| `css-oklch` | 함수 없는 OKLCH 채널 값이다. `oklch(var(--primary))`처럼 감싸 사용한다. |
| `tailwind` | HEX CSS 변수와 `theme.extend.colors` JS 설정이 한 문자열에 들어 있다. 두 파일로 나눠 병합한다. CSS-first 설정에서는 기존 프로젝트의 `@theme` 매핑 방식을 따른다. |
| `shadcn` | HSL 채널, `@tailwind` 지시문, `@layer base`를 사용하는 출력이다. 최신 앱이라고 무조건 교체하지 않고 현재 토큰 형식·초기화 방식을 확인한다. `--destructive`는 원본에서 inverse surface로 매핑되므로 오류 표시에는 `generate_theme`의 해당 모드 `error.color`/`error.onColor`를 앱의 색상 형식으로 변환해 연결한다. |
| 네이티브·React Native | 생성된 파일 이름, namespace, import, 테마 연결을 실제 앱에 맞춘다. 출력 성공만으로 플랫폼 SDK 컴파일을 보장하지 않는다. |
| `json` | 사용자 정의 변환과 기존 디자인 시스템에 연결할 원시 데이터다. |

`detect_framework`는 설정 파일의 존재와 일부 문자열·의존성으로 추정한다. `pubspec.yaml`만으로 Flutter, `Podfile`만으로 SwiftUI라고 추정할 수 있고 Tailwind 설정 없는 앱이나 Gradle 하위 모듈을 놓칠 수 있다. 실제 코드와 manifest를 우선한다. 존재하지 않는 경로를 판별 대상으로 쓰지 않는다.

## 설치와 MCP 연결

`material-theme` 플러그인 전체를 설치하면 호스트가 포함된 MCP 설정을 읽는다. 다른 컴퓨터의 경로나 기존 `~/.claude.json`을 복사하지 않는다. 호스트가 현재 플러그인 설치 위치를 기준으로 실행 경로를 해석한다.

- Codex: `.codex-plugin/plugin.json`의 `mcpServers`가 `.codex-plugin/mcp.json`을 가리킨다. `cwd: "."`가 플러그인 설치 경로로 해석되며 실행 인자는 그 기준의 상대경로다. 일부 CLI에서 `${PLUGIN_ROOT}`를 인자 안에 그대로 전달하는 문제를 피한다.
- Claude Code: 플러그인 루트의 `.mcp.json`을 자동 탐색하며 `${CLAUDE_PLUGIN_ROOT}`로 같은 실행 파일을 찾는다.

변경 사항이 GitHub에 반영된 뒤 다른 컴퓨터에서 다음 명령을 사용한다. 마켓플레이스가 이미 등록되어 있다면 해당 호스트에서 업데이트한 뒤 플러그인을 설치한다.

```bash
codex plugin marketplace add geusan/agent-skills
codex plugin add material-theme@personal
```

```bash
claude plugin marketplace add geusan/agent-skills
claude plugin install material-theme@geusan-flutter
```

새 세션에서 Material theme MCP의 도구 네 개가 보이는지 확인한다. 원격 반영 전 로컬 개발에서는 마켓플레이스 소스에 저장소 절대경로를 지정한다. Claude Code는 `claude --plugin-dir /absolute/path/to/agent-skills/plugins/material-theme`로도 실행할 수 있다. 호스트가 요구하는 플러그인 신뢰·활성화 절차는 그대로 따른다.

스킬 폴더만 설치하는 방식은 MCP 등록을 포함하지 않는다. 플러그인을 지원하지 않는 다른 MCP 클라이언트에는 다음 stdio 설정을 수동 등록할 수 있다.

```json
{
  "command": "node",
  "args": ["/absolute/path/to/installed/skill/scripts/mcp.mjs"]
}
```

서버 stdout은 MCP 프로토콜 전용이며 실행 시 설치·빌드를 수행하지 않는다. 서버는 호스트의 MCP 세션 수명에 따라 시작·종료한다. Node가 없거나 버전이 낮으면 Node를 준비하고 호스트를 다시 시작한다. bundle이 누락되었으면 전체 플러그인을 다시 설치한다.

설정 근거: [OpenAI의 로컬 MCP 실행 형식](https://developers.openai.com/plugins/deploy/desktop-only#configure-a-local-mcp-server), [Claude Code의 플러그인 MCP 및 경로 변수](https://code.claude.com/docs/en/plugins-reference).

## 검증과 원본 갱신

아래 명령은 플러그인을 개발·갱신할 때만 필요하다.

```bash
npm ci --include=dev --prefix "$SKILL_ROOT/scripts"
npm run build --prefix "$SKILL_ROOT/scripts"
npm test --prefix "$SKILL_ROOT/scripts"
```

`npm run build`는 TypeScript 컴파일과 두 개의 독립 실행 bundle 생성, 제삼자 라이선스 고지 수집, 입력·산출물 해시 기록을 수행한다. `npm test`는 배포 bundle이 현재 소스·lockfile과 일치하는지도 검사한다. `scripts/bundle/`은 배포에 필요한 파일이므로 Git에 포함하고 node_modules와 dist는 제외한다.

테스트는 임시 디렉터리에 플러그인을 복사하고 node_modules, dist, npm 없는 조건에서 양쪽 MCP 설정을 실행한다. 실제 stdio 연결로 도구 네 개와 열 가지 export 형식을 호출한다. 생성된 Swift/Kotlin/Dart/React 앱의 컴파일과 다른 운영체제에서의 실행은 별도 검증 범위다.

원본 프로젝트를 갱신할 때 `src/`, `tsconfig.json`, 의존성 및 lockfile을 함께 비교해 반영한다. 플러그인의 API 진입점, 실행·빌드 도우미, 테스트와 패키지 설정을 보존하고 bundle을 다시 생성해 소스와 함께 커밋한다. snapshot이므로 원본 프로젝트 변경이 자동 동기화되지는 않는다.
