MY CONSOLE - full project
==========================

FIRST-TIME SETUP (Windows 10/11)
1. Install Node.js "LTS" from https://nodejs.org (click Next on every screen), then RESTART the PC.
2. Put this whole folder somewhere simple like C:\console (avoid OneDrive/Documents folders).
3. Double-click start.bat. The first time it installs what it needs by itself (1-3 minutes, yellow warnings are fine),
   then the console opens full screen. (setup.bat does just the install step if you ever want to repeat it.)

UPDATING FROM AN OLDER VERSION
Extract the zip, open the "console" folder inside, select everything (Ctrl+A), copy, paste into your
existing C:\console and choose "Replace the files". You do not need to run setup.bat again.

CONTROLLER CHEAT SHEET (defaults; most can be changed on the Buttons tile)
  D-pad / left stick ..... move            A ..... select (on a game: options menu)   B ..... back
  Y ...................... search (Menu/Start finishes the search)  X ..... remove game     LB / RB ... switch tabs   Menu ... Home
  Click both sticks ...... mouse mode on/off (control the Windows cursor)
  In mouse mode: stick = cursor, A = left click, B = right click, right stick = scroll, D-pad = arrow keys,
                 Y = typing keyboard for any app, X = Enter, RB = Escape, LB = browser back
  Game page ............... Play (the ... button opens the menu, the ^ button expands the description), Add trailer, Install, Uninstall, Open install folder, View in store, Get game info, Background, Theme color, Remove
  Xbox button ............ Dashboard (resume / close the running game / pick another game)

DASHBOARD BACKUP SHORTCUT: hold LB + RB + View (the small left button) together. Steam never uses this one.

IF STEAM GRABS THE XBOX BUTTON (its overlay opens, or a game drops to windowed):
  1. Steam > right-click the game > Properties > Controller > set "Disable Steam Input".
  2. Steam > Settings > Controller: turn off "Guide Button Focuses Steam".
  3. In the game's own video options choose Borderless / Windowed Fullscreen instead of exclusive Fullscreen
     (exclusive fullscreen games often drop to windowed when another window takes focus).

BEFORE THE XBOX BUTTON WORKS
  - Windows Settings > Gaming > Xbox Game Bar: turn off the option that lets the controller button open it.
  - Steam > Settings > Controller: turn off "Guide Button Focuses Steam" (and Steam Input for Xbox controllers if needed).

CONTROLLER-ONLY CONSOLE
  While a controller is connected, the console ignores the mouse and keyboard completely (so they cannot clash with a game).
  Mouse and keyboard only work in Windows "mouse mode" (click both sticks). Unplug the controller if you ever need them in the console.
  If Steam makes the controller act like a mouse: Steam > Settings > Controller > turn off "Enable Steam Input for Xbox controllers"
  (or set "Disable Steam Input" for that game).
  If a game stays windowed after Resume, use "Resume and restore fullscreen" on the dashboard (it sends Alt+Enter), or set the game to Borderless.

STARTUP
  The console opens with a short animated intro (an original design, not any company's), then a "Press A to continue" screen with
  your profile name and picture. Set your name and picture on the dashboard (top-left profile) or Settings > Profile.
  Settings > Startup intro turns the intro and its chime off.
  STARTUP VIDEO: Settings > Startup video > Choose a file lets you pick your own .mp4 or .webm (up to 300 MB). The console copies it
  into %APPDATA%\my-console\themes and plays it full screen with sound at startup, then shows "Welcome Back <your name>" and
  "Press A to continue". Press A during the video to skip it. If the video cannot play, the built-in animation is used instead.
  The video stays on your PC. If it will not play, convert it to H.264 MP4 or WebM.

HOME DASHBOARD
  Laid out like a console dashboard: your profile and a Search button on top, a big tile for the game you played last, quick
  tiles beside it, a row of shortcuts (My games & apps, Find games, Recently added, Ready to install), then shelves of
  Recently played / Installed / Not installed games. The background art follows the game you select.
  For art on every tile, enter a free RAWG key in Settings and press Library > Get artwork (it fetches 60 games per press).

PER-GAME THEMES
  Select any game (Home or Library) and the background changes to that game's theme: your own picture if you set one, otherwise its
  cover art, otherwise a color generated from its name. To customize: A on a game > Customize > Background picture / Theme color / Reset.
  Your pictures are copied (resized) into %APPDATA%\my-console\themes.

LOOK AND FEEL
  Settings has real slider bars (Left/Right to change, A to wrap around), an accent color palette, and an Animations On/Off switch
  if you ever want a plainer, lighter interface.

GAME LIBRARY
  - Steam, Epic, Ubisoft Connect, GOG, Rockstar, EA app and Xbox games that are INSTALLED are found automatically.
  - Library > Add game folder: pick a folder that holds game folders (FitGirl, SteamRIP, any standalone games).
  - Epic and GOG: Settings > sign in (unofficial method; your password goes only to their sign-in page).
  - Steam owned games: Settings > Steam API key (free: steamcommunity.com/dev/apikey, profile game list must be public).
  - Other owned games: Library > Find and add a game, or Import list (.txt, one title per line). Needs a free RAWG key
    (rawg.io/apidocs) entered in Settings. Game data and images come from RAWG.io.

WHERE YOUR DATA IS:  %APPDATA%\my-console   (settings.json, library.json, accounts.json (encrypted), console.log)
  To reset everything, close the console and delete that folder.

TROUBLESHOOTING
  - "Electron failed to install correctly": run setup.bat again; make sure the folder is not in OneDrive.
  - Controller not detected: click the window once, press a button, try a cable.
  - Stuck in mouse mode: click both sticks again.
  - Any problem: open console.log in the data folder above and send the last lines to whoever is helping you.

LIMITS
  - Games in exclusive fullscreen may hide the console. Admin-level apps/games ignore the mouse and typing keyboard.
  - Epic/GOG sign-in and Xbox-button detection use unofficial methods that Windows or the stores could change.


HOME WIDGETS
  Home > 'Customize your Home' lets you add, rename, recolor, resize, reorder and remove widgets (clock, library stats, web page, any app or folder, pinned games and more).
  A game's ... menu has 'Pin to Home'.
SIGN-IN PAGE
  After the startup video you choose who is using the console. Menu (Start) opens Options for the highlighted user.


CONTROLLER, SETTINGS AND THE XBOX-BUTTON MENU (new)
- The "Customize your controller" widget opens the Controller page (no tabs). CONFIGURE opens the button layout:
  pick a button on the picture, then pick what it does. Console, Desktop and Sticks sections; LB/RB switch sections.
- Settings is now a sidebar (General, Account, System, Devices & connections, Preferences, Ease of Access) with tiles.
  Press A on a slider tile, use left/right, then A again. LB/RB switch sections.
- The Xbox (Guide) button opens a panel on the left: Add or switch, Sign out, Settings, Customize Home, Controller, Power.
  Power has "Exit console" and "Turn off PC" (asks you to confirm). While a game runs, Resume / Restore fullscreen / Close game are at the top.

BUTTON LAYOUT FRONT / BACK, ANIMATIONS (new)
- Button layout has Front and Back buttons. Back shows the paddles P1-P4; pick one to note what it does in the SCUF software.
  (The console cannot read the paddles itself; they reach Windows as the buttons set in the SCUF software.)
- Animations: screens slide and fade, items cascade in, the Xbox-button panel springs in and slides out, menus and the keyboard pop in.
  Settings > Ease of Access > Animations turns them all off.

--- Latest round: profiles, Vibration, Test, glow ---
* Button layout now has 3 profiles (pills 1/2/3 top right). Each keeps its own buttons, paddle reminders, dead zone and mouse speed.
* New tabs: Vibration (rumble test) and Test (live view of sticks, triggers and buttons; hold B 1 second to stop).
* "Windows calibration" opens the Windows game controller window.
* A faint white glow follows whatever is selected, everywhere. Turn animations off in Settings > Ease of Access to disable it.
* The SCUF paddles reach Windows as whichever buttons you set in the SCUF software, so this app can only show reminders for them.
* Not tested on a real PC or controller.

--- SCUF photo, glide, white highlight ---
* The Controller page now shows the SCUF Valor Pro photo (renderer/scuf.png) with a soft shadow.
* The row of games on Home now glides smoothly sideways, even when you hold a direction.
* The green highlight is now white.

--- Button layout now uses the real SCUF photos ---
* Front and Back views use your SCUF Valor Pro photos (renderer/scuf.png and renderer/scuf_back.png).
* Back view: P3 and P4 are on the left of the picture, P2 and P1 on the right. The pairs are only labels, since Windows sees the paddles as whatever you set in the SCUF software.

--- Latest changes ---
* Button layout is now colourless to match the real controller; callout lines are white.
* Pressing Configure pops the page in. Front/Back flips the controller around.
* Test tab: the sticks do nothing until you press A on "Start test".
* Extra descriptive text has been removed across the software.

--- Flip fix ---
* Front/Back flip now works every time and swaps the picture in place.
* All button icons everywhere are uncoloured. The two stick-movement boxes (crosshair icons) were removed from the layout.

* Test tab: sticks navigate again; live readout only runs after you press A on Start test.

--- Names and lines ---
* Boxes show Xbox button names (Left bumper, View, Menu...). Lines end exactly on each control.
* Xbox button during Test only lights the 'Xbox button' chip. Flip animation plays once.
* Power: 'Exit'.

--- Sound, music and smoothness ---
* New: sound effects for moving, selecting, going back, tabs, menus, the guide, launching, and the startup; ambient music made live (nothing to download). Turn them off in Settings > Preferences > Sounds / Music.
* In the button layout the tabs only change with LB and RB.
* Play and Install are green, and all text is white.
* Lighter, smoother motion: the slow background drift and hero zoom are off, row scrolling and the highlight are time based.

--- Audio tab, RT flip ---
* Settings > Audio: music volume, sound effects volume, and on/off for each.
* In the button layout, the right trigger flips the controller between front and back.
* Cleaner controller photos; dashed trigger shapes on the front view show where the triggers sit.

* Font is now Poppins (bundled in renderer/fonts, open licence).

* Lines, dots and trigger shapes removed from the controller picture. Fonts: Inter and Inter Display. To use your own font, name it custom.ttf and put it in renderer/fonts.

* Controller widget uses the SCUF photo. Sound effects redone: softer, rounder tones with a little room echo.

* Front/Back buttons removed from the top left; the bottom hint shows the RT icon.

* Controller page: title icon removed; the controller floats slower and softer.

* Top bar: real settings gear; the extra 'find' icon removed. Controller widget restyled. Controller photos evened out (no backlight).

v25: Xbox button - hold (about half a second) opens the guide, quick press goes Home. Start no longer goes Home; on Button layout it switches profile 1/2/3. Font is now Poppins (drop your own into renderer/fonts/custom.ttf to override).

v26: profile buttons are no longer reachable with the stick/D-pad (Start only); cleaned controller photos.

v27: all Home game tiles same size, focused one grows.

v28: sticks keep working after Start switches profile; Home highlight follows instantly; photos re-cleaned.

v29: controller photos replaced with the two SCUF website images (cut out, no smoothing).

v30: sticks keep working after switching tabs with LB/RB on Button layout.

v31: photos from white-background SCUF images; startup intro can no longer be skipped; Home widgets restyled.

v32: intro cannot be skipped (helper A button removed too); Xbox One controller icon; detailed Customize your Home widget.

v33: "Ready to install" widget replaced by "Browse your apps" (Apps screen: YouTube, Netflix, Spotify, Twitch, Disney+, Prime Video, Google, plus Add app; X twice removes). Globe in the top bar opens the Apps screen. Xbox quick press always returns to the dashboard, also from the web browser.

v34: Apps screen uses real icons (installed Windows/Store apps via Start menu list; website icons fetched on your PC); browser opens on the console's own monitor and the console stays behind it for 3 seconds so the desktop never shows.

v35: after Chrome or an app opens, the helper finds the window and moves it onto the console's monitor.

v36: the Xbox button returns you to the screen you launched an app/web page from (not always Home).

v37: Xbox button also returns to the game page of a running game, and its Play button says Resume.

v38: guide Games tab now also has "Browse apps".

v39: sticks keep working after flipping the controller view.

v40: live news shelf under the widgets (Steam news for your games + PC Gamer, IGN, Eurogamer RSS). Press down from the widgets to reach it; A opens the article full screen, Xbox button returns.

v41: news opens in an in-app reader (LB/RB for next/previous); headline ticker, gently floating widget art, light sweeps, slow background drift.

v42: the Xbox button toggles: from an app/web page/game it returns to where you were in the console, and pressing it again goes back into that same window.

v43: a running game's Play button says "Running now".

v44: Home no longer scrolls sideways - shelves wrap downward. New "Trailers for your games" shelf (Steam trailers play inside the console). News and trailers refresh on their own.

v45: Games row scrolls left/right again (all games); everything else wraps downward. Trailers are now trending Steam games (top sellers, new, coming soon, on sale). New "Jump back in" shelf of recently played games.

v46: Fixed Home navigation - up/down now moves between rows (games, widgets, trailers, news) and scrolls the page; left/right only moves inside a row.

v47: Fixed news and trailers not loading (a bad edit had replaced the news fetcher). Shelves retry every 25s if empty; stick down always scrolls the page even if a shelf is still loading.

v48: Store built in (bag icon in the top bar): search Steam titles in-app, see prices/details/trailers, and open the Microsoft Store (searches for the game). Home gets a rotating "Featured on the Store" spotlight, Top sellers and On sale shelves, and shelves fade in as you scroll.

v49: Trailers now load (Steam gives http links; they are upgraded to https, webm fallback, thumbnail fallback). Featured banner uses the full 1920px art, sharper. Top sellers and On sale rows scroll sideways with 10 games each. All scrolling (up/down and sideways) replaced with one smooth time-based glide.

v50: Steam no longer offers plain mp4 trailers, so trailers are now downloaded from its streaming playlists and joined into a file (picture + sound played together). Featured banner only uses sharp wide art. Fixed Top sellers/On sale layout (class name clash).

v51: No repeats anywhere on the Store/Home (one game never shows twice across Featured, Top sellers, On sale, New, Coming soon; Steam hardware like Steam Deck is skipped). Trailers only for well-known games (40,000+ reviews or Steam most-played chart), biggest first. Trailer page now shows the game description, genres, release date and developer on the right.

v52: Fixed the dark top of Home (clock visible again; the top fade only appears once you scroll down). On the Apps screen, Start opens a menu: Open, Close the open tab, Close the open window or app, Remove from Apps. Start on a game page opens its ... menu.

v53: Restored the Store code (featured banner, Top sellers, On sale, Store search, details, Microsoft Store button) which a bad edit in v51/v52 had deleted, and fixed the trailers that depended on it. Tested the Steam handlers against a fake Steam server.

v54: Game news now only covers well-known games and big stories (GTA, Call of Duty, Elden Ring, Zelda, etc. plus whatever is top on Steam), English only. Dropped the per-library-game Steam announcements that brought in foreign or obscure posts. Added GameSpot.

v55: Fixed everything going grey: the v54 news edit had deleted the trailer/Steam helper definitions. All Steam handlers (store feed, search, detail, trailers, news) re-tested end to end against a fake Steam.

v56: Top sellers fixed (the front-page banner games now come from Steam own featured list so the shelf is never emptied; empty shelves hide instead of staying grey). Trailer sound rebuilt: picture and sound play through ONE player (no more glitching/replays). News also matches the games people play right now (Steam most-played chart + Deadlock, Fortnite, Overwatch, etc.). Polish pass: smoother screen transitions, glide-up selection, staggered card arrival, frosted menus, glowing focus.

v57: startup + sign-in fix: removed the rule that switched off every animation when Windows "animation effects" is off; hid the white selection frame over the startup screen; orb glow redrawn as a soft gradient (no square edges); sign-in title, users and background now fade/rise in.

v58: news = official updates from the most-played Steam games + popular-game press stories (titles only, refreshes every ~8 min); "Top sellers" is now "Most played on Steam" (Steam player chart); removed the blur/stagger animations from v56 that glitched.

v59: Home cleaned back to the console layout: profile + icon bar on top, row of your games, row of shortcut cards. Removed the news, trailers, featured, most-played, on-sale and jump-back-in shelves and their background loading.

v60: Home rebuilt in the Xbox layout (Jump back in row, My games & apps, Microsoft Store, widget tiles, Search + settings top right). Xbox-button panel now has Home, Library, Friends (your Steam friends with online / in-game / away / offline), and Recents. Friends need your Steam API key + a public friends list.

v61: library + Home tiles use sharp tall Steam box art (downloaded once, cached); Jump back in tiles smaller and grow when selected; removed "My games & apps" tile; Controller / Customize Home removed from the Xbox-button first tab; richer animated widget backgrounds.

v62: Home rebuilt to match the Xbox Series X dashboard video: starfield background, big tile + row of six, My games & apps + three wide tiles, Pins shelf, Customise/Search hint (View button opens Customise), "Signing you in" screen, gray guide panel with blue selection.

v63: Home now uses the 2026 console layout measured from your screenshot (Search + settings top right, Jump back in, My games & apps, Microsoft Store, friends / play / widget tiles, shelves, game art behind). The 2020 starfield Home is still available: Settings > General > Home style.

v64: Xbox account support through OpenXBL (free key from xbl.io, Settings > System > Xbox key): gamerscore on Home, Xbox friends with presence in the guide, games played on Xbox, and a "Most popular - Game Pass" shelf from Microsoft public catalog.

v65: removed Xbox account / Game Pass features; top bar icons back in the middle; smaller Jump back in tiles that grow when selected; compact, detailed widgets; white glowing selection again; entrance animations back on Home.

v66: faint white glow, Store icon/tile open the real Microsoft Store, tile row no longer clipped, app icon plates, Steam game info without a key, Settings focus recovery

v67: real box art for non-Steam games (SteamGridDB key optional, else Steam store poster by title)

v68: IGDB (Twitch client id/secret) + GOG catalogue added to cover and info sources

v69: Get artwork now runs the real box-art lookup (SteamGridDB/IGDB/Steam/GOG) and reports key errors

v70: tall 2:3 tiles so box art is never cropped; better title matching; Get artwork lists games it could not find

v71: controller flip is a real 3D turn (lift, tilt, edge thickness, shadow)

v72: the controller on the Button layout screen is a real 3D model (WebGL) that lifts, tilts and spins when you flip it

v73: 3D controller now uses your own Valor Pro photos (front, back) on a solid body with real thickness

v74: Button layout uses your SCUF render with a gliding 3D camera instead of the flat photos

v75: back to your front and back photos (new cut-outs) with depth: thickness, rounded edge shading, shadow, gentle sway

v76: Button layout shows your front/back pictures exactly as they are (their own shading gives the sticks depth) on a two-sided card that lifts, tilts and turns

v77: back of the controller now shows the back picture (the shadow filter was flattening the two-sided card)

v78: Home row 2 - Friends tile replaced by a Your games library widget; Play-now tile replaced by a stats widget (games / installed / hours). Friends still in the Xbox-button guide.

v79: controller no longer gets stuck after closing a browser/app/game (watchdog brings the console back); library covers no longer show a repeating strip at the bottom; Home tiles and widgets rounded and smoother, glow follows the rounding; profile picture is now a cropper (move with left stick, zoom with right stick/triggers, A to save, B to cancel) and you can drag a picture onto the window.

v80: all Home widgets redone (glass cards with drifting colour; stats = progress ring, hours, platform bar; library = fan of covers; clock sky by time of day; apps, controller, icon widgets, art widgets restyled).

v81: guide (Xbox hold) no longer closed by the away-watchdog; real hi-res site icons for apps (one-time refresh); big real Store icon; signing-in picture has no white outline.

v82: your Fortnite and Rocket League pictures are now their covers (covers folder; add more by dropping fortnite.jpg style files named with only letters/numbers); Home tiles less rounded.

v83: Fortnite/Rocket League covers padded to exact 2:3 so nothing is cropped; controller helper (mouse.ps1) restored to its original working version and the closed-app watchdog moved into its own separate watch.ps1 so it cannot affect the Xbox button.

v84: sign-in page redone as "Whos playing today?" with big round pictures and a blue selection ring, like the Xbox profile picker.

v85: sign-in title is "Welcome Back <name>" again.

v86: built-in startup animation and chime removed completely; with no startup video the console goes straight to the sign-in page, and with your video nothing else flashes at the end.

v87: Library: View button opens filters, Start opens the highlighted game dropdown; midnight star sign-in (twinkling stars, shooting stars); loading rings are faint glowing white.

v88: sign-in background is true black midnight (no blue).

v89: Store icon fetched straight from the Store app with retries (always shows); dropdown menus compact and quiet with a More submenu; library filter menu trimmed.

v90: Deadlock and Overwatch covers set from your pictures (covers folder).

v91: Store icon: tries the manifest logo, any logo png in the Store package, the installed-apps list, then the Store program icon; writes what it found to console.log.

v92: the cover box on a game page now shows the real cover (same as the library) instead of the wide screenshot, and updates when covers finish loading.

v93: Rocket League cover cropped to exact 2:3 (no padding).
v94: intro video centered (contain, true center); Deadlock description override.
v95: intro video volume 35%.
v96: fixed intro video offset (my inset:auto bug).
v97: intro video nudged 1.5% left (style.css, #introv transform).
v98: game page cover fills frame.
v99: removed intro nudge; video exactly centered.
v100: game cover thin frame, fills.
v101: game page: Steam/Epic/GOG/Ubisoft/EA logo instead of text; RAWG credit hidden on game page.
v102: game page full-screen cinematic layout (trailer is whole background, no cover frame, description behind the caret).
v102b: raised info block above the hints.
v103: selection frame snaps (no lingering) when opening description.
v104: Store icon cached+reapplied after redraws; News empty state focusable; null-safe results.
v105: Settings: pushing left on a slider at its lowest value leaves slider mode and returns to the tab list.
v106: Controller layout: front/back flip removed; 'Back' is its own tab (Console, Back, Desktop, ...).
v107: Controller layout tabs: Front, Back, Sticks, Vibration, Test (Desktop tab removed).
v108: Desktop/mouse mode: Enter key is now on Start (was X); existing setting migrated.
v109: binds: controller picture stays when changing tabs; Settings: B inside a category returns to the category list.
v110: Xbox guide: no second flash when friends/game status arrive.
v111: top bar icons uniform; Twitch uses bundled current logo (icons/twitch.png).
v112: midnight widgets (deep navy), smoother transitions on all selectable things, intro video cross-fades into sign-in before it ends.
v113: new midnight widget layouts (label + glow), motion-blur entrances everywhere, black cover removes the old-screen flash at startup.
v114: Achievements widget (Steam key), new 'Make it yours' widget, intro: black moment then slow fade-in with rising sound.
v115: Deadlock description = Steam store text.
v116: Download trailers from Steam: Library > More > Download all trailers; game page ... > More > Download trailer.
v117: achievements rewritten (tries every signed-in Steam account, uses played games); intro sound swells over the black screen.
v118: Library side panel now shows the game description (fetches it automatically when missing).
v119: Library shows your real Steam play time and last played (public profile + Steam key). Achievements widget opens its own Achievements page with every game and per-game achievement lists.
v120: Startup sound swells in decibel-shaped (even to the ear) and eases out during the cross-fade to sign-in.
v121: Intro sound louder; missing ratings filled from Steam reviews (and game info); trailers play with sound by default, pause the ambient music while playing, and fit the panel without cropping.
v122: Library trailer box matches each trailer's own shape (no black bars, no cropping).
v123: Library bottom bar shows the library icon.
v124: Achievements pages scroll with the controller.
v125: Achievements widget layout fixed so nothing overlaps.
v126: Guide Recents show real game covers instead of grey boxes.
v127: Recents covers fit whole inside their box.
v128: Settings is its own tab in the Xbox-button menu (removed from Profile & system).
v129: Removed 'Find a new game' from the Home tab of the Xbox-button menu.
v130: Removed the Search tab from the Xbox-button menu; Settings takes its place.
v131: Games & apps tab: removed Recently played; Browse your games uses the library (bars) icon, Browse apps uses the grid icon.
v132: In the Xbox-button menu the stick no longer moves between tabs; only LB/RB (or the mouse) switch tabs.
v133: Fortnite description + release year 2017; startup sound starts soft and keeps growing a little louder until the video ends.
v134: Library bottom bar uses the library (bars) icon.
v135: Fortnite developer/publisher Epic Games; startup sound now rises steadily from silence to its loudest at the end.
v136: Library item in the Xbox-button menu uses the library (bars) icon.
v137: Controller button layout (Front/Back) plays an entrance animation: controller blurs/scales in with a glow, buttons stagger in.
v138: Controller layout entrance is a clean fade-in (no front-to-back turn).
v139: Back tab only shows the four paddles (triggers/bumpers are on Front).
v140: Opening the Xbox-button menu hides the controller layout page behind it; menu scrolls clear of the hint bar.
v141: Controller layout: highlight box follows the entrance animation; Back tab no longer flashes the front (removed blur filter that flattened the 3D card).
v142: Real fix: controller card no longer animates opacity (that flattened the 3D card, flashing the front on Back); button boxes keep their centering during the entrance so the highlight box lines up.
v143: Removed the blue glow from the controller entrance; hint bar moves beside the Xbox-button menu so it never overlaps it.
v144: Removed the RAWG credit text; startup sound swells slower from silence (decibel curve) and keeps building to the end.
v145: Home top bar apps button uses the app (grid) icon instead of the globe.
v146: Download trailers works with Steam's new streamed (HLS) trailers; picture + sound are joined for playback in the Library panel and game page.
v147: Trailer sound: picture and sound files play side by side (kept in step); ambient music pauses while a trailer with sound plays.
v148: Trailer sound fades in from quiet to a lower normal level.
v149: Library and game-page trailers fade in over the cover art once playing.
v150: Trailers quieter; the picture before a trailer is the game's real cover, whole, over a blurred copy.
v151: Library trailer box is black until the trailer fades in.
v152: Trailer loudness lowered again.
v153: Home/Library background uses Steam's own wide artwork for each game (downloaded on demand), else the game's cover.

v154: Home background now uses each game's own current cover (blurred full-screen + crisp cover on the right) instead of Steam's old wide art.
v154b: Home background plays the selected game's trailer (muted), cover stays crisp on the right.
v156: cover backgrounds scale down to fit the screen instead of being enlarged.
v157: Home background = the game's current wide Steam store art (appdetails background/screenshot), full screen; cover stays on the right.
v158: Home = Steam's current library hero art full-bleed + game logo on the left (via the store's asset list), cover on the right.
v159: right-hand cover on Home is the normal game cover (not the wide art).
v160: Overwatch shows plain name (no '2'); text title when no logo; trailer fades in slower over the art.
v161: Overwatch uses Steam's real logo with the '2' trimmed off (auto-detects the orange 2).
v162: nicer launch screen (cover, logo, game art, glow); all console audio (music, sounds, trailers) is silenced while a game starts/runs, restored on Xbox button or exit.
v163: game page shows the wide art first, then the trailer fades in over it (no black box).
v164: no fade when moving between games (art/logo/cover instant), trailer starts 0.7s after you stop; logo shadow no longer shows the clipped 2.
v165: trailers download in the sharpest quality Steam offers (up to 4K/1440p); older 720p downloads are replaced when you run Download all trailers.
v166: Home art-to-trailer fade is quicker (starts 0.35s, fades 1.3s).
v167: widgets restyled as flat Xbox-style tiles (dark panel, small corners, accent strip, white focus ring).
v168: widgets simplified to flat Xbox tiles; home trailer waits for real picture (skips black intro) and fades in over 2.2s.
v169: Home trailer fade back to the earlier behavior (art first, trailer fades in slowly after 0.7s).
v170: no trailer plays behind the sign-in/intro; the first game's trailer starts (art first) once you reach Home.
v171: Library widget redone like Xbox 'Browse your games' (cover strip, controller icon, label).
v172: Customize widget redone like Xbox 'Customize your Home' (teal gradient, clouds, monitor-pencil icon).
v173: Achievements widget removed from Home -> Achievements tab in the Xbox-button guide; Microsoft Store tile now 'Browse the store' purple Xbox style; top bar score uses the G badge.
v174: controller battery icon + % next to the clock (XInput; only for wireless controllers; 4 levels).
v175: top bar icons redrawn like Xbox (library bars, apps box, Microsoft Store bag in the Game Pass spot, search, settings).
v176: game cards are Xbox-style small squares; the selected one grows; full cover shown over blurred copy.
v178: game cards sized 2:3 like the covers so the full cover fills each card (no crop, no bars).
v179: app tiles restyled (glow, big icon, same shape as games); Browse your apps widget sits next to Browse your games.
v180: bottom row is five equal-width tiles filling the row evenly.
v181: logo and side cover hide while you browse the lower shelves (they were showing through behind the cards).
v183: extra room under the lower shelves; scroll keeps the selected card fully on screen.
v184: lower shelf covers restored to full size; shelf scrolling position tuned.
v185: tighter gap between widget row and the shelves below.
v186: moving up/down between Home rows always lands on the first (left-most) card.
v187: top row cards same size as the shelf cards.
v188: apps smaller again; widget row no longer bounces; startup video gets a sharpen + contrast boost at playback.
v189: moving left/right in Home rows never scrolls the page (no bounce); intro video sharpening much stronger.
v190: cards resize instantly (no shaking when scrolling fast); row scroll no longer fights smooth-scroll.
v191: app tiles small squares again; rows have fixed height so the headings no longer jump when focus enters/leaves a row.
v192: 'Running now' fits the green button; the ... menu has Resume game / Close game while a game runs.
v193: while a game starts/runs the dashboard is fully idle (no video, sound, animation, blur); Xbox button wakes it, Resume idles it again.
v194: dashboard audio is muted at the window level whenever it goes behind a game (and the audio engine is suspended), unmuted when it comes back to the front.
v195: Xbox button mutes the game's own sound (Windows mixer) while you are on the dashboard; going back in unmutes it. Dashboard sound/trailers wake 1.3s after returning to avoid glitching.
v196: game sound is muted/unmuted instantly through the always-running helper (no process start), dashboard sound has no delay either; trailer player restarts itself if it sticks or loops.
v197: trailer sound no longer jumps back to the start when the picture stalls; the separate sound player is stopped when a game starts and never doubled.
v198: redesigned starting screen (cover left, logo/status/white bar right, Overwatch logo without the 2).
v198b: trailer sound never seeks more than once per 2.5s (rate-nudged instead), gives up on the sound if it keeps falling back to the start.
v199: closing a game always lands on the Home dashboard, never back on the game's page.
v200: after a game opens, if its window is not fullscreen the console presses Alt+Enter once (checked at 2.5s and 11s).
v201: closing a game keeps you on that game's page (reverted the v199 go-to-Home).
v202: while a game opens the console re-asserts fullscreen + topmost every 250ms so the Windows taskbar never shows around the loading screen.
v203: the console always stays fullscreen (F11 / window changes cannot leave it).
v204: autostart-on.bat / autostart-off.bat (start at Windows sign-in; the console opens on the intro video).
v205: autostart uses the Run registry key + startup delay 0 (was the delayed Startup folder); single instance lock.
v206: opening/leaving a game page is a fast crossfade (no blank gap, no staggered pop-in).
v207: the watcher also notices when a browser window you opened closes (window count drops) and brings the console back with the controller.
v208: after closing an app/tab the console re-grabs focus (retries for 9s) so the controller works; Start opens the app/game menu on the Home dashboard too.
v209: closing a tab/app now always switches the controller helper off and gives the console focus in one step (takeBack).
v210: app menu shows only 'Close app' for Store/Windows apps and only 'Close tab' for websites.
v211: every logo is trimmed to its real lettering (same size/place for all, fixes Rainbow Six Siege).
v212: logos scale to fill their box (Siege logo was a small file).
v213: logos are trimmed (and Overwatch's 2 removed) in the app itself and saved as wt-<id>.png (the page's canvas could not read the pictures).
v214: small (blurry) logo files are replaced once by Steam's bigger 2x logo when one exists.
v215: small logos are enlarged smoothly and sharpened in the app (Siege logo).
v216: Browse the store widget: line removed, icon bigger and centered.
v217: Browse the store: only the real Store icon, centered; the drawn bag hidden.
v218: 'Signing you in' fades out slowly over the dashboard.
v219: the dashboard is built under the black first, then the black fades alone (smoother).
v220: Overwatch logo: tiny trademark speck at the right removed (logo regenerated).
v221: sign-in: avatar/text fade out on black first, then black clears; the home trailer waits until the fade is over.
v222: startup video goes through a WebGL shader: smooth bicubic enlargement, sharpening, contrast, stray streak removed. Falls back to the normal video if the picture cannot be read.
v223: the startup-video sharpening shader is now OFF by default (Settings > Preferences > 'Sharpen startup video (beta)'); the plain video plays as before unless you switch it on.
v224: startup video: black patch over the stray light streak to the right of the logo (always on, no graphics shader needed).
v225: startup video louder (70%), sharper; no selection outline while the sign-in black fades into the dashboard.
v226: intro audio ramp now reaches full volume; overall UI polish pass (depth, glass, rounding, text).
v227: Settings: the right side is entered with A only, not the stick or D-pad.
v228: removed the Home tab from the Xbox logo menu.
v229: big Overwatch logo keeps its little (R) mark (no longer trimmed off).
v230: Xbox-style game cards (scrim + title, ring with gap on the selected card).
v231: square Xbox-style game/app tiles (whole art shown, selected tile grows and shows its title).
v232: square Xbox-style covers built from each game's wide art + logo (ws-<id>.jpg), used on Home tiles.
v233: squares for every game incl. shelves (Ready to install); covers without a built square fill the square; squares build 6 at a time.
v234: games without wide art get a square built from their own cover, shown whole on a blurred copy (nothing cut off).
v235: real Xbox / Microsoft Store square covers (BoxArt) looked up by title for every game, cached in xbmap.json; falls back to built squares.
v236: square covers load in parallel (fit-whole first, then wide-art, then Xbox); nothing is cropped while waiting.
v237: Epic games use Epic's own cover art (fitted whole in the square); Watch Dogs no longer matched to Watch Dogs 2 (sequel-number matches rejected).
v238: Xbox art for every game (Epic too) and, when the Store has the exact app, for apps.
v239: Xbox cover lookup also tries an unrestricted search and writes what it found for each game to the log.
v240: Xbox cover lookup rewritten around the Store's own title search (productFamilies/autosuggest); strict title match (no sequels/spin-offs); fresh cache.
v241: Xbox cover lookup rewritten against Microsoft's real answer format (checked live): title search, then the game's own listing for the 1080-2160px square BoxArt. Strict matching (no Legion/2/Reign mix-ups).
v242: Xbox lookup tries several spellings (finds WATCH_DOGS, Watch Dogs 2, Overwatch 2), runs 4 at a time.
v243: the Xbox square cover now stays put (the slower Steam poster no longer replaces it afterwards).
v244: the real Xbox cover now also replaces the old hand-made covers in the covers folder (Overwatch, Fortnite, Rocket League were being held back by them).
v245: the big card on the right of Home is now a square (same Xbox art as the tiles), kept large.
v246: the big square card on Home made smaller (40% of screen height).
v247: the Library shows the same square Xbox cards.
v248: the 'Your games' widget pictures use each game's real cover / Xbox art (Deadlock and Overwatch were showing wrong art).
v249: app tiles show the real Microsoft Store art filling the square (kept across redraws).
v250: apps the Store lacks (Google) get a full-square tile from their own icon; other apps keep the exact Store art.
v251: Apps page tiles use the same full-square Store art.
v252: removed 'Add website' from the Apps page.
v253: 'Add app' opens the Microsoft Store's Apps page (instead of the long installed-programs list).
v254: 'Add app' opens the Microsoft Store's Entertainment page (the documented link; the Apps one made Windows open Documents instead).
v255: Browse your apps widget remade as a fan of the real Store app art
v256: Add app opens the Store home page (the category link opened Documents)
v257: Store from Add app - the controller no longer combines with the mouse (focus grace while it starts)
v258: Add app / store buttons open the Microsoft Store website in Chrome (the Store app took the controller itself and fought the mouse mode)
v259: Store buttons open the Microsoft Store app again (website version removed)
v260: Store: pointer moves to this monitor; controller shielded from the Store app (experimental) so mouse mode drives it
v261: shield diagnostics in console.log, earlier shield start
v262: Add app removed; Browse your apps widget restyled like Your games
v263: guide Recents use square game covers
v264: shipped tall covers (Deadlock) fill the square like Recents on Home and Library
v265: Deadlock (shipped cover) square crop is no longer blocked on Home/Library
v266: Ready to install in alphabetical order
v267: Steam games only count as installed when fully installed and the folder exists
v268: Jump back in shows installed games only
v269: games whose Steam folder/install record is gone count as not installed right away; Steam play dates refresh every 2 min
v270: clicking out pauses the trailer; clicking back in snaps unfinished animations/hover to their final look
v271: clicking onto another screen gives the controller back to the dashboard; Steam installed check reads the install record directly; trailer no longer pauses
v272: Home tiles paint their cover themselves (no pseudo-element) so a tile can't show a stale half-size cover
v273: Store: the controller is only the mouse (no D-pad/keys), shield retries faster
v274: Microsoft Store buttons removed (Home widget, top-bar bag, classic tile, Store page button)
v275: no more pulling focus back to the dashboard when you click on another monitor
v276: the 'close detector' no longer takes the screen back while your pointer is on another monitor
v277: non-Steam games get the Microsoft Store's wide hero picture as their background (heroes:store)
v278: non-Steam game background pictures are fetched ahead at startup
v279: trailers from YouTube (newest official trailer, via yt-dlp) for one game or all; Download all trailers asks Steam or YouTube
v280: trailer download progress stays at the bottom until done
v281: YouTube trailer = newest official upload (also searches by upload date, checks up to 10 candidates)
v282: Delete all trailers (Library > menu > More)
v283: YouTube picks also accept official gameplay / season / collab trailers; newest wins
v284: each downloaded trailer becomes playable right away (no waiting for the whole batch)
v285: YouTube trailers: no console-branded ones, 1440p-4K (VP9/AV1) when available, original-language sound from the same video (skipped if missing), no sound fade-in
v286: YouTube trailers: right game only (Watch Dogs 1 vs 2/Legion), PlayStation exclusives may keep their PlayStation intro
v287: YouTube trailers must come from an official source (verified / game or publisher channel); highest resolution among the newest official ones
v288: Deadlock gets the best community-made trailer (no official one exists)
v289: each chosen YouTube trailer is downloaded at the highest resolution the video has (up to 4K), logged per game
v290: YouTube picker: Deadlock trailer removed (saved one cleared); movie/film/news channels, concerts, tours and 'Game x Other' collabs rejected; subtitle games like Watch Dogs: Legion rejected; Rainbow Six / Tom Clancy's names fixed; Detroit allowed PlayStation channel.
v291: trailer-links.txt - paste 'Game = YouTube link' lines to choose exact trailers.
v292: trailer-links.txt lists every game name, just paste links.
v293: trailer-links.txt filled with your 57 links.
v294: Red Dead Redemption 2 uses its Steam trailer (= steam in trailer-links.txt).
v295: per-game Steam trailer download replaces an existing trailer.
v296: no ambient music over the startup video.
v297: game page: per-game accent colour, description teaser, playtime bar, status dot, glow and staggered entrance.
v298: game page neutral colours (no pink), second row of facts (platform, release date, achievements/publisher).
v299: game page details are white/grey only, no added colour.
v300: game page: achievements total fix, third row (developer, publisher, critic score), bars grow, sweeping shine, pulsing status dot.
v301: Home: focusing an app changes the background to that app's colour, name and cover.
v302: apps: the background is a picture of the app's own home page (taken once, refreshed weekly).
v303: apps: plain grey background (no screenshots), big mark on the left is the app's own logo cut from its cover.
v304: apps: right cover back; big left mark is the app's real brand logo (Simple Icons), falling back to the cropped cover.
v305: YouTube mark triangle filled white; app logo never left empty (falls back to cover, then name).
v306: apps: the big left logo is cut from the app's own cover (dark/coloured backgrounds removed, white ones become a rounded card); canvas read fixed (crossOrigin).
v307: apps: live midnight sky background (stars, ambient light, shooting stars) like the sign-in page.
v308: richer night sky (more stars in 3 drifting layers, nebula glow, 9 shooting stars) on sign-in and app backgrounds; app left side shows the name only.
v309: Rocket League & other non-Steam games get their real Steam logo by title; apps get their Wikipedia logo (white); night scene with aurora, moon, constellations, mountains, fog on sign-in + apps.
v310: night scene darker (near-black), constellations removed.
v311: games without a Steam logo look up Steam by title, then the Epic Games store's own ProductLogo.
v312: Epic games get the Epic launcher's own logo (DieselGameBoxLogo from the launcher catalog entry in the game's link), then Epic store search, then Steam.
v313: logos folder: your Fortnite, Rocket League and Fall Guys logos are used for those games (copied to the data folder on first use).
v314: eFootball logo added to the logos folder.
v315: Home: going up to the top bar and back down (or between rows) returns to the card you left, not the start of the row.
v316: logos rebuilt at high resolution with smooth edges (no blur).
v317: bundled logos (eFootball, Fortnite, Rocket League, Fall Guys) now override Steam's logo too.
v318: Watch Dogs logo (transparent PNG from logos-world.net, downloaded once by the console and turned white).
v319: NBA 2K26 official logo (from 2K's site, downloaded once by the console).
v320: Fortnite logo rebuilt from the official vector (3000px wide, sharp).
v321: Watch Dogs and Watch Dogs 2 get their own background (no more sequel mix-up); Fall Guys uses the 3000px official logo (old one kept as backup).
v322: logos redone for 55 games + YouTube/Netflix/Spotify/Twitch/Google from SteamGridDB (official, large, transparent), downloaded once each; Steam logo is the fallback.
v323: logos matched to the card art: Apex, Dead Island 2, RDR2, Before the Storm, CoD, MultiVersus, Overwatch, Fishing Planet, RE2/RE3, R6 Siege; Destiny 2 back on Steam's.
v324: RE2 subtitle removed, RE3 back to the red R/E logo, World War Z with the red Z, It Takes Two matches the cover.
v325: focus frame no longer spills off the row/screen when scrolling fast; rows aim from where they are heading; redraws keep your scroll position; RDR2 uses the card's own logo, RE3 matches the card.
v326: midnight sky rebuilt from scratch (painted milky way, glinting stars, nebulae, moon, aurora, random shooting stars, layered mountains with pines, lake reflection) on sign-in and app backgrounds; the guide menu is now frosted midnight glass with its own starry sky.
v327: night sky darkened to black midnight (much less blue)
v328: midnight sky rebuilt in black and dark grey (no blue); twinkling stars, swaying pines, shining moon, drifting clouds, floating lights; new dark ambient music (drone, pads, wind, bells)
v329: removed the sun-like rays around the moon (soft glow only)
v331: midnight scene remade dark and simple (flat moon that no longer pulses, flat mountains, swaying pines, drifting clouds, lake); it is now the whole home dashboard background (no game art, no trailers); new richer ambient music
v332: moon pulse fixed (an old star rule was hitting the moon); lake now looks like water (waves, ripple rings, moon path, wobbling reflection); everything in the scene moves; calmer ambient music
v333: scene recomposed: mountains rise straight from the water, pines stand along the shore (no hill in front), lake mirrors them in wobbling strips
v334: lake has real curving waves (rolling swells) and a wavy moon path instead of straight lines
v335: lake put back to the v333 look; trees fixed (bigger, crisper, lit haze behind them so they read as silhouettes)
v336: scene rebuilt cleanly from scratch: edge trees no longer clipped (tall trees moved inside the screen, reflection lined up with them), about half as many animations, the dashboard scene sleeps while hidden
v337: moon glare on the water (glowing column with shimmering sparkles) replaces the plain lines; sign-in page and dashboard now use the identical scene
v338: lake is livelier: many circle ripples (three rings each, bigger toward you) and random splashes with a water crown, flying drops and spreading rings
v339: new mountains (3 ridged ranges, moonlit slopes), new spruce + round trees, ripples/splashes/jumping fish at random places, water-themed music (bloops, lapping water, sparser notes)
v340: mountains back to the earlier hills, new pine/poplar trees, a real shoreline (dark bank, lapping waterline, reeds) so the lake ends before the forest
v341: all-new trees (branching bare and leafy trees, round puff trees far away)
v343: brand-new deep-space wallpaper (ringed planet with orbiting grains, 3-depth drifting stars, gas clouds, asteroids, satellite, outpost on a dark ridge); water sounds removed
v344: back outdoors: Milky Way, moon, three jagged mountain ranges with mist, thick row of pines, shore, lake with random ripples/splashes/fish
v345: back to the original wallpaper look (Milky Way, moon, wide jagged mountains, row of tiny pines, shooting stars), in black and dark grey; no lake
v346: closer to the original wallpaper look: lighter mountain body, bigger pines, trees raised
v348: moonlit lake in a cartoon forest (redrawn from the Unity Vintage Cartoon Forest preview layout): framing spruces, moon with cloud streaks, mountains, pines, mirrored lake, grass; all animated
v349: wallpaper is now your exact picture (renderer/wallpaper.png, unchanged) with animation laid over it: wobbling reflection, glitter, ripples, mist, clouds, fireflies, shooting stars. Replace wallpaper.png with a sharper 16:9 copy any time.
v350: wallpaper.png upscaled with smoothing + mild sharpening (still the same picture). Swap in a bigger 16:9 copy for true sharpness.
v351: wallpaper is your night mountain valley picture (renderer/wallpaper.png, unchanged) with twinkling stars, drifting clouds, valley mist, fireflies, shooting stars.
v352: wallpaper is the dark night-valley picture (renderer/wallpaper.png, unchanged) with swaying forest, twinkling stars, drifting clouds and mist, fireflies, shooting stars.
v353: livelier wallpaper (slow pan, stronger swaying forest, moon halo + slow light rays, drifting light gusts, dust motes, 34 fireflies, more shooting stars) and serif title/heading font.
v354: moon rays removed; soft natural halo + wide glow instead.
v355: titles/headings now light, widely spaced capitals (Inter Display) instead of the serif.
v356: whole UI now uses the round cartoon font Fredoka (renderer/fonts/Fredoka.ttf, SIL OFL); name no longer bold.
v357: font Grandstander; removed the jittery strip sway; smooth slow pan; bats, heat-lightning, fog banks, blowing leaves, sky ribbons; crickets + owl sounds; names capitalised.
v358: fonts Lilita One (titles) + Baloo 2 (rest); wind trails; fireflies/stars/leaves/dust re-appear in new random places; tile mosaic recoloured to smoky greys.
v359: wind trails are now tiny, faint and far away; smoother glide; bats bob smoothly.
v360: wallpaper upscaled to 3840x2160 with edge-preserving sharpening; fonts Nunito (all) with heavy Nunito titles.
v361: three clouds cut out of the picture now drift across the sky, new ones keep arriving; lightning lights a real cloud from inside (glow underneath); ridge glints, moths round the moon, watching eyes in the forest.
v362: fixed the glitch beside the moon (cut-out no longer touches it, hole filled by inpainting); every cloud now moves: loose clouds drift, the banks that hug the mountains churn with sliding light and shadow.
v363: removed the moving cut-out clouds, the sliding-light overlays and cloud lightning (they caused glitches); original clouds back; stars now sit exactly on the picture's stars and fade fully before moving.
v364: big sparkle stars redrawn crisp and exactly placed (originals removed from the picture); wind trails redesigned (fine strands, S-curve, curl, ~10s glide); forest sways as a smooth travelling wave.
v365: wind redesigned again: thin tapered breeze streaks in small loose groups, slow drift and fade.
v366: guide menu is plain see-through black glass; its own wallpaper removed.
v367: 'Your games' widget is one plain grey tile (no rows); widgets dark smoky glass.
v368: wind = small curved wisps (bright stretch travels along an S-curve); all widgets transparent black glass, no blue/mosaic
v369: Apps and Library screens show the dashboard wallpaper behind transparent glass panels
v370: tiles/widgets grow and shrink smoothly on focus (no shape snap); top bar focus = white outline like the tiles
v371: wallpaper animations run on the Apps and Library screens (were paused)
v372: focus frame takes the card's shape instantly (no circle-to-square morph); dashboard title and section label closer to rows
v373: removed tile width/height animation so rows no longer shake when scrolling fast
v374: pressing down on the last dashboard row no longer scrolls the page; removed the 'Jump back in' heading and the name text over games that have artwork
v375: 'Jump back in' restored; hugs the row and lifts up over the selected card
v376: Library filter button can no longer be reached with the stick; View button only
v377: row title lifts only when the first game is selected
v378: Apps screen opens with the same staggered pop-in as the Library
v379: shelf titles (Ready to install...) hug their row and lift over the first cards
v380: row titles smaller so they fit over one card; they lift only over the first card
v381: game page uses the dashboard look - dark glass boxes, white outline focus, no green Play button
v382: on the home page RB jumps to the last card in the row, LB to the first
v383: moving off the shelf onto the widgets/top bar puts the background logo back to the top-row game
v384: trees/forest sway clearly (about 6px smooth wave); more fireflies, mist and leaves
v385: mountains no longer move; only the near tree tips lean in wind gusts every 6-15s (five slices, top leans most)
v386: trees bend with a gust that travels across the picture (shader, no cut pieces, far trees sway less, mountains never move); music starts right away
v387: tree sway redesigned - smooth single-lobe lean with slow soft ripple, wider weight halo so tips never clip, no high-frequency jitter, longer gentler gusts.
v388: sway much fainter; added sway to far-left back treeline and top-right trees; removed stray sway on a mountain.
v389: removed glowing eyes.
v390: polished fireflies (soft glow, organic drifting path, size variety), twinkles, motes, big sparkle stars.
v391: music held silent until the intro video ends (no blip); every particle (twinkles, dust, fireflies, leaves, glints, sparkle stars) now respawns at a brand-new random spot/size/speed each time; sparkles hop between random stars.
v392: big stars redesigned as soft glowing cores with hair-thin rays; all particle fades/moves now use finely sampled smooth curves (no stiff snaps).
v393: big stars grow from a tiny point (no dim grainy disc before shining); leaves and dust drift about 2.5x slower.
v394: small twinkles no longer spawn near the big sparkle stars and are crisper (the blobs gathering around them are gone).
v395: big stars restored exactly as in the original picture; the glowing sparkle overlay removed.
v396: no twinkles or dust spawn anywhere near the big stars.
v397: big stars removed; all painted stars removed from the picture and replaced by 150 random stars that each pick a new spot (only open night sky), size, brightness and life every time.
v398: stars fade in/out over 14-30 s with a soft curve, no size pop.
v399: smoother sign-in page: fewer/lighter particles (100 stars, 30 fireflies, 22 dust), no blur filters, lighter animation curves, tree-sway canvas capped at 2560 wide.
v400: game logo/cover hide on the middle row too (not only the bottom shelves).
v401: View button on Home opens Achievements; Achievements (and per-game list) use the same night-sky wallpaper as Apps/Library with black glass cards, white progress bars, stat chips and an overall progress bar; all colour removed.
v402: Achievements redesign: big progress ring header, 2-column glass cards with the same cover art as Home (Xbox square / poster, real Steam cover for games not in your list), progress rings; per-game page shows the real Steam achievement badges (greyed when locked), unlock dates and rarity; Steam games only.
v403: backing out of a game's achievements returns to that game (scrolled into view); cards no longer run under the clock/battery; Achievements page lists only games in your library (totals recomputed).
v404: backing out of a game page returns to the same shelf card on Home (scrolled into view) instead of the top.
v405: controller battery shows a charging bolt (reads Windows' charging state; also shows when plugged in by cable); Achievements: trophy-room header with rank, grouped shelves (Completed / Almost there / Keep going), cards glow with their game's art, rarest-unlocked badge strip on each game page.
v406: Achievements rebuilt: fixed header (nothing cut off at the top), only the shelves scroll under a soft fade, poster-style game cards (cover, percent pill, PERFECT tag, progress bar), stat tiles and rank in the header.
v407: achievement page titles use the same heavy rounded weight as the rest; header keeps clear of the clock and battery.
v408: achievements page scrolls exactly row by row: the focused card always lands fully in view, no more jumping or cut-off cards
v409: achievements: opening a game's achievements and going back is a smooth crossfade, the list comes back at exactly the same scroll spot (no more flying through the page)
v410: achievements: fading old page keeps its scroll spot, achievements fade in when loaded; ambient music fades in slowly and smoothly
v411: opening an app (YouTube etc.) now stays open until you close it: the watcher no longer mistakes the browser's little helper windows or a window switch for the page being closed
v412: Epic and Ubisoft games: the game window itself is brought forward and made fullscreen like Steam games (retries while the launcher starts it, and still takes over if it opens late)
v413: covers are sharp: Steam 1200x1800 posters, biggest SteamGridDB art, full-size IGDB covers; old small covers get re-fetched once
v414: Close game really closes Epic/Ubisoft games: finds the game by folder, by its window and by every process seen, force-closes anything left, and only says closed when it is gone
v415: Epic/Ubisoft launch: the loading screen stays fullscreen on top until the game's real big window is open (ignores launcher splash windows), just like Steam games
v416: game loading screen no longer flickers or gets stuck: waits for the big game window, but never longer than 12 seconds on a small window; calmer keep-on-top
v417: setup.bat runs Electron's download step directly (newer npm blocks install scripts, which caused 'Setup FAILED')
v418: game handoff: the game's real window is brought forward and confirmed to have the focus BEFORE the loading screen leaves (no taskbar flash), Alt+Enter only goes to the game itself, and the game keeps the screen for a few seconds after
v419: games whose files are not where the launcher says (Rocket League on Epic) are found by their new big window, so the loading screen no longer stays on STARTING and Close game works
v420: loading screen can never stay stuck: the game is recognised by what is in front of the screen, by its new big window, or after 45 seconds the console steps aside and keeps looking; the log records what it sees (launch watch lines)
v421: Epic/Ubisoft launch rebuilt: one look per 1.5s at every window (folder, title, size, new, in front); hard 40 second limit so the loading screen can never stay stuck; log shows every window it sees
v422: a game that opened minimized or hidden behind the console (Rocket League) is found by its folder/title, restored and brought to the front with keyboard focus
v423: games protected by anti-cheat (Rocket League) hide their file path from Windows, so the console now follows them by window title and program id: loading hands off to the game, the page shows Running, and Close game works
v424: the loading screen now shows what the console sees (small line at the bottom) so a stuck launch can be diagnosed from one screenshot; a running or starting game is never mistaken for a closed page
v425: if the game cannot be found the console shows a report on screen for 40 seconds (photograph it); asks the Epic/Ubisoft launcher a second time if nothing opened after 14 seconds
v426: the console also looks for any program named like the game (even with a hidden window or hidden path) and shows a report line after every handoff naming exactly what it handed over to
v427: the loading screen stays until the game's window has grown to full size (the small white start-up window no longer triggers an early handoff), so the desktop never shows
v428: all games (Steam too, like Dead by Daylight) stay on the loading screen until the game's real big window is open: anti-cheat splash windows no longer end the loading early
v429: pressing Home a second time takes you back to the game (its real window is found again, restored and brought forward, also for anti-cheat protected games)
v430: the console only hands over to the game's own big window: screenshot tools, overlays and anti-cheat splash windows (SnippingTool was picked by mistake) are ignored
v431: loading screen is clean (no text, no selection frame); games whose program name has no spaces (DeadByDaylight) are now recognised, so the hand-over to the game works
v432: Home is instant in every game (first press goes to the game page at once, second press straight back using the remembered game window); game sound is restarted while a game opens so it never starts silent, and covers every program of the game
v433: loading screen appears instantly and fully opaque (no game page flash), console re-asserts top every 0.1 s and on blur, window locked to exact display bounds (no taskbar flash / bottom crop)
v434: loading bar fills slowly and smoothly then completes at handoff; cover no longer slides in; console stays above the taskbar every 0.1 s during launch and for 7 s after a game closes (retries focus) so the taskbar no longer shows or sticks
v435: loading bar eases in one smooth curve (no speed-up at the end, swap waits for it); everything behind the loading screen is hidden instantly; loading screen background no longer fades to a dark bottom band; Close game puts the console on top before the game is closed so the taskbar never shows
v436: Close game waits until the console is truly the foreground window before closing the game, so the taskbar never shows
v437: a native pin keeps the console above every other window every 10 ms while a game opens (launcher/splash windows can no longer flash over it); released the moment the game takes over
v438: the console is pinned above the taskbar and every other window whenever it is the thing on screen (no game running, no app in front, no on-screen keyboard), not only while launching
v439: the Windows taskbar is hidden for as long as the console runs (and restored when it quits), so it can never flash when a game opens or closes. To keep the taskbar, create an empty file named keeptaskbar.txt next to main.js.
v440: taskbar hiding removed (the taskbar always comes back, even if an earlier version hid it); game-page trailer fades out before the end and back in on restart, and is dimmed, so the page no longer flashes colours
v441: the taskbar auto-hides while the console runs (so it cannot pop up when a game opens or closes) and your own taskbar setting is restored on quit, or at the next start after a crash. Put an empty keeptaskbar.txt next to main.js to turn this off.
v442: only the taskbar on the console's own monitor is hidden while the console runs (the other monitor's taskbar is never touched); it is restored on quit and at every start. Taskbar auto-hide from v441 is no longer used. keeptaskbar.txt next to main.js turns this off.
v443: opening an app (YouTube etc.) is now a smooth transition: the page softens, the app card rises, the browser opens underneath the console, then the console fades away to reveal it
v444: the app-opening card now shows the app's real tile/icon (was a grey placeholder)
v445: YouTube is back in Apps (and always has its place); removing apps and games is turned off
v446: installing a game shows an Installing % button with a fill bar and the time left, then turns into Play when the download finishes (Steam and Epic; other launchers show the button normally)
v447: windows that Steam, Epic, Ubisoft, GOG, EA or Battle.net open on the console's monitor while you install a game are moved to your other monitor
v448: uninstall confirmation windows from the launcher now come to the second monitor too, and the game page updates when the uninstall finishes
v449: after using the mouse on the other monitor (confirming an install etc.), pressing any controller button gives the focus straight back to the console
v450: the console takes the focus back after you use the mouse on another monitor (2 s idle) so the controller never stops working; unnamed Microsoft Store packages no longer appear as a grey tile in Your games
v451: controller keeps working on the console while another monitor has the focus (navigation is passed through), unnamed Microsoft Store entries are removed from the saved library, and an unconfirmed install turns the button into Confirm install (press again to bring the launcher window back; it resets after 3 minutes)
v452: controller presses reach the console directly while another monitor has the focus; the console takes the focus back 0.6 s after you stop clicking, and keeps it when a launcher window is moved to the other monitor
v453: the console no longer takes the focus back on a timer (so you can type in other windows); it takes it back only when you press a controller button or move a stick
v454: the white focus outline stays on the Installing button when the progress line appears (it was left behind, boxing the text)
v455: controller sticks and buttons bring the focus back to the console from any page whenever you are working on the other monitor; the white outline lands on Play when an install finishes
v456: every pop-up window that opens on the console's monitor while the console is on screen (uninstall confirmations, Windows prompts, installers, settings windows) is moved to the other monitor and brought to the front there; launcher windows that were minimised or hidden behind others are brought forward
v457: removed the 'Your games' row from Home; the controller helper is restarted automatically if it ever stops and now writes what it sees to console.log
v458: the controller helper itself now takes the focus back to the console on any button or stick press while you are on the other monitor
v459: pop-ups that a launcher re-shows or already had open (Steam's uninstall box) are now moved to the second monitor too
v460: controller helper compile now references System.Core explicitly (Windows PowerShell 5.1), and the log notes if the helper never reports ready
v461: the taskbar on the console's monitor is hidden only while the console window is actually visible (it comes back whenever the console is hidden or minimized)
v462: fixed the controller helper failing to compile on Windows PowerShell (a variable name clash) - this was why the Xbox button, Home and focus return stopped working
v463: Xbox button hold opens the menu faster (0.38 s), and a restarted controller helper gets its settings again
v464: taking the focus back to the console from the other monitor is now instant (no wait, lighter stick trigger, no input pause after focus)
v465: the Xbox button acts the moment it is pressed (no wait for release); holding it 0.3 s opens the menu
v466: any controller input while another program has the focus now brings the console back at once, on any monitor and any page (retried until it has the focus)
v467: fixed the controller helper crashing when a stick was pushed fully to one side (this stopped the Xbox button and controller completely); it also restarts faster
v468: no accidental focus grab from small stick drift; pressing the Xbox button on Home no longer redraws the page
v469: you can open a screenshot tool or Alt+Tab to another program on the console's monitor while the console rests (it no longer covers it); the console no longer pulls the focus back a few seconds after the Xbox button if you clicked elsewhere
v470: found why the console grabbed the focus by itself after the Xbox button: its keep-on-top timer re-activated the window every 0.1 s for 7 s; it now only does that while a game is opening, and background focus checks no longer override a click you made
v471: a resting stick no longer counts as input (needs a fresh push), and the log now says what happened just before the console took the focus
v472: the push of the stick that brings the focus back no longer also moves the selection (hold it as long as you like, it only moves once you let go and push again)
v473: back to the v471 controller helper (v472 broke it); the first stick push still only returns the focus
v474: the focus return fires once per controller push and is skipped while you are using the mouse or keyboard (no more repeated grabs after a click)
v475: the mouse check for the focus return now only looks at the mouse itself (v474 counted the controller as mouse use and blocked the focus return)
v476: the focus return retries a few times within 0.2 s if Windows refuses the first attempt
v477: focus return is now level-based (a held stick or button keeps asking every 50 ms until the console has the focus), with a shorter mouse guard (0.15 s)
v478: games that you launch open where they are meant to (on the console's screen): the pop-up mover is paused while a game starts and never moves full-screen or game windows
v479: smooth hand-over for the Xbox button while a game runs: the console fades in when you press it, and fades out before the game comes back on the second press
v480: while a game runs, moving the controller after clicking the other monitor brings the game (main screen) back to the front
v481: the Xbox/Home button now plays a soft, slow, airy swell instead of the short 'back' blip
v482: the Xbox/Home button uses the original 'back' sound again
v483: while a game starts, the console keeps raising itself over everything again (as before v470), so nothing can show over the loading screen
v484: Fortnite has the new cover art (tall cover from your picture) and its Xbox square is fetched again from the Store once
v485: Fortnite's tall cover (loading screen) is fetched from the Xbox Store in its big size, so it is sharp; your picture stays as the fallback
v486: the Store background pictures of non-Steam games are looked up again with the strict title match (a sequel's art, like Watch Dogs 2 for Watch Dogs, can no longer stay saved)
v487: games that are not on Steam (Ubisoft Connect, Epic...) take their background from the Steam page with exactly the same name first (Watch Dogs gets Watch Dogs art, not Watch Dogs 2), and the Microsoft Store only as a fallback
v488: the row titles on Home lift up and stay visible while you scroll along the row (not only on its first tile)
v489: a Home row title lifts only while the selected game is the first one you can see in that row, and drops when it is not (v488 reverted)
v490: Home row no longer shakes when scrolling left after RB (the glide re-checks the row's end every frame).
v491: RB/LB row jump is quicker and a left press stops the old glide; row titles lift whenever the selected card reaches the title's text.
v492: row title no longer flickers while sweeping right to left (stays up, drops on the second game or when you stop).
v493: row title drops back down once you stop (only stays up while a card really covers it).
v494: row titles fixed in place and smaller; row glide keeps re-aiming while cards resize (both rows).
v495: titles back to original size; up on the first game and while sweeping left, down once you stop.
v496: bottom row title is now 'Install next' (same length as 'Jump back in').
v497: row titles centred over the first small card; faster drop.
v498: Home rows run to the screen's left edge (no mid-page cut-off); titles line up with the first card's left edge.
v499: rows clipped at the page edge again (undid v498's full-width rows); title alignment kept.
v500: selected card enlarges less (9.4 instead of ~10.6-11).
v501: bottom row title raised position matches the top row.
v502: row title drops ~0.15s after you stop (was ~0.4s).
v503: no delay dropping the title after RB/LB jumps or moving right.
v504: Rocket League opens on the main screen (launcher pop-up mover skips it); Rocket League cover is fetched sharp from the Epic store.
v505: Install opens the store app if it was closed, waits for it, then sends the install (Ubisoft Connect install link when its id is found).
v506: Xbox button does nothing while you are already on the Home dashboard.
v507: opening the guide menu no longer switches the background to the first game.
v508: pressing/holding the Xbox button never swaps the background to a game logo (hero locked while pressing, guide open and just after).
v509: Ubisoft install finds the game id (built-in for AC Odyssey, plus a public id list) and opens the install confirm.
v510: Ubisoft install: ids built in for AC Odyssey, Watch Dogs, Watch Dogs 2, Ghost Recon Wildlands; others from a public id list; log shows what failed.
v511: Far Cry 5 Ubisoft id added.
v512: cancelling an install in the launcher puts the game page back to Install once the console regains focus (all platforms).
v513: Ubisoft Connect / EA app installs are detected by watching the game's folder grow; the page shows Installing and GB downloaded.
v514: Ubisoft/EA installs get a progress bar and time left, using the Steam store's storage figure as the game's size (shown as 'About').
v515: after cancelling in the launcher the game page goes back to Install about 2s after you return; Ubisoft/EA downloads that start later are still picked up.
v516: Steam install: declining in Steam's confirm window switches the game page back to Install straight away.
v517: all non-Steam platforms: a watcher reads the launcher window (UI Automation) to see the install confirm box close; page goes back to Install if nothing starts.
v518: clicking Cancel (or Esc) in a launcher's install box is detected the moment it happens and the game page returns to Install immediately.
v519: Cancel clicks in a launcher's install box are caught with no gaps (mouse watched on its own thread).
v520: install box watcher reads more kinds of buttons, adds an Esc fallback and logs what it sees.
v521: install box watcher registers a UI Automation listener so Chromium-based launchers expose their buttons; log shows the tree size.
v522: install box watcher reads the launcher's window with Windows' built-in text recognition (OCR) to find the Cancel/Install buttons, since the launchers expose nothing else.
v523: Cancel in a launcher's install box updates the game page instantly (direct message to the page); Steam uses the same screen-reading watcher.
v524: clicks are caught even before the install box was read: a picture of the launcher is taken at the moment of the click and read for the word you pressed.
v525: pressing Confirm or Cancel in a launcher's install box brings the console straight back to the main screen.
v526: cleaner game page (one stats row, no duplicate developer/publisher, no drive row when not installed, shorter install text, tidier spacing); Dead Island 2 / any trailer link that fails now falls back to searching YouTube
v527: install button grows to fit 'Confirm install', no play icon or stray dot while not playable
v528: game page + launch screen redesigned (white Play pill, glass stats strip, bigger title, nicer Starting screen); new Home button chime
v529: Starting screen never shows a colour wash or pops in (darkened game picture or black); pop-up menu restyled as dark glass with white selected pill
v530: extra install-watcher logging (clicks and which window) to find why cancel was not seen
v531: Xbox menu never shows the big game logo behind it; tapping Xbox on Home does nothing (even with a stale game note)
v532: Steam cancel: watcher no longer misses quick clicks (process names cached, short clicks caught); Steam fallback revert after 4 s instead of 7 s
v533: after the Xbox menu closes, the home logo follows the game you are on (no stale logo)
v534: install watcher waits for the mouse button to be released before taking the screen back, so the launcher gets the whole Cancel click (no second click needed)
v535: logo follows the game the instant the Xbox menu closes (locks cut to 120/300 ms); install watcher reads a small picture around the mouse first (much faster Cancel on Steam)
v536: Steam: its confirm box is tracked as a window (cancel noticed the moment it closes, no install file = back to Install in ~1 s); the logo after the Xbox menu uses the game you were really on, and focus returns there
v537: Cancel answered on button press (page reverts at once, screen returns on release); Steam box buttons read ahead of time; logo/background locks cut to 250/300/0 ms
v538: wake-on.bat / wake-off.bat: switching an Xbox controller on starts My Console if it is not running (separate tiny background script, native/wake.ps1)
v539: fixed a line that had been swallowed by a comment (library trailers/panel and hero follow-focus code was not running)
v540: holding the Xbox button (about half a second) with the controller on and the console closed also starts the console
v541: wake watcher writes a small log (%TEMP%\my-console-wake.log) and survives errors
v542: when the console starts (for example from the controller) it takes the screen over whatever was open
v543: faster controller wake-up (quicker checks, starts the app directly, window appears on top at once)
v544: closing the console switches the controller off (native/padoff.ps1; set padOffOnExit false in settings.json to disable)
v545: holding the Xbox button no longer starts the console (switching the controller on still does)
v546: controller power-off on exit is now off by default (does not work with the SCUF dongle); holding the Xbox button opens the console again
v547: closing the console tries to switch the controller off: Xbox power-off command, then (if it stays on) the dongle is switched off and on for a few seconds. Needs padoff-setup.bat run as administrator once. Logs: %TEMP%\my-console-padoff.log
v548: padoff.on shipped in the folder so the power-off try always runs and writes its log
v549: padoff-test.bat to try the controller switch-off by hand; extra logging when quitting
v550: the Xbox menu opens when the button is let go after a short hold (0.3-2.5 s); a long hold that switches the controller off never opens it
v551: Xbox menu opens while holding again; closing the console when the controller switches off (not while a game runs); close-time controller power-off removed
v552: console closes 0.25 s after the controller reports it is off (was 2.5 s)
v553: smooth opening animation (ring + ease-in) when the console starts, and a Powering off screen that fades out before the console closes
v554: Powering off screen restyled as dark glass over the blurred console; the whole window now fades in on start and fades out on close
v555: opening and powering-off redesigned as one matching black veil (soft bloom, your name, thin line); window never pops: starts hidden, fades in 0.8s and out 0.8s
v556: powering-off screen lasts long enough for its line to finish before the window fades
v557: no animation at start (window still fades in); powering-off redone as a black-glass panel like the home widgets with the white focus ring
v558: window is set full screen and black before it becomes visible, then fades in; powering-off redone as a glowing ring that draws and unwinds around a power icon
v559: powering-off screen always says Frankie
v560: tapping Xbox opens the menu (no tap-to-home); holding it shows a Powering off loading ring until the controller switches off, then the console closes
v561: hold-to-power-off loading ring fills in 4 s instead of 6 s
v562: hold-to-power-off loading ring fills in 5 s
v563: Xbox menu has a Home tab (and Go to Home at the top of the first page); Powering off screen redone: a power icon that fills as you hold, sonar rings and stars, then it collapses to a point
v564: Home tab moved to the right end of the Xbox menu strip; power-off redone: glass panel with loading ring (4.4 s), then the screen switches off like an old TV
v565: powering-off redone around your profile picture: a ring fills around it (4.7 s), then it fades to black
v566: sign-in page: removed the star glowing in the very top-left corner of the wallpaper
v567: restored all the wallpaper stars on the sign-in page; only the stars that have not been placed yet are hidden (they were piling up in the top-left corner)
v568: sign-in wallpaper stars put back exactly as they were in v565 (the star fixes are removed)
v569: animation smoothing pass: scrolling glides like a damped spring (eases in and out, keeps its speed when you press again), the selection frame glides between items, buttons that jumped or used a stiff curve now ease softly, the Xbox menu keeps its glass while it fades out
v570: tapping the Xbox button inside an app or web page brings the console back without also opening the Xbox menu
v571: tapping the Xbox button inside a game also just brings the console back, without opening the Xbox menu
v572: game loading screen fades in/out softly (no pop); app opening card is softer; web app menu: Close all tabs closes every Chrome window, even ones that were open before
v573: Close all tabs now closes every Chrome window one after another until none is left
v574: Close all tabs works even when you have not opened a page from the console first (it closes the Chrome windows that were already open)
v575: coming back from a game or app with the Xbox button now restores the page properly again (Running, cover art, trailer, Home background) without opening the menu
v576: startup video: the shine under the Xbox logo and on the floor is blacked out, only the logo shows
v577: startup video put back exactly as before (the floor cut-off of v576 is removed; it cut the logo)
v578: opening is as soft as the closing (slower window fade, black lifts slowly, console settles in from a light blur)
v579: a game the console cannot see the program of (Red Dead Redemption 2 with its launcher/anti-cheat) is no longer forgotten after 2.5 minutes, so the Xbox button brings you back to its page (Running) instead of Home
v580: Watch Dogs no longer takes Watch Dogs 2's background (store matches whose name continues with a number are rejected; saved store backgrounds are looked up again once)
v581: store backgrounds: only the same game's own editions are accepted (Gold/Deluxe/etc.), never another game that starts with the same words (Watch Dogs: Legion); saved ones are looked up again once
v582: after the Xbox button brings you back to a running game's page, tapping it again goes back into the game instead of opening the Xbox menu
v583: Discord inside the console: new Party tab in the Xbox menu (Open Discord, Mute, Deafen). The real Discord app opens fullscreen in the console window (sticks move the cursor, A clicks), voice keeps running when you press Xbox, screen sharing shares the console's screen
v584: Party tab is now native: the Discord app (running on the PC) is read through its local connection (discord-rpc.js): who is in your voice channel and who is speaking, Mute, Deafen, Leave, Join a channel; Open Discord (screen share / watching) still available. First time: approve the small pop-up in Discord. Application ID is built in.
v585: the Party tab logs why it could not reach the Discord app
v586: the Party tab starts Discord minimized to the tray by itself when it is not running
v587: Discord inside the console opens zoomed in (140%) so it reads from the couch
v588: Spotify built into the console: the Spotify tile in Apps opens the console's own Spotify screen (playlists, liked songs, recently played, search, now playing, play/pause/next/previous/volume). Enter your Client ID in the console and sign in once. Sound plays from a hidden player inside the console when it can (needs a Widevine build of Electron, not included yet), otherwise from another Spotify device (the Store app or your phone).
v589: Party moved to the first tab of the Xbox menu (like Xbox): who is in your voice channel, Mute, Deafen, Join another channel, Leave, and a button to share or watch a screen; the separate headset tab is gone
v590: Discord stays out of sight (hidden to the tray when the Party tab connects). 'Share or watch a screen' brings Discord up on your second monitor with the controller cursor; 'Done, hide Discord' (or leaving the voice channel) sends it back to the tray
v591: Party: a green ring around the avatar of whoever is talking (like Discord)
v592: Party: Share or watch a screen now really hands the controller cursor to the Discord window (the console no longer takes it back, Discord is forced to the front); members just say Connected (the green ring shows who talks)
v593: Share or watch a screen: the cursor is moved to the second monitor, the controller stays on Discord until you press Xbox or Done (checked every second); log shows what switches the cursor mode off
v594: Share or watch a screen opens Discord on the voice channel you are in (the call page with Share screen), not on Discord's home page
v595: Discord window handling is instant: a helper that stays running shows or hides the window, the call page link opens at once, and the Discord connection retries every 1.5 s
v596: Spotify screen redone like the Xbox one: menu on the left, square cover tiles, now-playing bar along the bottom
v597: Spotify opens as the real Spotify player inside the console (full app look); the Xbox button brings the menu back
v598: install-widevine.bat adds Widevine to Electron so Spotify can play sound inside the console; restore-electron.bat undoes it
v599: Spotify inside the console is driven by the controller: d-pad moves a white highlight, A selects, B goes back, X play/pause, LB/RB skip, right stick scrolls, Y goes to search, text boxes open the typing keyboard (no cursor)
v600: Spotify controller control rebuilt: highlight styles no longer blocked by the page, smooth gliding highlight and scrolling, keyboard no longer leaves it paused, bigger for the couch, log lines 'spotify web: ready/pad'
v601: Spotify controller layer finds items even when the page covers them, and logs what it sees
v602: Spotify controller layer ignores big wrapper boxes so the highlight can move between real buttons and tiles
v603: Spotify controller layer reworked: only real tiles, buttons and song rows are stops, shelf items that are cut off are skipped, big row wrappers no longer trap the highlight
v604: Spotify is my own screen again, built into the console and styled after the Spotify app: Home shelves (recently played, playlists, top artists, on repeat, albums, podcasts), search for songs/artists/albums/playlists/podcasts, library, liked songs, artist/album/playlist/podcast pages, now playing with queue, shuffle/repeat/like
v605: Spotify screen redone to look like the Spotify app: left menu panel with icons, rounded main panel that scrolls on its own, fixed player bar at the bottom (cover, like, shuffle, previous, play, next, repeat, progress with times, volume), round play button on album/playlist/artist pages, song rows with numbers; fixes the floating bar and stacked rows
v606: 'Full Spotify' button in the Spotify menu opens Spotify's own player inside the console (real layout, controller layer from v603)
v607: Spotify screen fills the whole display (edge to edge, console header hidden), shelves show up to 10 tiles per row
v608: sound engine: install-sound-engine.bat adds go-librespot; the console starts it and Spotify plays through the PC as 'Frankie Console'; the Spotify page shows the one-time pair code
v609: install-sound-engine.bat also fetches the four support DLLs go-librespot needs (libFLAC, libmpg123, libvorbis, libvorbisenc and their friends); the engine crashed with 'missing file' without them
v610: fixed the version sort in get-sound-libs.ps1
v611: the Spotify page shows the sound engine's pairing code (read from the engine itself) and keeps checking until it is paired
v612: sound engine switched off (Spotify refuses its audio keys); the Spotify page now points to install-widevine.bat so the console's own player can play sound
v613: install-widevine.bat closes the running console first, restores a clean Electron, then installs through a temp folder (the old one failed on a locked ffmpeg.dll)
v614: logs what Spotify's player and its license server say (EME check, license answers, page errors) to find why playback cancels after half a second
v615: YouTube opens as YouTube's own TV screen inside the console (free, controller keys)
v616: YouTube screen renders at double resolution so covers are sharp
v617: YouTube covers fetched in high resolution
v618: YouTube hides the pointer and keeps the controller (B no longer drops to the console menu)
v619: YouTube removes the black boxes behind text
v620: YouTube reports a 4K screen and full video support (to unlock 1080p and up)
v621: YouTube quality probe fix (4K/1440p questions answered yes)
v622: YouTube identifies as an Xbox (to unlock 1080p and higher)
v623: YouTube back to normal zoom (was making quality and text boxes worse)
v624: YouTube zoom reset to 100% (the old 50% was remembered)
v625: the console's own YouTube screen (search, lists, full-quality player with controller keys); the old TV screen is a menu item inside it
v626: YouTube opens in the browser again like before (the built-in YouTube screens are switched off)
v627: YouTube TV screen is back (Apps > YouTube) and uses the PlayStation 4 Cobalt identity that unlocks the high-quality formats
v628: YouTube zoom can be set with yt-zoom.txt (for testing quality caps)
v629: B at the top of YouTube no longer leaves or closes it
v630: sign-widevine.bat (signs the console's browser with castlabs' free service so Spotify can play music)
v631: Spotify bar/time move smoothly; the Spotify app opens Spotify's real web player (put an empty spotify-native.txt in the console data folder to get the console's own Spotify screen back)
v632: Spotify volume no longer jumps back after a press
v633: the Xbox-button menu shows what Spotify is playing, with Resume Spotify
