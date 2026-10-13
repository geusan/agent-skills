# 질문별 조사 워크플로

REA의 여섯 MCP 프롬프트를 직접 수행할 수 있도록 정리했다. 필요한 근거에 맞춰 순서를 조정한다. 프롬프트 조회는 도구 실행이나 권한 추가가 아니다. 설치된 tool schema를 우선한다.

## 기능 추적 — investigate_feature

1. 입력·시작점·출력을 정한다. 웹이면 [웹 사용](website-use.md)으로 실제 동작을 확인한다.
2. JS/Electron은 application 분석, native는 대상 열기 후 알려진 함수나 문자열에서 시작한다.
3. 기존 module/function Evidence를 읽고 필요한 참조만 추적한다. document 이름은 다른 파일 선택자가 아니며 target 전환은 명시적으로 한다.
4. 입력 → 변환·상태 → 결과를 근거로 설명한다. 간접 호출·동적 channel·누락 경로는 미확인이다.

## 버전 비교 — compare_application_versions

1. baseline/candidate의 파일·버전·해시를 기록하고 전환 전에 근거를 보존한다.
2. 패키지는 각 대상을 열고 `inspect_artifact`, JS는 각각 application 분석으로 비교 입력을 만든다.
3. `compare_artifacts` 또는 application 비교를 한 뒤 필요한 함수만 `analyze_function` → `compare_functions`로 좁힌다.
4. 동작 차이가 질문이면 같은 조건의 실제 여정/실험을 비교한다. 정적 변경만으로 동작 변화나 원인을 확정하지 않는다.
5. unmatched 항목, 부분 coverage, provider·환경 차이를 보고한다.

## 재구현 검증 — verify_reconstruction

1. 유한한 요구를 정의한다. 예: 특정 입력의 출력, 빈 입력 오류, 정렬 순서. 전체 앱 동일성을 선언하지 않는다.
2. 원본과 구현에서 호환 artifact/function/process 비교 근거를 얻는다. 웹은 같은 시작 상태·입력의 화면/응답도 비교한다.
3. 도구가 지원하는 Evidence면 typed specification으로 `verify_reconstruction`을 쓴다. Computer Use 기록만으로 도구의 입력 계약을 충족한다고 가정하지 않는다.
4. 요구별 pass/fail/unknown과 검증 범위를 보고한다. 미실행을 pass로 처리하지 않는다.

## 크래시 조사 — trace_crash

1. 증상·signal·오류·주소와 대상 정체성을 확인하고 기존 core/capture부터 활용한다.
2. 주소를 실제 함수에 대응시키고 정적 참조·호출을 추적한다. 이름 유사성으로 소스 위치를 단정하지 않는다.
3. 재현이 필요하고 허용되면 bounded capture를 실행한다. core의 과거 PID는 live attach 대상이 아니다.
4. 관찰된 실패, 정적 도달 가능성, 원인 가설을 구분하고 가설을 구별할 다음 실험을 제시한다.

## 미확인 사항 검토 — audit_residual_unknowns

1. `list_unknowns`로 현재 head·revision을 읽고 관련 질문을 고른다.
2. 근거·반증·authority 요구를 확인하고 resolved 항목은 지원되는 `verify_unknown_resolution`으로 검증한다.
3. 근거가 생긴 항목만 최신 revision으로 갱신한다. 추가 결과가 없다는 이유로 해결하지 않는다.
4. 남은 질문을 해결할 실제 대상·실험·자료를 정리한다.

## 프로세스 실험 — prepare_bounded_process_capture

1. 가설을 구별할 관찰, executable·인자·cwd·입력·시간/출력 한계·중단 조건을 정한다.
2. 환경 상속과 파일·네트워크 영향, 현재 사용자 권한 실행임을 설명한다. 주변 전체 환경변수를 근거 파일로 저장하지 않는다.
3. 허용 범위에서 `capture_process_scenario`를 실행하고 입출력·상호작용·종료·선택한 파일 변화와 누락을 읽는다.
4. 호환 capture가 있으면 `compare_process_captures`로 비교한다. 버전 불일치 기록을 임의 업그레이드하지 않는다.
5. 종료·자손 정리·sampling gap·외부 효과·남은 질문을 보고한다. 정리 실패를 성공으로 덮지 않는다.
