using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace Cacup
{
    internal static class Program
    {
        private static Mutex instanceMutex;

        [DllImport("user32.dll")]
        private static extern bool SetProcessDPIAware();

        [STAThread]
        private static void Main()
        {
            bool created;
            instanceMutex = new Mutex(true, "Cacup.Desktop.SingleInstance", out created);
            if (!created)
            {
                MessageBox.Show("Cacup ya está abierto.", "Cacup", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            SetProcessDPIAware();
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
            GC.KeepAlive(instanceMutex);
        }
    }

    internal sealed class MainForm : Form
    {
        private const string AppUrl = "http://127.0.0.1:8787/";
        private const int DwmUseImmersiveDarkMode = 20;
        private const int DwmWindowCornerPreference = 33;

        private static readonly object LogLock = new object();
        private static string logPath;

        private readonly string appDirectory;
        private readonly string dataDirectory;
        private WebView2 webView;
        private Process serverProcess;
        private bool ownsServer;
        private Label statusLabel;

        [DllImport("dwmapi.dll")]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attribute, ref int value, int size);

        public MainForm()
        {
            appDirectory = AppDomain.CurrentDomain.BaseDirectory;
            dataDirectory = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Cacup");
            Directory.CreateDirectory(dataDirectory);
            logPath = Path.Combine(dataDirectory, "cacup.log");

            Text = "Cacup";
            StartPosition = FormStartPosition.CenterScreen;
            ClientSize = new Size(1460, 900);
            MinimumSize = new Size(1100, 700);
            BackColor = Color.FromArgb(13, 17, 19);
            ForeColor = Color.FromArgb(230, 236, 238);
            DoubleBuffered = true;
            try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); }
            catch { }

            statusLabel = new Label();
            statusLabel.Dock = DockStyle.Fill;
            statusLabel.TextAlign = ContentAlignment.MiddleCenter;
            statusLabel.Font = new Font("Segoe UI", 12F, FontStyle.Regular);
            statusLabel.ForeColor = Color.FromArgb(140, 235, 225);
            statusLabel.BackColor = Color.FromArgb(13, 17, 19);
            statusLabel.Text = "Iniciando Cacup…";
            Controls.Add(statusLabel);

            Load += async delegate { await InitializeAsync(); };
            FormClosing += OnClosing;
        }

        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            try
            {
                int dark = 1;
                DwmSetWindowAttribute(Handle, DwmUseImmersiveDarkMode, ref dark, sizeof(int));
                int rounded = 2;
                DwmSetWindowAttribute(Handle, DwmWindowCornerPreference, ref rounded, sizeof(int));
            }
            catch { }
        }

        private async Task InitializeAsync()
        {
            bool ready = await WaitForServer(1200);
            if (!ready)
            {
                StartServer();
                ready = await WaitForServer(30000);
            }

            if (!ready)
            {
                statusLabel.Text = "No se pudo iniciar el servidor local de Cacup.\r\nRevisa " + logPath;
                return;
            }

            try
            {
                string userData = Path.Combine(dataDirectory, "WebView2");
                Directory.CreateDirectory(userData);
                CoreWebView2Environment environment = await CoreWebView2Environment.CreateAsync(null, userData);
                webView = new WebView2();
                webView.Dock = DockStyle.Fill;
                webView.DefaultBackgroundColor = Color.FromArgb(13, 17, 19);
                Controls.Add(webView);
                webView.BringToFront();
                await webView.EnsureCoreWebView2Async(environment);

                CoreWebView2Settings settings = webView.CoreWebView2.Settings;
                settings.AreDevToolsEnabled = false;
                settings.AreDefaultContextMenusEnabled = false;
                settings.IsStatusBarEnabled = false;
                settings.AreBrowserAcceleratorKeysEnabled = false;
                settings.IsZoomControlEnabled = true;
                settings.IsPasswordAutosaveEnabled = false;
                settings.IsGeneralAutofillEnabled = false;

                webView.CoreWebView2.Navigate(AppUrl);
                statusLabel.Visible = false;
            }
            catch (Exception error)
            {
                Log("WebView2: " + error);
                statusLabel.Text = "No se pudo abrir la interfaz de Cacup.\r\n" +
                    "Comprueba que WebView2 Runtime esté instalado.\r\n" + error.Message;
            }
        }

        private void StartServer()
        {
            try
            {
                string node = Path.Combine(appDirectory, "node.exe");
                if (!File.Exists(node)) node = "node.exe";
                string script = Path.Combine(appDirectory, "server.mjs");
                if (!File.Exists(script))
                {
                    Log("No se encontró server.mjs en " + appDirectory);
                    return;
                }

                ProcessStartInfo info = new ProcessStartInfo(node, "\"" + script + "\"");
                info.WorkingDirectory = appDirectory;
                info.UseShellExecute = false;
                info.CreateNoWindow = true;
                info.RedirectStandardOutput = true;
                info.RedirectStandardError = true;
                info.EnvironmentVariables["PORT"] = "8787";
                info.EnvironmentVariables["CACUP_DESKTOP"] = "1";

                serverProcess = new Process();
                serverProcess.StartInfo = info;
                serverProcess.OutputDataReceived += delegate(object sender, DataReceivedEventArgs args) { Log(args.Data); };
                serverProcess.ErrorDataReceived += delegate(object sender, DataReceivedEventArgs args) { Log(args.Data); };
                serverProcess.Start();
                serverProcess.BeginOutputReadLine();
                serverProcess.BeginErrorReadLine();
                ownsServer = true;
                Log("Servidor iniciado (PID " + serverProcess.Id + ")");
            }
            catch (Exception error)
            {
                Log("Servidor: " + error);
            }
        }

        private static async Task<bool> WaitForServer(int timeoutMs)
        {
            DateTime deadline = DateTime.UtcNow.AddMilliseconds(timeoutMs);
            using (HttpClient client = new HttpClient())
            {
                client.Timeout = TimeSpan.FromMilliseconds(900);
                while (DateTime.UtcNow < deadline)
                {
                    try
                    {
                        HttpResponseMessage response = await client.GetAsync(AppUrl);
                        if (response.IsSuccessStatusCode) return true;
                    }
                    catch { }
                    await Task.Delay(300);
                }
            }
            return false;
        }

        private static void Log(string line)
        {
            if (string.IsNullOrEmpty(line)) return;
            try
            {
                lock (LogLock)
                {
                    File.AppendAllText(logPath, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " " + line + Environment.NewLine);
                }
            }
            catch { }
        }

        private void OnClosing(object sender, FormClosingEventArgs e)
        {
            if (webView != null)
            {
                try { webView.Dispose(); }
                catch { }
                webView = null;
            }
            if (ownsServer && serverProcess != null)
            {
                try
                {
                    if (!serverProcess.HasExited)
                    {
                        serverProcess.Kill();
                        serverProcess.WaitForExit(2500);
                    }
                }
                catch { }
                serverProcess = null;
            }
        }
    }
}
