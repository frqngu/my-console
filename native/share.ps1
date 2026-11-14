param([int]$Len = 16, [int]$ByteAt = 12, [int]$BitAt = 3)
# Listens to the controller's raw HID reports (works in the background) and prints which button bit just went down.
$src = @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public class ShareWatch {
  [StructLayout(LayoutKind.Sequential)] public struct RID { public ushort page; public ushort usage; public uint flags; public IntPtr target; }
  [StructLayout(LayoutKind.Sequential)] public struct MSG { public IntPtr hwnd; public uint message; public IntPtr wParam; public IntPtr lParam; public uint time; public int x; public int y; }
  [DllImport("user32.dll")] public static extern bool RegisterRawInputDevices(RID[] p, uint n, uint size);
  [DllImport("user32.dll")] public static extern uint GetRawInputData(IntPtr h, uint cmd, IntPtr data, ref uint size, uint hdr);
  [DllImport("user32.dll", CharSet = CharSet.Auto)] public static extern IntPtr CreateWindowEx(uint ex, string cls, string name, uint style, int x, int y, int w, int h, IntPtr parent, IntPtr menu, IntPtr inst, IntPtr param);
  [DllImport("user32.dll")] public static extern int GetMessage(out MSG m, IntPtr hwnd, uint min, uint max);
  public delegate IntPtr HookProc(int code, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] public static extern IntPtr SetWindowsHookEx(int id, HookProc fn, IntPtr mod, uint tid);
  [DllImport("user32.dll")] public static extern IntPtr CallNextHookEx(IntPtr h, int code, IntPtr w, IntPtr l);
  [DllImport("kernel32.dll", CharSet = CharSet.Auto)] public static extern IntPtr GetModuleHandle(string n);
  public static HookProc keep;
  public static IntPtr hook = IntPtr.Zero;
  public static IntPtr Cb(int code, IntPtr w, IntPtr l) {   // the Print Screen key (which Windows sends for the Share button) is swallowed, so no snipping window opens
    if (code >= 0 && Marshal.ReadInt32(l) == 0x2C) { Console.WriteLine("share blocked printscreen"); Console.Out.Flush(); return new IntPtr(1); }
    if (code >= 0 && Marshal.ReadInt32(l) == 0x13) { if ((int)w == 0x100 || (int)w == 0x104) { if (!pauseDown) { pauseDown = true; Console.WriteLine("pausekey 1"); Console.Out.Flush(); } } else pauseDown = false; return new IntPtr(1); }   // the Pause key opens/closes the Xbox menu (the game never sees it)
    return CallNextHookEx(hook, code, w, l);
  }
  public static bool pauseDown = false;
  public static void Run(int wl, int wb, int wbit) {
    IntPtr hw = CreateWindowEx(0, "STATIC", "cnshare", 0, 0, 0, 0, 0, new IntPtr(-3), IntPtr.Zero, IntPtr.Zero, IntPtr.Zero);
    if (hw == IntPtr.Zero) { Console.WriteLine("share error window"); return; }
    RID[] r = new RID[2];
    r[0].page = 1; r[0].usage = 5; r[0].flags = 0x100; r[0].target = hw;
    r[1].page = 1; r[1].usage = 4; r[1].flags = 0x100; r[1].target = hw;
    if (!RegisterRawInputDevices(r, 2, (uint)Marshal.SizeOf(typeof(RID)))) { Console.WriteLine("share error register"); return; }
    keep = new HookProc(Cb);
    hook = SetWindowsHookEx(13, keep, GetModuleHandle(null), 0);
    if (hook == IntPtr.Zero) Console.WriteLine("share error hook");
    Console.WriteLine("share ready");
    Dictionary<long, byte[]> last = new Dictionary<long, byte[]>();
    int hdr = IntPtr.Size == 8 ? 24 : 16;
    bool shareDown = false;
    MSG m; int logged = 0; DateTime win = DateTime.Now;
    while (GetMessage(out m, IntPtr.Zero, 0, 0) > 0) {
      if (m.message != 0xFF) continue;
      uint size = 0;
      GetRawInputData(m.lParam, 0x10000003, IntPtr.Zero, ref size, (uint)hdr);
      if (size == 0 || size > 4096) continue;
      IntPtr buf = Marshal.AllocHGlobal((int)size);
      try {
        if (GetRawInputData(m.lParam, 0x10000003, buf, ref size, (uint)hdr) != size) continue;
        if (Marshal.ReadInt32(buf, 0) != 2) continue;
        long dev = Marshal.ReadIntPtr(buf, 8).ToInt64();
        int len = Marshal.ReadInt32(buf, hdr);
        int cnt = Marshal.ReadInt32(buf, hdr + 4);
        if (len <= 0 || len > 256 || cnt < 1) continue;
        byte[] d = new byte[len];
        Marshal.Copy(new IntPtr(buf.ToInt64() + hdr + 8), d, 0, len);
        if (len == wl && wb < len) {
          bool nowDown = (d[wb] & (1 << wbit)) != 0;
          if (nowDown != shareDown) { shareDown = nowDown; Console.WriteLine(nowDown ? "share 1" : "share 0"); Console.Out.Flush(); }
        }
        byte[] p;
        if (last.TryGetValue(dev, out p) && p.Length == len) {
          int changed = 0;
          for (int i = 0; i < len; i++) if (d[i] != p[i]) changed++;
          if (changed > 0 && changed <= 2) {
            for (int i = 0; i < len; i++) {
              int up = (d[i] ^ p[i]) & d[i];
              for (int b = 0; b < 8; b++) {
                if ((up & (1 << b)) == 0) continue;
                if ((DateTime.Now - win).TotalSeconds > 10) { win = DateTime.Now; logged = 0; }
                if (++logged > 30) continue;
                Console.WriteLine("hid " + len + " " + i + " " + b + " 1");
                Console.Out.Flush();
              }
            }
          }
        }
        last[dev] = d;
      } finally { Marshal.FreeHGlobal(buf); }
    }
  }
}
'@
Add-Type -TypeDefinition $src -Language CSharp
[ShareWatch]::Run($Len, $ByteAt, $BitAt)
