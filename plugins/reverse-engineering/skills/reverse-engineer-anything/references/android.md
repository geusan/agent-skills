# Android APK

`inspect_android_package`로 사용자 APK의 정체성·manifest·coverage를 확인한다. 각 도구가 자기 APK 경로를 받으므로 native session을 먼저 열지 않는다.

1. `search_android_classes`로 후보를 찾는다.
2. `inspect_android_class`로 멤버·overload를 확인한다.
3. `inspect_android_method`로 선택한 메서드를 디컴파일한다.
4. `trace_android_references`로 incoming static reference를 추적한다.

overload는 inventory의 `overload_index`를 사용하고 추측하지 않는다. manifest·디컴파일은 실행·권한 부여·정책 집행을 증명하지 않는다. reflection·동적 로딩·간접 참조·부분 coverage를 유지한다.

기준 REA는 별도 headless JADX MCP JAR와 full JDK를 요구한다. `REA_JADX_MCP_JAR`, 필요한 경우 `JAVA_HOME`을 기존 설치에 맞춘다. 정확한 버전·OS 지원은 설치된 REA 가이드로 확인한다. setup이 JDK/JADX를 설치한다고 가정하지 않는다. 정적 APK 분석에는 실행·에뮬레이터가 필요 없다.

archive member 질문이면 `open_binary` → `inspect_artifact`를 쓴다. ADB 기기 관찰은 별도 범위다. 정적 분석 요청을 앱 설치·실행·파일 전송으로 확대하지 않는다.
