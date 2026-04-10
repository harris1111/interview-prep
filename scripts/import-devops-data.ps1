#!/usr/bin/env pwsh
# Import DevOps Engineer data: career, topics, scenario, CV, question bank, study guides
# Usage: .\scripts\import-devops-data.ps1

$ErrorActionPreference = "Stop"
$API = "http://localhost:4000/api"
$SRC = "E:\backup-mac\Archive\Volumes\Data\Archive\Documents\Orochi\Archive\Orochi\plans\reports"

# 1. Login as admin
Write-Host "`n=== Step 1: Logging in as admin ===" -ForegroundColor Cyan
$loginResp = Invoke-RestMethod -Uri "$API/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@admin.com","password":"admin"}'
$token = $loginResp.accessToken
$headers = @{ Authorization = "Bearer $token" }
Write-Host "Logged in successfully"

# 2. Create Career: DevOps Engineer
Write-Host "`n=== Step 2: Creating DevOps Engineer career ===" -ForegroundColor Cyan
$careerBody = @{
    name        = "DevOps Engineer"
    description = "Infrastructure, CI/CD, Kubernetes, Terraform, Linux, Cloud (GCP), Monitoring, Docker, Security"
} | ConvertTo-Json
$career = Invoke-RestMethod -Uri "$API/admin/careers" -Method POST -ContentType "application/json" -Headers $headers -Body $careerBody
$careerId = $career.id
Write-Host "Career created: $($career.name) (ID: $careerId)"

# 3. Create Topics matching question bank H2 headings
Write-Host "`n=== Step 3: Creating topics ===" -ForegroundColor Cyan
$topicNames = @(
    "1. Kubernetes Questions",
    "2. Terraform / IaC Questions",
    "3. CI/CD Questions",
    "4. Linux & Troubleshooting Questions",
    "5. Networking Questions",
    "6. Monitoring & Observability Questions",
    "7. GCP Questions",
    "8. Docker Questions",
    "9. Security Questions",
    "10. On-Premise / Proxmox Questions",
    "11. Cost Optimization Questions",
    "12. Behavioral / STAR Questions",
    "13. Scenario-Based Questions",
    "14. Self-Assessment & Company Fit Questions"
)

$topicIds = @{}
$sortOrder = 1
foreach ($name in $topicNames) {
    $topicBody = @{
        careerId    = $careerId
        name        = $name
        description = ($name -replace '^\d+\.\s+', '' -replace '\s+Questions$', '')
        sortOrder   = $sortOrder
    } | ConvertTo-Json
    $topic = Invoke-RestMethod -Uri "$API/admin/topics" -Method POST -ContentType "application/json" -Headers $headers -Body $topicBody
    $topicIds[$name] = $topic.id
    Write-Host "  Topic created: $($topic.name)"
    $sortOrder++
}

# 4. Create Scenario Template: DevOps Engineer Interview (5 rounds)
Write-Host "`n=== Step 4: Creating interview scenario ===" -ForegroundColor Cyan
$scenarioBody = @{
    name        = "DevOps Engineer Full Interview"
    careerId    = $careerId
    description = "Comprehensive 5-round DevOps Engineer interview covering technical knowledge, troubleshooting, and behavioral skills."
    rounds      = @(
        @{
            roundNumber    = 1
            name           = "Kubernetes & Docker"
            description    = "Core containerization and orchestration knowledge"
            topicIds       = @($topicIds["1. Kubernetes Questions"], $topicIds["8. Docker Questions"])
            durationMinutes = 30
            questionCount  = 6
            difficulty     = "MEDIUM"
        },
        @{
            roundNumber    = 2
            name           = "CI/CD & IaC"
            description    = "Continuous integration, deployment pipelines, and Infrastructure as Code"
            topicIds       = @($topicIds["3. CI/CD Questions"], $topicIds["2. Terraform / IaC Questions"])
            durationMinutes = 25
            questionCount  = 5
            difficulty     = "MEDIUM"
        },
        @{
            roundNumber    = 3
            name           = "Linux, Networking & Security"
            description    = "System administration, networking fundamentals, and security practices"
            topicIds       = @($topicIds["4. Linux & Troubleshooting Questions"], $topicIds["5. Networking Questions"], $topicIds["9. Security Questions"])
            durationMinutes = 30
            questionCount  = 6
            difficulty     = "HARD"
        },
        @{
            roundNumber    = 4
            name           = "Cloud & Monitoring"
            description    = "GCP services, monitoring, observability, and cost optimization"
            topicIds       = @($topicIds["7. GCP Questions"], $topicIds["6. Monitoring & Observability Questions"], $topicIds["11. Cost Optimization Questions"])
            durationMinutes = 25
            questionCount  = 5
            difficulty     = "MEDIUM"
        },
        @{
            roundNumber    = 5
            name           = "Behavioral & Scenario"
            description    = "Behavioral questions, scenario-based problems, and cultural fit"
            topicIds       = @($topicIds["12. Behavioral / STAR Questions"], $topicIds["13. Scenario-Based Questions"], $topicIds["14. Self-Assessment & Company Fit Questions"])
            durationMinutes = 20
            questionCount  = 4
            difficulty     = "MEDIUM"
        }
    )
} | ConvertTo-Json -Depth 5
$scenario = Invoke-RestMethod -Uri "$API/admin/scenarios" -Method POST -ContentType "application/json" -Headers $headers -Body $scenarioBody
Write-Host "Scenario created: $($scenario.name) with $($scenario.rounds.Count) rounds"

# 5. Upload CV
Write-Host "`n=== Step 5: Uploading CV ===" -ForegroundColor Cyan
$cvPath = "$SRC\Nguyen-Minh-An-DevOps-Engineer-CV.pdf"
if (Test-Path $cvPath) {
    $boundary = [System.Guid]::NewGuid().ToString()
    $fileBytes = [System.IO.File]::ReadAllBytes($cvPath)
    $fileName = [System.IO.Path]::GetFileName($cvPath)

    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
        "Content-Type: application/pdf",
        "",
        ""
    )

    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes(($bodyLines -join "`r`n"))
    $footerBytes = [System.Text.Encoding]::UTF8.GetBytes("`r`n--$boundary--`r`n")

    $body = New-Object byte[] ($headerBytes.Length + $fileBytes.Length + $footerBytes.Length)
    [System.Buffer]::BlockCopy($headerBytes, 0, $body, 0, $headerBytes.Length)
    [System.Buffer]::BlockCopy($fileBytes, 0, $body, $headerBytes.Length, $fileBytes.Length)
    [System.Buffer]::BlockCopy($footerBytes, 0, $body, ($headerBytes.Length + $fileBytes.Length), $footerBytes.Length)

    $cvResp = Invoke-RestMethod -Uri "$API/cv/upload?careerId=$careerId" -Method POST -Headers $headers -ContentType "multipart/form-data; boundary=$boundary" -Body $body
    Write-Host "CV uploaded: $($cvResp.fileName) (Analysis status: $($cvResp.analysis.status))"
} else {
    Write-Host "CV file not found at $cvPath, skipping..." -ForegroundColor Yellow
}

# 6. Import question bank + study guides via knowledge import
Write-Host "`n=== Step 6: Importing knowledge base files ===" -ForegroundColor Cyan

$importFiles = @(
    "$SRC\Interview-Prep\general\devops-interview-questions-bank.md",
    "$SRC\Reference-Materials\study-01-kubernetes-deep-dive.md",
    "$SRC\Reference-Materials\study-02-terraform-iac.md",
    "$SRC\Reference-Materials\study-03-linux-troubleshooting.md",
    "$SRC\Reference-Materials\study-04-networking.md",
    "$SRC\Reference-Materials\study-05-cicd-github-actions.md",
    "$SRC\Reference-Materials\study-06-docker.md",
    "$SRC\Reference-Materials\study-07-monitoring-observability.md",
    "$SRC\Reference-Materials\study-08-gcp.md",
    "$SRC\Reference-Materials\study-09-git.md",
    "$SRC\Reference-Materials\study-10-security.md",
    "$SRC\Reference-Materials\study-11-database-operations.md",
    "$SRC\Reference-Materials\study-12-proxmox.md",
    "$SRC\Reference-Materials\study-13-incident-management.md",
    "$SRC\Reference-Materials\devops-cheatsheet-comprehensive.md",
    "$SRC\Reference-Materials\interview-scenario-practice.md"
)

# Build multipart form data for file upload
$boundary = [System.Guid]::NewGuid().ToString()
$bodyStream = New-Object System.IO.MemoryStream

foreach ($filePath in $importFiles) {
    if (!(Test-Path $filePath)) {
        Write-Host "  SKIP: $([System.IO.Path]::GetFileName($filePath)) (not found)" -ForegroundColor Yellow
        continue
    }
    $fileName = [System.IO.Path]::GetFileName($filePath)
    $fileContent = [System.IO.File]::ReadAllBytes($filePath)

    $partHeader = "--$boundary`r`nContent-Disposition: form-data; name=`"files`"; filename=`"$fileName`"`r`nContent-Type: text/markdown`r`n`r`n"
    $partHeaderBytes = [System.Text.Encoding]::UTF8.GetBytes($partHeader)
    $partFooterBytes = [System.Text.Encoding]::UTF8.GetBytes("`r`n")

    $bodyStream.Write($partHeaderBytes, 0, $partHeaderBytes.Length)
    $bodyStream.Write($fileContent, 0, $fileContent.Length)
    $bodyStream.Write($partFooterBytes, 0, $partFooterBytes.Length)

    Write-Host "  Added: $fileName ($([math]::Round($fileContent.Length/1024, 1)) KB)"
}

$endBoundary = [System.Text.Encoding]::UTF8.GetBytes("--$boundary--`r`n")
$bodyStream.Write($endBoundary, 0, $endBoundary.Length)
$bodyBytes = $bodyStream.ToArray()
$bodyStream.Dispose()

Write-Host "`n  Uploading files to knowledge import endpoint..."
$importResp = Invoke-RestMethod -Uri "$API/admin/knowledge/import" -Method POST -Headers $headers -ContentType "multipart/form-data; boundary=$boundary" -Body $bodyBytes
Write-Host "`n  Import Results:" -ForegroundColor Green
Write-Host "    Files processed:        $($importResp.filesProcessed)"
Write-Host "    Questions imported:      $($importResp.questionsImported)"
Write-Host "    Knowledge entries:       $($importResp.knowledgeEntriesCreated)"
if ($importResp.errors -and $importResp.errors.Count -gt 0) {
    Write-Host "    Errors:" -ForegroundColor Yellow
    foreach ($err in $importResp.errors) {
        Write-Host "      - $err" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Import Complete! ===" -ForegroundColor Green
Write-Host "Summary:"
Write-Host "  Career:   DevOps Engineer"
Write-Host "  Topics:   $($topicNames.Count)"
Write-Host "  Scenario: DevOps Engineer Full Interview (5 rounds)"
Write-Host "  CV:       Nguyen-Minh-An-DevOps-Engineer-CV.pdf"
Write-Host "  Questions + Knowledge entries imported from $($importFiles.Count) files"
Write-Host "`nYou can now:"
Write-Host "  1. Go to http://localhost:3000 and login"
Write-Host "  2. Upload your CV (or it's already uploaded)"
Write-Host "  3. Start an interview session with the DevOps Engineer scenario"
Write-Host ""
