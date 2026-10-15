# Hopper 실행 경로

## 준비·설정

Hopper 실행 프로그램과 사용 가능한 demo/license를 별도로 준비한다. macOS 또는 지원 Linux x64 경로를 사용한다. Linux 공식 지원 배포판·시스템 라이브러리는 선택한 Hopper release를 기준으로 확인한다. Windows native Hopper 경로를 만들지 않는다.

기본 launcher는 macOS `/Applications/Hopper Disassembler.app/Contents/MacOS/hopper`, Linux는 `/opt/hopper/bin/Hopper` 또는 `~/.local/share/rea/hopper/bin/Hopper`다. 실제 설치를 override할 수 있다.

```bash
export HOPPER_LAUNCHER_PATH=/absolute/path/to/hopper
export REA_ANALYSIS_PROVIDER=hopper
node "$SKILL_ROOT/scripts/rea.mjs" doctor --provider hopper --json
```

macOS 최초 demo/license/loader dialog는 사람이 같은 사용자 세션에서 완료해야 할 수 있다. REA setup의 Hopper 설치를 요청받았다면 dry-run에서 패키지·설치 경로·설정 변경을 확인하고 승인된 범위만 적용한다. license 값·활성화를 자동화하거나 로그·이미지에 포함하지 않는다.

## 분석

```bash
node "$SKILL_ROOT/scripts/rea.mjs" analyze /absolute/program --provider hopper --json
node "$SKILL_ROOT/scripts/rea.mjs" search /absolute/program search --provider hopper --json
node "$SKILL_ROOT/scripts/rea.mjs" function /absolute/program main --provider hopper --json
```

연속 조사는 [session runner](../execution.md)로 open_binary(provider_id=hopper) 후 정확한 도구 이름을 호출한다. 함수명이 모호하면 실제 주소를 사용한다. navigation·bookmark·comment 등의 도구는 schema와 effects를 확인한 뒤 허용된 GUI/DB 효과만 실행한다.

startup 기본 deadline은 120000ms, 큰 대상은 `REA_HOPPER_STARTUP_TIMEOUT_MS`와 runner request timeout을 함께 조정한다. HOPPER_TARGET_PATH/KIND로 startup target을 설정한 환경에서는 의도치 않은 사전 열기가 없는지 확인한다. loader-specific 옵션은 `HOPPER_LOADER_ARGS_JSON`의 실제 형식을 확인한다.

## Linux 가상 디스플레이와 수명

REA는 지원되는 Linux demo를 private Xvfb로 실행한다. 사용자 desktop display가 필수는 아니지만 Xvfb와 관련 라이브러리는 필요하다. immutable `/tmp/.X11-unix`에서는 검사 후 user/mount namespace fallback을 사용하며 그 host 기능이 허용되지 않으면 진단을 따른다. 이를 해결하려고 컨테이너를 임의 privileged 모드로 바꾸지 않는다.

Linux demo는 같은 사용자에서 여러 launch를 기존 앱으로 전달하므로 REA가 사용자별 한 Hopper application을 예약한다. 다른 target도 두 번째 세션에서 동시에 열 수 있다고 가정하지 않는다. 기존 REA session에서 target 전환하거나 owner를 정상 close한다. 직접 사용자가 연 Hopper를 자신의 자원으로 채택하지 않는다.

macOS 정상 종료 시 REA 세션은 guard를 해제하지만 Hopper GUI 문서는 남을 수 있다. 이후 기존 GUI 문서 자동 재사용을 기대하지 않는다. Linux에서는 owned application/display를 종료한다. provider process가 사라졌다는 사실만으로 남은 runtime 파일 정리 완료를 주장하지 않는다.

## 실패별 대응

| 증상 | 확인 |
|---|---|
| launcher 미발견 | HOPPER_LAUNCHER_PATH와 실제 실행 가능 경로 |
| bridge startup 지연 | demo/license/loader dialog와 분석 진행·timeout |
| macOS Automation 거부 | REA를 시작한 앱의 OS 권한; 명시적 거부를 우회하지 않음 |
| Linux 시작 실패 | 해당 바이너리의 ldd missing library, Xvfb/private-display 진단 |
| 다른 세션이 소유 | owning run/session을 확인하고 정상 close; process-name kill 금지 |
| 연결 손실·닫기 미확인 | 기존 run의 close 재시도와 cleanup diagnostics 보존 |

출처: [Hopper 설치·수명](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/installation.md#hopper). demo 시간·기능 제한은 공급사 release 조건을 확인한다.
