# 네이티브·관리 코드·패키지

## 네이티브

`open_binary`에 사용자 경로와 선택한 provider를 전달한다. 자동 선택에서 여러 엔진이 가능하면 모호할 수 있다. 명시적 선택을 유지하고 실패 시 다른 엔진으로 조용히 바꾸지 않는다.

함수명·주소가 있으면 바로 분석한다. 탐색이 필요할 때만 `search_strings`, `search_procedures`로 좁힌다. `analyze_function`과 필요한 `xrefs`, callers/callees로 경로를 확인한다. `binary_overview`는 개요가 필요하고 provider가 지원할 때만 호출한다. IDA에 이 도구가 있다고 가정하지 않는다.

- 주소·파일 오프셋·로드된 메모리를 구분하고 변환은 실제 매핑 근거를 쓴다.
- 의사 코드는 원본 소스가 아니다. 최적화·간접 호출·함수 경계·미지원 정보를 한계로 남긴다.
- 중요한 계산은 필요할 때 어셈블리·바이트와 대조한다. 이름만으로 동작을 확정하지 않는다.
- Ghidra는 임시 DB를 사용하며 원본 실행 파일을 바꾸지 않는다. 허용된 세션 주석 변경도 Windows P0에서는 지원되지 않는다.
- IDA GUI의 기존 입력과 대상을 확인하고 연결된 DB를 저장하거나 닫지 않는다.
- 완료된 함수의 일부는 지원되는 `inspect_analysis_view` native facet으로 읽고 재분석하지 않는다.

## .NET

`inspect_managed_artifact`로 시작한다. 정적 metadata·CIL을 assembly 로드·실행·reflection 관찰로 표현하지 않는다. NativeAOT는 native 경로로 분석하며 C# 원본 복원을 약속하지 않는다. metadata token은 해당 artifact/MVID 범위에서만 식별값이다.

## 패키지

활성 대상 기반 `inspect_artifact` 전에 해당 경로를 연다. graph·manifest·digest·integrity·coverage를 보존한다. 내부 실행 파일을 분석하면 바깥 패키지와 안쪽 파일의 정체성을 함께 남긴다.

파일 실체가 필요할 때만 `extract_artifact`를 사용한다. 이 도구는 REA가 선택한 새 임시 디렉터리에 일반 파일을 물리화하고 경로를 반환한다. symlink·암호화 항목의 목록 존재는 추출 성공이 아니다. 추출과 실행은 별개다. DMG 읽기 전용 마운트도 호스트 지원과 정리 결과를 확인한다.

Apple 앱 역할의 경로 규칙과 실제 plist 내용을 구분한다. 필요하면 `project_apple_application_graph`, `inspect_plist`를 조합한다.

다른 정적 형식은 현재 지원을 확인한다. Go 빌드 정보는 `inspect_go_binary`, ELF 구조는 `inspect_binary_layout`, WASM은 `inspect_wasm_artifact`가 후보다. 자기 주장인 빌드 metadata를 인증된 사실로 바꾸지 않는다. 헤더 없는 raw binary의 architecture·entry point를 근거 없이 추측하지 않는다.
