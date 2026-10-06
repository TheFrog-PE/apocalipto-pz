using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;

namespace BentoLauncher
{
    class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            string url = "http://localhost:5174";
            
            // 1. Verificar si Bento OS ya está corriendo
            bool isRunning = false;
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
                req.Timeout = 1500;
                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                {
                    if (res.StatusCode == HttpStatusCode.OK) isRunning = true;
                }
            }
            catch {}

            // 2. Si no está corriendo, levantarlo silenciosamente en segundo plano
            if (!isRunning)
            {
                string adminDir = @"E:\PZ-PROYECT\PZ-ADMIN";
                if (Directory.Exists(adminDir))
                {
                    ProcessStartInfo serverProc = new ProcessStartInfo();
                    serverProc.FileName = "cmd.exe";
                    serverProc.Arguments = "/c npm run dev -- --port 5174 --host";
                    serverProc.WorkingDirectory = adminDir;
                    serverProc.WindowStyle = ProcessWindowStyle.Hidden;
                    serverProc.CreateNoWindow = true;
                    serverProc.UseShellExecute = false;
                    Process.Start(serverProc);
                    Thread.Sleep(2000);
                }
            }

            // 3. Abrir en modo aplicación nativa de escritorio independiente con perfil dedicado
            string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
            if (!File.Exists(edgePath))
            {
                edgePath = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
            }

            try
            {
                if (File.Exists(edgePath))
                {
                    string profileDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "BentoOS_AppProfile");
                    ProcessStartInfo appProc = new ProcessStartInfo();
                    appProc.FileName = edgePath;
                    appProc.Arguments = "--user-data-dir=\"" + profileDir + "\" --app=" + url + " --window-size=1600,960";
                    Process.Start(appProc);
                }
                else
                {
                    Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
                }
            }
            catch
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
        }
    }
}
