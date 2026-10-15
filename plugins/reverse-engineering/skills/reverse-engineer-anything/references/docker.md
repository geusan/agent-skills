# Docker 실행 환경

상시 서버 대신 스킬이 선택한 컨테이너를 필요할 때 실행한다. REA는 stdio MCP로 연결하므로 기본 구성에서 HTTP port 공개가 필요하지 않다. 컨테이너의 CLI 경로도 사용 가능하다. Docker runtime·선택한 engine은 외부 선행 조건이다.

## 기본 이미지

```bash
docker build -f "$SKILL_ROOT/assets/docker/Dockerfile" \
  -t rea-skill:6.4.0 "$SKILL_ROOT/scripts"
docker run --rm rea-skill:6.4.0 --version
```

이미지는 Node 24.18.0, JDK 21, 잠긴 REA 패키지를 포함한다. Ghidra/Hopper/IDA와 license는 포함하지 않는다. default는 optional addon을 제외한 정적 분석 기반이며, 필요한 경우 `--build-arg INCLUDE_OPTIONAL=true`로 해당 runtime dependency를 포함하고 실제 readiness를 검증한다. 이미지 build가 provider 검증은 아니다.

## Ghidra 연결과 세션

[docker-session.example.json](../assets/docker-session.example.json)을 선택된 launch 파일로 복사하고 모든 절대경로를 실제 값으로 바꾼다.

- input mount는 readonly, output mount는 host runner의 새 `--output` 경로와 동일해야 한다. runner가 먼저 output 디렉터리를 만든다.
- `/opt/ghidra`에는 컨테이너 OS/architecture에서 실행 가능한 Ghidra 12.1.x 설치를 mount한다. Mac용 native 파일을 Linux에서 실행할 수 있다고 가정하지 않는다.
- 이미지 기본 UID는 node(1000)다. Linux host에서는 output directory owner에 맞는 `--user UID:GID`를 설정한다. 전체 권한을 777로 바꾸거나 임의 root 실행으로 해결하지 않는다.
- args의 `-i`는 stdin 유지용이며 `-t`를 넣지 않는다. MCP stdout에 TTY 출력이 섞이지 않아야 한다.
- MCP 요청의 파일 경로는 `/input/...`, export는 `/output/...`처럼 컨테이너 관점이다. host 결과 조회는 receipt에 나온 host 경로로 한다.

```bash
node "$SKILL_ROOT/scripts/session.mjs" \
  --output /absolute/new-output --config /absolute/docker-launch.json
```

native engine 없이 JS/.NET 등만 분석하면 Ghidra mount/env 선택을 제거한다. 이미지가 모든 분석 도구를 자동 설치했다고 보고하지 않는다.

## Hopper·IDA

Hopper Linux는 지원 배포판(x86-64 Ubuntu 24.04 등)·필수 라이브러리·Xvfb가 필요하다. 이 Debian 기반 이미지에서 Hopper가 검증됐다고 주장하지 않는다. [Hopper guide](providers/hopper.md)에 맞는 별도 image를 준비하고 runner의 command/args로 연결한다.

IDA headless는 engine·license·Python/idalib·호환 upstream MCP가 모두 필요하다. [IDA guide](providers/ida.md)의 pinned profile을 연결한다. REA와 supervisor가 동일 private filesystem/path를 보도록 구성한다. 라이선스를 Dockerfile·Git·공개 이미지에 복사하지 않는다.

이미지 3개를 만들었다고 세 엔진을 동시에 실행할 필요는 없다. 사용자 선택 provider와 실제 동시 분석 수에 맞춰 자원을 할당한다. ARM host의 amd64 emulation은 별도 호환·성능 검증 대상이다.

## 자원·한계

Ghidra 단일 소규모 분석의 시작 예산은 2 vCPU·4GB, 개인용 권장 시작점은 4 vCPU·8GB·SSD 40GB다. 이는 target별 측정으로 확정해야 하는 추정이며 보장된 하한이 아니다. Docker `--memory=4g`는 컨테이너 전체 상한, `GHIDRA_HEADLESS_MAXMEM=2G`는 Java heap이다. CPU/heap/timeout은 서로 다른 제한이다.

remote machine에서 실행할 때는 그 호스트의 입력 파일·output mount를 사용한다. 로컬의 GUI·브라우저·로그인 세션은 자동 전달되지 않는다. 웹 실사용은 [Computer Use 경로](website-use.md)와 별도로 구성한다. 런타임 계측·대상 실행은 컨테이너가 있으므로 자동 허용되는 것이 아니다.

정상 `close`를 사용하고 bundle·cleanup 결과를 확인한다. 강제 종료한 docker client만으로 detached worker가 정리됐다고 판단하지 않는다. 자신이 만든 컨테이너의 실제 상태와 해당 provider inventory를 확인한다.
