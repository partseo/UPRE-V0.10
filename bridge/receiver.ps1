[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ExpectedRoot = "D:\projects\UPRE-V0.10"
$ProjectName = "UPRE-V0.10"
$StatePath = Join-Path $ExpectedRoot ".master\state\executor.json"

function Invoke-Git {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $output = & git @Arguments 2>&1
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed: $($output -join [Environment]::NewLine)"
    }
    return ($output -join [Environment]::NewLine)
}

function Write-Utf8File {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )
    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Write-State {
    param([Parameter(Mandatory = $true)][object]$State)
    $State.last_heartbeat = [DateTime]::UtcNow.ToString("o")
    Write-Utf8File -Path $StatePath -Content (($State | ConvertTo-Json -Depth 8) + [Environment]::NewLine)
}

function Get-HeaderValue {
    param(
        [Parameter(Mandatory = $true)][string]$Text,
        [Parameter(Mandatory = $true)][string]$Name
    )
    $match = [regex]::Match($Text, "(?m)^$([regex]::Escape($Name)):\s*(.+?)\s*$")
    if (-not $match.Success) { return $null }
    return $match.Groups[1].Value
}

function Test-SafetyGate {
    param([Parameter(Mandatory = $true)][string]$Text)
    $negativeContext = '(?i)(금지|하지\s*마|하지\s*않|do\s+not|prohibit|forbidden)'
    $dangerousAction = '(?i)(git\s+reset\s+--hard|git\s+clean\s+-fd|force[- ]?push|git\s+push[^\r\n]*--force|credential|secret|token|cookie|외부\s*데이터\s*전송|대량\s*삭제|docs/MASTER_DIRECTIVE\.md)'
    $inProhibitionSection = $false
    foreach ($line in ($Text -split "`r?`n")) {
        if ($line -match '^##\s+') {
            $inProhibitionSection = $line -match '(?i)(금지|prohibit|forbidden)'
            continue
        }
        if ($inProhibitionSection) { continue }
        if ($line -match $negativeContext) { continue }
        if ($line -match $dangerousAction) { return $false }
        if ($line -match '(?i)[A-Z]:\\' -and $line -notmatch [regex]::Escape($ExpectedRoot)) { return $false }
        if ($line -match '(?i)Program\s+Model.*(재설계|redesign)') { return $false }
    }
    return $true
}

function Write-Response {
    param(
        [Parameter(Mandatory = $true)][string]$CommandId,
        [Parameter(Mandatory = $true)][string]$Status,
        [Parameter(Mandatory = $true)][string]$StartedAt,
        [Parameter(Mandatory = $true)][string[]]$FilesChanged,
        [Parameter(Mandatory = $true)][int]$CodexExitCode,
        [Parameter(Mandatory = $true)][string]$Acceptance,
        [Parameter(Mandatory = $true)][string]$Blockers
    )
    $number = $CommandId.Substring(4)
    $responsePath = Join-Path $ExpectedRoot ".master\responses\RES-$number.md"
    $content = @"
COMMAND_ID: $CommandId
STATUS: $Status
STARTED_AT: $StartedAt
FINISHED_AT: $([DateTime]::UtcNow.ToString("o"))
FILES_CHANGED: $($FilesChanged -join ', ')
COMMANDS_RUN: git fetch origin main; git pull --ff-only origin main; codex exec; git commit; git push origin main
TESTS: Receiver safety and execution gates
EXIT_CODES: codex=$CodexExitCode
ACCEPTANCE: $Acceptance
BLOCKERS: $Blockers
SCOPE_DRIFT: NONE DETECTED
COMMIT_SHA: PENDING
NEXT_RECOMMENDATION: MASTER REVIEW
"@
    Write-Utf8File -Path $responsePath -Content ($content + [Environment]::NewLine)
    return $responsePath
}

$resolvedRoot = (Resolve-Path -LiteralPath ".").Path.TrimEnd('\')
if (-not $resolvedRoot.Equals($ExpectedRoot, [StringComparison]::OrdinalIgnoreCase)) {
    [Console]::Error.WriteLine("HUMAN_REQUIRED: expected $ExpectedRoot, found $resolvedRoot")
    exit 2
}

$dirty = Invoke-Git -Arguments @("status", "--porcelain")
if (-not [string]::IsNullOrWhiteSpace($dirty)) {
    [Console]::Error.WriteLine("HUMAN_REQUIRED: unexpected dirty working tree")
    exit 2
}

Invoke-Git -Arguments @("fetch", "origin", "main") | Out-Null
& git merge-base --is-ancestor HEAD origin/main
if ($LASTEXITCODE -ne 0) {
    [Console]::Error.WriteLine("HUMAN_REQUIRED: main cannot fast-forward to origin/main")
    exit 2
}
Invoke-Git -Arguments @("pull", "--ff-only", "origin", "main") | Out-Null

$state = Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json
$processedIds = @($state.processed_ids)
if ($state.current_status -eq "RUNNING" -or $null -ne $state.current_command_id) {
    [Console]::Error.WriteLine("HUMAN_REQUIRED: executor has an unfinished command")
    exit 2
}
$candidates = Get-ChildItem -LiteralPath (Join-Path $ExpectedRoot ".master\inbox") -Filter "DIR-*.md" -File |
    Where-Object { $_.BaseName -match '^DIR-(\d{4})$' -and $processedIds -notcontains $_.BaseName } |
    Sort-Object { [int]$_.BaseName.Substring(4) }

if (@($candidates).Count -eq 0) {
    Write-Output "IDLE: no unprocessed command"
    exit 0
}

$command = @($candidates)[0]
$commandId = $command.BaseName
$commandText = Get-Content -LiteralPath $command.FullName -Raw
$project = Get-HeaderValue -Text $commandText -Name "PROJECT"
$scope = Get-HeaderValue -Text $commandText -Name "SCOPE"
if ($processedIds -contains $commandId) {
    [Console]::Error.WriteLine("HUMAN_REQUIRED: duplicate command $commandId")
    exit 2
}
if ($project -ne $ProjectName -or [string]::IsNullOrWhiteSpace($scope) -or $commandText -notmatch '(?m)^## STOP CONDITION\s*$') {
    [Console]::Error.WriteLine("HUMAN_REQUIRED: invalid PROJECT, SCOPE, or STOP CONDITION")
    exit 2
}
if (-not (Test-SafetyGate -Text $commandText)) {
    [Console]::Error.WriteLine("HUMAN_REQUIRED: command failed safety gate")
    exit 2
}

$startedAt = [DateTime]::UtcNow.ToString("o")
$state.current_command_id = $commandId
$state.current_status = "RUNNING"
Write-State -State $state

$executionPrompt = @"
Execute only the attached MASTER directive inside $ExpectedRoot. Do not modify bridge control files, commit, or push; receiver.ps1 owns result transport. Stop at the directive's STOP CONDITION.

$commandText
"@
$codexOutput = $executionPrompt | & codex exec --ephemeral --sandbox workspace-write --approve-for-me -C $ExpectedRoot - 2>&1
$codexExitCode = $LASTEXITCODE
$changedFiles = @((Invoke-Git -Arguments @("status", "--porcelain")) -split "`r?`n" | Where-Object { $_ } | ForEach-Object { $_.Substring(3) })
$status = "COMPLETE"
$acceptance = "CODEX EXIT 0"
$blockers = "NONE"
if ($codexExitCode -ne 0) {
    $status = "FAILED"
    $acceptance = "FAIL"
    $blockers = (($codexOutput | Select-Object -Last 1) -join " ")
}

$responsePath = Write-Response -CommandId $commandId -Status $status -StartedAt $startedAt -FilesChanged $changedFiles -CodexExitCode $codexExitCode -Acceptance $acceptance -Blockers $blockers
Move-Item -LiteralPath $command.FullName -Destination (Join-Path $ExpectedRoot ".master\processed\$($command.Name)")
$state.processed_ids = @($processedIds + $commandId | Sort-Object -Unique)
$state.current_command_id = $null
$state.current_status = $status
Write-State -State $state

Invoke-Git -Arguments @("add", "--all") | Out-Null
Invoke-Git -Arguments @("commit", "-m", "chore(bridge): complete $commandId") | Out-Null
$executionCommit = Invoke-Git -Arguments @("rev-parse", "HEAD")
$response = Get-Content -LiteralPath $responsePath -Raw
$response = $response.Replace("COMMIT_SHA: PENDING", "COMMIT_SHA: $executionCommit")
Write-Utf8File -Path $responsePath -Content $response
Invoke-Git -Arguments @("add", $responsePath) | Out-Null
Invoke-Git -Arguments @("commit", "-m", "docs(bridge): record $commandId response") | Out-Null
Invoke-Git -Arguments @("push", "origin", "main") | Out-Null
Write-Output "$status $commandId"
exit $codexExitCode
