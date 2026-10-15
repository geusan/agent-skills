# 전체 기능 경로

이 표는 조사 영역을 찾는 색인이다. 실제 실행 가능 여부는 선택한 REA runtime의 tools/list와 binary_session의 availability가 결정한다. 이름은 후보이며 schema를 확인한다. 설치하지 않은 외부 엔진·optional addon과 미지원 host를 성공처럼 취급하지 않는다.

[session runner](execution.md)는 고정 allowlist 없이 모든 공개 도구 이름을 전달한다. tools(query)로 관련 이름을 찾고 schema(name)를 읽는다. CLI 별칭과 MCP 이름을 기계적으로 underscore/hyphen 변환하지 않는다. setup/update 등 CLI 전용 동작은 rea.mjs passthrough를 사용한다.

| 영역 | 조사 경로 | 원본 가이드 |
|---|---|---|
| 네이티브 기본·UI/data flow | search, function, decompile, xrefs, trace; MCP는 실제 inventory | [native-investigation.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/native-investigation.md) |
| Ghidra 특수 target | DOS, raw, MIPS, RISC-V, PSP, NativeAOT profile | [ghidra-provider.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/ghidra-provider.md) |
| 패키지·JavaScript/Electron | analyze_javascript_application, trace_application_feature, compare_application_versions | [javascript-application-workflows.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/javascript-application-workflows.md) |
| JS 소스 복구 | recover_javascript_sources; Wakaru 선행 조건 | [javascript-recovery.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/javascript-recovery.md) |
| JS runtime·정적 대응 | list_javascript_runtime_targets, observe_javascript_runtime, reconcile_javascript_runtime | [javascript-runtime-reconciliation.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/javascript-runtime-reconciliation.md) |
| 브라우저 passive·실행 관찰 | list_browser_targets, inspect_web_page, observe_web_session, observe_web_execution | [browser-observation.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/browser-observation.md) |
| 웹 module/source/event | trace_web_module_imports, trace_web_source_location, inspect_web_event_listeners | [web-runtime.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/web-runtime.md) |
| 브라우저 시나리오·screenshot | capture_browser_scenario, capture_web_screenshot, compare_web_screenshots | [browser-scenario-contract.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/browser-scenario-contract.md) |
| Electron runtime | list_electron_targets, inspect_electron_page, capture_electron_scenario | [electron-observation.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/electron-observation.md) |
| 저장된 web traffic | inspect_web_network_capture; HAR/SAZ/지원 capture | [web-network-captures.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/web-network-captures.md) |
| .NET managed·비교·재구현 | inspect_managed_artifact, inspect_managed_members, compare_managed_members | [managed-code-analysis.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/managed-code-analysis.md) |
| Android APK/JADX | inspect_android_package, class/method/search/reference | [android-analysis.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/android-analysis.md) |
| Apktool resources | inspect_apktool_client, decode_android_resources | [apktool-resource-analysis.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/apktool-resource-analysis.md) |
| ADB 기기·전송·실행 | list/inspect/pull/push, install/uninstall/start/stop; 각 효과 확인 | [adb-device-analysis.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/adb-device-analysis.md) |
| Flutter/Dart | identify_flutter_build, inspect_dart_aot | [flutter-analysis.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/flutter-analysis.md) |
| JEB | inspect_jeb_client, open_jeb_project, list_jeb_units, decompile_jeb_item | [jeb-analysis.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/jeb-analysis.md) |
| Apple bundle·plist·native UI | artifact graph, inspect_plist, Mach-O, dylib, native UI/call observation | [apple-application-analysis.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/apple-application-analysis.md) |
| Harmony packages | project_harmony_application_graph | [harmony-analysis.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/harmony-analysis.md) |
| Firmware | inspect_firmware_regions, extract_firmware; Binwalk/Unblob | [firmware-analysis.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/firmware-analysis.md) |
| ELF/PE diagnostics | inspect_binary_layout, inspect_pe_resources | [binary-diagnostics.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/binary-diagnostics.md) |
| Recorded crash | inspect_recorded_crash; pwntools/GDB context | [recorded-crashes.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/recorded-crashes.md) |
| Go metadata | inspect_go_binary | [go-binaries.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/go-binaries.md) |
| WASM | inspect_wasm_artifact, compare_wasm_interfaces; WABT | [wasm-artifacts.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/wasm-artifacts.md) |
| EVM | inspect_evm_interface | [evm-bytecode.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/evm-bytecode.md) |
| SQLite | inspect_sqlite_database; coherent DB/WAL snapshot | [sqlite-databases.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/sqlite-databases.md) |
| Packet fields/decoding | inspect_packet_fields, inspect_packet_capture; TShark | [packet-captures.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/packet-captures.md) |
| PCAP summary | inspect_pcap_client, inspect_pcap_capture | [pcap-analysis.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/pcap-analysis.md) |
| Logic signal | inspect_signal_decoders, decode_signal_recording; sigrok | [signal-recordings.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/signal-recordings.md) |
| Process scenarios | capture_process_scenario, compare_process_captures | [process-capture.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/process-capture.md) |
| Frida | device/process discovery, bounded instrumentation, live sessions | [frida-instrumentation.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/frida-instrumentation.md) |
| Evidence·unknown·비교·검증 | bundle import/export, record/update/list unknown, compare, verify_reconstruction | [mcp-contracts.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/mcp-contracts.md) |
| 재구현 coverage | obligation ledger, evaluate_reconstruction_coverage | [reconstruction-obligation-ledgers.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/reconstruction-obligation-ledgers.md) |
| 설정·진단·업데이트·해제 | CLI setup, doctor, providers, capabilities, update, uninstall | [installation.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/installation.md) |
| 프롬프트·completion | session prompts/prompt/complete; 여섯 원본 workflow | [mcp-prompts.md](https://github.com/morluto/rea/blob/3f80b75708f88e51c64eb0122c178b96789c53b3/docs/mcp-prompts.md) |

기능 추가 시 이 표를 유일한 tool catalog로 사용하지 않는다. 선택한 runtime이 제공하는 이름·정확한 입력·effects·limitations가 우선이다. 자료를 fetch해야 할 때 현재 조사에 해당하는 가이드만 읽는다.

원본 저장소 개발·CI·릴리스 작업은 분석 제품의 기능과 구분한다. 이 스킬은 REA의 공개 조사·설정 인터페이스를 실행하며 저장소 maintainer의 merge/release 권한을 대체하지 않는다.
