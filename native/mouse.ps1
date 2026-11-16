# Reads the Xbox controller (XInput): moves the Windows cursor, sends keys, and drives the typing keyboard.
# Talks to the console app through stdin/stdout. Runs only as a normal user.
$src = @'
using System;
using System.Threading;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Runtime.InteropServices;
public static class AM {
  [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class Enumr {}
  [ComImport, Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IEnum { int EnumAudioEndpoints(int f, int s, out object d); int GetDefaultAudioEndpoint(int f, int r, out IDev d); }
  [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IDev { int Activate(ref Guid id, int ctx, IntPtr p, [MarshalAs(UnmanagedType.IUnknown)] out object o); }
  [Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IMgr2 { int a(); int b(); int GetSessionEnumerator(out ISessEnum e); }
  [Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface ISessEnum { int GetCount(out int n); int GetSession(int i, out ICtl c); }
  [Guid("F4B1A599-7266-4319-A8CA-E70ACB11E8CD"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface ICtl { int a(); int b(); int c(); int d(); int e(); int f(); int g(); int h(); int i(); int j(); int k(); int GetProcessId(out uint p); }
  [Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IVol { int SetMasterVolume(float v, ref Guid c); int GetMasterVolume(out float v); int SetMute(bool m, ref Guid c); int GetMute(out bool m); }
  public static void Run(HashSet<uint> pids, bool mute) {
    var en = (IEnum)(new Enumr()); IDev dev; en.GetDefaultAudioEndpoint(0, 1, out dev);
    Guid g = new Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"); object o; dev.Activate(ref g, 23, IntPtr.Zero, out o);
    ISessEnum se; ((IMgr2)o).GetSessionEnumerator(out se); int n; se.GetCount(out n); Guid none = Guid.Empty;
    for (int i = 0; i < n; i++) { ICtl c; se.GetSession(i, out c); uint p; c.GetProcessId(out p); if (pids.Contains(p)) ((IVol)c).SetMute(mute, ref none); }
  }
}
public static class Mouse {
  [StructLayout(LayoutKind.Sequential)] public struct GP { public ushort Buttons; public byte LT; public byte RT; public short LX; public short LY; public short RX; public short RY; }
  [StructLayout(LayoutKind.Sequential)] public struct ST { public uint Packet; public GP Pad; }
  [StructLayout(LayoutKind.Sequential)] public struct PT { public int X; public int Y; }
  [StructLayout(LayoutKind.Sequential)] public struct JEX { public uint Size, Flags, X, Y, Z, R, U, V, Buttons, ButtonNo, POV, R1, R2; }
  [DllImport("winmm.dll")] static extern uint joyGetPosEx(uint id, ref JEX j);
  static uint[,] joyPrev = new uint[4, 8]; static bool[] joyHad = new bool[4];
  static bool JoyPress() {   // a PlayStation controller (or any other that is not XInput) is touched: any button, stick or d-pad movement
    bool hit = false;
    for (uint id = 0; id < 4; id++) {
      JEX j = new JEX(); j.Size = (uint)Marshal.SizeOf(typeof(JEX)); j.Flags = 0xFF;
      try { if (joyGetPosEx(id, ref j) != 0) { joyHad[id] = false; continue; } } catch (Exception) { return false; }
      uint[] cur = new uint[] { j.X, j.Y, j.Z, j.R, j.U, j.V, j.Buttons, j.POV };
      if (joyHad[id]) {
        if (cur[6] != joyPrev[id, 6] && cur[6] != 0) hit = true;
        if (cur[7] != joyPrev[id, 7] && cur[7] != 65535) hit = true;
        for (int k = 0; k < 6; k++) { long d = (long)cur[k] - (long)joyPrev[id, k]; if (d < 0) d = -d; if (d > 7000) hit = true; }
      }
      for (int k = 0; k < 8; k++) joyPrev[id, k] = cur[k]; joyHad[id] = true;
    }
    return hit;
  }
  [DllImport("xinput1_4.dll")] static extern int XInputGetState(int i, out ST s);
  [DllImport("xinput1_4.dll", EntryPoint = "#100")] static extern int XInputGetStateEx(int i, out ST s);   // also reports the Xbox (Guide) button
  [StructLayout(LayoutKind.Sequential)] public struct BAT { public byte Type; public byte Level; }
  [DllImport("xinput1_4.dll")] static extern int XInputGetBatteryInformation(int i, byte devType, out BAT b);
  static int padIdx = 0;
  static bool hasEx = true;
  [DllImport("user32.dll")] static extern bool GetCursorPos(out PT p);
  [DllImport("user32.dll")] static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll", EntryPoint = "ClipCursor")] static extern bool ClipCursorFree(IntPtr r);
  [DllImport("winmm.dll")] static extern uint timeBeginPeriod(uint ms);
  [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] static extern void mouse_event(uint f, int dx, int dy, int d, UIntPtr e);
  [DllImport("user32.dll")] static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr e);
  [DllImport("user32.dll")] static extern short VkKeyScan(char ch);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("kernel32.dll")] static extern uint GetCurrentThreadId();
  [DllImport("user32.dll")] static extern bool AttachThreadInput(uint a, uint b, bool attach);
  [DllImport("user32.dll")] static extern bool BringWindowToTop(IntPtr h);
  [DllImport("user32.dll")] static extern void SwitchToThisWindow(IntPtr h, bool alt);
  [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] static extern bool IsWindow(IntPtr h);
  [DllImport("user32.dll")] static extern bool PostMessage(IntPtr h, uint msg, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern int GetWindowTextLength(IntPtr h);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RC r);
  [StructLayout(LayoutKind.Sequential)] public struct RC { public int L, T, R, B; }
  [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);
  [DllImport("user32.dll", CharSet = CharSet.Auto)] static extern IntPtr CreateWindowEx(uint ex, string cls, string name, uint style, int x, int y, int w, int h, IntPtr parent, IntPtr menu, IntPtr inst, IntPtr prm);
  [DllImport("user32.dll")] static extern bool SetLayeredWindowAttributes(IntPtr h, uint key, byte alpha, uint flags);
  [StructLayout(LayoutKind.Sequential)] public struct MSG { public IntPtr h; public uint m; public IntPtr w; public IntPtr l; public uint t; public int x; public int y; }
  [DllImport("user32.dll")] static extern int GetMessage(out MSG m, IntPtr h, uint a, uint b);
  [DllImport("user32.dll")] static extern bool TranslateMessage(ref MSG m);
  [DllImport("user32.dll")] static extern IntPtr DispatchMessage(ref MSG m);
  static volatile bool shield = false; static IntPtr shieldH = IntPtr.Zero, tgtH = IntPtr.Zero;
  // "shield": the Microsoft Store reads the controller by itself. While it is open, an invisible window of ours holds the keyboard focus, so Windows gives the Store no controller input; the mouse (cursor, clicks, wheel) still reaches it, and keys are sent to it for a moment.
  static void MakeShield() {
    if (shieldH != IntPtr.Zero) return;
    Thread st = new Thread(delegate() {
      IntPtr h = CreateWindowEx(0x80080 | 0x20, "STATIC", "console-shield", 0x90000000u, 0, 0, 1, 1, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero);
      if (h == IntPtr.Zero) return;
      SetLayeredWindowAttributes(h, 0, 0, 2); shieldH = h;
      MSG m; while (GetMessage(out m, IntPtr.Zero, 0, 0) > 0) { TranslateMessage(ref m); DispatchMessage(ref m); }
    });
    st.IsBackground = true; st.Start();
    for (int i = 0; i < 50 && shieldH == IntPtr.Zero; i++) Thread.Sleep(20);
  }
  static void WithTarget(Action a) {
    if (shield && tgtH != IntPtr.Zero && IsWindow(tgtH) && GetForegroundWindow() != tgtH) { Front(tgtH); Thread.Sleep(45); a(); } else a();
  }
  static volatile bool on = false, kb = false, introWatch = false;
  static double speed = 1200, dead = 0.25, curve = 1.6;
  static int mSpace = 0, mPrevK = 0, mNextK = 0; static int mLeft = 0x1000, mRight = 0x2000, mKbd = 0x8000, mEnter = 0x4000, mEsc = 0x200, mBack = 0x100;
  static string navDir = null; static long navNext = 0;
  static void Out(string s) { Console.Out.WriteLine(s); Console.Out.Flush(); }
  static void Click(uint f) { mouse_event(f, 0, 0, 0, UIntPtr.Zero); }
  static int Mask(string n) {
    switch (n) { case "A": return 0x1000; case "B": return 0x2000; case "X": return 0x4000; case "Y": return 0x8000;
      case "LB": return 0x100; case "RB": return 0x200; case "BACK": return 0x20; case "START": return 0x10; }
    return 0;
  }
  static void Down(byte vk, bool ext) { keybd_event(vk, 0, ext ? 1u : 0u, UIntPtr.Zero); }
  static void Up(byte vk, bool ext) { keybd_event(vk, 0, ext ? 3u : 2u, UIntPtr.Zero); }
  static void Press(byte vk, bool ext) { Down(vk, ext); Up(vk, ext); }
  static void TypeChar(char c) { WithTarget(delegate() { TypeCharRaw(c); }); }
  static void TypeCharRaw(char c) {
    short r = VkKeyScan(c); if (r == -1) return;
    byte vk = (byte)(r & 0xFF); int sh = (r >> 8) & 0xFF;
    if ((sh & 1) != 0) Down(0x10, false); if ((sh & 2) != 0) Down(0x11, false); if ((sh & 4) != 0) Down(0x12, false);
    Press(vk, false);
    if ((sh & 4) != 0) Up(0x12, false); if ((sh & 2) != 0) Up(0x11, false); if ((sh & 1) != 0) Up(0x10, false);
  }
  static void NamedKey(string n) { WithTarget(delegate() { NamedKeyRaw(n); }); }
  static void NamedKeyRaw(string n) {
    switch (n) {
      case "enter": Press(0x0D, false); break; case "backspace": Press(0x08, false); break; case "space": Press(0x20, false); break;
      case "f13": Press(0x7C, false); break; case "f14": Press(0x7D, false); break;
      case "tab": Press(0x09, false); break; case "esc": Press(0x1B, false); break;
      case "left": Press(0x25, true); break; case "up": Press(0x26, true); break; case "right": Press(0x27, true); break; case "down": Press(0x28, true); break;
      case "altleft": Down(0x12, false); Press(0x25, true); Up(0x12, false); break;
      case "altenter": Down(0x12, false); Press(0x0D, false); Up(0x12, false); break;
      case "ctrlw": Down(0x11, false); Press(0x57, false); Up(0x11, false); break;
    }
  }
  static void Front(IntPtr h) {   // give a window the foreground (the attach trick gets around Windows' focus lock)
    uint pid; IntPtr fg = GetForegroundWindow();
    uint fgT = GetWindowThreadProcessId(fg, out pid), me = GetCurrentThreadId();
    if (fgT != me && fgT != 0) AttachThreadInput(me, fgT, true);
    if (IsIconic(h)) ShowWindow(h, 9);
    Down(0x87, false); Up(0x87, false);   // a harmless key press (F24): counts as your input, so Windows lets this program take the screen from a game that holds it
    BringWindowToTop(h); SetForegroundWindow(h); SwitchToThisWindow(h, true);
    if (fgT != me && fgT != 0) AttachThreadInput(me, fgT, false);
  }
  // Find the window that just opened in front (Chrome or an app), and put it on the console's monitor.
  static void Place(int x, int y, int w, int h, IntPtr me) {
    uint myPid; GetWindowThreadProcessId(me, out myPid);
    long end = Environment.TickCount + 9000; IntPtr done = IntPtr.Zero; long doneAt = 0;
    while (Environment.TickCount < end) {
      Thread.Sleep(120);
      IntPtr fg = GetForegroundWindow(); if (fg == IntPtr.Zero || fg == me) continue;
      uint pid; GetWindowThreadProcessId(fg, out pid); if (pid == myPid) continue;
      if (!IsWindowVisible(fg) || IsIconic(fg) || GetWindowTextLength(fg) == 0) continue;
      RC r; if (!GetWindowRect(fg, out r)) continue;
      int cx = (r.L + r.R) / 2, cy = (r.T + r.B) / 2;
      bool inside = cx >= x && cx < x + w && cy >= y && cy < y + h;
      if (!inside) { ShowWindow(fg, 9); SetWindowPos(fg, IntPtr.Zero, x + 40, y + 40, Math.Max(400, w - 80), Math.Max(300, h - 80), 0x44); ShowWindow(fg, 3); done = fg; doneAt = Environment.TickCount; }
      else if (done == IntPtr.Zero) { ShowWindow(fg, 3); done = fg; doneAt = Environment.TickCount; }
      if (done != IntPtr.Zero && Environment.TickCount - doneAt > 1800) { Out("ext " + done.ToInt64().ToString()); return; }
    }
  }
  static void KeepHome(IntPtr h0, int x, int y, int w, int ht, int secs) {   // for the first seconds of a game: the moment any of its windows shows up on the other monitor it is put back on the console's monitor (checked every 15 ms)
    Thread t = new Thread(delegate() { try {
      uint gp; GetWindowThreadProcessId(h0, out gp); if (gp == 0) return;
      long end = Environment.TickCount + secs * 1000L; int logged = 0;
      while (Environment.TickCount < end) {
        Thread.Sleep(15);
        foreach (IntPtr h in AllWindows()) {
          try {
            uint pid; GetWindowThreadProcessId(h, out pid); if (pid != gp) continue;
            if (!IsWindowVisible(h) || IsIconic(h)) continue;
            RC r; if (!GetWindowRect(h, out r)) continue;
            int ww = r.R - r.L, hh = r.B - r.T; if (ww < 400 || hh < 300) continue;
            int cx = (r.L + r.R) / 2, cy = (r.T + r.B) / 2;
            if (cx >= x && cx < x + w && cy >= y && cy < y + ht) continue;
            if (r.L <= -20000) continue;   // parked on purpose
            if (ww >= w * 0.9 && hh >= ht * 0.9) SetWindowPos(h, IntPtr.Zero, x, y, w, ht, 0x44);
            else SetWindowPos(h, IntPtr.Zero, x + Math.Max(0, (w - ww) / 2), y + Math.Max(0, (ht - hh) / 2), 0, 0, 0x45);
            if (logged < 10) { logged++; Out("keephome moved " + ww + "x" + hh + " from " + r.L + "," + r.T); }
          } catch (Exception) { }
        }
      }
    } catch (Exception) { } });
    t.IsBackground = true; t.Start();
  }
  static void MoveHome(IntPtr h, int x, int y, int w, int ht) {   // a game window that opened on the other monitor is brought onto the console's monitor
    try {
      RC r; if (!GetWindowRect(h, out r)) return;
      int cx = (r.L + r.R) / 2, cy = (r.T + r.B) / 2;
      if (cx >= x && cx < x + w && cy >= y && cy < y + ht) return;
      int ww = r.R - r.L, hh = r.B - r.T;
      if (ww >= w * 0.9 && hh >= ht * 0.9) SetWindowPos(h, IntPtr.Zero, x, y, w, ht, 0x44);
      else SetWindowPos(h, IntPtr.Zero, x + Math.Max(0, (w - ww) / 2), y + Math.Max(0, (ht - hh) / 2), 0, 0, 0x45);
    } catch (Exception) { }
  }
  [StructLayout(LayoutKind.Sequential)] struct LII { public uint cb; public uint t; }
  [DllImport("user32.dll")] static extern bool GetLastInputInfo(ref LII p);
  static volatile bool fwd = false; static IntPtr consoleH = IntPtr.Zero;
  static bool FgOther() {   // is the window you are using on a different monitor than the console?
    try {
      if (consoleH == IntPtr.Zero) return false;
      IntPtr fg = GetForegroundWindow(); if (fg == IntPtr.Zero || fg == consoleH || !IsWindowVisible(fg)) return false;
      uint pid, mp; GetWindowThreadProcessId(fg, out pid); GetWindowThreadProcessId(consoleH, out mp); if (pid == mp) return false;
      return MonitorFromWindow(fg, 2) != MonitorFromWindow(consoleH, 2);
    } catch (Exception) { return false; }
  }
  static bool NotConsole() {   // some other program's window (on any monitor) has the focus, not the console
    try {
      if (consoleH == IntPtr.Zero) return false;
      IntPtr fg = GetForegroundWindow(); if (fg == consoleH) return false;
      if (fg == IntPtr.Zero) return true;
      uint pid, mp; GetWindowThreadProcessId(fg, out pid); GetWindowThreadProcessId(consoleH, out mp); return pid != mp;
    } catch (Exception) { return false; }
  }
  static long frontAt = -99999; static bool stickOn = false; static IntPtr frontT = IntPtr.Zero;
  [DllImport("user32.dll")] static extern short GetAsyncKeyState(int v);
  static long mouseAt = -99999; static int cpx = int.MinValue, cpy = 0; static long nowMs = 0;
  static bool MouseBusy(long ms) { return nowMs - mouseAt < ms; }   // you used the mouse a moment ago (the controller does not count)
  static volatile bool regainOn = false; static IntPtr regMe = IntPtr.Zero; static Thread regT;
  // If you click a window on another monitor, the console takes the focus back once you stop (no mouse or keyboard for 2 s), so the controller keeps working on the console's monitor.
  static void Regain(bool on, IntPtr me) {
    regainOn = on; regMe = me; if (!on || (regT != null && regT.IsAlive)) return;
    regT = new Thread(delegate() {
      while (regainOn) {
        Thread.Sleep(150);
        try {
          IntPtr fg = GetForegroundWindow(); if (fg == IntPtr.Zero || fg == regMe || !IsWindowVisible(fg)) continue;
          uint pid, mp; GetWindowThreadProcessId(fg, out pid); GetWindowThreadProcessId(regMe, out mp); if (pid == mp) continue;
          if (MonitorFromWindow(fg, 2) == MonitorFromWindow(regMe, 2)) continue;
          LII li = new LII(); li.cb = 8; if (!GetLastInputInfo(ref li)) continue;
          if ((uint)Environment.TickCount - li.t < 600) continue;
          Front(regMe);
        } catch (Exception) { }
      }
    });
    regT.IsBackground = true; regT.Start();
  }
  delegate bool EnumProc(IntPtr h, IntPtr lp);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc cb, IntPtr lp);
  [DllImport("user32.dll")] static extern bool IsZoomed(IntPtr h);
  static readonly HashSet<string> LAUNCHERS = new HashSet<string> { "steam", "steamwebhelper", "epicgameslauncher", "upc", "ubisoftconnect", "galaxyclient", "eadesktop", "ealauncher", "origin", "battle.net" };
  // Windows that a game launcher opens on the console's monitor (Steam's install window, the Epic launcher...) are moved to the other monitor, where they can be seen.
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, System.Text.StringBuilder sb, int max);
  static string ClassOf(IntPtr h) { var sb = new System.Text.StringBuilder(128); GetClassName(h, sb, 128); return sb.ToString(); }
  static void MoveToOther(IntPtr h, int ox, int oy, int ow, int oh) {
    bool zoomed = IsZoomed(h); if (zoomed) ShowWindow(h, 9);
    RC r2; GetWindowRect(h, out r2); int w = Math.Min(r2.R - r2.L, ow - 80), hh = Math.Min(r2.B - r2.T, oh - 80);
    SetWindowPos(h, IntPtr.Zero, ox + (ow - w) / 2, oy + (oh - hh) / 2, w, hh, 0x14);
    SetWindowPos(h, new IntPtr(-1), 0, 0, 0, 0, 0x13); SetWindowPos(h, new IntPtr(-2), 0, 0, 0, 0, 0x13);   // brought forward on that monitor without taking the focus
    if (zoomed) ShowWindow(h, 3);
  }
  static List<IntPtr> AllWindows() { var l = new List<IntPtr>(); EnumWindows(delegate(IntPtr h, IntPtr lp) { l.Add(h); return true; }, IntPtr.Zero); return l; }
  // Windows that a game launcher opens (Steam's install / uninstall window, the Epic launcher...) go to the other monitor and come to the front there.
  static void Side(int ox, int oy, int ow, int oh, int cx0, int cy0, int cw, int ch, IntPtr me, int secs) {
    Thread t = new Thread(delegate() { try {
      uint myPid; GetWindowThreadProcessId(me, out myPid);
      var old = new HashSet<long>(); foreach (IntPtr h in AllWindows()) old.Add(h.ToInt64());
      var done = new HashSet<long>(); long end = Environment.TickCount + secs * 1000L;
      while (Environment.TickCount < end) {
        Thread.Sleep(250);
        foreach (IntPtr h in AllWindows()) {
          try {
            long k = h.ToInt64(); if (done.Contains(k) || GetWindowTextLength(h) == 0) continue;
            uint pid; GetWindowThreadProcessId(h, out pid); if (pid == myPid) continue;
            string n; try { n = Process.GetProcessById((int)pid).ProcessName.ToLowerInvariant(); } catch (Exception) { continue; }
            if (!LAUNCHERS.Contains(n)) continue;
            if (IsIconic(h)) { if (!old.Contains(k)) { ShowWindow(h, 9); } continue; }
            if (!IsWindowVisible(h)) continue;
            RC r; if (!GetWindowRect(h, out r)) continue;
            int cx = (r.L + r.R) / 2, cy = (r.T + r.B) / 2;
            if (cx >= cx0 && cx < cx0 + cw && cy >= cy0 && cy < cy0 + ch) { MoveToOther(h, ox, oy, ow, oh); done.Add(k); Front(me); }
            else if (!old.Contains(k) && cx >= ox && cx < ox + ow && cy >= oy && cy < oy + oh) { SetWindowPos(h, new IntPtr(-1), 0, 0, 0, 0, 0x13); SetWindowPos(h, new IntPtr(-2), 0, 0, 0, 0, 0x13); done.Add(k); }
          } catch (Exception) { }
        }
      }
    } catch (Exception) { } });
    t.IsBackground = true; t.Start();
  }
  // While a game starts: any NEW window a launcher opens (Steam's "launching" box, the Epic launcher, EA, Ubisoft...) is kept on the console's monitor, underneath the console,
  // so it never shows on the other monitor. Windows that were already open before the launch are left exactly where they are.
  static readonly HashSet<string> GAME_CLASS = new HashSet<string> { "UnrealWindow", "UnityWndClass", "SDL_app", "GLFW30", "Valve001", "CryENGINE", "UbisoftGameWindow", "FrostbiteWindow", "Warcraft III", "grcWindow", "RGSS Player", "LWJGL", "ApplicationFrameWindow_" };
  static readonly Dictionary<long, RC> parked = new Dictionary<long, RC>();
  static void Unpark() { lock (parked) { foreach (var kv in parked) { try { IntPtr h = new IntPtr(kv.Key); if (IsWindow(h)) SetWindowPos(h, IntPtr.Zero, kv.Value.L, kv.Value.T, 0, 0, 0x15); } catch (Exception) { } } parked.Clear(); } }
  static bool IsAC(string n) { return n.Contains("anticheat") || n.StartsWith("eac") || n.Contains("battleye") || n == "beservice" || n == "beclient" || n.StartsWith("start_protected_game") || n.StartsWith("vgc") || n.Contains("xigncode") || n.Contains("gameguard") || n.Contains("punkbuster"); }
  // While a game starts, every window anything opens (launchers, anti-cheat, "launching" boxes, loading windows) is parked off both monitors, so nothing is ever seen; the game's own window is moved onto the console's monitor. Parked windows go back when the watch ends.
  static void HideLaunch(int ox, int oy, int ow, int oh, int cx0, int cy0, int cw, int ch, IntPtr me, int secs) {
    Thread t = new Thread(delegate() { try {
      uint myPid; GetWindowThreadProcessId(me, out myPid);
      var seen = new HashSet<long>(); var moved = parked; int logged = 0;
      foreach (IntPtr h0 in AllWindows()) { if (IsWindowVisible(h0) && !IsIconic(h0)) seen.Add(h0.ToInt64()); }
      long end = Environment.TickCount + secs * 1000L;
      while (Environment.TickCount < end) {
        Thread.Sleep(30);
        foreach (IntPtr h in AllWindows()) {
          try {
            long k = h.ToInt64();
            if (!IsWindowVisible(h) || IsIconic(h)) { seen.Remove(k); continue; }
            uint pid; GetWindowThreadProcessId(h, out pid); if (pid == myPid) continue;
            string n; try { n = Process.GetProcessById((int)pid).ProcessName.ToLowerInvariant(); } catch (Exception) { continue; }
            bool forced = LAUNCHERS.Contains(n) || IsAC(n);   // these are hidden even if their window was already open
            if (seen.Contains(k) && !forced) continue;
            RC r; if (!GetWindowRect(h, out r)) continue;
            int ww = r.R - r.L, wh = r.B - r.T;
            if (moved.ContainsKey(k) && !forced && ww >= cw * 0.9 && wh >= ch * 0.9) { lock (moved) { moved.Remove(k); } SetWindowPos(h, IntPtr.Zero, cx0, cy0, 0, 0, 0x15); seen.Add(k); Out("hl game-grew " + n); continue; }   // a parked window that became the full-size game window comes back
            if (ww < 60 || wh < 40) continue;
            int cx = (r.L + r.R) / 2, cy = (r.T + r.B) / 2;
            bool onOther = cx >= ox && cx < ox + ow && cy >= oy && cy < oy + oh;
            if (moved.ContainsKey(k) && (r.L <= -20000 || !onOther)) continue;
            string cls = ClassOf(h);
            if (!forced && (GEN_SKIP_CLASS.Contains(cls) || GEN_SKIP.Contains(n) || (n == "explorer" && cls != "CabinetWClass"))) { seen.Add(k); continue; }
            bool isGame = !forced && ((ww >= cw * 0.9 && wh >= ch * 0.9) || (GAME_CLASS.Contains(cls) && ww >= cw * 0.45 && wh >= ch * 0.45));   // small start-up / anti-cheat windows are not the game, whatever their type
            if (logged < 80) { logged++; Out("hl " + (isGame ? "game " : "park ") + n + " | " + cls + " | " + r.L + "," + r.T + " " + ww + "x" + wh + (onOther ? " other" : " home")); }
            if (isGame) { if (onOther) SetWindowPos(h, IntPtr.Zero, cx0 + Math.Max(0, (cw - ww) / 2), cy0 + Math.Max(0, (ch - wh) / 2), 0, 0, 0x15); seen.Add(k); continue; }
            lock (moved) { if (!moved.ContainsKey(k)) moved[k] = r; }
            SetWindowPos(h, IntPtr.Zero, -32000, -32000, 0, 0, 0x15);
            SetWindowPos(h, new IntPtr(1), 0, 0, 0, 0, 0x13);
            seen.Add(k);
          } catch (Exception) { }
        }
      }
    } catch (Exception) { } });
    t.IsBackground = true; t.Start();
  }
  // Every other pop-up (Windows prompts, installers, game settings...) that opens on the console's monitor while it is on screen goes to the other monitor too.
  static volatile bool genOn = false; static Thread genT; static int[] genR = new int[8]; static IntPtr genMe = IntPtr.Zero;
  static readonly HashSet<string> GEN_SKIP = new HashSet<string> { "searchhost", "searchapp", "startmenuexperiencehost", "shellexperiencehost", "textinputhost", "lockapp", "dwm", "csrss", "winlogon", "sihost", "ctfmon", "taskmgr_", "widgets", "widgetservice", "systemsettingsbroker" };
  static readonly HashSet<string> GEN_SKIP_CLASS = new HashSet<string> { "Shell_TrayWnd", "Shell_SecondaryTrayWnd", "Progman", "WorkerW", "TaskListThumbnailWnd", "NotifyIconOverflowWindow", "TopLevelWindowForOverflowXamlIsland", "Windows.UI.Core.CoreWindow", "XamlExplorerHostIslandWindow", "ForegroundStaging", "MultitaskingViewFrame", "Shell_InputSwitchTopLevelWindow", "tooltips_class32", "#32768", "#32770_" };
  static void Gen(bool on, int[] gr, IntPtr me) {
    if (!on) { genOn = false; return; }
    genR = gr; genMe = me;
    if (genOn && genT != null && genT.IsAlive) return;
    genOn = true;
    genT = new Thread(delegate() { try {
      var seen = new HashSet<long>(); var lmoved = new HashSet<long>(); foreach (IntPtr h in AllWindows()) { if (IsWindowVisible(h)) seen.Add(h.ToInt64()); }
      while (genOn) {
        Thread.Sleep(300);
        uint myPid; GetWindowThreadProcessId(genMe, out myPid);
        foreach (IntPtr h in AllWindows()) {
          try {
            long k = h.ToInt64();
            if (!IsWindowVisible(h) || IsIconic(h)) { seen.Remove(k); lmoved.Remove(k); continue; }   // a window that is hidden and shown again (Steam's uninstall box) counts as new
            bool isNew = !seen.Contains(k);
            if (GetWindowTextLength(h) == 0) continue;
            if (!isNew) {   // a game launcher's window already open on the console's monitor is moved too (once)
              if (lmoved.Contains(k)) continue;
              uint pid0; GetWindowThreadProcessId(h, out pid0); string n0; try { n0 = Process.GetProcessById((int)pid0).ProcessName.ToLowerInvariant(); } catch (Exception) { continue; }
              if (!LAUNCHERS.Contains(n0)) continue;
            }
            seen.Add(k); lmoved.Add(k);
            uint pid; GetWindowThreadProcessId(h, out pid); if (pid == myPid) continue;
            string cls = ClassOf(h); if (GEN_SKIP_CLASS.Contains(cls)) continue;
            string n; try { n = Process.GetProcessById((int)pid).ProcessName.ToLowerInvariant(); } catch (Exception) { continue; }
            if (GEN_SKIP.Contains(n) || (n == "explorer" && cls != "CabinetWClass")) continue;
            RC r; if (!GetWindowRect(h, out r)) continue;
            if (r.R - r.L < 160 || r.B - r.T < 100) continue;
            if (r.R - r.L >= genR[6] * 8 / 10 && r.B - r.T >= genR[7] * 8 / 10) continue;   // a window that fills the screen is a game, not a pop-up
            if (n.Contains("shipping") || n.Contains("win64") || n.Contains("fortnite") || n.Contains("rocketleague")) continue;
            int cx = (r.L + r.R) / 2, cy = (r.T + r.B) / 2;
            if (cx >= genR[4] && cx < genR[4] + genR[6] && cy >= genR[5] && cy < genR[5] + genR[7]) MoveToOther(h, genR[0], genR[1], genR[2], genR[3]);
          } catch (Exception) { }
        }
      }
    } catch (Exception) { } });
    genT.IsBackground = true; genT.Start();
  }
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern IntPtr FindWindow(string cls, string title);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern IntPtr FindWindowEx(IntPtr parent, IntPtr after, string cls, string title);
  [StructLayout(LayoutKind.Sequential)] struct ABRC { public int l, t, r, b; }
  [StructLayout(LayoutKind.Sequential)] struct ABD { public uint cb; public IntPtr hWnd; public uint msg; public uint edge; public ABRC rc; public IntPtr lp; }
  [DllImport("shell32.dll")] static extern UIntPtr SHAppBarMessage(uint msg, ref ABD d);
  static int tbOrig = -1;
  static ABD TbData() { ABD d = new ABD(); d.cb = (uint)Marshal.SizeOf(typeof(ABD)); d.hWnd = FindWindow("Shell_TrayWnd", null); return d; }
  static int TbGet() { ABD d = TbData(); return (int)(long)SHAppBarMessage(4, ref d); }
  static void TbSet(int st) { ABD d = TbData(); d.lp = new IntPtr(st); SHAppBarMessage(10, ref d); }
  static void AutoHide(bool on) {   // the taskbar slides away while the console runs (so it cannot pop up over a game opening or closing), and goes back to your own setting on exit
    if (on) { if (tbOrig < 0) { tbOrig = TbGet(); Out("tbstate " + tbOrig.ToString()); } TbSet(tbOrig | 1); }
    else if (tbOrig >= 0) { TbSet(tbOrig); tbOrig = -1; }
  }
  static volatile bool trayHide = false; static Thread trayT;
  [DllImport("user32.dll")] static extern IntPtr MonitorFromWindow(IntPtr h, uint flags);
  static IntPtr trayMon = IntPtr.Zero, trayH = IntPtr.Zero;   // the taskbar is hidden only while the console window is really on screen
  static void TrayApply(bool hide) {   // only the taskbar on the console's own monitor; the one on any other monitor is never touched
    IntPtr t = FindWindow("Shell_TrayWnd", null);
    if (t != IntPtr.Zero && (!hide || MonitorFromWindow(t, 2) == trayMon)) ShowWindow(t, hide ? 0 : 8);
    IntPtr s = IntPtr.Zero; while ((s = FindWindowEx(IntPtr.Zero, s, "Shell_SecondaryTrayWnd", null)) != IntPtr.Zero) if (!hide || MonitorFromWindow(s, 2) == trayMon) ShowWindow(s, hide ? 0 : 8);
  }
  static void Tray(bool hide, long hwnd) {   // the taskbar on the console's monitor is hidden while it runs (and kept hidden if Windows brings it back), then restored on exit
    if (hide) { trayMon = MonitorFromWindow(new IntPtr(hwnd), 2); if (hwnd != 0) trayH = new IntPtr(hwnd); }
    trayHide = hide; if (!hide) { TrayApply(false); return; }
    if (trayT != null && trayT.IsAlive) return;
    trayT = new Thread(delegate() { bool lastH = false; while (trayHide) { bool vis = false; try { vis = trayH != IntPtr.Zero && IsWindowVisible(trayH) && !IsIconic(trayH); } catch (Exception) { } if (vis) { TrayApply(true); lastH = true; } else if (lastH) { TrayApply(false); lastH = false; } Thread.Sleep(250); } }); trayT.IsBackground = true; trayT.Start();
  }
  static void Tray(bool hide) { Tray(hide, 0); }
  static long pinV = 0; static Thread pinT;
  static volatile bool pinIdle = false;
  static bool ForeignHere(IntPtr me) {   // a window of another program, opened by you, is in front on the console's own monitor
    try {
      IntPtr fg = GetForegroundWindow(); if (fg == IntPtr.Zero || fg == me || !IsWindowVisible(fg)) return false;
      uint pid, mp; GetWindowThreadProcessId(fg, out pid); GetWindowThreadProcessId(me, out mp); if (pid == mp) return false;
      string c = ClassOf(fg); if (c == "Progman" || c == "WorkerW" || c == "Shell_TrayWnd" || c == "Shell_SecondaryTrayWnd") return false;
      return MonitorFromWindow(fg, 2) == MonitorFromWindow(me, 2);
    } catch (Exception) { return false; }
  }
  static void Pin(long h, bool idle) { pinIdle = idle; Pin(h); }
  static void Pin(long h) {   // while a game opens, keep the console above every other window (every 10 ms), so a launcher or splash can never flash over it
    pinV = h; if (h == 0 || (pinT != null && pinT.IsAlive)) return;
    pinT = new Thread(delegate() { bool yielded = false; while (pinV != 0) { if (pinIdle && ForeignHere(new IntPtr(pinV))) { if (!yielded) { yielded = true; SetWindowPos(new IntPtr(pinV), new IntPtr(-2), 0, 0, 0, 0, 0x13); } } else { yielded = false; SetWindowPos(new IntPtr(pinV), new IntPtr(-1), 0, 0, 0, 0, 0x13); } Thread.Sleep(40); } pinV = 0; }); pinT.IsBackground = true; pinT.Start();
  }
  static void Back(IntPtr h) { SetWindowPos(h, new IntPtr(1), 0, 0, 0, 0, 0x13); }   // bottom of the stack, without activating
  // v1094: a PlayStation controller (a real one, or the virtual one the SCUF bridge makes) is not an XInput pad, so it is read through the old Windows joystick API and turned into the same state
  [StructLayout(LayoutKind.Sequential)] struct JIX { public uint Size, Flags, X, Y, Z, R, U, V, Buttons, ButtonNumber, POV, R1, R2; }
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)] struct JCP { public ushort Mid, Pid; [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string Name; public uint Xmin, Xmax, Ymin, Ymax, Zmin, Zmax, NumButtons, PerMin, PerMax, Rmin, Rmax, Umin, Umax, Vmin, Vmax, Caps, MaxAxes, NumAxes, MaxButtons; [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string Reg; [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)] public string Oem; }
  [DllImport("winmm.dll")] static extern uint joyGetPosEx(uint id, ref JIX j);
  [DllImport("winmm.dll", CharSet = CharSet.Unicode)] static extern uint joyGetDevCapsW(UIntPtr id, out JCP c, uint size);
  static int jIdx = -1; static long jScan = 0; static uint jPacket = 0;
  static bool ReadDs(out ST s) {
    s = new ST();
    try {
      long now = Environment.TickCount;
      if (jIdx < 0) {
        if (now - jScan < 2000) return false;
        jScan = now;
        for (uint i = 0; i < 16; i++) { JCP c; if (joyGetDevCapsW((UIntPtr)i, out c, (uint)Marshal.SizeOf(typeof(JCP))) == 0 && c.Mid == 0x054C) { jIdx = (int)i; break; } }
        if (jIdx < 0) return false;
      }
      JIX j = new JIX(); j.Size = (uint)Marshal.SizeOf(typeof(JIX)); j.Flags = 0xFF;
      if (joyGetPosEx((uint)jIdx, ref j) != 0) { jIdx = -1; return false; }
      ushort b = 0; uint B = j.Buttons;
      if ((B & 2) != 0) b |= 0x1000; if ((B & 4) != 0) b |= 0x2000; if ((B & 1) != 0) b |= 0x4000; if ((B & 8) != 0) b |= 0x8000;   // cross, circle, square, triangle
      if ((B & 16) != 0) b |= 0x100; if ((B & 32) != 0) b |= 0x200;   // L1, R1
      if ((B & 256) != 0) b |= 0x20; if ((B & 512) != 0) b |= 0x10;   // share = back, options = start
      if ((B & 1024) != 0) b |= 0x40; if ((B & 2048) != 0) b |= 0x80;   // L3, R3
      if ((B & 4096) != 0) b |= 0x400;   // the PS button
      uint pov = j.POV & 0xFFFF;
      if (pov != 0xFFFF) { if (pov >= 31500 || pov <= 4500) b |= 1; if (pov >= 4500 && pov <= 13500) b |= 8; if (pov >= 13500 && pov <= 22500) b |= 2; if (pov >= 22500 && pov <= 31500) b |= 4; }
      s.Pad.Buttons = b;
      s.Pad.LT = (byte)((B & 64) != 0 ? 255 : 0); s.Pad.RT = (byte)((B & 128) != 0 ? 255 : 0);
      s.Pad.LX = (short)((int)j.X - 32768); s.Pad.LY = (short)Math.Max(-32768, Math.Min(32767, 32767 - (int)j.Y));
      s.Pad.RX = (short)((int)j.Z - 32768); s.Pad.RY = (short)Math.Max(-32768, Math.Min(32767, 32767 - (int)j.R));
      s.Packet = ++jPacket; return true;
    } catch (Exception) { s = new ST(); return false; }
  }
  static bool Read(out ST s) {
    for (int i = 0; i < 4; i++) {
      int r;
      if (hasEx) { try { r = XInputGetStateEx(i, out s); } catch (Exception) { hasEx = false; r = XInputGetState(i, out s); } }
      else r = XInputGetState(i, out s);
      if (r == 0) { padIdx = i; return true; }
    }
    return ReadDs(out s);
  }
  static void Stick(double x, double y, double pw, out double ox, out double oy) {
    double mag = Math.Sqrt(x * x + y * y);
    if (mag < dead) { ox = 0; oy = 0; return; }
    double m = Math.Min(1.0, (mag - dead) / (1.0 - dead));
    double k = Math.Pow(m, pw) / mag;
    ox = x * k; oy = y * k;
  }
  static string Dir(ushort b, double lx, double ly, bool stick, long now) {   // direction with key-repeat
    string d = null;
    if ((b & 1) != 0) d = "up"; else if ((b & 2) != 0) d = "down"; else if ((b & 4) != 0) d = "left"; else if ((b & 8) != 0) d = "right";
    else if (stick) { if (ly > 0.6) d = "up"; else if (ly < -0.6) d = "down"; else if (lx < -0.6) d = "left"; else if (lx > 0.6) d = "right"; }
    if (d == null) { navDir = null; return null; }
    if (d != navDir) { navDir = d; navNext = now + 350; return d; }
    if (now >= navNext) { navNext = now + 110; return d; }
    return null;
  }
  public static void Run() {
    SetProcessDPIAware();
    Thread t = new Thread(delegate() {
      string l;
      while ((l = Console.In.ReadLine()) != null) {
        try {
          string[] p = l.Trim().Split(' ');
          if (p[0] == "on") on = true;
          else if (p[0] == "off") { on = false; kb = false; shield = false; }
          else if (p[0] == "shield" && p.Length == 2) { if (p[1] == "on") { MakeShield(); shield = shieldH != IntPtr.Zero; Out("shield " + (shield ? "armed" : "window failed")); } else shield = false; }
          else if (p[0] == "cursor" && p.Length == 3) SetCursorPos(int.Parse(p[1]), int.Parse(p[2]));
          else if (p[0] == "quit") { Tray(false); AutoHide(false); Environment.Exit(0); }
          else if (p[0] == "cfg" && p.Length == 4) {
            speed = double.Parse(p[1], CultureInfo.InvariantCulture);
            dead = double.Parse(p[2], CultureInfo.InvariantCulture);
            curve = double.Parse(p[3], CultureInfo.InvariantCulture);
          }
          else if (p[0] == "binds" && (p.Length >= 7 && p.Length <= 10)) { mSpace = p.Length >= 8 ? Mask(p[7]) : 0; mPrevK = p.Length >= 9 ? Mask(p[8]) : 0; mNextK = p.Length >= 10 ? Mask(p[9]) : 0; mLeft = Mask(p[1]); mRight = Mask(p[2]); mKbd = Mask(p[3]); mEnter = Mask(p[4]); mEsc = Mask(p[5]); mBack = Mask(p[6]); }
          else if (p[0] == "kb" && p.Length == 2) kb = (p[1] == "on");
          else if (p[0] == "intro" && p.Length == 2) introWatch = (p[1] == "on");
          else if (p[0] == "type" && p.Length == 2) { int code = int.Parse(p[1], CultureInfo.InvariantCulture); if (code >= 32 && code <= 126) TypeChar((char)code); }
          else if (p[0] == "key" && p.Length == 2) NamedKey(p[1]);
          else if (p[0] == "front" && p.Length == 2) { IntPtr fh = new IntPtr(long.Parse(p[1], CultureInfo.InvariantCulture)); if (!IsWindow(fh)) Out("ext gone"); else Front(fh); }
          else if (p[0] == "unclip") { try { ClipCursorFree(IntPtr.Zero); Out("unclip"); } catch (Exception) { } }
          else if (p[0] == "keephome" && p.Length == 7) { try { KeepHome(new IntPtr(long.Parse(p[1], CultureInfo.InvariantCulture)), int.Parse(p[2]), int.Parse(p[3]), int.Parse(p[4]), int.Parse(p[5]), int.Parse(p[6])); } catch (Exception) { } }
          else if (p[0] == "movehome" && p.Length == 6) { try { MoveHome(new IntPtr(long.Parse(p[1], CultureInfo.InvariantCulture)), int.Parse(p[2]), int.Parse(p[3]), int.Parse(p[4]), int.Parse(p[5])); } catch (Exception) { } }
          else if (p[0] == "place" && p.Length == 6) { int px = int.Parse(p[1]), py = int.Parse(p[2]), pw = int.Parse(p[3]), ph = int.Parse(p[4]); IntPtr mh = new IntPtr(long.Parse(p[5], CultureInfo.InvariantCulture)); Thread pt = new Thread(delegate() { try { Place(px, py, pw, ph, mh); } catch (Exception) { } }); pt.IsBackground = true; pt.Start(); }
          else if (p[0] == "closewin" && p.Length == 2) { IntPtr cwin = new IntPtr(long.Parse(p[1], CultureInfo.InvariantCulture)); if (IsWindow(cwin)) PostMessage(cwin, 0x0010u, IntPtr.Zero, IntPtr.Zero); }
          else if (p[0] == "gmute" && p.Length == 3) { var hs = new HashSet<uint>(); foreach (var x in p[1].Split(',')) { uint u; if (uint.TryParse(x, out u)) hs.Add(u); } if (hs.Count > 0) AM.Run(hs, p[2] == "1"); }
          else if (p[0] == "autohide" && p.Length == 2) AutoHide(p[1] == "on");
          else if (p[0] == "tbset" && p.Length == 2) TbSet(int.Parse(p[1], CultureInfo.InvariantCulture));
          else if (p[0] == "hidelaunch" && p.Length == 11) { int[] v = new int[8]; for (int k = 0; k < 8; k++) v[k] = int.Parse(p[k + 1], CultureInfo.InvariantCulture); HideLaunch(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], new IntPtr(long.Parse(p[9], CultureInfo.InvariantCulture)), int.Parse(p[10], CultureInfo.InvariantCulture)); }
          else if (p[0] == "unpark") Unpark();
          else if (p[0] == "fg" && p.Length == 1) Out("fg " + GetForegroundWindow().ToInt64().ToString());
          else if (p[0] == "pidof" && p.Length == 2) { uint pp = 0; GetWindowThreadProcessId(new IntPtr(long.Parse(p[1], CultureInfo.InvariantCulture)), out pp); Out("pidof " + p[1] + " " + pp.ToString()); }
          else if (p[0] == "side" && p.Length == 11) { int[] v = new int[8]; for (int k = 0; k < 8; k++) v[k] = int.Parse(p[k + 1], CultureInfo.InvariantCulture); Side(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], new IntPtr(long.Parse(p[9], CultureInfo.InvariantCulture)), int.Parse(p[10], CultureInfo.InvariantCulture)); }
          else if (p[0] == "fwd" && p.Length == 2) fwd = (p[1] == "on");
          else if (p[0] == "me" && p.Length == 2) consoleH = new IntPtr(long.Parse(p[1], CultureInfo.InvariantCulture));
          else if (p[0] == "regain" && p.Length == 3) Regain(p[1] == "on", new IntPtr(long.Parse(p[2], CultureInfo.InvariantCulture)));
          else if (p[0] == "sidegen" && p.Length >= 2) { if (p[1] == "on" && p.Length == 11) { int[] v = new int[8]; for (int k = 0; k < 8; k++) v[k] = int.Parse(p[k + 2], CultureInfo.InvariantCulture); Gen(true, v, new IntPtr(long.Parse(p[10], CultureInfo.InvariantCulture))); } else Gen(false, null, IntPtr.Zero); }
          else if (p[0] == "tray" && p.Length >= 2) Tray(p[1] == "hide", p.Length > 2 ? long.Parse(p[2], CultureInfo.InvariantCulture) : 0);
          else if (p[0] == "pin" && p.Length >= 2) Pin(long.Parse(p[1], CultureInfo.InvariantCulture), p.Length == 3);
          else if (p[0] == "ftarget" && p.Length == 2) frontT = new IntPtr(long.Parse(p[1], CultureInfo.InvariantCulture));
          else if (p[0] == "frontq" && p.Length == 3) { long age = long.Parse(p[2], CultureInfo.InvariantCulture); LII li = new LII(); li.cb = 8; bool quiet = !GetLastInputInfo(ref li) || (long)(uint)Environment.TickCount - li.t > age + 150 || age < 0; if (quiet) Front(new IntPtr(long.Parse(p[1], CultureInfo.InvariantCulture))); }
          else if (p[0] == "back" && p.Length == 2) Back(new IntPtr(long.Parse(p[1], CultureInfo.InvariantCulture)));
        } catch (Exception) { }
      }
      Tray(false); AutoHide(false); Environment.Exit(0);
    });
    t.IsBackground = true; t.Start();
    Tray(false);   // the taskbar is never left hidden
    Out("ready");
    bool lD = false, rD = false, comboPrev = false, armed = false, wasOn = false, wasKb = false;
    bool padOn = false, padKnown = false; string lastBat = ""; long batAt = -99999;
    long padAt = -99999;
    try { timeBeginPeriod(4); } catch (Exception) { }
    long viewDownAt = 0;
    ushort prevB = 0; double fx = 0, fy = 0, wheel = 0; long shNext = 0; bool shLast = false;
    Stopwatch sw = Stopwatch.StartNew(); long last = 0;
    while (true) {
      Thread.Sleep((on || wasOn || lD || rD || shield) ? 4 : 8);   // full speed only while the pointer is being steered; otherwise about 60 checks a second is plenty for buttons
      long now = sw.ElapsedMilliseconds; double dt = (now - last) / 1000.0; last = now;
      ST s;
      bool okPad = Read(out s);
      if (!padKnown || okPad != padOn) { padKnown = true; padOn = okPad; Out(okPad ? "pad 1" : "pad 0"); }
      if (okPad && now - batAt > 8000) { batAt = now; try { BAT bt; if (XInputGetBatteryInformation(padIdx, 0, out bt) == 0) { string bs = "batt " + bt.Type + " " + bt.Level; if (bs != lastBat) { lastBat = bs; Out(bs); } } } catch (Exception) { } }
      if (!okPad && lastBat != "batt 0 0") { lastBat = "batt 0 0"; Out(lastBat); }
      if (shield && !on) shield = false;
      if (shield && shieldH != IntPtr.Zero && !lD && !rD && now >= shNext) { IntPtr fgw = GetForegroundWindow(); if (fgw != shieldH) { if (fgw != IntPtr.Zero) tgtH = fgw; shNext = now + 60; Front(shieldH); if (GetForegroundWindow() != shieldH) { Thread.Sleep(25); Front(shieldH); } bool okF = GetForegroundWindow() == shieldH; if (okF != shLast) { shLast = okF; Out("shield " + (okF ? "holds focus (target " + tgtH + ")" : "could not take focus (target " + tgtH + ")")); } } }
      if (!okPad) { if (lD) { Click(0x4); lD = false; } if (rD) { Click(0x10); rD = false; } if (JoyPress() && now - padAt > 250 && !MouseBusy(150)) { padAt = now; Out(FgOther() ? "pad press other" : "pad press"); }   // not an XInput pad (a PlayStation controller): a touch still hands the focus back to the console
        Thread.Sleep(40); continue; }
      ushort b = s.Pad.Buttons; ushort pressed = (ushort)(b & ~prevB); ushort released = (ushort)(prevB & ~b); prevB = b;
      bool stickRaw = Math.Abs((int)s.Pad.LX) > (stickOn ? 9000 : 22000) || Math.Abs((int)s.Pad.LY) > (stickOn ? 9000 : 22000) || Math.Abs((int)s.Pad.RX) > (stickOn ? 9000 : 22000) || Math.Abs((int)s.Pad.RY) > (stickOn ? 9000 : 22000); bool stickMoved = stickRaw && !stickOn; stickOn = stickRaw;   // a stick counts only when it is pushed (not while it simply rests in a pushed position)
      nowMs = now;
      { PT cp0; if (GetCursorPos(out cp0)) { if (cp0.X != cpx || cp0.Y != cpy) { if (cpx != int.MinValue && !on) mouseAt = now; cpx = cp0.X; cpy = cp0.Y; } } if (!on && ((GetAsyncKeyState(1) & 0x8000) != 0 || (GetAsyncKeyState(2) & 0x8000) != 0)) mouseAt = now; }
      if ((pressed != 0 || stickMoved) && now - padAt > 250 && !MouseBusy(150)) { padAt = now; Out(FgOther() ? "pad press other" : "pad press"); }
      if (((b & 0xFBFF) != 0 || stickOn) && fwd && !on && !kb && now - frontAt > 50 && FgOther() && !MouseBusy(150)) { frontAt = now; try { Front(frontT != IntPtr.Zero && IsWindow(frontT) ? frontT : consoleH); } catch (Exception) { } }   // a controller button or stick held while a program on the other monitor has the focus: the console takes it back at once, and keeps asking every 50 ms until it has it (the mouse is never overridden)
      if ((pressed & 0x400) != 0) Out("guide down");   // Xbox logo button: hold = guide, quick press = Home
      if ((released & 0x400) != 0) Out("guide up");
      if ((pressed & 0x20) != 0) viewDownAt = now; if ((b & 0x20) == 0) viewDownAt = 0; else if (viewDownAt > 0 && now - viewDownAt > 800) { viewDownAt = 0; Out("guide"); }   // holding View opens the menu too
      if ((b & 0x320) == 0x320 && (pressed & 0x320) != 0) Out("guide");
      if (introWatch && (pressed & 0x1000) != 0) Out("btn a");   // only while the startup screen waits for A   // backup: LB + RB + View together
      bool combo = (b & 0xC0) == 0xC0;            // click both sticks (L3 + R3) toggles mouse mode
      if (combo && !comboPrev) { on = !on; if (!on) kb = false; Out(on ? "mode on" : "mode off"); }
      comboPrev = combo;
      if (fwd && !on && !kb && FgOther()) {   // the console is not the active window (you are using another monitor): its navigation still arrives through here
        string fd = Dir(b, s.Pad.LX / 32768.0, s.Pad.LY / 32768.0, true, now); if (fd != null) Out("p " + fd);
        if ((pressed & 0x1000) != 0) Out("p a"); if ((pressed & 0x2000) != 0) Out("p b"); if ((pressed & 0x100) != 0) Out("p lb"); if ((pressed & 0x200) != 0) Out("p rb");
      }
      if (on && !wasOn) armed = false;
      wasOn = on;
      if (wasKb && !kb) armed = false;
      wasKb = kb;
      int clickMask = mLeft | mRight;
      if (!on || (!armed && ((b & clickMask) != 0 || combo))) {
        if (lD) { Click(0x4); lD = false; } if (rD) { Click(0x10); rD = false; }
        if (on && (b & clickMask) == 0 && !combo) armed = true;
        continue;
      }
      armed = true;
      double lx = s.Pad.LX / 32768.0, ly = s.Pad.LY / 32768.0;
      if (kb) {                                   // typing-keyboard mode: report navigation to the app
        if (lD) { Click(0x4); lD = false; } if (rD) { Click(0x10); rD = false; }
        string kd = Dir(b, lx, ly, true, now); if (kd != null) Out("k " + kd);
        if ((pressed & 0x1000) != 0) Out("k a"); if ((pressed & 0x2000) != 0) Out("k b");
        if ((pressed & 0x4000) != 0) Out("k x"); if ((pressed & 0x8000) != 0) Out("k y");
        if ((pressed & 0x100) != 0) Out("k lb"); if ((pressed & 0x200) != 0) Out("k rb"); if ((pressed & 0x10) != 0) Out("k start");
        continue;
      }
      if (mKbd != 0 && (pressed & mKbd) != 0) { kb = true; Out("kb on"); if (lD) { Click(0x4); lD = false; } if (rD) { Click(0x10); rD = false; } continue; }
      if (!shield) {   // while the Store is open the controller is ONLY the mouse: no keys that would move the Store's own highlight
      if (mEnter != 0 && (pressed & mEnter) != 0) NamedKey("enter");
      if (mEsc != 0 && (pressed & mEsc) != 0) NamedKey("esc");
      if (mBack != 0 && (pressed & mBack) != 0) NamedKey("altleft");
      if (mSpace != 0 && (pressed & mSpace) != 0) NamedKey("space");
      if (mPrevK != 0 && (pressed & mPrevK) != 0) NamedKey("f13");
      if (mNextK != 0 && (pressed & mNextK) != 0) NamedKey("f14");
      string dd = Dir(b, 0, 0, false, now); if (dd != null) NamedKey(dd);   // D-pad = arrow keys
      }
      double mx, my;
      Stick(lx, -ly, curve, out mx, out my);
      if (dt > 0.05) dt = 0.05;
      fx += mx * speed * dt; fy += my * speed * dt;
      int ix = (int)fx, iy = (int)fy; fx -= ix; fy -= iy;
      if (ix != 0 || iy != 0) { PT p; if (GetCursorPos(out p)) SetCursorPos(p.X + ix, p.Y + iy); }
      bool a = (b & mLeft) != 0, bb = (b & mRight) != 0;
      if (a && !lD) { Click(0x2); lD = true; } else if (!a && lD) { Click(0x4); lD = false; }
      if (bb && !rD) { Click(0x8); rD = true; } else if (!bb && rD) { Click(0x10); rD = false; }
      double sx, sy;
      Stick(s.Pad.RX / 32768.0, s.Pad.RY / 32768.0, 1.0, out sx, out sy);
      wheel += sy * 1200 * dt;
      int w = (int)wheel; if (w != 0) { mouse_event(0x800, 0, 0, w, UIntPtr.Zero); wheel -= w; }
    }
  }
}
'@
if ($PSVersionTable.PSEdition -eq 'Core') { Add-Type -TypeDefinition $src -Language CSharp } else { Add-Type -TypeDefinition $src -Language CSharp -ReferencedAssemblies 'System.Core' }
[Mouse]::Run()
