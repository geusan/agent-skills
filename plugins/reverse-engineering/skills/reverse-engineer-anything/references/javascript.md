# JavaScript·Electron

ASAR 또는 추출 디렉터리를 `analyze_javascript_application`에 직접 전달한다. `open_binary`나 native 엔진은 선행 조건이 아니다. 완전한 소스 저장소의 일반 설명에는 정상 코드 탐색 도구를 사용한다.

## 범위와 읽기

- 큰 대상은 지원되는 `detail: "summary"`로 시작한다. `normalized_result.parent_evidence_id`는 전체 분석 ID이며 요약 뷰의 ID와 다르다.
- 파일을 이미 알면 지원되는 `source_paths`로 실제 inventory 경로를 선택한다. 필요한 manifest·source map도 명시한다. 선택 밖의 관계는 미확인이다.
- `detail`은 전달 형태, `source_paths`는 분석 범위를 바꾼다.
- `inspect_analysis_view`로 modules 페이지를 읽고 반환된 정확한 `node_id`로 item을 고른다. 같은 경로가 asset·bundled/source module 등 여러 역할을 가질 수 있다.
- 중단·메모리 한계로 부분 결과가 남으면 먼저 읽는다. 부분 coverage를 문법 오류나 전체 실패로 바꾸거나 조건 변화 없이 재실행하지 않는다.

현재 스키마가 지원할 때의 페이지 입력 형태(설명용 ID는 실제 반환값으로 교체):

```json
{
  "source": {"kind": "retained-evidence", "evidence_id": "실제 전체 분석 ID"},
  "view": {"kind": "page", "collection": "modules", "offset": 0, "limit": 16}
}
```

item은 `kind: "item"`, `collection: "modules"`, `selector: {"node_id": "실제 node ID"}`를 현재 스키마와 대조한다. 다음 페이지는 반환 continuation을 따른다. item에 없는 사실이 전체 앱에도 없다는 뜻은 아니다.

## 기능과 버전

모듈 기록으로 답할 수 있으면 거기서 멈춘다. 관계가 필요하면 `trace_application_feature`에 정확한 route·문자열·API·IPC channel·module·node seed를 준다. incoming/outgoing을 질문에 맞춰 선택한다. 양방향 containment 추적은 무관한 모듈까지 커질 수 있다.

Electron은 renderer → preload/contextBridge → IPC → main/native 경계를 확인한다. 고유하고 정확한 literal channel 일치만 정적 pairing 근거로 삼는다. 동적 channel·모호한 연결은 미확인이다. `.node` 요청은 실제 로드나 export 확인이 아니다.

각 버전을 한 번 분석하고 `compare_application_versions`에 호환 Evidence를 준다. minified 이름·module ordinal을 영속 ID로 쓰지 않는다. 반대쪽 coverage가 부분이면 added/removed를 확정하지 않는다.

실행 여부가 질문이면 [웹 사용](website-use.md) 또는 [런타임](runtime.md)을 추가하고 `reconcile_javascript_runtime`으로 연결한다. bundle 로드는 모든 내부 모듈의 실행 증명이 아니다. 소스 복구가 필요하면 현재 `recover_javascript_sources`와 선행 도구를 확인하고, 복구 코드를 임의 실행하지 않으며 원본·파생 파일의 정체성을 각각 남긴다.
