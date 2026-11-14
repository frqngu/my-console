# Separate little watcher (so it can never affect the controller helper): tells the console when the app, web page or game you opened has been closed and nothing is left in front.
$src = @'
using System;
using System.Text;
using System.Threading;
using System.Runtime.InteropServices;
public static class Watch {
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern bool IsWindow(IntPtr h);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc p, IntPtr l);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder sb, int n);
  [DllImport("user32.dll")] static extern bool GetCursorPos(out PT p);
  [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
  [StructLayout(LayoutKind.Sequential)] public struct PT { public int X; public int Y; }
  static long bx = 0, by = 0, bw = 0, bh = 0;   // the console's own monitor: while the pointer is on another monitor you are using something else, so never take the screen back
  static bool CursorAway() { if (bw <= 0) return false; PT p; if (!GetCursorPos(out p)) return false; return p.X < bx || p.X >= bx + bw || p.Y < by || p.Y >= by + bh; }
  static volatile bool on = false, fresh = false; static long me = 0, target = 0;
  static int BrowserWindows() {   // how many browser windows are open (not counting the console itself): when it drops, the page you opened was closed
    int n = 0;
    EnumWindows(delegate(IntPtr h, IntPtr l) { if (h.ToInt64() != me && IsWindowVisible(h)) { StringBuilder sb = new StringBuilder(64); GetClassName(h, sb, 64); string c = sb.ToString(); if (c == "Chrome_WidgetWin_1" || c == "MozillaWindowClass") n++; } return true; }, IntPtr.Zero);
    return n;
  }
  static bool Nothing() {
    IntPtr fg = GetForegroundWindow();
    if (fg == IntPtr.Zero) return false;   // a window switching moment, not an empty screen
    if (fg.ToInt64() == me) return true;
    StringBuilder sb = new StringBuilder(64); GetClassName(fg, sb, 64); string c = sb.ToString();
    return c == "Progman" || c == "WorkerW" || c == "Shell_TrayWnd" || c == "Shell_SecondaryTrayWnd";
  }
  public static void Run() {
    Thread t = new Thread(delegate() {
      string l;
      while ((l = Console.In.ReadLine()) != null) {
        try {
          string[] p = l.Trim().Split(' ');
          if (p[0] == "on" && (p.Length == 3 || p.Length == 7)) { me = long.Parse(p[1]); target = long.Parse(p[2]); if (p.Length == 7) { bx = long.Parse(p[3]); by = long.Parse(p[4]); bw = long.Parse(p[5]); bh = long.Parse(p[6]); } if (!on) fresh = true; on = true; }
          else if (p[0] == "off") { on = false; }
          else if (p[0] == "quit") Environment.Exit(0);
        } catch (Exception) { }
      }
      Environment.Exit(0);
    });
    t.IsBackground = true; t.Start();
    Console.Out.WriteLine("ready"); Console.Out.Flush();
    SetProcessDPIAware();
    int hits = 0, settle = 0, maxN = 0; bool armed = false;
    while (true) {
      Thread.Sleep(1000);
      if (!on) { hits = 0; armed = false; continue; }
      if (fresh) { fresh = false; armed = false; settle = 0; maxN = 0; }
      if (CursorAway()) { hits = 0; if (armed) maxN = BrowserWindows(); continue; }
      int bn = BrowserWindows();
      if (!armed) { if (bn > maxN) maxN = bn; if (++settle >= 6) armed = true; }
      else { if (bn > maxN) maxN = bn; }   // a browser makes and closes little helper windows (video hover cards, pop-ups) all the time, so a changing window count never means the page was closed
      if (target != 0 && !IsWindow(new IntPtr(target))) { on = false; hits = 0; Console.Out.WriteLine("gone"); Console.Out.Flush(); continue; }
      if (Nothing()) { if (++hits >= 5) { hits = 0; on = false; Console.Out.WriteLine("idle"); Console.Out.Flush(); } } else hits = 0;
    }
  }
}
'@
Add-Type -TypeDefinition $src -Language CSharp
[Watch]::Run()
