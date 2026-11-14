Set s = CreateObject("WScript.Shell")
d = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
s.CurrentDirectory = d
s.Run """" & d & "\node_modules\electron\dist\electron.exe"" """ & d & """", 0, False
