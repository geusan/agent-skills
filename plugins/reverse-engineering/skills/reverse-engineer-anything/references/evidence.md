# Evidence와 세션

canonical Evidence의 `normalized_result`를 읽고 실제 `evidence_id`로 인용한다. CLI JSON과 MCP 구조화 결과를 임의 축약한 텍스트와 혼동하지 않는다. 대상 해시·provider/version·analysis profile·위치·원본 근거·limitations·coverage를 보존한다.

## 요약·보존

- summary의 `parent_evidence_id`는 보관된 전체 원본이며 뷰 Evidence ID와 다르다.
- `inspect_analysis_view`의 retained reference는 결과를 만든 동일 MCP 세션에서 쓴다. 실제 반환 ID만 사용한다.
- 전체 결과가 이미 있으면 부분 뷰를 위해 producer를 반복하지 않는다. 전송 크기 오류나 client preview 잘림은 기존 근거의 요약·페이지 또는 export로 해결한다.
- ID를 잃었으면 지원되는 `get_evidence_bundle` summary와 operation·target digest 등의 필터로 찾는다. 전체 bundle을 무조건 대화에 읽지 않는다.
- ID만으로 다른 세션·CLI 프로세스에서 접근할 수 없다. 닫기·대상 전환 전에 근거를 보존하고 이동 시 검증 가능한 export/import 또는 complete inline Evidence를 쓴다.
- `retention: complete-record`는 레코드 저장의 완전성이다. 분석 coverage의 완전성이 아니다. 모든 페이지를 읽어도 source가 partial이면 부재를 증명하지 못한다.

## 주장 구분

| 유형 | 예 |
|---|---|
| 관찰 | 특정 주소의 명령어; 클릭 후 보인 오류 |
| 도출 | 명시적 비교 규칙으로 계산한 inventory 해시 차이 |
| 추론 | IPC literal의 후보 연결; 요청과 화면 변화의 인과 후보 |
| 미확인 | 간접 호출, 캡처 이전 행동, 서버 내부 구현, 누락된 페이지 |

Computer Use·셸은 실제 도구·시각·기록 경로를 인용한다. REA를 거치지 않은 결과에 REA ID나 authority를 만들어 붙이지 않는다. 자격증명과 명시적 민감값은 제외하되 비민감 URL·경로·해시는 임의 익명화하지 않는다.

## 비교·미확인 사항

`compare_functions`는 명시적 함수 Evidence 비교이며 전체 바이너리의 자동 대응이 아니다. artifact 비교에는 compatible page set과 양쪽 coverage가 필요하다. 정적/런타임 대응은 명시적 매핑으로 하고 시간·이름 유사성만으로 인과를 확정하지 않는다.

추적할 중요한 질문에는 `record_unknown`을 쓴다. `update_unknown`은 최신 revision으로 실행하며 stale이면 다시 읽는다. 질문의 authority·근거 요구를 충족할 때만 해결로 표시한다. `verify_reconstruction` pass는 선언된 유한한 claim·dimension만 검증한다.
