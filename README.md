# 두란노

Expo SDK 57 / React Native 앱입니다. Expo Go 대신 자체 iOS 앱을 빌드합니다.

## 준비

- Xcode 26.4 이상과 CocoaPods
- `npm install`
- 프로젝트 루트 `.env`에 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` 설정
- 실제 iPhone에서는 개발자 모드를 켜고 Mac을 신뢰합니다.

## Xcode로 설치

1. `npm run ios:prebuild`로 iOS 프로젝트와 Pods를 준비합니다.
2. `npm run ios:open`으로 `.xcworkspace`를 엽니다.
3. 앱 타깃의 **Signing & Capabilities**에서 **Automatically manage signing**을 켜고 본인 Apple 계정의 Team을 선택합니다. 필요하면 Xcode Settings > Accounts에서 로그인합니다.
4. 실행 대상을 연결한 iPhone으로 선택합니다.
5. Mac 개발 서버 없이 실행하려면 **Product > Scheme > Edit Scheme > Run > Info > Build Configuration**을 **Release**로 바꿉니다.
6. **Product > Run**으로 빌드·설치합니다.

무료 Personal Team의 프로비저닝 프로필은 발급 후 7일 동안 유효합니다. 만료되면 다시 빌드·설치합니다. Expo Go는 필요하지 않으며 휴대폰에서 삭제해도 됩니다.

## 터미널 명령

- `npm run ios`: iOS 시뮬레이터 개발 빌드
- `npm run ios:device`: 실제 iPhone 개발 빌드
- `npm run ios:release`: 실제 iPhone용 Release 빌드·설치
- `npm start`: 개발 빌드용 Metro 서버 (Expo Go 대상 아님)
- `npm run web`: 웹 개발 서버
- `npm run lint`: 린트 검사
- `npx tsc --noEmit`: 타입 검사

Release 빌드에는 JavaScript가 포함됩니다. 인증·데이터 조회 등 Supabase 기능에는 인터넷이 필요합니다. `.env`의 `EXPO_PUBLIC_` 값은 앱에 포함되므로 서버 비밀 키를 넣으면 안 됩니다.

`ios/`와 `android/`는 생성물로 Git에서 제외됩니다. 앱 설정과 네이티브 의존성을 변경하면 prebuild를 다시 실행하고 빌드하세요. `--clean`은 네이티브 폴더를 재생성하므로 Xcode에서 직접 수정한 설정은 사라질 수 있습니다.

Xcode 27에서 오래된 iOS 리소스 타깃 때문에 빌드가 실패하지 않도록 `plugins/with-ios-minimum-target.js`가 Pods의 최소 iOS 버전을 16.4로 맞춥니다. 이 설정은 prebuild 시 자동 적용됩니다.


## 생체인증 잠금 (iOS · Android)

로그인 후 **설정 → 앱 설정 → 생체인증 잠금**을 켭니다. Face ID·Touch ID 또는
Android의 강한 생체인증으로 설정을 확인한 뒤, 앱 재실행과 백그라운드 복귀 시
잠금을 해제합니다. 설정은 계정별·기기별로 저장되며 기본값은 꺼짐입니다.
웹에는 이 설정이 표시되지 않습니다. 도메인이나 패스키 서버 설정은 필요 없습니다.

인증 취소·실패·설정 읽기 오류 시 보호된 화면을 열지 않습니다. 인증할 수 없다면
잠금 화면의 **이메일·비밀번호로 다시 로그인**을 사용합니다. 비밀번호 재인증 후에는
앱에 진입할 수 있고, 다음 백그라운드 전환부터 다시 잠깁니다.
서버 세션이 만료·해제된 경우에는 비밀번호 로그인이 필요합니다.

네이티브 세션은 SecureStore에 분할 암호화 저장하며 기존 AsyncStorage 세션은
첫 읽기에서 이전하고 원본을 지웁니다. 비밀번호와 생체정보는 저장하지 않습니다.
로그인 상태 유지를 끄면 세션은 메모리에만 보관되어 앱 재실행 시 다시 로그인합니다.

새 네이티브 모듈과 Face ID 권한 설명을 적용하려면 앱을 다시 빌드해야 합니다.
기존 Xcode 설정을 보존하려면 `npx expo prebuild --no-clean`으로 동기화한 뒤
`npm run ios:device` 또는 `npm run android`를 실행합니다.
Face ID는 Expo Go에서 테스트할 수 없습니다.

검증 명령: `node --test scripts/check-biometric-lock.cjs scripts/check-data-flows.cjs`.
이 검증은 생체인증·기기 상태·저장소를 모의한 회귀 검사입니다. 실제 기기에서는
잠금 켜기/끄기, 인증 취소, 앱 재실행, 백그라운드 복귀, 비밀번호 복구를 확인해야 합니다.
