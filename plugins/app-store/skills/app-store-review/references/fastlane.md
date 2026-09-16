# Fastlane·TestFlight·스토어 자산

## 작업별 경계

| 작업 | 보통 사용하는 기능 | 별도로 확인할 결과 |
|---|---|---|
| TestFlight | `upload_to_testflight` / 프로젝트 beta lane | 업로드 접수, 처리 완료, 내부·외부 테스트 상태 |
| 이름·소개·URL·카테고리 | `upload_to_app_store` (`deliver`) | 앱 정보와 버전 정보의 현지화 값 |
| 스크린샷 | `upload_to_app_store` | 기기별 이미지·순서·체크섬·처리 완료 |
| 개인정보 수집 신고 | `upload_app_privacy_details_to_app_store` | 답변 저장·게시 여부, 별도 Apple ID 인증 |
| 심사 빌드 연결 | App Store 버전의 build relationship | 정확한 버전·빌드 연결 |
| 심사 제출·공개 | 별도 요청 범위에서 수행 | 실제 제출 상태·공개 방식 |

lane 이름은 프로젝트마다 다르다. 먼저 Fastfile을 읽고 대상 플랫폼을 명시한다. iOS 요청에 양 플랫폼 배포 명령을 실행하지 않는다.

## 빌드와 인증

- 도구 버전, 서명 팀, bundle ID, API 키 파일 존재 여부와 읽기 전용 접속을 점검한다. 비밀값 자체는 출력하지 않는다.
- API 키 권한과 액션 지원 여부를 확인한다. 현재 Fastlane 개인정보 신고 액션은 소유자/관리자 Apple ID 세션을 필요로 하며 ASC API 키를 지원하지 않는다. 비밀번호·2FA 코드를 채팅이나 Git에 저장하지 않는다.
- 프로젝트의 build-number 계산을 사용하되 해당 버전의 원격 빌드와 충돌하지 않는지 확인한다. 로컬 의존성 override와 미커밋 변경이 바이너리에 들어가면 기록한다.
- 환경별 define·flavor·백엔드 플래그를 확인한다. staging 인증정보나 개발 서버가 정식 빌드에 의도치 않게 들어가면 바로잡는다.
- 결과물의 bundle ID, 버전, build number, 서명·아이콘을 확인한다. Flutter 명령 성공과 서명된 IPA 생성은 다른 단계다.
- `skip_waiting_for_build_processing`은 업로드 후 처리 대기를 생략한다. API에 빌드가 아직 없어도 즉시 재업로드하지 말고 접수 로그와 처리 상태를 확인한다. 미반영이면 정확히 그렇게 보고한다.
- `VALID`, 내부 테스트 가능, 외부 베타 심사 상태를 구분한다. 테스터 초대나 외부 베타 심사를 임의로 시작하지 않는다.

## 메타데이터 구조

일반적인 `deliver` 파일 배치다. 설치 버전의 옵션·파서와 공식 문서로 확인한다.

```text
ios/fastlane/metadata/
  copyright.txt
  primary_category.txt
  ko/
    name.txt
    subtitle.txt
    description.txt
    keywords.txt
    support_url.txt
    privacy_url.txt
```

- 교육 카테고리는 `EDUCATION`이다. 앱 성격과 사용자 선택에 맞춘다.
- 이름·부제·설명·키워드의 길이, 단위와 locale 코드를 최신 문서/서버 응답으로 검증한다.
- URL은 공개적으로 접근되는 실제 페이지여야 한다. HTTP 성공뿐 아니라 요청한 용도의 내용인지 확인한다. 홈페이지를 임의로 지원 URL로 지정하지 않는다.
- 저작권은 사용자가 확인한 연도와 실제 권리자 표기를 사용한다. 판매자명·법인 계정 전환과는 별개다.
- 메타데이터 전용 작업은 바이너리·스크린샷 업로드를 끄고 `submit_for_review: false`, `automatic_release: false`로 운영할 수 있다. 기존 lane의 의도를 보존한다.
- `submission_information[:content_rights_contains_third_party_content]`는 설치된 Fastlane에서 심사 제출 단계에 처리될 수 있다. metadata-only lane에 넣었다고 반영됐다고 하지 않는다. 필요하면 기존 인증을 재사용한 Spaceship API로 해당 앱 속성만 갱신하고 재조회한다.

## 특정 언어만 지원

스토어 현지화, 바이너리 UI 언어, 출시 국가는 독립적이다.

1. 지정된 locale과 현재 primary locale을 확인한다.
2. 업로드하지 않을 번역은 metadata 디렉터리 밖에 보관하거나 검증된 필터 경로를 사용한다. 기존 초안을 삭제하지 않는다.
3. 로컬 폴더 이동은 원격 현지화를 자동 삭제하지 않는다. 언어 제거 요청이 있을 때 편집 버전과 앱 정보의 locale을 확인해 제거한다. 기존 이미지·다른 플랫폼·live 버전에 미치는 영향부터 확인한다.
4. 로컬 업로드 대상과 원격 locale을 재조회한다. primary locale과 유지할 이미지가 남았는지 확인한다.

## 스크린샷

- 기존 검토·승인 기록이 있으면 그 범위를 재사용한다. 대화와 저장소 지침상 충분한 허가가 있으면 재승인을 반복하지 않는다.
- 미검토 기기나 번역을 승인된 묶음에 섞지 않는다. 해시로 승인본을 식별하는 프로젝트에서는 변환·재렌더 후 기존 승인을 재사용하지 않는다.
- 공식 규격, 불투명도, 언어, 기기, 순서와 개수를 확인한다. 기기 규격이 공개되어도 ASC와 설치된 Fastlane의 업로드 지원을 별도 확인한다.
- 전체 교체인지 특정 기기 추가인지 구분한다. `overwrite_screenshots`의 삭제 범위를 확인하고 iPhone 업로드로 기존 iPad 이미지를 지우지 않는다.
- 원격 checksum과 `assetDeliveryState` 등을 재조회한다. API checksum 알고리즘과 로컬 승인 SHA-256을 혼동하지 않는다.

## 앱 아이콘

아이콘은 asset catalog 또는 Icon Composer 자산을 포함한 바이너리로 전달된다. 앱 목록의 빈 아이콘과 기기 아이콘을 구분한다.

- “현재 이미지”라면 원본과 기기별 산출물을 대조한다. 이미 같으면 교체했다고 주장하지 않는다.
- 목록 아이콘이 비면 스토어 버전의 빌드 연결, 바이너리 아이콘과 Apple 처리 상태를 확인한다. TestFlight 업로드는 스토어 버전의 빌드 선택과 별개다.
- UI는 보통 **배포 → iOS 버전 → 빌드 추가 → 선택 → 저장**이다. 연결은 심사 제출이 아니다. 목록 반영까지 실제 재조회/화면으로 확인한다.
- 아이콘 이미지 변경에는 새 빌드가 필요하다. 설명 업로드만으로 교체할 수 없다.

## 실패 시 복구

명령 실패 시 마지막으로 성공한 원격 변경을 확인한다. 같은 미확정 상태에 쓰기를 반복하지 않는다.

- **새 locale 추가 중 이름 중복:** 현재 이름·언어·실패 단계를 확인한다. 이전 기본 이름을 물려받는 과정의 문제라면 승인된 기본 locale 이름을 먼저 갱신한 뒤 재시도할 수 있다. 실제 새 이름이 중복이면 임의로 이름을 만들지 않는다.
- **저장 후 `No data`:** 빈 review-detail/attachment 응답을 Fastlane이 파싱하다 실패할 수 있다. 스택과 이름/설명 등의 원격 값을 확인한다. 저장이 끝났다면 이를 보고하고, 오류 회피용 가짜 심사 연락처를 만들지 않는다.
- **실패처럼 보이나 접수 로그 있음:** 같은 version/build의 도착 여부부터 확인한다.
- 조회와 국소 수정으로 복구되지 않으면 부족한 정보·권한·서버 상태를 보고한다. 원격 저장 성공과 lane 전체 성공을 구별한다.

## 공식 자료

- [Fastlane deliver](https://docs.fastlane.tools/actions/deliver/)
- [Fastlane pilot](https://docs.fastlane.tools/actions/pilot/)
- [ASC API 인증](https://docs.fastlane.tools/app-store-connect-api/)
- [Apple 빌드 선택](https://developer.apple.com/help/app-store-connect/manage-builds/choose-a-build-to-submit)
- [Apple 앱 아이콘](https://developer.apple.com/help/app-store-connect/manage-app-information/add-an-app-icon)
- [Apple 스크린샷 규격](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)
