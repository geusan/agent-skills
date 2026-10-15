# Ghidra 실행 경로

## 준비·설정

REA 기준 지원은 Ghidra 12.1.x, 검증 조합은 12.1.4 + full 64-bit JDK 21이다. 설치의 application.java.min/max가 실제 Java 범위를 결정한다. JRE만으로 대체하지 않는다. Linux/macOS x64·arm64와 experimental Windows x64 P0를 구분한다.

```bash
export GHIDRA_INSTALL_DIR=/absolute/ghidra_12.1.4_PUBLIC
export JAVA_HOME=/absolute/jdk-21
export REA_ANALYSIS_PROVIDER=ghidra
export GHIDRA_HEADLESS_MAXMEM=2G
node "$SKILL_ROOT/scripts/rea.mjs" doctor --provider ghidra --json
node "$SKILL_ROOT/scripts/rea.mjs" providers --json
```

Windows는 해당 환경에서 절대 Windows 경로로 설정한다. host architecture에 맞는 native decompiler가 `Ghidra/Features/Decompiler/os/<platform>/` 또는 대응 build/os에 있어야 한다. Linux arm64와 macOS는 별도 native build가 필요할 수 있다. 다른 OS의 설치 폴더를 컨테이너에 mount했다고 실행 가능한 것은 아니다.

자동 설치·Java 업그레이드·Gatekeeper 설정 변경은 하지 않는다. 필요한 설치를 사용자에게 명시하고 이미 준비된 엔진을 연결한다. [launch 예제](../../assets/ghidra-session.example.json)의 경로·출력 폴더를 실제 값으로 바꾼다.

## 분석과 검증

[실행기](../execution.md)의 `schema`로 open_binary와 요청할 operation을 확인한다. 사용자 선택 provider를 고정해 열고, binary_session에서 target digest·binding·capability를 확인한다. known symbol은 바로 분석하고 discovery가 필요할 때만 검색한다.

```bash
node "$SKILL_ROOT/scripts/rea.mjs" search /absolute/program parser --kind procedures --provider ghidra --json
node "$SKILL_ROOT/scripts/rea.mjs" function /absolute/program main --provider ghidra --json
node "$SKILL_ROOT/scripts/rea.mjs" decompile /absolute/program 0x1000 --provider ghidra --json
```

main과 주소는 실제 존재하는 값으로 교체한다. 초기 분석 완료 전 startup timeout을 실패와 구분한다. 문자 검색은 Ghidra가 정의한 string Data 범위이며 파일의 모든 텍스트를 검사했다는 뜻이 아니다. address space·file offset·inclusive function ranges·exclusive memory-block ends를 혼동하지 않는다.

언어/컴파일러 override는 `REA_GHIDRA_LANGUAGE_ID`, `REA_GHIDRA_COMPILER_SPEC_ID`; seeds는 `REA_GHIDRA_SEED_FILE`; analyzer 제외는 `REA_GHIDRA_DISABLED_ANALYZERS`를 현재 문서와 함께 사용한다. raw/DOS/NativeAOT/PSP/MIPS/RISC-V 등의 프로파일은 [전체 기능 경로](../capabilities.md)의 세부 가이드를 읽는다. 이름이나 확장자만으로 강제 선택하지 않는다.

## 자원·수명

- REA는 임시 project·home/cache/temp와 private bridge를 소유한다. read-only import·deleteProject를 사용하며 기존 사용자 project를 열지 않는다.
- Linux/macOS의 허용된 함수 주석은 세션 안의 변경이다. original executable을 수정하지 않는다. Windows P0에는 DB mutation authority가 없다.
- heap 우선순위는 GHIDRA_HEADLESS_MAXMEM → GHIDRA_MAXMEM → 2G. 512M 검증은 작은 fixture에 한정된다. JVM heap은 총 RSS나 Node/native process memory 상한이 아니다.
- startup은 `REA_GHIDRA_STARTUP_TIMEOUT_MS`; runner timeout도 충분해야 한다. REA는 일반 CPU limit를 제공하지 않으므로 필요하면 Docker/host로 제한한다.
- 결과를 보존하고 close_binary 응답을 확인한다. 정리 실패 시 남은 workspace를 보존하고 진단을 읽는다.

## 실패별 대응

| 증상 | 확인 |
|---|---|
| 지원하지 않는 버전 | 현재 REA가 수용하는 release line; 무조건 최신 Ghidra로 교체하지 않음 |
| Java 또는 javac 없음 | 실제 JAVA_HOME, full JDK·64bit·버전 범위 |
| native component 오류 | 파일 header가 host OS/architecture와 맞는지, build/os 경로 |
| 느린 startup | target 크기·진단·heap과 request/startup deadline |
| ownership/cleanup unknown | 동일 run의 진단을 보존하고 close 재시도; PID 이름만으로 kill 금지 |

출처: [설치·자원 제어](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/installation.md#ghidra), [provider semantics](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/ghidra-provider.md).
