; Cacup - Instalador (Inno Setup 6)
; Generado por tools/build-installer.ps1

#define MyAppName "Cacup"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "AITOR2010 (Aitor2010aitor)"
#define MyAppURL "https://github.com/Aitor2010aitor/openCUP"
#define MyAppExeName "Cacup.exe"

[Setup]
AppId={{B7E3F2A1-4C5D-4E6F-8A9B-0C1D2E3F4A5B}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=..\dist
OutputBaseFilename=Cacup-Setup-{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName} {#MyAppVersion}

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "Crear icono en el escritorio"; GroupDescription: "Iconos adicionales:"
Name: "startmenu"; Description: "Crear entrada en el menú Inicio"; GroupDescription: "Iconos adicionales:"; Flags: checkedonce

[Files]
Source: "..\dist\Cacup\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: ".cacup-ai-token"

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: startmenu
Name: "{group}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"; Tasks: startmenu
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Abrir Cacup"; Flags: nowait postinstall skipifsilent
