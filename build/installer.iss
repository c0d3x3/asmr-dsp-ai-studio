; Inno Setup 6 Script for ASMR-DSP Windows 11 Installer
#define MyAppName "ASMR-DSP"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "ASMR-DSP Audio Tools"
#define MyAppURL "https://github.com/asmr-dsp/asmr-dsp"
#define MyAppExeName "ASMR-DSP.exe"

[Setup]
AppId={{D37E8C78-9B92-4C99-9D6B-883F05C3B7AE}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
OutputDir=..\dist
OutputBaseFilename=ASMR-DSP-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=lowest

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "startupicon"; Description: "Start ASMR-DSP automatically with Windows"; GroupDescription: "Startup Options:"; Flags: unchecked

[Files]
Source: "..\dist\ASMR-DSP\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\ASMR-DSP\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\profiles\*"; DestDir: "{app}\profiles"; Flags: ignoreversion recursesubdirs createallsubdirs

[Dirs]
Name: "{localappdata}\ASMR-DSP"
Name: "{localappdata}\ASMR-DSP\profiles"
Name: "{localappdata}\ASMR-DSP\logs"
Name: "{localappdata}\ASMR-DSP\measurements"

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Parameters: "--minimized"; Tasks: startupicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
