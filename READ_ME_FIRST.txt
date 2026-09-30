FRACTURED — Loading manager and performance patch v75

INSTALL
Upload all HTML, JS, CSS, and PNG files from this ZIP into the existing game repository root. Replace index.html. Keep the remaining game assets. This includes the v74 ability repair, enhancements, and Roman labels.

LOADING
The previous progress bar was timed and could finish before images were available. The new loadingManager-v75.js waits for actual image loads and decoding. It shares sprite objects between the player and character preview, limits managed sprite requests to four concurrent loads, and shows progress for selected-character frames, S’var and essential scene art. Failed loads show a retry button. Only the selected playable character is constructed.

FRAME WORK
The world no longer redraws behind the character menu; hidden pages skip gameplay updates. Character preview redraws are capped at 15fps. HUD writes run at 10Hz rather than every animation frame. Resize events are batched to one per animation frame. Gameplay animation and physics remain at the browser frame rate.

LIMITS
This is a loading/performance manager, not moderation or anti-cheat. It does not reduce source PNG sizes or manage every intro/background request; browser caching still applies. Device-specific lag may need a recording of when it occurs. No measured phone FPS improvement is claimed.

VALIDATION
Local tests passed for four-request concurrency, image reuse, real progress, failed-load retry, timeout, module paths, ability playback/impact, cast interruption guards and class restrictions. Live deployment has not been measured.
