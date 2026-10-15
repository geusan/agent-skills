# 출처와 갱신

REA 조사 지침을 한국어로 축약·재구성한 개인 스킬이다. REA 실행 코드는 scripts/package-lock.json에 고정한 npm dependency로 공급하며, 소스 checkout launcher도 선택할 수 있다. 분석 엔진 실행 파일·license는 포함하지 않는다. 실제 웹서비스를 Computer Use로 조작하는 절차와 보고서 템플릿은 이 플러그인에서 추가했다. REA 수동 관찰의 실행 권한을 확대하지 않는다.

- 원본: [morluto/rea](https://github.com/morluto/rea)
- 기준 커밋: `3f80b75708f88e51c64eb0122c178b96789c53b3`
- 확인일: 2026-10-14
- 기준 checkout의 package version: `6.4.0`; 원본 skill metadata version: `41`
- 위 버전은 출처 정보이며, 실제 설치된 npm 배포나 host provider의 지원을 보증하지 않는다.

## 사용한 원본

- [SKILL.md와 references](https://github.com/morluto/rea/tree/3f80b75708f88e51c64eb0122c178b96789c53b3/.agents/skills/reverse-engineer-anything): 대상 선택, native·JS·Android·runtime 경로, 연결 복구, Evidence·세션 처리.
- [promptContracts.ts](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/src/contracts/promptContracts.ts): 여섯 조사 워크플로의 목적과 근거 요건.
- [MCP prompts](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/mcp-prompts.md): 프롬프트와 도구의 역할 구분.
- [Installation](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/installation.md): 버전 일치, Codex setup·진단·스킬 선택.

원본의 모든 형식·provider 옵션을 복제하지 않았다. 자주 쓰는 대상 경로를 보존하고 세부 옵션은 실제 서버 스키마와 해당 REA 가이드를 확인하도록 했다. upstream의 병렬 worker 권고는 이 스킬에서 요구하지 않는다.

REA에서 가져온 내용의 저작권은 Copyright (c) 2026 morluto이며 MIT 조건을 따른다. 전체 고지는 스킬과 함께 배포되는 [LICENSE.rea](../LICENSE.rea)에 있다.

## 갱신할 때

1. 새 REA 기준 커밋과 실제 사용할 배포 버전을 확인한다.
2. 원본 skill·references·prompt contracts의 변경을 비교한다. 도구 이름뿐 아니라 대상 식별·부작용·coverage·세션 수명 변경을 확인한다.
3. 이 스킬에서 쓰는 호출 후보를 해당 버전의 schema/CLI help와 대조한다. 지원하지 않는 기능을 설치된 기능처럼 안내하지 않는다.
4. 필요한 지침만 갱신하고 웹 Computer Use와 REA passive observation 구분을 유지한다.
5. 플러그인 양쪽 manifest의 버전을 함께 올리고, 스킬 형식·참조 링크·marketplace를 검증한다. 실제 CLI/MCP·브라우저 시험과 문서 검증 범위를 별도로 보고한다.

실제 조사 중 설정 문제 없이 동작하면 출처 확인을 위해 모든 upstream 문서를 다시 읽을 필요는 없다.
