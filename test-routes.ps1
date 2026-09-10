$baseUrl = "http://localhost:3000"
$routes = @(
    "/admin/settings",
    "/admin/settings/camino",
    "/admin/settings/lecciones",
    "/admin/settings/materias",
    "/admin/settings/etapas"
)

foreach ($route in $routes) {
    try {
        $r = Invoke-WebRequest -Uri "$baseUrl$route" -Method GET -UseBasicParsing -ErrorAction Stop
        Write-Host "$route : $($r.StatusCode) $($r.StatusDescription)"
    } catch {
        Write-Host "$route : ERROR - $($_.Exception.Message)"
    }
}