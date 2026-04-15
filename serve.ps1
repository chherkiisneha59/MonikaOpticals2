# Monika Opticals — Persistent Backend Server
# Serves static files + JSON API for admin CRUD
# Data is saved to disk in /data/*.json files

$port = 3000
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataDir = Join-Path $root "data"

# Ensure data directory exists
if (-not (Test-Path $dataDir)) { New-Item -Path $dataDir -ItemType Directory | Out-Null }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host ""
Write-Host "  Monika Opticals Backend Server" -ForegroundColor Cyan
Write-Host "  ===============================" -ForegroundColor Cyan
Write-Host "  Serving from: $root" -ForegroundColor Gray
Write-Host "  Data dir:     $dataDir" -ForegroundColor Gray
Write-Host ""
Write-Host "  Local:   http://localhost:$port/" -ForegroundColor Green
Write-Host "  Admin:   http://localhost:$port/admin.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "  API Endpoints:" -ForegroundColor Magenta
Write-Host "    GET  /api/products    - Read products" -ForegroundColor Gray
Write-Host "    POST /api/products    - Save products" -ForegroundColor Gray
Write-Host "    GET  /api/banners     - Read banners" -ForegroundColor Gray
Write-Host "    POST /api/banners     - Save banners" -ForegroundColor Gray
Write-Host ""
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.svg'  = 'image/svg+xml'
    '.webp' = 'image/webp'
    '.ico'  = 'image/x-icon'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
    '.ttf'  = 'font/ttf'
}

function Send-JsonResponse($response, $statusCode, $body) {
    $response.StatusCode = $statusCode
    $response.ContentType = 'application/json; charset=utf-8'
    $response.Headers.Add("Access-Control-Allow-Origin", "*")
    $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Read-RequestBody($request) {
    $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
    $body = $reader.ReadToEnd()
    $reader.Close()
    return $body
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath
        $method = $request.HttpMethod

        # ── CORS preflight ──
        if ($method -eq 'OPTIONS') {
            $response.StatusCode = 204
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
            $response.ContentLength64 = 0
            $response.OutputStream.Close()
            continue
        }

        # ── API: GET /api/products ──
        if ($urlPath -eq '/api/products' -and $method -eq 'GET') {
            $file = Join-Path $dataDir "products.json"
            if (Test-Path $file) {
                $json = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
            } else {
                $json = '[]'
            }
            Send-JsonResponse $response 200 $json
            Write-Host "  200  GET  /api/products" -ForegroundColor Cyan
            $response.OutputStream.Close()
            continue
        }

        # ── API: POST /api/products ──
        if ($urlPath -eq '/api/products' -and $method -eq 'POST') {
            $body = Read-RequestBody $request
            $file = Join-Path $dataDir "products.json"
            [System.IO.File]::WriteAllText($file, $body, [System.Text.Encoding]::UTF8)
            Send-JsonResponse $response 200 '{"ok":true,"message":"Products saved"}'
            Write-Host "  200  POST /api/products  (saved)" -ForegroundColor Green
            $response.OutputStream.Close()
            continue
        }

        # ── API: GET /api/banners ──
        if ($urlPath -eq '/api/banners' -and $method -eq 'GET') {
            $file = Join-Path $dataDir "banners.json"
            if (Test-Path $file) {
                $json = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
            } else {
                $json = '[]'
            }
            Send-JsonResponse $response 200 $json
            Write-Host "  200  GET  /api/banners" -ForegroundColor Cyan
            $response.OutputStream.Close()
            continue
        }

        # ── API: POST /api/banners ──
        if ($urlPath -eq '/api/banners' -and $method -eq 'POST') {
            $body = Read-RequestBody $request
            $file = Join-Path $dataDir "banners.json"
            [System.IO.File]::WriteAllText($file, $body, [System.Text.Encoding]::UTF8)
            Send-JsonResponse $response 200 '{"ok":true,"message":"Banners saved"}'
            Write-Host "  200  POST /api/banners   (saved)" -ForegroundColor Green
            $response.OutputStream.Close()
            continue
        }

        # ── API: POST /api/reset ──
        if ($urlPath -eq '/api/reset' -and $method -eq 'POST') {
            $body = Read-RequestBody $request
            # body contains { products: [...], banners: [...] }
            try {
                $data = $body | ConvertFrom-Json
                if ($data.products) {
                    $prodFile = Join-Path $dataDir "products.json"
                    $prodJson = $data.products | ConvertTo-Json -Depth 10 -Compress
                    [System.IO.File]::WriteAllText($prodFile, $prodJson, [System.Text.Encoding]::UTF8)
                }
                if ($data.banners) {
                    $banFile = Join-Path $dataDir "banners.json"
                    $banJson = $data.banners | ConvertTo-Json -Depth 10 -Compress
                    [System.IO.File]::WriteAllText($banFile, $banJson, [System.Text.Encoding]::UTF8)
                }
                Send-JsonResponse $response 200 '{"ok":true,"message":"Reset complete"}'
                Write-Host "  200  POST /api/reset     (reset to defaults)" -ForegroundColor Yellow
            } catch {
                Send-JsonResponse $response 500 '{"ok":false,"message":"Reset failed"}'
                Write-Host "  500  POST /api/reset     (error)" -ForegroundColor Red
            }
            $response.OutputStream.Close()
            continue
        }

        # ── Static file serving ──
        if ($urlPath -eq '/') { $urlPath = '/index.html' }
        $filePath = Join-Path $root ($urlPath -replace '/', '\')

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }

            $response.ContentType = $contentType
            $response.StatusCode = 200

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)

            Write-Host "  200  $urlPath" -ForegroundColor DarkGray
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 Not Found</h1>")
            $response.ContentType = 'text/html'
            $response.ContentLength64 = $msg.Length
            $response.OutputStream.Write($msg, 0, $msg.Length)
            Write-Host "  404  $urlPath" -ForegroundColor Red
        }

        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
    Write-Host "`n  Server stopped." -ForegroundColor Yellow
}
