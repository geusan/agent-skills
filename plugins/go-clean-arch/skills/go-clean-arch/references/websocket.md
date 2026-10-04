# WebSocket and hub boundaries

Read this only when implementing, migrating, or reviewing socket/concurrent messaging behavior. An ordinary HTTP API does not need a hub or a second service.

## Separate policy from connection mechanics

Keep upgrade requests, `*websocket.Conn`, frame encoding, ping/pong, deadlines, and read/write pumps in a transport adapter. Business services operate on room IDs, actor IDs, messages, and capabilities such as membership or message persistence. If an in-memory hub implements message delivery, define its API around those operations instead of exposing socket clients through use-case signatures.

Authenticate and authorize room access before upgrading. Validate the browser Origin against the application's configured policy; Origin is not a substitute for authentication. Preserve the target's message framing, event names, payloads, room limits, and reconnect behavior during a structural migration. Do not infer valid production settings from the reference's localhost check or five-client limit.

## Make state ownership explicit

The reviewed `chat-server/chat/service.go` owns a global hub map; `hub.go` owns a client map but exposes direct count/close operations outside its loop. Do not copy this lifecycle unchanged.

Choose a single event-loop owner or consistent locking for each registry and mutable collection. Ensure concurrent room lookups create and start one hub, and route registration, removal, counts, broadcasts, and shutdown through the chosen synchronization model. Define who closes each channel so disconnect and shutdown cannot double-close or send after close.

Bound outbound queues and specify what happens to slow clients. Make waits interruptible during shutdown so a stopped hub cannot leave a read pump blocked on unregister or broadcast. Give long-lived connections a lifecycle tied to the server/connection, rather than relying on a request context after its handler returns. Stop tickers, close connections, remove empty rooms as appropriate, and wait for owned goroutines during shutdown.

For Gorilla, follow its [concurrency contract](https://pkg.go.dev/github.com/gorilla/websocket#hdr-Concurrency): coordinate ordinary read operations through one reader and ordinary write operations through one writer per connection. Consult the selected version's documentation for control-frame and close exceptions.

## Verify behavior under concurrency

Use bounded-time tests that exercise simultaneous room creation, connect/disconnect, broadcast while a client is slow, and shutdown with active clients. Run those tests with `go test -race` in the affected module. Assert expected delivery and termination, not only an absence of race reports. Test authorized/unauthorized upgrades and the configured origin policy at the transport boundary.

If routing or startup registration with a second service is requested, inject its client/address and handle connection failures, timeouts, response-body cleanup, and retry limits explicitly. Do not introduce this external registration side effect into a single-service product solely to resemble the sample.
