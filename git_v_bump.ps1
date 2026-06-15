# Usage Pattern

    # .\bump_version.ps1 -Part patch
    # .\bump_version.ps1 -Part minor
    # .\bump_version.ps1 -Part major

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("major", "minor", "patch")]
    [string]$Part
)

$tag = git describe --tags --abbrev=0 2>$null
if (-not $tag) {
    $tag = "v0.0.0"
}
$tag = $tag.TrimStart("v")

$parts = $tag.Split(".")
[int]$major = $parts[0]
[int]$minor = $parts[1]
[int]$patch = $parts[2]

switch ($Part) {
    "major" {
        $major++
        $minor = 0
        $patch = 0
    }
    "minor" {
        $minor++
        $patch = 0
    }
    "patch" {
        $patch++
    }
}

$newTag = "v{0}.{1}.{2}" -f $major,$minor,$patch
git tag -a $newTag -m "Bump $Part -> $newTag"
Write-Output "Created tag $newTag"