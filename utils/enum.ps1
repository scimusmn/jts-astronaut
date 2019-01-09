$Assem = (
  "System",
  "System.DirectoryServices",
  "System.Data",
  "System.DefaultManagementInstaller",
  "System.Core"
)

$Signature = @"
[DllImport("user32.dll")]
static extern bool EnumDisplayDevices(string lpDevice, uint iDevNum, ref DISPLAY_DEVICE lpDisplayDevice, uint dwFlags);
"@

Add-Type -TypeDefinition @"

namespace Parcel.Tools
{
[StructLayout(LayoutKind.Sequential, CharSet=CharSet.Auto)]
public struct DISPLAY_DEVICE
{
  [MarshalAs(UnmanagedType.U4)]
  public int cb;
  [MarshalAs(UnmanagedType.ByValTStr, SizeConst=32)]
  public string DeviceName;
  [MarshalAs(UnmanagedType.ByValTStr, SizeConst=128)]
  public string DeviceString;
  [MarshalAs(UnmanagedType.U4)]
  public DisplayDeviceStateFlags StateFlags;
  [MarshalAs(UnmanagedType.ByValTStr, SizeConst=128)]
  public string DeviceID;
[MarshalAs(UnmanagedType.ByValTStr, SizeConst=128)]
  public string DeviceKey;
}

    public static class MonitorInfo
    {
        public static void Get()
        {
        DISPLAY_DEVICE d=new DISPLAY_DEVICE();
        d.cb=Marshal.SizeOf(d);
        try {
            for (uint id=0; EnumDisplayDevices(null, id, ref d, 0); id++) {
                Console.WriteLine(
                    String.Format("{0}, {1}, {2}, {3}, {4}, {5}",
                             id,
                             d.DeviceName,
                             d.DeviceString,
                             d.StateFlags,
                             d.DeviceID,
                             d.DeviceKey
                             )
                              );
                d.cb=Marshal.SizeOf(d);
            }
        } catch (Exception ex) {
            Console.WriteLine(String.Format("{0}",ex.ToString()));
        }
        }
    }
}
"@
