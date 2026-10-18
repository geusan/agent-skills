---
name: material-theme
description: 브랜드 색상으로 Material 기반 라이트·다크 테마를 생성하고 CSS, Tailwind, shadcn/ui, React Native, SwiftUI, Kotlin Compose, Flutter 코드로 적용한다. 테마 생성, 브랜드 컬러 적용, 색 공간 변환, 보색·유사색 탐색에 사용한다. 일반 화면 제작이나 색상과 무관한 UI 수정에는 사용하지 않는다.
---

# Material Theme

사용자가 선택한 브랜드 색상에서 라이트·다크 색상 토큰을 계산하고 대상 프로젝트의 기존 테마 구조에 맞춘다. 생성·색상 탐색 요청은 결과를 반환하고, 적용 요청이면 실제 파일을 수정하고 검증한다.

## 입력과 대상 확인

- 기준 색상은 `#RRGGBB`다. 명시된 색상을 사용하고, 없으면 현재 브랜드 토큰에서 찾는다. 여러 후보를 구분할 수 없으면 색상만 질문한다. 예제의 `#6750A4`를 임의의 브랜드 색상으로 확정하지 않는다.
- 프로젝트 적용 시 지침, 변경 상태, 테마 파일, 프레임워크 버전과 다크 모드 전환 방식을 읽는다. `detect_framework`는 파일 이름 기반 추천이며 모노레포, Tailwind 설정 없는 프로젝트, 네이티브 하위 모듈을 완전히 판별하지 못한다. 실제 대상 앱을 확인하고 사용자가 지정한 형식을 우선한다.
- `harmony_mode`는 기본 `default`, 요청 시 `analogous` 또는 `triadic`이다. 선택적인 `dark_color`는 다크 모드의 전체 색상 scheme을 별도 색상에서 생성한다.

## 실행

플러그인에는 Material theme MCP 서버 설정과 의존성을 포함한 실행 파일이 함께 들어 있다. 호스트에서 플러그인을 설치·활성화하면 MCP를 등록하고 시작한다. Node.js 22+가 PATH에 필요하며 사용자 컴퓨터에서 npm 설치나 빌드는 필요하지 않다. 스킬 디렉터리만 복사하면 플러그인의 MCP 설정은 설치되지 않으므로 MCP가 필요한 환경에서는 전체 플러그인을 설치한다.

현재 세션의 `generate_theme`, `export_theme`, `convert_color`, `detect_framework`를 실제 이름과 스키마로 호출한다. 설치 직후에는 새 세션이나 호스트의 플러그인 재로드가 필요할 수 있다. MCP 연결 실패를 스킬만으로 설치가 끝났다고 보고하지 않는다. Node 버전, 플러그인 활성 상태, 서버 로그와 [설치 안내](references/runtime.md#설치와-mcp-연결)를 확인한다.

MCP가 없는 호스트나 단발 실행에는 포함된 도우미도 사용할 수 있다. `SKILL_ROOT`를 이 파일이 있는 실제 절대경로로 설정하고 stdin에 JSON 요청 하나를 전달한다. 성공하면 JSON 결과를 stdout에, 실패하면 오류를 stderr에 출력하고 0이 아닌 종료 코드를 반환한다. 도우미 역시 추가 설치 없이 실행된다.

```bash
node "$SKILL_ROOT/scripts/run-tool.mjs" <<'JSON'
{"tool":"export_theme","arguments":{"color":"#6750A4","format":"css"}}
JSON
```

| 도구 | 입력 | 반환 |
|---|---|---|
| `generate_theme` | `color`, 선택 `harmony_mode`, `dark_color` | 라이트·다크 schemes와 팔레트 |
| `export_theme` | 위 입력 + `format` | `code`, `file_path_suggestion`, `instructions` |
| `convert_color` | `color` | RGB/HSL/OKLCH/HCT/CMYK 및 보색·유사색·삼각 배색 |
| `detect_framework` | `project_path`: 대상 앱의 절대경로 | 추천 프레임워크, 출력 형식, 파일 경로 |

지원 형식은 `css`, `css-hsl`, `css-oklch`, `tailwind`, `shadcn`, `react-native`, `swift`, `kotlin-compose`, `flutter`, `json`이다. 실행 도우미는 대상 파일을 저장하지 않는다. 출력 형식의 제약, MCP 직접 실행, 원본 갱신 방법은 [런타임 안내](references/runtime.md)를 읽는다.

## 적용과 검증

생성 코드를 적용하기 전에 해당 형식의 [출력 제약](references/runtime.md#출력-적용)을 확인한다. 추천 경로는 실제 프로젝트 구조에 맞게 조정한다. 기존 CSS 전체, Tailwind 설정 전체, theme provider를 출력 문자열로 덮어쓰지 않고 필요한 토큰과 연결 부분을 병합한다. 사용자 변경, 폰트, 간격, 라우팅, 기존 테마 전환을 보존한다.

- 웹: 기존 CSS 변수 형식과 Tailwind/shadcn 버전에 맞춰 토큰을 연결한다. `tailwind` 출력의 CSS와 JS 설정을 각각 올바른 파일에 병합한다.
- 앱: SwiftUI, Compose, Flutter, React Native의 기존 theme/provider와 namespace, import 경로, SDK 버전에 맞춰 색상 정의를 적용한다.
- 지정한 브랜드 색상은 생성 seed다. 생성된 primary가 입력값과 반드시 같지는 않으므로 원본 색상 자체가 필요한 로고·브랜드 토큰은 별도로 유지한다.
- 변경에 맞는 프로젝트 빌드·타입 검사를 실행한다. UI 실행이 가능하면 라이트·다크 상태에서 배경, 텍스트, 버튼, 오류 표시를 확인한다. 실제 명암비를 계산하지 않고 접근성 기준 충족을 단정하지 않는다.

완료 시 기준 색상, 선택한 형식, 생성 또는 변경 파일, 실제 검증 범위를 간결히 보고한다. 코드 생성 성공과 대상 플랫폼 컴파일·시각 검증을 구분한다.
